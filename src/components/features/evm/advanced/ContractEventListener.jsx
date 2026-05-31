import React, { useEffect, useMemo, useRef, useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, Card, Form, Input, Space, Table, Tag, message } from "antd";
import { LOG_CATEGORY } from "../../../../config/categories.js";
import { getReadContract, parseAbi } from "../../../../services/evm/contractService.js";
import { createJsonRpcProvider, probeProvider } from "../../../../services/evm/providerFactory";
import { useChainRpc } from "../../../../hooks/useChainRpc.js";
import { useTaskLog } from "../../../../state/TaskLogContext";
import ChainRpcSelector from "../../../shared/ChainRpcSelector.jsx";

export default function ContractEventListener() {
  const chain = useChainRpc();
  const { addLog } = useTaskLog();
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState("");
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [detectedEvents, setDetectedEvents] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const contractRef = useRef(null);
  const listenersRef = useRef([]);

  const parsedAbi = useMemo(() => {
    if (!abi.trim()) return { abi: [], events: [] };
    try {
      return parseAbi(abi);
    } catch {
      return { abi: [], events: [] };
    }
  }, [abi]);

  const eventRows = parsedAbi.events.map((item, index) => ({
    key: item.signature || `${item.name}-${index}`,
    name: item.name,
    signature: item.signature,
    inputs: item.inputs.map((input) => `${input.type} ${input.name || ""}`.trim()).join(", "),
  }));

  const stopEventListening = () => {
    if (contractRef.current) {
      listenersRef.current.forEach(({ event, listener }) => {
        contractRef.current.off(event, listener);
      });
    }
    listenersRef.current = [];
    contractRef.current = null;
    setIsListening(false);
  };

  useEffect(() => stopEventListening, []);

  const startEventListening = async () => {
    stopEventListening();
    if (!contractAddress || !abi) {
      message.error("请填写合约地址和 ABI");
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
      const { provider } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      await probeProvider(provider);
      const contract = getReadContract(chain.chainKey, contractAddress, parsedAbi.abi, chain.rpc);
      contractRef.current = contract;

      selectedEvents.forEach((rowKey) => {
        const item = eventRows.find((eventRow) => eventRow.key === rowKey);
        if (!item) return;
        const listener = (...args) => {
          const eventArgs = args.slice(0, -1).map((arg) => {
            if (typeof arg === "bigint") return arg.toString();
            return String(arg);
          });
          const eventInfo = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: item.name,
            args: eventArgs,
            timestamp: new Date().toLocaleString(),
          };
          setDetectedEvents((prev) => [eventInfo, ...prev].slice(0, 200));
          addLog({
            level: "info",
            category: LOG_CATEGORY.EVENT_LISTENER,
            message: `捕获事件: ${item.name}`,
            meta: { chainKey: chain.chainKey, contractAddress, args: eventArgs },
          });
        };
        contract.on(item.name, listener);
        listenersRef.current.push({ event: item.name, listener });
      });

      setIsListening(true);
      addLog({
        level: "success",
        category: LOG_CATEGORY.EVENT_LISTENER,
        message: "事件监听已启动",
        meta: { chainKey: chain.chainKey, contractAddress, eventCount: selectedEvents.length },
      });
      message.success("开始监听事件");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.EVENT_LISTENER,
        message: "事件监听启动失败",
        meta: { chainKey: chain.chainKey, contractAddress, error: error?.message || "unknown" },
      });
      message.error(error?.message || "监听失败");
    }
  };

  return (
    <Card title="合约事件监听">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert showIcon type="info" message="说明" description="链与 RPC 复用全局配置。停止或卸载时会清理已注册 listener。" />
        <ChainRpcSelector {...chain} disabled={isListening} />
        <Form layout="vertical">
          <Form.Item label="合约地址">
            <Input value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
          </Form.Item>
          <Form.Item label="合约 ABI（JSON）">
            <Input.TextArea rows={5} value={abi} onChange={(e) => setAbi(e.target.value)} />
          </Form.Item>
        </Form>
        {!!eventRows.length && (
          <Table
            rowKey="key"
            dataSource={eventRows}
            columns={[{ title: "名称", dataIndex: "name", key: "name", width: 200 }, { title: "参数", dataIndex: "inputs", key: "inputs", ellipsis: true }]}
            rowSelection={{ selectedRowKeys: selectedEvents, onChange: setSelectedEvents }}
            pagination={{ pageSize: 5 }}
            size="small"
          />
        )}
        <Space wrap>
          <Button type="primary" onClick={startEventListening} disabled={isListening}>开始监听</Button>
          <Button danger onClick={stopEventListening}>停止监听</Button>
          {isListening ? <Tag color="green">监听中</Tag> : <Tag>未启动</Tag>}
        </Space>
        {!!detectedEvents.length && (
          <Card title="捕获事件" size="small">
            <Table
              rowKey="id"
              size="small"
              dataSource={detectedEvents}
              pagination={{ pageSize: 6 }}
              columns={[{ title: "时间", dataIndex: "timestamp", key: "timestamp", width: 180 }, { title: "事件", dataIndex: "name", key: "name", width: 180 }, { title: "参数", dataIndex: "args", key: "args", render: (args) => (args || []).join(", ") }]}
            />
          </Card>
        )}
      </Space>
    </Card>
  );
}
