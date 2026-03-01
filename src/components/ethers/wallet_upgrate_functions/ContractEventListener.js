import React, { useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, Card, Form, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import { getChainOptions } from "../../../config/chainRegistry";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

export default function ContractEventListener() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [rpcUrl, setRpcUrl] = useState(settings.getRpcOverride(settings.preferredChainKey));
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState("");
  const [parsedAbiItems, setParsedAbiItems] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [detectedEvents, setDetectedEvents] = useState([]);
  const [isListening, setIsListening] = useState(false);

  const contractRef = useRef(null);
  const listenersRef = useRef([]);

  const chainOptions = useMemo(() => getChainOptions(), []);

  const handleChainChange = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    setRpcUrl(settings.getRpcOverride(value));
  };

  const handleRpcChange = (value) => {
    setRpcUrl(value);
    settings.setRpcOverride(chainKey, value);
  };

  const parseAbiItems = (abiString) => {
    if (!abiString.trim()) {
      setParsedAbiItems([]);
      return;
    }
    try {
      const parsed = JSON.parse(abiString);
      const items = parsed
        .filter((item) => item.type === "event")
        .map((item, index) => ({
          key: `${item.name}-${index}`,
          name: item.name,
          type: item.type,
          inputs: (item.inputs || [])
            .map((input) => `${input.type} ${input.name || ""}`.trim())
            .join(", "),
        }));
      setParsedAbiItems(items);
    } catch (error) {
      setParsedAbiItems([]);
      message.error("ABI 解析失败，请检查 JSON 格式");
    }
  };

  const stopEventListening = () => {
    if (contractRef.current) {
      listenersRef.current.forEach(({ event, listener }) => {
        contractRef.current.off(event, listener);
      });
      listenersRef.current = [];
    }
    setIsListening(false);
  };

  const startEventListening = async () => {
    stopEventListening();
    if (!rpcUrl || !contractAddress || !abi) {
      message.error("请填写 RPC、合约地址、ABI");
      return;
    }
    if (!ethers.isAddress(contractAddress)) {
      message.error("合约地址无效");
      return;
    }
    if (!selectedEvents.length) {
      message.warning("请至少选择一个事件");
      return;
    }

    try {
      const { provider } = createJsonRpcProvider(chainKey, rpcUrl, true);
      await probeProvider(provider);
      const parsedAbi = JSON.parse(abi);
      const contract = new ethers.Contract(contractAddress, parsedAbi, provider);
      contractRef.current = contract;

      selectedEvents.forEach((rowKey) => {
        const item = parsedAbiItems.find((eventRow) => eventRow.key === rowKey);
        if (!item) return;
        const listener = (...args) => {
          const eventArgs = args.slice(0, -1);
          const eventInfo = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: item.name,
            args: eventArgs.map((arg) => {
              try {
                if (ethers.isAddress(arg)) return arg;
                if (typeof arg === "bigint") return arg.toString();
                return String(arg);
              } catch {
                return String(arg);
              }
            }),
            timestamp: new Date().toLocaleString(),
          };
          setDetectedEvents((prev) => [eventInfo, ...prev].slice(0, 200));
          addLog({
            level: "info",
            category: "event-listener",
            message: `捕获事件: ${item.name}`,
            meta: { chainKey, contractAddress, args: eventInfo.args },
          });
        };

        contract.on(item.name, listener);
        listenersRef.current.push({ event: item.name, listener });
      });

      setIsListening(true);
      addLog({
        level: "success",
        category: "event-listener",
        message: "事件监听已启动",
        meta: { chainKey, contractAddress, eventCount: selectedEvents.length },
      });
      message.success("开始监听事件");
    } catch (error) {
      addLog({
        level: "error",
        category: "event-listener",
        message: "事件监听启动失败",
        meta: { chainKey, contractAddress, error: error?.message || "unknown" },
      });
      message.error(error?.message || "监听失败");
    }
  };

  const eventColumns = [
    { title: "名称", dataIndex: "name", key: "name", width: 200 },
    {
      title: "参数",
      dataIndex: "inputs",
      key: "inputs",
      ellipsis: true,
    },
  ];

  return (
    <Card title="合约事件监听">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          showIcon
          type="info"
          message="说明"
          description="链与 RPC 复用全局配置。仅支持事件监听，建议优先使用 WebSocket RPC 获得更稳定推送。"
        />

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="space-y-2">
            <Text strong>链</Text>
            <Select options={chainOptions} value={chainKey} onChange={handleChainChange} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Text strong>RPC（自动保存）</Text>
            <Input value={rpcUrl} onChange={(e) => handleRpcChange(e.target.value)} />
          </div>
        </div>

        <Form layout="vertical">
          <Form.Item label="合约地址">
            <Input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
          </Form.Item>
          <Form.Item label="合约 ABI（JSON）">
            <Input.TextArea
              rows={5}
              value={abi}
              onChange={(e) => {
                const value = e.target.value;
                setAbi(value);
                parseAbiItems(value);
              }}
            />
          </Form.Item>
        </Form>

        {parsedAbiItems.length > 0 && (
          <Table
            rowKey="key"
            dataSource={parsedAbiItems}
            columns={eventColumns}
            rowSelection={{
              selectedRowKeys: selectedEvents,
              onChange: (keys) => setSelectedEvents(keys),
            }}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        )}

        <Space wrap>
          <Button type="primary" onClick={startEventListening}>
            开始监听
          </Button>
          <Button danger onClick={stopEventListening}>
            停止监听
          </Button>
          {isListening ? <Tag color="green">监听中</Tag> : <Tag>未启动</Tag>}
        </Space>

        {detectedEvents.length > 0 && (
          <Card title="捕获事件" size="small">
            <Table
              rowKey="id"
              size="small"
              dataSource={detectedEvents}
              pagination={{ pageSize: 6 }}
              columns={[
                { title: "时间", dataIndex: "timestamp", key: "timestamp", width: 180 },
                { title: "事件", dataIndex: "name", key: "name", width: 180 },
                {
                  title: "参数",
                  dataIndex: "args",
                  key: "args",
                  render: (args) => (args || []).join(", "),
                },
              ]}
            />
          </Card>
        )}
      </Space>
    </Card>
  );
}
