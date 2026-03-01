import { Connection } from "@solana/web3.js";
import { getSolanaClusterByKey, resolveSolanaRpc } from "../../config/chainRegistry";

const connectionCache = new Map();

export function createSolanaConnection(
  clusterKey,
  customRpc = "",
  forceNew = false
) {
  const cluster = getSolanaClusterByKey(clusterKey);
  const rpcUrl = resolveSolanaRpc(cluster.key, customRpc);
  const cacheKey = `${cluster.key}::${rpcUrl}`;

  if (!forceNew && connectionCache.has(cacheKey)) {
    return {
      connection: connectionCache.get(cacheKey),
      rpcUrl,
      cluster,
    };
  }

  const connection = new Connection(rpcUrl, "confirmed");
  connectionCache.set(cacheKey, connection);

  return { connection, rpcUrl, cluster };
}

export async function probeSolanaConnection(connection) {
  const [slot, latestBlockhash] = await Promise.all([
    connection.getSlot("confirmed"),
    connection.getLatestBlockhash("confirmed"),
  ]);

  return {
    slot,
    blockhash: latestBlockhash.blockhash,
  };
}
