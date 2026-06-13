import React from "react";
import ToolTabs from "../../components/shared/ToolTabs";
import SolanaBalanceChecker from "../../components/features/solana/SolanaBalanceChecker.jsx";
import SolanaVanityAddress from "../../components/features/solana/SolanaVanityAddress.jsx";

const TAB_ITEMS = [
  {
    key: "sol-balance",
    label: "余额查询",
    children: <SolanaBalanceChecker />,
  },
  {
    key: "sol-vanity",
    label: "虚荣地址",
    children: <SolanaVanityAddress />,
  },
];

export default function SolanaTab() {
  return (
    <ToolTabs
      description="Solana 工具已切换为可执行模式，当前提供 SOL/SPL 批量余额查询与本地虚荣地址计算。"
      defaultActiveKey="sol-balance"
      items={TAB_ITEMS}
    />
  );
}
