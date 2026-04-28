import { StrictMode, useLayoutEffect } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { WalletProvider, useWallet } from '@/providers/WalletProvider';
import { demoUmbraService } from '@/features/protocol/demoUmbraService';

import type { ClaimPrivatePayout, ScanClaimablePayouts } from './ClaimCenterPage';

const DEMO_FLOW_PAYOUT_ID = 'session-payout-1';

let capturedScanClaimablePayouts: ScanClaimablePayouts | undefined;
let capturedClaimPrivatePayout: ClaimPrivatePayout | undefined;
let onClaimCenterPageLayoutEffect:
  | ((handlers: {
      scanClaimablePayouts?: ScanClaimablePayouts;
      claimPrivatePayout?: ClaimPrivatePayout;
    }) => void)
  | undefined;

vi.mock('./ClaimCenterPage', () => ({
  ClaimCenterPage: ({
    scanClaimablePayouts,
    claimPrivatePayout,
  }: {
    scanClaimablePayouts?: ScanClaimablePayouts;
    claimPrivatePayout?: ClaimPrivatePayout;
  }) => {
    useLayoutEffect(() => {
      capturedScanClaimablePayouts = scanClaimablePayouts;
      capturedClaimPrivatePayout = claimPrivatePayout;

      onClaimCenterPageLayoutEffect?.({
        scanClaimablePayouts,
        claimPrivatePayout,
      });
    }, [scanClaimablePayouts, claimPrivatePayout]);

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

describe('ClaimCenterPageContainer', () => {
  beforeEach(() => {
    capturedScanClaimablePayouts = undefined;
    capturedClaimPrivatePayout = undefined;
    onClaimCenterPageLayoutEffect = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected claim center handlers to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: 'preview-mainnet-preview-wallet-0',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 125,
        claimStatus: 'claimable',
      },
    ]);

    await expect(capturedClaimPrivatePayout('preview-mainnet-preview-wallet-0')).resolves.toEqual({
      payoutId: 'preview-mainnet-preview-wallet-0',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-preview-wallet-0-preview-mainnet-preview-wallet-0',
    });

    await expect(capturedClaimPrivatePayout('preview-devnet-preview-wallet-0')).rejects.toThrow(
      'Preview payout does not belong to the connected wallet session.',
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

    if (!capturedScanClaimablePayouts || !capturedClaimPrivatePayout) {
      throw new Error('Expected devnet claim center handlers to be injected.');
    }

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: 'preview-devnet-preview-wallet-0',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);

    await expect(capturedClaimPrivatePayout('preview-devnet-preview-wallet-0')).resolves.toEqual({
      payoutId: 'preview-devnet-preview-wallet-0',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-preview-wallet-0-preview-devnet-preview-wallet-0',
    });

    await expect(capturedClaimPrivatePayout('preview-mainnet-preview-wallet-0')).rejects.toThrow(
      'Preview payout does not belong to the connected wallet session.',
    );
  });

  it('prefers the active demo flow session over preview service handlers', async () => {
    const scanSpy = vi.spyOn(demoUmbraService, 'scanClaimablePayouts');
    const claimSpy = vi.spyOn(demoUmbraService, 'claimPrivatePayout');

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
    expect(scanSpy).not.toHaveBeenCalled();

    await expect(capturedClaimPrivatePayout(DEMO_FLOW_PAYOUT_ID)).resolves.toEqual({
      payoutId: DEMO_FLOW_PAYOUT_ID,
      claimStatus: 'claimed',
      transactionHash: `session-claim-${DEMO_FLOW_PAYOUT_ID}`,
    });
    expect(claimSpy).not.toHaveBeenCalled();
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

    expect(capturedScanClaimablePayouts).toBeDefined();

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

    await expect(capturedScanClaimablePayouts()).resolves.toEqual([
      {
        payoutId: 'preview-mainnet-preview-wallet-2',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 125,
        claimStatus: 'claimable',
      },
    ]);

    await expect(capturedClaimPrivatePayout('preview-mainnet-preview-wallet-2')).resolves.toEqual({
      payoutId: 'preview-mainnet-preview-wallet-2',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-preview-wallet-2-preview-mainnet-preview-wallet-2',
    });
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
        reboundClaimDuringLayoutEffect = claimPrivatePayout('preview-mainnet-preview-wallet-2');
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

    await expect(reboundScanDuringLayoutEffect).resolves.toEqual([
      {
        payoutId: 'preview-mainnet-preview-wallet-2',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 125,
        claimStatus: 'claimable',
      },
    ]);
    await expect(reboundClaimDuringLayoutEffect).resolves.toEqual({
      payoutId: 'preview-mainnet-preview-wallet-2',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-preview-wallet-2-preview-mainnet-preview-wallet-2',
    });
  });

  it('rejects an in-flight scan when the wallet session changes before the service call settles', async () => {
    let resolveScan:
      | ((value: Awaited<ReturnType<typeof demoUmbraService.scanClaimablePayouts>>) => void)
      | undefined;
    const scanPromise = new Promise<Awaited<ReturnType<typeof demoUmbraService.scanClaimablePayouts>>>(
      (resolve) => {
        resolveScan = resolve;
      },
    );
    const scanSpy = vi
      .spyOn(demoUmbraService, 'scanClaimablePayouts')
      .mockReturnValueOnce(scanPromise);

    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'mainnet' }}>
          <WalletSessionControls />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    const previousScanClaimablePayouts = capturedScanClaimablePayouts;

    if (!previousScanClaimablePayouts || !resolveScan) {
      throw new Error('Expected initial scan handler and deferred service call to be ready.');
    }

    const inFlightScan = previousScanClaimablePayouts();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    resolveScan([
      {
        payoutId: 'preview-mainnet-preview-wallet-0',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 125,
        claimStatus: 'claimable',
      },
    ]);

    await expect(inFlightScan).rejects.toThrow('Claim wallet session is no longer active.');
    expect(scanSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects an in-flight claim when the wallet session changes before the service call settles', async () => {
    let resolveClaim:
      | ((value: Awaited<ReturnType<typeof demoUmbraService.claimPrivatePayout>>) => void)
      | undefined;
    const claimPromise = new Promise<Awaited<ReturnType<typeof demoUmbraService.claimPrivatePayout>>>(
      (resolve) => {
        resolveClaim = resolve;
      },
    );
    const claimSpy = vi.spyOn(demoUmbraService, 'claimPrivatePayout').mockReturnValueOnce(claimPromise);

    render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'mainnet' }}>
          <WalletSessionControls />
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    const previousClaimPrivatePayout = capturedClaimPrivatePayout;

    if (!previousClaimPrivatePayout || !resolveClaim) {
      throw new Error('Expected initial claim handler and deferred service call to be ready.');
    }

    const inFlightClaim = previousClaimPrivatePayout('preview-mainnet-preview-wallet-0');

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));
    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    resolveClaim({
      payoutId: 'preview-mainnet-preview-wallet-0',
      claimStatus: 'claimed',
      transactionHash: 'preview-claim-preview-wallet-0-preview-mainnet-preview-wallet-0',
    });

    await expect(inFlightClaim).rejects.toThrow('Claim wallet session is no longer active.');
    expect(claimSpy).toHaveBeenCalledTimes(1);
  });

  it('invalidates previously injected handlers after the container unmounts', async () => {
    const { unmount } = render(
      <StrictMode>
        <WalletProvider initialState={{ status: 'connected', network: 'mainnet' }}>
          <ClaimCenterPageContainer />
        </WalletProvider>
      </StrictMode>,
    );

    const previousScanClaimablePayouts = capturedScanClaimablePayouts;
    const previousClaimPrivatePayout = capturedClaimPrivatePayout;

    if (!previousScanClaimablePayouts || !previousClaimPrivatePayout) {
      throw new Error('Expected claim center handlers to be injected before unmount.');
    }

    unmount();

    await expect(previousScanClaimablePayouts()).rejects.toThrow(
      'Claim wallet session is no longer active.',
    );
    await expect(previousClaimPrivatePayout('preview-mainnet-preview-wallet-0')).rejects.toThrow(
      'Claim wallet session is no longer active.',
    );
  });
});
