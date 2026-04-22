import { describe, expect, it, vi } from 'vitest';

import { createDemoUmbraGateway } from './demoUmbraGateway';
import { createUmbraService, createNotImplementedUmbraService } from './umbraService';

describe('umbraService', () => {
  it('validates input before calling the gateway and returns typed payout results', async () => {
    const createPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'submitted',
    });

    const service = createUmbraService({
      createPrivatePayout,
      getPayoutStatus: vi.fn(),
      scanClaimablePayouts: vi.fn(),
      claimPrivatePayout: vi.fn(),
      buildDisclosureView: vi.fn(),
    });

    await expect(
      service.createPrivatePayout({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '8',
        disclosureLevel: 'none',
      }),
    ).resolves.toEqual({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'submitted',
    });

    expect(createPrivatePayout).toHaveBeenCalledWith({
      recipient: 'alice.sol',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '8',
      memo: null,
      disclosureLevel: 'none',
    });
  });

  it('rejects gateway results that do not match app-facing schemas', async () => {
    const service = createUmbraService({
      createPrivatePayout: vi.fn().mockResolvedValue({
        payoutId: 'payout-1',
        rawSdkReceipt: true,
      }),
      getPayoutStatus: vi.fn(),
      scanClaimablePayouts: vi.fn(),
      claimPrivatePayout: vi.fn(),
      buildDisclosureView: vi.fn(),
    });

    await expect(
      service.createPrivatePayout({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '8',
        disclosureLevel: 'none',
      }),
    ).rejects.toThrow();
  });

  it('validates scan input before calling the gateway and returns typed claimable payouts', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);

    const service = createUmbraService({
      createPrivatePayout: vi.fn(),
      getPayoutStatus: vi.fn(),
      scanClaimablePayouts,
      claimPrivatePayout: vi.fn(),
      buildDisclosureView: vi.fn(),
    });

    await expect(
      service.scanClaimablePayouts({
        walletAddress: 'wallet-1',
        network: 'devnet',
      }),
    ).resolves.toEqual([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);

    expect(scanClaimablePayouts).toHaveBeenCalledWith({
      walletAddress: 'wallet-1',
      network: 'devnet',
    });
  });

  it('validates claim input before calling the gateway and returns typed claim results', async () => {
    const claimPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });

    const service = createUmbraService({
      createPrivatePayout: vi.fn(),
      getPayoutStatus: vi.fn(),
      scanClaimablePayouts: vi.fn(),
      claimPrivatePayout,
      buildDisclosureView: vi.fn(),
    });

    await expect(
      service.claimPrivatePayout({
        payoutId: 'payout-1',
        walletAddress: 'wallet-1',
        network: 'devnet',
      }),
    ).resolves.toEqual({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });

    expect(claimPrivatePayout).toHaveBeenCalledWith({
      payoutId: 'payout-1',
      walletAddress: 'wallet-1',
      network: 'devnet',
    });
  });

  it('validates disclosure input before calling the gateway and returns a typed disclosure view', async () => {
    const buildDisclosureView = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      level: 'partial',
      title: 'Partial disclosure view',
      summary: 'Only bounded payout context is revealed for this disclosure package.',
      revealedFields: ['recipient'],
      verificationArtifacts: ['network-confirmation'],
    });

    const service = createUmbraService({
      createPrivatePayout: vi.fn(),
      getPayoutStatus: vi.fn(),
      scanClaimablePayouts: vi.fn(),
      claimPrivatePayout: vi.fn(),
      buildDisclosureView,
    });

    await expect(
      service.buildDisclosureView({
        payoutId: 'payout-1',
        level: 'partial',
        viewerRole: 'reviewer',
      }),
    ).resolves.toEqual({
      payoutId: 'payout-1',
      level: 'partial',
      title: 'Partial disclosure view',
      summary: 'Only bounded payout context is revealed for this disclosure package.',
      revealedFields: ['recipient'],
      verificationArtifacts: ['network-confirmation'],
    });

    expect(buildDisclosureView).toHaveBeenCalledWith({
      payoutId: 'payout-1',
      level: 'partial',
      viewerRole: 'reviewer',
    });
  });

  it('rejects disclosure results that do not match app-facing schemas', async () => {
    const service = createUmbraService({
      createPrivatePayout: vi.fn(),
      getPayoutStatus: vi.fn(),
      scanClaimablePayouts: vi.fn(),
      claimPrivatePayout: vi.fn(),
      buildDisclosureView: vi.fn().mockResolvedValue({
        payoutId: 'payout-1',
        level: 'partial',
        title: 'Broken disclosure view',
        summary: 'This response is missing revealed fields for a partial disclosure package.',
        revealedFields: [],
        verificationArtifacts: ['network-confirmation'],
      }),
    });

    await expect(
      service.buildDisclosureView({
        payoutId: 'payout-1',
        level: 'partial',
        viewerRole: 'reviewer',
      }),
    ).rejects.toThrow('Partial disclosure requires at least one revealed field.');
  });

  it('returns preview claimable payouts through the demo gateway wiring', async () => {
    const service = createUmbraService(createDemoUmbraGateway());

    await expect(
      service.scanClaimablePayouts({
        walletAddress: 'preview-wallet-1',
        network: 'mainnet',
      }),
    ).resolves.toEqual([
      {
        payoutId: 'preview-mainnet-preview-wallet-1',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 125,
        claimStatus: 'claimable',
      },
    ]);
  });

  it('returns preview claim results through the demo gateway wiring', async () => {
    const service = createUmbraService(createDemoUmbraGateway());

    await expect(
      service.claimPrivatePayout({
        payoutId: 'preview-mainnet-preview-wallet-1',
        walletAddress: 'preview-wallet-1',
        network: 'mainnet',
      }),
    ).resolves.toEqual({
      payoutId: 'preview-mainnet-preview-wallet-1',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-preview-wallet-1-preview-mainnet-preview-wallet-1',
    });
  });

  it('returns reviewer disclosure previews through the demo gateway wiring', async () => {
    const service = createUmbraService(createDemoUmbraGateway());

    await expect(
      service.buildDisclosureView({
        payoutId: 'preview-disclosure',
        level: 'verification-ready',
        viewerRole: 'reviewer',
      }),
    ).resolves.toEqual({
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      title: 'Verification package ready',
      summary: 'Bounded reviewer access is available for this payout preview.',
      revealedFields: ['recipient', 'amount'],
      verificationArtifacts: ['commitment-proof', 'network-confirmation'],
    });
  });

  it('returns role-specific disclosure previews through the demo gateway wiring', async () => {
    const service = createUmbraService(createDemoUmbraGateway());

    await expect(
      service.buildDisclosureView({
        payoutId: 'preview-disclosure',
        level: 'verification-ready',
        viewerRole: 'recipient',
      }),
    ).resolves.toEqual({
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      title: 'Recipient verification package',
      summary: 'Bounded recipient access is available for this payout preview.',
      revealedFields: ['amount'],
      verificationArtifacts: ['network-confirmation', 'claim-window'],
    });
  });

  it('rejects preview claim results for payout ids that do not belong to the wallet session', async () => {
    const service = createUmbraService(createDemoUmbraGateway());

    await expect(
      service.claimPrivatePayout({
        payoutId: 'preview-mainnet-preview-wallet-2',
        walletAddress: 'preview-wallet-1',
        network: 'mainnet',
      }),
    ).rejects.toThrow('Preview payout does not belong to the connected wallet session.');
  });

  it('rejects preview claim results when the payout id belongs to a different network', async () => {
    const service = createUmbraService(createDemoUmbraGateway());

    await expect(
      service.claimPrivatePayout({
        payoutId: 'preview-mainnet-preview-wallet-1',
        walletAddress: 'preview-wallet-1',
        network: 'devnet',
      }),
    ).rejects.toThrow('Preview payout does not belong to the connected wallet session.');
  });

  it('provides a not-implemented baseline for future wrapper wiring', async () => {
    const service = createNotImplementedUmbraService();

    await expect(service.getPayoutStatus('payout-1')).rejects.toThrow(
      'getPayoutStatus is not implemented',
    );
  });
});
