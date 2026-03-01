import React, { useMemo, useState } from "react";
import {
  Button,
  Card,
  Input,
  InputNumber,
  Progress,
  Radio,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { PublicKey } from "@solana/web3.js";
import TaskResultTable from "../shared/TaskResultTable";
import StageActionBar from "../shared/StageActionBar";
import TaskArtifactCard from "../shared/TaskArtifactCard";
import { getSolanaClusterOptions } from "../../config/chainRegistry";
import {
  createSolanaConnection,
  probeSolanaConnection,
} from "../../services/solana/providerFactory";
import {
  downloadCsv,
  parseLineItems,
  runTaskQueue,
} from "../../utils/taskRunner";
import { useAppSettings } from "../../state/AppSettingsContext";
import { useTaskLog } from "../../state/TaskLogContext";

const { Text } = Typography;

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toPublicKey(address) {
  try {
    return new PublicKey((address || "").trim());
  } catch {
    return null;
  }
}

function formatAmount(rawValue, decimals) {
  const raw = BigInt(rawValue || 0);
  const precision = Math.max(0, Number(decimals) || 0);
  if (precision === 0) {
    return raw.toString();
  }

  const base = 10n ** BigInt(precision);
  const integer = raw / base;
  const fraction = raw % base;
  const padded = fraction.toString().padStart(precision, "0").replace(/0+$/, "");
  return padded ? `${integer.toString()}.${padded}` : integer.toString();
}

async function resolveMintMeta(connection, mintPublicKey) {
  const accountInfo = await connection.getParsedAccountInfo(
    mintPublicKey,
    "confirmed"
  );
  const data = accountInfo?.value?.data;
  const parsed = data && typeof data === "object" ? data.parsed : null;
  if (!parsed || parsed.type !== "mint") {
    throw new Error("Mint 信息读取失败，请确认地址是否正确");
  }

  const ownerProgram = accountInfo.value.owner?.toBase58?.() || "";
  const programType =
    ownerProgram === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
      ? "TOKEN_2022"
      : "TOKEN";

  return {
    decimals: Number(parsed.info?.decimals || 0),
    programType,
  };
}

async function resolveSplBalance(connection, ownerPublicKey, mintPublicKey, decimals) {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    ownerPublicKey,
    { mint: mintPublicKey },
    "confirmed"
  );
  const accounts = tokenAccounts?.value || [];

  let rawTotal = 0n;
  for (const account of accounts) {
    const raw = account?.account?.data?.parsed?.info?.tokenAmount?.amount || "0";
    rawTotal += BigInt(raw);
  }

  return {
    accountCount: accounts.length,
    rawTotal,
    formatted: formatAmount(rawTotal, decimals),
  };
}

export default function SolanaBalanceChecker() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();

  const [clusterKey, setClusterKey] = useState(settings.preferredSolanaClusterKey);
  const [customRpc, setCustomRpc] = useState(
    settings.getSolanaRpcOverride(settings.preferredSolanaClusterKey)
  );
  const [mode, setMode] = useState("sol");
  const [mintAddress, setMintAddress] = useState("");
  const [addressesText, setAddressesText] = useState("");
  const [concurrency, setConcurrency] = useState(8);
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [summary, setSummary] = useState({ success: 0, failed: 0, total: 0 });
  const [stage, setStage] = useState("draft");
  const [loadingStage, setLoadingStage] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [runCheckData, setRunCheckData] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");

  const clusterOptions = useMemo(() => getSolanaClusterOptions(), []);

  const createConfigSnapshot = () => ({
    clusterKey,
    customRpc,
    mode,
    mintAddress,
    addressesText,
    concurrency,
  });

  const saveVersion = (label) => {
    const snapshot = {
      id: createId(),
      label,
      createdAt: Date.now(),
      config: createConfigSnapshot(),
    };
    setVersions((prev) => [snapshot, ...prev].slice(0, 12));
    return snapshot;
  };

  const restoreVersion = () => {
    const target = versions.find((item) => item.id === selectedVersion);
    if (!target) return;

    setClusterKey(target.config.clusterKey);
    settings.setPreferredSolanaClusterKey(target.config.clusterKey);
    setCustomRpc(target.config.customRpc);
    settings.setSolanaRpcOverride(target.config.clusterKey, target.config.customRpc);
    setMode(target.config.mode);
    setMintAddress(target.config.mintAddress);
    setAddressesText(target.config.addressesText);
    setConcurrency(target.config.concurrency);
    message.success("已恢复历史版本配置");
  };

  const pushArtifact = (artifact) => {
    setArtifacts((prev) => [{ id: createId(), createdAt: Date.now(), ...artifact }, ...prev].slice(0, 8));
  };

  const parsePreview = () => {
    const addresses = parseLineItems(addressesText);
    const validRows = [];
    const invalidRows = [];

    addresses.forEach((address, index) => {
      const row = { index: index + 1, address };
      if (toPublicKey(address)) {
        validRows.push(row);
      } else {
        invalidRows.push({ ...row, reason: "地址格式无效" });
      }
    });

    return {
      total: addresses.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      validRows,
      invalidRows,
    };
  };

  const handlePreview = () => {
    setLoadingStage("preview");
    try {
      const preview = parsePreview();
      if (!preview.total) {
        message.warning("请至少输入一个地址");
        return;
      }
      setPreviewData(preview);
      setStage("previewed");
      saveVersion("Preview");
      pushArtifact({
        title: "Solana 地址预览完成",
        type: "Preview",
        color: "blue",
        summary: `共 ${preview.total} 条地址，合法 ${preview.valid} 条，非法 ${preview.invalid} 条。`,
        stats: { total: preview.total, valid: preview.valid, invalid: preview.invalid },
      });
    } finally {
      setLoadingStage("");
    }
  };

  const handleRunCheck = async () => {
    setLoadingStage("run");
    try {
      const preview = previewData || parsePreview();
      if (!preview.total) {
        message.warning("请先输入地址");
        return;
      }

      let mintMeta = null;
      let mintPublicKey = null;
      if (mode === "spl") {
        mintPublicKey = toPublicKey(mintAddress);
        if (!mintPublicKey) {
          message.error("请输入有效 SPL Mint 地址");
          return;
        }
      }

      const { connection, rpcUrl, cluster } = createSolanaConnection(
        clusterKey,
        customRpc,
        true
      );
      const probe = await probeSolanaConnection(connection);

      if (mode === "spl") {
        mintMeta = await resolveMintMeta(connection, mintPublicKey);
      }

      const data = {
        slot: probe.slot,
        blockhash: probe.blockhash,
        rpcUrl,
        cluster: cluster.cluster,
        mintMeta,
      };
      setRunCheckData(data);
      setStage("checked");
      saveVersion("Run Check");
      pushArtifact({
        title: "Solana 运行检查通过",
        type: "Run",
        color: "gold",
        summary: `网络 ${cluster.name}，slot ${probe.slot}，可开始执行查询。`,
        stats: mintMeta
          ? { mode: "SPL", decimals: mintMeta.decimals, program: mintMeta.programType }
          : { mode: "SOL" },
      });
      addLog({
        level: "success",
        category: "solana-balance",
        message: "Solana 余额查询 Run 检查通过",
        meta: { clusterKey, mode },
      });
      message.success("运行检查通过，可执行查询");
    } catch (error) {
      addLog({
        level: "error",
        category: "solana-balance",
        message: "Solana 余额查询 Run 检查失败",
        meta: { clusterKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "运行检查失败");
    } finally {
      setLoadingStage("");
    }
  };

  const handleApply = async () => {
    if (stage !== "checked") {
      message.warning("请先执行 Preview 和 Run");
      return;
    }

    setLoadingStage("apply");
    setRows([]);
    try {
      const preview = previewData || parsePreview();
      const { connection } = createSolanaConnection(clusterKey, customRpc, true);

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

      const invalidRows = preview.invalidRows.map((item) => ({
        id: `invalid-${item.index}`,
        index: item.index,
        task: item.address,
        status: "failed",
        output: "",
        error: item.reason,
        extra: "",
      }));

      setProgress({ completed: 0, total: preview.validRows.length });
      const result = await runTaskQueue({
        items: preview.validRows,
        concurrency,
        onProgress: ({ completed, total }) => setProgress({ completed, total }),
        worker: async (item) => {
          const ownerPublicKey = new PublicKey(item.address);
          if (mode === "sol") {
            const lamports = await connection.getBalance(ownerPublicKey, "confirmed");
            return {
              value: formatAmount(BigInt(lamports), 9),
              symbol: "SOL",
              extra: `${lamports} lamports`,
            };
          }

          const tokenBalance = await resolveSplBalance(
            connection,
            ownerPublicKey,
            mintPublicKey,
            tokenDecimals
          );
          return {
            value: tokenBalance.formatted,
            symbol: tokenSymbol,
            extra: `${tokenBalance.accountCount} 个账户`,
          };
        },
      });

      const validRows = result.results.map((taskResult, idx) => {
        const source = preview.validRows[idx];
        return {
          id: `valid-${source.index}-${idx}`,
          index: source.index,
          task: source.address,
          status: taskResult.status,
          output:
            taskResult.status === "success"
              ? `${taskResult.output.value} ${taskResult.output.symbol}`
              : "",
          error: taskResult.error,
          extra: taskResult.status === "success" ? taskResult.output.extra : "",
        };
      });

      const merged = [...invalidRows, ...validRows].sort((a, b) => a.index - b.index);
      setRows(merged);

      const successCount = merged.filter((item) => item.status === "success").length;
      const failedCount = merged.filter((item) => item.status === "failed").length;
      setSummary({ total: merged.length, success: successCount, failed: failedCount });
      setStage("applied");
      saveVersion("Apply");
      pushArtifact({
        title: "Solana 批量余额查询完成",
        type: "Apply",
        color: failedCount ? "orange" : "green",
        summary: failedCount
          ? `执行完成，成功 ${successCount} 条，失败 ${failedCount} 条。`
          : `执行完成，全部 ${successCount} 条成功。`,
        stats: { total: merged.length, success: successCount, failed: failedCount },
      });
      addLog({
        level: failedCount ? "warning" : "success",
        category: "solana-balance",
        message: "Solana 批量余额 Apply 执行完成",
        meta: { clusterKey, mode, success: successCount, failed: failedCount },
      });
      message.success("查询执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: "solana-balance",
        message: "Solana 批量余额 Apply 执行失败",
        meta: { clusterKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询执行失败");
    } finally {
      setLoadingStage("");
    }
  };

  const handleExport = () => {
    if (!rows.length) {
      message.warning("没有可导出的结果");
      return;
    }
    downloadCsv("solana-balance-results.csv", [
      ["index", "address", "status", "result", "extra", "error"],
      ...rows.map((row) => [row.index, row.task, row.status, row.output, row.extra, row.error]),
    ]);
  };

  const handleClusterChange = (value) => {
    setClusterKey(value);
    settings.setPreferredSolanaClusterKey(value);
    const nextRpc = settings.getSolanaRpcOverride(value);
    setCustomRpc(nextRpc);
  };

  const handleRpcChange = (value) => {
    setCustomRpc(value);
    settings.setSolanaRpcOverride(clusterKey, value);
  };

  const extraColumns = [
    {
      title: "补充信息",
      dataIndex: "extra",
      key: "extra",
      width: 160,
      ellipsis: true,
    },
  ];

  return (
    <Card title="Solana 余额查询">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <p className="m-0 text-xs text-slate-400">{"流程：预览 → 运行检查 → 执行查询"}</p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Text strong>网络</Text>
            <Select
              options={clusterOptions}
              value={clusterKey}
              onChange={handleClusterChange}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Text strong>RPC（自动保存）</Text>
            <Input value={customRpc} onChange={(e) => handleRpcChange(e.target.value)} />
          </div>
        </div>

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

        <Space wrap>
          <Select
            placeholder="恢复版本"
            style={{ width: 280 }}
            value={selectedVersion || undefined}
            onChange={setSelectedVersion}
            options={versions.map((version) => ({
              value: version.id,
              label: `${new Date(version.createdAt).toLocaleTimeString()} - ${version.label}`,
            }))}
          />
          <Button onClick={restoreVersion} disabled={!selectedVersion}>
            恢复
          </Button>
        </Space>

        <StageActionBar
          stage={stage}
          loadingStage={loadingStage}
          onPreview={handlePreview}
          onRun={handleRunCheck}
          onApply={handleApply}
          applyText="执行查询"
          runText="运行检查"
          previewText="预览输入"
        />

        {progress.total > 0 && (
          <Progress percent={Math.floor((progress.completed / progress.total) * 100)} />
        )}

        <Space size="large" wrap>
          <Statistic title="总任务" value={summary.total} />
          <Statistic title="成功" value={summary.success} />
          <Statistic title="失败" value={summary.failed} />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出 CSV
          </Button>
        </Space>

        {(previewData || runCheckData) && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {previewData && (
              <Card size="small" title="预览结果">
                <Space wrap>
                  <Tag>{`总数: ${previewData.total}`}</Tag>
                  <Tag color="green">{`合法: ${previewData.valid}`}</Tag>
                  <Tag color={previewData.invalid ? "orange" : "default"}>{`非法: ${previewData.invalid}`}</Tag>
                </Space>
              </Card>
            )}
            {runCheckData && (
              <Card size="small" title="检查结果">
                <Space wrap>
                  <Tag>{`cluster: ${runCheckData.cluster}`}</Tag>
                  <Tag>{`slot: ${runCheckData.slot}`}</Tag>
                  {runCheckData.mintMeta && (
                    <Tag>{`decimals: ${runCheckData.mintMeta.decimals}`}</Tag>
                  )}
                </Space>
              </Card>
            )}
          </div>
        )}

        {artifacts.length > 0 && (
          <div className="space-y-2">
            <Text strong>最近执行记录</Text>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {artifacts.slice(0, 4).map((artifact) => (
                <TaskArtifactCard key={artifact.id} artifact={artifact} />
              ))}
            </div>
          </div>
        )}

        <TaskResultTable
          rows={rows}
          loading={loadingStage === "apply"}
          extraColumns={extraColumns}
        />
      </Space>
    </Card>
  );
}
