import { ethers } from "ethers";
import { createJsonRpcProvider } from "./providerFactory.js";

export function createSigner(chainKey, privateKey, customRpc = "") {
  const value = (privateKey || "").trim();
  if (!value) {
    throw new Error("私钥不能为空");
  }

  const { provider } = createJsonRpcProvider(chainKey, customRpc);
  return new ethers.Wallet(value, provider);
}
