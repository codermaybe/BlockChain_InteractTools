import React, { useState } from "react";
import { Badge, Button, Divider, Layout, Menu, Result, Space, Tag, Typography } from "antd";
import {
  AppstoreOutlined,
  LinkOutlined,
  MailOutlined,
  ThunderboltOutlined,
  SettingOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

// 引入功能组件
import EthersTab from "../EtherContain/EthersTab";
import EtherTokenTab from "../EtherContain/EtherTokenTab";
import WalletBasicTab from "../EtherContain/WalletBasicTab";
import WalletUpgrateTab from "../EtherContain/WalletUpgrateTab";
import SolanaTab from "../SolanaContain/SolanaTab";
import BatchToolTab from "../BatchContain/BatchToolTab";
import GlobalSettingsDrawer from "../../components/shared/GlobalSettingsDrawer";
import TaskLogDrawer from "../../components/shared/TaskLogDrawer";
import { useAppSettings } from "../../state/AppSettingsContext";
import { useTaskLog } from "../../state/TaskLogContext";
import { getEvmChainByKey } from "../../config/chainRegistry";

const { Title, Paragraph } = Typography;
const { Sider, Content, Header } = Layout;

// 菜单配置
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
        key: "group3",
        type: "group",
        label: "钱包",
        children: [
          { key: "wallet-basicfunction", label: "基础功能" },
          { key: "wallet-upgratefunction", label: "进阶功能" },
        ],
      },
    ],
  },
  {
    key: "solana",
    label: "Solana",
    icon: <AppstoreOutlined />,
    children: [{ key: "sol-balance", label: "余额查询" }],
  },
  {
    key: "efficiency",
    label: "效率工具",
    icon: <ThunderboltOutlined />,
    children: [{ key: "batch-suite", label: "批量任务工作台" }],
  },
];

// 内容映射配置
const CONTENT_COMPONENTS = {
  "eth-balance": <EthersTab />,
  "token-interaction": <EtherTokenTab />,
  "wallet-basicfunction": <WalletBasicTab />,
  "wallet-upgratefunction": <WalletUpgrateTab />,
  "sol-balance": <SolanaTab />,
  "batch-suite": <BatchToolTab />,
};

function findLabelByKey(items, targetKey) {
  for (const item of items) {
    if (item.key === targetKey) return item.label;
    if (item.children) {
      const found = findLabelByKey(item.children, targetKey);
      if (found) return found;
    }
  }
  return "";
}

const BottomLayout = () => {
  const settings = useAppSettings();
  const { errorCount } = useTaskLog();

  // 状态管理
  const [activeKey, setActiveKey] = useState("eth-balance");
  const [openKeys, setOpenKeys] = useState(["ethereum", "efficiency"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

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

  const activeLabel = findLabelByKey(MENU_ITEMS, activeKey) || "功能开发中";
  const defaultChainName = getEvmChainByKey(
    settings.preferredEvmChainKey || settings.preferredChainKey
  ).name;

  return (
    <Layout className="h-screen overflow-hidden bg-gradient-to-br from-brand-50 via-slate-50 to-cyan-50">
      <Sider
        width={272}
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        className="!sticky !top-0 !h-screen border-r border-slate-200/70 !bg-white/95"
      >
        <div className="flex h-full flex-col">
          <div className="shrink-0 border-b border-slate-100 px-4 py-3">
            <Title level={5} style={{ margin: 0, lineHeight: 1.3 }}>
              BlockChain Interact Tools
            </Title>
            <Paragraph style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 12 }}>
              多链交互与批量任务工具台
            </Paragraph>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Menu
              mode="inline"
              selectedKeys={[activeKey]}
              openKeys={openKeys}
              onOpenChange={handleOpenChange}
              onClick={handleMenuClick}
              items={MENU_ITEMS}
              className="!border-r-0 !bg-transparent"
            />
          </div>
        </div>
      </Sider>

      <Layout className="h-screen">
        <Header className="!h-14 !min-h-0 !shrink-0 flex items-center border-b border-slate-200/70 !bg-white/80 !px-4 backdrop-blur md:!px-6 !leading-[56px]">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Title level={4} style={{ margin: 0 }}>
                {activeLabel}
              </Title>
              <Divider type="vertical" className="!mx-0 !h-5 !border-slate-300" />
              <Tag icon={<LinkOutlined />} color="processing">
                {defaultChainName}
              </Tag>
            </div>
            <Space wrap>
              <Badge count={errorCount} size="small">
                <Button icon={<UnorderedListOutlined />} onClick={() => setLogsOpen(true)}>
                  任务日志
                </Button>
              </Badge>
              <Button icon={<SettingOutlined />} type="primary" onClick={() => setSettingsOpen(true)}>
                全局配置
              </Button>
            </Space>
          </div>
        </Header>
        <Content className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
          <div className="workbench-surface min-h-full p-3 md:p-4">
            {renderContent()}
          </div>
        </Content>
      </Layout>
      <GlobalSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <TaskLogDrawer open={logsOpen} onClose={() => setLogsOpen(false)} />
    </Layout>
  );
};

export default BottomLayout;
