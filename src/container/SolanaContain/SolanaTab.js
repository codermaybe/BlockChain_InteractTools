import React from "react";
import ToolTabs from "../../components/shared/ToolTabs";
import SolanaBalanceChecker from "../../components/solana/SolanaBalanceChecker";

const TAB_ITEMS = [
  {
    key: "sol-balance",
    label: "余额查询",
    children: <SolanaBalanceChecker />,
  },
];

export default function SolanaTab() {
  return (
    <ToolTabs
      description="Solana 工具已切换为可执行模式，当前提供 SOL/SPL 批量余额查询。"
      defaultActiveKey="sol-balance"
      items={TAB_ITEMS}
    />
  );
}
