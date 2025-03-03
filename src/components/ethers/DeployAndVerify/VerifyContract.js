import React, { useState } from "react";
import { Button, Input, Typography, message, Form, Select } from "antd";
import { isAddress } from "ethers"; // 使用 ethers v6 的 isAddress

const { Title, Paragraph } = Typography;

// 网络选项常量
const NETWORK_OPTIONS = [
  { value: "mainnet", label: "Mainnet" }, // 修改为 "mainnet"
  { value: "sepolia.", label: "Sepolia" },
  { value: "Goerli.", label: "Goerli" },
];

export default function VerifyContract() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleVerifyOnEtherscan = async () => {
    try {
      setLoading(true);
      const { contractAddress, network } = await form.validateFields();

      // 验证合约地址
      if (!isAddress(contractAddress)) {
        message.error("请输入有效的合约地址 (0x...)");
        return;
      }

      // 跳转到 Etherscan 的验证页面
      const etherscanUrl = `https://${
        network === "mainnet" ? "" : network
      }etherscan.io/verifyContract?a=${contractAddress}`;
      window.open(etherscanUrl, "_blank");
    } catch (error) {
      message.error("请检查输入内容");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>验证智能合约（暂停开发）</Title>
      <Paragraph>
        输入你的合约地址和源代码后，点击下方按钮，将在新标签页中打开 Etherscan
        的合约验证页面。请按照页面提示完成验证。
      </Paragraph>

      <Form form={form} layout="vertical">
        {/* 网络选择器 */}
        <Form.Item
          name="network"
          label="网络"
          rules={[{ required: true, message: "请选择网络" }]}
        >
          <Select placeholder="请选择网络" options={NETWORK_OPTIONS} />
        </Form.Item>

        {/* 合约地址输入框 */}
        <Form.Item
          name="contractAddress"
          label="合约地址"
          rules={[
            { required: true, message: "请输入合约地址" },
            {
              validator: (_, value) =>
                isAddress(value)
                  ? Promise.resolve()
                  : Promise.reject("请输入有效的合约地址 (0x...)"),
            },
          ]}
        >
          <Input placeholder="请输入合约地址 (0x...)" />
        </Form.Item>

        {/* 验证按钮 */}
        <Form.Item>
          <Button
            type="primary"
            onClick={handleVerifyOnEtherscan}
            loading={loading}
          >
            前往 Etherscan 验证
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
