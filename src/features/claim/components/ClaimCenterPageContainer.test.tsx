import { StrictMode, useLayoutEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSearchParamGet = vi.fn<(name: string) => string | null>(() => null);

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockSearchParamGet,
  }),
}));

import { UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE, UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE } from '@/features/protocol/umbraSdkClient';
import { WalletProvider, useWallet } from '@/providers/WalletProvider';

import type { ClaimPrivatePayout, ScanClaimablePayouts } from './ClaimCenterPage';

const DEMO_FLOW_PAYOUT_ID = 'session-payout-1';

let capturedScanClaimablePayouts: ScanClaimablePayouts | undefined;
let capturedClaimPrivatePayout: ClaimPrivatePayout | undefined;
let capturedHasLifecycleReviewContext: boolean | undefined;
let onClaimCenterPageLayoutEffect:
  | ((handlers: {
      scanClaimablePayouts?: ScanClaimablePayouts;
      claimPrivatePayout?: ClaimPrivatePayout;
      hasLifecycleReviewContext?: boolean;
    }) => void)
  | undefined;

vi.mock('./ClaimCenterPage', () => ({
  ClaimCenterPage: ({
    scanClaimablePayouts,
    claimPrivatePayout,
    hasLifecycleReviewContext,
  }: {
    scanClaimablePayouts?: ScanClaimablePayouts;
    claimPrivatePayout?: ClaimPrivatePayout;
    hasLifecycleReviewContext?: boolean;
  }) => {
    useLayoutEffect(() => {
      capturedScanClaimablePayouts = scanClaimablePayouts;
      capturedClaimPrivatePayout = claimPrivatePayout;
      capturedHasLifecycleReviewContext = hasLifecycleReviewContext;

      onClaimCenterPageLayoutEffect?.({
        scanClaimablePayouts,
        claimPrivatePayout,
        hasLifecycleReviewContext,
      });
    }, [scanClaimablePayouts, claimPrivatePayout, hasLifecycleReviewContext]);

    return <div>Mock claim center page</div>;
  },
}));

import { ClaimCenterPageContainer } from './ClaimCenterPageContainer';

function WalletSessionControls() {
  const wallet = useWallet();

  return (
    <>
      <button type="button" onClick={wallet.disconnect}>
        Disconnect wallet
      </button>
      <button type="button" onClick={wallet.connect}>
        Connect wallet
      </button>
    </>
  );
}

function DemoFlowSessionSeeder() {
  const wallet = useWallet();

  useLayoutEffect(() => {
    if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
      return;
    }

    wallet.saveDemoFlowSession({
      payout: {
        payoutId: DEMO_FLOW_PAYOUT_ID,
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

function DemoFlowClaimResultSeeder({ claimStatus }: { claimStatus: 'pending' | 'claimed' }) {
  const wallet = useWallet();

  useLayoutEffect(() => {
    if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
      return;
    }

    wallet.saveDemoFlowSession({
      payout: {
        payoutId: DEMO_FLOW_PAYOUT_ID,
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

    wallet.updateDemoFlowClaimResult({
      payoutId: DEMO_FLOW_PAYOUT_ID,
      claimStatus,
      transactionHash: `session-claim-${claimStatus}`,
    });
  }, [
    claimStatus,
    wallet.connectionVersion,
    wallet.demoFlowSession,
    wallet.isSupportedNetwork,
    wallet.network,
    wallet.saveDemoFlowSession,
    wallet.status,
    wallet.updateDemoFlowClaimResult,
  ]);

  return null;
}

describe('ClaimCenterPageContainer', () => {
  beforeEach(() => {
    capturedScanClaimablePayouts = undefined;
    capturedClaimPrivatePayout = undefined;
    capturedHasLifecycleReviewContext = undefined;
    onClaimCenterPageLayoutEffect = undefined;
    mockSearchParamGet.mockReset();
    mockSearchParamGet.mockReturnValue(null);
  });

  it('returns a prepared claimable payout for the dev-only claim-unavailable E2E seam while keeping claim unavailable', async () => {
    mockSearchParamGet.mockImplementation((name: string) =>
      name === 'mockClaimablePayout' ? 'claim-unavailable' : null,
    );

    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'devnet', walletLabel: 'Mock wallet preview' }}>
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected prepared claim handlers to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: 'prepared-claim-unavailable-payout',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);
    await expect(capturedClaimPrivatePayout('prepared-claim-unavailable-payout')).rejects.toThrow(
      UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE,
    );
  });

  it('injects service-backed scan and claim handlers that use the active wallet network', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'mainnet' }}>
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    expect(screen.getByText('Mock claim center page')).toBeInTheDocument();
    expect(capturedScanClaimablePayouts).toBeDefined();
    expect(capturedClaimPrivatePayout).toBeDefined();
    expect(capturedHasLifecycleReviewContext).toBe(false);

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected claim center handlers to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).rejects.toThrow(UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE);
    await expect(capturedClaimPrivatePayout('preview-mainnet-preview-wallet-0')).rejects.toThrow(
      UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE,
    );
  });

  it('injects service-backed handlers that stay scoped to a devnet wallet session', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    expect(capturedScanClaimablePayouts).toBeDefined();
    expect(capturedClaimPrivatePayout).toBeDefined();
    expect(capturedHasLifecycleReviewContext).toBe(false);

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected devnet claim center handlers to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).rejects.toThrow(UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE);
    await expect(capturedClaimPrivatePayout('preview-devnet-preview-wallet-0')).rejects.toThrow(
      UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE,
    );
  });

  it('prefers the active demo flow session over provider-backed handlers', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
          <DemoFlowSessionSeeder />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    expect(capturedScanClaimablePayouts).toBeDefined();
    expect(capturedClaimPrivatePayout).toBeDefined();
    expect(capturedHasLifecycleReviewContext).toBe(true);

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected demo flow claim handlers to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: DEMO_FLOW_PAYOUT_ID,
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 12.5,
        claimStatus: 'claimable',
      },
    ]);

    await expect(capturedClaimPrivatePayout(DEMO_FLOW_PAYOUT_ID)).resolves.toEqual({
      payoutId: DEMO_FLOW_PAYOUT_ID,
      claimStatus: 'claimed',
      transactionHash: `session-claim-${DEMO_FLOW_PAYOUT_ID}`,
    });
  });

  it('preserves pending claim status when rescanning the active demo flow session', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
          <DemoFlowClaimResultSeeder claimStatus="pending" />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    if (!capturedScanClaimablePayouts) {
      throw new Error('Expected pending demo flow scan handler to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: DEMO_FLOW_PAYOUT_ID,
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 12.5,
        claimStatus: 'pending',
      },
    ]);
  });

  it('preserves claimed status when rescanning the active demo flow session', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
          <DemoFlowClaimResultSeeder claimStatus="claimed" />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    if (!capturedScanClaimablePayouts) {
      throw new Error('Expected claimed demo flow scan handler to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: DEMO_FLOW_PAYOUT_ID,
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 12.5,
        claimStatus: 'claimed',
      },
    ]);
  });

  it('rejects a demo flow payout amount that cannot round-trip through the claim preview number model', async () => {
    function InvalidDemoFlowSessionSeeder() {
      const wallet = useWallet();

      useLayoutEffect(() => {
        if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || wallet.demoFlowSession) {
          return;
        }

        wallet.saveDemoFlowSession({
          payout: {
            payoutId: DEMO_FLOW_PAYOUT_ID,
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
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
          <InvalidDemoFlowSessionSeeder />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    if (!capturedScanClaimablePayouts) {
      throw new Error('Expected demo flow scan handler to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).rejects.toThrow(
      'Demo flow payout amount cannot be represented safely in the claim preview.',
    );
  });

  it('does not inject claim handlers when the wallet network is unsupported', () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'unsupported' }}>
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    expect(screen.getByText('Mock claim center page')).toBeInTheDocument();
    expect(capturedScanClaimablePayouts).toBeUndefined();
    expect(capturedClaimPrivatePayout).toBeUndefined();
  });

  it('does not inject claim handlers when the wallet is disconnected', () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    expect(screen.getByText('Mock claim center page')).toBeInTheDocument();
    expect(capturedScanClaimablePayouts).toBeUndefined();
    expect(capturedClaimPrivatePayout).toBeUndefined();
  });

  it('invalidates injected handlers as soon as the wallet disconnects and rebinds them after reconnecting', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'mainnet' }}>
          <WalletSessionControls />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    const previousScanClaimablePayouts = capturedScanClaimablePayouts;
    const previousClaimPrivatePayout = capturedClaimPrivatePayout;

    if (!previousScanClaimablePayouts || !previousClaimPrivatePayout) {
      throw new Error('Expected initial claim center handlers to be injected.');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));

    expect(capturedScanClaimablePayouts).toBeUndefined();
    expect(capturedClaimPrivatePayout).toBeUndefined();
    await expect(previousScanClaimablePayouts()).rejects.toThrow(
      'Claim wallet session is no longer active.',
    );
    await expect(previousClaimPrivatePayout('preview-mainnet-preview-wallet-0')).rejects.toThrow(
      'Claim wallet session is no longer active.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    expect(capturedScanClaimablePayouts).toBeDefined();
    expect(capturedClaimPrivatePayout).toBeDefined();

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected claim center handlers to be rebound.');
    }

    await expect(capturedScanClaimablePayouts()).rejects.toThrow(UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE);
    await expect(capturedClaimPrivatePayout('preview-mainnet-preview-wallet-2')).rejects.toThrow(
      UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE,
    );
  });

  it('keeps rebound handlers usable during the child layout effect that receives them', async () => {
    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'mainnet' }}>
          <WalletSessionControls />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    const previousScanClaimablePayouts = capturedScanClaimablePayouts;
    const previousClaimPrivatePayout = capturedClaimPrivatePayout;
    let reboundScanDuringLayoutEffect:
      | ReturnType<NonNullable<ScanClaimablePayouts>>
      | undefined;
    let reboundClaimDuringLayoutEffect:
      | ReturnType<NonNullable<ClaimPrivatePayout>>
      | undefined;

    if (!previousScanClaimablePayouts || !previousClaimPrivatePayout) {
      throw new Error('Expected initial claim center handlers to be injected.');
    }

    onClaimCenterPageLayoutEffect = ({ scanClaimablePayouts, claimPrivatePayout }) => {
      if (scanClaimablePayouts) {
        reboundScanDuringLayoutEffect = scanClaimablePayouts();
      }

      if (claimPrivatePayout) {
        reboundClaimDuringLayoutEffect = claimPrivatePayout('preview-mainnet-preview-wallet-2').catch(
          (error) => {
            throw error;
          },
        );
      }
    };

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));
    onClaimCenterPageLayoutEffect = undefined;

    if (!reboundScanDuringLayoutEffect || !reboundClaimDuringLayoutEffect) {
      throw new Error('Expected rebound handlers to be callable during child layout effect.');
    }

    await expect(previousScanClaimablePayouts()).rejects.toThrow(
      'Claim wallet session is no longer active.',
    );
    await expect(previousClaimPrivatePayout('preview-mainnet-preview-wallet-0')).rejects.toThrow(
      'Claim wallet session is no longer active.',
    );

    await expect(reboundScanDuringLayoutEffect).rejects.toThrow(UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE);
    await expect(reboundClaimDuringLayoutEffect).rejects.toThrow(UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE);
  });
});
