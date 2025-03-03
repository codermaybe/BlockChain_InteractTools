//用于实时监听指定合约发生的交易或事件，并执行相应的操作。
import { Input } from "antd";
import { ethers } from "ethers";
import { useState } from "react";

export default function ContractEventListener() {
  const [api, setApi] = useState();

  // 创建一个提供者对象，用于连接以太坊网络
  const provider = new ethers.JsonRpcProvider(
    "https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID"
  );

  // 创建一个钱包对象，用于与合约进行交互
  const wallet = new ethers.Wallet("YOUR_PRIVATE_KEY", provider);
  return (
    <>
      <Input
        placeholder="输入rpc"
        value={api}
        onChange={(e) => {
          setApi(e.target.value);
        }}
      ></Input>
    </>
  );
}
