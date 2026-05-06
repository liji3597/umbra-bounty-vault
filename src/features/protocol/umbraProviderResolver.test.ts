import { describe, expect, it, vi } from 'vitest';

import { demoUmbraService } from './demoUmbraService';
import { createDevnetUmbraService } from './devnetUmbraService';
import { getUmbraCapabilities } from './umbraCapabilities';
import {
  resolveCreatePayoutProvider,
  resolveDemoUmbraProvider,
  resolveLegacyUmbraProvider,
  resolveReadOnlyUmbraProvider,
  resolveSdkUmbraProvider,
} from './umbraProviderResolver';

describe('umbraCapabilities', () => {
  it('returns the expected capability matrix for each provider kind', () => {
    expect(getUmbraCapabilities('demo')).toEqual({
      canCreatePrivatePayout: true,
      canScanClaimablePayouts: true,
      canClaimPrivatePayout: true,
      canBuildLiveDisclosure: false,
    });
    expect(getUmbraCapabilities('legacy')).toEqual({
      canCreatePrivatePayout: true,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: false,
    });
    expect(getUmbraCapabilities('sdk-live')).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: false,
    });
    expect(getUmbraCapabilities('unavailable')).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: false,
    });
  });
});

describe('umbraProviderResolver', () => {
  it('resolves create payout to the sdk-live provider when an SDK module loader and wallet address are configured', () => {
    const provider = resolveCreatePayoutProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
    });

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('sdk-live'));
    expect(provider.createAvailability).toEqual({
      status: 'blocked',
      reason: 'sdk-create-not-wired',
    });
  });

  it('resolves create payout to an available sdk-live provider when a create gateway is configured', async () => {
    const createPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted' as const,
    });
    const provider = resolveCreatePayoutProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      createPrivatePayout,
    });

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
  });

  it('keeps the recipient registration resolver on the sdk-live provider', async () => {
    const resolveRecipientRegistration = vi.fn().mockResolvedValue({
      status: 'registered' as const,
    });
    const provider = resolveCreatePayoutProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      resolveRecipientRegistration,
    });

    await expect(provider.resolveRecipientRegistration?.('alice.sol')).resolves.toEqual({
      status: 'registered',
    });
    expect(resolveRecipientRegistration).toHaveBeenCalledWith('alice.sol');
  });

  it('resolves create payout to the unavailable provider when a wallet address is missing', () => {
    const provider = resolveCreatePayoutProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
    });

    expect(provider.kind).toBe('unavailable');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('unavailable'));
    expect(provider.createAvailability).toEqual({
      status: 'unavailable',
      reason: 'sdk-session-unavailable',
    });
  });

  it('resolves create payout to the unavailable provider when the SDK module loader is not configured', () => {
    const provider = resolveCreatePayoutProvider({
      network: 'devnet',
    });

    expect(provider.kind).toBe('unavailable');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('unavailable'));
    expect(provider.createAvailability).toEqual({
      status: 'unavailable',
      reason: 'sdk-session-unavailable',
    });
  });

  it('falls back to the demo provider when no create config is available', () => {
    const provider = resolveCreatePayoutProvider(null);

    expect(provider.kind).toBe('demo');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('demo'));
    expect(provider.service).toBe(demoUmbraService);
    expect(provider.createAvailability).toEqual({
      status: 'available',
    });
  });

  it('resolves the legacy provider explicitly when a devnet transaction config is available', () => {
    const config = {
      authority: {
        walletAddress: 'sender-address',
        submitTransaction: vi.fn(),
      },
      connection: {
        confirmTransaction: vi.fn(),
        getLatestBlockhashAndContext: vi.fn(),
      },
    };

    const provider = resolveLegacyUmbraProvider(config);
    const directService = createDevnetUmbraService(config);

    expect(provider.kind).toBe('legacy');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('legacy'));
    expect(provider.service.createPrivatePayout).not.toBe(demoUmbraService.createPrivatePayout);
    expect(provider.service.scanClaimablePayouts).not.toBe(demoUmbraService.scanClaimablePayouts);
    expect(provider.service.claimPrivatePayout).not.toBe(demoUmbraService.claimPrivatePayout);
    expect(provider.service.buildDisclosureView).not.toBe(demoUmbraService.buildDisclosureView);
    expect(provider.service.createPrivatePayout).not.toBe(directService.createPrivatePayout);
    expect(provider.createAvailability).toEqual({
      status: 'available',
    });
  });

  it('resolves an sdk-live provider when an SDK module loader and wallet address are configured', () => {
    const provider = resolveSdkUmbraProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
    });

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('sdk-live'));
    expect(provider.createAvailability).toEqual({
      status: 'blocked',
      reason: 'sdk-create-not-wired',
    });
  });

  it('resolves an sdk-live provider with create capability when a create gateway is configured', () => {
    const provider = resolveSdkUmbraProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      createPrivatePayout: vi.fn(),
    });

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
  });

  it('resolves an sdk-live provider with live disclosure capability when a disclosure gateway is configured', () => {
    const provider = resolveSdkUmbraProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      buildDisclosureView: vi.fn(),
    });

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual({
      canCreatePrivatePayout: false,
      canScanClaimablePayouts: false,
      canClaimPrivatePayout: false,
      canBuildLiveDisclosure: true,
    });
  });

  it('resolves an unavailable provider when the SDK module loader is not configured', () => {
    const provider = resolveSdkUmbraProvider({
      network: 'devnet',
    });

    expect(provider.kind).toBe('unavailable');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('unavailable'));
    expect(provider.createAvailability).toEqual({
      status: 'unavailable',
      reason: 'sdk-session-unavailable',
    });
  });

  it('resolves read-only flows to the sdk-live provider when SDK config includes a wallet address', () => {
    const provider = resolveReadOnlyUmbraProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
    });

    expect(provider.kind).toBe('sdk-live');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('sdk-live'));
    expect(provider.createAvailability).toEqual({
      status: 'blocked',
      reason: 'sdk-create-not-wired',
    });
  });

  it('resolves read-only flows to an sdk-live provider with scan capability when a scan gateway is configured', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'sdk-0-42',
        senderLabel: 'Sender 1111…1111',
        tokenSymbol: 'SOL',
        amount: 1.5,
        claimStatus: 'claimable' as const,
      },
    ]);
    const provider = resolveReadOnlyUmbraProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      scanClaimablePayouts,
    });

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

  it('resolves read-only flows to an sdk-live provider with claim capability when a claim gateway is configured', async () => {
    const claimPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'sdk-claim-1',
      claimStatus: 'pending' as const,
      transactionHash: 'sdk-claim-tx-1',
    });
    const provider = resolveReadOnlyUmbraProvider({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      claimPrivatePayout,
    });

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

  it('falls back read-only flows to the demo provider when SDK config is absent', () => {
    const provider = resolveReadOnlyUmbraProvider();

    expect(provider.kind).toBe('demo');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('demo'));
    expect(provider.service).toBe(demoUmbraService);
    expect(provider.createAvailability).toEqual({
      status: 'available',
    });
  });

  it('resolves read-only flows to the demo provider', () => {
    const provider = resolveDemoUmbraProvider();

    expect(provider.kind).toBe('demo');
    expect(provider.capabilities).toEqual(getUmbraCapabilities('demo'));
    expect(provider.service).toBe(demoUmbraService);
    expect(provider.createAvailability).toEqual({
      status: 'available',
    });
  });
});
