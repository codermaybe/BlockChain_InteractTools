import { ethers } from "ethers";
import { getChainByKey, resolveChainRpc } from "../../config/chainRegistry";

const providerCache = new Map();

export function createJsonRpcProvider(
  chainKey,
  customRpc = "",
  forceNew = false
) {
  const chain = getChainByKey(chainKey);
  const rpcUrl = resolveChainRpc(chain.key, customRpc);
  const cacheKey = `${chain.key}::${rpcUrl}`;

  if (!forceNew && providerCache.has(cacheKey)) {
    return { provider: providerCache.get(cacheKey), rpcUrl, chain };
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  providerCache.set(cacheKey, provider);

  return { provider, rpcUrl, chain };
}

export async function probeProvider(provider) {
  const [network, blockNumber] = await Promise.all([
    provider.getNetwork(),
    provider.getBlockNumber(),
  ]);

  return {
    chainId: Number(network.chainId),
    blockNumber,
  };
}
