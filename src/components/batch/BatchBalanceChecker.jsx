import React, { useMemo, useState } from "react";
import {
  Alert,
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
import { ethers } from "ethers";
import TaskResultTable from "../shared/TaskResultTable";
import StageActionBar from "../shared/StageActionBar";
import TaskArtifactCard from "../shared/TaskArtifactCard";
import { getChainOptions } from "../../config/chainRegistry";
import {
  createJsonRpcProvider,
  probeProvider,
} from "../../services/evm/providerFactory";
import {
  downloadCsv,
  parseLineItems,
  runTaskQueue,
} from "../../utils/taskRunner";
import { useAppSettings } from "../../state/AppSettingsContext";
import { useTaskLog } from "../../state/TaskLogContext";

const { Text } = Typography;

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function BatchBalanceChecker() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [customRpc, setCustomRpc] = useState(
    settings.getRpcOverride(settings.preferredChainKey)
  );
  const [mode, setMode] = useState("native");
  const [tokenAddress, setTokenAddress] = useState("");
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

  const chainOptions = useMemo(() => getChainOptions(), []);

  const createConfigSnapshot = () => ({
    chainKey,
    customRpc,
    mode,
    tokenAddress,
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
    const config = target.config;
    setChainKey(config.chainKey);
    settings.setPreferredChainKey(config.chainKey);
    setCustomRpc(config.customRpc);
    settings.setRpcOverride(config.chainKey, config.customRpc);
    setMode(config.mode);
    setTokenAddress(config.tokenAddress);
    setAddressesText(config.addressesText);
    setConcurrency(config.concurrency);
    message.success("已恢复历史版本配置");
  };

  const pushArtifact = (artifact) => {
    setArtifacts((prev) => [{ id: createId(), createdAt: Date.now(), ...artifact }, ...prev].slice(0, 8));
  };

  const parsePreview = () => {
    const addresses = parseLineItems(addressesText);
    const validAddresses = addresses.filter((address) => ethers.isAddress(address));
    const invalidCount = addresses.length - validAddresses.length;
    return {
      total: addresses.length,
      valid: validAddresses.length,
      invalid: invalidCount,
      validAddresses,
      invalidRows: addresses
        .map((address, idx) => ({ address, index: idx + 1 }))
        .filter((item) => !ethers.isAddress(item.address)),
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
        title: "地址预览完成",
        type: "Preview",
        color: "blue",
        summary: `共 ${preview.total} 条地址，合法 ${preview.valid} 条，非法 ${preview.invalid} 条。`,
        stats: { total: preview.total, valid: preview.valid, invalid: preview.invalid },
      });
      addLog({
        level: "info",
        category: "batch-balance",
        message: "完成批量余额地址预览",
        meta: { chainKey, total: preview.total, valid: preview.valid },
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
      if (mode === "erc20" && !ethers.isAddress(tokenAddress)) {
        message.error("请输入有效 ERC20 合约地址");
        return;
      }

      const { provider, rpcUrl } = createJsonRpcProvider(chainKey, customRpc, true);
      const probe = await probeProvider(provider);
      let tokenMeta = null;
      if (mode === "erc20") {
        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => "ERC20"),
          tokenContract.decimals().catch(() => 18),
        ]);
        tokenMeta = { symbol, decimals: Number(decimals) };
      }

      const data = {
        chainId: probe.chainId,
        blockNumber: probe.blockNumber,
        rpcUrl,
        tokenMeta,
      };
      setRunCheckData(data);
      setStage("checked");
      saveVersion("Run Check");
      pushArtifact({
        title: "执行前检查完成",
        type: "Run",
        color: "gold",
        summary: `链 ID ${probe.chainId}，区块 ${probe.blockNumber}，可开始执行查询。`,
        stats: tokenMeta ? { token: tokenMeta.symbol, decimals: tokenMeta.decimals } : { mode: "native" },
      });
      addLog({
        level: "success",
        category: "batch-balance",
        message: "批量余额 Run 检查通过",
        meta: { chainKey, chainId: probe.chainId },
      });
      message.success("运行检查通过，可执行查询");
    } catch (error) {
      addLog({
        level: "error",
        category: "batch-balance",
        message: "批量余额 Run 检查失败",
        meta: { chainKey, error: error?.message || "unknown" },
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
      const { provider, chain } = createJsonRpcProvider(chainKey, customRpc, true);

      let tokenContract = null;
      let tokenSymbol = chain.symbol;
      let tokenDecimals = 18;

      if (mode === "erc20") {
        tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
        const [symbol, decimals] = await Promise.all([
          tokenContract.symbol().catch(() => "ERC20"),
          tokenContract.decimals().catch(() => 18),
        ]);
        tokenSymbol = symbol;
        tokenDecimals = Number(decimals);
      }

      const invalidRows = preview.invalidRows.map((item) => ({
        id: `invalid-${item.index}`,
        index: item.index,
        task: item.address,
        status: "failed",
        output: "",
        error: "地址格式无效",
      }));

      setProgress({ completed: 0, total: preview.validAddresses.length });
      const result = await runTaskQueue({
        items: preview.validAddresses.map((address, idx) => ({ address, index: idx + 1 })),
        concurrency,
        onProgress: ({ completed, total }) => setProgress({ completed, total }),
        worker: async (item) => {
          if (mode === "native") {
            const rawBalance = await provider.getBalance(item.address);
            return { value: ethers.formatEther(rawBalance), symbol: chain.symbol };
          }
          const rawBalance = await tokenContract.balanceOf(item.address);
          return { value: ethers.formatUnits(rawBalance, tokenDecimals), symbol: tokenSymbol };
        },
      });

      const validRows = result.results.map((taskResult, idx) => ({
        id: `valid-${idx}`,
        index: idx + 1,
        task: preview.validAddresses[idx],
        status: taskResult.status,
        output: taskResult.status === "success" ? `${taskResult.output.value} ${taskResult.output.symbol}` : "",
        error: taskResult.error,
      }));

      const merged = [...invalidRows, ...validRows].sort((a, b) => a.index - b.index);
      setRows(merged);

      const successCount = merged.filter((item) => item.status === "success").length;
      const failedCount = merged.filter((item) => item.status === "failed").length;
      setSummary({ total: merged.length, success: successCount, failed: failedCount });
      setStage("applied");
      saveVersion("Apply");
      pushArtifact({
        title: "批量余额查询完成",
        type: "Apply",
        color: failedCount ? "orange" : "green",
        summary: failedCount
          ? `执行完成，成功 ${successCount} 条，失败 ${failedCount} 条。`
          : `执行完成，全部 ${successCount} 条成功。`,
        stats: { total: merged.length, success: successCount, failed: failedCount },
      });
      addLog({
        level: failedCount ? "warning" : "success",
        category: "batch-balance",
        message: "批量余额 Apply 执行完成",
        meta: { chainKey, success: successCount, failed: failedCount },
      });
      message.success("查询执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: "batch-balance",
        message: "批量余额 Apply 执行失败",
        meta: { chainKey, error: error?.message || "unknown" },
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
    downloadCsv("batch-balance-results.csv", [
      ["index", "address", "status", "result", "error"],
      ...rows.map((row) => [row.index, row.task, row.status, row.output, row.error]),
    ]);
  };

  const onChangeChain = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    const nextRpc = settings.getRpcOverride(value);
    setCustomRpc(nextRpc);
  };

  const onChangeRpc = (value) => {
    setCustomRpc(value);
    settings.setRpcOverride(chainKey, value);
  };

  return (
    <Card title="批量余额查询">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <p className="m-0 text-xs text-slate-400">
          流程：预览 → 运行检查 → 执行查询
        </p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Text strong>链</Text>
            <Select options={chainOptions} value={chainKey} onChange={onChangeChain} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Text strong>RPC（自动保存）</Text>
            <Input value={customRpc} onChange={(e) => onChangeRpc(e.target.value)} />
          </div>
        </div>

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
                  <Tag>{`chainId: ${runCheckData.chainId}`}</Tag>
                  <Tag>{`block: ${runCheckData.blockNumber}`}</Tag>
                  {runCheckData.tokenMeta && <Tag>{`token: ${runCheckData.tokenMeta.symbol}`}</Tag>}
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

        <TaskResultTable rows={rows} loading={loadingStage === "apply"} />
      </Space>
    </Card>
  );
}
