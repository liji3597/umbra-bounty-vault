import type { UmbraCapabilities, UmbraProviderKind } from './umbraService.types';

const PROVIDER_CAPABILITIES: Record<UmbraProviderKind, UmbraCapabilities> = {
  demo: {
    canCreatePrivatePayout: true,
    canScanClaimablePayouts: true,
    canClaimPrivatePayout: true,
    canBuildLiveDisclosure: false,
  },
  legacy: {
    canCreatePrivatePayout: true,
    canScanClaimablePayouts: false,
    canClaimPrivatePayout: false,
    canBuildLiveDisclosure: false,
  },
  'sdk-live': {
    canCreatePrivatePayout: false,
    canScanClaimablePayouts: false,
    canClaimPrivatePayout: false,
    canBuildLiveDisclosure: false,
  },
  unavailable: {
    canCreatePrivatePayout: false,
    canScanClaimablePayouts: false,
    canClaimPrivatePayout: false,
    canBuildLiveDisclosure: false,
  },
};

export function getUmbraCapabilities(kind: UmbraProviderKind): UmbraCapabilities {
  return PROVIDER_CAPABILITIES[kind];
}
