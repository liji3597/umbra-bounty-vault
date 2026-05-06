import { useLayoutEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WalletProvider, useWallet } from '@/providers/WalletProvider';
import type { WalletProviderState } from '@/providers/WalletProvider';
import {
  type BuildDisclosureView,
  type DisclosureTruthSource,
} from './DisclosurePage';
import type { BuildDisclosureViewInput } from './schema';

let capturedBuildDisclosureView: BuildDisclosureView | undefined;
let capturedDefaultInput: BuildDisclosureViewInput | null | undefined;
let capturedTruthSource: DisclosureTruthSource | undefined;
const buildDisclosureViewMock = vi.hoisted(() => vi.fn());
const readOnlyBuildDisclosureViewMock = vi.hoisted(() => vi.fn());
const mockReadOnlyProviderState = vi.hoisted(() => ({
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
    buildDisclosureView: buildDisclosureViewMock,
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
          canBuildLiveDisclosure: mockReadOnlyProviderState.canBuildLiveDisclosure,
        },
        service: {
          ...demoProvider.service,
          buildDisclosureView: readOnlyBuildDisclosureViewMock,
        },
      };
    },
  };
});

vi.mock('./DisclosurePage', async () => {
  const actual = await vi.importActual<typeof import('./DisclosurePage')>('./DisclosurePage');

  return {
    ...actual,
    DisclosurePage: ({
      buildDisclosureView,
      defaultInput,
      truthSource,
    }: {
      buildDisclosureView: BuildDisclosureView;
      defaultInput?: BuildDisclosureViewInput | null;
      truthSource?: DisclosureTruthSource;
    }) => {
      capturedBuildDisclosureView = buildDisclosureView;
      capturedDefaultInput = defaultInput;
      capturedTruthSource = truthSource;
      return (
        <actual.DisclosurePage
          buildDisclosureView={buildDisclosureView}
          defaultInput={defaultInput}
          truthSource={truthSource}
        />
      );
    },
  };
});

import { DisclosurePageContainer } from './DisclosurePageContainer';

function DemoFlowSessionSeeder() {
  const wallet = useWallet();

  useLayoutEffect(() => {
    if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
      return;
    }

    wallet.saveDemoFlowSession({
      payout: {
        payoutId: 'session-payout-1',
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

describe('DisclosurePageContainer', () => {
  beforeEach(() => {
    capturedBuildDisclosureView = undefined;
    capturedDefaultInput = undefined;
    capturedTruthSource = undefined;
    buildDisclosureViewMock.mockReset();
    readOnlyBuildDisclosureViewMock.mockReset();
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
  });

  it('uses the demo preview builder when no connected supported wallet session exists', async () => {
    const disclosureView = {
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      title: 'Mock disclosure title',
      summary: 'Mock disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['network-confirmation'],
    } as const;

    buildDisclosureViewMock.mockResolvedValue(disclosureView);

    render(
      <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(await screen.findByText('Mock disclosure title')).toBeInTheDocument();
    expect(capturedBuildDisclosureView).toBeTypeOf('function');
    expect(capturedDefaultInput).toBeUndefined();
    expect(capturedTruthSource).toBe('prepared-preview');
    expect(buildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      viewerRole: 'recipient',
    });
  });

  it('uses the demo preview builder when the connected wallet network is unsupported', async () => {
    const disclosureView = {
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      title: 'Mock disclosure title',
      summary: 'Mock disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['network-confirmation'],
    } as const;

    buildDisclosureViewMock.mockResolvedValue(disclosureView);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'unsupported' }}>
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(await screen.findByText('Mock disclosure title')).toBeInTheDocument();
    expect(capturedDefaultInput).toBeUndefined();
    expect(capturedTruthSource).toBe('prepared-preview');
    expect(buildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      viewerRole: 'recipient',
    });
  });

  it('shows unavailable when a connected supported wallet lacks truth-backed disclosure input', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(capturedBuildDisclosureView).toBeTypeOf('function');
    expect(capturedDefaultInput).toBeNull();
    expect(capturedTruthSource).toBeUndefined();
    expect(buildDisclosureViewMock).not.toHaveBeenCalled();
    expect(readOnlyBuildDisclosureViewMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Disclosure preview is currently unavailable.',
    );
  });

  it('passes the active demo session disclosure request to the page and keeps demo continuity', async () => {
    const disclosureView = {
      payoutId: 'session-payout-1',
      level: 'partial',
      title: 'Mock session disclosure title',
      summary: 'Mock session disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['network-confirmation'],
    } as const;

    buildDisclosureViewMock.mockResolvedValue(disclosureView);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(await screen.findByText('Mock session disclosure title')).toBeInTheDocument();
    expect(capturedDefaultInput).toEqual({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(capturedTruthSource).toBe('demo-derived');
    expect(buildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(readOnlyBuildDisclosureViewMock).not.toHaveBeenCalled();
  });

  it('prefers provider disclosure truth for the active demo session when live disclosure capability is available', async () => {
    const disclosureView = {
      payoutId: 'session-payout-1',
      level: 'partial',
      title: 'Provider disclosure title',
      summary: 'Provider disclosure summary',
      revealedFields: ['amount', 'network'],
      verificationArtifacts: ['merkle-proof'],
    } as const;

    mockReadOnlyProviderState.canBuildLiveDisclosure = true;
    readOnlyBuildDisclosureViewMock.mockResolvedValue(disclosureView);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(await screen.findByText('Provider disclosure title')).toBeInTheDocument();
    expect(capturedDefaultInput).toEqual({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(capturedTruthSource).toBe('live-derived');
    expect(readOnlyBuildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(buildDisclosureViewMock).not.toHaveBeenCalled();
  });

  it('falls back to demo continuity for the active session when live disclosure capability is unavailable', async () => {
    const disclosureView = {
      payoutId: 'session-payout-1',
      level: 'partial',
      title: 'Fallback disclosure title',
      summary: 'Fallback disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['network-confirmation'],
    } as const;

    buildDisclosureViewMock.mockResolvedValue(disclosureView);

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(await screen.findByText('Fallback disclosure title')).toBeInTheDocument();
    expect(capturedTruthSource).toBe('demo-derived');
    expect(buildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });
    expect(readOnlyBuildDisclosureViewMock).not.toHaveBeenCalled();
  });

  it('ignores demo continuity when the bridged wallet address changes without a version bump', async () => {
    const disclosureView = {
      payoutId: 'session-payout-1',
      level: 'partial',
      title: 'Mock session disclosure title',
      summary: 'Mock session disclosure summary',
      revealedFields: ['amount'],
      verificationArtifacts: ['network-confirmation'],
    } as const;

    buildDisclosureViewMock.mockResolvedValue(disclosureView);
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
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(await screen.findByText('Mock session disclosure title')).toBeInTheDocument();
    expect(capturedDefaultInput).toEqual({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });

    buildDisclosureViewMock.mockClear();
    readOnlyBuildDisclosureViewMock.mockClear();
    mockBridgeState.walletAddress = 'wallet-2';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-2',
      message: null,
    };

    rerender(
      <WalletProvider>
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(capturedDefaultInput).toBeNull();
    expect(capturedTruthSource).toBeUndefined();
    expect(buildDisclosureViewMock).not.toHaveBeenCalled();
    expect(readOnlyBuildDisclosureViewMock).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Disclosure preview is currently unavailable.',
    );
  });
});
