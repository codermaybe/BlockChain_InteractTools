import { useState } from "react";
import { Input, InputNumber, Radio, Typography, message } from "antd";
import { ethers } from "ethers";
import { ERC20_MIN_ABI } from "../../../config/abis";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useChainRpc } from "../../../hooks/useChainRpc.js";
import { useStagedTask } from "../../../hooks/useStagedTask.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { getReadContract } from "../../../services/evm/contractService";
import { downloadCsv, parseLineItems } from "../../../utils/taskRunner";
import BatchTaskWorkbench from "../../shared/BatchTaskWorkbench.jsx";
import ChainRpcSelector from "../../shared/ChainRpcSelector.jsx";

const { Text } = Typography;

export default function BatchBalanceChecker() {
  const chain = useChainRpc();
  const { addLog } = useTaskLog();

  const [mode, setMode] = useState("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [addressesText, setAddressesText] = useState("");
  const [concurrency, setConcurrency] = useState(8);

  const task = useStagedTask({
    parsePreview: (input) => {
      const items = parseLineItems(input).map((address, idx) => ({
        task: address,
        address,
        index: idx + 1,
        valid: ethers.isAddress(address),
      }));
      const valid = items.filter((item) => item.valid).length;
      return { total: items.length, valid, invalid: items.length - valid, items };
    },
    runCheck: async () => {
      const { provider, rpcUrl } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      const probe = await probeProvider(provider);
      let tokenMeta = null;
      if (mode === "erc20") {
        const tokenContract = getReadContract(chain.chainKey, tokenAddress, ERC20_MIN_ABI, chain.rpc);
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => "ERC20"),
          tokenContract.decimals().catch(() => 18),
        ]);
        tokenMeta = { symbol, decimals: Number(decimals) };
      }
      return { chainId: probe.chainId, blockNumber: probe.blockNumber, rpcUrl, tokenMeta };
    },
    buildWorker: (ctx) => {
      const { provider, tokenContract, tokenSymbol, tokenDecimals, chainSymbol } = ctx;
      return async (item) => {
        if (!item.valid) {
          throw new Error("地址格式无效");
        }
        if (ctx.mode === "native") {
          const raw = await provider.getBalance(item.address);
          return `${ethers.formatEther(raw)} ${chainSymbol}`;
        }
        const raw = await tokenContract.balanceOf(item.address);
        return `${ethers.formatUnits(raw, tokenDecimals)} ${tokenSymbol}`;
      };
    },
    defaultConcurrency: 8,
  });

  const buildSnapshot = () => ({
    chainKey: chain.chainKey,
    rpc: chain.rpc,
    mode,
    tokenAddress,
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
      title: "地址预览完成",
      type: "Preview",
      color: "blue",
      summary: `共 ${data.total} 条地址，合法 ${data.valid} 条，非法 ${data.invalid} 条。`,
      stats: { total: data.total, valid: data.valid, invalid: data.invalid },
    });
    addLog({
      level: "info",
      category: LOG_CATEGORY.BATCH_BALANCE,
      message: "完成批量余额地址预览",
      meta: { chainKey: chain.chainKey, total: data.total, valid: data.valid },
    });
  };

  const handleRunCheck = async () => {
    if (!task.previewData?.total) {
      message.warning("请先输入地址");
      return;
    }
    if (mode === "erc20" && !ethers.isAddress(tokenAddress)) {
      message.error("请输入有效 ERC20 合约地址");
      return;
    }
    try {
      const data = await task.runCheck();
      task.saveVersion(buildSnapshot(), { label: "运行检查" });
      task.pushArtifact({
        title: "执行前检查完成",
        type: "Run",
        color: "gold",
        summary: `链 ID ${data.chainId}，区块 ${data.blockNumber}，可开始执行查询。`,
        stats: data.tokenMeta
          ? { token: data.tokenMeta.symbol, decimals: data.tokenMeta.decimals }
          : { mode: "native" },
      });
      addLog({
        level: "success",
        category: LOG_CATEGORY.BATCH_BALANCE,
        message: "批量余额 Run 检查通过",
        meta: { chainKey: chain.chainKey, chainId: data.chainId },
      });
      message.success("运行检查通过，可执行查询");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.BATCH_BALANCE,
        message: "批量余额 Run 检查失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "运行检查失败");
    }
  };

  const handleApply = async () => {
    try {
      const items = task.previewData?.items ?? [];
      const { provider, chain: chainInfo } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);

      let tokenContract = null;
      let tokenSymbol = chainInfo.symbol;
      let tokenDecimals = 18;
      if (mode === "erc20") {
        tokenContract = getReadContract(chain.chainKey, tokenAddress, ERC20_MIN_ABI, chain.rpc);
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => "ERC20"),
          tokenContract.decimals().catch(() => 18),
        ]);
        tokenSymbol = symbol;
        tokenDecimals = Number(decimals);
      }

      const result = await task.apply(
        { items, mode, provider, tokenContract, tokenSymbol, tokenDecimals, chainSymbol: chainInfo.symbol },
        concurrency
      );

      task.saveVersion(buildSnapshot(), { label: "执行" });
      task.pushArtifact({
        title: "批量余额查询完成",
        type: "Apply",
        color: result.failed ? "orange" : "green",
        summary: result.failed
          ? `执行完成，成功 ${result.success} 条，失败 ${result.failed} 条。`
          : `执行完成，全部 ${result.success} 条成功。`,
        stats: { total: result.total, success: result.success, failed: result.failed },
      });
      addLog({
        level: result.failed ? "warning" : "success",
        category: LOG_CATEGORY.BATCH_BALANCE,
        message: "批量余额 Apply 执行完成",
        meta: { chainKey: chain.chainKey, success: result.success, failed: result.failed },
      });
      message.success("查询执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.BATCH_BALANCE,
        message: "批量余额 Apply 执行失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询执行失败");
    }
  };

  const handleRestore = (snapshot) => {
    if (!snapshot) {
      return;
    }
    chain.setChainKey(snapshot.chainKey);
    chain.setRpc(snapshot.rpc || "");
    setMode(snapshot.mode);
    setTokenAddress(snapshot.tokenAddress);
    setAddressesText(snapshot.addressesText);
    setConcurrency(snapshot.concurrency);
    message.success("已恢复历史版本配置");
  };

  const handleExport = () => {
    if (!task.rows.length) {
      message.warning("没有可导出的结果");
      return;
    }
    downloadCsv("batch-balance-results.csv", [
      ["index", "address", "status", "result", "error"],
      ...task.rows.map((row) => [row.index, row.task, row.status, row.output, row.error]),
    ]);
  };

  const configSlot = (
    <>
      <p className="m-0 text-xs text-slate-400">流程：预览 → 运行检查 → 执行查询</p>
      <ChainRpcSelector {...chain} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Text strong>资产类型</Text>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} optionType="button">
            <Radio.Button value="native">原生币</Radio.Button>
            <Radio.Button value="erc20">ERC20</Radio.Button>
          </Radio.Group>
        </div>
        <div className="space-y-2">
          <Text strong>并发数</Text>
          <InputNumber
            className="!w-full"
            min={1}
            max={30}
            value={concurrency}
            onChange={(value) => setConcurrency(value || 1)}
          />
        </div>
        {mode === "erc20" && (
          <div className="space-y-2 md:col-span-3">
            <Text strong>ERC20 地址</Text>
            <Input value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
          </div>
        )}
      </div>
      <Input.TextArea
        rows={6}
        value={addressesText}
        onChange={(e) => setAddressesText(e.target.value)}
        placeholder="每行一个钱包地址"
      />
    </>
  );

  return (
    <BatchTaskWorkbench
      task={task}
      title="批量余额查询"
      previewText="预览输入"
      runText="运行检查"
      applyText="执行查询"
      onPreview={handlePreview}
      onRun={handleRunCheck}
      onApply={handleApply}
      onRestore={handleRestore}
      onExport={handleExport}
      configSlot={configSlot}
    />
  );
}
