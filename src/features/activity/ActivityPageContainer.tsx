'use client';

import { useCallback, useInsertionEffect, useMemo, useRef } from 'react';

import type { ClaimablePayout } from '@/features/claim/schema';
import {
  resolveDemoUmbraProvider,
  resolveReadOnlyUmbraProvider,
} from '@/features/protocol/umbraProviderResolver';
import { loadUmbraSdkModule } from '@/features/protocol/umbraSdkClient';
import type { WalletNetwork } from '@/features/shared/network';
import { useWallet, type DemoFlowSession } from '@/providers/WalletProvider';

import { ActivityPage, type ActivityNarrative, type LoadActivityNarrative } from './ActivityPage';

const PREVIEW_ACTIVITY_NETWORK = 'mainnet';
const PREVIEW_ACTIVITY_WALLET_ADDRESS = 'preview-wallet-1';
const PREVIEW_ACTIVITY_RECIPIENT = `${PREVIEW_ACTIVITY_NETWORK}-${PREVIEW_ACTIVITY_WALLET_ADDRESS}`;

let activityNarrativePromise: Promise<ActivityNarrative> | null = null;

function getSupportedWalletNetwork(network: WalletNetwork): Exclude<WalletNetwork, 'unsupported'> {
  if (network === 'unsupported') {
    throw new Error('Supported network is required before loading activity narratives.');
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

function getActivitySessionKey(session: DemoFlowSession): string {
  return `${session.connectionVersion}:${session.network}:${session.walletAddress}:${session.payout.payoutId}`;
}

function getClaimableTokenSymbol(tokenMint: string): string {
  return tokenMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'TOKEN';
}

function getClaimableSenderLabel(network: Exclude<WalletNetwork, 'unsupported'>): string {
  return network === 'mainnet' ? 'Umbra Treasury' : 'Umbra Labs';
}

function buildSessionClaimablePayout(session: DemoFlowSession): ClaimablePayout {
  const normalizedAmount = Number(session.draft.amount);

  if (!Number.isFinite(normalizedAmount) || String(normalizedAmount) !== session.draft.amount) {
    throw new Error('Demo flow payout amount cannot be represented safely in the activity narrative.');
  }

  return {
    payoutId: session.payout.payoutId,
    senderLabel: getClaimableSenderLabel(session.network),
    tokenSymbol: getClaimableTokenSymbol(session.draft.tokenMint),
    amount: normalizedAmount,
    claimStatus: session.claimResult?.claimStatus === 'claimed' ? 'claimed' : 'claimable',
  };
}

async function buildDemoPreviewActivityNarrative(): Promise<ActivityNarrative> {
  const demoProvider = resolveDemoUmbraProvider();
  const payout = await demoProvider.service.createPrivatePayout({
    recipient: PREVIEW_ACTIVITY_RECIPIENT,
    tokenMint: 'So11111111111111111111111111111111111111112',
    amount: '8',
    disclosureLevel: 'verification-ready',
  });

  const [claimablePayouts, claimResult, disclosureView] = await Promise.all([
    demoProvider.service.scanClaimablePayouts({
      walletAddress: PREVIEW_ACTIVITY_WALLET_ADDRESS,
      network: PREVIEW_ACTIVITY_NETWORK,
    }),
    demoProvider.service.claimPrivatePayout({
      payoutId: payout.payoutId,
      walletAddress: PREVIEW_ACTIVITY_WALLET_ADDRESS,
      network: PREVIEW_ACTIVITY_NETWORK,
    }),
    demoProvider.service.buildDisclosureView({
      payoutId: payout.payoutId,
      level: 'verification-ready',
      viewerRole: 'recipient',
    }),
  ]);

  return {
    payout,
    claimablePayouts,
    claimResult,
    disclosureView,
    truthSource: 'prepared-preview',
  };
}

export function ActivityPageContainer() {
  const wallet = useWallet();
  const demoProvider = resolveDemoUmbraProvider();
  const isActivitySessionReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const activeDemoFlowSession = useMemo<DemoFlowSession | null>(
    () =>
      isActiveDemoFlowSession(wallet.demoFlowSession, {
        isSessionReady: isActivitySessionReady,
        connectionVersion: wallet.connectionVersion,
        network: wallet.network,
        walletAddress: wallet.walletAddress,
      })
        ? wallet.demoFlowSession
        : null,
    [
      isActivitySessionReady,
      wallet.connectionVersion,
      wallet.demoFlowSession,
      wallet.network,
      wallet.walletAddress,
    ],
  );
  const readOnlyProvider = isActivitySessionReady
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
  const currentActivitySessionKey = activeDemoFlowSession ? getActivitySessionKey(activeDemoFlowSession) : null;
  const activeActivitySessionKeyRef = useRef<string | null>(currentActivitySessionKey);

  useInsertionEffect(() => {
    activeActivitySessionKeyRef.current = currentActivitySessionKey;

    return () => {
      if (activeActivitySessionKeyRef.current === currentActivitySessionKey) {
        activeActivitySessionKeyRef.current = null;
      }
    };
  }, [currentActivitySessionKey]);

  function getActiveDemoFlowSession(session: DemoFlowSession, sessionKey: string): DemoFlowSession {
    if (activeActivitySessionKeyRef.current !== sessionKey) {
      throw new Error('Activity wallet session is no longer active.');
    }

    return session;
  }

  const loadActivityNarrative: LoadActivityNarrative | null = useCallback(() => {
    if (activeDemoFlowSession) {
      const activitySessionKey = getActivitySessionKey(activeDemoFlowSession);
      const session = getActiveDemoFlowSession(activeDemoFlowSession, activitySessionKey);
      const sessionClaimablePayout = buildSessionClaimablePayout(session);
      const claimablePayoutsPromise = readOnlyProvider?.capabilities.canScanClaimablePayouts
        ? readOnlyProvider.service
            .scanClaimablePayouts({
              walletAddress: session.walletAddress,
              network: session.network,
            })
            .then((claimablePayouts) => {
              const activeSession = getActiveDemoFlowSession(activeDemoFlowSession, activitySessionKey);
              const activeClaimablePayout = claimablePayouts.find(
                (claimablePayout) => claimablePayout.payoutId === activeSession.payout.payoutId,
              );
              const canUseLiveNarrative = activeClaimablePayout
                ? activeSession.claimResult
                  ? activeClaimablePayout.claimStatus === 'claimed'
                  : activeClaimablePayout.claimStatus === 'claimable'
                : false;

              return {
                claimablePayouts: canUseLiveNarrative
                  ? claimablePayouts
                  : [buildSessionClaimablePayout(activeSession)],
                truthSource: canUseLiveNarrative ? 'live-derived' : 'demo-derived',
              } as const;
            })
        : Promise.resolve({
            claimablePayouts: [sessionClaimablePayout],
            truthSource: 'demo-derived' as const,
          });
      const disclosureViewPromise = readOnlyProvider?.capabilities.canBuildLiveDisclosure
        ? readOnlyProvider.service.buildDisclosureView({
            payoutId: session.payout.payoutId,
            level: session.draft.disclosureLevel,
            viewerRole: 'recipient',
          })
        : demoProvider.service.buildDisclosureView({
            payoutId: session.payout.payoutId,
            level: session.draft.disclosureLevel,
            viewerRole: 'recipient',
          });

      return Promise.all([
        claimablePayoutsPromise,
        disclosureViewPromise,
      ]).then(([claimableNarrative, disclosureView]) => {
        const activeSession = getActiveDemoFlowSession(activeDemoFlowSession, activitySessionKey);

        return {
          payout: activeSession.payout,
          claimablePayouts: claimableNarrative.claimablePayouts,
          claimResult: activeSession.claimResult,
          disclosureView,
          truthSource: claimableNarrative.truthSource,
        };
      });
    }

    if (readOnlyProvider) {
      return Promise.reject(new Error('Activity narrative is not implemented for connected wallet sessions.'));
    }

    if (!activityNarrativePromise) {
      activityNarrativePromise = buildDemoPreviewActivityNarrative().finally(() => {
        activityNarrativePromise = null;
      });
    }

    return activityNarrativePromise;
  }, [activeDemoFlowSession, demoProvider.service, readOnlyProvider]);

  return <ActivityPage loadActivityNarrative={readOnlyProvider && !activeDemoFlowSession ? null : loadActivityNarrative} />;
}
