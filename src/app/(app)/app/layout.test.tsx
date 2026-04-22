import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useWallet } from '@/providers/WalletProvider';

import AppLayout from './layout';

function WalletStatusProbe() {
  const wallet = useWallet();

  return (
    <>
      <span>probe-status:{wallet.status}</span>
      <span>probe-network:{wallet.networkLabel}</span>
    </>
  );
}

describe('AppLayout', () => {
  it('applies app-only providers around the shell', () => {
    render(
      <AppLayout>
        <WalletStatusProbe />
        <p>App layout content</p>
      </AppLayout>,
    );

    expect(screen.getByText('App layout content')).toBeInTheDocument();
    expect(screen.getByText('Privacy-first reward workflow')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('probe-status:disconnected')).toBeInTheDocument();
    expect(screen.getByText('probe-network:Solana Devnet')).toBeInTheDocument();
  });
});
