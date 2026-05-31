import { describe, expect, it } from 'vitest';
import {
  EVM_CHAIN_REGISTRY,
  SOLANA_CLUSTER_REGISTRY,
  getEvmChainByKey,
  getEvmChainOptions,
  getSolanaClusterByKey,
  getSolanaClusterOptions,
  resolveEvmChainRpc,
  resolveSolanaRpc,
} from './chainRegistry';

describe('chainRegistry', () => {
  it('returns evm chain data by key', () => {
    const chain = getEvmChainByKey('eth-mainnet');
    expect(chain.key).toBe('eth-mainnet');
    expect(chain.explorerApiBase).toBeTruthy();
  });

  it('returns evm chain options', () => {
    const options = getEvmChainOptions();
    expect(options).toHaveLength(EVM_CHAIN_REGISTRY.length);
    expect(options[0]).toHaveProperty('label');
    expect(options[0]).toHaveProperty('value');
  });

  it('prefers custom evm rpc over default', () => {
    expect(resolveEvmChainRpc('eth-mainnet', 'https://custom.rpc')).toBe('https://custom.rpc');
  });

  it('returns solana cluster data by key', () => {
    const cluster = getSolanaClusterByKey('sol-mainnet');
    expect(cluster.key).toBe('sol-mainnet');
  });

  it('returns solana cluster options', () => {
    const options = getSolanaClusterOptions();
    expect(options).toHaveLength(SOLANA_CLUSTER_REGISTRY.length);
  });

  it('prefers custom solana rpc over default', () => {
    expect(resolveSolanaRpc('sol-mainnet', 'https://custom.sol.rpc')).toBe('https://custom.sol.rpc');
  });
});
