import { Select, Table, message, Input, Button, Tooltip, Card, Space, Typography } from "antd";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ReloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { getChainOptions } from "../../../config/chainRegistry";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

const EMPTY_ROWS = [
  { key: "1", description: "链ID", value: "-", unit: "" },
  { key: "2", description: "区块号", value: "-", unit: "" },
  { key: "3", description: "区块时间戳", value: "-", unit: "" },
  { key: "4", description: "区块哈希", value: "-", unit: "" },
  { key: "5", description: "区块交易数量", value: "-", unit: "笔" },
  { key: "6", description: "区块gas限制", value: "-", unit: "Gwei" },
  { key: "7", description: "区块gas价格", value: "-", unit: "Gwei" },
];

export default function EthereumBasicData() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [provider, setProvider] = useState(null);
  const [data, setData] = useState(EMPTY_ROWS);
  const [loading, setLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [rpcUrl, setRpcUrl] = useState(settings.getRpcOverride(settings.preferredChainKey));

  const fetchData = useCallback(async () => {
    if (!provider) {
      message.error("Provider 未初始化");
      return;
    }
    setLoading(true);
    try {
      const [blockNumber, block, feeData, network] = await Promise.all([
        provider.getBlockNumber(),
        provider.getBlock("latest"),
        provider.getFeeData(),
        provider.getNetwork(),
      ]);

      setData([
        { key: "1", description: "链ID", value: network.chainId.toString(), unit: "" },
        { key: "2", description: "区块号", value: blockNumber.toString(), unit: "" },
        {
          key: "3",
          description: "区块时间戳",
          value: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toLocaleString() : "-",
          unit: "",
        },
        { key: "4", description: "区块哈希", value: block?.hash || "-", unit: "" },
        {
          key: "5",
          description: "区块交易数量",
          value: block?.transactions?.length?.toString() || "0",
          unit: "笔",
        },
        {
          key: "6",
          description: "区块gas限制",
          value: block?.gasLimit ? ethers.formatUnits(block.gasLimit, "gwei") : "0",
          unit: "Gwei",
        },
        {
          key: "7",
          description: "区块gas价格",
          value: feeData?.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "0",
          unit: "Gwei",
        },
      ]);
    } catch (error) {
      addLog({
        level: "error",
        category: "basic-chain-data",
        message: "基础链数据刷新失败",
        meta: { chainKey, error: error?.message || "unknown" },
      });
      message.error(`获取数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [provider, chainKey]);

  const initProvider = async (nextChainKey, nextRpc) => {
    try {
      const { provider: p } = createJsonRpcProvider(nextChainKey, nextRpc, true);
      const probe = await probeProvider(p);
      setProvider(p);
      message.success(`已连接 EVM RPC，chainId=${probe.chainId}`);
      addLog({
        level: "success",
        category: "basic-chain-data",
        message: "基础数据模块 RPC 连接成功",
        meta: { chainKey: nextChainKey, chainId: probe.chainId },
      });
    } catch (error) {
      setProvider(null);
      message.error(`初始化 provider 失败: ${error?.message || "未知错误"}`);
    }
  };

  useEffect(() => {
    initProvider(chainKey, rpcUrl);
  }, []);

  useEffect(() => {
    let dataTimer;
    let countdownTimer;
    if (selectedInterval) {
      dataTimer = setInterval(fetchData, selectedInterval * 1000);
      countdownTimer = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? selectedInterval : prev - 1));
      }, 1000);
      fetchData();
    }
    return () => {
      if (dataTimer) clearInterval(dataTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [selectedInterval, fetchData]);

  const handleChainChange = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    const nextRpc = settings.getRpcOverride(value);
    setRpcUrl(nextRpc);
    initProvider(value, nextRpc);
  };

  const handleRpcChange = (value) => {
    setRpcUrl(value);
    settings.setRpcOverride(chainKey, value);
    setProvider(null);
  };

  return (
    <Card title="基础链数据面板">
      <Space direction="vertical" style={{ width: "100%" }}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Text strong>链</Text>
            <Select options={getChainOptions()} value={chainKey} onChange={handleChainChange} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Text strong>RPC（自动保存）</Text>
            <Input
              value={rpcUrl}
              placeholder="输入 EVM 兼容链 RPC URL"
              onChange={(e) => handleRpcChange(e.target.value)}
            />
          </div>
        </div>

        <Space wrap>
          <Button onClick={() => initProvider(chainKey, rpcUrl)}>连接RPC</Button>
          <span>
            更新间隔
            <Tooltip title="选择数据自动更新的时间间隔">
              <QuestionCircleOutlined style={{ marginLeft: 4, color: "#999" }} />
            </Tooltip>
            ：
          </span>
          <Select
            style={{ width: 180 }}
            placeholder="选择更新间隔"
            onChange={(value) => {
              setSelectedInterval(value);
              setCountdown(value || 0);
            }}
            value={selectedInterval}
            options={[
              { label: "5秒", value: 5 },
              { label: "10秒", value: 10 },
              { label: "30秒", value: 30 },
              { label: "1分钟", value: 60 },
              { label: "停止更新", value: null },
            ]}
          />
          {selectedInterval && <Text type="secondary">下次更新倒计时：{countdown}秒</Text>}
          <Button type="primary" icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            手动刷新
          </Button>
        </Space>

        <Table
          dataSource={data}
          columns={[
            { title: "功能", dataIndex: "description", key: "description", width: "38%" },
            { title: "值", dataIndex: "value", key: "value", width: "42%" },
            { title: "单位", dataIndex: "unit", key: "unit", width: "20%" },
          ]}
          pagination={false}
          size="small"
          loading={loading}
          rowKey="key"
        />
      </Space>
    </Card>
  );
}
