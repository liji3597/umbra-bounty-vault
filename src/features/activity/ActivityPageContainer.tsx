'use client';

import { useCallback, useInsertionEffect, useMemo, useRef } from 'react';

import type { ClaimablePayout } from '@/features/claim/schema';
import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import type { WalletNetwork } from '@/features/shared/network';
import { useWallet, type DemoFlowSession } from '@/providers/WalletProvider';

import { ActivityPage, type ActivityNarrative, type LoadActivityNarrative } from './ActivityPage';

const PREVIEW_ACTIVITY_NETWORK = 'mainnet';
const PREVIEW_ACTIVITY_WALLET_ADDRESS = 'preview-wallet-1';
const PREVIEW_ACTIVITY_RECIPIENT = `${PREVIEW_ACTIVITY_NETWORK}-${PREVIEW_ACTIVITY_WALLET_ADDRESS}`;

let activityNarrativePromise: Promise<ActivityNarrative> | null = null;

function getActivitySessionKey(session: DemoFlowSession): string {
  return `${session.connectionVersion}:${session.network}:${session.payout.payoutId}`;
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

async function buildPreviewActivityNarrative(): Promise<ActivityNarrative> {
  const payout = await demoUmbraService.createPrivatePayout({
    recipient: PREVIEW_ACTIVITY_RECIPIENT,
    tokenMint: 'So11111111111111111111111111111111111111112',
    amount: '8',
    disclosureLevel: 'verification-ready',
  });

  const [claimablePayouts, claimResult, disclosureView] = await Promise.all([
    demoUmbraService.scanClaimablePayouts({
      walletAddress: PREVIEW_ACTIVITY_WALLET_ADDRESS,
      network: PREVIEW_ACTIVITY_NETWORK,
    }),
    demoUmbraService.claimPrivatePayout({
      payoutId: payout.payoutId,
      walletAddress: PREVIEW_ACTIVITY_WALLET_ADDRESS,
      network: PREVIEW_ACTIVITY_NETWORK,
    }),
    demoUmbraService.buildDisclosureView({
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
  };
}

export function ActivityPageContainer() {
  const wallet = useWallet();
  const isActivitySessionReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const activeDemoFlowSession = useMemo<DemoFlowSession | null>(
    () =>
      isActivitySessionReady &&
      wallet.demoFlowSession &&
      wallet.demoFlowSession.connectionVersion === wallet.connectionVersion &&
      wallet.demoFlowSession.network === wallet.network
        ? wallet.demoFlowSession
        : null,
    [isActivitySessionReady, wallet.connectionVersion, wallet.demoFlowSession, wallet.network],
  );
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

  const loadActivityNarrative: LoadActivityNarrative = useCallback(() => {
    if (activeDemoFlowSession) {
      const activitySessionKey = getActivitySessionKey(activeDemoFlowSession);
      const session = getActiveDemoFlowSession(activeDemoFlowSession, activitySessionKey);

      return demoUmbraService
        .buildDisclosureView({
          payoutId: session.payout.payoutId,
          level: session.draft.disclosureLevel,
          viewerRole: 'recipient',
        })
        .then((disclosureView) => {
          const activeSession = getActiveDemoFlowSession(activeDemoFlowSession, activitySessionKey);

          return {
            payout: activeSession.payout,
            claimablePayouts: [buildSessionClaimablePayout(activeSession)],
            claimResult: activeSession.claimResult,
            disclosureView,
          };
        });
    }

    if (!activityNarrativePromise) {
      activityNarrativePromise = buildPreviewActivityNarrative().finally(() => {
        activityNarrativePromise = null;
      });
    }

    return activityNarrativePromise;
  }, [activeDemoFlowSession]);

  return <ActivityPage loadActivityNarrative={loadActivityNarrative} />;
}
