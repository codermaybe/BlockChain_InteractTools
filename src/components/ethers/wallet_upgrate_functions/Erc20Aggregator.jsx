import { useState } from "react";
import { Alert, Button, Card, Space, message } from "antd";
import { ethers } from "ethers";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { createSigner } from "../../../services/evm/signerFactory.js";
import { getWriteContract } from "../../../services/evm/contractService.js";
import { CONTRACT_PRESETS } from "../../../config/abis.js";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useChainRpc } from "../../../hooks/useChainRpc.js";
import { useSensitiveInput } from "../../../hooks/useSensitiveInput.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import ChainRpcSelector from "../../../components/shared/ChainRpcSelector.jsx";
import SensitiveField from "../../../components/shared/SensitiveField.jsx";
import TaskResultTable from "../../shared/TaskResultTable";

const ERC20_PRESET = CONTRACT_PRESETS.find((item) => item.key === "erc20")?.abi || [];

export default function Erc20Aggregator() {
  const chain = useChainRpc();
  const mainPrivateKey = useSensitiveInput();
  const tokenData = useSensitiveInput();
  const { addLog } = useTaskLog();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const parseTokenList = () =>
    tokenData.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => {
        const [tokenAddress, privateKey] = line.split(",").map((item) => item.trim());
        return { tokenAddress, privateKey, index: idx + 1 };
      });

  const handleAggregate = async () => {
    if (!mainPrivateKey.value) {
      message.error("请输入主钱包私钥");
      return;
    }
    if (!tokenData.value.trim()) {
      message.error("请输入代币地址及对应钱包私钥");
      return;
    }

    setLoading(true);
    setRows([]);
    addLog({
      level: "info",
      category: LOG_CATEGORY.ERC20_AGGREGATE,
      message: "开始 ERC20 归集任务",
      meta: { chainKey: chain.chainKey },
    });

    try {
      const { provider } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      await probeProvider(provider);
      const mainWallet = createSigner(chain.chainKey, mainPrivateKey.getOnce(), chain.rpc);
      const tokenList = parseTokenList();

      const taskRows = [];
      for (const item of tokenList) {
        try {
          if (!ethers.isAddress(item.tokenAddress)) {
            taskRows.push({
              index: item.index,
              task: item.tokenAddress || "-",
              status: "failed",
              output: "",
              error: "代币地址无效",
            });
            continue;
          }
          const wallet = createSigner(chain.chainKey, item.privateKey, chain.rpc);
          const contract = getWriteContract(item.tokenAddress, ERC20_PRESET, wallet);
          const [balance, decimals, symbol] = await Promise.all([
            contract.balanceOf(wallet.address),
            contract.decimals().catch(() => 18),
            contract.symbol().catch(() => "ERC20"),
          ]);
          if (balance <= 0n) {
            taskRows.push({
              index: item.index,
              task: item.tokenAddress,
              status: "failed",
              output: "",
              error: "余额为 0",
            });
            continue;
          }
          const tx = await contract.transfer(mainWallet.address, balance);
          await tx.wait();
          taskRows.push({
            index: item.index,
            task: item.tokenAddress,
            status: "success",
            output: `${ethers.formatUnits(balance, Number(decimals))} ${symbol}`,
            error: "",
            txHash: tx.hash,
          });
        } catch (error) {
          taskRows.push({
            index: item.index,
            task: item.tokenAddress || "-",
            status: "failed",
            output: "",
            error: error?.message || "归集失败",
          });
        }
      }

      tokenData.clear();
      setRows(taskRows);
      const failedCount = taskRows.filter((item) => item.status === "failed").length;
      addLog({
        level: failedCount ? "warning" : "success",
        category: LOG_CATEGORY.ERC20_AGGREGATE,
        message: "ERC20 归集任务完成",
        meta: { chainKey: chain.chainKey, total: taskRows.length, failed: failedCount },
      });
      message.success("归集任务执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.ERC20_AGGREGATE,
        message: "ERC20 归集任务失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "归集失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="ERC20 代币归集">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          message="高风险操作"
          description="归集会逐行使用私钥发起真实链上交易。结果表和日志只记录代币地址，不记录私钥。"
          type="warning"
          showIcon
        />

        <ChainRpcSelector {...chain} disabled={loading} />
        <SensitiveField {...mainPrivateKey} label="主钱包私钥" showWarning={false} />
        <SensitiveField
          {...tokenData}
          label="代币地址及私钥"
          placeholder="每行格式: 代币地址,钱包私钥"
          multiline
          showWarning={false}
        />

        <Button type="primary" onClick={handleAggregate} loading={loading}>
          开始归集
        </Button>

        <TaskResultTable
          rows={rows}
          loading={loading}
          extraColumns={[
            { title: "交易哈希", dataIndex: "txHash", key: "txHash", ellipsis: true },
          ]}
        />
      </Space>
    </Card>
  );
}
