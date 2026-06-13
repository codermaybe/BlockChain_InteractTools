import { useState } from "react";
import { Alert, Input, Radio, Typography, message } from "antd";
import { ethers } from "ethers";
import { ERC20_MIN_ABI } from "../../../config/abis";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useChainRpc } from "../../../hooks/useChainRpc.js";
import { useSensitiveInput } from "../../../hooks/useSensitiveInput.js";
import { useStagedTask } from "../../../hooks/useStagedTask.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { getReadContract, getWriteContract } from "../../../services/evm/contractService";
import { createSigner } from "../../../services/evm/signerFactory";
import { downloadCsv, parseLineItems } from "../../../utils/taskRunner";
import BatchTaskWorkbench from "../../shared/BatchTaskWorkbench.jsx";
import ChainRpcSelector from "../../shared/ChainRpcSelector.jsx";
import SensitiveField from "../../shared/SensitiveField.jsx";

const { Text } = Typography;

function parseRecipients(text) {
  return parseLineItems(text).map((line, index) => {
    const normalized = line.replace(/\s+/g, ",");
    const [address, amount] = normalized.split(",").map((part) => (part || "").trim());
    return { row: index + 1, address, amount, raw: line };
  });
}

export default function BatchTokenSender() {
  const chain = useChainRpc();
  const { addLog } = useTaskLog();
  const privateKey = useSensitiveInput();

  const [assetType, setAssetType] = useState("native");
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipientsText, setRecipientsText] = useState("");

  const task = useStagedTask({
    parsePreview: (input) => {
      const items = parseRecipients(input).map((item) => ({
        ...item,
        task: item.raw,
        valid:
          ethers.isAddress(item.address) &&
          !!item.amount &&
          Number(item.amount) > 0 &&
          !Number.isNaN(Number(item.amount)),
      }));
      const valid = items.filter((item) => item.valid).length;
      return { total: items.length, valid, invalid: items.length - valid, items };
    },
    runCheck: async () => {
      const currentPrivateKey = privateKey.value.trim();
      if (!currentPrivateKey) {
        throw new Error("请输入发送方私钥");
      }
      if (assetType === "erc20" && !ethers.isAddress(tokenAddress)) {
        throw new Error("请输入有效 ERC20 合约地址");
      }
      const { provider } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      const probe = await probeProvider(provider);
      const sender = createSigner(chain.chainKey, currentPrivateKey, chain.rpc);
      const senderAddress = await sender.getAddress();
      const nativeBalance = await provider.getBalance(senderAddress);

      let tokenMeta = null;
      if (assetType === "erc20") {
        const tokenContract = getReadContract(chain.chainKey, tokenAddress, ERC20_MIN_ABI, chain.rpc);
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

      return {
        chainId: probe.chainId,
        blockNumber: probe.blockNumber,
        senderAddress,
        nativeBalance: ethers.formatEther(nativeBalance),
        tokenMeta,
      };
    },
    buildWorker: (ctx) => {
      const { sender, tokenContract, symbol, decimals } = ctx;
      return async (item) => {
        if (!item.valid) {
          throw new Error("输入格式无效");
        }
        const amount = ethers.parseUnits(item.amount, decimals);
        const txResponse =
          ctx.assetType === "native"
            ? await sender.sendTransaction({ to: item.address, value: amount })
            : await tokenContract.transfer(item.address, amount);
        await txResponse.wait();
        return { text: `${item.amount} ${symbol}`, data: { txHash: txResponse.hash } };
      };
    },
    defaultConcurrency: 1,
  });

  // 配置快照绝不包含私钥（saveVersion 亦会兜底剔除敏感字段）。
  const buildSnapshot = () => ({
    chainKey: chain.chainKey,
    rpc: chain.rpc,
    assetType,
    tokenAddress,
    recipientsText,
  });

  const handlePreview = async () => {
    if (!parseRecipients(recipientsText).length) {
      message.warning("请填写接收地址与金额");
      return;
    }
    const data = await task.preview(recipientsText);
    task.saveVersion(buildSnapshot(), { label: "预览" });
    task.pushArtifact({
      title: "收款任务预览完成",
      type: "Preview",
      color: "blue",
      summary: `共 ${data.total} 条，合法 ${data.valid} 条，非法 ${data.invalid} 条。`,
      stats: { total: data.total, valid: data.valid, invalid: data.invalid },
    });
  };

  const handleRunCheck = async () => {
    if (!task.previewData?.total) {
      message.warning("请先输入接收任务");
      return;
    }
    try {
      const data = await task.runCheck();
      task.saveVersion(buildSnapshot(), { label: "运行检查" });
      task.pushArtifact({
        title: "执行前检查完成",
        type: "Run",
        color: "gold",
        summary: `发送地址 ${data.senderAddress.slice(0, 8)}...，链ID ${data.chainId}。`,
        stats: data.tokenMeta
          ? { native: data.nativeBalance, token: `${data.tokenMeta.balance} ${data.tokenMeta.symbol}` }
          : { native: data.nativeBalance },
      });
      message.success("运行检查通过，可执行转账");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.BATCH_TRANSFER,
        message: "批量转账 Run 检查失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "运行检查失败");
    }
  };

  const handleApply = async () => {
    try {
      const items = task.previewData?.items ?? [];
      // 私钥仅在执行瞬间取出一次，取后即从内存清除。
      const sender = createSigner(chain.chainKey, privateKey.getOnce(), chain.rpc);

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

      const result = await task.apply(
        { items, assetType, sender, tokenContract, symbol, decimals },
        1
      );

      task.saveVersion(buildSnapshot(), { label: "执行" });
      task.pushArtifact({
        title: "批量转账执行完成",
        type: "Apply",
        color: result.failed ? "orange" : "green",
        summary: result.failed
          ? `成功 ${result.success} 条，失败 ${result.failed} 条。`
          : `全部成功，共 ${result.success} 条。`,
        stats: { total: result.total, success: result.success, failed: result.failed },
      });
      addLog({
        level: result.failed ? "warning" : "success",
        category: LOG_CATEGORY.BATCH_TRANSFER,
        message: "批量转账 Apply 完成",
        meta: { chainKey: chain.chainKey, success: result.success, failed: result.failed },
      });
      message.success("转账执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.BATCH_TRANSFER,
        message: "批量转账 Apply 失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "转账执行失败");
    }
  };

  const handleRestore = (snapshot) => {
    if (!snapshot) {
      return;
    }
    chain.setChainKey(snapshot.chainKey);
    chain.setRpc(snapshot.rpc || "");
    setAssetType(snapshot.assetType);
    setTokenAddress(snapshot.tokenAddress);
    setRecipientsText(snapshot.recipientsText);
    message.success("已恢复历史版本配置");
  };

  const handleExport = () => {
    if (!task.rows.length) {
      message.warning("暂无可导出结果");
      return;
    }
    // 导出列不含私钥。
    downloadCsv("batch-transfer-results.csv", [
      ["index", "input", "status", "result", "error", "txHash"],
      ...task.rows.map((row) => [row.index, row.task, row.status, row.output, row.error, row.txHash || ""]),
    ]);
  };

  const configSlot = (
    <>
      <Alert
        type="warning"
        showIcon
        banner
        message="高风险：执行转账将真实发送链上交易，请确认运行检查已通过。"
      />
      <ChainRpcSelector {...chain} />
      <SensitiveField {...privateKey} label="发送方私钥" showWarning={false} />
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
    </>
  );

  return (
    <BatchTaskWorkbench
      task={task}
      title="批量转账"
      previewText="预览任务"
      runText="运行检查"
      applyText="执行转账"
      applyDanger
      onPreview={handlePreview}
      onRun={handleRunCheck}
      onApply={handleApply}
      onRestore={handleRestore}
      onExport={handleExport}
      configSlot={configSlot}
      extraColumns={[{ title: "交易哈希", dataIndex: "txHash", key: "txHash", ellipsis: true }]}
    />
  );
}
