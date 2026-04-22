import Link from 'next/link';
import type { ReactNode } from 'react';

import { APP_NAV_ROUTES } from '@/lib/routes';

import { WalletStatusPanel } from './WalletStatusPanel';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand-row">
          <span aria-hidden="true" className="app-shell__menu-mark">
            ≡
          </span>
          <div>
            <p className="app-shell__eyebrow">The Ledger</p>
            <p className="app-shell__title">Privacy-first reward workflow</p>
          </div>
        </div>
        <div className="app-shell__wallet-slot">
          <WalletStatusPanel />
        </div>
      </header>
      <div className="app-shell__body">
        <nav aria-label="Primary navigation" className="app-shell__nav">
          <ul>
            {APP_NAV_ROUTES.map((route) => (
              <li key={route.href}>
                <Link href={route.href}>{route.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  );
}
