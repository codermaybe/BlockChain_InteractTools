import { Input, Button, Select, message } from "antd";
import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";

export default function GetBalanceByContract() {
  // 初始化状态
  const [rpcUrl, setRpcUrl] = useState(
    "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
  );
  const [contractAddress, setContractAddress] = useState(
    "0x8e3403B1385613A90897dACfdA5c9706811FEf92"
  );
  const [contractAbi, setContractAbi] = useState(
    '[{"inputs":[{"internalType":"address","name":"target","type":"address"}],"name":"getBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]'
  );
  const [balance, setBalance] = useState(null);
  const [targetAddress, setTargetAddress] = useState("0x0");
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [abiFunctions, setAbiFunctions] = useState([]);
  const [rpcUrlError, setRpcUrlError] = useState(null);
  const [contractAddressError, setContractAddressError] = useState(null);
  const [contractAbiError, setContractAbiError] = useState(null);
  const [targetAddressError, setTargetAddressError] = useState(null);
  const [selectedFunctionError, setSelectedFunctionError] = useState(null);
  const [isFetching, setIsFetching] = useState(false); // 获取余额操作状态

  // 更新RPC地址
  const handleRpcUrlChange = (e) => {
    setRpcUrl(e.target.value);
    setRpcUrlError(null);
  };

  // 更新合约地址
  const handleContractAddressChange = (e) => {
    setContractAddress(e.target.value);
    setContractAddressError(null);
  };

  // 更新合约ABI
  const handleContractAbiChange = (e) => {
    setContractAbi(e.target.value);
    setContractAbiError(null);
  };

  // 更新目标地址
  const handleTargetAddressChange = (e) => {
    setTargetAddress(e.target.value);
    setTargetAddressError(null);
  };

  // 更新选择的函数
  const handleFunctionChange = (value) => {
    setSelectedFunction(value);
    setSelectedFunctionError(null);
  };

  // 获取合约中的函数列表
  useEffect(() => {
    try {
      const abiJson = JSON.parse(contractAbi);
      const functionNames = abiJson
        .filter((item) => item.type === "function") // 只选择函数类型
        .map((item) => item.name); // 获取函数名称
      setAbiFunctions(functionNames);
      setContractAbiError(null); // 解析成功，清除错误信息
    } catch (error) {
      setAbiFunctions([]); // 清空函数列表
      setContractAbiError("ABI 解析失败，请检查格式"); // 设置错误信息
    }
  }, [contractAbi]);

  // 获取余额
  const getBalanceFromContract = async () => {
    // 清除之前的错误信息
    setRpcUrlError(null);
    setContractAddressError(null);
    setContractAbiError(null);
    setTargetAddressError(null);
    setSelectedFunctionError(null);

    // 验证输入字段
    let isValid = true;

    if (!rpcUrl) {
      setRpcUrlError("请输入有效的RPC URL");
      message.error("请输入有效的RPC URL");
      isValid = false;
    }

    if (!ethers.isAddress(contractAddress)) {
      setContractAddressError("请输入有效的合约地址");
      message.error("请输入有效的合约地址");
      isValid = false;
    }

    if (contractAbiError) {
      message.error("ABI 解析失败，请检查格式");
      isValid = false;
    }

    if (!ethers.isAddress(targetAddress)) {
      setTargetAddressError("请输入有效的目标地址");
      message.error("请输入有效的目标地址");
      isValid = false;
    }

    if (!selectedFunction) {
      setSelectedFunctionError("请选择要调用的函数");
      message.error("请选择要调用的函数");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // 检测RPC URL可用性
    setIsFetching(true); // 开始获取余额
    setBalance(null); // 清除之前的余额

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber(); // 尝试获取区块号以检测RPC URL可用性
    } catch (error) {
      console.error("RPC URL 不可用:", error);
      setRpcUrlError("RPC URL 不可用，请检查URL");
      message.error("RPC URL 不可用，请检查URL");
      setIsFetching(false); // 结束获取余额
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(
        contractAddress,
        JSON.parse(contractAbi),
        provider
      );

      // 如果选择了函数，调用相应的函数
      if (selectedFunction) {
        const balance = await contract[selectedFunction](targetAddress);
        setBalance(ethers.formatUnits(balance, 18)); // 格式化余额为 Ether
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      message.error("获取失败");
    } finally {
      setIsFetching(false); // 结束获取余额
    }
  };

  return (
    <Fragment>
      <p>输入自有RPC接口，默认为 sepolia</p>
      <Input
        value={rpcUrl}
        onChange={handleRpcUrlChange}
        placeholder="有效rpc"
      />
      {rpcUrlError && <p style={{ color: "red" }}>{rpcUrlError}</p>}

      <p>
        输入合约地址, 当前状态: {ethers.isAddress(contractAddress) ? "✔" : "✗"}
      </p>
      <Input
        value={contractAddress}
        onChange={handleContractAddressChange}
        placeholder="合约地址"
      />
      {contractAddressError && (
        <p style={{ color: "red" }}>{contractAddressError}</p>
      )}

      <p>输入合约对应 ABI:</p>
      <Input.TextArea
        value={contractAbi}
        onChange={handleContractAbiChange}
        placeholder="合约 ABI"
      />
      {contractAbiError && <p style={{ color: "red" }}>{contractAbiError}</p>}

      <p>
        输入需要查询的钱包或合约地址, 地址正确性:
        {ethers.isAddress(targetAddress) ? "✔" : "✗"}
      </p>
      <Input
        value={targetAddress}
        onChange={handleTargetAddressChange}
        placeholder="输入要查询余额的地址"
      />
      {targetAddressError && (
        <p style={{ color: "red" }}>{targetAddressError}</p>
      )}

      <p>选择要调用的函数:</p>
      <Select
        style={{ width: "100%" }}
        value={selectedFunction}
        onChange={handleFunctionChange}
        placeholder="选择合约函数"
      >
        {abiFunctions.map((funcName, index) => (
          <Select.Option key={index} value={funcName}>
            {funcName}
          </Select.Option>
        ))}
      </Select>
      {selectedFunctionError && (
        <p style={{ color: "red" }}>{selectedFunctionError}</p>
      )}

      <Button onClick={getBalanceFromContract}>获取余额</Button>

      {isFetching && <p>正在获取余额...</p>}
      {balance !== null && <p>目标地址余额：{balance} ETH</p>}
    </Fragment>
  );
}
