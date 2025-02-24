import { Input, Button, Select, message } from "antd";
import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";

export default function ERC721Interact() {
  // 初始化状态
  const [rpcUrl, setRpcUrl] = useState(
    "https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY"
  );
  const [contractAddress, setContractAddress] = useState(
    "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4"
  );
  const [contractAbi, setContractAbi] = useState(
    '[{"inputs":[{"internalType":"contract IPoolManager","name":"_poolManager","type":"address"},{"internalType":"contract IAllowanceTransfer","name":"_permit2","type":"address"},{"internalType":"uint256","name":"_unsubscribeGasLimit","type":"uint256"},{"internalType":"contract IPositionDescriptor","name":"_tokenDescriptor","type":"address"},{"internalType":"contract IWETH9","name":"_weth9","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"subscriber","type":"address"}],"name":"AlreadySubscribed","type":"error"},{"inputs":[{"internalType":"address","name":"subscriber","type":"address"},{"internalType":"bytes","name":"reason","type":"bytes"}],"name":"BurnNotificationReverted","type":"error"},{"inputs":[],"name":"ContractLocked","type":"error"},{"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"DeadlinePassed","type":"error"},{"inputs":[{"internalType":"Currency","name":"currency","type":"address"}],"name":"DeltaNotNegative","type":"error"},{"inputs":[{"internalType":"Currency","name":"currency","type":"address"}],"name":"DeltaNotPositive","type":"error"},{"inputs":[],"name":"GasLimitTooLow","type":"error"},{"inputs":[],"name":"InputLengthMismatch","type":"error"},{"inputs":[],"name":"InsufficientBalance","type":"error"},{"inputs":[],"name":"InvalidContractSignature","type":"error"},{"inputs":[],"name":"InvalidEthSender","type":"error"},{"inputs":[],"name":"InvalidSignature","type":"error"},{"inputs":[],"name":"InvalidSignatureLength","type":"error"},{"inputs":[],"name":"InvalidSigner","type":"error"},{"inputs":[{"internalType":"uint128","name":"maximumAmount","type":"uint128"},{"internalType":"uint128","name":"amountRequested","type":"uint128"}],"name":"MaximumAmountExceeded","type":"error"},{"inputs":[{"internalType":"uint128","name":"minimumAmount","type":"uint128"},{"internalType":"uint128","name":"amountReceived","type":"uint128"}],"name":"MinimumAmountInsufficient","type":"error"},{"inputs":[{"internalType":"address","name":"subscriber","type":"address"},{"internalType":"bytes","name":"reason","type":"bytes"}],"name":"ModifyLiquidityNotificationReverted","type":"error"},{"inputs":[],"name":"NoCodeSubscriber","type":"error"},{"inputs":[],"name":"NoSelfPermit","type":"error"},{"inputs":[],"name":"NonceAlreadyUsed","type":"error"},{"inputs":[{"internalType":"address","name":"caller","type":"address"}],"name":"NotApproved","type":"error"},{"inputs":[],"name":"NotPoolManager","type":"error"},{"inputs":[],"name":"NotSubscribed","type":"error"},{"inputs":[],"name":"PoolManagerMustBeLocked","type":"error"},{"inputs":[],"name":"SignatureDeadlineExpired","type":"error"},{"inputs":[{"internalType":"address","name":"subscriber","type":"address"},{"internalType":"bytes","name":"reason","type":"bytes"}],"name":"SubscriptionReverted","type":"error"},{"inputs":[],"name":"Unauthorized","type":"error"},{"inputs":[{"internalType":"uint256","name":"action","type":"uint256"}],"name":"UnsupportedAction","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"subscriber","type":"address"}],"name":"Subscription","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"id","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":true,"internalType":"address","name":"subscriber","type":"address"}],"name":"Unsubscription","type":"event"},{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"WETH9","outputs":[{"internalType":"contract IWETH9","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getPoolAndPositionInfo","outputs":[{"components":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"internalType":"struct PoolKey","name":"poolKey","type":"tuple"},{"internalType":"PositionInfo","name":"info","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getPositionLiquidity","outputs":[{"internalType":"uint128","name":"liquidity","type":"uint128"}],"stateMutability":"view","type":"function"},{"inputs":[{"components":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"internalType":"struct PoolKey","name":"key","type":"tuple"},{"internalType":"uint160","name":"sqrtPriceX96","type":"uint160"}],"name":"initializePool","outputs":[{"internalType":"int24","name":"","type":"int24"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes","name":"unlockData","type":"bytes"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"modifyLiquidities","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes","name":"actions","type":"bytes"},{"internalType":"bytes[]","name":"params","type":"bytes[]"}],"name":"modifyLiquiditiesWithoutUnlock","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"msgSender","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes[]","name":"data","type":"bytes[]"}],"name":"multicall","outputs":[{"internalType":"bytes[]","name":"results","type":"bytes[]"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"nextTokenId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256","name":"word","type":"uint256"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"bitmap","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"id","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"owner","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"permit","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"components":[{"components":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"uint48","name":"expiration","type":"uint48"},{"internalType":"uint48","name":"nonce","type":"uint48"}],"internalType":"struct IAllowanceTransfer.PermitDetails","name":"details","type":"tuple"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"sigDeadline","type":"uint256"}],"internalType":"struct IAllowanceTransfer.PermitSingle","name":"permitSingle","type":"tuple"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"permit","outputs":[{"internalType":"bytes","name":"err","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"permit2","outputs":[{"internalType":"contract IAllowanceTransfer","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"components":[{"components":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint160","name":"amount","type":"uint160"},{"internalType":"uint48","name":"expiration","type":"uint48"},{"internalType":"uint48","name":"nonce","type":"uint48"}],"internalType":"struct IAllowanceTransfer.PermitDetails[]","name":"details","type":"tuple[]"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"sigDeadline","type":"uint256"}],"internalType":"struct IAllowanceTransfer.PermitBatch","name":"_permitBatch","type":"tuple"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"permitBatch","outputs":[{"internalType":"bytes","name":"err","type":"bytes"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"bytes","name":"signature","type":"bytes"}],"name":"permitForAll","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"bytes25","name":"poolId","type":"bytes25"}],"name":"poolKeys","outputs":[{"internalType":"Currency","name":"currency0","type":"address"},{"internalType":"Currency","name":"currency1","type":"address"},{"internalType":"uint24","name":"fee","type":"uint24"},{"internalType":"int24","name":"tickSpacing","type":"int24"},{"internalType":"contract IHooks","name":"hooks","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"poolManager","outputs":[{"internalType":"contract IPoolManager","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"positionInfo","outputs":[{"internalType":"PositionInfo","name":"info","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"nonce","type":"uint256"}],"name":"revokeNonce","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"newSubscriber","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"subscribe","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"subscriber","outputs":[{"internalType":"contract ISubscriber","name":"subscriber","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenDescriptor","outputs":[{"internalType":"contract IPositionDescriptor","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"id","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"data","type":"bytes"}],"name":"unlockCallback","outputs":[{"internalType":"bytes","name":"","type":"bytes"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"unsubscribe","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"unsubscribeGasLimit","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"stateMutability":"payable","type":"receive"}]'
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
