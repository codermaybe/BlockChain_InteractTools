import { env } from "../env";

export const EVM_CHAIN_REGISTRY = [
  {
    key: "eth-mainnet",
    name: "Ethereum",
    chainId: 1,
    symbol: "ETH",
    envKey: "RPC_ETH_MAINNET",
    defaultRpc: "https://eth.llamarpc.com",
    explorerTx: "https://etherscan.io/tx/",
    explorerApiBase: "https://api.etherscan.io/api",
  },
  {
    key: "eth-sepolia",
    name: "Sepolia",
    chainId: 11155111,
    symbol: "ETH",
    envKey: "RPC_ETH_SEPOLIA",
    defaultRpc: "https://ethereum-sepolia-rpc.publicnode.com",
    explorerTx: "https://sepolia.etherscan.io/tx/",
    explorerApiBase: "https://api-sepolia.etherscan.io/api",
  },
  {
    key: "eth-goerli",
    name: "Goerli",
    chainId: 5,
    symbol: "ETH",
    envKey: "RPC_ETH_GOERLI",
    defaultRpc: "https://ethereum-goerli-rpc.publicnode.com",
    explorerTx: "https://goerli.etherscan.io/tx/",
    explorerApiBase: "https://api-goerli.etherscan.io/api",
  },
  {
    key: "bsc-mainnet",
    name: "BSC",
    chainId: 56,
    symbol: "BNB",
    envKey: "RPC_BSC_MAINNET",
    defaultRpc: "https://bsc-dataseed.binance.org",
    explorerTx: "https://bscscan.com/tx/",
    explorerApiBase: "https://api.bscscan.com/api",
  },
  {
    key: "base-mainnet",
    name: "Base",
    chainId: 8453,
    symbol: "ETH",
    envKey: "RPC_BASE_MAINNET",
    defaultRpc: "https://base-rpc.publicnode.com",
    explorerTx: "https://basescan.org/tx/",
    explorerApiBase: "https://api.basescan.org/api",
  },
  {
    key: "arbitrum-mainnet",
    name: "Arbitrum",
    chainId: 42161,
    symbol: "ETH",
    envKey: "RPC_ARBITRUM_MAINNET",
    defaultRpc: "https://arbitrum-one-rpc.publicnode.com",
    explorerTx: "https://arbiscan.io/tx/",
    explorerApiBase: "https://api.arbiscan.io/api",
  },
  {
    key: "optimism-mainnet",
    name: "Optimism",
    chainId: 10,
    symbol: "ETH",
    envKey: "RPC_OPTIMISM_MAINNET",
    defaultRpc: "https://optimism-rpc.publicnode.com",
    explorerTx: "https://optimistic.etherscan.io/tx/",
    explorerApiBase: "https://api-optimistic.etherscan.io/api",
  },
];

export const EVM_CHAIN_MAP = EVM_CHAIN_REGISTRY.reduce((acc, chain) => {
  acc[chain.key] = chain;
  return acc;
}, {});

export const SOLANA_CLUSTER_REGISTRY = [
  {
    key: "sol-mainnet",
    name: "Solana Mainnet",
    cluster: "mainnet-beta",
    symbol: "SOL",
    envKey: "RPC_SOLANA_MAINNET",
    defaultRpc: "https://api.mainnet-beta.solana.com",
    explorerTx: "https://solscan.io/tx/",
    explorerApiBase: null,
  },
  {
    key: "sol-devnet",
    name: "Solana Devnet",
    cluster: "devnet",
    symbol: "SOL",
    envKey: "RPC_SOLANA_DEVNET",
    defaultRpc: "https://api.devnet.solana.com",
    explorerTx: "https://solscan.io/tx/",
    explorerApiBase: null,
  },
  {
    key: "sol-testnet",
    name: "Solana Testnet",
    cluster: "testnet",
    symbol: "SOL",
    envKey: "RPC_SOLANA_TESTNET",
    defaultRpc: "https://api.testnet.solana.com",
    explorerTx: "https://solscan.io/tx/",
    explorerApiBase: null,
  },
];

export const SOLANA_CLUSTER_MAP = SOLANA_CLUSTER_REGISTRY.reduce(
  (acc, cluster) => {
    acc[cluster.key] = cluster;
    return acc;
  },
  {}
);

export function getEvmChainByKey(chainKey) {
  return EVM_CHAIN_MAP[chainKey] || EVM_CHAIN_REGISTRY[0];
}

export function getEvmChainOptions() {
  return EVM_CHAIN_REGISTRY.map((chain) => ({
    label: `${chain.name} (chainId: ${chain.chainId})`,
    value: chain.key,
  }));
}

export function resolveEvmChainRpc(chainKey, customRpc = "") {
  const trimmed = (customRpc || "").trim();
  if (trimmed) {
    return trimmed;
  }

  const chain = getEvmChainByKey(chainKey);
  return env(chain.envKey, chain.defaultRpc);
}

export function getSolanaClusterByKey(clusterKey) {
  return SOLANA_CLUSTER_MAP[clusterKey] || SOLANA_CLUSTER_REGISTRY[0];
}

export function getSolanaClusterOptions() {
  return SOLANA_CLUSTER_REGISTRY.map((cluster) => ({
    label: `${cluster.name} (${cluster.cluster})`,
    value: cluster.key,
  }));
}

export function resolveSolanaRpc(clusterKey, customRpc = "") {
  const trimmed = (customRpc || "").trim();
  if (trimmed) {
    return trimmed;
  }

  const cluster = getSolanaClusterByKey(clusterKey);
  return env(cluster.envKey, cluster.defaultRpc);
}
