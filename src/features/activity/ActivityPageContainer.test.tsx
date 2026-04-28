import { useLayoutEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WalletProvider, useWallet } from '@/providers/WalletProvider';

import type { ClaimablePayout } from '@/features/claim/schema';

import type { LoadActivityNarrative } from './ActivityPage';

const SESSION_PAYOUT_ID = 'session-payout-1';

let capturedLoadActivityNarrative: LoadActivityNarrative | undefined;

vi.mock('./ActivityPage', () => ({
  ActivityPage: ({ loadActivityNarrative }: { loadActivityNarrative: LoadActivityNarrative }) => {
    capturedLoadActivityNarrative = loadActivityNarrative;
    return <div>Mock activity page</div>;
  },
}));

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
  });

  it('injects an activity narrative loader into the page view', () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <ActivityPageContainer />
      </WalletProvider>,
    );

    expect(screen.getByText('Mock activity page')).toBeInTheDocument();
    expect(capturedLoadActivityNarrative).toBeTypeOf('function');
  });

  it('loads a consistent service-backed activity narrative', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
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

    expect(narrative.payout.status).toBe('submitted');
    expect(narrative.claimResult?.claimStatus).toBe('claimed');
    expect(narrative.disclosureView.level).toBe('verification-ready');
    expect(narrative.disclosureView.title).toBe('Recipient verification package');
    expect(narrative.disclosureView.summary).toContain('recipient access');
    expect(narrative.claimResult?.payoutId).toBe(narrative.payout.payoutId);
    expect(narrative.disclosureView.payoutId).toBe(narrative.payout.payoutId);
    expect(matchingClaimablePayout).toMatchObject({
      payoutId: narrative.payout.payoutId,
      claimStatus: 'claimable',
    });
  });



  it('returns an unclaimed session narrative without fabricating a claim result', async () => {
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

    await expect(capturedLoadActivityNarrative()).rejects.toThrow(
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

    if (!capturedLoadActivityNarrative) {
      throw new Error('Expected activity narrative loader to be injected.');
    }

    const narrative = await capturedLoadActivityNarrative();

    expect(narrative.payout.payoutId).not.toBe(SESSION_PAYOUT_ID);
    expect(narrative.disclosureView.level).toBe('verification-ready');
    expect(narrative.claimResult?.claimStatus).toBe('claimed');
  });
  it('reuses the in-flight activity narrative load across repeated calls', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
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

  it('starts a new activity narrative load after the in-flight request settles', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
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
