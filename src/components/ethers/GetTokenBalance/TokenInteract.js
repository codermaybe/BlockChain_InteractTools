import { Input, Button, Select, Card, Space, message } from "antd";
import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";

// 代币标准配置
const TOKEN_STANDARDS = {
  General: {
    name: "通用",
    defaultAbi: "",
    defaultAddress: "",
    description: "无标准，任意调用",
  },
  ERC20: {
    name: "ERC20",
    defaultAbi:
      '[{"inputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"symbol","type":"string"},{"internalType":"uint8","name":"decimals","type":"uint8"},{"internalType":"uint256","name":"totalSupply","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_owner","type":"address"},{"indexed":true,"internalType":"address","name":"_spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_from","type":"address"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_to","type":"address"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_from","type":"address"},{"indexed":true,"internalType":"address","name":"_to","type":"address"},{"indexed":false,"internalType":"uint256","name":"_value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"remaining","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"burn","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"mint","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]',
    defaultAddress: "0x813EC62DF4EC162AFCFdd14D9C348ebdb91bD71E",
    description: "ERC20代币标准，用于同质化代币",
  },
  ERC721: {
    name: "ERC721",
    defaultAbi:
      '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721IncorrectOwner","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721InsufficientApproval","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC721InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"}],"name":"ERC721InvalidOperator","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"ERC721InvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC721InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC721InvalidSender","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721NonexistentToken","type":"error"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721OperatorQueryForNonexistentToken","type":"error"},{"inputs":[],"name":"ERC721TransferToNonERC721ReceiverImplementer","type":"error"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ERC721TransferToZeroAddress","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"approved","type":"address"},{"indexed":true,"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"operator","type":"address"},{"indexed":false,"internalType":"bool","name":"approved","type":"bool"}],"name":"ApprovalForAll","type":"event"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"approve","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"getApproved","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"operator","type":"address"}],"name":"isApprovedForAll","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"ownerOf","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"safeTransferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"operator","type":"address"},{"internalType":"bool","name":"approved","type":"bool"}],"name":"setApprovalForAll","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"tokenURI","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"tokenId","type":"uint256"}],"name":"transferFrom","outputs":[],"stateMutability":"nonpayable","type":"function"}]',
    defaultAddress: "0x9EfF02066670420A21828a8d29bB65C7180c5b0B",
    description: "ERC721代币标准，用于非同质化代币",
  },
  ERC1155: {
    name: "ERC1155",
    defaultAbi:
      '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"ReentrancyGuardReentrantCall","type":"error"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_buildingCompletedOn","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_saleAmount","type":"uint256"}],"name":"BuildingCompleted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_buildingStartedOn","type":"uint256"}],"name":"BuildingStarted","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_account","type":"address"},{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_amountRedeemed","type":"uint256"}],"name":"FeeRedeemed","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_fundraisingCompletedOn","type":"uint256"}],"name":"FundraisingCompleted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"string","name":"_name","type":"string"},{"indexed":false,"internalType":"string","name":"_description","type":"string"},{"indexed":false,"internalType":"string","name":"_image","type":"string"},{"indexed":false,"internalType":"uint256","name":"_goalAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_expectedProfit","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_builderFee","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_totalShares","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_fundraisingDeadline","type":"uint256"}],"name":"ProjectCreated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_account","type":"address"},{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_shares","type":"uint256"}],"name":"SharesBought","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"_account","type":"address"},{"indexed":false,"internalType":"uint256","name":"_projectId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"_shares","type":"uint256"}],"name":"SharesRedeemed","type":"event"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"builderToProjects","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"},{"internalType":"uint256","name":"_shares","type":"uint256"}],"name":"buyShares","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"},{"internalType":"uint256","name":"_depositUSDAmount","type":"uint256"},{"internalType":"bool","name":"_payWithEth","type":"bool"}],"name":"completeBuilding","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"usdAmount","type":"uint256"}],"name":"convertUSDToETH","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_description","type":"string"},{"internalType":"string","name":"_image","type":"string"},{"internalType":"uint256","name":"_goalAmount","type":"uint256"},{"internalType":"uint256","name":"_expectedProfit","type":"uint256"},{"internalType":"uint256","name":"_builderFee","type":"uint256"},{"internalType":"uint256","name":"_totalShares","type":"uint256"},{"internalType":"uint256","name":"_fundraisingDeadline","type":"uint256"}],"name":"createProject","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_builder","type":"address"}],"name":"getBuilderProjects","outputs":[{"components":[{"internalType":"uint256","name":"projectId","type":"uint256"},{"internalType":"address","name":"builder","type":"address"},{"internalType":"uint256","name":"currentAmount","type":"uint256"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"saleAmount","type":"uint256"},{"internalType":"uint256","name":"expectedProfit","type":"uint256"},{"internalType":"uint256","name":"builderFee","type":"uint256"},{"internalType":"uint256","name":"currentShares","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"fundraisingDeadline","type":"uint256"},{"internalType":"uint256","name":"fundraisingCompletedOn","type":"uint256"},{"internalType":"uint256","name":"buildingStartedOn","type":"uint256"},{"internalType":"uint256","name":"buildingCompletedOn","type":"uint256"}],"internalType":"struct HouseformManager.Project[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_builder","type":"address"}],"name":"getBuilderProjectsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_usdcAmount","type":"uint256"}],"name":"getETHAmountForUSDC","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getLatestPrice","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"}],"name":"getProject","outputs":[{"components":[{"internalType":"uint256","name":"projectId","type":"uint256"},{"internalType":"address","name":"builder","type":"address"},{"internalType":"uint256","name":"currentAmount","type":"uint256"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"saleAmount","type":"uint256"},{"internalType":"uint256","name":"expectedProfit","type":"uint256"},{"internalType":"uint256","name":"builderFee","type":"uint256"},{"internalType":"uint256","name":"currentShares","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"fundraisingDeadline","type":"uint256"},{"internalType":"uint256","name":"fundraisingCompletedOn","type":"uint256"},{"internalType":"uint256","name":"buildingStartedOn","type":"uint256"},{"internalType":"uint256","name":"buildingCompletedOn","type":"uint256"}],"internalType":"struct HouseformManager.Project","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getProjects","outputs":[{"components":[{"internalType":"uint256","name":"projectId","type":"uint256"},{"internalType":"address","name":"builder","type":"address"},{"internalType":"uint256","name":"currentAmount","type":"uint256"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"saleAmount","type":"uint256"},{"internalType":"uint256","name":"expectedProfit","type":"uint256"},{"internalType":"uint256","name":"builderFee","type":"uint256"},{"internalType":"uint256","name":"currentShares","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"fundraisingDeadline","type":"uint256"},{"internalType":"uint256","name":"fundraisingCompletedOn","type":"uint256"},{"internalType":"uint256","name":"buildingStartedOn","type":"uint256"},{"internalType":"uint256","name":"buildingCompletedOn","type":"uint256"}],"internalType":"struct HouseformManager.Project[]","name":"","type":"tuple[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getProjectsCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"}],"name":"getShareCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"}],"name":"getShareValue","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"priceFeed","outputs":[{"internalType":"contract IChainlinkEthToUSDFeed","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"projectToFeeRedeemed","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"projects","outputs":[{"internalType":"uint256","name":"projectId","type":"uint256"},{"internalType":"address","name":"builder","type":"address"},{"internalType":"uint256","name":"currentAmount","type":"uint256"},{"internalType":"uint256","name":"goalAmount","type":"uint256"},{"internalType":"uint256","name":"saleAmount","type":"uint256"},{"internalType":"uint256","name":"expectedProfit","type":"uint256"},{"internalType":"uint256","name":"builderFee","type":"uint256"},{"internalType":"uint256","name":"currentShares","type":"uint256"},{"internalType":"uint256","name":"totalShares","type":"uint256"},{"internalType":"uint256","name":"fundraisingDeadline","type":"uint256"},{"internalType":"uint256","name":"fundraisingCompletedOn","type":"uint256"},{"internalType":"uint256","name":"buildingStartedOn","type":"uint256"},{"internalType":"uint256","name":"buildingCompletedOn","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"}],"name":"redeemFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"},{"internalType":"uint256","name":"_shares","type":"uint256"}],"name":"redeemShares","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"shareContract","outputs":[{"internalType":"contract HouseformShare","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_projectId","type":"uint256"}],"name":"startBuilding","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"uniswapRouter","outputs":[{"internalType":"contract IUniswapV2Router02","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"usdcAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"usdcToken","outputs":[{"internalType":"contract IERC20","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"wethAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]',
    defaultAddress: "0x26058F9CDA87aAF7aC20C9778541Ecd0fA7c2B19",
    description: "ERC1155代币标准，用于多代币标准",
  },
};

export default function TokenInteract() {
  // 统一状态管理
  const [formData, setFormData] = useState({
    rpcUrl: "https://eth-sepolia.g.alchemy.com/v2/demo",
    contractAddress: "",
    contractAbi: "",
    privateKey: "",
    selectedFunction: null,
    functionParams: [],
    selectedStandard: "通用",
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

  // 初始化 provider
  useEffect(() => {
    try {
      const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
      setContractState((prev) => ({ ...prev, provider }));
    } catch (error) {
      setError("rpcUrl", "RPC URL 初始化失败：" + error.message);
    }
  }, []);

  // 监听 RPC URL 变化
  useEffect(() => {
    if (formData.rpcUrl) {
      try {
        const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
        setContractState((prev) => ({ ...prev, provider }));
        clearError("rpcUrl");
      } catch (error) {
        setError("rpcUrl", "RPC URL 更新失败：" + error.message);
      }
    }
  }, [formData.rpcUrl]);

  // 统一错误处理函数
  const setError = (field, messageText) => {
    setErrors((prev) => ({ ...prev, [field]: messageText }));
    message.error({
      content: messageText,
      duration: 3,
      style: { marginTop: "20vh" },
    });
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // 统一输入处理函数
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  // 验证输入
  const validateInputs = () => {
    let isValid = true;

    if (!formData.rpcUrl) {
      setError("rpcUrl", "请输入有效的RPC URL");
      isValid = false;
    }

    if (!ethers.isAddress(formData.contractAddress)) {
      setError("contractAddress", "请输入有效的合约地址");
      isValid = false;
    }

    if (errors.contractAbi) {
      setError("contractAbi", "ABI 解析失败，请检查格式");
      isValid = false;
    }

    if (!formData.selectedFunction) {
      setError("selectedFunction", "请选择要调用的函数");
      isValid = false;
    }

    const selectedFunctionDetails = contractState.abiFunctions.find(
      (item) => item.name === formData.selectedFunction
    );

    // 只有在非只读函数时才需要私钥
    if (
      selectedFunctionDetails &&
      !selectedFunctionDetails.isReadOnly &&
      !formData.privateKey
    ) {
      setError("privateKey", "该函数需要签名者，请输入私钥");
      isValid = false;
    }

    return isValid;
  };

  // 创建签名者
  const createSigner = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(formData.rpcUrl);
      const signer = new ethers.Wallet(formData.privateKey, provider);
      setContractState((prev) => ({ ...prev, signer, provider }));
      message.success({
        content: "签名者创建成功",
        duration: 3,
        style: { marginTop: "20vh" },
      });
    } catch (error) {
      setError("privateKey", "创建签名者失败：" + error.message);
    }
  };

  // 更新选择的函数
  const handleFunctionChange = (value) => {
    handleInputChange("selectedFunction", value);
    const selectedFunctionDetails = contractState.abiFunctions.find(
      (item) => item.name === value
    );
    setContractState((prev) => ({
      ...prev,
      functionParamTypes: selectedFunctionDetails
        ? selectedFunctionDetails.inputs
        : [],
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

    handleInputChange("functionParams", paramsArray);
  };

  // 处理代币标准变更
  const handleStandardChange = (value) => {
    const standard = TOKEN_STANDARDS[value];
    handleInputChange("selectedStandard", value);
    handleInputChange("contractAddress", standard.defaultAddress);
    handleInputChange("contractAbi", standard.defaultAbi);
    handleInputChange("selectedFunction", null);
    handleInputChange("functionParams", []);
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
          stateMutability: item.stateMutability,
          isReadOnly:
            item.stateMutability === "view" || item.stateMutability === "pure",
        }));
      setContractState((prev) => ({ ...prev, abiFunctions: functionDetails }));
      clearError("contractAbi");
    } catch (error) {
      setContractState((prev) => ({ ...prev, abiFunctions: [] }));
      setError("contractAbi", "ABI 解析失败，请检查格式");
    }
  }, [formData.contractAbi]);

  // 获取返回请求
  const getResponseFromContract = async () => {
    if (!validateInputs()) return;

    setContractState((prev) => ({ ...prev, isFetching: true, response: null }));

    try {
      const selectedFunctionDetails = contractState.abiFunctions.find(
        (item) => item.name === formData.selectedFunction
      );

      if (!selectedFunctionDetails) {
        setError("selectedFunction", "未找到选择的函数");
        setContractState((prev) => ({ ...prev, isFetching: false }));
        return;
      }

      if (
        selectedFunctionDetails.inputs.length !== formData.functionParams.length
      ) {
        setError("selectedFunction", "参数数量不匹配");
        setContractState((prev) => ({ ...prev, isFetching: false }));
        return;
      }

      // 根据函数类型选择使用 provider 还是 signer
      const contract = new ethers.Contract(
        formData.contractAddress,
        JSON.parse(formData.contractAbi),
        selectedFunctionDetails.isReadOnly
          ? contractState.provider
          : contractState.signer
      );

      const result = await contract[formData.selectedFunction](
        ...formData.functionParams
      );
      message.success({
        content: "交互成功",
        duration: 3,
        style: { marginTop: "20vh" },
      });
      setContractState((prev) => ({ ...prev, response: result }));
    } catch (error) {
      console.error("Error fetching response:", error);
      setError("selectedFunction", "获取失败：" + error.message);
    } finally {
      setContractState((prev) => ({ ...prev, isFetching: false }));
    }
  };

  return (
    <Card title="代币合约交互" style={{ margin: "0 16px" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <p>选择代币标准:</p>
          <Select
            style={{ width: "100%" }}
            value={formData.selectedStandard}
            onChange={handleStandardChange}
          >
            {Object.entries(TOKEN_STANDARDS).map(([key, value]) => (
              <Select.Option key={key} value={key}>
                {value.name} - {value.description}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <p>输入自有RPC接口，默认为 sepolia</p>
          <Input
            value={formData.rpcUrl}
            onChange={(e) => handleInputChange("rpcUrl", e.target.value)}
            placeholder="有效rpc"
          />
          {errors.rpcUrl && <p style={{ color: "red" }}>{errors.rpcUrl}</p>}
        </div>

        <div>
          <p>
            输入合约地址, 当前状态:{" "}
            {ethers.isAddress(formData.contractAddress) ? "✔" : "✗"}
          </p>
          <Input
            value={formData.contractAddress}
            onChange={(e) =>
              handleInputChange("contractAddress", e.target.value)
            }
            placeholder="合约地址"
          />
          {errors.contractAddress && (
            <p style={{ color: "red" }}>{errors.contractAddress}</p>
          )}
        </div>

        <div>
          <p>输入私钥:</p>
          <Input.Password
            value={formData.privateKey}
            onChange={(e) => handleInputChange("privateKey", e.target.value)}
            placeholder="输入私钥"
          />
          {errors.privateKey && (
            <p style={{ color: "red" }}>{errors.privateKey}</p>
          )}
          <Button onClick={createSigner} style={{ marginTop: "8px" }}>
            创建签名者
          </Button>
        </div>

        <div>
          <p>输入合约对应 ABI:</p>
          <Input.TextArea
            value={formData.contractAbi}
            onChange={(e) => handleInputChange("contractAbi", e.target.value)}
            placeholder="合约 ABI"
            rows={4}
          />
          {errors.contractAbi && (
            <p style={{ color: "red" }}>{errors.contractAbi}</p>
          )}
        </div>

        <div>
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
                {func.isReadOnly ? " (只读)" : " (需要签名)"}
              </Select.Option>
            ))}
          </Select>
          {errors.selectedFunction && (
            <p style={{ color: "red" }}>{errors.selectedFunction}</p>
          )}
        </div>

        <div>
          <p>输入函数所需参数</p>
          <Input
            value={formData.functionParams.join(", ")}
            onChange={handleFunctionParamsChange}
            placeholder={`输入参数 (${contractState.functionParamTypes.join(
              ", "
            )})`}
          />
        </div>

        <Button
          onClick={getResponseFromContract}
          loading={contractState.isFetching}
          disabled={!contractState.provider}
          type="primary"
          block
        >
          开始交互
        </Button>

        {contractState.isFetching && <p>正在获取结果...</p>}
        {contractState.response !== null &&
          contractState.response.toString() !== "" && (
            <pre
              style={{
                background: "#f5f5f5",
                padding: "16px",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: "300px",
              }}
            >
              交互结果为：{contractState.response.toString()}
            </pre>
          )}
      </Space>
    </Card>
  );
}
