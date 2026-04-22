import type {
  ClaimPrivatePayoutInput,
  ClaimPrivatePayoutResult,
  ClaimablePayout,
  ScanClaimablePayoutsInput,
} from '@/features/claim/schema';
import type { BuildDisclosureViewInput, DisclosureView } from '@/features/disclosure/schema';
import type {
  CreatePayoutFormInput,
  CreatePayoutFormValues,
  CreatePrivatePayoutResult,
  PayoutStatus,
} from '@/features/payout/schema';

export interface UmbraServiceGateway {
  createPrivatePayout(input: CreatePayoutFormValues): Promise<unknown>;
  getPayoutStatus(payoutId: string): Promise<unknown>;
  scanClaimablePayouts(input: ScanClaimablePayoutsInput): Promise<unknown>;
  claimPrivatePayout(input: ClaimPrivatePayoutInput): Promise<unknown>;
  buildDisclosureView(input: BuildDisclosureViewInput): Promise<unknown>;
}

export interface UmbraService {
  createPrivatePayout(input: CreatePayoutFormInput): Promise<CreatePrivatePayoutResult>;
  getPayoutStatus(payoutId: string): Promise<PayoutStatus>;
  scanClaimablePayouts(input: ScanClaimablePayoutsInput): Promise<ClaimablePayout[]>;
  claimPrivatePayout(input: ClaimPrivatePayoutInput): Promise<ClaimPrivatePayoutResult>;
  buildDisclosureView(input: BuildDisclosureViewInput): Promise<DisclosureView>;
}
