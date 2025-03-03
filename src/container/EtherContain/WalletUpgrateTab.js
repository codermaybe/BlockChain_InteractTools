import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import WalletTransactionHistory from "../../components/ethers/wallet_upgrate_functions/WalletTransactionHistory";
import ContractEventListener from "../../Iput";

const WalletUpgrateTab = () => {
  const [index, setIndex] = useState("A");

  const handleChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  return (
    <>
      <Tabs value={index} onChange={handleChange}>
        <Tab label="交易记录查询" value="A" />
        <Tab label="区块链交易监听" value="B" />
        <Tab label="钱包助记词/私钥恢复" value="C" />
      </Tabs>

      {/* 根据选中的 tab 显示不同内容 */}
      {index === "A" && (
        <div>
          <WalletTransactionHistory />
        </div>
      )}
      {index === "B" && (
        <div>
          <ContractEventListener />
        </div>
      )}
      {index === "C" && <div></div>}
    </>
  );
};

export default WalletUpgrateTab;
