import { useLayoutEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WalletProvider, useWallet } from '@/providers/WalletProvider';

import type { BuildDisclosureView } from './DisclosurePage';

let capturedBuildDisclosureView: BuildDisclosureView | undefined;
let capturedDefaultInput:
  | {
      payoutId: string;
      level: 'none' | 'partial' | 'verification-ready';
      viewerRole: 'recipient' | 'sponsor' | 'auditor';
    }
  | undefined;
const buildDisclosureViewMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/protocol/demoUmbraService', () => ({
  demoUmbraService: {
    buildDisclosureView: buildDisclosureViewMock,
  },
}));

vi.mock('./DisclosurePage', () => ({
  DisclosurePage: ({
    buildDisclosureView,
    defaultInput,
  }: {
    buildDisclosureView: BuildDisclosureView;
    defaultInput?: {
      payoutId: string;
      level: 'none' | 'partial' | 'verification-ready';
      viewerRole: 'recipient' | 'sponsor' | 'auditor';
    };
  }) => {
    capturedBuildDisclosureView = buildDisclosureView;
    capturedDefaultInput = defaultInput;
    return <div>Mock disclosure page</div>;
  },
}));

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
    buildDisclosureViewMock.mockReset();
  });

  it('injects a service-backed disclosure builder into the page view', async () => {
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
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(screen.getByText('Mock disclosure page')).toBeInTheDocument();
    expect(capturedBuildDisclosureView).toBeTypeOf('function');
    expect(capturedDefaultInput).toBeUndefined();

    if (!capturedBuildDisclosureView) {
      throw new Error('Expected disclosure builder to be injected.');
    }

    await expect(
      capturedBuildDisclosureView({
        payoutId: 'preview-disclosure',
        level: 'verification-ready',
        viewerRole: 'recipient',
      }),
    ).resolves.toEqual(disclosureView);

    expect(buildDisclosureViewMock).toHaveBeenCalledWith({
      payoutId: 'preview-disclosure',
      level: 'verification-ready',
      viewerRole: 'recipient',
    });
  });

  it('passes the active demo session disclosure request to the page', () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <DemoFlowSessionSeeder />
        <DisclosurePageContainer />
      </WalletProvider>,
    );

    expect(screen.getByText('Mock disclosure page')).toBeInTheDocument();
    expect(capturedDefaultInput).toEqual({
      payoutId: 'session-payout-1',
      level: 'partial',
      viewerRole: 'recipient',
    });
  });
});
