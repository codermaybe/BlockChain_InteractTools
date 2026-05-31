import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  walletMock: vi.fn(),
  providerMock: vi.fn(),
}));

vi.mock('ethers', () => ({
  ethers: {
    Wallet: mocks.walletMock,
  },
}));

vi.mock('./providerFactory.js', () => ({
  createJsonRpcProvider: mocks.providerMock,
}));

import { createSigner } from './signerFactory';

describe('signerFactory', () => {
  it('creates signer with trimmed private key', () => {
    const provider = { rpcUrl: 'https://rpc' };
    mocks.providerMock.mockReturnValue({ provider });
    class WalletMock {
      constructor(privateKey, walletProvider) {
        this.privateKey = privateKey;
        this.provider = walletProvider;
      }
    }
    mocks.walletMock.mockImplementation(WalletMock);

    const result = createSigner('eth-mainnet', ' 0xabc ', 'https://custom.rpc');

    expect(mocks.providerMock).toHaveBeenCalledWith('eth-mainnet', 'https://custom.rpc');
    expect(mocks.walletMock).toHaveBeenCalledWith('0xabc', provider);
    expect(result).toMatchObject({ privateKey: '0xabc', provider });
  });

  it('rejects empty private key', () => {
    expect(() => createSigner('eth-mainnet', '   ')).toThrow('私钥不能为空');
  });
});
