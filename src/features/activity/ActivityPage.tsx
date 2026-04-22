'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge, Panel } from '@/components/ui';
import { MARKETING_ROUTE, getAppRoute } from '@/lib/routes';
import type { ClaimPrivatePayoutResult, ClaimablePayout } from '@/features/claim/schema';
import type { DisclosureView } from '@/features/disclosure/schema';
import type { CreatePrivatePayoutResult } from '@/features/payout/schema';

export interface ActivityNarrative {
  payout: CreatePrivatePayoutResult;
  claimablePayouts: ClaimablePayout[];
  claimResult: ClaimPrivatePayoutResult | null;
  disclosureView: DisclosureView;
}

export type LoadActivityNarrative = () => Promise<ActivityNarrative>;

interface ActivityPageProps {
  loadActivityNarrative: LoadActivityNarrative;
}

type ActivityPagePhase = 'loading' | 'success' | 'error';

interface ActivityTimelineItem {
  title: string;
  description?: string;
  body: string[];
}

const ACTIVITY_LOAD_ERROR_MESSAGE = 'Activity narrative could not be loaded.';
const ACTIVITY_INTEGRITY_ERROR_MESSAGE =
  'Activity narrative is inconsistent across payout, claim, and disclosure steps.';
const CREATE_PAYOUT_ROUTE = getAppRoute('/app/payouts/new');

function getPhaseLabel(phase: ActivityPagePhase): string {
  switch (phase) {
    case 'success':
      return 'Ready';
    case 'error':
      return 'Unavailable';
    case 'loading':
    default:
      return 'Loading';
  }
}

function getClaimablePayoutSummary(
  payoutId: string,
  claimablePayouts: ClaimablePayout[],
): string {
  const matchingClaimablePayout = claimablePayouts.find(
    (claimablePayout) =>
      claimablePayout.payoutId === payoutId && claimablePayout.claimStatus === 'claimable',
  );

  if (!matchingClaimablePayout) {
    return 'No claimable payouts are queued in this preview narrative.';
  }

  return `${matchingClaimablePayout.senderLabel} · ${matchingClaimablePayout.amount} ${matchingClaimablePayout.tokenSymbol}`;
}

function isConsistentNarrative(narrative: ActivityNarrative): boolean {
  return (
    (narrative.claimResult === null || narrative.claimResult.payoutId === narrative.payout.payoutId) &&
    narrative.disclosureView.payoutId === narrative.payout.payoutId
  );
}

function getDisclosureFieldsSummary(disclosureView: DisclosureView): string {
  return disclosureView.revealedFields.length > 0
    ? `Revealed fields: ${disclosureView.revealedFields.join(', ')}`
    : 'Revealed fields: none';
}

function getDisclosureArtifactsSummary(disclosureView: DisclosureView): string {
  return disclosureView.verificationArtifacts.length > 0
    ? `Artifacts: ${disclosureView.verificationArtifacts.join(', ')}`
    : 'Artifacts: none';
}

function getNarrativeErrorMessage(narrative: ActivityNarrative): string | null {
  return isConsistentNarrative(narrative) ? null : ACTIVITY_INTEGRITY_ERROR_MESSAGE;
}

function buildTimelineItems(narrative: ActivityNarrative): ActivityTimelineItem[] {
  const claimTimelineItem = narrative.claimResult
    ? {
        title: 'Recipient claim completed',
        body: [
          `Claim result: ${narrative.claimResult.claimStatus}`,
          `Transaction: ${narrative.claimResult.transactionHash}`,
        ],
      }
    : {
        title: 'Recipient claim pending',
        body: ['Claim result: claimable', 'Transaction: awaiting recipient claim'],
      };

  return [
    {
      title: 'Preview payout submitted',
      description: 'Private payout is prepared through the typed preview service boundary.',
      body: [
        `Reference: ${narrative.payout.payoutId}`,
        `Transaction: ${narrative.payout.transactionHash}`,
      ],
    },
    {
      title: 'Claim window opened',
      body: [getClaimablePayoutSummary(narrative.payout.payoutId, narrative.claimablePayouts)],
    },
    claimTimelineItem,
    {
      title: 'Disclosure package ready',
      description: narrative.disclosureView.summary,
      body: [
        narrative.disclosureView.title,
        getDisclosureFieldsSummary(narrative.disclosureView),
        getDisclosureArtifactsSummary(narrative.disclosureView),
      ],
    },
  ];
}

export function ActivityPage({ loadActivityNarrative }: ActivityPageProps) {
  const [phase, setPhase] = useState<ActivityPagePhase>('loading');
  const [narrative, setNarrative] = useState<ActivityNarrative | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadNarrative() {
      setPhase('loading');
      setErrorMessage(null);

      try {
        const nextNarrative = await loadActivityNarrative();

        if (!isActive) {
          return;
        }

        const nextErrorMessage = getNarrativeErrorMessage(nextNarrative);

        if (nextErrorMessage) {
          setNarrative(null);
          setErrorMessage(nextErrorMessage);
          setPhase('error');
          return;
        }

        setNarrative(nextNarrative);
        setPhase('success');
      } catch {
        if (!isActive) {
          return;
        }

        setNarrative(null);
        setErrorMessage(ACTIVITY_LOAD_ERROR_MESSAGE);
        setPhase('error');
      }
    }

    void loadNarrative();

    return () => {
      isActive = false;
    };
  }, [loadActivityNarrative]);

  const timelineItems = narrative ? buildTimelineItems(narrative) : [];

  return (
    <section className="disclosure-page activity-page">
      <Panel className="disclosure-page__hero activity-page__hero">
        <Badge className="page-eyebrow" variant="accent">
          Activity Flow
        </Badge>
        <h1 className="page-title">Activity</h1>
        <p className="page-description">
          Follow one coherent preview narrative across payout submission, claim progress, and
          bounded disclosure output.
        </p>
        <div aria-label="Activity meta" className="disclosure-page__badges">
          <Badge>Cross-flow narrative</Badge>
          <Badge>{getPhaseLabel(phase)}</Badge>
        </div>
      </Panel>

      <div className="disclosure-page__grid activity-page__grid">
        <section aria-labelledby="activity-workflow-status-title">
          <h2 className="activity-page__section-title" id="activity-workflow-status-title">
            Workflow status
          </h2>
          <Panel
            className="disclosure-page__status activity-page__status"
            description="P6 starts with a minimal activity timeline assembled through the existing typed service boundary."
          >
            <p>
              This page links payout, claim, and disclosure preview outputs into one stable narrative
              instead of rendering isolated logs.
            </p>
          </Panel>
        </section>

        {phase === 'loading' ? (
          <Panel heading="Loading activity" role="status" aria-label="Loading activity">
            <p>Loading activity narrative.</p>
          </Panel>
        ) : null}

        {phase === 'error' ? (
          <Panel heading="Activity unavailable" role="alert" aria-label="Activity unavailable">
            <p>{errorMessage}</p>
          </Panel>
        ) : null}

        {phase === 'success' && narrative && isConsistentNarrative(narrative) ? (
          <>
            <section>
              <h2 className="activity-page__section-title" id="activity-narrative-summary-title">
                Narrative summary
              </h2>
              <Panel role="region" aria-labelledby="activity-narrative-summary-title">
                <p>Payout status: {narrative.payout.status}</p>
                <p>Claim status: {narrative.claimResult?.claimStatus ?? 'claimable'}</p>
                <p>Disclosure level: {narrative.disclosureView.level}</p>
              </Panel>
            </section>

            <section aria-labelledby="activity-lifecycle-timeline-title">
              <h2 className="activity-page__section-title" id="activity-lifecycle-timeline-title">
                Lifecycle timeline
              </h2>
              <Panel
                className="activity-page__timeline-shell"
                description="A sequenced view of payout creation, claim completion, and disclosure readiness."
              >
                <ol className="activity-page__timeline" aria-label="Lifecycle timeline">
                  {timelineItems.map((item) => (
                    <li className="activity-page__timeline-item" key={item.title}>
                      <Panel role="region" aria-label={item.title} className="activity-page__timeline-panel">
                        <div className="activity-page__timeline-marker" aria-hidden="true" />
                        <div className="activity-page__timeline-content">
                          <h3 className="activity-page__timeline-title">{item.title}</h3>
                          {item.description ? (
                            <p className="activity-page__timeline-description">{item.description}</p>
                          ) : null}
                          <div className="activity-page__timeline-body">
                            {item.body.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        </div>
                      </Panel>
                    </li>
                  ))}
                </ol>
              </Panel>
            </section>

            <Panel heading="Next action" role="region" aria-label="Next action">
              <p>Start another payout or return to the landing narrative for the next demo pass.</p>
              <ul>
                <li>
                  <Link href={CREATE_PAYOUT_ROUTE.href}>Create another payout</Link>
                </li>
                <li>
                  <Link href={MARKETING_ROUTE.href}>Return to landing</Link>
                </li>
              </ul>
            </Panel>
          </>
        ) : null}
      </div>
    </section>
  );
}
