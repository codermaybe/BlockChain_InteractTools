import { ethers } from "ethers";
import { createJsonRpcProvider } from "./providerFactory.js";

function normalizeAbi(abiInput) {
  if (typeof abiInput === "string") {
    return JSON.parse(abiInput);
  }
  if (Array.isArray(abiInput)) {
    return abiInput;
  }
  throw new Error("ABI 必须是 JSON 字符串或数组");
}

function normalizeParam(value, type) {
  if (type.endsWith("[]")) {
    if (Array.isArray(value)) return value;
    return `${value || ""}`
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (type === "bool") {
    return value === true || value === "true";
  }
  return value;
}

export function parseAbi(abiInput) {
  const abi = normalizeAbi(abiInput);
  const iface = new ethers.Interface(abi);
  const fragments = iface.fragments || [];

  return {
    abi,
    functions: fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => ({
        name: fragment.name,
        signature: fragment.format(),
        inputs: fragment.inputs.map((input) => ({
          name: input.name,
          type: input.type,
        })),
        outputs: fragment.outputs.map((output) => ({
          name: output.name,
          type: output.type,
        })),
        stateMutability: fragment.stateMutability,
        isReadOnly:
          fragment.stateMutability === "view" || fragment.stateMutability === "pure",
      })),
    events: fragments
      .filter((fragment) => fragment.type === "event")
      .map((fragment) => ({
        name: fragment.name,
        signature: fragment.format(),
        inputs: fragment.inputs.map((input) => ({
          name: input.name,
          type: input.type,
          indexed: input.indexed,
        })),
      })),
  };
}

export function getReadContract(chainKey, address, abi, customRpc = "") {
  const { provider } = createJsonRpcProvider(chainKey, customRpc);
  return new ethers.Contract(address, normalizeAbi(abi), provider);
}

export function getWriteContract(address, abi, signer) {
  if (!signer) {
    throw new Error("写合约需要 signer");
  }
  return new ethers.Contract(address, normalizeAbi(abi), signer);
}

export async function callFunction({ contract, fnName, params = [] }) {
  if (!contract || !fnName) {
    throw new Error("合约与函数名不能为空");
  }

  const fragment = contract.interface.getFunction(fnName);
  const normalizedParams = params.map((value, index) =>
    normalizeParam(value, fragment.inputs[index]?.type || "")
  );

  const result = await contract[fragment.format()](...normalizedParams);
  if (result && typeof result.wait === "function") {
    return result.wait();
  }
  return result;
}
