'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Badge, Panel } from '@/components/ui';
import { getAppRoute } from '@/lib/routes';

import type { BuildDisclosureViewInput, DisclosureView } from './schema';

export type BuildDisclosureView = (
  input: BuildDisclosureViewInput,
) => Promise<DisclosureView>;

interface DisclosurePageProps {
  buildDisclosureView: BuildDisclosureView;
  defaultInput?: BuildDisclosureViewInput;
}

type DisclosurePagePhase = 'loading' | 'success' | 'error';

const PREVIEW_DISCLOSURE_INPUT: BuildDisclosureViewInput = {
  payoutId: 'preview-disclosure',
  level: 'verification-ready',
  viewerRole: 'recipient',
};

const DISCLOSURE_LOAD_ERROR_MESSAGE = 'Disclosure preview is currently unavailable.';
const DISCLOSURE_INTEGRITY_ERROR_MESSAGE = 'Disclosure preview is currently unavailable.';
const REQUESTED_DISCLOSURE_VIEW_LABEL = 'Recipient request';
const CLAIM_ROUTE = getAppRoute('/app/claim');
const ACTIVITY_ROUTE = getAppRoute('/app/activity');

function getDisclosureLabel(level: DisclosureView['level']): string {
  switch (level) {
    case 'none':
      return 'No disclosure';
    case 'partial':
      return 'Partial disclosure';
    case 'verification-ready':
    default:
      return 'Verification-ready';
  }
}

function getPhaseLabel(phase: DisclosurePagePhase): string {
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

function isConsistentDisclosureView(
  view: DisclosureView,
  requestedInput: BuildDisclosureViewInput,
): boolean {
  return view.payoutId === requestedInput.payoutId && view.level === requestedInput.level;
}

function getDisclosureErrorMessage(
  view: DisclosureView,
  requestedInput: BuildDisclosureViewInput,
): string | null {
  return isConsistentDisclosureView(view, requestedInput) ? null : DISCLOSURE_INTEGRITY_ERROR_MESSAGE;
}

export function DisclosurePage({
  buildDisclosureView,
  defaultInput = PREVIEW_DISCLOSURE_INPUT,
}: DisclosurePageProps) {
  const [phase, setPhase] = useState<DisclosurePagePhase>('loading');
  const [view, setView] = useState<DisclosureView | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadDisclosureView() {
      setPhase('loading');
      setErrorMessage(null);

      try {
        const nextView = await buildDisclosureView(defaultInput);

        if (!isActive) {
          return;
        }

        const nextErrorMessage = getDisclosureErrorMessage(nextView, defaultInput);

        if (nextErrorMessage) {
          setView(null);
          setErrorMessage(nextErrorMessage);
          setPhase('error');
          return;
        }

        setView(nextView);
        setPhase('success');
      } catch {
        if (!isActive) {
          return;
        }

        setView(null);
        setErrorMessage(DISCLOSURE_LOAD_ERROR_MESSAGE);
        setPhase('error');
      }
    }

    void loadDisclosureView();

    return () => {
      isActive = false;
    };
  }, [buildDisclosureView, defaultInput]);

  const activeLevel = view?.level ?? defaultInput.level;

  return (
    <section className="disclosure-page">
      <Panel className="disclosure-page__hero">
        <Badge className="page-eyebrow" variant="accent">
          Disclosure Flow
        </Badge>
        <h1 className="page-title">Disclosure / Verification</h1>
        <p className="page-description">
          Review a bounded disclosure package through the typed service boundary before broader
          verification wiring lands.
        </p>
        <div aria-label="Disclosure meta" className="disclosure-page__badges">
          <Badge>{getDisclosureLabel(activeLevel)}</Badge>
          <Badge>{REQUESTED_DISCLOSURE_VIEW_LABEL}</Badge>
          <Badge>{getPhaseLabel(phase)}</Badge>
        </div>
      </Panel>

      <div className="disclosure-page__grid">
        <Panel
          className="disclosure-page__status"
          heading="Workflow status"
          description="P5 starts with a real disclosure page shell backed by the existing typed service boundary."
        >
          <p>
            This preview requests a recipient verification view through the typed service boundary
            while the broader data assembly path is still pending.
          </p>
        </Panel>

        {phase === 'loading' ? (
          <Panel heading="Loading disclosure" role="status" aria-label="Loading disclosure">
            <p>Loading disclosure preview.</p>
          </Panel>
        ) : null}

        {phase === 'error' ? (
          <Panel heading="Disclosure unavailable" role="alert" aria-label="Disclosure unavailable">
            <p>{errorMessage}</p>
          </Panel>
        ) : null}

        {phase === 'success' && view && isConsistentDisclosureView(view, defaultInput) ? (
          <>
            <Panel
              heading={view.title}
              description={view.summary}
              role="region"
              aria-label="Disclosure overview"
            >
              <p>Reference: {view.payoutId}</p>
            </Panel>

            <Panel heading="Revealed fields" role="region" aria-label="Revealed fields">
              {view.revealedFields.length > 0 ? (
                <ul>
                  {view.revealedFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              ) : (
                <p>No payout fields are revealed for this disclosure level.</p>
              )}
            </Panel>

            <Panel heading="Verification artifacts" role="region" aria-label="Verification artifacts">
              {view.verificationArtifacts.length > 0 ? (
                <ul>
                  {view.verificationArtifacts.map((artifact) => (
                    <li key={artifact}>{artifact}</li>
                  ))}
                </ul>
              ) : (
                <p>No verification artifacts are required for this disclosure level.</p>
              )}
            </Panel>

            <Panel heading="Next action" role="region" aria-label="Next action">
              <p>Continue into the combined activity narrative or return to Claim Center.</p>
              <ul>
                <li>
                  <Link href={ACTIVITY_ROUTE.href}>View activity timeline</Link>
                </li>
                <li>
                  <Link href={CLAIM_ROUTE.href}>Back to claim center</Link>
                </li>
              </ul>
            </Panel>
          </>
        ) : null}
      </div>
    </section>
  );
}
