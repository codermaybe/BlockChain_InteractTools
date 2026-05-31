import { Button, Card, Divider, Space, message } from "antd";
import { ethers } from "ethers";
import { useState } from "react";
import { useSensitiveInput } from "../../../../hooks/useSensitiveInput.js";
import SensitiveField from "../../../shared/SensitiveField.jsx";
import WalletManager from "../../../../services/wallet/WalletManager";

export default function WalletRecover() {
  const mnemonicInput = useSensitiveInput();
  const privateKeyInput = useSensitiveInput();
  const [wallet, setWallet] = useState({
    privateKey: "",
    address: "",
    mnemonic: "",
  });

  const recoverFromMnemonic = () => {
    try {
      const currentMnemonic = mnemonicInput.getOnce();
      const recovered = ethers.Wallet.fromPhrase(currentMnemonic);
      setWallet({
        privateKey: recovered.privateKey,
        address: recovered.address,
        mnemonic: recovered.mnemonic?.phrase || "",
      });
    } catch {
      message.error("助记词错误，请重新输入");
    }
  };

  const recoverFromPrivateKey = () => {
    try {
      const currentPrivateKey = privateKeyInput.getOnce();
      const recovered = WalletManager.createFromPrivateKeyList(currentPrivateKey)[0];
      setWallet({
        privateKey: recovered.privateKey,
        address: recovered.address,
        mnemonic: recovered.mnemonic || "私钥无法恢复助记词",
      });
    } catch {
      message.error("私钥错误，请重新输入");
    }
  };

  return (
    <>
      <br />
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <SensitiveField {...mnemonicInput} label="助记词" multiline />
        <Button onClick={recoverFromMnemonic}>助记词恢复钱包</Button>

        <SensitiveField {...privateKeyInput} label="私钥" />
        <Button onClick={recoverFromPrivateKey}>私钥恢复钱包</Button>
      </Space>
      <Divider style={{ borderColor: "#08EFF9", borderWidth: "1px" }} />

      <Card
        title="钱包信息"
        style={{
          border: "1px solid #1890ff",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <SensitiveField value={wallet.address} label="钱包地址" readOnly />
          <SensitiveField value={wallet.privateKey} label="钱包私钥" readOnly />
          <SensitiveField value={wallet.mnemonic} label="钱包助记词" readOnly multiline />
        </Space>
      </Card>
    </>
  );
}
