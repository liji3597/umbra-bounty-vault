import Link from 'next/link';

import { APP_NAV_ROUTES } from '@/lib/routes';

interface LifecycleItem {
  title: string;
  description: string;
  points: readonly string[];
  href: string;
  action: string;
  featured?: boolean;
}

const LIFECYCLE_ITEMS: readonly LifecycleItem[] = [
  {
    title: '1. Private payout creation',
    description:
      'Distributors create a private reward allocation with a guided review checkpoint, so the payout setup stays deliberate instead of becoming a raw transfer screen.',
    points: ['Typed reward inputs', 'Review-first routing'],
    href: '/app/payouts/new',
    action: 'Open Create Payout',
  },
  {
    title: '2. Claimable recipient flow',
    description:
      'Recipients move through a wallet-scoped claim path that keeps the payout discoverable for the intended address without turning the flow into a public ledger narrative.',
    points: ['Wallet-scoped discovery', 'Recipient-side execution'],
    href: '/app/claim',
    action: 'Open Claim Center',
    featured: true,
  },
  {
    title: '3. Controlled disclosure',
    description:
      'Sponsors and reviewers get a bounded verification view when proof is needed, while the reward relationship remains private by default.',
    points: ['Selective proof surface', 'Sponsor-ready context'],
    href: '/app/disclosure',
    action: 'Review Disclosure',
  },
] as const;

const FOOTER_LINKS = [
  {
    label: 'Disclosures',
    href: '/app/disclosure',
  },
  {
    label: 'Create Flow',
    href: '/app/payouts/new',
  },
  {
    label: 'Claim Flow',
    href: '/app/claim',
  },
  {
    label: 'Activity',
    href: '/app/activity',
  },
] as const;

export function MarketingLandingPage() {
  return (
    <div className="marketing-home">
      <header className="marketing-home__topbar">
        <div className="marketing-home__topbar-inner">
          <div className="marketing-home__brand-row">
            <span className="marketing-home__brand">Umbra Bounty Vault</span>
          </div>

          <nav aria-label="Marketing navigation" className="marketing-home__nav">
            {APP_NAV_ROUTES.map((route) => (
              <Link key={route.href} href={route.href}>
                {route.label}
              </Link>
            ))}
          </nav>

          <Link className="marketing-home__wallet-state" href="/app/dashboard">
            <span>Wallet Locked</span>
            <span aria-hidden="true">◌</span>
          </Link>
        </div>
      </header>

      <main className="marketing-home__main">
        <section className="marketing-home__hero" aria-labelledby="marketing-home-title">
          <div className="marketing-home__hero-copy">
            <h1 className="marketing-home__hero-title" id="marketing-home-title">
              Composed reward distribution.
              <span>Absolute discretion.</span>
            </h1>
            <p className="marketing-home__hero-description">
              A private workflow for payout creation, recipient claiming, and bounded disclosure.
              Designed for bounty programs, grants, and contributor rewards that need cryptographic confidence without
              turning every transfer into a public artifact.
            </p>
            <div className="marketing-home__hero-actions">
              <Link className="marketing-home__primary-action" href="/app/dashboard">
                Enter Dashboard
              </Link>
              <Link className="marketing-home__secondary-link" href="/app/payouts/new">
                Create Payout
              </Link>
            </div>
          </div>

          <div className="marketing-home__hero-visual" aria-hidden="true">
            <div className="marketing-home__visual-card">
              <div className="marketing-home__visual-header">
                <div>
                  <p className="marketing-home__visual-label">Reward batch</p>
                  <p className="marketing-home__visual-value">Umbra contributor allocation</p>
                </div>
                <span className="marketing-home__visual-glyph">◎</span>
              </div>

              <div className="marketing-home__visual-rails">
                <div className="marketing-home__visual-rail marketing-home__visual-rail--muted">
                  <span />
                  <p>Encrypted segment</p>
                </div>
                <div className="marketing-home__visual-rail marketing-home__visual-rail--active">
                  <span />
                  <p>Verified allocation</p>
                </div>
                <div className="marketing-home__visual-rail marketing-home__visual-rail--muted">
                  <span />
                  <p>Encrypted segment</p>
                </div>
              </div>

              <div className="marketing-home__visual-footer">
                <div>
                  <p className="marketing-home__visual-label">Status</p>
                  <p className="marketing-home__visual-value">Sealed &amp; immutable</p>
                </div>
                <span className="marketing-home__visual-status">Valid</span>
              </div>
            </div>
            <div className="marketing-home__hero-glow" />
          </div>
        </section>

        <section className="marketing-home__lifecycle" aria-labelledby="marketing-home-lifecycle-title">
          <div className="marketing-home__section-intro">
            <h2 className="marketing-home__section-title" id="marketing-home-lifecycle-title">
              The reward lifecycle
            </h2>
            <p className="marketing-home__section-copy">
              A deterministic path that keeps payout setup, claim execution, and verification readable without exposing
              the whole relationship by default.
            </p>
          </div>

          <div className="marketing-home__lifecycle-grid">
            {LIFECYCLE_ITEMS.map((item, index) => (
              <Link
                className={`marketing-home__lifecycle-card${item.featured ? ' marketing-home__lifecycle-card--featured' : ''}`}
                href={item.href}
                key={item.title}
              >
                <div className="marketing-home__lifecycle-icon" aria-hidden="true">
                  <span>{index + 1}</span>
                </div>
                <h3 className="marketing-home__card-title">{item.title}</h3>
                <p className="marketing-home__card-copy">{item.description}</p>
                <ul className="marketing-home__point-list">
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
                <span className="marketing-home__card-link">
                  {item.action}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="marketing-home__editorial" aria-labelledby="marketing-home-editorial-title">
          <p className="marketing-home__editorial-kicker">The philosophy</p>
          <h2 className="marketing-home__editorial-title" id="marketing-home-editorial-title">
            Privacy is not garnish for reward distribution. It is the foundational requirement.
          </h2>
          <div className="marketing-home__editorial-divider" aria-hidden="true" />
          <p className="marketing-home__editorial-copy">
            Umbra Bounty Vault reconciles operational usability with private reward infrastructure by turning the
            cryptographic path into a coherent editorial surface. Teams manage allocations, recipients claim cleanly,
            and reviewers only see the proof they actually need.
          </p>
        </section>
      </main>

      <footer className="marketing-home__footer">
        <div className="marketing-home__footer-inner">
          <p className="marketing-home__footer-copy">© 2026 Umbra Bounty Vault. Privacy by design.</p>
          <nav aria-label="Marketing footer" className="marketing-home__footer-nav">
            {FOOTER_LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
