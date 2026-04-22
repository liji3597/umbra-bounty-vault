import { describe, expect, it } from 'vitest';

import {
  createPayoutFormSchema,
  createPrivatePayoutResultSchema,
  payoutStatusSchema,
} from './schema';

describe('payout schema', () => {
  it('parses a valid payout form payload, normalizes amount, and normalizes memo', () => {
    expect(
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5000',
        memo: '   ',
        disclosureLevel: 'partial',
      }),
    ).toEqual({
      recipient: 'alice.sol',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '12.5',
      memo: null,
      disclosureLevel: 'partial',
    });
  });

  it('preserves precise decimal strings instead of collapsing them into JS numbers', () => {
    expect(
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: '1.0000000000000000001',
        disclosureLevel: 'none',
      }),
    ).toEqual({
      recipient: 'alice.sol',
      tokenMint: 'mint',
      amount: '1.0000000000000000001',
      memo: null,
      disclosureLevel: 'none',
    });
  });

  it('rejects an empty recipient, non-positive amount, or non-finite amount', () => {
    expect(() =>
      createPayoutFormSchema.parse({
        recipient: ' ',
        tokenMint: 'mint',
        amount: '1',
        disclosureLevel: 'none',
      }),
    ).toThrow();

    expect(() =>
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: '0',
        disclosureLevel: 'none',
      }),
    ).toThrow('Amount must be greater than zero.');

    expect(() =>
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: Number('1e309'),
        disclosureLevel: 'none',
      }),
    ).toThrow('Amount must be a finite number.');
  });

  it('rejects numeric amount input so callers cannot bypass string precision checks', () => {
    expect(() =>
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: 12.5,
        disclosureLevel: 'none',
      }),
    ).toThrow('Amount exceeds supported numeric precision.');
  });

  it('accepts very large integer strings without losing decimal fidelity', () => {
    expect(
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: '100000000000000000000000',
        disclosureLevel: 'none',
      }),
    ).toEqual({
      recipient: 'alice.sol',
      tokenMint: 'mint',
      amount: '100000000000000000000000',
      memo: null,
      disclosureLevel: 'none',
    });
  });

  it('rejects exponent input that would exceed normalized precision limits', () => {
    expect(() =>
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: '1e400',
        disclosureLevel: 'none',
      }),
    ).toThrow('Amount exceeds supported numeric precision.');

    expect(() =>
      createPayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: '1e-401',
        disclosureLevel: 'none',
      }),
    ).toThrow('Amount exceeds supported numeric precision.');
  });

  it('parses app-facing payout result and status DTOs', () => {
    expect(
      createPrivatePayoutResultSchema.parse({
        payoutId: 'payout-1',
        transactionHash: 'tx-1',
        status: 'submitted',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'submitted',
    });

    expect(
      payoutStatusSchema.parse({
        payoutId: 'payout-1',
        status: 'claimable',
        network: 'devnet',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      status: 'claimable',
      network: 'devnet',
    });
  });
});
