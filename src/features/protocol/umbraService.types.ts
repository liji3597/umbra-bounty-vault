import type {
  BuildDisclosureViewInput,
  ClaimPrivatePayoutInput,
  ClaimPrivatePayoutResult,
  ClaimablePayout,
  CreatePrivatePayoutInput,
  CreatePrivatePayoutResult,
  CreatePrivatePayoutValues,
  PayoutStatus,
  ScanClaimablePayoutsInput,
  DisclosureView,
} from './schema';

export interface UmbraServiceGateway {
  createPrivatePayout(input: CreatePrivatePayoutValues): Promise<unknown>;
  getPayoutStatus(payoutId: string): Promise<unknown>;
  scanClaimablePayouts(input: ScanClaimablePayoutsInput): Promise<unknown>;
  claimPrivatePayout(input: ClaimPrivatePayoutInput): Promise<unknown>;
  buildDisclosureView(input: BuildDisclosureViewInput): Promise<unknown>;
}

export interface UmbraService {
  createPrivatePayout(input: CreatePrivatePayoutInput): Promise<CreatePrivatePayoutResult>;
  getPayoutStatus(payoutId: string): Promise<PayoutStatus>;
  scanClaimablePayouts(input: ScanClaimablePayoutsInput): Promise<ClaimablePayout[]>;
  claimPrivatePayout(input: ClaimPrivatePayoutInput): Promise<ClaimPrivatePayoutResult>;
  buildDisclosureView(input: BuildDisclosureViewInput): Promise<DisclosureView>;
}
