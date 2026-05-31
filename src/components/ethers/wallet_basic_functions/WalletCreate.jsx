import { ethers } from "ethers";
import { Button, Card, QRCode, Space, message } from "antd";
import { useSensitiveInput } from "../../../hooks/useSensitiveInput.js";
import SensitiveField from "../../../components/shared/SensitiveField.jsx";

export default function WalletCreate() {
  const walletAddress = useSensitiveInput();
  const walletPrivateKey = useSensitiveInput();
  const walletMnemonic = useSensitiveInput();

  const generateWallet = () => {
    const wallet = ethers.Wallet.createRandom();
    walletAddress.setValue(wallet.address);
    walletPrivateKey.setValue(wallet.privateKey);
    walletMnemonic.setValue(wallet.mnemonic?.phrase || "");
  };

  return (
    <div>
      <br />
      <Card
        title="钱包创建"
        bordered={false}
        style={{
          border: "1px solid #1890ff",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <QRCode value={walletAddress.value} />
          <SensitiveField {...walletAddress} label="钱包地址" readOnly />
          <SensitiveField {...walletPrivateKey} label="钱包私钥" readOnly />
          <SensitiveField {...walletMnemonic} label="钱包助记词" readOnly multiline />
        </Space>
      </Card>
      <Button onClick={generateWallet} style={{ marginTop: 16 }}>
        生成钱包地址
      </Button>
    </div>
  );
}
