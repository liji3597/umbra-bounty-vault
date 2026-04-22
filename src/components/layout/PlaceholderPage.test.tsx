import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AppPlaceholder, DashboardPlaceholder, LandingPlaceholder, PlaceholderPage } from './PlaceholderPage';

describe('PlaceholderPage', () => {
  it('renders the landing entry surface with required workflow links', () => {
    render(<LandingPlaceholder />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /Private rewards for bounties, grants, and contributors/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Umbra Bounty Vault turns Umbra into a wallet-native reward workflow/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enter Dashboard' })).toHaveAttribute('href', '/app/dashboard');

    const createPayoutLinks = screen.getAllByRole('link', { name: 'Create Payout' });
    expect(createPayoutLinks).toHaveLength(2);
    expect(createPayoutLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app/payouts/new',
      '/app/payouts/new',
    ]);

    expect(screen.getByRole('heading', { name: 'One workflow, four surfaces' })).toBeInTheDocument();
    expect(screen.getByText('1. Create Payout')).toBeInTheDocument();
    expect(screen.getByText('2. Recipient Claim')).toBeInTheDocument();
    expect(screen.getByText('3. Scoped Disclosure')).toBeInTheDocument();
    expect(screen.getByText('4. Activity Trail')).toBeInTheDocument();

    const marketingNavigation = screen.getByRole('navigation', { name: 'Marketing navigation' });
    const navigationLinks = within(marketingNavigation).getAllByRole('link');

    expect(navigationLinks).toHaveLength(5);
    expect(navigationLinks.map((link) => link.textContent)).toEqual([
      'Dashboard',
      'Create Payout',
      'Claim Center',
      'Disclosure',
      'Activity',
    ]);

    expect(screen.getByRole('link', { name: 'Open Create Payout' })).toHaveAttribute('href', '/app/payouts/new');
    expect(screen.getByRole('link', { name: 'Open Recipient Claim' })).toHaveAttribute('href', '/app/claim');
    expect(screen.getByRole('link', { name: 'Open Scoped Disclosure' })).toHaveAttribute('href', '/app/disclosure');
    expect(screen.getByRole('link', { name: 'Open Activity Trail' })).toHaveAttribute('href', '/app/activity');
  });

  it('renders the dashboard overview surface with core actions and disclosure items', () => {
    render(<DashboardPlaceholder />);

    expect(screen.getByRole('heading', { name: 'Action Center' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View Ledger' })).toHaveAttribute('href', '/app/activity');
    expect(screen.getByText('Create payout')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start payout' })).toHaveAttribute('href', '/app/payouts/new');

    const processClaimsLinks = screen.getAllByRole('link', { name: 'Process claims' });
    expect(processClaimsLinks).toHaveLength(2);
    expect(processClaimsLinks.map((link) => link.getAttribute('href'))).toEqual(['/app/claim', '/app/claim']);

    const reviewDisclosureLinks = screen.getAllByRole('link', { name: 'Review disclosure' });
    expect(reviewDisclosureLinks).toHaveLength(2);
    expect(reviewDisclosureLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/app/disclosure',
      '/app/disclosure',
    ]);

    expect(screen.getByText('Judge review packet')).toBeInTheDocument();
    expect(screen.getByText('Bounty completion proof')).toBeInTheDocument();
    expect(screen.getByText('Keep the lifecycle readable')).toBeInTheDocument();
  });

  it('renders app placeholder route content and metadata', () => {
    render(
      <AppPlaceholder
        route={{
          href: '/app/activity',
          label: 'Activity',
          title: 'Activity',
          description: 'Follow payout creation, claim progress, and disclosure events.',
        }}
      />,
    );

    expect(screen.getByText('App Surface')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Activity' })).toBeInTheDocument();
    expect(screen.getByText('Follow payout creation, claim progress, and disclosure events.')).toBeInTheDocument();
    expect(screen.getByText('Current phase')).toBeInTheDocument();
    expect(screen.getByText('P2 App Shell & Infrastructure')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Placeholder surface ready for feature implementation.')).toBeInTheDocument();
  });

  it('supports duplicate metadata labels without React key warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <PlaceholderPage
          eyebrow="App Surface"
          title="Dashboard"
          description="Track private payout progress and reward lifecycle status."
          meta={[
            { label: 'Status', value: 'Ready for implementation.' },
            { label: 'Status', value: 'Awaiting integration.' },
          ]}
        />,
      );

      expect(screen.getByText('Ready for implementation.')).toBeInTheDocument();
      expect(screen.getByText('Awaiting integration.')).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('supports fully duplicated metadata items without React key warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <PlaceholderPage
          eyebrow="App Surface"
          title="Dashboard"
          description="Track private payout progress and reward lifecycle status."
          meta={[
            { label: 'Status', value: 'Ready for implementation.' },
            { label: 'Status', value: 'Ready for implementation.' },
          ]}
        />,
      );

      const metaValues = screen.getAllByText('Ready for implementation.');

      expect(metaValues).toHaveLength(2);
      expect(metaValues.map((element) => element.textContent)).toEqual([
        'Ready for implementation.',
        'Ready for implementation.',
      ]);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  it('uses collision-safe keys for metadata items', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      render(
        <PlaceholderPage
          eyebrow="App Surface"
          title="Dashboard"
          description="Track private payout progress and reward lifecycle status."
          meta={[
            { label: 'a-b', value: 'c' },
            { label: 'a', value: 'b-c' },
          ]}
        />,
      );

      expect(screen.getByText('c')).toBeInTheDocument();
      expect(screen.getByText('b-c')).toBeInTheDocument();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
