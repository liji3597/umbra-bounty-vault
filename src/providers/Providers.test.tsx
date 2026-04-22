import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Providers } from './Providers';
import { useWallet } from './WalletProvider';

function QueryClientProbe() {
  const queryClient = useQueryClient();
  const wallet = useWallet();

  return (
    <>
      <span>{queryClient ? 'query-client-ready' : 'missing-query-client'}</span>
      <span>{wallet.status}</span>
      <span>{wallet.networkLabel}</span>
    </>
  );
}

describe('Providers', () => {
  it('exposes query and wallet context to descendants', () => {
    render(
      <Providers>
        <QueryClientProbe />
      </Providers>,
    );

    expect(screen.getByText('query-client-ready')).toBeInTheDocument();
    expect(screen.getByText('disconnected')).toBeInTheDocument();
    expect(screen.getByText('Solana Devnet')).toBeInTheDocument();
  });
});

