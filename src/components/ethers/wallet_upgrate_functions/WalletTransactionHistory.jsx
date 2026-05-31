import { useMemo, useState } from "react";
import {
  Alert,
  Card,
  Input,
  Radio,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  message,
} from "antd";
import { ethers } from "ethers";
import { createJsonRpcProvider } from "../../../services/evm/providerFactory";
import { fetchTxList } from "../../../services/explorer/explorerApiService.js";
import { LOG_CATEGORY } from "../../../config/categories.js";
import { useChainRpc } from "../../../hooks/useChainRpc.js";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";
import ChainRpcSelector from "../../../components/shared/ChainRpcSelector.jsx";

const { Title } = Typography;

const LIMIT_OPTIONS = {
  all: { name: "全部", value: Infinity },
  ten: { name: "最近十条", value: 10 },
  selfdefine: { name: "自定义", value: "custom" },
};

function formatDate(timestamp) {
  try {
    const sec = parseInt(timestamp, 10);
    if (!Number.isFinite(sec) || sec <= 0) return "未知";
    const date = new Date(sec * 1000);
    if (Number.isNaN(date.getTime())) return "未知";
    return date.toLocaleString();
  } catch {
    return "未知";
  }
}

export default function WalletTransactionHistory() {
  const chain = useChainRpc();
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [address, setAddress] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionLimit, setTransactionLimit] = useState("ten");
  const [customLimit, setCustomLimit] = useState("");
  const [dataSource, setDataSource] = useState("etherscan");

  const columns = useMemo(
    () => [
      {
        title: "交易哈希",
        dataIndex: "hash",
        key: "hash",
        render: (text) =>
          chain.chainKey && text ? `${text.slice(0, 6)}...${text.slice(-6)}` : text,
      },
      {
        title: "时间",
        dataIndex: "timestamp",
        key: "timestamp",
      },
      {
        title: "发送者",
        dataIndex: "from",
        key: "from",
        render: (text) => `${text.slice(0, 6)}...${text.slice(-6)}`,
      },
      {
        title: "接收者",
        dataIndex: "to",
        key: "to",
        render: (text) => (text ? `${text.slice(0, 6)}...${text.slice(-6)}` : "创建合约"),
      },
      {
        title: "金额 (ETH)",
        dataIndex: "value",
        key: "value",
        render: (text) => ethers.formatEther(text || "0"),
      },
    ],
    [chain.chainKey]
  );

  const resolveLimit = () => {
    const customLimitValue = parseInt(customLimit, 10);
    if (transactionLimit === "ten") return 10;
    if (transactionLimit === "selfdefine") return customLimitValue;
    return 500;
  };

  const validateInputs = () => {
    if (!ethers.isAddress(address)) {
      message.error("请输入有效的以太坊地址");
      return false;
    }
    if (dataSource === "etherscan" && !settings.etherscanApiKey) {
      message.error("请先填写全局 Etherscan API Key");
      return false;
    }
    if (dataSource === "rpc" && !chain.rpc) {
      message.error("请输入有效的 RPC URL");
      return false;
    }
    if (transactionLimit === "selfdefine" && (!resolveLimit() || resolveLimit() <= 0)) {
      message.error("请输入有效的自定义条目数量");
      return false;
    }
    return true;
  };

  const fetchTransactionsByRpc = async () => {
    const provider = createJsonRpcProvider(chain.chainKey, chain.rpc, true).provider;
    const latestBlock = await provider.getBlockNumber();
    const limit = resolveLimit();
    const startBlock = Math.max(0, latestBlock - limit);
    const blocks = await Promise.all(
      Array.from({ length: latestBlock - startBlock + 1 }).map((_, i) =>
        provider.getBlock(startBlock + i, true)
      )
    );

    const addressLower = address.toLowerCase();
    const all = [];
    blocks.forEach((block) => {
      if (!block || !block.transactions) return;
      block.transactions.forEach((tx) => {
        const from = tx.from ? tx.from.toLowerCase() : "";
        const to = tx.to ? tx.to.toLowerCase() : "";
        if (from !== addressLower && to !== addressLower) return;
        all.push({
          hash: tx.hash,
          timestamp: formatDate(block.timestamp),
          from: tx.from || "未知",
          to: tx.to || null,
          value: tx.value?.toString() || "0",
        });
      });
    });
    return all.slice(0, limit);
  };

  const fetchTransactions = async () => {
    if (!validateInputs()) return;
    setIsLoading(true);
    addLog({
      level: "info",
      category: LOG_CATEGORY.TX_HISTORY,
      message: "开始查询交易记录",
      meta: { dataSource, chainKey: chain.chainKey, address },
    });

    try {
      const records =
        dataSource === "etherscan"
          ? (await fetchTxList({
              chainKey: chain.chainKey,
              address,
              apiKey: settings.etherscanApiKey,
              offset: resolveLimit() || 50,
            })).result.map((tx) => ({
              ...tx,
              timestamp: formatDate(tx.timeStamp),
            }))
          : await fetchTransactionsByRpc();

      const nextRecords =
        transactionLimit === "ten"
          ? records.slice(0, 10)
          : transactionLimit === "selfdefine"
            ? records.slice(0, resolveLimit())
            : records;

      setTransactions(nextRecords);
      addLog({
        level: "success",
        category: LOG_CATEGORY.TX_HISTORY,
        message: "交易记录查询完成",
        meta: { dataSource, chainKey: chain.chainKey, address, count: nextRecords.length },
      });
      message.success(`查询成功，共 ${nextRecords.length} 条`);
    } catch (error) {
      setTransactions([]);
      addLog({
        level: "error",
        category: LOG_CATEGORY.TX_HISTORY,
        message: "交易记录查询失败",
        meta: { dataSource, chainKey: chain.chainKey, address, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-4">
      <Title level={4} style={{ marginBottom: 0 }}>
        钱包交易记录查询
      </Title>
      <Alert
        message="提示"
        description="API Key 与默认 RPC 已接入全局配置，页面切换后可复用。"
        type="info"
        showIcon
      />

      <Card style={{ border: "1px solid #e8e8e8" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Radio.Group value={dataSource} onChange={(e) => setDataSource(e.target.value)}>
            <Radio value="etherscan">Etherscan API</Radio>
            <Radio value="rpc">RPC + Ethers.js</Radio>
          </Radio.Group>

          <ChainRpcSelector {...chain} />

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <Select
              value={transactionLimit}
              onChange={(value) => setTransactionLimit(value)}
              options={Object.entries(LIMIT_OPTIONS).map(([key, item]) => ({
                value: key,
                label: item.name,
              }))}
              disabled={isLoading}
            />

            {transactionLimit === "selfdefine" && (
              <Input
                placeholder="条目数量"
                value={customLimit}
                onChange={(e) => setCustomLimit(e.target.value)}
                type="number"
                min={1}
                disabled={isLoading}
              />
            )}

            {dataSource === "etherscan" && (
              <Input.Password
                placeholder="全局 Etherscan API Key"
                value={settings.etherscanApiKey}
                onChange={(e) => settings.setEtherscanApiKey(e.target.value)}
                disabled={isLoading}
              />
            )}
          </div>

          <Input.Search
            placeholder="请输入以太坊地址 (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            enterButton="查询"
            onSearch={fetchTransactions}
            disabled={isLoading}
          />

          {isLoading ? (
            <Spin tip="查询中..." style={{ display: "block", textAlign: "center" }} />
          ) : (
            <Table
              columns={columns}
              dataSource={transactions}
              rowKey="hash"
              pagination={{ pageSize: 6 }}
              locale={{ emptyText: "暂无交易记录" }}
              scroll={{ x: "max-content" }}
            />
          )}
        </Space>
      </Card>
    </div>
  );
}
