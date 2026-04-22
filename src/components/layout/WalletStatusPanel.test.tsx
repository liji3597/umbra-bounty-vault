import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WalletProvider } from '@/providers/WalletProvider';

import { WalletStatusPanel } from './WalletStatusPanel';

describe('WalletStatusPanel', () => {
  it('renders a clear disconnected fallback with a connect action', () => {
    render(
      <WalletProvider>
        <WalletStatusPanel />
      </WalletProvider>,
    );

    expect(screen.getByText('Wallet disconnected')).toBeInTheDocument();
    expect(screen.getByText('Solana Devnet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Connect a wallet to continue with private payout, claim, and disclosure actions.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeEnabled();
  });

  it('renders connected status and disconnect action after connecting', () => {
    render(
      <WalletProvider>
        <WalletStatusPanel />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    expect(screen.getByText('Wallet connected')).toBeInTheDocument();
    expect(screen.getByText('Embedded wallet preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeEnabled();
  });

  it('renders unsupported network guidance and blocks wallet connection', () => {
    render(
      <WalletProvider
        initialState={{
          network: 'unsupported',
          message: 'Switch to a supported Solana network before continuing.',
        }}
      >
        <WalletStatusPanel />
      </WalletProvider>,
    );

    expect(screen.getByText('Unsupported network')).toBeInTheDocument();
    expect(
      screen.getByText('Switch to a supported Solana network before continuing.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeDisabled();
  });

  it('keeps disconnect available when a connected wallet is on an unsupported network', () => {
    render(
      <WalletProvider
        initialState={{
          status: 'connected',
          network: 'unsupported',
          walletLabel: 'Embedded wallet preview',
        }}
      >
        <WalletStatusPanel />
      </WalletProvider>,
    );

    expect(screen.getByText('Wallet connected')).toBeInTheDocument();
    expect(
      screen.getByText('Switch to a supported Solana network before continuing.'),
    ).toBeInTheDocument();

    const disconnectButton = screen.getByRole('button', { name: 'Disconnect wallet' });

    expect(disconnectButton).toBeEnabled();

    fireEvent.click(disconnectButton);

    expect(screen.getByText('Wallet disconnected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeDisabled();
  });

  it('falls back to default unsupported guidance without a custom message', () => {
    render(
      <WalletProvider
        initialState={{
          status: 'connected',
          network: 'unsupported',
          walletLabel: 'Embedded wallet preview',
          message: null,
        }}
      >
        <WalletStatusPanel />
      </WalletProvider>,
    );

    expect(
      screen.getByText('Switch to a supported Solana network before continuing.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Embedded wallet preview ready on Unsupported network.')).not.toBeInTheDocument();
  });

  it('renders initialization and error state containers with explicit messaging', () => {
    const { rerender } = render(
      <WalletProvider
        key="initializing"
        initialState={{
          status: 'initializing',
          message: 'Checking signer availability.',
        }}
      >
        <WalletStatusPanel />
      </WalletProvider>,
    );

    expect(screen.getByText('Wallet initializing')).toBeInTheDocument();
    expect(screen.getByText('Checking signer availability.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeDisabled();

    rerender(
      <WalletProvider
        key="error"
        initialState={{
          status: 'error',
          message: 'Wallet handshake failed.',
        }}
      >
        <WalletStatusPanel />
      </WalletProvider>,
    );

    expect(screen.getByText('Wallet action required')).toBeInTheDocument();
    expect(screen.getByText('Wallet handshake failed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeEnabled();
  });
});
