import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Form, Input, Select, Space, Typography, message } from "antd";
import { ethers } from "ethers";
import { getChainOptions } from "../../../config/chainRegistry";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import TaskResultTable from "../../shared/TaskResultTable";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

export default function Erc20Aggregator() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();
  const [form] = Form.useForm();
  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [rpcUrl, setRpcUrl] = useState(settings.getRpcOverride(settings.preferredChainKey));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const chainOptions = useMemo(() => getChainOptions(), []);

  const handleChainChange = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    const next = settings.getRpcOverride(value);
    setRpcUrl(next);
    form.setFieldsValue({ rpcUrl: next });
  };

  const handleRpcChange = (value) => {
    setRpcUrl(value);
    settings.setRpcOverride(chainKey, value);
    form.setFieldsValue({ rpcUrl: value });
  };

  const handleAggregate = async (values) => {
    const { mainPrivateKey, tokenData } = values;
    setLoading(true);
    setRows([]);
    addLog({
      level: "info",
      category: "erc20-aggregate",
      message: "开始 ERC20 归集任务",
      meta: { chainKey },
    });

    try {
      const { provider } = createJsonRpcProvider(chainKey, rpcUrl, true);
      await probeProvider(provider);
      const mainWallet = new ethers.Wallet(mainPrivateKey, provider);

      const tokenList = tokenData
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, idx) => {
          const [tokenAddress, privateKey] = line.split(",").map((item) => item.trim());
          return { tokenAddress, privateKey, index: idx + 1, raw: line };
        });

      const taskRows = [];
      for (const item of tokenList) {
        try {
          if (!ethers.isAddress(item.tokenAddress)) {
            taskRows.push({
              index: item.index,
              task: item.raw,
              status: "failed",
              output: "",
              error: "代币地址无效",
            });
            continue;
          }
          const wallet = new ethers.Wallet(item.privateKey, provider);
          const contract = new ethers.Contract(item.tokenAddress, ERC20_ABI, wallet);
          const [balance, decimals, symbol] = await Promise.all([
            contract.balanceOf(wallet.address),
            contract.decimals().catch(() => 18),
            contract.symbol().catch(() => "ERC20"),
          ]);
          if (balance <= 0n) {
            taskRows.push({
              index: item.index,
              task: item.raw,
              status: "failed",
              output: "",
              error: "余额为 0",
            });
            continue;
          }
          const tx = await contract.transfer(mainWallet.address, balance);
          await tx.wait();
          taskRows.push({
            index: item.index,
            task: item.raw,
            status: "success",
            output: `${ethers.formatUnits(balance, Number(decimals))} ${symbol}`,
            error: "",
            txHash: tx.hash,
          });
        } catch (error) {
          taskRows.push({
            index: item.index,
            task: item.raw,
            status: "failed",
            output: "",
            error: error?.message || "归集失败",
          });
        }
      }

      setRows(taskRows);
      const failedCount = taskRows.filter((item) => item.status === "failed").length;
      addLog({
        level: failedCount ? "warning" : "success",
        category: "erc20-aggregate",
        message: "ERC20 归集任务完成",
        meta: { chainKey, total: taskRows.length, failed: failedCount },
      });
      message.success("归集任务执行完成");
    } catch (error) {
      addLog({
        level: "error",
        category: "erc20-aggregate",
        message: "ERC20 归集任务失败",
        meta: { chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "归集失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="ERC20 代币归集">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          message="提示"
          description="归集任务将逐行执行，每行格式为“代币地址,私钥”。链与 RPC 自动复用全局配置。"
          type="info"
          showIcon
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

        <Form
          form={form}
          layout="vertical"
          onFinish={handleAggregate}
          initialValues={{ rpcUrl, mainPrivateKey: "", tokenData: "" }}
        >
          <Form.Item label="RPC 接口" name="rpcUrl">
            <Input value={rpcUrl} onChange={(e) => handleRpcChange(e.target.value)} />
          </Form.Item>
          <Form.Item
            name="mainPrivateKey"
            label="主钱包私钥"
            rules={[{ required: true, message: "请输入主钱包私钥" }]}
          >
            <Input.Password placeholder="用于接收代币的钱包私钥" />
          </Form.Item>
          <Form.Item
            name="tokenData"
            label="代币地址及私钥"
            rules={[{ required: true, message: "请输入代币地址及对应钱包私钥" }]}
          >
            <Input.TextArea rows={5} placeholder="每行格式: 代币地址,钱包私钥" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              开始归集
            </Button>
          </Form.Item>
        </Form>

        <TaskResultTable
          rows={rows}
          loading={loading}
          extraColumns={[
            { title: "交易哈希", dataIndex: "txHash", key: "txHash", ellipsis: true },
          ]}
        />
      </Space>
    </Card>
  );
}
