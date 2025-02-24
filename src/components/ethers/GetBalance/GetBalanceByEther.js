import { Fragment, useState } from "react";
import { ethers } from "ethers";
import { Input, Button } from "antd";

function GetBalanceByEther() {
  const ganacheRpc = process.env.REACT_APP_ganacheRpc;
  const ganacheAddress = process.env.REACT_APP_ganacheAddress;
  const [UserRpc, setUserRpc] = useState(ganacheRpc);
  const [RpcStatus, setRpcStatus] = useState(CheckRpcStatus(ganacheRpc));

  const [WalletAddress, setWalletAddress] = useState(ganacheAddress);

  const [balance, setBalance] = useState("加载中...");

  async function getBalance() {
    const provider = new ethers.JsonRpcProvider(UserRpc);
    console.log("Rpc is " + UserRpc);
    console.log("address is " + WalletAddress);
    try {
      const result = await provider.getBalance(WalletAddress);
      const balanceInEth = ethers.formatEther(result);
      setBalance(balanceInEth);
      provider.destroy();
    } catch (error) {
      console.error("获取余额时出错:", error);
      setBalance("Error");
      provider.destroy();
    }
  }
  async function CheckRpcStatus() {
    let provider = new ethers.JsonRpcProvider(UserRpc);
    try {
      // 尝试获取当前区块号来检查 RPC 是否正常
      await provider.getBlockNumber();
      //console.log("RPC 连接正常，当前区块号是：", blockNumber);

      await setRpcStatus(true);
      provider.destroy();
      return true; // RPC 正常
    } catch (error) {
      //console.error("RPC 连接失败，错误信息：", error);
      setRpcStatus(false);
      provider.destroy();
      return false; // RPC 连接失败
    }
  }

  return (
    <Fragment>
      <div className="GBBE">
        <p> 当前RPC状态:{RpcStatus ? "✔" : "✗"}</p>
        <p> current rpc is {UserRpc}</p>
        <Input
          placeholder="输入自有RPC接口，默认为ganache"
          onChange={(e) => setUserRpc(e.target.value)}
        />
        <br />

        <br />
        <p> current target address is {WalletAddress}</p>
        <p> 当前地址状态:{ethers.isAddress(WalletAddress) ? "✔" : "✗"}</p>
        <Input
          placeholder="输入想查询的钱包余额"
          type="text"
          value={WalletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <p>
          地址
          {WalletAddress}
          的余额是 {balance} ETH
        </p>
        <Button onClick={getBalance}>获取余额</Button>
      </div>
    </Fragment>
  );
}

export default GetBalanceByEther;
