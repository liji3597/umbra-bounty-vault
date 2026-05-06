import { demoUmbraService } from './demoUmbraService';
import { createDevnetUmbraService, type DevnetUmbraGatewayConfig } from './devnetUmbraService';
import {
  createUmbraSdkClient,
  type UmbraSdkClientConfig,
} from './umbraSdkClient';
import {
  createUmbraSdkProvider,
} from './umbraSdkProvider';
import { getUmbraCapabilities } from './umbraCapabilities';
import type { ResolvedUmbraProvider, UmbraRecipientRegistrationResult } from './umbraService.types';

async function resolveDemoRecipientRegistration(): Promise<UmbraRecipientRegistrationResult> {
  return {
    status: 'unavailable',
  };
}

export function resolveCreatePayoutProvider(
  config?: UmbraSdkClientConfig | null,
): ResolvedUmbraProvider {
  if (config) {
    return resolveSdkUmbraProvider(config);
  }

  return resolveDemoUmbraProvider();
}

export function resolveLegacyUmbraProvider(
  config: DevnetUmbraGatewayConfig,
): ResolvedUmbraProvider {
  return {
    kind: 'legacy',
    capabilities: getUmbraCapabilities('legacy'),
    service: createDevnetUmbraService(config),
    resolveRecipientRegistration: resolveDemoRecipientRegistration,
    createAvailability: {
      status: 'available',
    },
  };
}

export function resolveSdkUmbraProvider(
  config: UmbraSdkClientConfig,
): ResolvedUmbraProvider {
  return createUmbraSdkProvider(createUmbraSdkClient(config));
}

export function resolveReadOnlyUmbraProvider(
  config?: UmbraSdkClientConfig | null,
): ResolvedUmbraProvider {
  if (config) {
    return resolveSdkUmbraProvider(config);
  }

  return resolveDemoUmbraProvider();
}

export function resolveDemoUmbraProvider(): ResolvedUmbraProvider {
  return {
    kind: 'demo',
    capabilities: getUmbraCapabilities('demo'),
    service: demoUmbraService,
    resolveRecipientRegistration: resolveDemoRecipientRegistration,
    createAvailability: {
      status: 'available',
    },
  };
}
