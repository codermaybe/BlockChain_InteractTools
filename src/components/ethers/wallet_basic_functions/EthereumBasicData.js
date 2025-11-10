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

  // 简单 URL 校验：仅校验格式与协议，EVM 兼容性通过链上接口实测
  const isValidUrl = (url) => {
    if (!url) return false;
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
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
          value: block.size ? block.size.toString() : "0",
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

  // 处理RPC URL变更
  const handleRpcUrlChange = (value) => {
    if (value && !isValidUrl(value)) {
      message.error("RPC URL 格式不正确（需 http/https）");
      return;
    }

    // 清除provider
    setProvider(null);
    // 清除数据值，保留描述和单位
    setData((prev) => prev.map((item) => ({ ...item, value: "-" })));
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
        const p = new ethers.JsonRpcProvider(rpcUrl);
        // 探测是否为 EVM 兼容：eth_chainId
        const chainIdHex = await p.send("eth_chainId", []);
        const chainId = parseInt(chainIdHex, 16);
        if (!Number.isFinite(chainId)) {
          throw new Error("RPC 非 EVM 兼容（无法获取 chainId）");
        }
        // 进一步验证：获取最新区块号
        await p.getBlockNumber();
        setProvider(p);
        message.success(`已连接 EVM RPC，chainId=${chainId}`);
      } catch (error) {
        message.error(
          "初始化 provider 失败：" +
            (error && error.message
              ? error.message
              : "该 RPC 非 EVM 兼容或不可用")
        );
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
          placeholder="输入 EVM 兼容链 RPC URL（如以太坊/BSC/Polygon 等）"
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
