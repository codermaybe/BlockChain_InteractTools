import { Button, Input, message } from "antd";
import { useState } from "react";
import { Web3 } from "web3";

export default function ContractEventListener() {
  const [wssRpc, setWssRpc] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [contractAbi, setContractAbi] = useState("");
  const [address, setAddress] = useState("");
  const [subscription, setSubscription] = useState(null); // 保存 subscription 对象

  async function subscribe() {
    try {
      const web3 = new Web3(wssRpc);
      // 将 contractAbi 从字符串解析为 JSON
      const abi = JSON.parse(contractAbi);
      // 创建合约实例
      const contract = new web3.eth.Contract(abi, address);

      // 订阅事件
      const subscription = contract.events.EventName();

      // 监听事件
      subscription.on("data", (event) => {
        console.log("监听到事件:", event);
      });

      // 保存 subscription 对象
      setSubscription(subscription);
      message.success("开始监听事件");
    } catch (error) {
      message.error("监听失败: " + error.message);
    }
  }

  async function unsubscribe() {
    if (subscription) {
      try {
        await subscription.unsubscribe(); // 取消订阅
        setSubscription(null); // 清空 subscription
        message.success("结束监听事件");
      } catch (error) {
        message.error("取消订阅失败: " + error.message);
      }
    }
  }

  async function handlesubscription() {
    if (isListening) {
      await unsubscribe(); // 结束监听
    } else {
      await subscribe(); // 开始监听
    }
    setIsListening(!isListening); // 切换监听状态
  }

  return (
    <>
      <Input
        placeholder="请输入WSS RPC"
        value={wssRpc}
        onChange={(e) => {
          setWssRpc(e.target.value);
        }}
      />
      <Input
        placeholder="请输入合约地址"
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
        }}
      />
      <Input.TextArea
        placeholder="请输入合约ABI（JSON格式）"
        value={contractAbi}
        onChange={(e) => {
          setContractAbi(e.target.value);
        }}
      />
      <Button onClick={handlesubscription}>
        {isListening ? "结束监听" : "开始监听"}
      </Button>
    </>
  );
}
