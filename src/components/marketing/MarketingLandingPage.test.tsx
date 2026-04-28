import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MarketingLandingPage } from './MarketingLandingPage';

describe('MarketingLandingPage', () => {
  it('renders the stitch-aligned landing page with core navigation and ctas', () => {
    render(<MarketingLandingPage />);

    expect(screen.getByRole('heading', { name: /Composed reward distribution\./i })).toBeInTheDocument();
    expect(screen.getByText(/A private workflow for payout creation, recipient claiming, and bounded disclosure/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Enter Dashboard' })).toHaveAttribute('href', '/app/dashboard');
    const createPayoutLinks = screen.getAllByRole('link', { name: 'Create Payout' });
    expect(createPayoutLinks).toHaveLength(2);
    expect(createPayoutLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app/payouts/new',
      '/app/payouts/new',
    ]);

    const marketingNavigation = screen.getByRole('navigation', { name: 'Marketing navigation' });
    const navigationLinks = within(marketingNavigation).getAllByRole('link');

    expect(navigationLinks.map((link) => link.textContent)).toEqual([
      'Dashboard',
      'Create Payout',
      'Claim Center',
      'Disclosure',
      'Activity',
    ]);

    expect(screen.getByRole('heading', { name: 'The reward lifecycle' })).toBeInTheDocument();
    expect(screen.getByText('1. Private payout creation')).toBeInTheDocument();
    expect(screen.getByText('2. Claimable recipient flow')).toBeInTheDocument();
    expect(screen.getByText('3. Controlled disclosure')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /1\. Private payout creation[\s\S]*Open Create Payout/i })).toHaveAttribute(
      'href',
      '/app/payouts/new',
    );
    expect(screen.getByRole('link', { name: /2\. Claimable recipient flow[\s\S]*Open Claim Center/i })).toHaveAttribute(
      'href',
      '/app/claim',
    );
    expect(screen.getByRole('link', { name: /3\. Controlled disclosure[\s\S]*Review Disclosure/i })).toHaveAttribute(
      'href',
      '/app/disclosure',
    );

    expect(screen.getByRole('heading', { name: /Privacy is not garnish for reward distribution/i })).toBeInTheDocument();
    expect(screen.getByText(/Umbra Bounty Vault reconciles operational usability with private reward infrastructure/i)).toBeInTheDocument();
  });
});
