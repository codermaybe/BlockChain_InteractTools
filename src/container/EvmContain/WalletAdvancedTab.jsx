import React from "react";
import WalletTransactionHistory from "../../components/features/evm/advanced/WalletTransactionHistory.jsx";
import ContractEventListener from "../../components/features/evm/advanced/ContractEventListener.jsx";
import Erc20Aggregator from "../../components/features/evm/advanced/Erc20Aggregator.jsx";
import ToolTabs from "../../components/shared/ToolTabs";

const ITEMS = [
  {
    key: "wallet-history",
    label: "交易记录",
    children: <WalletTransactionHistory />,
  },
  {
    key: "contract-events",
    label: "事件监听",
    children: <ContractEventListener />,
  },
  {
    key: "erc20-aggregator",
    label: "ERC20 归集",
    children: <Erc20Aggregator />,
  },
];

export default function WalletAdvancedTab() {
  return (
    <ToolTabs
      title="钱包进阶功能"
      description="进阶查询与自动化操作能力，适合批量钱包与持续观察场景。"
      items={ITEMS}
      defaultActiveKey="wallet-history"
    />
  );
}
