import { useLayoutEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WalletProvider, useWallet } from '@/providers/WalletProvider';
import type { WalletProviderState } from '@/providers/WalletProvider';

import type { ClaimablePayout } from '@/features/claim/schema';
import type { LoadActivityNarrative } from './ActivityPage';

const SESSION_PAYOUT_ID = 'session-payout-1';
const PREVIEW_PAYOUT_ID_PREFIX = 'preview-mainnet-preview-wallet-1';

let capturedLoadActivityNarrative: LoadActivityNarrative | null | undefined;
const loadActivityNarrativeProbe = vi.hoisted(() => vi.fn());
const scanClaimablePayoutsMock = vi.hoisted(() => vi.fn());
const demoBuildDisclosureViewMock = vi.hoisted(() => vi.fn());
const readOnlyBuildDisclosureViewMock = vi.hoisted(() => vi.fn());
const mockReadOnlyProviderState = vi.hoisted(() => ({
  canScanClaimablePayouts: false,
  canBuildLiveDisclosure: false,
}));
const mockBridgeState = vi.hoisted(
  (): {
    enabled: boolean;
    connectionVersion: number;
    walletAddress: string | null;
    walletState: WalletProviderState;
  } => ({
    enabled: false,
    connectionVersion: 0,
    walletAddress: null,
    walletState: {
      status: 'disconnected',
      network: 'devnet',
      walletLabel: null,
      message: null,
    },
  }),
);

vi.mock('@/providers/SolanaWalletBridgeProvider', () => ({
  useSolanaWalletBridge: () => {
    if (!mockBridgeState.enabled) {
      return null;
    }

    return {
      connect: vi.fn(),
      connection: null,
      connectionIdentity: mockBridgeState.walletAddress,
      connectionVersion: mockBridgeState.connectionVersion,
      disconnect: vi.fn(),
      signTransaction: null,
      signAllTransactions: null,
      signMessage: null,
      submitTransaction: null,
      walletAddress: mockBridgeState.walletAddress,
      walletState: mockBridgeState.walletState,
    };
  },
}));

vi.mock('@/features/protocol/demoUmbraService', () => ({
  demoUmbraService: {
    createPrivatePayout: vi.fn().mockImplementation(async (input) => ({
      payoutId: `preview-${input.recipient}`,
      transactionHash: 'preview-create-tx',
      status: 'submitted',
    })),
    scanClaimablePayouts: vi.fn().mockResolvedValue([
      {
        payoutId: 'preview-mainnet-preview-wallet-1',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'SOL',
        amount: 8,
        claimStatus: 'claimable',
      },
    ]),
    claimPrivatePayout: vi.fn().mockResolvedValue({
      payoutId: 'preview-mainnet-preview-wallet-1',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-tx',
    }),
    buildDisclosureView: demoBuildDisclosureViewMock,
  },
}));

vi.mock('@/features/protocol/umbraProviderResolver', async () => {
  const actual = await vi.importActual<typeof import('@/features/protocol/umbraProviderResolver')>(
    '@/features/protocol/umbraProviderResolver',
  );

  return {
    ...actual,
    resolveReadOnlyUmbraProvider: () => {
      const demoProvider = actual.resolveDemoUmbraProvider();

      return {
        ...demoProvider,
        capabilities: {
          ...demoProvider.capabilities,
          canScanClaimablePayouts: mockReadOnlyProviderState.canScanClaimablePayouts,
          canBuildLiveDisclosure: mockReadOnlyProviderState.canBuildLiveDisclosure,
        },
        service: {
          ...demoProvider.service,
          scanClaimablePayouts: scanClaimablePayoutsMock,
          buildDisclosureView: readOnlyBuildDisclosureViewMock,
        },
      };
    },
  };
});

vi.mock('./ActivityPage', async () => {
  const actual = await vi.importActual<typeof import('./ActivityPage')>('./ActivityPage');

  return {
    ...actual,
    ActivityPage: ({ loadActivityNarrative }: { loadActivityNarrative?: LoadActivityNarrative | null }) => {
      capturedLoadActivityNarrative = loadActivityNarrative;
      loadActivityNarrativeProbe(loadActivityNarrative);
      return <actual.ActivityPage loadActivityNarrative={loadActivityNarrative} />;
    },
  };
});

import { ActivityPageContainer } from './ActivityPageContainer';

function DemoFlowSessionSeeder() {
  const wallet = useWallet();

  useLayoutEffect(() => {
    if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
      return;
    }

    wallet.saveDemoFlowSession({
      payout: {
        payoutId: SESSION_PAYOUT_ID,
        transactionHash: 'session-create-tx',
        status: 'submitted',
      },
      draft: {
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      },
      network: wallet.network === 'mainnet' ? 'mainnet' : 'devnet',
      connectionVersion: wallet.connectionVersion,
    });
  }, [
    wallet.connectionVersion,
    wallet.demoFlowSession,
    wallet.isSupportedNetwork,
    wallet.network,
    wallet.saveDemoFlowSession,
    wallet.status,
  ]);

  return null;
}

describe('ActivityPageContainer', () => {
  beforeEach(() => {
    capturedLoadActivityNarrative = undefined;
    loadActivityNarrativeProbe.mockReset();
    scanClaimablePayoutsMock.mockReset();
    demoBuildDisclosureViewMock.mockReset();
    readOnlyBuildDisclosureViewMock.mockReset();
    mockReadOnlyProviderState.canScanClaimablePayouts = false;
    mockReadOnlyProviderState.canBuildLiveDisclosure = false;
    mockBridgeState.enabled = false;
    mockBridgeState.connectionVersion = 0;
    mockBridgeState.walletAddress = null;
    mockBridgeState.walletState = {
      status: 'disconnected',
      network: 'devnet',
      walletLabel: null,
      message: null,
    };
    demoBuildDisclosureViewMock.mockImplementation(async (input) => ({
      payoutId: input.payoutId,
      level: input.level,
      title: 'Demo disclosure title',
      summary: 'Demo disclosure summary',
      revealedFields: input.level === 'none' ? [] : ['amount'],
      verificationArtifacts: ['network-confirmation'],
    }));
  });

  it('injects an activity narrative loader into the page view', () => {
    render(
      <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    expect(capturedLoadActivityNarrative).toBeTypeOf('function');
  });

  it('uses the prepared preview narrative when no connected wallet session exists', async () => {
    render(
      <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();
    const matchingClaimablePayout = narrative.claimablePayouts.find(
      (claimablePayout: ClaimablePayout) =>
        claimablePayout.payoutId === narrative.payout.payoutId &&
        claimablePayout.claimStatus === 'claimable',
    );

    expect(narrative.payout.payoutId).toContain(PREVIEW_PAYOUT_ID_PREFIX);
    expect(narrative.payout.status).toBe('submitted');
    expect(narrative.claimResult?.claimStatus).toBe('claimed');
    expect(narrative.disclosureView.level).toBe('verification-ready');
    expect(narrative.claimResult?.payoutId).toBe(narrative.payout.payoutId);
    expect(narrative.disclosureView.payoutId).toBe(narrative.payout.payoutId);
    expect(narrative.truthSource).toBe('prepared-preview');
    expect(matchingClaimablePayout).toMatchObject({
      payoutId: narrative.payout.payoutId,
      claimStatus: 'claimable',
    });
  });

  it('uses the prepared preview narrative when the connected wallet network is unsupported', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'unsupported' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(narrative.payout.payoutId).toContain(PREVIEW_PAYOUT_ID_PREFIX);
    expect(narrative.disclosureView.level).toBe('verification-ready');
    expect(narrative.truthSource).toBe('prepared-preview');
  });

  it('shows unavailable when a connected supported wallet lacks truth-backed activity context', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    expect(capturedLoadActivityNarrative).toBeNull();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Activity narrative is currently unavailable.',
    );
  });

  it('returns a demo-derived unclaimed session narrative without fabricating a claim result', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(narrative.payout.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(narrative.claimResult).toBeNull();
    expect(narrative.truthSource).toBe('demo-derived');
    expect(narrative.claimablePayouts).toEqual([
      expect.objectContaining({
        payoutId: SESSION_PAYOUT_ID,
        claimStatus: 'claimable',
        amount: 12.5,
      }),
    ]);
    expect(narrative.disclosureView.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(narrative.disclosureView.level).toBe('partial');
    expect(demoBuildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: SESSION_PAYOUT_ID,
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(readOnlyBuildDisclosureViewMock).not.toHaveBeenCalled();
  });

  it('rejects a session narrative amount that cannot round-trip through the activity number model', async () => {
    function InvalidDemoFlowSessionSeeder() {
      const wallet = useWallet();

      useLayoutEffect(() => {
        if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
          return;
        }

        wallet.saveDemoFlowSession({
          payout: {
            payoutId: SESSION_PAYOUT_ID,
            transactionHash: 'session-create-tx',
            status: 'submitted',
          },
          draft: {
            recipient: 'alice.sol',
            tokenMint: 'So11111111111111111111111111111111111111112',
            amount: '1.0000000000000000001',
            memo: null,
            disclosureLevel: 'partial',
          },
          network: wallet.network === 'mainnet' ? 'mainnet' : 'devnet',
          connectionVersion: wallet.connectionVersion,
        });
      }, [
        wallet.connectionVersion,
        wallet.demoFlowSession,
        wallet.isSupportedNetwork,
        wallet.network,
        wallet.saveDemoFlowSession,
        wallet.status,
      ]);

      return null;
    }

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <InvalidDemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    expect(() => {
      if (!capturedLoadActivityNarrative) {
        throw new Error('Expected activity narrative loader to be injected.');
      }

      capturedLoadActivityNarrative();
    }).toThrow(
      'Demo flow payout amount cannot be represented safely in the activity narrative.',
    );
  });

  it('ignores a stale demo flow session when the wallet session no longer matches', async () => {
    function StaleDemoFlowSessionSeeder() {
      const wallet = useWallet();

      useLayoutEffect(() => {
        if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
          return;
        }

        wallet.saveDemoFlowSession({
          payout: {
            payoutId: SESSION_PAYOUT_ID,
            transactionHash: 'session-create-tx',
            status: 'submitted',
          },
          draft: {
            recipient: 'alice.sol',
            tokenMint: 'So11111111111111111111111111111111111111112',
            amount: '12.5',
            memo: null,
            disclosureLevel: 'partial',
          },
          network: 'devnet',
          connectionVersion: wallet.connectionVersion - 1,
        });
      }, [
        wallet.connectionVersion,
        wallet.demoFlowSession,
        wallet.isSupportedNetwork,
        wallet.saveDemoFlowSession,
        wallet.status,
      ]);

      return null;
    }

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <StaleDemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    expect(capturedLoadActivityNarrative).toBeNull();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Activity narrative is currently unavailable.',
    );
  });

  it('ignores demo continuity when the bridged wallet address changes without a version bump', async () => {
    mockBridgeState.enabled = true;
    mockBridgeState.connectionVersion = 1;
    mockBridgeState.walletAddress = 'wallet-1';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-1',
      message: null,
    };

    const { rerender } = render(
      <WalletProvider>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const sessionNarrative = await capturedLoadActivityNarrative();
    expect(sessionNarrative.payout.payoutId).toBe(SESSION_PAYOUT_ID);

    mockBridgeState.walletAddress = 'wallet-2';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-2',
      message: null,
    };

    rerender(
      <WalletProvider>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    expect(capturedLoadActivityNarrative).toBeNull();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Activity narrative is currently unavailable.',
    );
  });

  it('prefers provider scan truth for the active session claimable narrative when scan capability is available and matches the pending claim story', async () => {
    mockReadOnlyProviderState.canScanClaimablePayouts = true;
    scanClaimablePayoutsMock.mockResolvedValue([
      {
        payoutId: SESSION_PAYOUT_ID,
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'SOL',
        amount: 18,
        claimStatus: 'claimable',
      },
      {
        payoutId: 'provider-payout-2',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'TOKEN',
        amount: 4,
        claimStatus: 'claimable',
      },
    ] satisfies ClaimablePayout[]);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(scanClaimablePayoutsMock).toHaveBeenCalledWith({
      walletAddress: 'preview-wallet-0',
      network: 'devnet',
    });
    expect(narrative.payout.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(narrative.claimResult).toBeNull();
    expect(narrative.truthSource).toBe('live-derived');
    expect(narrative.claimablePayouts).toEqual([
      {
        payoutId: SESSION_PAYOUT_ID,
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'SOL',
        amount: 18,
        claimStatus: 'claimable',
      },
      {
        payoutId: 'provider-payout-2',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'TOKEN',
        amount: 4,
        claimStatus: 'claimable',
      },
    ]);
    expect(narrative.disclosureView.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(narrative.disclosureView.level).toBe('partial');
  });

  it('falls back to demo continuity when provider scan truth conflicts with the pending claim story', async () => {
    mockReadOnlyProviderState.canScanClaimablePayouts = true;
    scanClaimablePayoutsMock.mockResolvedValue([
      {
        payoutId: SESSION_PAYOUT_ID,
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'SOL',
        amount: 18,
        claimStatus: 'claimed',
      },
      {
        payoutId: 'provider-payout-2',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'TOKEN',
        amount: 4,
        claimStatus: 'claimable',
      },
    ] satisfies ClaimablePayout[]);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(scanClaimablePayoutsMock).toHaveBeenCalledWith({
      walletAddress: 'preview-wallet-0',
      network: 'devnet',
    });
    expect(narrative.payout.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(narrative.claimResult).toBeNull();
    expect(narrative.truthSource).toBe('demo-derived');
    expect(narrative.claimablePayouts).toEqual([
      expect.objectContaining({
        payoutId: SESSION_PAYOUT_ID,
        claimStatus: 'claimable',
        amount: 12.5,
      }),
    ]);
    expect(narrative.disclosureView.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(narrative.disclosureView.level).toBe('partial');
  });

  it('prefers provider disclosure truth for the active session when live disclosure capability is available', async () => {
    const disclosureView = {
      payoutId: SESSION_PAYOUT_ID,
      level: 'partial',
      title: 'Provider disclosure title',
      summary: 'Provider disclosure summary',
      revealedFields: ['amount', 'network'],
      verificationArtifacts: ['wallet-session', 'claimable-state'],
    } as const;

    mockReadOnlyProviderState.canBuildLiveDisclosure = true;
    readOnlyBuildDisclosureViewMock.mockResolvedValue(disclosureView);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(narrative.disclosureView).toEqual(disclosureView);
    expect(readOnlyBuildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: SESSION_PAYOUT_ID,
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(demoBuildDisclosureViewMock).not.toHaveBeenCalled();
  });

  it('falls back to demo disclosure continuity when live disclosure capability is unavailable', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(narrative.disclosureView.payoutId).toBe(SESSION_PAYOUT_ID);
    expect(demoBuildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: SESSION_PAYOUT_ID,
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(readOnlyBuildDisclosureViewMock).not.toHaveBeenCalled();
  });

  it('falls back to demo continuity when provider scan truth omits the active session payout', async () => {
    mockReadOnlyProviderState.canScanClaimablePayouts = true;
    scanClaimablePayoutsMock.mockResolvedValue([
      {
        payoutId: 'provider-payout-2',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'TOKEN',
        amount: 4,
        claimStatus: 'claimable',
      },
    ] satisfies ClaimablePayout[]);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(scanClaimablePayoutsMock).toHaveBeenCalledWith({
      walletAddress: 'preview-wallet-0',
      network: 'devnet',
    });
    expect(narrative.truthSource).toBe('demo-derived');
    expect(narrative.claimablePayouts).toEqual([
      expect.objectContaining({
        payoutId: SESSION_PAYOUT_ID,
        claimStatus: 'claimable',
        amount: 12.5,
      }),
    ]);
  });

  it('reuses the in-flight activity narrative load across repeated preview calls', async () => {
    render(
      <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const firstNarrativePromise = capturedLoadActivityNarrative();
    const secondNarrativePromise = capturedLoadActivityNarrative();

    expect(secondNarrativePromise).toBe(firstNarrativePromise);

    const [firstNarrative, secondNarrative] = await Promise.all([
      firstNarrativePromise,
      secondNarrativePromise,
    ]);

    expect(secondNarrative).toBe(firstNarrative);
  });

  it('starts a new preview activity narrative load after the in-flight request settles', async () => {
    render(
      <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const firstNarrativePromise = capturedLoadActivityNarrative();
    await firstNarrativePromise;

    const secondNarrativePromise = capturedLoadActivityNarrative();

    expect(secondNarrativePromise).not.toBe(firstNarrativePromise);
    await expect(secondNarrativePromise).resolves.toBeDefined();
  });
});
