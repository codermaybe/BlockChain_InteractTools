import React, { Fragment, useState, useRef, useEffect } from "react";
import { ethers } from "ethers";
import { Input, Card, Form, Button, Table, message } from "antd";

export default function ContractEventListener() {
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [parsedAbiItems, setParsedAbiItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [detectedEvents, setDetectedEvents] = useState([]);

  // 使用 ref 来跟踪合约状态，防止重复初始化
  const contractRef = useRef(null);
  const listenersRef = useRef([]);

  useEffect(() => {
    console.log("Detected events updated:", detectedEvents);
  }, [detectedEvents]);

  // 解析ABI并提取方法和事件
  const parseAbiItems = (abiString) => {
    if (!abiString) {
      message.error("ABI 不能为空");
      return;
    }
    try {
      const parsedAbi = JSON.parse(abiString);
      const items = parsedAbi.filter(
        (item) => item.type === "event" || item.type === "function"
      );

      const formattedItems = items.map((item, index) => ({
        key: index,
        name: item.name,
        type: item.type,
        inputs: item.inputs
          ? item.inputs.map((input) => `${input.type} ${input.name}`).join(", ")
          : "无参数",
      }));

      setParsedAbiItems(formattedItems);
      message.success(`解析成功，共找到 ${formattedItems.length} 个方法和事件`);
    } catch (error) {
      message.error("ABI 解析失败，请检查 JSON 格式");
    }
  };

  // 初始化合约实例
  const initializeContract = () => {
    if (contractRef.current) {
      return contractRef.current;
    }
    try {
      if (!rpcUrl || !contractAddress || !abi) {
        message.error("请填写所有必填字段");
        return null;
      }
      if (!rpcUrl.startsWith("http") && !rpcUrl.startsWith("ws")) {
        message.error("RPC URL 格式无效");
        return null;
      }
      const parsedAbi = JSON.parse(abi);
      const newProvider = new ethers.JsonRpcProvider(rpcUrl);
      const newContract = new ethers.Contract(
        contractAddress,
        parsedAbi,
        newProvider
      );
      contractRef.current = newContract;
      return newContract;
    } catch (error) {
      message.error("初始化合约时出错: " + error.message);
      return null;
    }
  };

  // 开始监听选中的事件和方法
  const startEventListening = async () => {
    stopEventListening(); // 先停止旧的监听器
    const contract = initializeContract();
    if (!contract) {
      message.error("合约未成功初始化");
      return;
    }
    try {
      selectedItems.forEach((selectedItem) => {
        const item = parsedAbiItems[selectedItem];
        if (item.type === "event") {
          const listener = (...args) => {
            const filteredArgs = args.slice(0, -1);
            const eventInfo = {
              name: item.name,
              type: "事件",
              args: filteredArgs.map((arg, index) => {
                if (ethers.isAddress(arg)) {
                  return `地址: ${arg}`;
                }
                try {
                  const bigIntValue = ethers.toBigInt(arg);
                  return `数值: ${ethers.formatUnits(bigIntValue, 18)}`;
                } catch (error) {
                  return arg.toString();
                }
              }),
              timestamp: new Date().toLocaleString(),
            };
            setDetectedEvents((prevEvents) => [eventInfo, ...prevEvents]);
            console.log("事件详情:", eventInfo);
          };
          contract.on(item.name, listener);
          listenersRef.current.push({ event: item.name, listener });
        }
      });
      message.success("开始监听选中的事件");
    } catch (error) {
      message.error("监听时出错: " + error.message);
    }
  };

  // 停止事件监听
  const stopEventListening = () => {
    if (contractRef.current) {
      listenersRef.current.forEach(({ event, listener }) => {
        contractRef.current.off(event, listener);
      });
      listenersRef.current = [];
      message.info("已停止事件监听");
    }
  };

  // 监听 selectedItems 的变化，自动启动或停止监听
  useEffect(() => {
    if (selectedItems.length > 0) {
      startEventListening();
    } else {
      stopEventListening();
    }
  }, [selectedItems]);

  // ABI解析表格列配置
  const columns = [
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      render: (type) => (type === "event" ? "事件" : "方法"),
    },
    {
      title: "参数",
      dataIndex: "inputs",
      key: "inputs",
    },
  ];

  return (
    <Card title="合约事件和方法监听">
      <Form layout="vertical">
        <Form.Item label="RPC URL">
          <Input
            placeholder="例如：https://mainnet.infura.io/v3/YOUR-PROJECT-ID (目前infura可以正常获取，alchemy测试暂时无法通过)"
            value={rpcUrl}
            onChange={(e) => setRpcUrl(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="合约地址">
          <Input
            placeholder="0x..."
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
        </Form.Item>

        <Form.Item label="合约ABI">
          <Input.TextArea
            placeholder="请输入合约ABI（JSON格式）"
            value={abi}
            onChange={(e) => {
              setAbi(e.target.value);
              parseAbiItems(e.target.value);
            }}
            rows={4}
          />
        </Form.Item>

        {parsedAbiItems.length > 0 && (
          <Form.Item label="选择要监听的事件和方法">
            <Table
              rowSelection={{
                type: "checkbox",
                onChange: (selectedRowKeys) => {
                  setSelectedItems(selectedRowKeys);
                },
              }}
              columns={columns}
              dataSource={parsedAbiItems}
            />
          </Form.Item>
        )}

        <Form.Item>
          <Button
            type="primary"
            onClick={startEventListening}
            style={{ marginRight: 10 }}
          >
            开始监听
          </Button>
          <Button danger onClick={stopEventListening}>
            停止监听
          </Button>
        </Form.Item>
      </Form>

      {detectedEvents.length > 0 && (
        <Card title="检测到的事件和方法" style={{ marginTop: 20 }}>
          {detectedEvents.map((event, index) => (
            <div
              key={index}
              style={{
                backgroundColor: event.type.includes("错误")
                  ? "#ffdddd"
                  : "#f0f0f0",
                marginBottom: 10,
                padding: 10,
                borderRadius: 5,
              }}
            >
              <div>
                <strong>名称：</strong>
                {event.name}
              </div>
              <div>
                <strong>类型：</strong>
                {event.type}
              </div>
              <div>
                <strong>参数：</strong>
                {event.args?.join(", ") || "无"}
              </div>
              {event.result && (
                <div>
                  <strong>返回值：</strong>
                  {event.result}
                </div>
              )}
              {event.error && (
                <div>
                  <strong>错误：</strong>
                  {event.error}
                </div>
              )}
              <div>
                <strong>时间：</strong>
                {event.timestamp}
              </div>
            </div>
          ))}
        </Card>
      )}
    </Card>
  );
}
