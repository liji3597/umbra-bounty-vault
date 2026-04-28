import { z } from 'zod';

import {
  claimPrivatePayoutInputSchema as protocolClaimPrivatePayoutInputSchema,
  claimPrivatePayoutResultSchema as protocolClaimPrivatePayoutResultSchema,
  claimablePayoutSchema as protocolClaimablePayoutSchema,
  scanClaimablePayoutsInputSchema as protocolScanClaimablePayoutsInputSchema,
} from '@/features/protocol/schema';

export const scanClaimablePayoutsInputSchema = protocolScanClaimablePayoutsInputSchema;

export const claimablePayoutSchema = protocolClaimablePayoutSchema;

export const claimPrivatePayoutInputSchema = protocolClaimPrivatePayoutInputSchema;

export const claimPrivatePayoutResultSchema = protocolClaimPrivatePayoutResultSchema;

export type ScanClaimablePayoutsInput = z.infer<typeof scanClaimablePayoutsInputSchema>;
export type ClaimablePayout = z.infer<typeof claimablePayoutSchema>;
export type ClaimPrivatePayoutInput = z.infer<typeof claimPrivatePayoutInputSchema>;
export type ClaimPrivatePayoutResult = z.infer<typeof claimPrivatePayoutResultSchema>;
