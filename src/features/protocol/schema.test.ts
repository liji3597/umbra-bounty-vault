import { describe, expect, it } from 'vitest';

import {
  buildDisclosureViewInputSchema,
  claimPrivatePayoutInputSchema,
  claimPrivatePayoutResultSchema,
  claimablePayoutSchema,
  createPrivatePayoutFormSchema,
  createPrivatePayoutResultSchema,
  createPrivatePayoutValuesSchema,
  disclosureViewSchema,
  payoutStatusSchema,
  scanClaimablePayoutsInputSchema,
} from './schema';

describe('protocol schema', () => {
  it('parses the shared payout lifecycle DTOs', () => {
    expect(
      createPrivatePayoutResultSchema.parse({
        payoutId: 'payout-1',
        transactionHash: 'tx-1',
        status: 'confirmed',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'confirmed',
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

  it('parses shared create and claim inputs', () => {
    expect(
      createPrivatePayoutValuesSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '8',
        disclosureLevel: 'partial',
      }),
    ).toEqual({
      recipient: 'alice.sol',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '8',
      memo: null,
      disclosureLevel: 'partial',
    });

    expect(
      createPrivatePayoutValuesSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '8',
        memo: '   ',
        disclosureLevel: 'partial',
      }),
    ).toEqual({
      recipient: 'alice.sol',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '8',
      memo: null,
      disclosureLevel: 'partial',
    });

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
  });

  it('normalizes high-precision create payout form amounts inside protocol schema', () => {
    expect(
      createPrivatePayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5000',
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

  it('rejects numeric create payout form amounts inside protocol schema', () => {
    expect(() =>
      createPrivatePayoutFormSchema.parse({
        recipient: 'alice.sol',
        tokenMint: 'mint',
        amount: 12.5,
        disclosureLevel: 'none',
      }),
    ).toThrow('Amount exceeds supported numeric precision.');
  });

  it('parses shared claim DTOs', () => {
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

    expect(
      claimPrivatePayoutResultSchema.parse({
        payoutId: 'payout-1',
        claimStatus: 'claimed',
        transactionHash: 'claim-tx-1',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });
  });

  it('parses shared disclosure DTOs', () => {
    expect(
      buildDisclosureViewInputSchema.parse({
        payoutId: 'payout-1',
        level: 'partial',
        viewerRole: 'reviewer',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      level: 'partial',
      viewerRole: 'reviewer',
    });

    expect(
      disclosureViewSchema.parse({
        payoutId: 'payout-1',
        level: 'partial',
        title: 'Partial disclosure',
        summary: 'Bounded payout context is visible.',
        revealedFields: ['recipient'],
        verificationArtifacts: ['claim-signature'],
      }),
    ).toEqual({
      payoutId: 'payout-1',
      level: 'partial',
      title: 'Partial disclosure',
      summary: 'Bounded payout context is visible.',
      revealedFields: ['recipient'],
      verificationArtifacts: ['claim-signature'],
    });
  });
});

