import React from "react";
import BatchWalletGenerator from "../../components/batch/BatchWalletGenerator";
import BatchBalanceChecker from "../../components/batch/BatchBalanceChecker";
import BatchTokenSender from "../../components/batch/BatchTokenSender";
import MultiChainGasBoard from "../../components/batch/MultiChainGasBoard";
import ToolTabs from "../../components/shared/ToolTabs";

const ITEMS = [
  {
    key: "batch-wallet",
    label: "批量钱包",
    children: <BatchWalletGenerator />,
  },
  {
    key: "batch-balance",
    label: "批量余额",
    children: <BatchBalanceChecker />,
  },
  {
    key: "batch-transfer",
    label: "批量转账",
    children: <BatchTokenSender />,
  },
  {
    key: "multi-chain-gas",
    label: "Gas 面板",
    children: <MultiChainGasBoard />,
  },
];

export default function BatchToolTab() {
  return (
    <ToolTabs
      title="批量任务工作台"
      description="统一处理多地址任务，提供进度、结果与导出能力。"
      items={ITEMS}
      defaultActiveKey="batch-wallet"
    />
  );
}
