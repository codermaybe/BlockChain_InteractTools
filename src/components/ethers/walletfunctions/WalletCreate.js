import { ethers } from "ethers";
import { Button, Card, message } from "antd";
import { useState } from "react";

export default function WalletCreate() {
  const [walletAddress, setWalletAddress] = useState("");
  const [walletPrivateKey, setWalletPrivateKey] = useState("");
  const [walletMnemonic, setWalletMnemonic] = useState("");

  // 生成钱包
  const GenerateWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    setWalletAddress(wallet.address);
    setWalletPrivateKey(wallet.privateKey);
    setWalletMnemonic(wallet.mnemonic.phrase); // 只取助记词短语
  };

  // 复制文本到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        message.success("复制成功！");
      })
      .catch(() => {
        message.error("复制失败，请手动复制");
      });
  };

  return (
    <div>
      <Card title="钱包创建" bordered={false}>
        {/* 钱包地址 */}
        <p>
          钱包地址：{walletAddress}
          <Button
            type="link"
            onClick={() => copyToClipboard(walletAddress)}
            style={{ marginLeft: 8 }}
          >
            复制
          </Button>
        </p>

        {/* 钱包私钥 */}
        <p>
          钱包私钥：{walletPrivateKey}
          <Button
            type="link"
            onClick={() => copyToClipboard(walletPrivateKey)}
            style={{ marginLeft: 8 }}
          >
            复制
          </Button>
        </p>

        {/* 钱包助记词 */}
        <p>
          钱包助记词：{walletMnemonic}
          <Button
            type="link"
            onClick={() => copyToClipboard(walletMnemonic)}
            style={{ marginLeft: 8 }}
          >
            复制
          </Button>
        </p>
      </Card>
      <Button onClick={GenerateWallet} style={{ marginTop: 16 }}>
        生成钱包地址
      </Button>
    </div>
  );
}
