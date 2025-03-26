import { Input, Button, Select, message } from "antd";
import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";

export default function GeneralInteract() {
  // 统一状态管理
  const [formData, setFormData] = useState({
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY",
    contractAddress: "0x9EfF02066670420A21828a8d29bB65C7180c5b0B",
    contractAbi: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ECDSAInvalidSignature","type":"error"},{"inputs":[{"internalType":"uint256","name":"length","type":"uint256"}],"name":"ECDSAInvalidSignatureLength","type":"error"},{"inputs":[{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"ECDSAInvalidSignatureS","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"ERC2612ExpiredSignature","type":"error"},{"inputs":[{"internalType":"address","name":"signer","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC2612InvalidSigner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"currentNonce","type":"uint256"}],"name":"InvalidAccountNonce","type":"error"},{"inputs":[],"name":"InvalidShortString","type":"error"},{"inputs":[{"internalType":"string","name":"str","type":"string"}],"name":"StringTooLong","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[],"name":"EIP712DomainChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TransferEvent","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"eip712Domain","outputs":[{"internalType":"bytes1","name":"fields","type":"bytes1"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"version","type":"string"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"address","name":"verifyingContract","type":"address"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256[]","name":"extensions","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getMyBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"number","type":"uint256"}],"name":"supply","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]',
    privateKey: "",
    selectedFunction: null,
    functionParams: [],
  });

  const [errors, setErrors] = useState({
    rpcUrl: null,
    contractAddress: null,
    contractAbi: null,
    selectedFunction: null,
    privateKey: null,
  });

  const [contractState, setContractState] = useState({
    abiFunctions: [],
    functionParamTypes: [],
    response: null,
    isFetching: false,
    signer: null,
    provider: null,
  });

  // 统一错误处理函数
  const setError = (field, message) => {
    setErrors(prev => ({ ...prev, [field]: message }));
    message.error({
      content: message,
      duration: 3,
      style: { marginTop: '20vh' },
    });
  };

  const clearError = (field) => {
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  // 统一输入处理函数
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError(field);
  };

  // 验证输入
  const validateInputs = () => {
    let isValid = true;

    if (!formData.rpcUrl) {
      setError('rpcUrl', '请输入有效的RPC URL');
      isValid = false;
    }

    if (!ethers.isAddress(formData.contractAddress)) {
      setError('contractAddress', '请输入有效的合约地址');
      isValid = false;
    }

    if (errors.contractAbi) {
      setError('contractAbi', 'ABI 解析失败，请检查格式');
      isValid = false;
    }

    if (!formData.selectedFunction) {
      setError('selectedFunction', '请选择要调用的函数');
      isValid = false;
    }

    if (!formData.privateKey) {
      setError('privateKey', '请输入私钥');
      isValid = false;
    }

    return isValid;
  };

  // 创建签名者
  const createSigner = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
      const signer = new ethers.Wallet(formData.privateKey, provider);
      setContractState(prev => ({ ...prev, signer, provider }));
      message.success({
        content: '签名者创建成功',
        duration: 3,
        style: { marginTop: '20vh' },
      });
    } catch (error) {
      setError('privateKey', '创建签名者失败：' + error.message);
    }
  };

  // 更新选择的函数
  const handleFunctionChange = (value) => {
    handleInputChange('selectedFunction', value);
    const selectedFunctionDetails = contractState.abiFunctions.find(
      (item) => item.name === value
    );
    setContractState(prev => ({
      ...prev,
      functionParamTypes: selectedFunctionDetails ? selectedFunctionDetails.inputs : []
    }));
  };

  // 更新函数参数
  const handleFunctionParamsChange = (e) => {
    const paramsString = e.target.value;
    let paramsArray = [];

    if (paramsString.trim() !== "") {
      try {
        paramsArray = JSON.parse(`[${paramsString}]`);
      } catch (error) {
        paramsArray = paramsString.split(",").map((param) => param.trim());
      }
    }

    handleInputChange('functionParams', paramsArray);
  };

  // 获取合约中的函数列表和参数类型
  useEffect(() => {
    try {
      const abiJson = JSON.parse(formData.contractAbi);
      const functionDetails = abiJson
        .filter((item) => item.type === "function")
        .map((item) => ({
          name: item.name,
          inputs: item.inputs.map((input) => `${input.type} ${input.name}`),
          outputs: item.outputs.map((output) => output.type).join(", "),
        }));
      setContractState(prev => ({ ...prev, abiFunctions: functionDetails }));
      clearError('contractAbi');
    } catch (error) {
      setContractState(prev => ({ ...prev, abiFunctions: [] }));
      setError('contractAbi', 'ABI 解析失败，请检查格式');
    }
  }, [formData.contractAbi]);

  // 获取返回请求
  const getResponseFromContract = async () => {
    if (!validateInputs()) return;

    setContractState(prev => ({ ...prev, isFetching: true, response: null }));

    try {
      // 检测RPC URL可用性
      const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
      await provider.getBlockNumber();
    } catch (error) {
      setError('rpcUrl', 'RPC URL 不可用，请检查URL');
      setContractState(prev => ({ ...prev, isFetching: false }));
      return;
    }

    try {
      const contract = new ethers.Contract(
        formData.contractAddress,
        JSON.parse(formData.contractAbi),
        contractState.signer
      );

      const selectedFunctionDetails = contractState.abiFunctions.find(
        (item) => item.name === formData.selectedFunction
      );

      if (selectedFunctionDetails.inputs.length !== formData.functionParams.length) {
        setError('selectedFunction', '参数数量不匹配');
        setContractState(prev => ({ ...prev, isFetching: false }));
        return;
      }

      const result = await contract[formData.selectedFunction](...formData.functionParams);
      message.success({
        content: '交互成功',
        duration: 3,
        style: { marginTop: '20vh' },
      });
      setContractState(prev => ({ ...prev, response: result }));
    } catch (error) {
      console.error("Error fetching response:", error);
      setError('selectedFunction', '获取失败：' + error.message);
    } finally {
      setContractState(prev => ({ ...prev, isFetching: false }));
    }
  };

  return (
    <Fragment>
      <p>输入自有RPC接口，默认为 sepolia</p>
      <Input
        value={formData.rpcUrl}
        onChange={(e) => handleInputChange('rpcUrl', e.target.value)}
        placeholder="有效rpc"
      />
      {errors.rpcUrl && <p style={{ color: "red" }}>{errors.rpcUrl}</p>}

      <p>
        输入合约地址, 当前状态: {ethers.isAddress(formData.contractAddress) ? "✔" : "✗"}
      </p>
      <Input
        value={formData.contractAddress}
        onChange={(e) => handleInputChange('contractAddress', e.target.value)}
        placeholder="合约地址"
      />
      {errors.contractAddress && (
        <p style={{ color: "red" }}>{errors.contractAddress}</p>
      )}

      <p>输入私钥:</p>
      <Input.Password
        value={formData.privateKey}
        onChange={(e) => handleInputChange('privateKey', e.target.value)}
        placeholder="输入私钥"
      />
      {errors.privateKey && <p style={{ color: "red" }}>{errors.privateKey}</p>}
      <Button onClick={createSigner} style={{ marginBottom: '16px' }}>
        创建签名者
      </Button>

      <p>输入合约对应 ABI:</p>
      <Input.TextArea
        value={formData.contractAbi}
        onChange={(e) => handleInputChange('contractAbi', e.target.value)}
        placeholder="合约 ABI"
      />
      {errors.contractAbi && <p style={{ color: "red" }}>{errors.contractAbi}</p>}

      <p>选择要调用的函数:</p>
      <Select
        style={{ width: "100%" }}
        value={formData.selectedFunction}
        onChange={handleFunctionChange}
        placeholder="选择合约函数"
      >
        {contractState.abiFunctions.map((func, index) => (
          <Select.Option key={index} value={func.name}>
            {func.name} ({func.inputs.join(", ")})
            {func.outputs && ` -> ${func.outputs}`}
          </Select.Option>
        ))}
      </Select>
      {errors.selectedFunction && (
        <p style={{ color: "red" }}>{errors.selectedFunction}</p>
      )}

      <p>输入函数所需参数</p>
      <Input
        value={formData.functionParams.join(", ")}
        onChange={handleFunctionParamsChange}
        placeholder={`输入参数 (${contractState.functionParamTypes.join(", ")})`}
      />

      <Button 
        onClick={getResponseFromContract}
        loading={contractState.isFetching}
        disabled={!contractState.signer}
      >
        开始交互
      </Button>

      {contractState.isFetching && <p>正在获取结果...</p>}
      {contractState.response !== null && contractState.response.toString() !== "" && (
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px'
        }}>
          交互结果为：{contractState.response.toString()}
        </pre>
      )}
    </Fragment>
  );
}
