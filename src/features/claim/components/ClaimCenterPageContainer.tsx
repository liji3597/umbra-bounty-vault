'use client';

import { useInsertionEffect, useMemo, useRef } from 'react';

import type { WalletNetwork } from '@/features/shared/network';
import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import type { ClaimPrivatePayoutResult, ClaimablePayout } from '@/features/claim/schema';
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

function buildSessionClaimResult(payoutId: string): ClaimPrivatePayoutResult {
  return {
    payoutId,
    claimStatus: 'claimed',
    transactionHash: `session-claim-${payoutId}`,
  };
}

export function ClaimCenterPageContainer() {
  const wallet = useWallet();
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
    wallet.demoFlowSession.network === wallet.network
      ? wallet.demoFlowSession
      : null;

  const scanClaimablePayouts: ScanClaimablePayouts | undefined = currentClaimSession
    ? async () => {
        const claimSessionKey = getClaimSessionKey(currentClaimSession);
        const activeClaimSession = getActiveClaimSession(currentClaimSession, claimSessionKey);

        if (activeDemoFlowSession) {
          const claimStatus = activeDemoFlowSession.claimResult ? 'claimed' : 'claimable';

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

        const payouts = await demoUmbraService.scanClaimablePayouts({
          walletAddress: activeClaimSession.walletAddress,
          network: activeClaimSession.network,
        });

        getActiveClaimSession(currentClaimSession, claimSessionKey);

        return payouts;
      }
    : undefined;

  const claimPrivatePayout: ClaimPrivatePayout | undefined = currentClaimSession
    ? async (payoutId) => {
        const claimSessionKey = getClaimSessionKey(currentClaimSession);
        const activeClaimSession = getActiveClaimSession(currentClaimSession, claimSessionKey);

        if (activeDemoFlowSession?.payout.payoutId === payoutId) {
          const claimResult = activeDemoFlowSession.claimResult ?? buildSessionClaimResult(payoutId);

          wallet.updateDemoFlowClaimResult(claimResult);
          getActiveClaimSession(currentClaimSession, claimSessionKey);

          return claimResult;
        }

        const claimResult = await demoUmbraService.claimPrivatePayout({
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
    />
  );
}
