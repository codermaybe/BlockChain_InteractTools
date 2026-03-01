import React from "react";
import GetBalanceByEther from "../../components/ethers/GetBalance/GetBalanceByEther";
import GetBalanceByContract from "../../components/ethers/GetBalance/GetBalanceByContract";
import GetBalanceByEtherscanApi from "../../components/ethers/GetBalance/GetBalanceByEtherscanApi";
import UnitConverter from "../../components/ethers/Utils/UnitConverter.jsx";
import ToolTabs from "../../components/shared/ToolTabs";

const ITEMS = [
  {
    key: "ethers-rpc",
    label: "RPC 查询",
    children: <GetBalanceByEther />,
  },
  {
    key: "contract-query",
    label: "合约查询",
    children: <GetBalanceByContract />,
  },
  {
    key: "explorer-api",
    label: "Etherscan API",
    children: <GetBalanceByEtherscanApi />,
  },
  {
    key: "unit-converter",
    label: "单位换算",
    children: <UnitConverter />,
  },
];

export default function EthersTab() {
  return (
    <ToolTabs
      title="EVM 余额与基础查询"
      description="聚合 RPC、合约接口与浏览器 API 三类查询能力，并保留常用单位换算。"
      items={ITEMS}
      defaultActiveKey="ethers-rpc"
    />
  );
}
