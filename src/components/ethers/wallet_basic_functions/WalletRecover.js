import { Button, Input, Card, message } from "antd";
import { ethers } from "ethers";
import { Fragment, useState } from "react";

// 通过助记词恢复钱包
const WalletRecover = () => {
  const [mnemonic, setMnemonic] = useState("");
  const [Wallet, setWallet] = useState({
    privatekey: "",
    address: "",
    mnemonic: "",
  });

  const handleMnemonic = () => {
    message.error("助记词错误，请重新输入");
  };

  return (
    <Fragment>
      <Input
        placeholder="输入助记词"
        onChange={(e) => {
          setMnemonic(e.target.value);
          setWallet({
            privatekey: "",
            address: "",
            mnemonic: "",
          });
        }}
      ></Input>
      <Button
        onClick={() => {
          try {
            const wallet = ethers.Wallet.fromPhrase(mnemonic);
            setWallet({
              privatekey: wallet.privateKey,
              address: wallet.address,
              mnemonic: wallet.mnemonic.phrase,
            });
          } catch (error) {
            handleMnemonic();
          }
        }}
      >
        助记词恢复钱包
      </Button>

      <Card title="钱包信息">
        <p>钱包地址：{Wallet.address}</p>
        <p>钱包私钥：{Wallet.privatekey}</p>
        <p>钱包助记词：{Wallet.mnemonic}</p>
      </Card>
    </Fragment>
  );
};
export default WalletRecover;
