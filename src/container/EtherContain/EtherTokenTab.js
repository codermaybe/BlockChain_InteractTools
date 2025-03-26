import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ERC20Balance from "../../components/ethers/GetTokenBalance/ERC20Balance";
import ERC721Balance from "../../components/ethers/GetTokenBalance/ERC721Balance";
import ERC1155Balance from "../../components/ethers/GetTokenBalance/ERC1155Balance";
import GeneralInteract from "../../components/ethers/GetTokenBalance/GeneralInteract";
import TokenInteract from "../../components/ethers/GetTokenBalance/TokenInteract";

export default function EtherTokenTab() {
  // 确保组件名称以大写字母开头
  const [index, setIndex] = useState("A");

  const handleChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  return (
    <>
      <TokenInteract />
    </>
  );
}
