import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, Card, Input, Select, Space, Typography, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { getChainOptions } from "../../../config/chainRegistry";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

export default function WalletTransfer() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [rpc, setRpc] = useState(settings.getRpcOverride(settings.preferredChainKey));
  const [privateKey, setPrivateKey] = useState("");
  const [targetAddress, setTargetAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

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

  const validateInputs = () => {
    const rpcLower = (rpc || "").toLowerCase();
    if (!rpcLower || (!rpcLower.startsWith("http://") && !rpcLower.startsWith("https://"))) {
      message.error("请输入有效 RPC 地址");
      return false;
    }
    if (!privateKey || privateKey.length < 64) {
      message.error("请输入有效私钥");
      return false;
    }
    if (!ethers.isAddress(targetAddress)) {
      message.error("请输入有效目标地址");
      return false;
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      message.error("请输入有效数量");
      return false;
    }
    return true;
  };

  const handleTransfer = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setTxHash("");
    addLog({
      level: "info",
      category: "wallet-transfer",
      message: "开始转账",
      meta: { chainKey, targetAddress, amount },
    });

    try {
      const { provider } = createJsonRpcProvider(chainKey, rpc, true);
      await probeProvider(provider);
      const wallet = new ethers.Wallet(privateKey, provider);

      const balance = await provider.getBalance(wallet.address);
      const amountWei = ethers.parseEther(amount);
      if (balance < amountWei) {
        throw new Error("账户余额不足");
      }

      const txResponse = await wallet.sendTransaction({
        to: targetAddress,
        value: amountWei,
      });

      message.loading({ content: "交易处理中...", key: "tx", duration: 0 });
      await txResponse.wait();
      message.destroy("tx");
      message.success("转账成功");
      setTxHash(txResponse.hash);
      addLog({
        level: "success",
        category: "wallet-transfer",
        message: "转账成功",
        meta: { chainKey, txHash: txResponse.hash, amount, targetAddress },
      });
    } catch (e) {
      const errorMsg = e?.message || "转账失败";
      addLog({
        level: "error",
        category: "wallet-transfer",
        message: "转账失败",
        meta: { chainKey, error: errorMsg, targetAddress, amount },
      });
      message.error(`转账失败: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="以太坊转账">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          type="info"
          showIcon
          message="说明"
          description="链与 RPC 自动复用全局配置。建议先进行小额测试。"
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
              disabled={isLoading}
              allowClear
            />
          </div>
        </div>
        <Input.Password
          placeholder="私钥"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          disabled={isLoading}
          allowClear
        />
        <Input
          placeholder="目标地址 (0x...)"
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          disabled={isLoading}
          allowClear
        />
        <Input
          placeholder="转账数量 (ETH)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isLoading}
          allowClear
          addonAfter="ETH"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleTransfer}
          loading={isLoading}
          block
        >
          {isLoading ? "转账中..." : "发起转账"}
        </Button>

        {txHash && (
          <Text type="success" copyable>
            交易哈希: {txHash}
          </Text>
        )}
      </Space>
    </Card>
  );
}
