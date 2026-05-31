import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Select, Space, Switch, Table, Tag, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import { EVM_CHAIN_REGISTRY } from "../../config/chainRegistry";
import { createJsonRpcProvider } from "../../services/evm/providerFactory";
import { LOG_CATEGORY } from "../../config/categories.js";
import { useAppSettings } from "../../state/AppSettingsContext";
import { useTaskLog } from "../../state/TaskLogContext";

const { Text } = Typography;

function toGwei(value) {
  if (!value) return "-";
  return Number(ethers.formatUnits(value, "gwei")).toFixed(3);
}

export default function MultiChainGasBoard() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [intervalSec, setIntervalSec] = useState(15);

  const chainKeys = useMemo(
    () => EVM_CHAIN_REGISTRY.map((chain) => chain.key),
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    addLog({
      level: "info",
      category: LOG_CATEGORY.GAS_BOARD,
      message: "开始刷新多链 Gas 数据",
      meta: { chainCount: chainKeys.length },
    });
    try {
      const tasks = chainKeys.map(async (chainKey) => {
        const overrideRpc = settings.getEvmRpcOverride(chainKey);
        const { provider, chain, rpcUrl } = createJsonRpcProvider(
          chainKey,
          overrideRpc,
          true
        );
        try {
          const [network, blockNumber, feeData] = await Promise.all([
            provider.getNetwork(),
            provider.getBlockNumber(),
            provider.getFeeData(),
          ]);

          return {
            key: chain.key,
            chain: chain.name,
            chainId: Number(network.chainId),
            blockNumber,
            gasPrice: toGwei(feeData.gasPrice),
            maxFee: toGwei(feeData.maxFeePerGas),
            priorityFee: toGwei(feeData.maxPriorityFeePerGas),
            rpcUrl,
            status: "ok",
          };
        } catch (error) {
          return {
            key: chain.key,
            chain: chain.name,
            chainId: chain.chainId,
            blockNumber: "-",
            gasPrice: "-",
            maxFee: "-",
            priorityFee: "-",
            rpcUrl,
            status: error?.message || "RPC不可用",
          };
        }
      });

      const data = await Promise.all(tasks);
      setRows(data);
      const failedCount = data.filter((item) => item.status !== "ok").length;
      addLog({
        level: failedCount > 0 ? "warning" : "success",
        category: LOG_CATEGORY.GAS_BOARD,
        message: "多链 Gas 数据刷新完成",
        meta: { failedCount, total: data.length },
      });
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.GAS_BOARD,
        message: "多链 Gas 刷新失败",
        meta: { error: error?.message || "unknown" },
      });
      message.error(error?.message || "Gas 数据查询失败");
    } finally {
      setLoading(false);
    }
  }, [addLog, chainKeys, settings]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!autoRefresh) return undefined;
    const timer = setInterval(loadData, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [autoRefresh, intervalSec, loadData]);

  return (
    <Card title="多链 Gas 面板">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
            刷新
          </Button>
          <Space>
            <Text>自动刷新</Text>
            <Switch checked={autoRefresh} onChange={setAutoRefresh} />
          </Space>
          <Space>
            <Text>间隔</Text>
            <Select
              style={{ width: 130 }}
              value={intervalSec}
              onChange={setIntervalSec}
              options={[
                { label: "10 秒", value: 10 },
                { label: "15 秒", value: 15 },
                { label: "30 秒", value: 30 },
                { label: "60 秒", value: 60 },
              ]}
            />
          </Space>
        </Space>

        <Table
          rowKey="key"
          dataSource={rows}
          loading={loading}
          pagination={false}
          scroll={{ x: "max-content" }}
          columns={[
            { title: "链", dataIndex: "chain", key: "chain", width: 140 },
            { title: "ChainId", dataIndex: "chainId", key: "chainId", width: 100 },
            { title: "区块号", dataIndex: "blockNumber", key: "blockNumber", width: 140 },
            { title: "GasPrice (Gwei)", dataIndex: "gasPrice", key: "gasPrice", width: 150 },
            { title: "MaxFee (Gwei)", dataIndex: "maxFee", key: "maxFee", width: 150 },
            {
              title: "PriorityFee (Gwei)",
              dataIndex: "priorityFee",
              key: "priorityFee",
              width: 170,
            },
            {
              title: "状态",
              dataIndex: "status",
              key: "status",
              render: (status) =>
                status === "ok" ? (
                  <Tag color="success">正常</Tag>
                ) : (
                  <Tag color="error">{status}</Tag>
                ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}
