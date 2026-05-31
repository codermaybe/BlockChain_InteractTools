import { ethers } from "ethers";

export function isValidAddress(value) {
  return ethers.isAddress((value || "").trim());
}

export function formatEther(value) {
  return ethers.formatEther(value);
}

export function formatUnits(value, decimals = 18) {
  return ethers.formatUnits(value, decimals);
}
