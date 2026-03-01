import { ethers } from "ethers";

const DEFAULT_DERIVATION_BASE = "m/44'/60'/0'/0";
const MAX_BATCH = 1000;

function clampBatchCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return 1;
  }
  return Math.min(Math.floor(n), MAX_BATCH);
}

function normalizePrivateKey(privateKey) {
  const text = (privateKey || "").trim();
  if (!text) return "";
  return text.startsWith("0x") ? text : `0x${text}`;
}

export default class WalletManager {
  static createRandomWallets(count) {
    const finalCount = clampBatchCount(count);
    const wallets = [];
    for (let i = 0; i < finalCount; i += 1) {
      const wallet = ethers.Wallet.createRandom();
      wallets.push({
        index: i,
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || "",
        derivationPath: wallet.mnemonic?.path || "",
        source: "random",
      });
    }
    return wallets;
  }

  static createFromMnemonic(mnemonic, count, startIndex = 0, basePath = DEFAULT_DERIVATION_BASE) {
    const phrase = (mnemonic || "").trim();
    if (!phrase) {
      throw new Error("助记词不能为空");
    }

    const finalCount = clampBatchCount(count);
    const start = Math.max(0, Math.floor(Number(startIndex) || 0));
    const wallets = [];

    for (let i = 0; i < finalCount; i += 1) {
      const currentIndex = start + i;
      const path = `${basePath}/${currentIndex}`;
      const wallet = ethers.Wallet.fromPhrase(phrase, undefined, path);
      wallets.push({
        index: currentIndex,
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: phrase,
        derivationPath: path,
        source: "mnemonic",
      });
    }

    return wallets;
  }

  static createFromPrivateKeyList(text) {
    const lines = (text || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (!lines.length) {
      throw new Error("请至少输入一个私钥");
    }

    return lines.map((line, index) => {
      const wallet = new ethers.Wallet(normalizePrivateKey(line));
      return {
        index,
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: "",
        derivationPath: "",
        source: "private-key-list",
      };
    });
  }
}
