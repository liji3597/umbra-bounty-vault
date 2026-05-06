'use client';

import { useCallback, useMemo } from 'react';

import {
  resolveDemoUmbraProvider,
  resolveReadOnlyUmbraProvider,
} from '@/features/protocol/umbraProviderResolver';
import { loadUmbraSdkModule } from '@/features/protocol/umbraSdkClient';
import type { WalletNetwork } from '@/features/shared/network';
import { useWallet, type DemoFlowSession } from '@/providers/WalletProvider';

import {
  DisclosurePage,
  type BuildDisclosureView,
  type DisclosureTruthSource,
} from './DisclosurePage';
import type { BuildDisclosureViewInput } from './schema';

function getSupportedWalletNetwork(network: WalletNetwork): Exclude<WalletNetwork, 'unsupported'> {
  if (network === 'unsupported') {
    throw new Error('Supported network is required before building disclosure views.');
  }

  return network;
}

function getEffectiveWalletAddress(walletAddress: string | null, connectionVersion: number): string {
  return walletAddress ?? `preview-wallet-${connectionVersion}`;
}

function isActiveDemoFlowSession(
  session: DemoFlowSession | null,
  {
    isSessionReady,
    connectionVersion,
    network,
    walletAddress,
  }: {
    isSessionReady: boolean;
    connectionVersion: number;
    network: WalletNetwork;
    walletAddress: string | null;
  },
): session is DemoFlowSession {
  return Boolean(
    isSessionReady &&
      session &&
      session.connectionVersion === connectionVersion &&
      session.network === network &&
      session.walletAddress === getEffectiveWalletAddress(walletAddress, connectionVersion),
  );
}

export function DisclosurePageContainer() {
  const wallet = useWallet();
  const demoProvider = resolveDemoUmbraProvider();
  const isDisclosureSessionReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const activeDemoFlowSession = useMemo<DemoFlowSession | null>(
    () =>
      isActiveDemoFlowSession(wallet.demoFlowSession, {
        isSessionReady: isDisclosureSessionReady,
        connectionVersion: wallet.connectionVersion,
        network: wallet.network,
        walletAddress: wallet.walletAddress,
      })
        ? wallet.demoFlowSession
        : null,
    [
      isDisclosureSessionReady,
      wallet.connectionVersion,
      wallet.demoFlowSession,
      wallet.network,
      wallet.walletAddress,
    ],
  );
  const readOnlyProvider = isDisclosureSessionReady
    ? resolveReadOnlyUmbraProvider({
        network: getSupportedWalletNetwork(wallet.network),
        loadSdkModule: loadUmbraSdkModule,
        walletAddress: wallet.walletAddress,
        walletLabel: wallet.walletLabel,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        signMessage: wallet.signMessage,
        indexerApiEndpoint: process.env.NEXT_PUBLIC_UMBRA_INDEXER_API_ENDPOINT,
        relayerApiEndpoint: process.env.NEXT_PUBLIC_UMBRA_RELAYER_API_ENDPOINT,
      })
    : null;
  const truthSource = useMemo<DisclosureTruthSource | undefined>(() => {
    if (activeDemoFlowSession) {
      return readOnlyProvider?.capabilities.canBuildLiveDisclosure ? 'live-derived' : 'demo-derived';
    }

    if (!readOnlyProvider) {
      return 'prepared-preview';
    }

    return undefined;
  }, [activeDemoFlowSession, readOnlyProvider]);

  const buildDisclosureView: BuildDisclosureView = useCallback(
    (input) => {
      if (activeDemoFlowSession) {
        if (readOnlyProvider?.capabilities.canBuildLiveDisclosure) {
          return readOnlyProvider.service.buildDisclosureView(input);
        }

        return demoProvider.service.buildDisclosureView(input);
      }

      if (readOnlyProvider) {
        return readOnlyProvider.service.buildDisclosureView(input);
      }

      return demoProvider.service.buildDisclosureView(input);
    },
    [activeDemoFlowSession, demoProvider.service, readOnlyProvider],
  );
  const defaultInput = useMemo<BuildDisclosureViewInput | null | undefined>(
    () => {
      if (activeDemoFlowSession) {
        return {
          payoutId: activeDemoFlowSession.payout.payoutId,
          level: activeDemoFlowSession.draft.disclosureLevel,
          viewerRole: 'recipient',
        };
      }

      if (readOnlyProvider) {
        return null;
      }

      return undefined;
    },
    [activeDemoFlowSession, readOnlyProvider],
  );

  return (
    <DisclosurePage
      buildDisclosureView={buildDisclosureView}
      defaultInput={defaultInput}
      truthSource={truthSource}
    />
  );
}
