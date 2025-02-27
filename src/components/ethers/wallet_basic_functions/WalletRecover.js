import { Button, Input, Card, message, Divider } from "antd";
import { ethers } from "ethers";
import { useState } from "react";

// 通过助记词恢复钱包
const WalletRecover = () => {
  const [wallet, setWallet] = useState({
    privateKey: "",
    address: "",
    mnemonic: "",
  });
  const [mnemonic, setMnemonic] = useState("");
  const [privateKey, setPrivateKey] = useState("");

  return (
    <>
      <br />
      <Input.Password
        placeholder="输入助记词"
        onChange={(e) => setMnemonic(e.target.value)}
      />
      <Button
        onClick={() => {
          try {
            const wallet = ethers.Wallet.fromPhrase(mnemonic);
            setWallet({
              privateKey: wallet.privateKey,
              address: wallet.address,
              mnemonic: wallet.mnemonic.phrase,
            });
          } catch (error) {
            message.error("助记词错误，请重新输入");
          }
        }}
      >
        助记词恢复钱包
      </Button>

      <Input.Password
        placeholder="输入私钥"
        onChange={(e) => setPrivateKey(e.target.value)}
      />
      <Button
        onClick={() => {
          try {
            const wallet = new ethers.Wallet(privateKey);
            setWallet({
              privateKey: wallet.privateKey,
              address: wallet.address,
              mnemonic: wallet.mnemonic?.phrase || "私钥无法恢复助记词",
            });
          } catch (error) {
            message.error("私钥错误，请重新输入");
          }
        }}
      >
        私钥恢复钱包
      </Button>
      <Divider style={{ borderColor: "#08EFF9", borderWidth: "1px" }} />

      <Card
        title="钱包信息"
        style={{
          border: "1px solid #1890ff",
        }}
      >
        <p>钱包地址：{wallet.address}</p>
        <p>钱包私钥：{wallet.privateKey}</p>
        <p>
          钱包助记词：<span style={{ color: "red" }}>{wallet.mnemonic}</span>
        </p>
      </Card>
    </>
  );
};

export default WalletRecover;
