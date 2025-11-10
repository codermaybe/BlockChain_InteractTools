import React from "react";
import { Card, Typography, Result } from "antd";

const { Title, Paragraph } = Typography;

// 轻量占位组件：用于恢复构建，后续可替换为真实 Solana 查询
const SolanaTab = () => {
  return (
    <Card bordered={false} style={{ width: "100%" }}>
      <Title level={4}>Solana 工具（占位）</Title>
      <Paragraph>
        该模块用于 Solana 相关功能（如余额查询等）。当前为占位组件，
        主要用于恢复页面结构与导航。后续将补充真实功能。
      </Paragraph>
      <Result status="info" title="Solana 功能开发中" />
    </Card>
  );
};

export default SolanaTab;

