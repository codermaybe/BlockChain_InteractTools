import { describe, expect, it, vi } from 'vitest';
import { ERC20_MIN_ABI } from '../../config/abis';
import { callFunction, getReadContract, getWriteContract, parseAbi } from './contractService';

describe('contractService', () => {
  it('parses functions and events from ABI', () => {
    const parsed = parseAbi(ERC20_MIN_ABI);

    expect(parsed.functions.some((item) => item.name === 'balanceOf' && item.isReadOnly)).toBe(true);
    expect(parsed.functions.some((item) => item.name === 'transfer' && !item.isReadOnly)).toBe(true);
    expect(parsed.events.some((item) => item.name === 'Transfer')).toBe(true);
  });

  it('rejects invalid ABI input', () => {
    expect(() => parseAbi({})).toThrow('ABI 必须是 JSON 字符串或数组');
  });

  it('requires signer for write contract', () => {
    expect(() => getWriteContract('0x0000000000000000000000000000000000000000', ERC20_MIN_ABI)).toThrow(
      '写合约需要 signer'
    );
  });

  it('creates read and write contract instances', () => {
    const readContract = getReadContract('eth-mainnet', '0x0000000000000000000000000000000000000000', ERC20_MIN_ABI);
    const writeContract = getWriteContract(
      '0x0000000000000000000000000000000000000000',
      ERC20_MIN_ABI,
      { provider: {} }
    );

    expect(readContract).toBeDefined();
    expect(writeContract).toBeDefined();
  });

  it('calls contract functions with normalized params', async () => {
    const wait = vi.fn().mockResolvedValue({ status: 1 });
    const contract = {
      interface: {
        getFunction: vi.fn(() => ({
          format: () => 'setFlag(bool)',
          inputs: [{ type: 'bool' }],
        })),
      },
      'setFlag(bool)': vi.fn().mockResolvedValue({ wait }),
    };

    await expect(callFunction({ contract, fnName: 'setFlag', params: ['true'] })).resolves.toEqual({ status: 1 });
    expect(contract['setFlag(bool)']).toHaveBeenCalledWith(true);
  });
});
