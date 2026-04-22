import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type WalletProviderState, WalletProvider, useWallet } from '@/providers/WalletProvider';

import { CreatePayoutPage, type SubmitCreatePayout } from './CreatePayoutPage';

function WalletTestControls() {
  const wallet = useWallet();

  return (
    <button type="button" onClick={wallet.disconnect}>
      Disconnect wallet
    </button>
  );
}

function renderCreatePayoutPage(
  submitCreatePayout?: SubmitCreatePayout,
  initialState?: Partial<WalletProviderState>,
) {
  return render(
    <WalletProvider initialState={{ status: 'connected', network: 'devnet', ...initialState }}>
      <WalletTestControls />
      <CreatePayoutPage submitCreatePayout={submitCreatePayout} />
    </WalletProvider>,
  );
}

function fillValidDraft() {
  fireEvent.change(screen.getByLabelText('Recipient'), {
    target: { value: 'alice.sol' },
  });
  fireEvent.change(screen.getByLabelText('Token mint'), {
    target: { value: 'So11111111111111111111111111111111111111112' },
  });
  fireEvent.change(screen.getByLabelText('Amount'), {
    target: { value: '12.5' },
  });
}

function createDeferredSubmit() {
  let resolvePromise: ((value: { payoutId: string; transactionHash: string; status: 'submitted' }) => void) | null = null;

  const promise = new Promise<{ payoutId: string; transactionHash: string; status: 'submitted' }>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve(value: { payoutId: string; transactionHash: string; status: 'submitted' }) {
      resolvePromise?.(value);
    },
  };
}

describe('CreatePayoutPage', () => {
  it('renders the editing shell with payout context and primary inputs', () => {
    renderCreatePayoutPage();

    expect(screen.getByRole('heading', { name: 'Create Payout' })).toBeInTheDocument();
    expect(screen.getByText('Workflow status')).toBeInTheDocument();
    expect(screen.getByLabelText('Recipient')).toBeInTheDocument();
    expect(screen.getByLabelText('Disclosure level')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review payout' })).toBeInTheDocument();
  });

  it('marks invalid fields with accessible error wiring after failed review', () => {
    renderCreatePayoutPage();

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));

    const recipient = screen.getByLabelText('Recipient');
    const tokenMint = screen.getByLabelText('Token mint');
    const amount = screen.getByLabelText('Amount');

    expect(recipient).toHaveAttribute('aria-invalid', 'true');
    expect(tokenMint).toHaveAttribute('aria-invalid', 'true');
    expect(amount).toHaveAttribute('aria-invalid', 'true');
    expect(recipient).toHaveAttribute('aria-describedby', 'create-payout-recipient-error');
    expect(tokenMint).toHaveAttribute('aria-describedby', 'create-payout-tokenMint-error');
    expect(amount).toHaveAttribute('aria-describedby', 'create-payout-amount-error');
  });

  it('shows validation errors and stays on the form when required fields are missing', () => {
    const submitCreatePayout = vi.fn();

    renderCreatePayoutPage(submitCreatePayout);

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));

    expect(screen.getByText('Recipient is required.')).toBeInTheDocument();
    expect(screen.getByText('Token mint is required.')).toBeInTheDocument();
    expect(screen.getByText('Amount is required.')).toBeInTheDocument();
    expect(screen.queryByText('Review the normalized payout details before the final action.')).not.toBeInTheDocument();
    expect(submitCreatePayout).not.toHaveBeenCalled();
  });

  it('preserves large integer strings in review even beyond JS safe integer range', () => {
    renderCreatePayoutPage();

    fireEvent.change(screen.getByLabelText('Recipient'), {
      target: { value: 'alice.sol' },
    });
    fireEvent.change(screen.getByLabelText('Token mint'), {
      target: { value: 'So11111111111111111111111111111111111111112' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '9007199254740993' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));

    expect(screen.queryByText('Amount exceeds supported numeric precision.')).not.toBeInTheDocument();
    expect(screen.getByText('Review the normalized payout details before the final action.')).toBeInTheDocument();
    expect(screen.getByText('9007199254740993')).toBeInTheDocument();
  });

  it('preserves precise decimal strings in review without truncation', () => {
    renderCreatePayoutPage();

    fireEvent.change(screen.getByLabelText('Recipient'), {
      target: { value: 'alice.sol' },
    });
    fireEvent.change(screen.getByLabelText('Token mint'), {
      target: { value: 'So11111111111111111111111111111111111111112' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '1.0000000000000000001' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));

    expect(screen.queryByText('Amount exceeds supported numeric precision.')).not.toBeInTheDocument();
    expect(screen.getByText('Review the normalized payout details before the final action.')).toBeInTheDocument();
    expect(screen.getByText('1.0000000000000000001')).toBeInTheDocument();
  });

  it('moves to review after parsing a valid payout draft', () => {
    renderCreatePayoutPage();

    fillValidDraft();
    fireEvent.change(screen.getByLabelText('Memo'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByLabelText('Disclosure level'), {
      target: { value: 'verification-ready' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));

    expect(screen.getByText('Review the normalized payout details before the final action.')).toBeInTheDocument();
    expect(screen.getByText('alice.sol')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    expect(screen.getByText('No memo added')).toBeInTheDocument();
    expect(screen.getByText('Verification-ready')).toBeInTheDocument();
  });

  it('enters submitting state and sends normalized values to the injected submit function', async () => {
    const deferred = createDeferredSubmit();
    const submitCreatePayout = vi.fn(() => deferred.promise);

    renderCreatePayoutPage(submitCreatePayout);

    fillValidDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(screen.getByRole('button', { name: 'Submitting payout' })).toBeDisabled();
    expect(submitCreatePayout).toHaveBeenCalledTimes(1);
    expect(submitCreatePayout).toHaveBeenCalledWith({
      recipient: 'alice.sol',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '12.5',
      memo: null,
      disclosureLevel: 'partial',
    });

    deferred.resolve({
      payoutId: 'preview-alice-sol',
      transactionHash: 'preview-transaction',
      status: 'submitted',
    });

    await screen.findByText('Payout ready');
  });

  it('shows success details after a resolved submit', async () => {
    const submitCreatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'submitted',
    });

    renderCreatePayoutPage(submitCreatePayout);

    fillValidDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(await screen.findByText('Payout ready')).toBeInTheDocument();

    const payoutResult = screen.getByRole('region', { name: 'Payout result' });
    const shareSafeSummary = screen.getByText('Share-safe summary').parentElement;

    expect(shareSafeSummary).toBeTruthy();
    expect(within(payoutResult).getByText('payout-1')).toBeInTheDocument();
    expect(within(payoutResult).getByText('tx-1')).toBeInTheDocument();
    expect(within(payoutResult).getByText('submitted')).toBeInTheDocument();
    expect(screen.getByText('Recipient claims from Claim Center using a supported wallet on Solana Devnet.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Claim Center' })).toHaveAttribute('href', '/app/claim');
    expect(screen.getByRole('link', { name: 'Review activity' })).toHaveAttribute('href', '/app/activity');
    expect(within(shareSafeSummary as HTMLElement).getByText('payout-1')).toBeInTheDocument();
    expect(within(shareSafeSummary as HTMLElement).getByText('submitted')).toBeInTheDocument();
  });


  it('uses the connected wallet network in claim guidance after submit success', async () => {
    const submitCreatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'submitted',
    });

    renderCreatePayoutPage(submitCreatePayout, { network: 'mainnet' });

    fillValidDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(await screen.findByText('Payout ready')).toBeInTheDocument();
    expect(
      screen.getByText('Recipient claims from Claim Center using a supported wallet on Solana Mainnet.'),
    ).toBeInTheDocument();
  });

  it('keeps the default disclosure level when the selected value is invalid', () => {
    renderCreatePayoutPage();

    fillValidDraft();
    fireEvent.change(screen.getByLabelText('Disclosure level'), {
      target: { value: 'bogus' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));

    expect(screen.getByText('Review the normalized payout details before the final action.')).toBeInTheDocument();
    expect(screen.getByText('Partial disclosure')).toBeInTheDocument();
  });

  it('keeps preview success identifiers opaque and out of the share-safe summary inputs', async () => {
    const view = renderCreatePayoutPage();

    fireEvent.change(screen.getByLabelText('Recipient'), {
      target: { value: 'alice.secret.sol' },
    });
    fireEvent.change(screen.getByLabelText('Token mint'), {
      target: { value: 'SecretMint1111111111111111111111111111111111111' },
    });
    fireEvent.change(screen.getByLabelText('Amount'), {
      target: { value: '12.5' },
    });
    fireEvent.change(screen.getByLabelText('Memo'), {
      target: { value: 'Highly sensitive memo' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(await screen.findByText('Share-safe summary')).toBeInTheDocument();
    expect(screen.queryByText(/alice\.secret\.sol/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SecretMint1111/i)).not.toBeInTheDocument();
    expect(screen.queryByText('12.5')).not.toBeInTheDocument();
    expect(screen.queryByText('Highly sensitive memo')).not.toBeInTheDocument();

    const resultSections = view.container.querySelectorAll('.payout-feedback__result');
    const combinedResultText = Array.from(resultSections)
      .map((section) => section.textContent ?? '')
      .join(' ');

    expect(combinedResultText).not.toMatch(/alice-secret-sol/i);
    expect(combinedResultText).not.toMatch(/SecretMint/i);
    expect(combinedResultText).not.toMatch(/12\.5/);
    expect(combinedResultText).not.toMatch(/Highly sensitive memo/i);
  });

  it('shows failure feedback when submit resolves with a failed status', async () => {
    const submitCreatePayout = vi.fn().mockResolvedValue({
      payoutId: 'payout-1',
      transactionHash: 'tx-1',
      status: 'failed',
    });

    renderCreatePayoutPage(submitCreatePayout);

    fillValidDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(await screen.findByText('Submission failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Payout submission failed.');
    expect(screen.queryByText('Payout ready')).not.toBeInTheDocument();
  });

  it('disables retry when the wallet becomes unavailable after a failed submit', async () => {
    const submitCreatePayout = vi.fn().mockRejectedValue(new Error('Preview submit failed'));

    renderCreatePayoutPage(submitCreatePayout);

    fillValidDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(await screen.findByText('Submission failed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));

    const retryButton = screen.getByRole('button', { name: 'Try again' });
    expect(retryButton).toBeDisabled();

    fireEvent.click(retryButton);
    expect(submitCreatePayout).toHaveBeenCalledTimes(1);
  });

  it('shows failure feedback and allows returning to review after a rejected submit', async () => {
    const submitCreatePayout = vi.fn().mockRejectedValue(new Error('Preview submit failed'));

    renderCreatePayoutPage(submitCreatePayout);

    fillValidDraft();
    fireEvent.click(screen.getByRole('button', { name: 'Review payout' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create payout' }));

    expect(await screen.findByText('Submission failed')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to submit payout.');

    fireEvent.click(screen.getByRole('button', { name: 'Back to review' }));

    await waitFor(() => {
      expect(
        screen.getByText('Review the normalized payout details before the final action.'),
      ).toBeInTheDocument();
    });
  });
});
