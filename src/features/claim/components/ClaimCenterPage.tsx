'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';

import { Badge, Panel } from '@/components/ui';
import {
  type ClaimPrivatePayoutResult,
  type ClaimablePayout,
} from '@/features/claim/schema';
import { getAppRoute } from '@/lib/routes';
import { useWallet } from '@/providers/WalletProvider';

export type ScanClaimablePayouts = () => Promise<ClaimablePayout[]>;
export type ClaimPrivatePayout = (payoutId: string) => Promise<ClaimPrivatePayoutResult>;

interface ClaimCenterPageProps {
  walletLabel?: string;
  scanClaimablePayouts?: ScanClaimablePayouts;
  claimPrivatePayout?: ClaimPrivatePayout;
}

type ClaimCenterPhase = 'idle' | 'scanning' | 'found' | 'empty' | 'error';

type ClaimStatus = ClaimablePayout['claimStatus'];

const DEFAULT_SCAN_ERROR_MESSAGE = 'Unable to scan claimable payouts.';
const DEFAULT_CLAIM_ERROR_MESSAGE = 'Unable to claim payout.';
const WALLET_CONNECTION_ERROR_MESSAGE = 'Wallet connection is unavailable.';
const CLAIM_CENTER_WALLET_LABEL = 'Embedded wallet preview';
const CLAIM_CENTER_PRIVACY_GUIDANCE =
  'Scanning stays scoped to the connected wallet session and never asks for extra recipient details.';
const CLAIM_CENTER_SCAN_PROGRESS_GUIDANCE =
  'Keep this wallet connected while the current session checks for private payouts.';
const CLAIM_CENTER_SCAN_RECOVERY_GUIDANCE = 'Confirm the wallet stays connected, then scan again.';
const CLAIM_CENTER_CLAIM_RECOVERY_GUIDANCE =
  'If the issue persists, rescan the current wallet session before retrying the claim.';
const CLAIM_CENTER_RESULTS_TITLE = 'Claimable payouts found';
const DISCLOSURE_ROUTE = getAppRoute('/app/disclosure');
const ACTIVITY_ROUTE = getAppRoute('/app/activity');
const CLAIM_STATUS_PRIORITY: Record<ClaimStatus, number> = {
  claimable: 0,
  pending: 1,
  claimed: 2,
};

async function previewScanClaimablePayouts(): Promise<ClaimablePayout[]> {
  return [];
}

async function previewClaimPrivatePayout(payoutId: string): Promise<ClaimPrivatePayoutResult> {
  return {
    payoutId,
    claimStatus: 'claimed',
    transactionHash: `preview-claim-${payoutId}`,
  };
}

function getScanErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return DEFAULT_SCAN_ERROR_MESSAGE;
  }

  return DEFAULT_SCAN_ERROR_MESSAGE;
}

function getClaimFeedbackMessage(result: ClaimPrivatePayoutResult): string {
  if (result.claimStatus === 'pending') {
    return `Claim submitted for the current session. Reference: ${result.transactionHash}.`;
  }

  return `Claim completed for the current session. Reference: ${result.transactionHash}.`;
}

function mergeClaimablePayouts(
  currentPayouts: ClaimablePayout[],
  nextPayouts: ClaimablePayout[],
): ClaimablePayout[] {
  const currentPayoutsById = new Map(currentPayouts.map((payout) => [payout.payoutId, payout]));

  const mergedPayouts = nextPayouts.map((nextPayout) => {
    const currentPayout = currentPayoutsById.get(nextPayout.payoutId);

    if (!currentPayout) {
      return nextPayout;
    }

    if (CLAIM_STATUS_PRIORITY[currentPayout.claimStatus] > CLAIM_STATUS_PRIORITY[nextPayout.claimStatus]) {
      return {
        ...nextPayout,
        claimStatus: currentPayout.claimStatus,
      };
    }

    return nextPayout;
  });

  const missingTerminalPayouts = currentPayouts.filter((currentPayout) => {
    if (currentPayout.claimStatus === 'claimable') {
      return false;
    }

    return !nextPayouts.some((nextPayout) => nextPayout.payoutId === currentPayout.payoutId);
  });

  return [...mergedPayouts, ...missingTerminalPayouts];
}

interface ClaimablePayoutCardProps {
  payout: ClaimablePayout;
  activeClaimPayoutId: string | null;
  hasClaimInFlight: boolean;
  onClaim: (payoutId: string) => void;
}

interface ClaimCenterPageContentProps {
  networkLabel: string;
  walletLabel: string;
  scanClaimablePayouts: ScanClaimablePayouts;
  claimPrivatePayout: ClaimPrivatePayout;
}

function ClaimablePayoutCard({
  payout,
  activeClaimPayoutId,
  hasClaimInFlight,
  onClaim,
}: ClaimablePayoutCardProps) {
  const isClaiming = activeClaimPayoutId === payout.payoutId;
  const isClaimed = payout.claimStatus === 'claimed';
  const isPending = payout.claimStatus === 'pending';
  const isDisabled = hasClaimInFlight || isClaimed || isPending || payout.claimStatus !== 'claimable';
  const buttonLabel = isClaimed ? 'Claimed' : isPending ? 'Pending claim' : isClaiming ? 'Claiming payout' : 'Claim';
  const cardLabel = `Payout from ${payout.senderLabel} for ${payout.amount} ${payout.tokenSymbol}`;

  return (
    <Panel className="claim-center-page__card" role="listitem" aria-label={cardLabel}>
      <div className="claim-center-page__card-header">
        <p className="claim-center-page__card-title">{payout.senderLabel}</p>
        <Badge>{payout.claimStatus}</Badge>
      </div>
      <p className="claim-center-page__card-amount">
        {payout.amount} {payout.tokenSymbol}
      </p>
      <button type="button" onClick={() => onClaim(payout.payoutId)} disabled={isDisabled}>
        {buttonLabel}
      </button>
    </Panel>
  );
}

function ClaimCenterPageContent({
  networkLabel,
  walletLabel,
  scanClaimablePayouts,
  claimPrivatePayout,
}: ClaimCenterPageContentProps) {
  const claimResultsTitleId = useId();
  const [phase, setPhase] = useState<ClaimCenterPhase>('idle');
  const [claimablePayouts, setClaimablePayouts] = useState<ClaimablePayout[]>([]);
  const [scanError, setScanError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);
  const [activeClaimPayoutId, setActiveClaimPayoutId] = useState<string | null>(null);
  const claimInFlightRef = useRef(false);
  const claimablePayoutsRef = useRef<ClaimablePayout[]>([]);
  const scanInFlightRef = useRef(false);

  function syncClaimablePayouts(nextPayouts: ClaimablePayout[]) {
    claimablePayoutsRef.current = nextPayouts;
    setClaimablePayouts(nextPayouts);
  }

  async function handleScanClaimablePayouts() {
    if (claimInFlightRef.current || scanInFlightRef.current) {
      return;
    }

    scanInFlightRef.current = true;
    const currentPayouts = claimablePayoutsRef.current;

    setPhase('scanning');
    syncClaimablePayouts([]);
    setScanError(null);
    setClaimError(null);
    setClaimFeedback(null);
    setActiveClaimPayoutId(null);

    try {
      const payouts = await scanClaimablePayouts();
      const mergedPayouts = mergeClaimablePayouts(currentPayouts, payouts);

      syncClaimablePayouts(mergedPayouts);
      setPhase(mergedPayouts.length > 0 ? 'found' : 'empty');
    } catch (error: unknown) {
      syncClaimablePayouts([]);
      setScanError(getScanErrorMessage(error));
      setPhase('error');
    } finally {
      scanInFlightRef.current = false;
    }
  }

  async function handleClaimPrivatePayout(payoutId: string) {
    if (claimInFlightRef.current) {
      return;
    }

    const targetPayout = claimablePayouts.find((payout) => payout.payoutId === payoutId);

    if (!targetPayout || targetPayout.claimStatus !== 'claimable') {
      return;
    }

    claimInFlightRef.current = true;
    setClaimError(null);
    setClaimFeedback('Submitting claim for the current session.');
    setActiveClaimPayoutId(payoutId);

    try {
      const result = await claimPrivatePayout(payoutId);

      if (result.payoutId !== payoutId) {
        throw new Error('Claim response payout id mismatch.');
      }

      if (result.claimStatus === 'failed') {
        setClaimError(DEFAULT_CLAIM_ERROR_MESSAGE);
        setClaimFeedback(null);
        return;
      }

      const nextClaimStatus: ClaimablePayout['claimStatus'] = result.claimStatus;
      const currentPayouts = claimablePayoutsRef.current;
      const targetPayoutIndex = currentPayouts.findIndex((payout) => payout.payoutId === result.payoutId);

      if (targetPayoutIndex === -1) {
        setClaimError(DEFAULT_CLAIM_ERROR_MESSAGE);
        setClaimFeedback(null);
        return;
      }

      const nextPayouts = currentPayouts.map((payout) => {
        if (payout.payoutId !== result.payoutId) {
          return payout;
        }

        return {
          ...payout,
          claimStatus: nextClaimStatus,
        };
      });

      syncClaimablePayouts(nextPayouts);
      setClaimFeedback(getClaimFeedbackMessage(result));
    } catch {
      setClaimError(DEFAULT_CLAIM_ERROR_MESSAGE);
      setClaimFeedback(null);
    } finally {
      claimInFlightRef.current = false;
      setActiveClaimPayoutId(null);
    }
  }

  return (
    <section className="claim-center-page">
      <Panel className="claim-center-page__hero">
        <Badge className="page-eyebrow" variant="accent">
          Claim Flow
        </Badge>
        <h1 className="page-title">Claim Center</h1>
        <p className="page-description">
          Review the connected wallet session, scan for claimable payouts, and stay within the
          current wallet-scoped claim demo boundary.
        </p>
        <div className="claim-center-page__badges" aria-label="Claim center meta">
          <Badge>{networkLabel}</Badge>
          <Badge>{walletLabel}</Badge>
          <Badge>{phase === 'scanning' ? 'Scanning' : 'Ready'}</Badge>
        </div>
      </Panel>

      <Panel
        className="claim-center-page__status"
        heading="Wallet scan"
        description="This claim path stays scoped to the connected wallet session and preserves continuity with the payout narrative without implying a full live devnet claim indexer."
      >
        <p>
          {phase === 'scanning'
            ? 'Scanning the connected wallet session for claimable payouts within the current demo boundary.'
            : 'Scan the connected wallet session for claimable payouts within the current demo boundary.'}
        </p>
        <p>{CLAIM_CENTER_PRIVACY_GUIDANCE}</p>
        {phase === 'scanning' ? <p>{CLAIM_CENTER_SCAN_PROGRESS_GUIDANCE}</p> : null}
        <button
          type="button"
          onClick={handleScanClaimablePayouts}
          disabled={phase === 'scanning' || activeClaimPayoutId !== null}
        >
          {phase === 'scanning' ? 'Scanning claimable payouts' : 'Scan claimable payouts'}
        </button>
        {claimFeedback ? <p>{claimFeedback}</p> : null}
      </Panel>

      {phase === 'found' ? (
        <section aria-labelledby={claimResultsTitleId}>
          <h2 id={claimResultsTitleId} className="ui-panel__title">
            {CLAIM_CENTER_RESULTS_TITLE}
          </h2>
          <Panel
            className="claim-center-page__results"
            description="Eligible payouts remain visible here as the current wallet session moves through claim and next-step review."
          >
            <div className="claim-center-page__cards" role="list">
              {claimablePayouts.map((payout) => (
                <ClaimablePayoutCard
                  key={payout.payoutId}
                  payout={payout}
                  activeClaimPayoutId={activeClaimPayoutId}
                  hasClaimInFlight={claimInFlightRef.current}
                  onClaim={handleClaimPrivatePayout}
                />
              ))}
            </div>
          </Panel>
        </section>
      ) : null}

      {claimFeedback && activeClaimPayoutId === null && !claimError ? (
        <Panel heading="Next action" role="region" aria-label="Next action">
          <p>
            Continue the reward lifecycle in Disclosure / Verification or review the combined
            narrative in Activity.
          </p>
          <ul className="app-link-list">
            <li>
              <Link className="app-inline-link" href={DISCLOSURE_ROUTE.href}>Review disclosure package</Link>
            </li>
            <li>
              <Link className="app-inline-link" href={ACTIVITY_ROUTE.href}>Review activity narrative</Link>
            </li>
          </ul>
        </Panel>
      ) : null}

      {phase === 'empty' ? (
        <Panel className="claim-center-page__empty">
          <p>No eligible private payouts were found for the connected wallet session.</p>
        </Panel>
      ) : null}

      {phase === 'error' && scanError ? (
        <Panel className="claim-center-page__error">
          <p role="alert">{scanError}</p>
          <p>{CLAIM_CENTER_SCAN_RECOVERY_GUIDANCE}</p>
        </Panel>
      ) : null}

      {claimError ? (
        <Panel className="claim-center-page__error">
          <p role="alert">{claimError}</p>
          <p>{CLAIM_CENTER_CLAIM_RECOVERY_GUIDANCE}</p>
        </Panel>
      ) : null}
    </section>
  );
}

export function ClaimCenterPage({
  walletLabel,
  scanClaimablePayouts = previewScanClaimablePayouts,
  claimPrivatePayout = previewClaimPrivatePayout,
}: ClaimCenterPageProps) {
  const wallet = useWallet();

  if (wallet.status === 'initializing') {
    return (
      <section className="claim-center-page">
        <Panel className="claim-center-page__hero">
          <Badge className="page-eyebrow" variant="accent">
            Claim Flow
          </Badge>
          <h1 className="page-title">Claim Center</h1>
          <p className="page-description">
            Check wallet readiness before scanning for claimable private payouts.
          </p>
        </Panel>
        <Panel className="claim-center-page__status">
          <p>Checking wallet connection before scanning claimable payouts.</p>
        </Panel>
      </section>
    );
  }

  if (!wallet.isSupportedNetwork) {
    return (
      <section className="claim-center-page">
        <Panel className="claim-center-page__hero">
          <Badge className="page-eyebrow" variant="accent">
            Claim Flow
          </Badge>
          <h1 className="page-title">Claim Center</h1>
          <p className="page-description">
            Supported networks are required before scanning for claimable payouts.
          </p>
          <div className="claim-center-page__badges" aria-label="Claim center meta">
            <Badge>{wallet.networkLabel}</Badge>
            <Badge>Setup needed</Badge>
          </div>
        </Panel>
        <Panel className="claim-center-page__status">
          <p>Switch to Solana Devnet or Mainnet to scan claimable payouts.</p>
        </Panel>
      </section>
    );
  }

  if (wallet.status === 'disconnected' || wallet.status === 'error') {
    return (
      <section className="claim-center-page">
        <Panel className="claim-center-page__hero">
          <Badge className="page-eyebrow" variant="accent">
            Claim Flow
          </Badge>
          <h1 className="page-title">Claim Center</h1>
          <p className="page-description">
            Connect a supported wallet to enter the claim-oriented payout flow.
          </p>
        </Panel>
        <Panel className="claim-center-page__status">
          {wallet.status === 'error' ? <p role="alert">{WALLET_CONNECTION_ERROR_MESSAGE}</p> : null}
          <button type="button" onClick={wallet.connect}>
            Connect wallet
          </button>
          <p>Connect a supported wallet to preview the wallet-scoped claim flow within the current demo boundary.</p>
        </Panel>
      </section>
    );
  }

  return (
    <ClaimCenterPageContent
      key={`${wallet.status}:${wallet.network}:${wallet.connectionVersion}`}
      networkLabel={wallet.networkLabel}
      walletLabel={walletLabel ?? CLAIM_CENTER_WALLET_LABEL}
      scanClaimablePayouts={scanClaimablePayouts}
      claimPrivatePayout={claimPrivatePayout}
    />
  );
}
