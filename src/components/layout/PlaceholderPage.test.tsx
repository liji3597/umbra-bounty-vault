import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useWallet, WalletProvider } from '@/providers/WalletProvider';

import { AppPlaceholder, DashboardPageOverview, PlaceholderPage } from './PlaceholderPage';

describe('PlaceholderPage', () => {
  it('renders the dashboard overview for a disconnected wallet without fake live session state', () => {
    render(
      <WalletProvider initialState={{ status: 'disconnected', network: 'devnet' }}>
        <DashboardPageOverview />
      </WalletProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Solana Devnet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start with payout' })).toHaveAttribute('href', '/app/payouts/new');
    expect(screen.getByText('No linked payout session')).toBeInTheDocument();
    expect(screen.getByText('Connect a wallet to begin the claim-oriented Phase 1 walkthrough.')).toBeInTheDocument();
    expect(screen.getByText('Disclosure queue is empty')).toBeInTheDocument();
    expect(screen.getByText('No payout session is active yet')).toBeInTheDocument();
    expect(screen.queryByText('Judge review packet')).not.toBeInTheDocument();
  });

  it('renders live-aware connected state before a payout session exists', () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet', walletLabel: 'session-wallet' }}>
        <DashboardPageOverview />
      </WalletProvider>,
    );

    expect(screen.getByText('Start the smallest claim-oriented payout narrative')).toBeInTheDocument();
    expect(screen.getByText('Create one payout first to activate the linked recipient walkthrough.')).toBeInTheDocument();
    expect(screen.getByText('Disclosure queue is empty')).toBeInTheDocument();
    expect(screen.getByText('Connected recipients can scan for a linked claim once a payout has been created.')).toBeInTheDocument();
  });

  it('renders wallet-scoped session state after a payout session is saved', () => {
    function DashboardSessionHarness() {
      const wallet = useWallet();

      return (
        <>
          <button
            type="button"
            onClick={() => {
              wallet.saveDemoFlowSession({
                payout: {
                  payoutId: 'session-payout',
                  transactionHash: 'session-transaction',
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
                connectionVersion: wallet.connectionVersion,
              });
            }}
          >
            Seed session
          </button>
          <DashboardPageOverview />
        </>
      );
    }

    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet', walletLabel: 'session-wallet' }}>
        <DashboardSessionHarness />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Seed session' }));

    expect(screen.getByRole('link', { name: 'Continue to claim center' })).toHaveAttribute('href', '/app/claim');
    expect(screen.getByText('Continue the linked claim walkthrough')).toBeInTheDocument();
    expect(screen.getByText('Claimable payout in current session')).toBeInTheDocument();
    expect(screen.getByText('One linked recipient walkthrough is enough to tell the Phase 1 demo story.')).toBeInTheDocument();
    expect(screen.getByText('Bounty completion proof')).toBeInTheDocument();
    expect(screen.getByText('Partial disclosure • prepared for linked review')).toBeInTheDocument();
    expect(screen.getByText('Payout session is active')).toBeInTheDocument();
    expect(screen.getByText('Claim remains available')).toBeInTheDocument();
  });

  it('falls back to the payout entry action on unsupported networks', () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'unsupported', walletLabel: 'session-wallet' }}>
        <DashboardPageOverview />
      </WalletProvider>,
    );

    expect(screen.getByRole('link', { name: 'Start with payout' })).toHaveAttribute('href', '/app/payouts/new');
    expect(screen.getByText('Unsupported network')).toBeInTheDocument();
    expect(
      screen.getByText('Switch to a supported network before using claim, disclosure, or activity surfaces.'),
    ).toBeInTheDocument();
  });

  it('renders app placeholder route content and metadata', () => {
    render(
      <AppPlaceholder
        route={{
          href: '/app/activity',
          label: 'Activity',
          title: 'Activity',
          description: 'Follow payout creation, claim progress, and disclosure events.',
        }}
      />,
    );

    expect(screen.getByText('App Surface')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByText('Follow payout creation, claim progress, and disclosure events.')).toBeInTheDocument();
    expect(screen.getByText('Current phase')).toBeInTheDocument();
    expect(screen.getByText('P2 App Shell & Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Placeholder surface ready for feature implementation.')).toBeInTheDocument();
  });

  it('supports duplicate metadata labels without React key warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <PlaceholderPage
          eyebrow="App Surface"
          title="Dashboard"
          description="Track private payout progress and reward lifecycle status."
          meta={[
            { label: 'Status', value: 'Ready for implementation.' },
            { label: 'Status', value: 'Awaiting integration.' },
          ]}
        />,
      );

      expect(screen.getByText('Ready for implementation.')).toBeInTheDocument();
      expect(screen.getByText('Awaiting integration.')).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('supports fully duplicated metadata items without React key warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <PlaceholderPage
          eyebrow="App Surface"
          title="Dashboard"
          description="Track private payout progress and reward lifecycle status."
          meta={[
            { label: 'Status', value: 'Ready for implementation.' },
            { label: 'Status', value: 'Ready for implementation.' },
          ]}
        />,
      );

      const metaValues = screen.getAllByText('Ready for implementation.');

      expect(metaValues).toHaveLength(2);
      expect(metaValues.map((element) => element.textContent)).toEqual([
        'Ready for implementation.',
        'Ready for implementation.',
      ]);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('uses collision-safe keys for metadata items', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <PlaceholderPage
          eyebrow="App Surface"
          title="Dashboard"
          description="Track private payout progress and reward lifecycle status."
          meta={[
            { label: 'a-b', value: 'c' },
            { label: 'a', value: 'b-c' },
          ]}
        />,
      );

      expect(screen.getByText('c')).toBeInTheDocument();
      expect(screen.getByText('b-c')).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
