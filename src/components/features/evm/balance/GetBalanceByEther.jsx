import { useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, Card, Input, Space, Typography, message } from "antd";
import { createJsonRpcProvider, probeProvider } from "../../../../services/evm/providerFactory";
import { LOG_CATEGORY } from "../../../../config/categories.js";
import { useChainRpc } from "../../../../hooks/useChainRpc.js";
import { useTaskLog } from "../../../../state/TaskLogContext";
import ChainRpcSelector from "../../../shared/ChainRpcSelector.jsx";

const { Text } = Typography;

export default function GetBalanceByEther() {
  const chain = useChainRpc();
  const { addLog } = useTaskLog();
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("-");
  const [nonce, setNonce] = useState("-");
  const [isLoading, setIsLoading] = useState(false);
  const [rpcStatus, setRpcStatus] = useState("待检测");

  const checkRpcStatus = async () => {
    try {
      const { provider } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      await probeProvider(provider);
      setRpcStatus("可用");
      return true;
    } catch {
      setRpcStatus("不可用");
      return false;
    }
  };

  const getBalance = async () => {
    if (!ethers.isAddress(walletAddress)) {
      message.error("无效地址");
      return;
    }

    setIsLoading(true);
    addLog({
      level: "info",
      category: LOG_CATEGORY.EVM_BALANCE,
      message: "开始查询地址余额",
      meta: { chainKey: chain.chainKey, walletAddress },
    });

    try {
      const { provider, chain: chainInfo } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      await probeProvider(provider);
      setRpcStatus("可用");
      const [rawBalance, txCount] = await Promise.all([
        provider.getBalance(walletAddress),
        provider.getTransactionCount(walletAddress),
      ]);
      const value = ethers.formatEther(rawBalance);
      setBalance(`${value} ${chainInfo.symbol}`);
      setNonce(txCount);
      addLog({
        level: "success",
        category: LOG_CATEGORY.EVM_BALANCE,
        message: "余额查询成功",
        meta: { chainKey: chain.chainKey, walletAddress, balance: value, nonce: txCount },
      });
      message.success("查询成功");
    } catch (error) {
      setRpcStatus("不可用");
      setBalance("查询失败");
      addLog({
        level: "error",
        category: LOG_CATEGORY.EVM_BALANCE,
        message: "余额查询失败",
        meta: { chainKey: chain.chainKey, walletAddress, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="地址余额查询（EVM）">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          showIcon
          type="info"
          message="说明"
          description="链与 RPC 会自动复用全局配置，避免页面切换重复填写。"
        />

        <ChainRpcSelector {...chain} />

        <Space wrap>
          <Button onClick={checkRpcStatus}>检测 RPC</Button>
          <Text type={rpcStatus === "可用" ? "success" : rpcStatus === "不可用" ? "danger" : "secondary"}>
            RPC 状态: {rpcStatus}
          </Text>
        </Space>

        <div className="space-y-2">
          <Text strong>目标地址</Text>
          <Input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <Space wrap>
          <Button type="primary" onClick={getBalance} loading={isLoading}>
            查询余额
          </Button>
          <Text>余额: {balance}</Text>
          <Text>交易次数: {nonce}</Text>
        </Space>
      </Space>
    </Card>
  );
}
