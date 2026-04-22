import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { WalletProvider } from '@/providers/WalletProvider';

import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders landmark navigation, brand shell, wallet state entry, and page content', () => {
    render(
      <WalletProvider>
        <AppShell>
          <p>Shell content</p>
        </AppShell>
      </WalletProvider>,
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary navigation' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('The Ledger')).toBeInTheDocument();
    expect(screen.getByText('Privacy-first reward workflow')).toBeInTheDocument();
    expect(screen.getByText('Wallet disconnected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect wallet' })).toBeEnabled();
    expect(screen.queryByRole('heading', { name: 'Privacy-first reward workflow' })).not.toBeInTheDocument();
    expect(screen.getByText('Shell content')).toBeInTheDocument();
  });

  it('updates the shell wallet entry after connecting', () => {
    render(
      <WalletProvider>
        <AppShell>
          <p>Shell content</p>
        </AppShell>
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect wallet' }));

    expect(screen.getByText('Wallet connected')).toBeInTheDocument();
    expect(screen.getByText('Embedded wallet preview')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disconnect wallet' })).toBeEnabled();
  });
});

