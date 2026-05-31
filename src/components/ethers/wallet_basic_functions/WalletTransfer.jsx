import { useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, Card, Input, Space, Typography, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { createSigner } from "../../../services/evm/signerFactory.js";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useChainRpc } from "../../../hooks/useChainRpc.js";
import { useSensitiveInput } from "../../../hooks/useSensitiveInput.js";
import { useTaskLog } from "../../../state/TaskLogContext";
import ChainRpcSelector from "../../../components/shared/ChainRpcSelector.jsx";
import SensitiveField from "../../../components/shared/SensitiveField.jsx";

const { Text } = Typography;

export default function WalletTransfer() {
  const chain = useChainRpc();
  const privateKey = useSensitiveInput();
  const { addLog } = useTaskLog();
  const [targetAddress, setTargetAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  const validateInputs = () => {
    if (!privateKey.value || privateKey.value.length < 64) {
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
      category: LOG_CATEGORY.WALLET_TRANSFER,
      message: "开始转账",
      meta: { chainKey: chain.chainKey, targetAddress, amount },
    });

    try {
      const { provider } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      await probeProvider(provider);
      const wallet = createSigner(chain.chainKey, privateKey.getOnce(), chain.rpc);

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
        category: LOG_CATEGORY.WALLET_TRANSFER,
        message: "转账成功",
        meta: { chainKey: chain.chainKey, txHash: txResponse.hash, amount, targetAddress },
      });
    } catch (error) {
      const errorMsg = error?.message || "转账失败";
      addLog({
        level: "error",
        category: LOG_CATEGORY.WALLET_TRANSFER,
        message: "转账失败",
        meta: { chainKey: chain.chainKey, error: errorMsg, targetAddress, amount },
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
          type="warning"
          showIcon
          message="高风险操作"
          description="转账会发起真实链上交易。请确认链、RPC、目标地址和金额后再执行，建议先小额测试。"
        />
        <ChainRpcSelector {...chain} disabled={isLoading} />
        <SensitiveField {...privateKey} label="私钥" showWarning={false} />
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
