import { Select, Input, Button, message } from "antd";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function GetBalanceByEtherscanApi() {
  const [url, setUrl] = useState("https://api.etherscan.io/api");
  const [apiKey, setApiKey] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [fullUrl, setFullUrl] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    setFullUrl(
      `${url}?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${apiKey}`
    );
  }, [url, apiKey, walletAddress]);

  function getResult() {
    console.log(fullUrl); // 调试信息
    fetch(fullUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((jsonData) => {
        console.log(jsonData); // 调试信息
        if (jsonData.status === "1") {
          setResult(ethers.formatUnits(jsonData.result, 18)); // 格式化余额为 Ether
          message.success("获取成功");
        } else {
          setResult(jsonData.result);
          message.error(`获取失败: ${jsonData.message}`);
        }
      })
      .catch((error) => {
        console.error("Error fetching balance:", error);
        message.error("获取失败");
      });
  }

  return (
    <>
      <p>选择查询的链</p>
      <Select
        placeholder="选择网络"
        defaultValue={"1"}
        onChange={(value, option) => {
          setUrl(option.url || "https://api.etherscan.io/api");
        }}
      >
        <Select.Option value="1" url={"https://api.etherscan.io/api"}>
          ETH-MAINNET
        </Select.Option>
        <Select.Option value="2" url={"https://api-sepolia.etherscan.io/api"}>
          ETH-SEPOLIA
        </Select.Option>
        <Select.Option value="3" url={"https://api-goerli.etherscan.io/api"}>
          ETH-Goerli
        </Select.Option>
      </Select>

      <p>输入api-key</p>
      <Input
        placeholder="your-api-key"
        value={apiKey}
        onChange={(e) => {
          setApiKey(e.target.value);
        }}
      />
      <p>输入需查询的钱包地址</p>
      <Input
        placeholder="your-wallet-address"
        value={walletAddress}
        onChange={(e) => {
          setWalletAddress(e.target.value);
        }}
      />
      <Button onClick={getResult}>开始查询</Button>
      <p>查询结果: {result} ETH</p>
    </>
  );
}
