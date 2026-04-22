import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ActivityPage, type ActivityNarrative, type LoadActivityNarrative } from './ActivityPage';

const defaultActivityNarrative = {
  payout: {
    payoutId: 'preview-mainnet-preview-wallet-1',
    transactionHash: 'preview-So111111-8',
    status: 'submitted' as const,
  },
  claimablePayouts: [
    {
      payoutId: 'preview-mainnet-preview-wallet-1',
      senderLabel: 'Umbra Treasury',
      tokenSymbol: 'USDC',
      amount: 125,
      claimStatus: 'claimable' as const,
    },
  ],
  claimResult: {
    payoutId: 'preview-mainnet-preview-wallet-1',
    claimStatus: 'claimed' as const,
    transactionHash: 'preview-claim-preview-wallet-1-preview-mainnet-preview-wallet-1',
  },
  disclosureView: {
    payoutId: 'preview-mainnet-preview-wallet-1',
    level: 'verification-ready' as const,
    title: 'Recipient verification package',
    summary: 'Bounded recipient access is available for this payout preview.',
    revealedFields: ['amount'],
    verificationArtifacts: ['network-confirmation', 'claim-window'],
  },
} satisfies ActivityNarrative;

describe('ActivityPage', () => {
  it('loads the activity narrative on mount and renders an ordered lifecycle timeline', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockResolvedValue(
      defaultActivityNarrative,
    );

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading activity narrative.');

    await waitFor(() => {
      expect(loadActivityNarrative).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByRole('heading', { name: 'Workflow status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Narrative summary' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lifecycle timeline' })).toBeInTheDocument();
    expect(screen.getByText('Preview payout submitted')).toBeInTheDocument();
    expect(screen.getByText('Claim window opened')).toBeInTheDocument();
    expect(screen.getByText('Recipient claim completed')).toBeInTheDocument();
    expect(screen.getByText('Disclosure package ready')).toBeInTheDocument();

    const timeline = screen.getByRole('list', { name: 'Lifecycle timeline' });
    const timelineItems = within(timeline).getAllByRole('listitem');

    expect(timelineItems).toHaveLength(4);
    expect(timelineItems.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Preview payout submitted',
      'Claim window opened',
      'Recipient claim completed',
      'Disclosure package ready',
    ]);

    const narrativeSummary = screen.getByRole('region', { name: 'Narrative summary' });
    expect(within(narrativeSummary).getByText('Payout status: submitted')).toBeInTheDocument();
    expect(within(narrativeSummary).getByText('Claim status: claimed')).toBeInTheDocument();
    expect(within(narrativeSummary).getByText('Disclosure level: verification-ready')).toBeInTheDocument();

    const claimWindowEvent = screen.getByRole('region', { name: 'Claim window opened' });
    expect(within(claimWindowEvent).getByText('Umbra Treasury · 125 USDC')).toBeInTheDocument();

    const disclosureEvent = screen.getByRole('region', { name: 'Disclosure package ready' });
    expect(within(disclosureEvent).getByText('Revealed fields: amount')).toBeInTheDocument();
    expect(within(disclosureEvent).getByText('Artifacts: network-confirmation, claim-window')).toBeInTheDocument();

    const nextAction = screen.getByRole('region', { name: 'Next action' });
    expect(within(nextAction).getByRole('link', { name: 'Create another payout' })).toHaveAttribute(
      'href',
      '/app/payouts/new',
    );
    expect(within(nextAction).getByRole('link', { name: 'Return to landing' })).toHaveAttribute('href', '/');
  });

  it('renders the claim window from the payout-matching claimable payout when the match is not first', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockResolvedValue({
      ...defaultActivityNarrative,
      claimablePayouts: [
        {
          payoutId: 'preview-mainnet-someone-else',
          senderLabel: 'Other sender',
          tokenSymbol: 'USDT',
          amount: 10,
          claimStatus: 'claimable',
        },
        defaultActivityNarrative.claimablePayouts[0],
      ],
    });

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    const claimWindowEvent = await screen.findByRole('region', { name: 'Claim window opened' });

    expect(within(claimWindowEvent).getByText('Umbra Treasury · 125 USDC')).toBeInTheDocument();
    expect(within(claimWindowEvent).queryByText('Other sender · 10 USDT')).not.toBeInTheDocument();
  });

  it('ignores matching payouts that are no longer claimable', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockResolvedValue({
      ...defaultActivityNarrative,
      claimablePayouts: [
        {
          ...defaultActivityNarrative.claimablePayouts[0],
          claimStatus: 'claimed',
        },
      ],
    });

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    const claimWindowEvent = await screen.findByRole('region', { name: 'Claim window opened' });

    expect(
      within(claimWindowEvent).getByText('No claimable payouts are queued in this preview narrative.'),
    ).toBeInTheDocument();
  });

  it('shows an integrity-specific unavailable state when the claim result payout does not match the payout', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockResolvedValue({
      ...defaultActivityNarrative,
      claimResult: {
        ...defaultActivityNarrative.claimResult,
        payoutId: 'preview-mainnet-other-wallet',
      },
    });

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Activity narrative is inconsistent across payout, claim, and disclosure steps.',
    );
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Narrative summary' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Lifecycle timeline' })).not.toBeInTheDocument();
    expect(screen.queryByText('Preview payout submitted')).not.toBeInTheDocument();
    expect(screen.queryByText('Recipient claim completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Disclosure package ready')).not.toBeInTheDocument();
  });

  it('shows an integrity-specific unavailable state when the disclosure payout does not match the payout', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockResolvedValue({
      ...defaultActivityNarrative,
      disclosureView: {
        ...defaultActivityNarrative.disclosureView,
        payoutId: 'preview-mainnet-other-wallet',
      },
    });

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Activity narrative is inconsistent across payout, claim, and disclosure steps.',
    );
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Narrative summary' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Lifecycle timeline' })).not.toBeInTheDocument();
    expect(screen.queryByText('Preview payout submitted')).not.toBeInTheDocument();
    expect(screen.queryByText('Recipient claim completed')).not.toBeInTheDocument();
    expect(screen.queryByText('Disclosure package ready')).not.toBeInTheDocument();
  });

  it('shows a load-specific unavailable state when the activity narrative load fails', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockRejectedValue(new Error('boom'));

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Activity narrative could not be loaded.',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Lifecycle timeline' })).not.toBeInTheDocument();
    expect(screen.queryByText('Preview payout submitted')).not.toBeInTheDocument();
  });

  it('renders empty-state copy when no claimable payouts or disclosure artifacts are present', async () => {
    const loadActivityNarrative: LoadActivityNarrative = vi.fn().mockResolvedValue({
      ...defaultActivityNarrative,
      claimablePayouts: [],
      disclosureView: {
        ...defaultActivityNarrative.disclosureView,
        level: 'none',
        title: 'Opaque disclosure view',
        summary: 'No payout fields are revealed for this disclosure package.',
        revealedFields: [],
        verificationArtifacts: [],
      },
    });

    render(<ActivityPage loadActivityNarrative={loadActivityNarrative} />);

    expect(await screen.findByText('Opaque disclosure view')).toBeInTheDocument();
    expect(screen.getByText('No claimable payouts are queued in this preview narrative.')).toBeInTheDocument();
    expect(screen.getByText('Revealed fields: none')).toBeInTheDocument();
    expect(screen.getByText('Artifacts: none')).toBeInTheDocument();
  });
});

