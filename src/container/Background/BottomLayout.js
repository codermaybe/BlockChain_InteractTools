import React, { useState } from "react";
import { Layout, Menu, Result } from "antd";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";

// 引入功能组件（根据实际路径调整）
import EthersTab from "../EtherContain/EthersTab";
import EtherTokenTab from "../EtherContain/EtherTokenTab";
// import DeployContract from "./DeployContract";
// import VerifyContract from "./VerifyContract";

const { Sider, Content } = Layout;

// 菜单配置（集中管理）
const MENU_ITEMS = [
  {
    key: "ethereum",
    label: "以太坊",
    icon: <MailOutlined />,
    children: [
      {
        key: "group1",
        type: "group",
        label: "简单交互",
        children: [
          { key: "eth-balance", label: "ETH查询余额" },
          { key: "token-interaction", label: "代币函数调用" },
        ],
      },
      {
        key: "group2",
        type: "group",
        label: "快速部署",
        children: [
          { key: "deploy-contract", label: "部署合约" },
          { key: "verify-contract", label: "验证合约" },
        ],
      },
    ],
  },
  {
    key: "solana",
    label: "Solana",
    icon: <AppstoreOutlined />,
    children: [
      { key: "sol-balance", label: "查询余额" },
      // 更多Solana菜单项...
    ],
  },
];

// 内容映射配置
const CONTENT_COMPONENTS = {
  "eth-balance": <EthersTab />,
  "token-interaction": <EtherTokenTab />,
  "deploy-contract": <div>部署合约组件（待实现）</div>, // 替换为实际组件
  "verify-contract": <div>验证合约组件（待实现）</div>, // 替换为实际组件
  "sol-balance": <div>Solana余额查询（待实现）</div>,
};

const BottomLayout = () => {
  // 状态管理
  const [activeKey, setActiveKey] = useState("eth-balance");
  const [openKeys, setOpenKeys] = useState(["ethereum"]);

  // 菜单点击处理
  const handleMenuClick = ({ key }) => {
    setActiveKey(key);
  };

  // 菜单展开处理
  const handleOpenChange = (keys) => {
    setOpenKeys(keys);
  };

  // 渲染内容区域
  const renderContent = () => {
    return (
      CONTENT_COMPONENTS[activeKey] || (
        <Result status="404" title="功能开发中" />
      )
    );
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={256} theme="light">
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          openKeys={openKeys}
          onOpenChange={handleOpenChange}
          onClick={handleMenuClick}
          items={MENU_ITEMS}
        />
      </Sider>

      <Content style={{ padding: 24, background: "#fff" }}>
        {renderContent()}
      </Content>
    </Layout>
  );
};

export default BottomLayout;
