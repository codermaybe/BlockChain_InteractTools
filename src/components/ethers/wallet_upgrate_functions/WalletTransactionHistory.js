import { useState } from "react";
import {
  Input,
  Table,
  Spin,
  message,
  Typography,
  Select,
  Space,
  Radio,
} from "antd";
import axios from "axios";
import { ethers } from "ethers";

const { Title } = Typography;
const { Option } = Select;

export default function WalletTransactionHistory() {
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("mainnet");
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [transactionLimit, setTransactionLimit] = useState("ten");
  const [customLimit, setCustomLimit] = useState("");
  const [dataSource, setDataSource] = useState("etherscan");

  const networkOptions = {
    mainnet: {
      name: "Ethereum Mainnet",
      api: "api.etherscan.io",
      rpc: "https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
    },
    sepolia: {
      name: "Sepolia Testnet",
      api: "api-sepolia.etherscan.io",
      rpc: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
    },
    goerli: {
      name: "Goerli Testnet",
      api: "api-goerli.etherscan.io",
      rpc: "https://eth-goerli.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
    },
    local: { name: "Local Hardhat", rpc: "http://127.0.0.1:8545" },
  };

  const transactionNumbers = {
    all: { name: "全部", value: Infinity },
    ten: { name: "最近十条", value: 10 },
    selfdefine: { name: "自定义", value: "custom" },
  };

  const columns = [
    {
      title: "交易哈希",
      dataIndex: "hash",
      key: "hash",
      render: (text) => `${text.slice(0, 6)}...${text.slice(-6)}`,
    },
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) =>
        text ? new Date(text * 1000).toLocaleString() : "未知",
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
      render: (text) =>
        text ? `${text.slice(0, 6)}...${text.slice(-6)}` : "创建合约",
    },
    {
      title: "金额 (ETH)",
      dataIndex: "value",
      key: "value",
      render: (text) => ethers.formatEther(text || "0"),
    },
  ];

  const fetchTransactionsByEtherscan = async () => {
    if (!ethers.isAddress(address)) {
      message.error("请输入有效的以太坊地址");
      return;
    }
    if (!apiKey) {
      message.error("请输入有效的 Etherscan API Key");
      return;
    }
    if (
      transactionLimit === "selfdefine" &&
      (!customLimit || customLimit <= 0)
    ) {
      message.error("请输入有效的自定义条目数量（正整数）");
      return;
    }

    setIsLoading(true);
    const apiDomain = networkOptions[network].api;
    const url = `https://${apiDomain}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

    try {
      const response = await axios.get(url);
      if (response.data.status === "1") {
        const allTransactions = response.data.result;
        let limitedTransactions = allTransactions;
        if (transactionLimit === "ten") {
          limitedTransactions = allTransactions.slice(0, 10);
        } else if (transactionLimit === "selfdefine") {
          limitedTransactions = allTransactions.slice(0, parseInt(customLimit));
        }
        setTransactions(limitedTransactions);
        message.success(
          `查询 ${networkOptions[network].name} 交易成功，显示 ${limitedTransactions.length} 条记录`
        );
      } else {
        message.warning("暂无交易记录");
        setTransactions([]);
      }
    } catch (error) {
      message.error(
        `查询 ${networkOptions[network].name} 失败: ${error.message}`
      );
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionsByRpc = async () => {
    if (!ethers.isAddress(address)) {
      message.error("请输入有效的以太坊地址");
      return;
    }
    if (!rpcUrl) {
      message.error("请输入有效的 RPC URL");
      return;
    }
    if (
      transactionLimit === "selfdefine" &&
      (!customLimit || customLimit <= 0)
    ) {
      message.error("请输入有效的自定义条目数量（正整数）");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const latestBlock = await provider.getBlockNumber();
      const limit =
        transactionLimit === "ten"
          ? 10
          : transactionLimit === "selfdefine"
          ? parseInt(customLimit)
          : 100;
      const startBlock = Math.max(0, latestBlock - limit);

      let allTransactions = [];
      for (let i = startBlock; i <= latestBlock; i++) {
        const block = await provider.getBlock(i, true); // includeTransactions: true
        if (block && block.transactions && block.transactions.length > 0) {
          const txs = block.transactions
            .filter((tx) => {
              const from = tx.from ? tx.from.toLowerCase() : "";
              const to = tx.to ? tx.to.toLowerCase() : "";
              const addr = address.toLowerCase();
              return from === addr || to === addr;
            })
            .map((tx) => ({
              hash: tx.hash,
              timestamp: block.timestamp,
              from: tx.from || "未知",
              to: tx.to || null,
              value: tx.value.toString(),
            }));
          allTransactions = allTransactions.concat(txs);
        }
      }

      // 根据限制截取交易
      let limitedTransactions = allTransactions;
      if (transactionLimit === "ten") {
        limitedTransactions = allTransactions.slice(0, 10);
      } else if (transactionLimit === "selfdefine") {
        limitedTransactions = allTransactions.slice(0, parseInt(customLimit));
      }

      setTransactions(limitedTransactions);
      message.success(
        `RPC 查询成功，显示 ${limitedTransactions.length} 条记录`
      );
    } catch (error) {
      message.error(`RPC 查询失败: ${error.message}`);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = () => {
    if (dataSource === "etherscan") {
      fetchTransactionsByEtherscan();
    } else {
      fetchTransactionsByRpc();
    }
  };

  return (
    <div style={{ margin: "20px" }}>
      <Title level={3}>钱包交易记录查询</Title>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Radio.Group
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
        >
          <Radio value="etherscan">Etherscan API</Radio>
          <Radio value="rpc">
            RPC + Ethers.js(需扫描所有区块，极大概率失败，还在测试中)
          </Radio>
        </Radio.Group>

        {dataSource === "etherscan" ? (
          <Input
            placeholder="请输入 Etherscan API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
            style={{ width: 400 }}
          />
        ) : (
          <Input
            placeholder="请输入 RPC URL (如 http://127.0.0.1:8545)"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
            disabled={isLoading}
            style={{ width: 400 }}
          />
        )}

        <Space
          size="middle"
          style={{ width: "100%", display: "flex", alignItems: "center" }}
        >
          {dataSource === "etherscan" && (
            <Select
              value={network}
              onChange={(value) => setNetwork(value)}
              style={{ width: 200 }}
              disabled={isLoading}
            >
              {Object.entries(networkOptions).map(([key, { name }]) => (
                <Option key={key} value={key}>
                  {name}
                </Option>
              ))}
            </Select>
          )}
          <Select
            value={transactionLimit}
            onChange={(value) => setTransactionLimit(value)}
            style={{ width: 150 }}
            disabled={isLoading}
          >
            {Object.entries(transactionNumbers).map(([key, { name }]) => (
              <Option key={key} value={key}>
                {name}
              </Option>
            ))}
          </Select>
          {transactionLimit === "selfdefine" && (
            <Input
              placeholder="请输入条目数量"
              value={customLimit}
              onChange={(e) => setCustomLimit(e.target.value)}
              type="number"
              min={1}
              style={{ width: 150 }}
              disabled={isLoading}
            />
          )}
          <Input.Search
            placeholder="请输入以太坊地址 (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            enterButton="查询"
            onSearch={fetchTransactions}
            style={{ width: "100%", minWidth: 300 }}
            disabled={isLoading}
          />
        </Space>

        {isLoading ? (
          <Spin
            tip="查询中..."
            style={{ display: "block", textAlign: "center" }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={transactions}
            rowKey="hash"
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: "暂无交易记录" }}
          />
        )}
      </Space>
    </div>
  );
}
