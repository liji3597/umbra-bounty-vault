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

export type UmbraProviderKind = 'demo' | 'legacy' | 'sdk-live' | 'unavailable';

export interface UmbraCapabilities {
  canCreatePrivatePayout: boolean;
  canScanClaimablePayouts: boolean;
  canClaimPrivatePayout: boolean;
  canBuildLiveDisclosure: boolean;
}

export type UmbraRecipientRegistrationStatus = 'registered' | 'unregistered' | 'unavailable';

export type UmbraRecipientRegistrationReason =
  | 'non-existent'
  | 'account-uninitialized'
  | 'x25519-missing'
  | 'commitment-missing'
  | 'anonymous-usage-inactive';

export interface UmbraRecipientRegistrationDetails {
  isInitialised: boolean;
  isUserAccountX25519KeyRegistered: boolean;
  isUserCommitmentRegistered: boolean;
  isActiveForAnonymousUsage: boolean;
}

export interface UmbraRecipientRegistrationResult {
  status: UmbraRecipientRegistrationStatus;
  reason?: UmbraRecipientRegistrationReason;
  details?: UmbraRecipientRegistrationDetails;
}

export type UmbraRecipientRegistrationResolver = (
  recipient: string,
) => Promise<UmbraRecipientRegistrationResult>;

export type UmbraCreateAvailabilityStatus = 'available' | 'blocked' | 'unavailable';

export type UmbraCreateAvailabilityReason =
  | 'sdk-create-not-wired'
  | 'sdk-session-unavailable'
  | UmbraRecipientRegistrationReason;

export interface UmbraCreateAvailability {
  status: UmbraCreateAvailabilityStatus;
  reason?: UmbraCreateAvailabilityReason;
  registration?: UmbraRecipientRegistrationResult;
}

export interface ResolvedUmbraProvider {
  kind: UmbraProviderKind;
  capabilities: UmbraCapabilities;
  service: UmbraService;
  resolveRecipientRegistration?: UmbraRecipientRegistrationResolver;
  createAvailability?: UmbraCreateAvailability;
}
