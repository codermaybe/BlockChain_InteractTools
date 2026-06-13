import { useState } from "react";
import { Input, InputNumber, Radio, Typography, message } from "antd";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useSolanaCluster } from "../../../hooks/useSolanaCluster.js";
import { useStagedTask } from "../../../hooks/useStagedTask.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import { createSolanaConnection, probeSolanaConnection } from "../../../services/solana/providerFactory";
import {
  resolveMintMeta,
  resolveSolBalance,
  resolveSplBalance,
  toPublicKey,
} from "../../../services/solana/balanceService";
import { downloadCsv, parseLineItems } from "../../../utils/taskRunner";
import BatchTaskWorkbench from "../../shared/BatchTaskWorkbench.jsx";
import ChainRpcSelector from "../../shared/ChainRpcSelector.jsx";

const { Text } = Typography;

export default function SolanaBalanceChecker() {
  const cluster = useSolanaCluster();
  const { addLog } = useTaskLog();

  const [mode, setMode] = useState("sol");
  const [mintAddress, setMintAddress] = useState("");
  const [addressesText, setAddressesText] = useState("");
  const [concurrency, setConcurrency] = useState(8);

  const task = useStagedTask({
    parsePreview: (input) => {
      const items = parseLineItems(input).map((address, idx) => ({
        task: address,
        address,
        index: idx + 1,
        valid: !!toPublicKey(address),
      }));
      const valid = items.filter((item) => item.valid).length;
      return { total: items.length, valid, invalid: items.length - valid, items };
    },
    runCheck: async () => {
      let mintPublicKey = null;
      if (mode === "spl") {
        mintPublicKey = toPublicKey(mintAddress);
        if (!mintPublicKey) {
          throw new Error("请输入有效 SPL Mint 地址");
        }
      }
      const { connection, rpcUrl, cluster: clusterInfo } = createSolanaConnection(
        cluster.clusterKey,
        cluster.rpc,
        true
      );
      const probe = await probeSolanaConnection(connection);
      let mintMeta = null;
      if (mode === "spl") {
        mintMeta = await resolveMintMeta(connection, mintPublicKey);
      }
      return {
        slot: probe.slot,
        blockhash: probe.blockhash,
        rpcUrl,
        cluster: clusterInfo.cluster,
        clusterName: clusterInfo.name,
        mintMeta,
      };
    },
    buildWorker: (ctx) => {
      const { connection, mintPublicKey, tokenDecimals, tokenSymbol } = ctx;
      return async (item) => {
        if (!item.valid) {
          throw new Error("地址格式无效");
        }
        const ownerPublicKey = toPublicKey(item.address);
        if (ctx.mode === "sol") {
          const { lamports, formatted } = await resolveSolBalance(connection, ownerPublicKey);
          return { text: `${formatted} SOL`, data: { extra: `${lamports} lamports` } };
        }
        const tokenBalance = await resolveSplBalance(connection, ownerPublicKey, mintPublicKey, tokenDecimals);
        return {
          text: `${tokenBalance.formatted} ${tokenSymbol}`,
          data: { extra: `${tokenBalance.accountCount} 个账户` },
        };
      };
    },
    defaultConcurrency: 8,
  });

  const buildSnapshot = () => ({
    clusterKey: cluster.clusterKey,
    rpc: cluster.rpc,
    mode,
    mintAddress,
    addressesText,
    concurrency,
  });

  const handlePreview = async () => {
    if (!parseLineItems(addressesText).length) {
      message.warning("请至少输入一个地址");
      return;
    }
    const data = await task.preview(addressesText);
    task.saveVersion(buildSnapshot(), { label: "预览" });
    task.pushArtifact({
      title: "Solana 地址预览完成",
      type: "Preview",
      color: "blue",
      summary: `共 ${data.total} 条地址，合法 ${data.valid} 条，非法 ${data.invalid} 条。`,
      stats: { total: data.total, valid: data.valid, invalid: data.invalid },
    });
  };

  const handleRunCheck = async () => {
    if (!task.previewData?.total) {
      message.warning("请先输入地址");
      return;
    }
    try {
      const data = await task.runCheck();
      task.saveVersion(buildSnapshot(), { label: "运行检查" });
      task.pushArtifact({
        title: "Solana 运行检查通过",
        type: "Run",
        color: "gold",
        summary: `网络 ${data.clusterName}，slot ${data.slot}，可开始执行查询。`,
        stats: data.mintMeta
          ? { mode: "SPL", decimals: data.mintMeta.decimals, program: data.mintMeta.programType }
          : { mode: "SOL" },
      });
      addLog({
        level: "success",
        category: LOG_CATEGORY.SOLANA_BALANCE,
        message: "Solana 余额查询 Run 检查通过",
        meta: { clusterKey: cluster.clusterKey, mode },
      });
      message.success("运行检查通过，可执行查询");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.SOLANA_BALANCE,
        message: "Solana 余额查询 Run 检查失败",
        meta: { clusterKey: cluster.clusterKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "运行检查失败");
    }
  };

  const handleApply = async () => {
    try {
      const items = task.previewData?.items ?? [];
      const { connection } = createSolanaConnection(cluster.clusterKey, cluster.rpc, true);

      let mintPublicKey = null;
      let tokenDecimals = 0;
      let tokenSymbol = "SPL";
      if (mode === "spl") {
        mintPublicKey = toPublicKey(mintAddress);
        if (!mintPublicKey) {
          message.error("请输入有效 SPL Mint 地址");
          return;
        }
        const mintMeta = await resolveMintMeta(connection, mintPublicKey);
        tokenDecimals = mintMeta.decimals;
        tokenSymbol = `SPL(${mintMeta.programType})`;
      }

      const result = await task.apply(
        { items, mode, connection, mintPublicKey, tokenDecimals, tokenSymbol },
        concurrency
      );

      task.saveVersion(buildSnapshot(), { label: "执行" });
      task.pushArtifact({
        title: "Solana 批量余额查询完成",
        type: "Apply",
        color: result.failed ? "orange" : "green",
        summary: result.failed
          ? `执行完成，成功 ${result.success} 条，失败 ${result.failed} 条。`
          : `执行完成，全部 ${result.success} 条成功。`,
        stats: { total: result.total, success: result.success, failed: result.failed },
      });
      addLog({
        level: result.failed ? "warning" : "success",
        category: LOG_CATEGORY.SOLANA_BALANCE,
        message: "Solana 批量余额 Apply 执行完成",
        meta: { clusterKey: cluster.clusterKey, mode, success: result.success, failed: result.failed },
      });
      message.success("查询执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.SOLANA_BALANCE,
        message: "Solana 批量余额 Apply 执行失败",
        meta: { clusterKey: cluster.clusterKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询执行失败");
    }
  };

  const handleRestore = (snapshot) => {
    if (!snapshot) {
      return;
    }
    cluster.setClusterKey(snapshot.clusterKey);
    cluster.setRpc(snapshot.rpc || "");
    setMode(snapshot.mode);
    setMintAddress(snapshot.mintAddress);
    setAddressesText(snapshot.addressesText);
    setConcurrency(snapshot.concurrency);
    message.success("已恢复历史版本配置");
  };

  const handleExport = () => {
    if (!task.rows.length) {
      message.warning("没有可导出的结果");
      return;
    }
    downloadCsv("solana-balance-results.csv", [
      ["index", "address", "status", "result", "extra", "error"],
      ...task.rows.map((row) => [row.index, row.task, row.status, row.output, row.extra || "", row.error]),
    ]);
  };

  const configSlot = (
    <>
      <p className="m-0 text-xs text-slate-400">流程：预览 → 运行检查 → 执行查询</p>
      <ChainRpcSelector
        chainKey={cluster.clusterKey}
        rpc={cluster.rpc}
        chainOptions={cluster.clusterOptions}
        onChangeChain={cluster.onChangeCluster}
        onChangeRpc={cluster.onChangeRpc}
        chainLabel="网络"
      />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Text strong>资产类型</Text>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
            <Radio.Button value="sol">SOL</Radio.Button>
            <Radio.Button value="spl">SPL</Radio.Button>
          </Radio.Group>
        </div>
        <div className="space-y-2">
          <Text strong>并发数</Text>
          <InputNumber
            className="!w-full"
            min={1}
            max={20}
            value={concurrency}
            onChange={(value) => setConcurrency(value || 1)}
          />
        </div>
        {mode === "spl" && (
          <div className="space-y-2 md:col-span-3">
            <Text strong>SPL Mint 地址</Text>
            <Input
              value={mintAddress}
              onChange={(e) => setMintAddress(e.target.value)}
              placeholder="例如: So11111111111111111111111111111111111111112"
            />
          </div>
        )}
      </div>
      <Input.TextArea
        rows={6}
        value={addressesText}
        onChange={(e) => setAddressesText(e.target.value)}
        placeholder="每行一个 Solana 地址"
      />
    </>
  );

  return (
    <BatchTaskWorkbench
      task={task}
      title="Solana 余额查询"
      previewText="预览输入"
      runText="运行检查"
      applyText="执行查询"
      onPreview={handlePreview}
      onRun={handleRunCheck}
      onApply={handleApply}
      onRestore={handleRestore}
      onExport={handleExport}
      configSlot={configSlot}
      extraColumns={[{ title: "补充信息", dataIndex: "extra", key: "extra", width: 160, ellipsis: true }]}
    />
  );
}
