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
  Alert,
  Card,
} from "antd";
import axios from "axios";
import { ethers } from "ethers";

const { Title, Text } = Typography;
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
      explorer: "https://etherscan.io/tx/",
      rpc: "https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
    },
    sepolia: {
      name: "Sepolia Testnet",
      api: "api-sepolia.etherscan.io",
      explorer: "https://sepolia.etherscan.io/tx/",
      rpc: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
    },
    goerli: {
      name: "Goerli Testnet",
      api: "api-goerli.etherscan.io",
      explorer: "https://goerli.etherscan.io/tx/",
      rpc: "https://eth-goerli.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
    },
    local: {
      name: "Local Hardhat",
      rpc: "http://127.0.0.1:8545",
      explorer: null,
    },
  };

  const transactionNumbers = {
    all: { name: "全部", value: Infinity },
    ten: { name: "最近十条", value: 10 },
    selfdefine: { name: "自定义", value: "custom" },
  };

  // 格式化时间函数
  const formatDate = (timestamp) => {
    try {
      const timestampSec = parseInt(timestamp); // 转为数字
      if (isNaN(timestampSec) || timestampSec <= 0) {
        return "未知";
      }
      const date = new Date(timestampSec * 1000); // 秒转毫秒
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // 月份从 0 开始
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return "未知";
    }
  };

  const columns = [
    {
      title: "交易哈希",
      dataIndex: "hash",
      key: "hash",
      render: (text) =>
        dataSource === "etherscan" && networkOptions[network].explorer ? (
          <a
            href={`${networkOptions[network].explorer}${text}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {`${text.slice(0, 6)}...${text.slice(-6)}`}
          </a>
        ) : (
          `${text.slice(0, 6)}...${text.slice(-6)}`
        ),
    },
    {
      title: "时间",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) => text || "未知", // 如果 timestamp 为空，显示 "未知"
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
    {
      title: "Gas 费用 (ETH)",
      dataIndex: "gasUsed",
      key: "gasUsed",
      render: (text, record) => {
        if (dataSource === "etherscan" && record.gasUsed && record.gasPrice) {
          try {
            const gasUsed = BigInt(record.gasUsed);
            const gasPrice = BigInt(record.gasPrice);
            return ethers.formatEther(gasUsed * gasPrice);
          } catch {
            return "计算失败";
          }
        }
        return "未知";
      },
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
    const customLimitValue = parseInt(customLimit);
    if (
      transactionLimit === "selfdefine" &&
      (!customLimitValue || customLimitValue <= 0)
    ) {
      message.error("请输入有效的自定义条目数量（正整数）");
      return;
    }

    setIsLoading(true);
    const apiDomain = networkOptions[network].api;
    const pageSize =
      transactionLimit === "selfdefine" ? customLimitValue : 1000;
    const url = `https://${apiDomain}/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${pageSize}&sort=desc&apikey=${apiKey}`;

    try {
      const response = await axios.get(url);
      console.log("Etherscan response:", response.data);
      if (response.data.status === "1") {
        if (response.data.result.length === 0) {
          message.warning("未找到交易记录，请确认地址和网络是否正确");
          setTransactions([]);
          return;
        }
        const allTransactions = response.data.result;
        const limitedTransactions = allTransactions.map((tx) => ({
          ...tx,
          timestamp: formatDate(tx.timeStamp), // 使用 timeStamp 字段
        }));
        if (transactionLimit === "ten") {
          setTransactions(limitedTransactions.slice(0, 10));
        } else if (transactionLimit === "selfdefine") {
          setTransactions(limitedTransactions.slice(0, customLimitValue));
        } else {
          setTransactions(limitedTransactions);
        }
        message.success(
          `查询 ${networkOptions[network].name} 交易成功，显示 ${limitedTransactions.length} 条记录`
        );
      } else {
        message.warning(`Etherscan 查询失败: ${response.data.message}`);
        setTransactions([]);
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        message.error("Etherscan API 速率限制，请稍后再试或升级账户");
      } else if (
        error.response &&
        error.response.data.message.includes("Invalid API Key")
      ) {
        message.error("Etherscan API Key 无效，请检查后重试");
      } else {
        message.error(
          `查询 ${networkOptions[network].name} 失败: ${error.message}`
        );
      }
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
    const customLimitValue = parseInt(customLimit);
    if (
      transactionLimit === "selfdefine" &&
      (!customLimitValue || customLimitValue <= 0)
    ) {
      message.error("请输入有效的自定义条目数量（正整数）");
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber();

      const latestBlock = await provider.getBlockNumber();
      const limit =
        transactionLimit === "ten"
          ? 10
          : transactionLimit === "selfdefine"
          ? customLimitValue
          : 500;
      const startBlock = Math.max(0, latestBlock - limit);

      console.log(`RPC 查询范围: ${startBlock} - ${latestBlock}`);

      let allTransactions = [];
      const addressLower = address.toLowerCase();

      for (let i = startBlock; i <= latestBlock; i++) {
        const block = await provider.getBlock(i, true);
        if (block && block.transactions && block.transactions.length > 0) {
          console.log(`Block ${i}: ${block.transactions.length} transactions`);
          const txs = block.transactions
            .filter((tx) => {
              const from = tx.from ? tx.from.toLowerCase() : "";
              const to = tx.to ? tx.to.toLowerCase() : "";
              return from === addressLower || to === addressLower;
            })
            .map((tx) => ({
              hash: tx.hash,
              timestamp: formatDate(block.timestamp), // 使用 block.timestamp
              from: tx.from || "未知",
              to: tx.to || null,
              value: tx.value.toString(),
            }));
          allTransactions = allTransactions.concat(txs);

          if (transactionLimit !== "all" && allTransactions.length >= limit) {
            break;
          }
        }
      }

      if (allTransactions.length === 0) {
        message.warning(
          "未在最近区块中找到相关交易，建议使用 Etherscan 查询完整历史"
        );
      } else {
        message.success(`RPC 查询成功，显示 ${allTransactions.length} 条记录`);
      }
      setTransactions(allTransactions);
    } catch (error) {
      if (error.code === "NETWORK_ERROR") {
        message.error("无法连接到 RPC 服务器，请检查网络或 RPC URL");
      } else if (error.code === "TIMEOUT") {
        message.error("RPC 查询超时，请减少查询范围或稍后重试");
      } else {
        message.error(`RPC 查询失败: ${error.message}`);
      }
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
    <div
      style={{
        margin: "20px",

        marginLeft: "0",
        marginRight: "auto",
      }}
    >
      <Title level={3}>钱包交易记录查询</Title>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          message="提示"
          description="RPC 查询仅扫描最近区块，可能会错过历史交易且速度较慢，建议优先使用 Etherscan API 获取完整记录。"
          type="info"
          showIcon
          closable
        />
        <Card style={{ border: "1px solid #e8e8e8" }}>
          <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <Radio.Group
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
            >
              <Radio value="etherscan">Etherscan API</Radio>
              <Radio value="rpc">RPC + Ethers.js</Radio>
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
                scroll={{ x: "max-content" }}
              />
            )}
          </Space>
        </Card>
      </Space>
    </div>
  );
}
