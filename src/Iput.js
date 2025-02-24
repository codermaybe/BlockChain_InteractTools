//此文件测试监听区块链效果
const { ethers } = require("ethers");

// 通过Infura或Alchemy等服务提供的URL连接到以太坊网络
const provider = new ethers.JsonRpcProvider(
  "https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY"
);

// USDC 合约地址
let usdcadd = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// Transfer 事件签名哈希值
const transferEventSignature = "Transfer(address,address,uint256)";
//const transferEventSignatureHash = ethers.utils.id(transferEventSignature); // 获取事件签名的哈希
const transferEventSignatureHash = ethers.id(transferEventSignature);

// 创建合约实例 (没有完整ABI)
const contract = new ethers.Contract(usdcadd, [], provider);

// 监听 Transfer 事件
contract.on(transferEventSignatureHash, (from, to, value, event) => {
  console.log("start listening ........");
  console.log(
    `\nTransaction from ${from} ---> to ${to} ----> with ${value.toString()}`
  );
  console.log(event); // 你可以查看整个事件对象（包含交易信息等）
});
