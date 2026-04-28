'use client';

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { SolanaWalletBridgeProvider } from './SolanaWalletBridgeProvider';
import { WalletProvider } from './WalletProvider';

interface ProvidersProps {
  children: ReactNode;
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    return createQueryClient();
  }

  browserQueryClient ??= createQueryClient();

  return browserQueryClient;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletBridgeProvider>
        <WalletProvider>{children}</WalletProvider>
      </SolanaWalletBridgeProvider>
    </QueryClientProvider>
  );
}
