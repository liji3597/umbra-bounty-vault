import { describe, expect, it } from 'vitest';

import {
  claimPrivatePayoutInputSchema,
  claimPrivatePayoutResultSchema,
  claimablePayoutSchema,
  scanClaimablePayoutsInputSchema,
} from './schema';

describe('claim schema', () => {
  it('parses scan input and a normalized claimable item', () => {
    expect(
      scanClaimablePayoutsInputSchema.parse({
        walletAddress: 'wallet-1',
        network: 'devnet',
      }),
    ).toEqual({
      walletAddress: 'wallet-1',
      network: 'devnet',
    });

    expect(
      claimablePayoutSchema.parse({
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      senderLabel: 'Umbra Labs',
      tokenSymbol: 'SOL',
      amount: 5,
      claimStatus: 'claimable',
    });
  });

  it('rejects unsupported scan networks', () => {
    expect(() =>
      scanClaimablePayoutsInputSchema.parse({
        walletAddress: 'wallet-1',
        network: 'unsupported',
      }),
    ).toThrow();
  });

  it('parses claim action input and result DTOs', () => {
    expect(
      claimPrivatePayoutInputSchema.parse({
        payoutId: 'payout-1',
        walletAddress: 'wallet-1',
        network: 'mainnet',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      walletAddress: 'wallet-1',
      network: 'mainnet',
    });

    expect(
      claimPrivatePayoutResultSchema.parse({
        payoutId: 'payout-1',
        claimStatus: 'claimed',
        transactionHash: 'tx-2',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'tx-2',
    });
  });
});
