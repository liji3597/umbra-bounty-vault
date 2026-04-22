import { z } from 'zod';

import { supportedWalletNetworkSchema } from '@/features/shared/network';

export const scanClaimablePayoutsInputSchema = z.object({
  walletAddress: z.string().trim().min(1, 'Wallet address is required.'),
  network: supportedWalletNetworkSchema,
});

export const claimablePayoutSchema = z.object({
  payoutId: z.string().trim().min(1),
  senderLabel: z.string().trim().min(1),
  tokenSymbol: z.string().trim().min(1),
  amount: z.number().positive(),
  claimStatus: z.enum(['claimable', 'claimed', 'pending']),
});

export const claimPrivatePayoutInputSchema = z.object({
  payoutId: z.string().trim().min(1),
  walletAddress: z.string().trim().min(1),
  network: supportedWalletNetworkSchema,
});

export const claimPrivatePayoutResultSchema = z.object({
  payoutId: z.string().trim().min(1),
  claimStatus: z.enum(['pending', 'claimed', 'failed']),
  transactionHash: z.string().trim().min(1),
});

export type ScanClaimablePayoutsInput = z.infer<typeof scanClaimablePayoutsInputSchema>;
export type ClaimablePayout = z.infer<typeof claimablePayoutSchema>;
export type ClaimPrivatePayoutInput = z.infer<typeof claimPrivatePayoutInputSchema>;
export type ClaimPrivatePayoutResult = z.infer<typeof claimPrivatePayoutResultSchema>;
