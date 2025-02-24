import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ERC20Balance from "../../components/ethers/GetTokenBalance/ERC20Balance";
import ERC721Balance from "../../components/ethers/GetTokenBalance/ERC721Balance";
import ERC1155Balance from "../../components/ethers/GetTokenBalance/ERC1155Balance";
import GeneralInteract from "../../components/ethers/GetTokenBalance/GeneralInteract";

export default function EtherTokenTab() {
  // 确保组件名称以大写字母开头
  const [index, setIndex] = useState("A");

  const handleChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  return (
    <>
      <Tabs value={index} onChange={handleChange}>
        <Tab label="General" value="A" />
        <Tab label="ERC20" value="B" />
        <Tab label="ERC721" value="C" />
        <Tab label="ERC1155" value="D" />
      </Tabs>

      {/* 根据选中的 tab 显示不同内容 */}
      {index === "A" && (
        <div>
          <GeneralInteract />
        </div>
      )}
      {index === "B" && (
        <div>
          <ERC20Balance />
        </div>
      )}
      {index === "C" && (
        <div>
          <ERC721Balance />
        </div>
      )}
      {index === "D" && (
        <div>
          <ERC1155Balance />
        </div>
      )}
    </>
  );
}
