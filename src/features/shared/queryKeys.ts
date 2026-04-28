import type { SupportedWalletNetwork } from './network';

export const queryKeys = {
  payouts: {
    all: () => ['payouts'] as const,
    detail: (payoutId: string) => ['payouts', 'detail', payoutId] as const,
    status: (payoutId: string) => ['payouts', 'status', payoutId] as const,
  },
  claims: {
    all: () => ['claims'] as const,
    scan: (walletAddress: string, network: SupportedWalletNetwork) =>
      ['claims', 'scan', network, walletAddress] as const,
  },
  disclosure: {
    all: () => ['disclosure'] as const,
    detail: (payoutId: string) => ['disclosure', 'detail', payoutId] as const,
  },
};
