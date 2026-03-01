import { Select, Input, Button, Card, Space, Typography, message } from "antd";
import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

const NETWORK_OPTIONS = [
  { value: "eth-mainnet", label: "ETH Mainnet", url: "https://api.etherscan.io/api" },
  { value: "eth-sepolia", label: "ETH Sepolia", url: "https://api-sepolia.etherscan.io/api" },
  { value: "eth-goerli", label: "ETH Goerli", url: "https://api-goerli.etherscan.io/api" },
];

export default function GetBalanceByEtherscanApi() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [network, setNetwork] = useState("eth-mainnet");
  const [walletAddress, setWalletAddress] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const apiUrl = useMemo(
    () => NETWORK_OPTIONS.find((item) => item.value === network)?.url || NETWORK_OPTIONS[0].url,
    [network]
  );

  const getResult = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      message.error("请输入有效钱包地址");
      return;
    }
    if (!settings.etherscanApiKey) {
      message.error("请先填写全局 Etherscan API Key");
      return;
    }

    const fullUrl = `${apiUrl}?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${settings.etherscanApiKey}`;
    setLoading(true);
    addLog({
      level: "info",
      category: "etherscan-balance",
      message: "开始调用 Etherscan 余额查询",
      meta: { network, walletAddress },
    });

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error("网络响应异常");
      }
      const jsonData = await response.json();
      if (jsonData.status === "1") {
        const value = ethers.formatUnits(jsonData.result, 18);
        setResult(value);
        addLog({
          level: "success",
          category: "etherscan-balance",
          message: "Etherscan 查询成功",
          meta: { network, walletAddress, result: value },
        });
        message.success("获取成功");
      } else {
        setResult(jsonData.result || "");
        addLog({
          level: "warning",
          category: "etherscan-balance",
          message: "Etherscan 返回失败状态",
          meta: { network, walletAddress, response: jsonData },
        });
        message.error(`获取失败: ${jsonData.message || "未知错误"}`);
      }
    } catch (error) {
      addLog({
        level: "error",
        category: "etherscan-balance",
        message: "Etherscan 查询异常",
        meta: { network, walletAddress, error: error?.message || "unknown" },
      });
      message.error(error?.message || "获取失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Etherscan API 查询余额">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Text strong>查询网络</Text>
            <Select
              options={NETWORK_OPTIONS.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              value={network}
              onChange={setNetwork}
            />
          </div>
          <div className="space-y-2">
            <Text strong>全局 API Key</Text>
            <Input.Password
              value={settings.etherscanApiKey}
              onChange={(e) => settings.setEtherscanApiKey(e.target.value)}
              placeholder="已自动复用全局配置"
            />
          </div>
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
          <Text>查询结果: {result ? `${result} ETH` : "-"}</Text>
        </Space>
      </Space>
    </Card>
  );
}
