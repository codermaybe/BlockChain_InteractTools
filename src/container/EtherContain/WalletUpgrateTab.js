import React from "react";
import WalletTransactionHistory from "../../components/ethers/wallet_upgrate_functions/WalletTransactionHistory";
import ContractEventListener from "../../components/ethers/wallet_upgrate_functions/ContractEventListener";
import Erc20Aggregator from "../../components/ethers/wallet_upgrate_functions/Erc20Aggregator";
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

export default function WalletUpgrateTab() {
  return (
    <ToolTabs
      title="钱包进阶功能"
      description="进阶查询与自动化操作能力，适合批量钱包与持续观察场景。"
      items={ITEMS}
      defaultActiveKey="wallet-history"
    />
  );
}
