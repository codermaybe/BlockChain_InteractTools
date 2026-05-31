import React from "react";
import ERC20Balance from "../../components/ethers/GetTokenBalance/ERC20Balance.jsx";
import ERC721Balance from "../../components/ethers/GetTokenBalance/ERC721Balance.jsx";
import ERC1155Balance from "../../components/ethers/GetTokenBalance/ERC1155Balance.jsx";
import GeneralInteract from "../../components/ethers/GetTokenBalance/GeneralInteract.jsx";
import TokenInteract from "../../components/ethers/GetTokenBalance/TokenInteract.jsx";
import ToolTabs from "../../components/shared/ToolTabs";

const ITEMS = [
  {
    key: "token-interact",
    label: "通用合约交互",
    children: <TokenInteract />,
  },
  {
    key: "erc20-balance",
    label: "ERC20 余额",
    children: <ERC20Balance />,
  },
  {
    key: "erc721-balance",
    label: "ERC721 余额",
    children: <ERC721Balance />,
  },
  {
    key: "erc1155-balance",
    label: "ERC1155 余额",
    children: <ERC1155Balance />,
  },
  {
    key: "general-interact",
    label: "通用调用",
    children: <GeneralInteract />,
  },
];

export default function EtherTokenTab() {
  return (
    <ToolTabs
      title="代币交互中心"
      description="聚合 ERC20/ERC721/ERC1155 余额查询与通用 ABI 调用能力。"
      items={ITEMS}
      defaultActiveKey="token-interact"
    />
  );
}
