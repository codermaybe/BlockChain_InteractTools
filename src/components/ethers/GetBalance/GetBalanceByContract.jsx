import { Input, Button, Select, message, Card, Space, Typography } from "antd";
import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { getChainOptions } from "../../../config/chainRegistry";
import { createJsonRpcProvider, probeProvider } from "../../../services/evm/providerFactory";
import { useAppSettings } from "../../../state/AppSettingsContext";
import { useTaskLog } from "../../../state/TaskLogContext";

const { Text } = Typography;

export default function GetBalanceByContract() {
  const settings = useAppSettings();
  const { addLog } = useTaskLog();

  const [chainKey, setChainKey] = useState(settings.preferredChainKey);
  const [rpcUrl, setRpcUrl] = useState(settings.getRpcOverride(settings.preferredChainKey));
  const [contractAddress, setContractAddress] = useState(
    "0x8e3403B1385613A90897dACfdA5c9706811FEf92"
  );
  const [contractAbi, setContractAbi] = useState(
    '[{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]'
  );
  const [balance, setBalance] = useState(null);
  const [targetAddress, setTargetAddress] = useState("0x0");
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const chainOptions = useMemo(() => getChainOptions(), []);
  const abiFunctions = useMemo(() => {
    try {
      const abiJson = JSON.parse(contractAbi);
      return abiJson.filter((item) => item.type === "function").map((item) => item.name);
    } catch {
      return [];
    }
  }, [contractAbi]);

  const handleChainChange = (value) => {
    setChainKey(value);
    settings.setPreferredChainKey(value);
    setRpcUrl(settings.getRpcOverride(value));
  };

  const handleRpcChange = (value) => {
    setRpcUrl(value);
    settings.setRpcOverride(chainKey, value);
  };

  const getBalanceFromContract = async () => {
    if (!ethers.isAddress(contractAddress)) {
      message.error("请输入有效合约地址");
      return;
    }
    if (!ethers.isAddress(targetAddress)) {
      message.error("请输入有效目标地址");
      return;
    }
    if (!selectedFunction) {
      message.error("请选择函数");
      return;
    }

    setIsFetching(true);
    setBalance(null);
    addLog({
      level: "info",
      category: "contract-balance",
      message: "开始合约余额查询",
      meta: { chainKey, contractAddress, targetAddress, selectedFunction },
    });

    try {
      const { provider } = createJsonRpcProvider(chainKey, rpcUrl, true);
      await probeProvider(provider);
      const contract = new ethers.Contract(contractAddress, JSON.parse(contractAbi), provider);
      const result = await contract[selectedFunction](targetAddress);
      const formatted = ethers.formatUnits(result, 18);
      setBalance(formatted);
      addLog({
        level: "success",
        category: "contract-balance",
        message: "合约余额查询成功",
        meta: { chainKey, result: formatted },
      });
      message.success("查询成功");
    } catch (error) {
      addLog({
        level: "error",
        category: "contract-balance",
        message: "合约余额查询失败",
        meta: { chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询失败");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Card title="通过合约函数查询余额">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
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

        <Input
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="合约地址"
        />

        <Input.TextArea
          rows={5}
          value={contractAbi}
          onChange={(e) => setContractAbi(e.target.value)}
          placeholder="合约 ABI"
        />

        <Input
          value={targetAddress}
          onChange={(e) => setTargetAddress(e.target.value)}
          placeholder="目标地址"
        />

        <Select
          style={{ width: "100%" }}
          value={selectedFunction}
          onChange={setSelectedFunction}
          placeholder="选择函数"
          options={abiFunctions.map((name) => ({ value: name, label: name }))}
        />

        <Button type="primary" onClick={getBalanceFromContract} loading={isFetching}>
          获取余额
        </Button>
        {balance !== null && <Text>目标地址余额：{balance} ETH</Text>}
      </Space>
    </Card>
  );
}
