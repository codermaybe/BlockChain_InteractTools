import React from "react";
import WalletCreate from "../../components/ethers/wallet_basic_functions/WalletCreate";
import WalletRecover from "../../components/ethers/wallet_basic_functions/WalletRecover";
import WalletTransfer from "../../components/ethers/wallet_basic_functions/WalletTransfer";
import EthereumBasicData from "../../components/ethers/wallet_basic_functions/EthereumBasicData";
import ToolTabs from "../../components/shared/ToolTabs";

const ITEMS = [
  {
    key: "wallet-create",
    label: "生成钱包",
    children: <WalletCreate />,
  },
  {
    key: "wallet-transfer",
    label: "转账",
    children: <WalletTransfer />,
  },
  {
    key: "wallet-recover",
    label: "恢复钱包",
    children: <WalletRecover />,
  },
  {
    key: "base-chain-data",
    label: "基础链数据",
    children: <EthereumBasicData />,
  },
];

export default function WalletBasicTab() {
  return (
    <ToolTabs
      title="钱包基础功能"
      description="覆盖创建、恢复与转账操作，并支持链基础数据快速查询。"
      items={ITEMS}
      defaultActiveKey="wallet-create"
    />
  );
}
