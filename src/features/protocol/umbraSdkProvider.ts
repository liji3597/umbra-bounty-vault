import type { SupportedWalletNetwork } from '@/features/shared/network';

import { getUmbraCapabilities } from './umbraCapabilities';
import { createNotImplementedUmbraService, createUmbraService } from './umbraService';
import type {
  ResolvedUmbraProvider,
  UmbraCreateAvailability,
  UmbraProviderKind,
} from './umbraService.types';
import {
  createUnavailableUmbraSdkClient,
  UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE,
  type UmbraSdkClient,
} from './umbraSdkClient';

function getUmbraSdkProviderKind(client: UmbraSdkClient): UmbraProviderKind {
  return client.status === 'ready' ? 'sdk-live' : 'unavailable';
}

function getUmbraSdkCreateAvailability(client: UmbraSdkClient): UmbraCreateAvailability {
  if (client.status !== 'ready') {
    return {
      status: 'unavailable',
      reason: 'sdk-session-unavailable',
    };
  }

  if (client.createPrivatePayout) {
    return {
      status: 'available',
    };
  }

  return {
    status: 'blocked',
    reason: 'sdk-create-not-wired',
  };
}

function getUmbraSdkCapabilities(client: UmbraSdkClient) {
  const kind = getUmbraSdkProviderKind(client);

  if (kind !== 'sdk-live') {
    return getUmbraCapabilities(kind);
  }

  return {
    ...getUmbraCapabilities(kind),
    canCreatePrivatePayout: Boolean(client.createPrivatePayout),
    canScanClaimablePayouts: Boolean(client.scanClaimablePayouts),
    canClaimPrivatePayout: Boolean(client.claimPrivatePayout),
    canBuildLiveDisclosure: Boolean(client.buildDisclosureView),
  };
}

export function createUmbraSdkProvider(client: UmbraSdkClient): ResolvedUmbraProvider {
  return {
    kind: getUmbraSdkProviderKind(client),
    capabilities: getUmbraSdkCapabilities(client),
    service:
      client.createPrivatePayout ||
      client.scanClaimablePayouts ||
      client.claimPrivatePayout ||
      client.buildDisclosureView
        ? createUmbraService({
            createPrivatePayout: client.createPrivatePayout
              ? client.createPrivatePayout
              : async () => {
                  throw new Error('createPrivatePayout is not implemented');
                },
            getPayoutStatus: async () => {
              throw new Error('getPayoutStatus is not implemented');
            },
            scanClaimablePayouts: client.scanClaimablePayouts
              ? client.scanClaimablePayouts
              : async () => {
                  throw new Error('scanClaimablePayouts is not implemented');
                },
            claimPrivatePayout: client.claimPrivatePayout
              ? client.claimPrivatePayout
              : async () => {
                  throw new Error(UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE);
                },
            buildDisclosureView: client.buildDisclosureView
              ? client.buildDisclosureView
              : async () => {
                  throw new Error('buildDisclosureView is not implemented');
                },
          })
        : createNotImplementedUmbraService(),
    resolveRecipientRegistration: client.resolveRecipientRegistration,
    createAvailability: getUmbraSdkCreateAvailability(client),
  };
}

export function createUnavailableUmbraSdkProvider(
  network: SupportedWalletNetwork,
): ResolvedUmbraProvider {
  return createUmbraSdkProvider(createUnavailableUmbraSdkClient(network));
}
