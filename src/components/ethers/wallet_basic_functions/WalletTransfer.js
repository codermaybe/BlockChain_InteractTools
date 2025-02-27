import { ethers } from "ethers";
import { Fragment, useState } from "react";
import { Button, Input, message, Card, Typography, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function WalletTransfer() {
  const [rpc, setRpc] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [targetAddress, setTargetAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState("");

  // 输入验证函数
  const validateInputs = () => {
    // 检查 RPC 地址（忽略大小写，支持 http/https）
    const rpcLower = (rpc || "").toLowerCase();
    if (
      !rpcLower ||
      (!rpcLower.startsWith("http://") && !rpcLower.startsWith("https://"))
    ) {
      message.error("请输入有效的 RPC 地址（如 http:// 或 https://...）");
      return false;
    }
    if (!privateKey || privateKey.length < 64) {
      message.error("请输入有效的私钥（通常为 64 位十六进制字符）");
      return false;
    }
    if (!ethers.isAddress(targetAddress)) {
      message.error("请输入有效的目标以太坊地址（以 0x 开头）");
      return false;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      message.error("请输入有效的转账数量（正数 ETH）");
      return false;
    }
    return true;
  };

  // 处理转账
  const handleTransfer = async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setTxHash("");

    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      const wallet = new ethers.Wallet(privateKey, provider);

      // 检查余额
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
      message.success({
        content: "转账成功！",
        duration: 2,
      });
      setTxHash(txResponse.hash);
    } catch (e) {
      let errorMsg = "转账失败";
      if (e.code === "INVALID_ARGUMENT") {
        errorMsg = "输入参数无效，请检查私钥或地址";
      } else if (e.code === "SERVER_ERROR" || e.code === "NETWORK_ERROR") {
        errorMsg = "RPC 服务器错误，请检查 RPC 地址或网络";
      } else if (e.message.includes("insufficient funds")) {
        errorMsg = "账户余额不足";
      } else {
        errorMsg = `转账失败: ${e.message}`;
      }
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Fragment>
      <br />
      <Card
        style={{
          border: "1px solid #1890ff",
        }}
        title={<Title level={3}>以太坊转账</Title>}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Input
            placeholder="RPC 地址 (如 http:// 或 https://...)"
            value={rpc}
            onChange={(e) => setRpc(e.target.value)}
            disabled={isLoading}
            allowClear
          />
          <Input.Password
            placeholder="私钥 (确保安全，勿泄露)"
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
            <Text type="success">
              交易哈希: <p style={{ color: "red" }}>{txHash}</p>
            </Text>
          )}
        </Space>
      </Card>
    </Fragment>
  );
}
