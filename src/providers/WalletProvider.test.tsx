import { StrictMode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWallet, WalletProvider } from './WalletProvider';

function WalletProbe() {
  const wallet = useWallet();

  return (
    <>
      <span>{wallet.status}</span>
      <span>{wallet.networkLabel}</span>
      <span>{wallet.isSupportedNetwork ? 'supported' : 'unsupported'}</span>
      <span>{wallet.walletLabel ?? 'no-wallet'}</span>
      <span>{wallet.connectionVersion}</span>
      <button type="button" onClick={wallet.connect}>
        Connect
      </button>
      <button type="button" onClick={wallet.disconnect}>
        Disconnect
      </button>
    </>
  );
}

describe('WalletProvider', () => {
  it('provides the default disconnected wallet state', () => {
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    expect(screen.getByText('disconnected')).toBeInTheDocument();
    expect(screen.getByText('Solana Devnet')).toBeInTheDocument();
    expect(screen.getByText('supported')).toBeInTheDocument();
    expect(screen.getByText('no-wallet')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('supports connect and disconnect transitions without an SDK dependency', () => {
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText('Embedded wallet preview')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(screen.getByText('disconnected')).toBeInTheDocument();
    expect(screen.getByText('no-wallet')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not bump the connection version when connect is called while already connected', () => {
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('bumps the connection version once per transition in StrictMode', () => {
    render(
      <StrictMode>
        <WalletProvider>
          <WalletProbe />
        </WalletProvider>
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));

    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(screen.getByText('disconnected')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
