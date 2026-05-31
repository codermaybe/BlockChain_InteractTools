import { Input, Button, Card, Space, Typography, message } from "antd";
import { useState } from "react";
import { ethers } from "ethers";
import { LOG_CATEGORY } from "../../../../config/categories.js";
import { fetchNativeBalance } from "../../../../services/explorer/explorerApiService.js";
import { useChainRpc } from "../../../../hooks/useChainRpc.js";
import { useAppSettings } from "../../../../state/AppSettingsContext";
import { useTaskLog } from "../../../../state/TaskLogContext";
import ChainRpcSelector from "../../../shared/ChainRpcSelector.jsx";

const { Text } = Typography;

export default function GetBalanceByEtherscanApi() {
  const chain = useChainRpc();
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const getResult = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      message.error("请输入有效钱包地址");
      return;
    }
    if (!settings.etherscanApiKey) {
      message.error("请先填写全局 Etherscan API Key");
      return;
    }

    setLoading(true);
    addLog({
      level: "info",
      category: LOG_CATEGORY.ETHERSCAN_BALANCE,
      message: "开始调用浏览器 API 余额查询",
      meta: { chainKey: chain.chainKey, walletAddress },
    });

    try {
      const data = await fetchNativeBalance({
        chainKey: chain.chainKey,
        address: walletAddress,
        apiKey: settings.etherscanApiKey,
      });
      const value = ethers.formatUnits(data.result || "0", 18);
      const output = `${value} ${data.chain.symbol}`;
      setResult(output);
      addLog({
        level: "success",
        category: LOG_CATEGORY.ETHERSCAN_BALANCE,
        message: "浏览器 API 余额查询成功",
        meta: { chainKey: chain.chainKey, walletAddress, result: value },
      });
      message.success("获取成功");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.ETHERSCAN_BALANCE,
        message: "浏览器 API 余额查询异常",
        meta: { chainKey: chain.chainKey, walletAddress, error: error?.message || "unknown" },
      });
      message.error(error?.message || "获取失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="浏览器 API 查询余额">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <ChainRpcSelector {...chain} />

        <div className="space-y-2">
          <Text strong>全局 API Key</Text>
          <Input.Password
            value={settings.etherscanApiKey}
            onChange={(e) => settings.setEtherscanApiKey(e.target.value)}
            placeholder="已自动复用全局配置"
          />
        </div>

        <div className="space-y-2">
          <Text strong>钱包地址</Text>
          <Input
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
          />
        </div>

        <Space wrap>
          <Button type="primary" onClick={getResult} loading={loading}>
            开始查询
          </Button>
          <Text>查询结果: {result || "-"}</Text>
        </Space>
      </Space>
    </Card>
  );
}
