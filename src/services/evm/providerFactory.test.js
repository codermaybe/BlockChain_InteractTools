import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  providerMock: vi.fn(),
}));

vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: mocks.providerMock,
  },
}));

vi.mock('../../config/chainRegistry', () => ({
  getEvmChainByKey: vi.fn((chainKey) => ({
    key: chainKey,
    envKey: `RPC_${chainKey.toUpperCase()}`,
    defaultRpc: 'https://default.rpc',
  })),
  resolveEvmChainRpc: vi.fn((chainKey, customRpc) => customRpc || `https://${chainKey}.rpc`),
}));

import { createJsonRpcProvider, probeProvider } from './providerFactory';

describe('providerFactory', () => {
  beforeEach(() => {
    mocks.providerMock.mockClear();
  });

  it('caches provider by chain and rpc', () => {
    const first = createJsonRpcProvider('eth-mainnet', 'https://custom.rpc');
    const second = createJsonRpcProvider('eth-mainnet', 'https://custom.rpc');

    expect(mocks.providerMock).toHaveBeenCalledTimes(1);
    expect(first.provider).toBe(second.provider);
    expect(first.rpcUrl).toBe('https://custom.rpc');
    expect(first.chain.key).toBe('eth-mainnet');
  });

  it('probes provider network data', async () => {
    const provider = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: 1 }),
      getBlockNumber: vi.fn().mockResolvedValue(12345),
    };

    await expect(probeProvider(provider)).resolves.toEqual({ chainId: 1, blockNumber: 12345 });
  });
});
