import { Select, Table, message, Input, Button, Tooltip } from "antd";
import { ethers } from "ethers";
import { Fragment, useState, useEffect, useCallback } from "react";
import { ReloadOutlined, QuestionCircleOutlined } from "@ant-design/icons";

export default function EthereumBasicData() {
  const [provider, setProvider] = useState(null);
  const [data, setData] = useState([
    {
      key: "1",
      function: "getChainId",
      description: "链ID",
      value: "-",
      unit: "",
    },
    {
      key: "2",
      function: "getBlockNumber",
      description: "区块号",
      value: "-",
      unit: "",
    },
    {
      key: "3",
      function: "getBlockTimestamp",
      description: "区块时间戳",
      value: "-",
      unit: "",
    },
    {
      key: "4",
      function: "getBlockHash",
      description: "区块哈希",
      value: "-",
      unit: "",
    },
    {
      key: "5",
      function: "getBlockTransactionCount",
      description: "区块交易数量",
      value: "-",
      unit: "笔",
    },
    {
      key: "6",
      function: "getBlockGasLimit",
      description: "区块gas限制",
      value: "-",
      unit: "Gwei",
    },
    {
      key: "7",
      function: "getBlockGasPrice",
      description: "区块gas价格",
      value: "-",
      unit: "Gwei",
    },
    {
      key: "8",
      function: "getBlockDifficulty",
      description: "区块难度",
      value: "-",
      unit: "Wei",
    },
    {
      key: "9",
      function: "getBlockMiner",
      description: "区块矿工",
      value: "-",
      unit: "",
    },
    {
      key: "10",
      function: "getBlockSize",
      description: "区块大小",
      value: "-",
      unit: "字节",
    },
    {
      key: "11",
      function: "getBlockParentHash",
      description: "区块父哈希",
      value: "-",
      unit: "",
    },
    {
      key: "12",
      function: "getBlockNonce",
      description: "区块nonce",
      value: "-",
      unit: "",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(null);
  const [rpcUrl, setRpcUrl] = useState("");
  const [countdown, setCountdown] = useState(0);

  // 获取网络配置
  const getNetworkConfig = (url) => {
    if (url.includes("sepolia")) {
      return {
        name: "sepolia",
        chainId: 11155111,
      };
    } else if (url.includes("mainnet")) {
      return {
        name: "mainnet",
        chainId: 1,
      };
    }
    return {
      name: "ethereum",
      chainId: 1,
    };
  };

  // 获取链上数据
  const fetchData = useCallback(async () => {
    if (!provider) {
      message.error("Provider未初始化");
      return;
    }

    setLoading(true);
    try {
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      const feeData = await provider.getFeeData();
      const network = await provider.getNetwork();

      const newData = [
        {
          key: "1",
          function: "getChainId",
          description: "链ID",
          value: network.chainId.toString(),
          unit: "",
        },
        {
          key: "2",
          function: "getBlockNumber",
          description: "区块号",
          value: blockNumber.toString(),
          unit: "",
        },
        {
          key: "3",
          function: "getBlockTimestamp",
          description: "区块时间戳",
          value: new Date(Number(block.timestamp) * 1000).toLocaleString(),
          unit: "",
        },
        {
          key: "4",
          function: "getBlockHash",
          description: "区块哈希",
          value: block.hash,
          unit: "",
        },
        {
          key: "5",
          function: "getBlockTransactionCount",
          description: "区块交易数量",
          value: block.transactions.length.toString(),
          unit: "笔",
        },
        {
          key: "6",
          function: "getBlockGasLimit",
          description: "区块gas限制",
          value: ethers.formatUnits(block.gasLimit, "gwei"),
          unit: "Gwei",
        },
        {
          key: "7",
          function: "getBlockGasPrice",
          description: "区块gas价格",
          value: feeData.gasPrice
            ? ethers.formatUnits(feeData.gasPrice, "gwei")
            : "0",
          unit: "Gwei",
        },
        {
          key: "8",
          function: "getBlockDifficulty",
          description: "区块难度",
          value: block.difficulty
            ? ethers.formatUnits(block.difficulty, "wei")
            : "0",
          unit: "Wei",
        },
        {
          key: "9",
          function: "getBlockMiner",
          description: "区块矿工",
          value: block.miner || "unknown",
          unit: "",
        },
        {
          key: "10",
          function: "getBlockSize",
          description: "区块大小",
          value: block.size ? ethers.formatUnits(block.size, "bytes") : "0",
          unit: "字节",
        },
        {
          key: "11",
          function: "getBlockParentHash",
          description: "区块父哈希",
          value: block.parentHash || "unknown",
          unit: "",
        },
        {
          key: "12",
          function: "getBlockNonce",
          description: "区块nonce",
          value: block.nonce ? block.nonce.toString() : "0",
          unit: "",
        },
      ];

      setData(newData);
    } catch (error) {
      message.error(`获取数据失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [provider]);

  // 处理倒计时和数据刷新
  useEffect(() => {
    let dataTimer;
    let countdownTimer;

    if (selectedInterval) {
      // 设置数据刷新定时器
      dataTimer = setInterval(fetchData, selectedInterval * 1000);
      // 设置倒计时定时器
      countdownTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return selectedInterval;
          }
          return prev - 1;
        });
      }, 1000);
      // 立即执行一次
      fetchData();
    }

    // 清理函数
    return () => {
      if (dataTimer) {
        clearInterval(dataTimer);
      }
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    };
  }, [selectedInterval, fetchData]);

  // 处理间隔选择
  const handleIntervalChange = (value) => {
    setSelectedInterval(value);
    setCountdown(value || 0);
  };

  // 验证RPC URL
  const validateRpcUrl = (url) => {
    if (!url) return false;
    // 检查是否是有效的URL
    try {
      new URL(url);
    } catch {
      return false;
    }
    // 检查是否是允许的域名
    const allowedDomains = [
      "eth.public-rpc.com",
      "rpc.ankr.com",
      "cloudflare-eth.com",
      "ethereum.publicnode.com",
      "alchemy.com",
      "infura.io",
      "sepolia.infura.io",
      "eth-sepolia.g.alchemy.com",
    ];
    const urlObj = new URL(url);
    return allowedDomains.some((domain) => urlObj.hostname.includes(domain));
  };

  // 处理RPC URL变更
  const handleRpcUrlChange = (value) => {
    if (value && !validateRpcUrl(value)) {
      message.error("仅支持以太坊主网和测试网的RPC节点");
      return;
    }

    // 清除provider
    setProvider(null);
    // 清除数据值，保留描述和单位
    setData(data.map((item) => ({ ...item, value: "-" })));
    // 清除定时器
    setSelectedInterval(null);
    setCountdown(0);
    // 设置新的RPC URL
    setRpcUrl(value);
  };

  // 初始化provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        if (!rpcUrl) return;
        const networkConfig = getNetworkConfig(rpcUrl);
        const provider = new ethers.JsonRpcProvider(rpcUrl, networkConfig);
        // 测试连接
        await provider.getBlockNumber();
        setProvider(provider);
      } catch (error) {
        message.error("初始化provider失败: " + error.message);
      }
    };
    if (rpcUrl) {
      initProvider();
    }
  }, [rpcUrl]);

  return (
    <Fragment>
      <div style={{ marginBottom: 16 }}>
        <span style={{ marginRight: 8 }}>RPC节点：</span>
        <Input
          style={{ width: 500 }}
          placeholder="输入以太坊主网或测试网RPC节点URL"
          value={rpcUrl}
          onChange={(e) => handleRpcUrlChange(e.target.value)}
        />
      </div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div>
          <span style={{ marginRight: 8 }}>
            更新间隔
            <Tooltip title="选择数据自动更新的时间间隔，选择停止更新后需要手动刷新">
              <QuestionCircleOutlined
                style={{ marginLeft: 4, color: "#999" }}
              />
            </Tooltip>
            ：
          </span>
          <Select
            style={{ width: 200 }}
            placeholder="选择更新间隔"
            onChange={handleIntervalChange}
            value={selectedInterval}
          >
            <Select.Option value={5}>5秒</Select.Option>
            <Select.Option value={10}>10秒</Select.Option>
            <Select.Option value={30}>30秒</Select.Option>
            <Select.Option value={60}>1分钟</Select.Option>
            <Select.Option value={null}>停止更新</Select.Option>
          </Select>
          {selectedInterval && (
            <span style={{ marginLeft: 8, color: "#666" }}>
              下次更新倒计时：{countdown}秒
            </span>
          )}
        </div>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={fetchData}
          loading={loading}
        >
          手动刷新
        </Button>
      </div>
      <Table
        dataSource={data}
        columns={[
          {
            title: "功能",
            dataIndex: "description",
            key: "description",
            width: "40%",
          },
          {
            title: "值",
            dataIndex: "value",
            key: "value",
            width: "40%",
          },
          {
            title: "单位",
            dataIndex: "unit",
            key: "unit",
            width: "20%",
          },
        ]}
        pagination={false}
        size="small"
        loading={loading}
        rowKey="key"
      />
    </Fragment>
  );
}
