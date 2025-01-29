import React, { useState } from "react";
import {
  AppstoreOutlined,
  MailOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Result } from "antd";
import EthersTab from "../EtherContain/EthersTab";
import EtherTokenTab from "../EtherContain/EtherTokenTab";
import DeployContract from "../../components/ethers/DeployAndVerify/DeployContract";

const { Sider, Content } = Layout;

const items = [
  {
    key: "sub1",
    label: "以太坊",
    icon: <MailOutlined />,
    children: [
      {
        key: "g1",
        label: "简单交互",
        type: "group",
        children: [
          {
            key: "1",
            label: "ETH查询余额",
          },
          {
            key: "2",
            label: "代币（Token）函数调用",
          },
        ],
      },
      {
        key: "g2",
        label: "快速部署",
        type: "group",
        children: [
          {
            key: "3",
            label: "部署合约",
          },
          {
            key: "4",
            label: "验证合约",
          },
        ],
      },
    ],
  },
  {
    key: "sub2",
    label: "Navigation Two",
    icon: <AppstoreOutlined />,
    children: [
      {
        key: "5",
        label: "Option 5",
      },
      {
        key: "sub3",
        label: "Submenu",
        children: [
          {
            key: "7",
            label: "Option 7",
          },
        ],
      },
    ],
  },
  {
    type: "divider",
  },
  {
    key: "sub4",
    label: "Navigation Three",
    icon: <SettingOutlined />,
    children: [
      {
        key: "9",
        label: "Option 9",
      },
    ],
  },
  {
    key: "grp",
    label: "Group",
    type: "group",
    children: [
      {
        key: "13",
        label: "Option 13",
      },
      {
        key: "14",
        label: "Option 14",
      },
    ],
  },
];

const BottomLayout = () => {
  // 状态管理当前选中的菜单项
  const [selectedKey, setSelectedKey] = useState("1");

  const onClick = (e) => {
    console.log("click ", e);
    setSelectedKey(e.key); // 更新选中项
  };

  // 根据选中的菜单项渲染右侧内容
  const renderContent = () => {
    switch (selectedKey) {
      case "1":
        return (
          <div>
            <EthersTab />
          </div>
        );
      case "2":
        return (
          <div>
            <EtherTokenTab />
          </div>
        );
      case "3":
        return (
          <div>
            <DeployContract />
          </div>
        );
      case "5":
        return <div>Option 5 的内容</div>;
      case "7":
        return <div>Submenu 的内容</div>;
      default:
        return <Result status="404" title="404" subTitle="本页未更新." />; // 默认内容
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* 左侧的菜单栏 */}
      <Sider width={256} style={{ background: "#fff" }}>
        <Menu
          onClick={onClick}
          style={{
            width: "100%",
          }}
          defaultSelectedKeys={["1"]}
          defaultOpenKeys={["sub1"]}
          mode="inline"
          items={items}
        />
      </Sider>

      {/* 右侧的主内容区域 */}
      <Layout>
        <Content style={{ padding: "24px", background: "#f0f2f5" }}>
          {renderContent()} {/* 动态渲染内容 */}
        </Content>
      </Layout>
    </Layout>
  );
};

export default BottomLayout;
