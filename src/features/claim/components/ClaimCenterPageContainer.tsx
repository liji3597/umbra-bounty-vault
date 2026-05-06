'use client';

import { useInsertionEffect, useMemo, useRef } from 'react';

import { useSearchParams } from 'next/navigation';

import type { WalletNetwork } from '@/features/shared/network';
import type { ClaimPrivatePayoutResult, ClaimablePayout } from '@/features/claim/schema';
import { resolveReadOnlyUmbraProvider } from '@/features/protocol/umbraProviderResolver';
import {
  loadUmbraSdkModule,
  UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE,
  UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE,
} from '@/features/protocol/umbraSdkClient';
import { useWallet } from '@/providers/WalletProvider';

import {
  ClaimCenterPage,
  type ClaimPrivatePayout,
  type ScanClaimablePayouts,
} from './ClaimCenterPage';

type ClaimSession = {
  connectionVersion: number;
  walletAddress: string;
  network: Exclude<WalletNetwork, 'unsupported'>;
};

const DEVELOPMENT_PREPARED_CLAIM_PAYOUT_MODE = 'claim-unavailable';
const DEVELOPMENT_PREPARED_CLAIM_TOKEN_MINT = 'So11111111111111111111111111111111111111112';
const DEVELOPMENT_PREPARED_CLAIM_PAYOUT_ID = 'prepared-claim-unavailable-payout';
const DEVELOPMENT_PREPARED_CLAIM_AMOUNT = '5';

function getClaimSessionKey(claimSession: ClaimSession): string {
  return `${claimSession.connectionVersion}:${claimSession.walletAddress}:${claimSession.network}`;
}

function getSupportedWalletNetwork(network: WalletNetwork): Exclude<WalletNetwork, 'unsupported'> {
  if (network === 'unsupported') {
    throw new Error('Supported network is required before scanning claimable payouts.');
  }

  return network;
}

function getClaimCenterPreviewWalletAddress(connectionVersion: number): string {
  return `preview-wallet-${connectionVersion}`;
}

function getClaimableTokenSymbol(tokenMint: string): string {
  return tokenMint === 'So11111111111111111111111111111111111111112' ? 'SOL' : 'TOKEN';
}

function getClaimableSenderLabel(network: Exclude<WalletNetwork, 'unsupported'>): string {
  return network === 'mainnet' ? 'Umbra Treasury' : 'Umbra Labs';
}

function getDevelopmentPreparedClaimablePayouts(
  claimSession: ClaimSession,
  preparedClaimPayoutMode: string | null,
): ClaimablePayout[] | null {
  if (
    process.env.NODE_ENV === 'production' ||
    preparedClaimPayoutMode !== DEVELOPMENT_PREPARED_CLAIM_PAYOUT_MODE
  ) {
    return null;
  }

  return [
    buildSessionClaimablePayout(
      claimSession.network,
      DEVELOPMENT_PREPARED_CLAIM_PAYOUT_ID,
      DEVELOPMENT_PREPARED_CLAIM_AMOUNT,
      DEVELOPMENT_PREPARED_CLAIM_TOKEN_MINT,
      'claimable',
    ),
  ];
}

function buildSessionClaimablePayout(
  network: Exclude<WalletNetwork, 'unsupported'>,
  payoutId: string,
  amount: string,
  tokenMint: string,
  claimStatus: ClaimablePayout['claimStatus'],
): ClaimablePayout {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || String(normalizedAmount) !== amount) {
    throw new Error('Demo flow payout amount cannot be represented safely in the claim preview.');
  }

  return {
    payoutId,
    senderLabel: getClaimableSenderLabel(network),
    tokenSymbol: getClaimableTokenSymbol(tokenMint),
    amount: normalizedAmount,
    claimStatus,
  };
}

function getSessionClaimablePayoutStatus(
  claimResult: ClaimPrivatePayoutResult | null,
): ClaimablePayout['claimStatus'] {
  if (!claimResult) {
    return 'claimable';
  }

  if (claimResult.claimStatus === 'failed') {
    return 'claimable';
  }

  return claimResult.claimStatus;
}

function buildSessionClaimResult(payoutId: string): ClaimPrivatePayoutResult {
  return {
    payoutId,
    claimStatus: 'claimed',
    transactionHash: `session-claim-${payoutId}`,
  };
}

export function ClaimCenterPageContainer() {
  const wallet = useWallet();
  const searchParams = useSearchParams();
  const preparedClaimPayoutMode = searchParams.get('mockClaimablePayout');
  const isClaimSessionReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const currentClaimSession = useMemo<ClaimSession | null>(() => {
    if (!isClaimSessionReady) {
      return null;
    }

    return {
      connectionVersion: wallet.connectionVersion,
      walletAddress: wallet.walletAddress ?? getClaimCenterPreviewWalletAddress(wallet.connectionVersion),
      network: getSupportedWalletNetwork(wallet.network),
    };
  }, [isClaimSessionReady, wallet.connectionVersion, wallet.network, wallet.walletAddress]);
  const readOnlyProvider = currentClaimSession
    ? resolveReadOnlyUmbraProvider({
        network: currentClaimSession.network,
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
  const currentClaimSessionKey = currentClaimSession ? getClaimSessionKey(currentClaimSession) : null;
  const activeClaimSessionKeyRef = useRef<string | null>(currentClaimSessionKey);

  useInsertionEffect(() => {
    activeClaimSessionKeyRef.current = currentClaimSessionKey;

    return () => {
      if (activeClaimSessionKeyRef.current === currentClaimSessionKey) {
        activeClaimSessionKeyRef.current = null;
      }
    };
  }, [currentClaimSessionKey]);

  function getActiveClaimSession(claimSession: ClaimSession, claimSessionKey: string): ClaimSession {
    if (activeClaimSessionKeyRef.current !== claimSessionKey) {
      throw new Error('Claim wallet session is no longer active.');
    }

    return claimSession;
  }

  const activeDemoFlowSession =
    wallet.demoFlowSession &&
    wallet.demoFlowSession.connectionVersion === wallet.connectionVersion &&
    wallet.demoFlowSession.network === wallet.network &&
    wallet.demoFlowSession.walletAddress === currentClaimSession?.walletAddress
      ? wallet.demoFlowSession
      : null;

  const scanClaimablePayouts: ScanClaimablePayouts | undefined = currentClaimSession && readOnlyProvider
    ? async () => {
        const claimSessionKey = getClaimSessionKey(currentClaimSession);
        const activeClaimSession = getActiveClaimSession(currentClaimSession, claimSessionKey);

        if (activeDemoFlowSession) {
          const claimStatus = getSessionClaimablePayoutStatus(activeDemoFlowSession.claimResult);

          getActiveClaimSession(currentClaimSession, claimSessionKey);

          return [
            buildSessionClaimablePayout(
              activeClaimSession.network,
              activeDemoFlowSession.payout.payoutId,
              activeDemoFlowSession.draft.amount,
              activeDemoFlowSession.draft.tokenMint,
              claimStatus,
            ),
          ];
        }

        const developmentPreparedClaimablePayouts = getDevelopmentPreparedClaimablePayouts(
          activeClaimSession,
          preparedClaimPayoutMode,
        );

        if (developmentPreparedClaimablePayouts) {
          getActiveClaimSession(currentClaimSession, claimSessionKey);

          return developmentPreparedClaimablePayouts;
        }

        if (!readOnlyProvider.capabilities.canScanClaimablePayouts) {
          throw new Error(UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE);
        }

        const payouts = await readOnlyProvider.service.scanClaimablePayouts({
          walletAddress: activeClaimSession.walletAddress,
          network: activeClaimSession.network,
        });

        getActiveClaimSession(currentClaimSession, claimSessionKey);

        return payouts;
      }
    : undefined;

  const claimPrivatePayout: ClaimPrivatePayout | undefined = currentClaimSession && readOnlyProvider
    ? async (payoutId) => {
        const claimSessionKey = getClaimSessionKey(currentClaimSession);
        const activeClaimSession = getActiveClaimSession(currentClaimSession, claimSessionKey);

        if (activeDemoFlowSession?.payout.payoutId === payoutId) {
          const claimResult = activeDemoFlowSession.claimResult ?? buildSessionClaimResult(payoutId);

          wallet.updateDemoFlowClaimResult(claimResult);
          getActiveClaimSession(currentClaimSession, claimSessionKey);

          return claimResult;
        }

        if (!readOnlyProvider.capabilities.canClaimPrivatePayout) {
          throw new Error(UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE);
        }

        const claimResult = await readOnlyProvider.service.claimPrivatePayout({
          payoutId,
          walletAddress: activeClaimSession.walletAddress,
          network: activeClaimSession.network,
        });

        getActiveClaimSession(currentClaimSession, claimSessionKey);

        return claimResult;
      }
    : undefined;

  return (
    <ClaimCenterPage
      walletLabel={wallet.walletLabel ?? 'Connected wallet'}
      scanClaimablePayouts={scanClaimablePayouts}
      claimPrivatePayout={claimPrivatePayout}
      hasLifecycleReviewContext={Boolean(activeDemoFlowSession)}
    />
  );
}
