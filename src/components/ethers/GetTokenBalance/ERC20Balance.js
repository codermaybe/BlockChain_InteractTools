import { Input, Button, Select, message } from "antd";
import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";

export default function ERC20Balance() {
  // 初始化状态
  const [rpcUrl, setRpcUrl] = useState(
    "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
  );
  const [contractAddress, setContractAddress] = useState(
    "0x9EfF02066670420A21828a8d29bB65C7180c5b0B"
  );
  const [contractAbi, setContractAbi] = useState(
    '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ECDSAInvalidSignature","type":"error"},{"inputs":[{"internalType":"uint256","name":"length","type":"uint256"}],"name":"ECDSAInvalidSignatureLength","type":"error"},{"inputs":[{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ECDSAInvalidSignatureS","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"ERC2612ExpiredSignature","type":"error"},{"inputs":[{"internalType":"address","name":"signer","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC2612InvalidSigner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"currentNonce","type":"uint256"}],"name":"InvalidAccountNonce","type":"error"},{"inputs":[],"name":"InvalidShortString","type":"error"},{"inputs":[{"internalType":"string","name":"str","type":"string"}],"name":"StringTooLong","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[],"name":"EIP712DomainChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TransferEvent","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"eip712Domain","outputs":[{"internalType":"bytes1","name":"fields","type":"bytes1"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"version","type":"string"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"address","name":"verifyingContract","type":"address"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256[]","name":"extensions","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMyBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"number","type":"uint256"}],"name":"supply","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]'
  );

  const [response, setResponse] = useState(null);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionParams, setFunctionparams] = useState([]);
  const [abiFunctions, setAbiFunctions] = useState([]);
  const [functionParamTypes, setFunctionParamTypes] = useState([]);
  const [rpcUrlError, setRpcUrlError] = useState(null);
  const [contractAddressError, setContractAddressError] = useState(null);
  const [contractAbiError, setContractAbiError] = useState(null);
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

  // 更新选择的函数
  const handleFunctionChange = (value) => {
    setSelectedFunction(value);
    setSelectedFunctionError(null);
    const selectedFunctionDetails = abiFunctions.find(
      (item) => item.name === value
    );
    setFunctionParamTypes(
      selectedFunctionDetails ? selectedFunctionDetails.inputs : []
    );
  };

  // 更新函数参数
  const handleFunctionParamsChange = (e) => {
    const paramsString = e.target.value;
    let paramsArray = [];

    if (paramsString.trim() !== "") {
      try {
        // 尝试解析 JSON 数组
        paramsArray = JSON.parse(`[${paramsString}]`);
      } catch (error) {
        // 如果解析失败，按逗号分割字符串并去除空格
        paramsArray = paramsString.split(",").map((param) => param.trim());
      }
    }

    setFunctionparams(paramsArray);
  };

  // 获取合约中的函数列表和参数类型
  useEffect(() => {
    try {
      const abiJson = JSON.parse(contractAbi);
      const functionDetails = abiJson
        .filter((item) => item.type === "function") // 只选择函数类型
        .map((item) => ({
          name: item.name,
          inputs: item.inputs.map((input) => `${input.type} ${input.name}`), // 获取输入参数类型
          outputs: item.outputs.map((output) => output.type).join(", "), // 获取返回类型
        }));
      setAbiFunctions(functionDetails);
      setContractAbiError(null); // 解析成功，清除错误信息
    } catch (error) {
      setAbiFunctions([]); // 清空函数列表
      setContractAbiError("ABI 解析失败，请检查格式"); // 设置错误信息
    }
  }, [contractAbi]);

  // 获取返回请求
  const getResponseFromContract = async () => {
    // 清除之前的错误信息
    setRpcUrlError(null);
    setContractAddressError(null);
    setContractAbiError(null);
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
    setResponse(null); //清除之前的请求

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

      if (selectedFunction) {
        const selectedFunctionDetails = abiFunctions.find(
          (item) => item.name === selectedFunction
        );

        if (selectedFunctionDetails.inputs.length !== functionParams.length) {
          message.error("参数数量不匹配");
          setIsFetching(false);
          return;
        }

        const result = await contract[selectedFunction](...functionParams);
        message.success("交互成功");
        setResponse(result); // 格式化余额为 Ether
      }
    } catch (error) {
      console.error("Error fetching response:", error);
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

      <p>选择要调用的函数:</p>
      <Select
        style={{ width: "100%" }}
        value={selectedFunction}
        onChange={handleFunctionChange}
        placeholder="选择合约函数"
      >
        {abiFunctions.map((func, index) => (
          <Select.Option key={index} value={func.name}>
            {func.name} ({func.inputs.join(", ")})
            {func.outputs && ` -> ${func.outputs}`}
          </Select.Option>
        ))}
      </Select>
      {selectedFunctionError && (
        <p style={{ color: "red" }}>{selectedFunctionError}</p>
      )}

      <p>输入函数所需参数</p>
      <Input
        value={functionParams.join(", ")}
        onChange={handleFunctionParamsChange}
        placeholder={`输入参数 (${functionParamTypes.join(", ")})`}
      />

      <Button onClick={getResponseFromContract}>开始交互</Button>

      {isFetching && <p>正在获取结果...</p>}
      {response !== null && response.toString() !== "" && (
        <p>交互结果为：{response.toString()}</p>
      )}
    </Fragment>
  );
}
