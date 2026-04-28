'use client';

import Link from 'next/link';

import type { DisclosureLevel } from '@/features/payout/schema';
import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import type { AppRoute } from '@/lib/routes';
import { getAppRoute } from '@/lib/routes';
import { useWallet } from '@/providers/WalletProvider';

function buildPageMeta(label: string, value: string) {
  return { label, value };
}

function getMetaKey(label: string, value: string, index: number): string {
  return JSON.stringify([label, value, index]);
}

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  meta: Array<{
    label: string;
    value: string;
  }>;
}

interface DashboardDisclosure {
  title: string;
  detail: string;
  artifact: string;
}

interface DashboardPathItem {
  href: string;
  title: string;
  step: string;
  description: string;
  action: string;
}

interface DashboardActivityItem {
  title: string;
  detail: string;
  time: string;
}

const CREATE_PAYOUT_ROUTE = getAppRoute('/app/payouts/new');
const CLAIM_CENTER_ROUTE = getAppRoute('/app/claim');
const DISCLOSURE_ROUTE = getAppRoute('/app/disclosure');
const ACTIVITY_ROUTE = getAppRoute('/app/activity');

const DASHBOARD_PATH: DashboardPathItem[] = [
  {
    href: CREATE_PAYOUT_ROUTE.href,
    title: 'Create payout',
    step: 'Step 1',
    description: 'Prepare a private reward with a guided review step and a single-asset devnet-first boundary.',
    action: 'Create payout',
  },
  {
    href: CLAIM_CENTER_ROUTE.href,
    title: 'Claim center',
    step: 'Step 2',
    description: 'Scan as the recipient, confirm eligibility, and execute the claim from the connected wallet session.',
    action: 'Open claim center',
  },
  {
    href: DISCLOSURE_ROUTE.href,
    title: 'Disclosure',
    step: 'Step 3',
    description: 'Review a bounded verification view when a sponsor or reviewer asks for limited proof.',
    action: 'Review disclosure',
  },
  {
    href: ACTIVITY_ROUTE.href,
    title: 'Activity',
    step: 'Step 4',
    description: 'Close the narrative with a wallet-scoped lifecycle view across payout, claim, and disclosure.',
    action: 'Review activity',
  },
];

function getDisclosureStatusTitle(level: DisclosureLevel): string {
  switch (level) {
    case 'verification-ready':
      return 'Judge review packet';
    case 'partial':
      return 'Bounty completion proof';
    case 'none':
    default:
      return 'Opaque disclosure package';
  }
}

function getDisclosureStatusDetail(level: DisclosureLevel, hasClaimResult: boolean): string {
  switch (level) {
    case 'verification-ready':
      return hasClaimResult
        ? 'Verification-ready • bounded recipient proof'
        : 'Verification-ready • staged for post-claim review';
    case 'partial':
      return hasClaimResult
        ? 'Partial disclosure • sponsor-visible summary'
        : 'Partial disclosure • prepared for linked review';
    case 'none':
    default:
      return 'No disclosure • lifecycle remains private by default';
  }
}

function getDisclosureStatusArtifact(level: DisclosureLevel): string {
  switch (level) {
    case 'verification-ready':
      return 'Open judge review packet';
    case 'partial':
      return 'Open bounty completion proof';
    case 'none':
    default:
      return 'Review bounded disclosure';
  }
}

function getDashboardDisclosures(wallet: ReturnType<typeof useWallet>): DashboardDisclosure[] {
  const disclosureLevel = wallet.demoFlowSession?.draft.disclosureLevel;

  if (!disclosureLevel) {
    return [
      {
        title: 'Disclosure queue is empty',
        detail: 'Create a payout to stage a bounded verification package for the current wallet session.',
        artifact: 'Open disclosure workspace',
      },
    ];
  }

  return [
    {
      title: getDisclosureStatusTitle(disclosureLevel),
      detail: getDisclosureStatusDetail(disclosureLevel, wallet.demoFlowSession?.claimResult !== null),
      artifact: getDisclosureStatusArtifact(disclosureLevel),
    },
  ];
}

function getDashboardActivity(wallet: ReturnType<typeof useWallet>): DashboardActivityItem[] {
  if (!wallet.demoFlowSession) {
    return [
      {
        title: 'No payout session is active yet',
        detail: 'Start in Create Payout to seed one linked wallet-scoped narrative across the app.',
        time: 'Step 1',
      },
      {
        title: 'Claim center waits for an eligible session',
        detail: 'Connected recipients can scan for a linked claim once a payout has been created.',
        time: 'Step 2',
      },
      {
        title: 'Disclosure and activity stay live-aware',
        detail: 'These pages remain honest about current session state instead of showing fabricated live protocol closure.',
        time: 'Steps 3–4',
      },
    ];
  }

  return [
    {
      title: 'Payout session is active',
      detail: `Payout ${wallet.demoFlowSession.payout.payoutId} is recorded for the current wallet session on ${wallet.networkLabel}.`,
      time: 'Step 1',
    },
    {
      title: wallet.demoFlowSession.claimResult ? 'Claim has been recorded' : 'Claim remains available',
      detail: wallet.demoFlowSession.claimResult
        ? `Claim status: ${wallet.demoFlowSession.claimResult.claimStatus}.`
        : 'Claim center can continue the linked recipient walkthrough for this payout session.',
      time: 'Step 2',
    },
    {
      title: 'Disclosure and activity remain bounded',
      detail: `Disclosure level: ${wallet.demoFlowSession.draft.disclosureLevel}. Activity stays wallet-scoped and live-aware.`,
      time: 'Steps 3–4',
    },
  ];
}

function getClaimCount(wallet: ReturnType<typeof useWallet>): string {
  if (!wallet.demoFlowSession) {
    return '0';
  }

  return wallet.demoFlowSession.claimResult ? '0' : '1';
}

function getClaimLabel(wallet: ReturnType<typeof useWallet>): string {
  if (!wallet.demoFlowSession) {
    return 'No linked payout session';
  }

  if (wallet.demoFlowSession.claimResult) {
    return 'Claim recorded for current session';
  }

  return 'Claimable payout in current session';
}

function getClaimNote(wallet: ReturnType<typeof useWallet>): string {
  if (wallet.status !== 'connected') {
    return 'Connect a wallet to begin the claim-oriented Phase 1 walkthrough.';
  }

  if (!wallet.isSupportedNetwork) {
    return 'Switch to a supported network before using claim, disclosure, or activity surfaces.';
  }

  if (!wallet.demoFlowSession) {
    return 'Create one payout first to activate the linked recipient walkthrough.';
  }

  if (wallet.demoFlowSession.claimResult) {
    return 'Claim center has already recorded the linked claim for this wallet-scoped narrative.';
  }

  return 'One linked recipient walkthrough is enough to tell the Phase 1 demo story.';
}

function getHeroNote(wallet: ReturnType<typeof useWallet>): string {
  if (wallet.status !== 'connected') {
    return 'Connect a wallet, then move through create payout, claim, disclosure, and activity as one coherent reward flow.';
  }

  if (!wallet.isSupportedNetwork) {
    return 'This workflow stays wallet-scoped, but claim, disclosure, and activity require a supported network before continuing.';
  }

  if (!wallet.demoFlowSession) {
    return 'The connected wallet session is ready for one coherent reward flow: create a payout, then carry its linked narrative into claim, disclosure, and activity.';
  }

  return `The connected wallet session is carrying payout ${wallet.demoFlowSession.payout.payoutId} through claim, disclosure, and activity.`;
}

function getFocusTitle(wallet: ReturnType<typeof useWallet>): string {
  if (!wallet.demoFlowSession) {
    return 'Start the smallest claim-oriented payout narrative';
  }

  if (!wallet.demoFlowSession.claimResult) {
    return 'Continue the linked claim walkthrough';
  }

  return 'Review the bounded post-claim narrative';
}

function getFocusNote(wallet: ReturnType<typeof useWallet>): string {
  if (wallet.status !== 'connected') {
    return 'This dashboard becomes live-aware once a wallet is connected and a payout session is created.';
  }

  if (!wallet.isSupportedNetwork) {
    return 'The dashboard keeps current state visible, but protected actions still require a supported network.';
  }

  if (!wallet.demoFlowSession) {
    return 'Create Payout provides the real devnet anchor for this Phase 1 flow; claim, disclosure, and activity then follow the same wallet session.';
  }

  if (!wallet.demoFlowSession.claimResult) {
    return 'The payout session is active. Claim center, disclosure, and activity now stay aligned to this same wallet-scoped narrative.';
  }

  return 'This dashboard keeps next actions obvious without claiming a full live claim backend or indexer stack.';
}

function getPrimaryAction(wallet: ReturnType<typeof useWallet>): { href: string; label: string } {
  if (wallet.status !== 'connected' || !wallet.isSupportedNetwork) {
    return { href: CREATE_PAYOUT_ROUTE.href, label: 'Start with payout' };
  }

  if (!wallet.demoFlowSession) {
    return { href: CREATE_PAYOUT_ROUTE.href, label: 'Start with payout' };
  }

  if (!wallet.demoFlowSession.claimResult) {
    return { href: CLAIM_CENTER_ROUTE.href, label: 'Continue to claim center' };
  }

  return { href: ACTIVITY_ROUTE.href, label: 'Review activity' };
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  meta,
}: PlaceholderPageProps) {
  return (
    <section className="page-frame">
      <Panel className="page-card">
        <Badge className="page-eyebrow" variant="accent">
          {eyebrow}
        </Badge>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </Panel>
      <div className="page-meta-grid">
        {meta.map((item, index) => (
          <Panel
            className="page-meta-card"
            key={getMetaKey(item.label, item.value, index)}
            heading={item.label}
          >
            <p className="page-meta-value">{item.value}</p>
          </Panel>
        ))}
      </div>
    </section>
  );
}

interface AppPlaceholderProps {
  route: AppRoute;
}

export function AppPlaceholder({ route }: AppPlaceholderProps) {
  return (
    <PlaceholderPage
      eyebrow="App Surface"
      title={route.title}
      description={route.description}
      meta={[
        buildPageMeta('Current phase', 'P2 App Shell & Infrastructure'),
        buildPageMeta('Status', 'Placeholder surface ready for feature implementation.'),
      ]}
    />
  );
}

export function DashboardPageOverview() {
  const wallet = useWallet();
  const primaryAction = getPrimaryAction(wallet);
  const dashboardDisclosures = getDashboardDisclosures(wallet);
  const dashboardActivity = getDashboardActivity(wallet);

  return (
    <section className="dashboard-page">
      <section className="dashboard-page__intro" aria-labelledby="dashboard-title">
        <div className="dashboard-page__intro-copy">
          <Badge className="dashboard-page__eyebrow" variant="accent">
            Workflow overview
          </Badge>
          <h1 className="dashboard-page__title" id="dashboard-title">
            Dashboard
          </h1>
          <p className="dashboard-page__hero-note">{getHeroNote(wallet)}</p>
          <div className="dashboard-page__intro-badges" aria-label="Dashboard status highlights">
            <span className="dashboard-page__status-chip">A2-leaning</span>
            <span className="dashboard-page__status-chip">{wallet.networkLabel}</span>
            <span className="dashboard-page__status-chip">Single-asset</span>
          </div>
        </div>
        <Panel className="dashboard-page__activity-surface">
          <div className="dashboard-page__activity-copy">
            <p className="dashboard-page__activity-kicker">Current focus</p>
            <h2 className="dashboard-page__section-title">{getFocusTitle(wallet)}</h2>
            <p className="dashboard-page__activity-note">{getFocusNote(wallet)}</p>
          </div>
          <Link className="dashboard-page__primary-action" href={primaryAction.href}>
            {primaryAction.label}
          </Link>
        </Panel>
      </section>

      <div className="dashboard-page__grid">
        <Panel className="dashboard-page__path-surface">
          <div className="dashboard-page__path-copy">
            <p className="dashboard-page__path-kicker">Workflow path</p>
            <h2 className="dashboard-page__section-title">Follow the reward lifecycle in order</h2>
          </div>
          <ol className="dashboard-page__path-list">
            {DASHBOARD_PATH.map((item) => (
              <li key={item.title}>
                <Link className="dashboard-page__path-item" href={item.href}>
                  <div className="dashboard-page__path-header">
                    <p className="dashboard-page__path-step">{item.step}</p>
                    <h3 className="dashboard-page__path-title">{item.title}</h3>
                  </div>
                  <p className="dashboard-page__path-description">{item.description}</p>
                  <span className="dashboard-page__path-link">{item.action}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel className="dashboard-page__claim-surface">
          <div className="dashboard-page__claim-copy">
            <h2 className="dashboard-page__section-title">Claim status</h2>
            <div className="dashboard-page__claim-stat">
              <div>
                <p className="dashboard-page__claim-label">{getClaimLabel(wallet)}</p>
                <p className="dashboard-page__claim-note">{getClaimNote(wallet)}</p>
              </div>
              <span className="dashboard-page__claim-count">{getClaimCount(wallet)}</span>
            </div>
          </div>
          <Link className="dashboard-page__claim-action" href={CLAIM_CENTER_ROUTE.href}>
            Open claim center
          </Link>
        </Panel>

        <Panel className="dashboard-page__disclosure-surface">
          <div className="dashboard-page__disclosure-header">
            <h2 className="dashboard-page__section-title">Disclosure status</h2>
            <Link className="dashboard-page__archive-link" href={DISCLOSURE_ROUTE.href}>
              Review disclosure
            </Link>
          </div>
          <div className="dashboard-page__disclosure-list">
            {dashboardDisclosures.map((item) => (
              <Link className="dashboard-page__disclosure-item" href={DISCLOSURE_ROUTE.href} key={item.title}>
                <div className="dashboard-page__disclosure-icon" aria-hidden="true">
                  {item.title.startsWith('Judge') ? '◫' : '◪'}
                </div>
                <div className="dashboard-page__disclosure-copy">
                  <p className="dashboard-page__disclosure-title">{item.title}</p>
                  <p className="dashboard-page__disclosure-detail">{item.detail}</p>
                </div>
                <span className="dashboard-page__disclosure-link">{item.artifact}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel className="dashboard-page__activity-surface dashboard-page__activity-surface--timeline">
          <div className="dashboard-page__activity-copy">
            <p className="dashboard-page__activity-kicker">Lifecycle readiness</p>
            <h2 className="dashboard-page__section-title">Keep the reward story readable</h2>
          </div>
          <div className="dashboard-page__activity-list">
            {dashboardActivity.map((item) => (
              <div className="dashboard-page__activity-item" key={item.title}>
                <div>
                  <p className="dashboard-page__activity-title">{item.title}</p>
                  <p className="dashboard-page__activity-note">{item.detail}</p>
                </div>
                <p className="dashboard-page__activity-time">{item.time}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </section>
  );
}
