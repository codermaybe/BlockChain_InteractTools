import { Input, Button, Select, message, Card, Space, Typography } from "antd";
import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { createJsonRpcProvider, probeProvider } from "../../../../services/evm/providerFactory";
import { callFunction, getReadContract } from "../../../../services/evm/contractService.js";
import { LOG_CATEGORY } from "../../../../config/categories.js";
import { useChainRpc } from "../../../../hooks/useChainRpc.js";
import { useTaskLog } from "../../../../state/TaskLogContext";
import ChainRpcSelector from "../../../shared/ChainRpcSelector.jsx";

const { Text } = Typography;

export default function GetBalanceByContract() {
  const chain = useChainRpc();
  const { addLog } = useTaskLog();

  const [contractAddress, setContractAddress] = useState("");
  const [contractAbi, setContractAbi] = useState("");
  const [balance, setBalance] = useState(null);
  const [targetAddress, setTargetAddress] = useState("");
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const abiFunctions = useMemo(() => {
    try {
      const abiJson = JSON.parse(contractAbi);
      return abiJson.filter((item) => item.type === "function").map((item) => item.name);
    } catch {
      return [];
    }
  }, [contractAbi]);

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
      category: LOG_CATEGORY.CONTRACT,
      message: "开始合约余额查询",
      meta: { chainKey: chain.chainKey, contractAddress, targetAddress, selectedFunction },
    });

    try {
      const { provider } = createJsonRpcProvider(chain.chainKey, chain.rpc, true);
      await probeProvider(provider);
      const contract = getReadContract(chain.chainKey, contractAddress, JSON.parse(contractAbi), chain.rpc);
      const result = await callFunction({
        contract,
        fnName: selectedFunction,
        params: [targetAddress],
      });
      const formatted = ethers.formatUnits(result, 18);
      setBalance(formatted);
      addLog({
        level: "success",
        category: LOG_CATEGORY.CONTRACT,
        message: "合约余额查询成功",
        meta: { chainKey: chain.chainKey, result: formatted },
      });
      message.success("查询成功");
    } catch (error) {
      addLog({
        level: "error",
        category: LOG_CATEGORY.CONTRACT,
        message: "合约余额查询失败",
        meta: { chainKey: chain.chainKey, error: error?.message || "unknown" },
      });
      message.error(error?.message || "查询失败");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <Card title="通过合约函数查询余额">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <ChainRpcSelector {...chain} />

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
