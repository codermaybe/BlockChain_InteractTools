import { Fragment, useState, useEffect } from "react";
import { ethers } from "ethers";
import { Input, Button, message } from "antd";
import { env } from "../../../env";

function GetBalanceByEther() {
  const ganacheRpc = env("ganacheRpc", "");
  const ganacheAddress = env("ganacheAddress", "");
  const [UserRpc, setUserRpc] = useState(ganacheRpc);
  const [RpcStatus, setRpcStatus] = useState(false);
  const [WalletAddress, setWalletAddress] = useState(ganacheAddress);
  const [balance, setBalance] = useState("加载中...");
  const [isLoading, setIsLoading] = useState(false);

  // 检查 RPC 状态
  const checkRpcStatus = async (rpcUrl) => {
    if (!rpcUrl) {
      setRpcStatus(false);
      return false;
    }

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      await provider.getBlockNumber();
      setRpcStatus(true);
      return true;
    } catch (error) {
      console.error("RPC 连接失败:", error);
      setRpcStatus(false);
      return false;
    }
  };

  // 初始化时检查 RPC 状态
  useEffect(() => {
    checkRpcStatus(UserRpc);
  }, []);

  // 获取余额
  const getBalance = async () => {
    if (!ethers.isAddress(WalletAddress)) {
      message.error("无效的地址");
      return;
    }

    if (!RpcStatus) {
      message.error("RPC 未连接");
      return;
    }

    setIsLoading(true);
    setBalance("加载中...");

    try {
      const provider = new ethers.JsonRpcProvider(UserRpc);
      const result = await provider.getBalance(WalletAddress);
      const balanceInEth = ethers.formatEther(result);
      setBalance(balanceInEth);
    } catch (error) {
      console.error("获取余额时出错:", error);
      setBalance(`错误: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 RPC URL 变化
  const handleRpcChange = async (e) => {
    const newRpc = e.target.value;
    setUserRpc(newRpc);
    await checkRpcStatus(newRpc);
  };

  // 处理地址变化
  const handleAddressChange = (e) => {
    setWalletAddress(e.target.value);
    setBalance("加载中...");
  };

  return (
    <Fragment>
      <div className="GBBE">
        <p> 当前RPC状态:{RpcStatus ? "✔" : "✗"}</p>
        <p> current rpc is {UserRpc}</p>
        <Input
          placeholder="输入自有RPC接口，默认为ganache"
          onChange={handleRpcChange}
          disabled={isLoading}
        />
        <br />
        <br />
        <p> current target address is {WalletAddress}</p>
        <p> 当前地址状态:{ethers.isAddress(WalletAddress) ? "✔" : "✗"}</p>
        <Input
          placeholder="输入想查询的钱包余额"
          type="text"
          value={WalletAddress}
          onChange={handleAddressChange}
          disabled={isLoading}
        />
        <p>
          地址
          {WalletAddress}
          的余额是 {balance} ETH
        </p>
        <Button onClick={getBalance} disabled={isLoading}>
          {isLoading ? "查询中..." : "获取余额"}
        </Button>
      </div>
    </Fragment>
  );
}

export default GetBalanceByEther;
