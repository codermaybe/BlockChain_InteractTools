import { Input, Button, Select, message } from "antd";
import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";

export default function GeneralInteract() {
  // 初始化状态
  const [rpcUrl, setRpcUrl] = useState(
    "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
  );
  const [contractAddress, setContractAddress] = useState();
  const [contractAbi, setContractAbi] = useState();

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
