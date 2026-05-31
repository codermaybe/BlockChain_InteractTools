import React, { useState } from "react";
import { Badge, Button, Divider, Layout, Menu, Result, Space, Tag, Typography } from "antd";
import { LinkOutlined, SettingOutlined, UnorderedListOutlined } from "@ant-design/icons";
import GlobalSettingsDrawer from "../../components/shared/GlobalSettingsDrawer";
import TaskLogDrawer from "../../components/shared/TaskLogDrawer";
import { useAppSettings } from "../../state/AppSettingsContext";
import { useTaskLog } from "../../state/TaskLogContext";
import { getEvmChainByKey } from "../../config/chainRegistry";
import {
  DEFAULT_ACTIVE_KEY,
  DEFAULT_OPEN_KEYS,
  MENU_ITEMS,
  getToolContent,
  getToolLabel,
} from "../../config/toolNavigation.jsx";

const { Title, Paragraph } = Typography;
const { Sider, Content, Header } = Layout;

const BottomLayout = () => {
  const settings = useAppSettings();
  const { errorCount } = useTaskLog();

  // 状态管理
  const [activeKey, setActiveKey] = useState(DEFAULT_ACTIVE_KEY);
  const [openKeys, setOpenKeys] = useState(DEFAULT_OPEN_KEYS);
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

  const activeContent = getToolContent(activeKey);
  const activeLabel = getToolLabel(activeKey) || "功能开发中";
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
            {activeContent || <Result status="404" title="功能开发中" />}
          </div>
        </Content>
      </Layout>
      <GlobalSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <TaskLogDrawer open={logsOpen} onClose={() => setLogsOpen(false)} />
    </Layout>
  );
};

export default BottomLayout;
