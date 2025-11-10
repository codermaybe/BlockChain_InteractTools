import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import GetBalanceByEther from "../../components/ethers/GetBalance/GetBalanceByEther";
import GetBalanceByContract from "../../components/ethers/GetBalance/GetBalanceByContract";
import GetBalanceByEtherscanApi from "../../components/ethers/GetBalance/GetBalanceByEtherscanApi";
import UnitConverter from "../../components/ethers/Utils/UnitConverter.jsx";

export default function EthersTab() {
  // 确保组件名称以大写字母开头
  const [index, setIndex] = useState("A");

  const handleChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  return (
    <>
      <Tabs value={index} onChange={handleChange}>
        <Tab label="ethers.js rpc" value="A" />
        <Tab label="contract" value="B" />
        <Tab label="Etherscan API" value="C" />
        <Tab label="单位换算器" value="D" />
      </Tabs>

      {/* 根据选中的 tab 显示不同内容 */}
      {index === "A" && (
        <div>
          <GetBalanceByEther />
        </div>
      )}
      {index === "B" && (
        <div>
          {/*  */}
          <GetBalanceByContract />
        </div>
      )}
      {index === "C" && (
        <div>
          <GetBalanceByEtherscanApi />
        </div>
      )}
      {index === "D" && (
        <div>
          <UnitConverter />
        </div>
      )}
    </>
  );
}
