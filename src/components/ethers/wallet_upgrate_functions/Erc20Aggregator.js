import React, { useState } from "react";
import { Button, Input, List, message, Form, Alert } from "antd";
import { ethers } from "ethers";

const ERC20Aggregator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  // ERC20 代币 ABI（只需要 balanceOf 和 transfer 方法）
  const erc20Abi = [
    "function balanceOf(address owner) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
  ];

  // 处理归集
  const handleAggregate = async (values) => {
    const { rpcUrl, mainPrivateKey, tokenData } = values;
    setLoading(true);
    setErrors([]);

    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const mainWallet = new ethers.Wallet(mainPrivateKey, provider);

      // 解析代币数据
      const tokenList = tokenData
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [tokenAddress, privateKey] = line
            .split(",")
            .map((item) => item.trim());
          return { tokenAddress, privateKey };
        });

      // 遍历代币列表
      for (const { tokenAddress, privateKey } of tokenList) {
        try {
          const wallet = new ethers.Wallet(privateKey, provider);
          const tokenContract = new ethers.Contract(
            tokenAddress,
            erc20Abi,
            wallet
          );

          // 查询代币余额
          const balance = await tokenContract.balanceOf(wallet.address);
          if (balance !== 0) {
            // 转账代币
            const tx = await tokenContract.transfer(
              mainWallet.address,
              balance
            );
            await tx.wait();
            message.success(
              `Transferred ${balance}} tokens from ${wallet.address} to ${mainWallet.address}`
            );
          } else {
            setErrors((prev) => [
              ...prev,
              `No balance for token ${tokenAddress} in wallet ${wallet.address}`,
            ]);
          }
        } catch (error) {
          setErrors((prev) => [
            ...prev,
            `Error with token ${tokenAddress}: ${error.message}`,
          ]);
        }
      }
    } catch (error) {
      message.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>ERC20 代币归集</h1>
      <Alert
        message="提示"
        description="目前调用的方法为erc20通用的balanceOf和transfer方法，如果代币合约不支持这两个方法或实现有误，将无法归集，后续更新中细分各类方法。"
        type="info"
        showIcon
        closable
      />
      <Form form={form} onFinish={handleAggregate}>
        <Form.Item
          name="rpcUrl"
          label="RPC 接口"
          rules={[{ required: true, message: "请输入 RPC 接口" }]}
        >
          <Input placeholder="例如: https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID" />
        </Form.Item>
        <Form.Item
          name="mainPrivateKey"
          label="主钱包私钥"
          rules={[{ required: true, message: "请输入主钱包私钥" }]}
        >
          <Input.Password placeholder="用于接收代币的钱包私钥" />
        </Form.Item>
        <Form.Item
          name="tokenData"
          label="代币地址及私钥"
          rules={[{ required: true, message: "请输入代币地址及对应钱包私钥" }]}
        >
          <Input.TextArea rows={4} placeholder="每行格式: 代币地址,钱包私钥" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            开始归集
          </Button>
        </Form.Item>
      </Form>

      {/* 错误提示 */}
      {errors.length > 0 && (
        <div style={{ marginTop: "24px" }}>
          <h3>错误信息</h3>
          <List
            bordered
            dataSource={errors}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </div>
      )}
    </div>
  );
};

export default ERC20Aggregator;
