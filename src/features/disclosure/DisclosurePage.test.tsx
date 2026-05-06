import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DisclosurePage, type BuildDisclosureView } from './DisclosurePage';
import type { DisclosureView } from './schema';

const defaultDisclosureView = {
  payoutId: 'preview-disclosure',
  level: 'verification-ready' as const,
  title: 'Recipient verification package',
  summary: 'Bounded recipient access is available for this payout preview.',
  revealedFields: ['amount'],
  verificationArtifacts: ['network-confirmation', 'claim-window'],
} satisfies DisclosureView;

describe('DisclosurePage', () => {
  it('loads a disclosure view on mount and renders the bounded package', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockResolvedValue(defaultDisclosureView);

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading disclosure preview.');

    await waitFor(() => {
      expect(buildDisclosureView).toHaveBeenCalledWith({
        payoutId: 'preview-disclosure',
        level: 'verification-ready',
        viewerRole: 'recipient',
      });
    });

    expect(await screen.findByText('Recipient verification package')).toBeInTheDocument();
    expect(screen.getByText('Bounded recipient access is available for this payout preview.')).toBeInTheDocument();
    expect(screen.getByText('Reference: preview-disclosure')).toBeInTheDocument();
    expect(screen.getByText('Prepared preview')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Review a bounded disclosure package through the typed service boundary. This surface stays coherent with the reward narrative without implying one exact live continuation from the prior step.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This disclosure package is a prepared preview narrative and is not backed by a connected wallet-scoped truth context.',
      ),
    ).toBeInTheDocument();

    const revealedFields = screen.getByRole('region', { name: 'Revealed fields' });
    const verificationArtifacts = screen.getByRole('region', { name: 'Verification artifacts' });
    const nextAction = screen.getByRole('region', { name: 'Next action' });

    expect(within(revealedFields).getByText('amount')).toBeInTheDocument();
    expect(within(verificationArtifacts).getByText('network-confirmation')).toBeInTheDocument();
    expect(within(verificationArtifacts).getByText('claim-window')).toBeInTheDocument();
    expect(within(nextAction).getByRole('link', { name: 'View activity timeline' })).toHaveAttribute(
      'href',
      '/app/activity',
    );
    expect(within(nextAction).getByRole('link', { name: 'Back to claim center' })).toHaveAttribute(
      'href',
      '/app/claim',
    );
  });

  it('shows demo-derived disclosure source when provided', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockResolvedValue(defaultDisclosureView);

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} truthSource="demo-derived" />);

    expect(await screen.findByText('Recipient verification package')).toBeInTheDocument();
    expect(screen.getByText('Demo-derived')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This disclosure package is derived from the active demo continuity session and remains bounded product narrative rather than a protocol-level live artifact.',
      ),
    ).toBeInTheDocument();
  });

  it('shows live-derived disclosure source when provided', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockResolvedValue(defaultDisclosureView);

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} truthSource="live-derived" />);

    expect(await screen.findByText('Recipient verification package')).toBeInTheDocument();
    expect(screen.getByText('Live-derived')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This disclosure package is derived from wallet-scoped provider truth and stays bounded to an app-level summary instead of claiming a full protocol disclosure artifact.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an unavailable state when no disclosure request context is available', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn();

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} defaultInput={null} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Disclosure preview is currently unavailable.',
    );
    expect(buildDisclosureView).not.toHaveBeenCalled();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('shows an unavailable state when the returned disclosure references a different payout', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockResolvedValue({
      ...defaultDisclosureView,
      payoutId: 'preview-other-disclosure',
    });

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Disclosure preview is currently unavailable.',
    );
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.queryByText('Recipient verification package')).not.toBeInTheDocument();
  });

  it('shows an unavailable state when the returned disclosure level does not match the request', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockResolvedValue({
      ...defaultDisclosureView,
      level: 'partial',
    });

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Disclosure preview is currently unavailable.',
    );
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.queryByText('Recipient verification package')).not.toBeInTheDocument();
  });

  it('shows an empty-state message when no verification artifacts are required', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockResolvedValue({
      ...defaultDisclosureView,
      level: 'none',
      title: 'Opaque disclosure view',
      verificationArtifacts: [],
      revealedFields: [],
    });

    render(
      <DisclosurePage
        buildDisclosureView={buildDisclosureView}
        defaultInput={{
          payoutId: 'preview-disclosure',
          level: 'none',
          viewerRole: 'recipient',
        }}
      />,
    );

    expect(await screen.findByText('Opaque disclosure view')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('No payout fields are revealed for this disclosure level.')).toBeInTheDocument();
    expect(
      screen.getByText('No verification artifacts are required for this disclosure level.'),
    ).toBeInTheDocument();
  });

  it('shows a stable unavailable state when the disclosure load fails', async () => {
    const buildDisclosureView: BuildDisclosureView = vi.fn().mockRejectedValue(new Error('boom'));

    render(<DisclosurePage buildDisclosureView={buildDisclosureView} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Disclosure preview is currently unavailable.',
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('Recipient verification package')).not.toBeInTheDocument();
  });
});

