import React from "react";
import {
  AppstoreOutlined,
  MailOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

import EthersTab from "../container/EtherContain/EthersTab";
import EtherTokenTab from "../container/EtherContain/EtherTokenTab";
import WalletBasicTab from "../container/EtherContain/WalletBasicTab";
import WalletUpgrateTab from "../container/EtherContain/WalletUpgrateTab";
import SolanaTab from "../container/SolanaContain/SolanaTab";
import BatchToolTab from "../container/BatchContain/BatchToolTab";

export const DEFAULT_ACTIVE_KEY = "eth-balance";
export const DEFAULT_OPEN_KEYS = ["ethereum", "efficiency"];

const TOOL_SECTIONS = [
  {
    key: "ethereum",
    label: "以太坊",
    icon: MailOutlined,
    children: [
      {
        key: "group1",
        label: "简单交互",
        tools: [
          { key: "eth-balance", label: "ETH查询余额", component: EthersTab },
          { key: "token-interaction", label: "代币函数调用", component: EtherTokenTab },
        ],
      },
      {
        key: "group3",
        label: "钱包",
        tools: [
          { key: "wallet-basicfunction", label: "基础功能", component: WalletBasicTab },
          { key: "wallet-upgratefunction", label: "进阶功能", component: WalletUpgrateTab },
        ],
      },
    ],
  },
  {
    key: "solana",
    label: "Solana",
    icon: AppstoreOutlined,
    tools: [{ key: "sol-balance", label: "余额查询", component: SolanaTab }],
  },
  {
    key: "efficiency",
    label: "效率工具",
    icon: ThunderboltOutlined,
    tools: [{ key: "batch-suite", label: "批量任务工作台", component: BatchToolTab }],
  },
];

const TOOL_MAP = new Map();

function registerTool(tool) {
  TOOL_MAP.set(tool.key, tool);
  return { key: tool.key, label: tool.label };
}

export const MENU_ITEMS = TOOL_SECTIONS.map((section) => {
  const Icon = section.icon;
  const tools = section.tools || [];
  const children = section.children || [];

  return {
    key: section.key,
    label: section.label,
    icon: Icon ? <Icon /> : undefined,
    children:
      tools.length > 0
        ? tools.map(registerTool)
        : children.map((group) => ({
            key: group.key,
            type: "group",
            label: group.label,
            children: group.tools.map(registerTool),
          })),
  };
});

export function getToolLabel(toolKey) {
  return TOOL_MAP.get(toolKey)?.label || "";
}

export function getToolContent(toolKey) {
  const Component = TOOL_MAP.get(toolKey)?.component;
  return Component ? <Component /> : null;
}
