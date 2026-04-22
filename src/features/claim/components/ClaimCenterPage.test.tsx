import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  type ClaimPrivatePayoutResult,
  type ClaimablePayout,
} from '@/features/claim/schema';
import { type WalletProviderState, WalletProvider, useWallet } from '@/providers/WalletProvider';

import {
  ClaimCenterPage,
  type ClaimPrivatePayout,
  type ScanClaimablePayouts,
} from './ClaimCenterPage';

function WalletTestControls() {
  const wallet = useWallet();

  return (
    <button type="button" onClick={wallet.disconnect}>
      Disconnect wallet
    </button>
  );
}

function renderClaimCenterPage({
  scanClaimablePayouts,
  claimPrivatePayout,
  initialState,
}: {
  scanClaimablePayouts?: ScanClaimablePayouts;
  claimPrivatePayout?: ClaimPrivatePayout;
  initialState?: Partial<WalletProviderState>;
} = {}) {
  return render(
    <WalletProvider initialState={{ status: 'connected', network: 'devnet', ...initialState }}>
      <WalletTestControls />
      <ClaimCenterPage
        scanClaimablePayouts={scanClaimablePayouts}
        claimPrivatePayout={claimPrivatePayout}
      />
    </WalletProvider>,
  );
}

function createDeferredScan() {
  let resolvePromise: ((value: ClaimablePayout[]) => void) | null = null;

  const promise = new Promise<ClaimablePayout[]>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve(value: ClaimablePayout[]) {
      resolvePromise?.(value);
    },
  };
}

function createDeferredClaim() {
  let resolvePromise: ((value: ClaimPrivatePayoutResult) => void) | null = null;

  const promise = new Promise<ClaimPrivatePayoutResult>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve(value: ClaimPrivatePayoutResult) {
      resolvePromise?.(value);
    },
  };
}

describe('ClaimCenterPage', () => {
  it('shows an initializing message while wallet state is loading', () => {
    renderClaimCenterPage({ initialState: { status: 'initializing' } });

    expect(screen.getByText('Checking wallet connection before scanning claimable payouts.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan claimable payouts' })).not.toBeInTheDocument();
  });

  it('shows privacy guidance without exposing provider-specific wallet details', () => {
    renderClaimCenterPage({
      initialState: {
        status: 'connected',
        walletLabel: 'Phantom / provider-debug-details',
      },
    });

    expect(screen.getByText('Embedded wallet preview')).toBeInTheDocument();
    expect(screen.queryByText('Phantom / provider-debug-details')).not.toBeInTheDocument();
    expect(
      screen.getByText('Scanning stays scoped to the connected preview wallet and never asks for extra recipient details.'),
    ).toBeInTheDocument();
  });

  it('offers a connect wallet action when disconnected', () => {
    renderClaimCenterPage({ initialState: { status: 'disconnected' } });

    expect(screen.queryByRole('button', { name: 'Scan claimable payouts' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    expect(screen.getByRole('button', { name: 'Scan claimable payouts' })).toBeInTheDocument();
    expect(screen.getByText('Embedded wallet preview')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect wallet' })).not.toBeInTheDocument();
  });

  it('shows a setup message on unsupported networks', () => {
    renderClaimCenterPage({ initialState: { status: 'connected', network: 'unsupported' } });

    expect(screen.getByText('Switch to Solana Devnet or Mainnet to scan claimable payouts.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Scan claimable payouts' })).not.toBeInTheDocument();
  });

  it('shows setup guidance instead of a connect action when disconnected on an unsupported network', () => {
    renderClaimCenterPage({ initialState: { status: 'disconnected', network: 'unsupported' } });

    expect(screen.getByText('Switch to Solana Devnet or Mainnet to scan claimable payouts.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect wallet' })).not.toBeInTheDocument();
  });

  it('keeps unsupported-network guidance ahead of wallet errors', () => {
    renderClaimCenterPage({ initialState: { status: 'error', network: 'unsupported' } });

    expect(screen.getByText('Switch to Solana Devnet or Mainnet to scan claimable payouts.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Connect wallet' })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows scanning progress and claim cards after a successful scan', async () => {
    const deferred = createDeferredScan();
    const scanClaimablePayouts = vi.fn(() => deferred.promise);

    renderClaimCenterPage({ scanClaimablePayouts });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

    expect(screen.getByRole('button', { name: 'Scanning claimable payouts' })).toBeDisabled();
    expect(screen.getByText('Scanning connected wallet preview for claimable payouts.')).toBeInTheDocument();
    expect(
      screen.getByText('Keep this wallet connected while the preview checks for private payouts.'),
    ).toBeInTheDocument();

    deferred.resolve([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);

    const claimResults = await screen.findByRole('region', { name: 'Claimable payouts found' });
    const resultsHeading = screen.getByRole('heading', { name: 'Claimable payouts found', level: 2 });

    expect(claimResults).toBeInTheDocument();
    expect(claimResults).toHaveAttribute('aria-labelledby', resultsHeading.getAttribute('id'));
    expect(claimResults).not.toHaveAttribute('aria-label');
    expect(resultsHeading).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(
      screen.getByRole('listitem', { name: 'Payout from Umbra Labs for 5 SOL' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Umbra Labs')).toBeInTheDocument();
    expect(screen.getByText('5 SOL')).toBeInTheDocument();
    expect(screen.getByText('claimable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim' })).toBeEnabled();
  });

  it('blocks duplicate scans while a scan is already in flight', async () => {
    const deferred = createDeferredScan();
    const scanClaimablePayouts = vi.fn(() => deferred.promise);

    renderClaimCenterPage({ scanClaimablePayouts });

    const scanButton = screen.getByRole('button', { name: 'Scan claimable payouts' });

    fireEvent.click(scanButton);
    fireEvent.click(scanButton);

    expect(scanClaimablePayouts).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Scanning claimable payouts' })).toBeDisabled();

    deferred.resolve([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);

    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();
  });

  it('shows claim progress and marks the payout claimed after a successful claim', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);
    const deferred = createDeferredClaim();
    const claimPrivatePayout = vi.fn(() => deferred.promise);

    renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

    expect(claimPrivatePayout).toHaveBeenCalledWith('payout-1');
    expect(screen.getByRole('button', { name: 'Claiming payout' })).toBeDisabled();
    expect(screen.getByText('Submitting preview claim.')).toBeInTheDocument();

    deferred.resolve({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });

    expect(await screen.findByRole('button', { name: 'Claimed' })).toBeDisabled();
    expect(screen.getByText('Preview claim completed. Reference: claim-tx-1.')).toBeInTheDocument();

    const nextAction = screen.getByRole('region', { name: 'Next action' });
    expect(within(nextAction).getByRole('link', { name: 'Review disclosure preview' })).toHaveAttribute(
      'href',
      '/app/disclosure',
    );
    expect(within(nextAction).getByRole('link', { name: 'Review activity narrative' })).toHaveAttribute(
      'href',
      '/app/activity',
    );
  });

  it('shows claim progress and keeps the payout pending when the claim handler returns pending', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);
    const claimPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      claimStatus: 'pending',
      transactionHash: 'claim-tx-1',
    });

    renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

    expect(claimPrivatePayout).toHaveBeenCalledWith('payout-1');
    expect(await screen.findByRole('button', { name: 'Pending claim' })).toBeDisabled();
    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('Preview claim submitted. Reference: claim-tx-1.')).toBeInTheDocument();
    expect(screen.queryByText('Preview claim completed. Reference: claim-tx-1.')).not.toBeInTheDocument();
  });

  it('blocks concurrent claim submissions while a claim is already in flight', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
      {
        payoutId: 'payout-2',
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 10,
        claimStatus: 'claimable',
      },
    ]);
    const deferred = createDeferredClaim();
    const claimPrivatePayout = vi.fn(() => deferred.promise);

    renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

    const claimButtons = screen.getAllByRole('button', { name: 'Claim' });

    fireEvent.click(claimButtons[0]);

    expect(claimPrivatePayout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Claiming payout' })).toBeDisabled();

    const remainingClaimButton = screen.getByRole('button', { name: 'Claim' });
    expect(remainingClaimButton).toBeDisabled();

    fireEvent.click(remainingClaimButton);

    expect(claimPrivatePayout).toHaveBeenCalledTimes(1);

    deferred.resolve({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });

    expect(await screen.findByRole('button', { name: 'Claimed' })).toBeDisabled();
  });

  it('blocks rescanning while a claim is already in flight and preserves the late claim result', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);
    const deferred = createDeferredClaim();
    const claimPrivatePayout = vi.fn(() => deferred.promise);

    renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

    const scanButton = screen.getByRole('button', { name: 'Scan claimable payouts' });
    expect(scanButton).toBeDisabled();

    fireEvent.click(scanButton);

    expect(scanClaimablePayouts).toHaveBeenCalledTimes(1);

    deferred.resolve({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });

    expect(await screen.findByRole('button', { name: 'Claimed' })).toBeDisabled();
    expect(screen.getByText('Preview claim completed. Reference: claim-tx-1.')).toBeInTheDocument();
  });

  it('preserves a claimed payout when a stale rescan starts immediately after claim completion', async () => {
    const deferredClaim = createDeferredClaim();
    const deferredRescan = createDeferredScan();
    const scanClaimablePayouts = vi
      .fn()
      .mockResolvedValueOnce([
        {
          payoutId: 'payout-1',
          senderLabel: 'Umbra Labs',
          tokenSymbol: 'SOL',
          amount: 5,
          claimStatus: 'claimable',
        },
      ])
      .mockImplementationOnce(() => deferredRescan.promise);
    const claimPrivatePayout = vi.fn(() => deferredClaim.promise);

    renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Claim' }));
    expect(claimPrivatePayout).toHaveBeenCalledWith('payout-1');
    expect(screen.getByRole('button', { name: 'Claiming payout' })).toBeDisabled();

    deferredClaim.resolve({
      payoutId: 'payout-1',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-1',
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Scan claimable payouts' })).toBeEnabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

    expect(scanClaimablePayouts).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: 'Scanning claimable payouts' })).toBeDisabled();

    deferredRescan.resolve([]);

    expect(await screen.findByRole('button', { name: 'Claimed' })).toBeDisabled();
    expect(screen.getByText('Umbra Labs')).toBeInTheDocument();
    expect(screen.getByText('claimed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Claim' })).not.toBeInTheDocument();
    expect(screen.queryByText('No eligible private payouts were found for the connected wallet preview.')).not.toBeInTheDocument();
  });

  it.each([
    ['pending', 'Pending claim'],
    ['claimed', 'Claimed'],
  ] as const)(
    'preserves %s claim state when a later scan returns stale claimable data',
    async (claimStatus, claimButtonLabel) => {
      const scanClaimablePayouts = vi
        .fn()
        .mockResolvedValueOnce([
          {
            payoutId: 'payout-1',
            senderLabel: 'Umbra Labs',
            tokenSymbol: 'SOL',
            amount: 5,
            claimStatus: 'claimable',
          },
        ])
        .mockResolvedValueOnce([
          {
            payoutId: 'payout-1',
            senderLabel: 'Umbra Labs',
            tokenSymbol: 'SOL',
            amount: 5,
            claimStatus: 'claimable',
          },
        ]);
      const claimPrivatePayout = vi.fn().mockResolvedValue({
        payoutId: 'payout-1',
        claimStatus,
        transactionHash: 'claim-tx-1',
      });

      renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

      fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
      expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

      expect(claimPrivatePayout).toHaveBeenCalledWith('payout-1');
      expect(await screen.findByRole('button', { name: claimButtonLabel })).toBeDisabled();
      expect(screen.getByText(claimStatus)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

      expect(scanClaimablePayouts).toHaveBeenCalledTimes(2);
      expect(await screen.findByRole('button', { name: claimButtonLabel })).toBeDisabled();
      expect(screen.getByText(claimStatus)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Claim' })).not.toBeInTheDocument();
    },
  );

  it.each([
    ['pending', 'Pending claim'],
    ['claimed', 'Claimed'],
  ] as const)(
    'preserves %s claim state when a later scan omits the payout',
    async (claimStatus, claimButtonLabel) => {
      const scanClaimablePayouts = vi
        .fn()
        .mockResolvedValueOnce([
          {
            payoutId: 'payout-1',
            senderLabel: 'Umbra Labs',
            tokenSymbol: 'SOL',
            amount: 5,
            claimStatus: 'claimable',
          },
        ])
        .mockResolvedValueOnce([]);
      const claimPrivatePayout = vi.fn().mockResolvedValue({
        payoutId: 'payout-1',
        claimStatus,
        transactionHash: 'claim-tx-1',
      });

      renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

      fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
      expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

      expect(claimPrivatePayout).toHaveBeenCalledWith('payout-1');
      expect(await screen.findByRole('button', { name: claimButtonLabel })).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

      expect(scanClaimablePayouts).toHaveBeenCalledTimes(2);
      expect(await screen.findByRole('button', { name: claimButtonLabel })).toBeDisabled();
      expect(screen.getByText('Umbra Labs')).toBeInTheDocument();
      expect(screen.getByText(claimStatus)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Claim' })).not.toBeInTheDocument();
      expect(screen.queryByText('No eligible private payouts were found for the connected wallet preview.')).not.toBeInTheDocument();
    },
  );

  it('shows a recoverable error when the claim handler returns a different payout id', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);
    const claimPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-2',
      claimStatus: 'claimed',
      transactionHash: 'claim-tx-2',
    });

    renderClaimCenterPage({ scanClaimablePayouts, claimPrivatePayout });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));
    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Claim' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to claim payout.');
    expect(screen.getByText('If the issue persists, rescan the wallet preview before retrying the claim.')).toBeInTheDocument();
    expect(screen.getByText('claimable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Claim' })).toBeEnabled();
    expect(screen.queryByText('Preview claim completed. Reference: claim-tx-2.')).not.toBeInTheDocument();
  });

  it('clears previous scan results after the wallet disconnects and reconnects', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'payout-1',
        senderLabel: 'Umbra Labs',
        tokenSymbol: 'SOL',
        amount: 5,
        claimStatus: 'claimable',
      },
    ]);

    renderClaimCenterPage({ scanClaimablePayouts });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

    expect(await screen.findByText('Claimable payouts found')).toBeInTheDocument();
    expect(screen.getByText('Umbra Labs')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));

    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeInTheDocument();
    expect(screen.queryByText('Claimable payouts found')).not.toBeInTheDocument();
    expect(screen.queryByText('Umbra Labs')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    expect(screen.getByRole('button', { name: 'Scan claimable payouts' })).toBeInTheDocument();
    expect(screen.queryByText('Claimable payouts found')).not.toBeInTheDocument();
    expect(screen.queryByText('Umbra Labs')).not.toBeInTheDocument();
  });

  it('shows an empty state when a scan returns no payouts', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([]);

    renderClaimCenterPage({ scanClaimablePayouts });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

    expect(
      await screen.findByText('No eligible private payouts were found for the connected wallet preview.'),
    ).toBeInTheDocument();
  });

  it('shows an error state when the scan request fails', async () => {
    const scanClaimablePayouts = vi.fn().mockRejectedValue(new Error('Scan failed'));

    renderClaimCenterPage({ scanClaimablePayouts });

    fireEvent.click(screen.getByRole('button', { name: 'Scan claimable payouts' }));

    expect(await screen.findByText('Unable to scan claimable payouts.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to scan claimable payouts.');
    expect(screen.getByText('Confirm the wallet stays connected, then scan again.')).toBeInTheDocument();
  });
});
