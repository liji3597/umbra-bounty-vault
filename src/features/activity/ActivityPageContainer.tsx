'use client';

import type { ClaimablePayout } from '@/features/claim/schema';
import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import { useWallet } from '@/providers/WalletProvider';

import { ActivityPage, type ActivityNarrative, type LoadActivityNarrative } from './ActivityPage';

const PREVIEW_ACTIVITY_NETWORK = 'mainnet';
const PREVIEW_ACTIVITY_WALLET_ADDRESS = 'preview-wallet-1';
const PREVIEW_ACTIVITY_RECIPIENT = `${PREVIEW_ACTIVITY_NETWORK}-${PREVIEW_ACTIVITY_WALLET_ADDRESS}`;

let activityNarrativePromise: Promise<ActivityNarrative> | null = null;

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

  const loadActivityNarrative: LoadActivityNarrative = () => {
    const activeDemoFlowSession =
      wallet.demoFlowSession &&
      wallet.demoFlowSession.connectionVersion === wallet.connectionVersion &&
      wallet.demoFlowSession.network === wallet.network
        ? wallet.demoFlowSession
        : null;

    if (activeDemoFlowSession) {
      return Promise.all([
        demoUmbraService.buildDisclosureView({
          payoutId: activeDemoFlowSession.payout.payoutId,
          level: activeDemoFlowSession.draft.disclosureLevel,
          viewerRole: 'recipient',
        }),
        Promise.resolve<ClaimablePayout[]>([
          {
            payoutId: activeDemoFlowSession.payout.payoutId,
            senderLabel: activeDemoFlowSession.network === 'mainnet' ? 'Umbra Treasury' : 'Umbra Labs',
            tokenSymbol:
              activeDemoFlowSession.draft.tokenMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'TOKEN',
            amount: Number(activeDemoFlowSession.draft.amount),
            claimStatus: activeDemoFlowSession.claimResult ? 'claimed' : 'claimable',
          },
        ]),
      ]).then(([disclosureView, claimablePayouts]) => ({
        payout: activeDemoFlowSession.payout,
        claimablePayouts,
        claimResult: activeDemoFlowSession.claimResult,
        disclosureView,
      }));
    }

    if (!activityNarrativePromise) {
      activityNarrativePromise = buildPreviewActivityNarrative().finally(() => {
        activityNarrativePromise = null;
      });
    }

    return activityNarrativePromise;
  };

  return <ActivityPage loadActivityNarrative={loadActivityNarrative} />;
}
