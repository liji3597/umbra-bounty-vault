import Link from 'next/link';

import { Badge } from '@/components/ui/Badge';
import { Panel } from '@/components/ui/Panel';
import type { AppRoute } from '@/lib/routes';
import { APP_NAV_ROUTES, MARKETING_ROUTE, getAppRoute } from '@/lib/routes';

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

interface LandingLifecycleItem {
  href: string;
  title: string;
  description: string;
  points: [string, string];
}

interface LandingAudienceItem {
  title: string;
  description: string;
  note: string;
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
const DASHBOARD_ROUTE = getAppRoute('/app/dashboard');

const LANDING_LIFECYCLE: LandingLifecycleItem[] = [
  {
    href: CREATE_PAYOUT_ROUTE.href,
    title: '1. Create Payout',
    description:
      'Set up a private bounty, grant, or contributor reward with a review-first flow that frames the transfer as an intentional reward action.',
    points: ['Structured review', 'Wallet-native issuance'],
  },
  {
    href: CLAIM_CENTER_ROUTE.href,
    title: '2. Recipient Claim',
    description:
      'Give the recipient a deliberate claim surface to discover eligibility, verify readiness, and execute the claim without inbox-like confusion.',
    points: ['Discovery states', 'Recipient-safe execution'],
  },
  {
    href: DISCLOSURE_ROUTE.href,
    title: '3. Scoped Disclosure',
    description:
      'Reveal only the proof a sponsor, reviewer, or operator actually needs instead of exposing the full reward relationship by default.',
    points: ['Bounded verification', 'Sponsor-ready proof'],
  },
  {
    href: ACTIVITY_ROUTE.href,
    title: '4. Activity Trail',
    description:
      'Tie payout creation, claim completion, and disclosure readiness into one coherent lifecycle so the product feels like a workflow, not a primitive.',
    points: ['Lifecycle narrative', 'High-signal history'],
  },
];

const LANDING_AUDIENCES: LandingAudienceItem[] = [
  {
    title: 'For bounty managers',
    description:
      'Issue private rewards without turning contributor relationships and payout patterns into a public artifact.',
    note: 'Private reward distribution',
  },
  {
    title: 'For recipients',
    description:
      'Claim through a wallet-native flow that explains what is happening, what is private, and what comes next.',
    note: 'Recipient-safe claim flow',
  },
  {
    title: 'For sponsors and reviewers',
    description:
      'Open a bounded disclosure view when verification is needed, without re-framing the app as a public audit dashboard.',
    note: 'Controlled verification',
  },
];

const DASHBOARD_DISCLOSURES: DashboardDisclosure[] = [
  {
    title: 'Judge review packet',
    detail: 'Verification-ready • scoped recipient proof',
    artifact: 'Open judge review packet',
  },
  {
    title: 'Bounty completion proof',
    detail: 'Partial disclosure • sponsor-visible summary',
    artifact: 'Open bounty completion proof',
  },
];

const DASHBOARD_PATH: DashboardPathItem[] = [
  {
    href: CREATE_PAYOUT_ROUTE.href,
    title: 'Create payout',
    step: 'Step 1',
    description: 'Prepare a private bounty, grant, or contributor reward with a guided review step.',
    action: 'Start payout',
  },
  {
    href: CLAIM_CENTER_ROUTE.href,
    title: 'Claim center',
    step: 'Step 2',
    description: 'Scan as the recipient, confirm eligibility, and execute the claim from the app shell.',
    action: 'Process claims',
  },
  {
    href: DISCLOSURE_ROUTE.href,
    title: 'Disclosure',
    step: 'Step 3',
    description: 'Show a bounded proof view when a sponsor or reviewer asks for verification.',
    action: 'Review disclosure',
  },
];

const DASHBOARD_ACTIVITY: DashboardActivityItem[] = [
  {
    title: 'Payout drafted for a contributor bounty',
    detail: 'Review-first reward setup with scoped disclosure defaults.',
    time: 'Just now',
  },
  {
    title: 'Recipient claim path prepared',
    detail: 'Claim center is ready to scan on the connected wallet session.',
    time: 'Next action',
  },
  {
    title: 'Disclosure view staged for sponsor review',
    detail: 'Verification stays bounded to proof, amount context, and payout summary.',
    time: 'After claim',
  },
];

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

export function LandingPlaceholder() {
  return (
    <main className="landing-page">
      <header className="landing-page__topbar">
        <div className="landing-page__masthead">
          <span aria-hidden="true" className="landing-page__menu-mark">
            ≡
          </span>
          <p className="landing-page__brand">Umbra Bounty Vault</p>
          <p className="landing-page__lock-state">Sponsor-track demo</p>
        </div>
        <nav aria-label="Marketing navigation" className="landing-page__topnav">
          {APP_NAV_ROUTES.map((route) => (
            <Link key={route.href} href={route.href}>
              {route.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="landing-page__hero" aria-labelledby="landing-hero-title">
        <div className="landing-page__hero-copy">
          <Badge className="landing-page__hero-badge" variant="accent">
            {MARKETING_ROUTE.title}
          </Badge>
          <h1 className="landing-page__hero-title" id="landing-hero-title">
            Private rewards for bounties, grants, and contributors.
            <span>Claimable payouts. Controlled disclosure.</span>
          </h1>
          <p className="landing-page__hero-lead">
            Umbra Bounty Vault turns Umbra into a wallet-native reward workflow: create a private payout, let the
            recipient claim it, and reveal only the proof a sponsor or reviewer actually needs.
          </p>
          <div className="landing-page__actions">
            <Link className="landing-page__action landing-page__action--primary" href={DASHBOARD_ROUTE.href}>
              Enter Dashboard
            </Link>
            <Link className="landing-page__text-link" href={CREATE_PAYOUT_ROUTE.href}>
              Create Payout
            </Link>
          </div>
        </div>

        <Panel className="landing-page__vault-card">
          <div className="landing-page__vault-header">
            <div>
              <p className="landing-page__vault-heading">Demo path</p>
              <p className="landing-page__vault-batch">Devnet-first private reward walkthrough</p>
            </div>
            <Badge>Ready</Badge>
          </div>
          <div className="landing-page__vault-rails" aria-hidden="true">
            {LANDING_LIFECYCLE.map((item) => (
              <div className="landing-page__vault-rail landing-page__vault-rail--active" key={item.title}>
                <span />
                <p>{item.title.replace(/^\d+\.\s*/, '')}</p>
              </div>
            ))}
          </div>
          <dl className="landing-page__vault-stats">
            <div>
              <dt>Primary use</dt>
              <dd>Private reward distribution</dd>
            </div>
            <div>
              <dt>Verification</dt>
              <dd>Scoped proof instead of full exposure</dd>
            </div>
          </dl>
        </Panel>
      </section>

      <section className="landing-page__section landing-page__section--washed" aria-labelledby="landing-life-title">
        <div className="landing-page__section-heading">
          <h2 className="landing-page__section-title" id="landing-life-title">
            One workflow, four surfaces
          </h2>
          <p className="landing-page__section-copy">
            The product story stays coherent from payout creation to recipient claim, sponsor disclosure, and lifecycle
            activity.
          </p>
        </div>
        <div className="landing-page__highlight-grid">
          {LANDING_LIFECYCLE.map((item) => (
            <Panel key={item.title} className="landing-page__highlight-card">
              <h3 className="landing-page__card-title">{item.title}</h3>
              <p className="landing-page__card-copy">{item.description}</p>
              <ul className="landing-page__point-list">
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <Link
                className="landing-page__inline-link"
                href={item.href}
              >
                Open {item.title.replace(/^\d+\.\s*/, '')}
              </Link>
            </Panel>
          ))}
        </div>
      </section>

      <section className="landing-page__editorial" aria-labelledby="landing-editorial-title">
        <p className="landing-page__editorial-kicker">Why this fits Umbra</p>
        <h2 className="landing-page__editorial-title" id="landing-editorial-title">
          The product demonstrates private reward distribution, not just a hidden transfer.
        </h2>
        <p className="landing-page__editorial-copy">
          It frames Umbra as infrastructure for contributor rewards, bounty settlements, and selective verification,
          keeping the experience understandable for operators, safe for recipients, and credible for judges.
        </p>
      </section>

      <section className="landing-page__section" aria-labelledby="landing-audience-title">
        <div className="landing-page__section-heading">
          <h2 className="landing-page__section-title" id="landing-audience-title">
            Built for managers, recipients, and reviewers
          </h2>
          <p className="landing-page__section-copy">
            Each surface reinforces the same product promise: usable privacy with explicit next steps.
          </p>
        </div>
        <div className="landing-page__workflow-grid">
          {LANDING_AUDIENCES.map((item) => (
            <Panel key={item.title} className="landing-page__workflow-card">
              <p className="landing-page__workflow-index">{item.note}</p>
              <h3 className="landing-page__card-title">{item.title}</h3>
              <p className="landing-page__card-copy">{item.description}</p>
            </Panel>
          ))}
        </div>
      </section>
    </main>
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

export function DashboardPlaceholder() {
  return (
    <section className="dashboard-page">
      <section className="dashboard-page__intro" aria-labelledby="dashboard-title">
        <div className="dashboard-page__intro-copy">
          <Badge className="dashboard-page__eyebrow" variant="accent">
            Umbra demo path
          </Badge>
          <h1 className="dashboard-page__title" id="dashboard-title">
            Action Center
          </h1>
          <p className="dashboard-page__hero-note">
            Move the live story from payout to claim to disclosure without turning reward relationships into a public
            feed.
          </p>
          <div className="dashboard-page__intro-badges" aria-label="Dashboard status highlights">
            <span className="dashboard-page__status-chip">Wallet-gated</span>
            <span className="dashboard-page__status-chip">Devnet-first</span>
            <span className="dashboard-page__status-chip">Sponsor-ready</span>
          </div>
        </div>
        <Panel className="dashboard-page__activity-surface">
          <div className="dashboard-page__activity-copy">
            <p className="dashboard-page__activity-kicker">Today&apos;s focus</p>
            <h2 className="dashboard-page__section-title">Run one complete private reward flow</h2>
            <p className="dashboard-page__activity-note">
              Open the dashboard, create a payout, claim it as the recipient, then show the bounded disclosure artifact.
            </p>
          </div>
          <Link className="dashboard-page__primary-action" href={ACTIVITY_ROUTE.href}>
            View Ledger
          </Link>
        </Panel>
      </section>

      <div className="dashboard-page__grid">
        <Panel className="dashboard-page__path-surface">
          <div className="dashboard-page__path-copy">
            <p className="dashboard-page__path-kicker">Demo path</p>
            <h2 className="dashboard-page__section-title">Follow the sponsor-track story in order</h2>
          </div>
          <ol className="dashboard-page__path-list">
            {DASHBOARD_PATH.map((item) => (
              <li className="dashboard-page__path-item" key={item.title}>
                <div className="dashboard-page__path-header">
                  <p className="dashboard-page__path-step">{item.step}</p>
                  <h3 className="dashboard-page__path-title">{item.title}</h3>
                </div>
                <p className="dashboard-page__path-description">{item.description}</p>
                <Link className="dashboard-page__path-link" href={item.href}>
                  {item.action}
                </Link>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel className="dashboard-page__claim-surface">
          <div className="dashboard-page__claim-copy">
            <h2 className="dashboard-page__section-title">Claim queue</h2>
            <div className="dashboard-page__claim-stat">
              <div>
                <p className="dashboard-page__claim-label">Pending claims</p>
                <p className="dashboard-page__claim-note">One recipient walkthrough is enough for the demo path.</p>
              </div>
              <span className="dashboard-page__claim-count">1</span>
            </div>
          </div>
          <Link className="dashboard-page__claim-action" href={CLAIM_CENTER_ROUTE.href}>
            Process claims
          </Link>
        </Panel>

        <Panel className="dashboard-page__disclosure-surface">
          <div className="dashboard-page__disclosure-header">
            <h2 className="dashboard-page__section-title">Disclosure queue</h2>
            <Link className="dashboard-page__archive-link" href={DISCLOSURE_ROUTE.href}>
              Review disclosure
            </Link>
          </div>
          <div className="dashboard-page__disclosure-list">
            {DASHBOARD_DISCLOSURES.map((item) => (
              <div className="dashboard-page__disclosure-item" key={item.title}>
                <div className="dashboard-page__disclosure-icon" aria-hidden="true">
                  {item.title.startsWith('Judge') ? '◫' : '◪'}
                </div>
                <div className="dashboard-page__disclosure-copy">
                  <p className="dashboard-page__disclosure-title">{item.title}</p>
                  <p className="dashboard-page__disclosure-detail">{item.detail}</p>
                </div>
                <Link
                  className="dashboard-page__disclosure-link"
                  href={DISCLOSURE_ROUTE.href}
                >
                  {item.artifact}
                </Link>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="dashboard-page__activity-surface dashboard-page__activity-surface--timeline">
          <div className="dashboard-page__activity-copy">
            <p className="dashboard-page__activity-kicker">Recent activity</p>
            <h2 className="dashboard-page__section-title">Keep the lifecycle readable</h2>
          </div>
          <div className="dashboard-page__activity-list">
            {DASHBOARD_ACTIVITY.map((item) => (
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
