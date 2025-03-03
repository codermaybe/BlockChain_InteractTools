import React, { useState } from "react";
import { Button, Input, Typography, message } from "antd";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

export default function DeployContract() {
  const [solidityCode, setSolidityCode] = useState("");

  const handleOpenRemix = () => {
    try {
      // 确保输入不为空
      if (!solidityCode.trim()) {
        message.warning("请输入 Solidity 代码");
        return;
      }

      // 将代码转为 Base64 编码
      const base64Code = btoa(solidityCode); // Base64 编码
      const encodedBase64 = encodeURIComponent(base64Code);

      // 构造 Remix URL，附加 Base64 编码的代码
      const remixUrl = `https://remix.ethereum.org/?code=${encodedBase64}&autoCompile=true`;

      // 在新标签页中打开 Remix
      window.open(remixUrl, "_blank");
    } catch (err) {
      message.error(`打开 Remix 失败: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <Title level={2}>输入 Solidity 代码</Title>
      <Paragraph>
        输入你的 Solidity 代码后，点击下方按钮，将在新标签页中打开 Remix IDE
        进行编译和部署。
      </Paragraph>
      <TextArea
        rows={10}
        value={solidityCode}
        onChange={(e) => setSolidityCode(e.target.value)}
        placeholder="请输入 Solidity 代码 (单文件)"
        style={{ width: "100%", fontFamily: "monospace" }}
      />
      <Button
        type="primary"
        onClick={handleOpenRemix}
        style={{ marginTop: "10px" }}
      >
        打开 Remix IDE
      </Button>
    </div>
  );
}
