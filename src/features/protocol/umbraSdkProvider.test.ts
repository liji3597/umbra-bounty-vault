import { describe, expect, it, vi } from 'vitest';

import { getUmbraCapabilities } from './umbraCapabilities';
import { createUmbraSdkClient } from './umbraSdkClient';
import { createUmbraSdkProvider, createUnavailableUmbraSdkProvider } from './umbraSdkProvider';

describe('umbraSdkProvider', () => {
  it('returns an sdk-live provider when the SDK client is configured', () => {
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
      }),
    );

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('sdk-live'));
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: false,
    });
    expect(provider.createAvailability).toEqual({
      status: 'blocked',
      reason: 'sdk-create-not-wired',
    });
  });

  it('enables create capability when the SDK client includes a create gateway', async () => {
    const createPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted' as const,
    });
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
        createPrivatePayout,
      }),
    );

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: true,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: false,
    });
    expect(provider.createAvailability).toEqual({
      status: 'available',
    });
    await expect(
      provider.service.createPrivatePayout({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '1',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted',
    });
    expect(createPrivatePayout).toHaveBeenCalledWith({
      recipient: '11111111111111111111111111111111',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '1',
      memo: null,
      disclosureLevel: 'none',
    });
  });

  it('enables scan capability when the SDK client includes a scan gateway', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'sdk-0-42',
        senderLabel: 'Sender 1111…1111',
        tokenSymbol: 'SOL',
        amount: 1.5,
        claimStatus: 'claimable' as const,
      },
    ]);
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
        scanClaimablePayouts,
      }),
    );

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: true,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: true,
    });
    await expect(
      provider.service.scanClaimablePayouts({
        walletAddress: '11111111111111111111111111111111',
        network: 'devnet',
      }),
    ).resolves.toEqual([
      {
        payoutId: 'sdk-0-42',
        senderLabel: 'Sender 1111…1111',
        tokenSymbol: 'SOL',
        amount: 1.5,
        claimStatus: 'claimable',
      },
    ]);
  });

  it('keeps scan capability disabled when sdk live scan signer prerequisites are missing', () => {
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
        indexerApiEndpoint: 'https://indexer.example.com',
      }),
    );

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: false,
    });
  });

  it('enables claim capability when the SDK client includes a claim gateway', async () => {
    const claimPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'sdk-claim-1',
      claimStatus: 'pending' as const,
      transactionHash: 'sdk-claim-tx-1',
    });
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
        claimPrivatePayout,
      }),
    );

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: true,
      canBuildLiveDisclosure: false,
    });
    await expect(
      provider.service.claimPrivatePayout({
        payoutId: 'sdk-claim-1',
        walletAddress: '11111111111111111111111111111111',
        network: 'devnet',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-claim-1',
      claimStatus: 'pending',
      transactionHash: 'sdk-claim-tx-1',
    });
  });

  it('enables live disclosure capability when the SDK client includes a disclosure gateway', async () => {
    const buildDisclosureView = vi.fn().mockResolvedValue({
      payoutId: 'sdk-payout-1',
      level: 'partial',
      title: 'Wallet-scoped recipient summary',
      summary: 'Bounded disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['wallet-session'],
    });
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
        buildDisclosureView,
      }),
    );

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: true,
    });
    await expect(
      provider.service.buildDisclosureView({
        payoutId: 'sdk-payout-1',
        level: 'partial',
        viewerRole: 'recipient',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-payout-1',
      level: 'partial',
      title: 'Wallet-scoped recipient summary',
      summary: 'Bounded disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['wallet-session'],
    });
  });

  it('exposes the SDK registration resolver through the provider', async () => {
    const resolveRecipientRegistration = vi.fn().mockResolvedValue({
      status: 'registered' as const,
    });
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
        resolveRecipientRegistration,
      }),
    );

    await expect(provider.resolveRecipientRegistration?.('alice.sol')).resolves.toEqual({
      status: 'registered',
    });
    expect(resolveRecipientRegistration).toHaveBeenCalledWith('alice.sol');
  });

  it('returns an unavailable provider when the SDK client is missing a wallet address', () => {
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
      }),
    );

    expect(provider.kind).toBe('unavailable');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('unavailable'));
    expect(provider.createAvailability).toEqual({
      status: 'unavailable',
      reason: 'sdk-session-unavailable',
    });
  });

  it('returns an unavailable provider when the SDK client is not configured', () => {
    const provider = createUnavailableUmbraSdkProvider('devnet');

    expect(provider.kind).toBe('unavailable');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('unavailable'));
    expect(provider.createAvailability).toEqual({
      status: 'unavailable',
      reason: 'sdk-session-unavailable',
    });
  });

  it('keeps SDK-backed service methods unimplemented until the adapter is wired', async () => {
    const provider = createUmbraSdkProvider(
      createUmbraSdkClient({
        network: 'devnet',
        loadSdkModule: vi.fn().mockResolvedValue({}),
        walletAddress: '11111111111111111111111111111111',
      }),
    );

    await expect(
      provider.service.createPrivatePayout({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '1',
        disclosureLevel: 'none',
      }),
    ).rejects.toThrow('createPrivatePayout is not implemented');
  });
});
