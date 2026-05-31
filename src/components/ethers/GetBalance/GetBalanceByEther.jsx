import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, Card, Input, Select, Space, Typography, message } from "antd";
import { getChainOptions } from "../../../config/chainRegistry";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

function GetBalanceByEther() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [rpc, setRpc] = useState(settings.getRpcOverride(settings.preferredChainKey));
  const [walletAddress, setWalletAddress] = useState("");
  const [balance, setBalance] = useState("-");
  const [nonce, setNonce] = useState("-");
  const [isLoading, setIsLoading] = useState(false);
  const [rpcStatus, setRpcStatus] = useState("待检测");

  const chainOptions = useMemo(() => getChainOptions(), []);

  const handleChainChange = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    setRpc(settings.getRpcOverride(value));
  };

  const handleRpcChange = (value) => {
    setRpc(value);
    settings.setRpcOverride(chainKey, value);
  };

  const checkRpcStatus = async () => {
    try {
      const { provider } = createJsonRpcProvider(chainKey, rpc, true);
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
      category: "eth-balance",
      message: "开始查询地址余额",
      meta: { chainKey, walletAddress },
    });

    try {
      const { provider, chain } = createJsonRpcProvider(chainKey, rpc, true);
      await probeProvider(provider);
      setRpcStatus("可用");
      const [rawBalance, txCount] = await Promise.all([
        provider.getBalance(walletAddress),
        provider.getTransactionCount(walletAddress),
      ]);
      const v = ethers.formatEther(rawBalance);
      setBalance(`${v} ${chain.symbol}`);
      setNonce(txCount);
      addLog({
        level: "success",
        category: "eth-balance",
        message: "余额查询成功",
        meta: { chainKey, walletAddress, balance: v, nonce: txCount },
      });
      message.success("查询成功");
    } catch (error) {
      setRpcStatus("不可用");
      setBalance("查询失败");
      addLog({
        level: "error",
        category: "eth-balance",
        message: "余额查询失败",
        meta: { chainKey, walletAddress, error: error?.message || "unknown" },
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

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Text strong>链</Text>
            <Select options={chainOptions} value={chainKey} onChange={handleChainChange} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Text strong>RPC（自动保存）</Text>
            <Input
              value={rpc}
              onChange={(e) => handleRpcChange(e.target.value)}
              placeholder="可选：自定义 RPC"
            />
          </div>
        </div>

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

export default GetBalanceByEther;
