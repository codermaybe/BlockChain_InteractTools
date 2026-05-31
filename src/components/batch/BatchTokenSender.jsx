import React, { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Input,
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
import { ERC20_MIN_ABI } from "../../config/abis";
import { getEvmChainOptions } from "../../config/chainRegistry";
import {
  createJsonRpcProvider,
  probeProvider,
} from "../../services/evm/providerFactory";
import { getReadContract, getWriteContract } from "../../services/evm/contractService";
import { createSigner } from "../../services/evm/signerFactory";
import {
  createTaskId,
  downloadCsv,
  MAX_TASK_ARTIFACTS,
  MAX_TASK_VERSIONS,
  parseLineItems,
  runTaskQueue,
} from "../../utils/taskRunner";
import { useAppSettings } from "../../state/AppSettingsContext";
import { useTaskLog } from "../../state/TaskLogContext";

const { Text } = Typography;

function parseRecipients(text) {
  return parseLineItems(text).map((line, index) => {
    const normalized = line.replace(/\s+/g, ",");
    const [address, amount] = normalized.split(",").map((part) => (part || "").trim());
    return { row: index + 1, address, amount, raw: line };
  });
}

export default function BatchTokenSender() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [customRpc, setCustomRpc] = useState(settings.getEvmRpcOverride(settings.preferredChainKey));
  const [privateKey, setPrivateKey] = useState("");
  const [assetType, setAssetType] = useState("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientsText, setRecipientsText] = useState("");
  const [rows, setRows] = useState([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [summary, setSummary] = useState({ total: 0, success: 0, failed: 0 });
  const [stage, setStage] = useState("draft");
  const [loadingStage, setLoadingStage] = useState("");
  const [previewData, setPreviewData] = useState(null);
  const [runCheckData, setRunCheckData] = useState(null);
  const [artifacts, setArtifacts] = useState([]);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");

  const chainOptions = useMemo(() => getEvmChainOptions(), []);

  const createConfigSnapshot = () => ({
    chainKey,
    customRpc,
    privateKey,
    assetType,
    tokenAddress,
    recipientsText,
  });

  const saveVersion = (label) => {
    const snapshot = {
      id: createTaskId(),
      label,
      createdAt: Date.now(),
      config: createConfigSnapshot(),
    };
    setVersions((prev) => [snapshot, ...prev].slice(0, MAX_TASK_VERSIONS));
    return snapshot;
  };

  const restoreVersion = () => {
    const target = versions.find((item) => item.id === selectedVersion);
    if (!target) return;
    const config = target.config;
    setChainKey(config.chainKey);
    settings.setPreferredChainKey(config.chainKey);
    setCustomRpc(config.customRpc);
    settings.setEvmRpcOverride(config.chainKey, config.customRpc);
    setPrivateKey(config.privateKey);
    setAssetType(config.assetType);
    setTokenAddress(config.tokenAddress);
    setRecipientsText(config.recipientsText);
    message.success("已恢复历史版本配置");
  };

  const pushArtifact = (artifact) => {
    setArtifacts((prev) =>
      [{ id: createTaskId(), createdAt: Date.now(), ...artifact }, ...prev].slice(
        0,
        MAX_TASK_ARTIFACTS
      )
    );
  };

  const onChangeChain = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    const nextRpc = settings.getEvmRpcOverride(value);
    setCustomRpc(nextRpc);
  };

  const onChangeRpc = (value) => {
    setCustomRpc(value);
    settings.setEvmRpcOverride(chainKey, value);
  };

  const buildPreview = () => {
    const recipients = parseRecipients(recipientsText);
    const invalid = recipients.filter(
      (item) =>
        !ethers.isAddress(item.address) ||
        !item.amount ||
        Number(item.amount) <= 0 ||
        Number.isNaN(Number(item.amount))
    );
    const valid = recipients.filter((item) => !invalid.includes(item));
    return { total: recipients.length, valid, invalid };
  };

  const handlePreview = () => {
    setLoadingStage("preview");
    try {
      const preview = buildPreview();
      if (!preview.total) {
        message.warning("请填写接收地址与金额");
        return;
      }
      setPreviewData(preview);
      setStage("previewed");
      saveVersion("Preview");
      pushArtifact({
        title: "收款任务预览完成",
        type: "Preview",
        color: "blue",
        summary: `共 ${preview.total} 条，合法 ${preview.valid.length} 条，非法 ${preview.invalid.length} 条。`,
        stats: { total: preview.total, valid: preview.valid.length, invalid: preview.invalid.length },
      });
    } finally {
      setLoadingStage("");
    }
  };

  const handleRunCheck = async () => {
    setLoadingStage("run");
    try {
      const preview = previewData || buildPreview();
      if (!preview.total) {
        message.warning("请先输入接收任务");
        return;
      }
      if (!privateKey.trim()) {
        message.error("请输入发送方私钥");
        return;
      }
      if (assetType === "erc20" && !ethers.isAddress(tokenAddress)) {
        message.error("请输入有效 ERC20 合约地址");
        return;
      }

      const { provider } = createJsonRpcProvider(chainKey, customRpc, true);
      const probe = await probeProvider(provider);
      const sender = createSigner(chainKey, privateKey.trim(), customRpc);
      const senderAddress = await sender.getAddress();
      const nativeBalance = await provider.getBalance(senderAddress);

      let tokenMeta = null;
      if (assetType === "erc20") {
        const tokenContract = getReadContract(chainKey, tokenAddress, ERC20_MIN_ABI, customRpc);
        const [symbol, decimals, tokenBalance] = await Promise.all([
          tokenContract.symbol().catch(() => "ERC20"),
          tokenContract.decimals().catch(() => 18),
          tokenContract.balanceOf(senderAddress).catch(() => 0n),
        ]);
        tokenMeta = {
          symbol,
          decimals: Number(decimals),
          balance: ethers.formatUnits(tokenBalance, Number(decimals)),
        };
      }

      const data = {
        chainId: probe.chainId,
        blockNumber: probe.blockNumber,
        senderAddress,
        nativeBalance: ethers.formatEther(nativeBalance),
        tokenMeta,
      };
      setRunCheckData(data);
      setStage("checked");
      saveVersion("Run Check");
      pushArtifact({
        title: "执行前检查完成",
        type: "Run",
        color: "gold",
        summary: `发送地址 ${sender.address.slice(0, 8)}...，链ID ${probe.chainId}。`,
        stats: tokenMeta
          ? { native: data.nativeBalance, token: `${tokenMeta.balance} ${tokenMeta.symbol}` }
          : { native: data.nativeBalance },
      });
      message.success("运行检查通过，可执行转账");
    } catch (error) {
      addLog({
        level: "error",
        category: "batch-transfer",
        message: "批量转账 Run 检查失败",
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
      const preview = previewData || buildPreview();
      const sender = createSigner(chainKey, privateKey.trim(), customRpc);

      let symbol = "ETH";
      let decimals = 18;
      let tokenContract = null;

      if (assetType === "erc20") {
        tokenContract = getWriteContract(tokenAddress, ERC20_MIN_ABI, sender);
        const [tokenSymbol, tokenDecimals] = await Promise.all([
          tokenContract.symbol().catch(() => "ERC20"),
          tokenContract.decimals().catch(() => 18),
        ]);
        symbol = tokenSymbol;
        decimals = Number(tokenDecimals);
      }

      const invalidRows = preview.invalid.map((item) => ({
        index: item.row,
        task: item.raw,
        status: "failed",
        output: "",
        error: "输入格式无效",
        txHash: "",
      }));

      setProgress({ completed: 0, total: preview.valid.length });
      const result = await runTaskQueue({
        items: preview.valid,
        concurrency: 1,
        onProgress: ({ completed, total }) => setProgress({ completed, total }),
        worker: async (item) => {
          const amount = ethers.parseUnits(item.amount, decimals);
          let txResponse;
          if (assetType === "native") {
            txResponse = await sender.sendTransaction({ to: item.address, value: amount });
          } else {
            txResponse = await tokenContract.transfer(item.address, amount);
          }
          await txResponse.wait();
          return { txHash: txResponse.hash, value: item.amount, symbol };
        },
      });

      const successRows = result.results.map((taskResult, idx) => ({
        index: preview.valid[idx].row,
        task: preview.valid[idx].raw,
        status: taskResult.status,
        output:
          taskResult.status === "success"
            ? `${taskResult.output.value} ${taskResult.output.symbol}`
            : "",
        error: taskResult.error,
        txHash: taskResult.output?.txHash || "",
      }));

      const merged = [...invalidRows, ...successRows].sort((a, b) => a.index - b.index);
      setRows(merged);
      const successCount = merged.filter((item) => item.status === "success").length;
      const failedCount = merged.filter((item) => item.status === "failed").length;
      setSummary({ total: merged.length, success: successCount, failed: failedCount });
      setStage("applied");
      saveVersion("Apply");
      pushArtifact({
        title: "批量转账执行完成",
        type: "Apply",
        color: failedCount ? "orange" : "green",
        summary: failedCount
          ? `成功 ${successCount} 条，失败 ${failedCount} 条。`
          : `全部成功，共 ${successCount} 条。`,
        stats: { total: merged.length, success: successCount, failed: failedCount },
      });
      addLog({
        level: failedCount ? "warning" : "success",
        category: "batch-transfer",
        message: "批量转账 Apply 完成",
        meta: { chainKey, success: successCount, failed: failedCount },
      });
      message.success("转账执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: "batch-transfer",
        message: "批量转账 Apply 失败",
        meta: { chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "转账执行失败");
    } finally {
      setLoadingStage("");
    }
  };

  const handleExport = () => {
    if (!rows.length) {
      message.warning("暂无可导出结果");
      return;
    }
    downloadCsv("batch-transfer-results.csv", [
      ["index", "input", "status", "result", "error", "txHash"],
      ...rows.map((row) => [row.index, row.task, row.status, row.output, row.error, row.txHash]),
    ]);
  };

  return (
    <Card title="批量转账">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="warning"
          showIcon
          banner
          message="高风险：执行转账将真实发送链上交易，请确认运行检查已通过。"
        />

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

        <div className="space-y-2">
          <Text strong>发送方私钥</Text>
          <Input.Password value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Text strong>资产类型</Text>
            <Radio.Group value={assetType} onChange={(e) => setAssetType(e.target.value)} optionType="button">
              <Radio.Button value="native">原生币</Radio.Button>
              <Radio.Button value="erc20">ERC20</Radio.Button>
            </Radio.Group>
          </div>
          {assetType === "erc20" && (
            <div className="space-y-2 md:col-span-2">
              <Text strong>ERC20 合约地址</Text>
              <Input value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
            </div>
          )}
        </div>

        <Input.TextArea
          rows={8}
          value={recipientsText}
          onChange={(e) => setRecipientsText(e.target.value)}
          placeholder={"每行格式: 地址,金额\n例如: 0xabc...,0.01"}
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
          applyDanger
          applyText="执行转账"
          runText="运行检查"
          previewText="预览任务"
        />

        {progress.total > 0 && <Progress percent={Math.floor((progress.completed / progress.total) * 100)} />}

        <Space size="large" wrap>
          <Statistic title="总任务" value={summary.total} />
          <Statistic title="成功" value={summary.success} />
          <Statistic title="失败" value={summary.failed} />
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出结果
          </Button>
        </Space>

        {(previewData || runCheckData) && (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {previewData && (
              <Card size="small" title="预览结果">
                <Space wrap>
                  <Tag>{`总数: ${previewData.total}`}</Tag>
                  <Tag color="green">{`合法: ${previewData.valid.length}`}</Tag>
                  <Tag color={previewData.invalid.length ? "orange" : "default"}>
                    {`非法: ${previewData.invalid.length}`}
                  </Tag>
                </Space>
              </Card>
            )}
            {runCheckData && (
              <Card size="small" title="检查结果">
                <Space wrap>
                  <Tag>{`chainId: ${runCheckData.chainId}`}</Tag>
                  <Tag>{`sender: ${runCheckData.senderAddress.slice(0, 10)}...`}</Tag>
                  <Tag>{`native: ${runCheckData.nativeBalance}`}</Tag>
                  {runCheckData.tokenMeta && (
                    <Tag>{`token: ${runCheckData.tokenMeta.balance} ${runCheckData.tokenMeta.symbol}`}</Tag>
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
          extraColumns={[{ title: "交易哈希", dataIndex: "txHash", key: "txHash", ellipsis: true }]}
        />
      </Space>
    </Card>
  );
}
