import { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import WalletCreate from "../../components/ethers/wallet_basic_functions/WalletCreate";
import WalletRecover from "../../components/ethers/wallet_basic_functions/WalletRecover";

const WalletBasicTab = () => {
  const [index, setIndex] = useState("A");

  const handleChange = (event, newIndex) => {
    setIndex(newIndex);
  };

  return (
    <>
      <Tabs value={index} onChange={handleChange}>
        <Tab label="生成钱包" value="A" />
        <Tab label="转账" value="B" />
        <Tab label="钱包助记词/私钥恢复" value="C" />
      </Tabs>

      {/* 根据选中的 tab 显示不同内容 */}
      {index === "A" && (
        <div>
          <WalletCreate />
        </div>
      )}
      {index === "B" && <div></div>}
      {index === "C" && (
        <div>
          <WalletRecover />
        </div>
      )}
    </>
  );
};

export default WalletBasicTab;
