'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent } from 'react';

import { Badge, Panel } from '@/components/ui';
import { PayoutSubmissionError } from '@/features/protocol/payoutSubmission';
import { getAppRoute } from '@/lib/routes';
import { useWallet } from '@/providers/WalletProvider';

import {
  createPayoutFormSchema,
  createPrivatePayoutResultSchema,
  disclosureLevelSchema,
  type CreatePayoutFormValues,
  type CreatePrivatePayoutResult,
  type DisclosureLevel,
} from '../schema';

export type SubmitCreatePayout = (
  values: CreatePayoutFormValues,
) => Promise<CreatePrivatePayoutResult>;

interface CreatePayoutPageProps {
  submitCreatePayout?: SubmitCreatePayout;
  onSubmitSuccess?: (result: CreatePrivatePayoutResult, values: CreatePayoutFormValues) => void;
}

interface CreatePayoutDraft {
  recipient: string;
  tokenMint: string;
  amount: string;
  memo: string;
  disclosureLevel: DisclosureLevel;
}

const FAILED_PAYOUT_MESSAGE = 'Payout submission failed.';
const INVALID_PAYOUT_RESULT_MESSAGE = 'Unexpected payout response.';
const PARAMETER_SUBMIT_ERROR_MESSAGE = 'Payout details are invalid. Review the form values and try again.';
const SIGNING_SUBMIT_ERROR_MESSAGE =
  'Signature request was rejected or unavailable. Confirm the wallet prompt and try again.';
const NETWORK_SUBMIT_ERROR_MESSAGE =
  'Network request failed while submitting the payout. Retry on a supported connection.';
const SUBMIT_PAYOUT_ERROR_MESSAGE = 'Unable to submit payout.';

type DraftField = keyof CreatePayoutDraft;
type DraftFieldErrors = Partial<Record<DraftField, string>>;
type CreatePayoutPhase = 'editing' | 'review' | 'submitting' | 'success' | 'failure';

const INITIAL_DRAFT: CreatePayoutDraft = {
  recipient: '',
  tokenMint: '',
  amount: '',
  memo: '',
  disclosureLevel: 'partial',
};

const CLAIM_ROUTE = getAppRoute('/app/claim');
const ACTIVITY_ROUTE = getAppRoute('/app/activity');

function getDisclosureLabel(level: DisclosureLevel): string {
  switch (level) {
    case 'none':
      return 'No disclosure';
    case 'verification-ready':
      return 'Verification-ready';
    case 'partial':
    default:
      return 'Partial disclosure';
  }
}

function getPhaseLabel(phase: CreatePayoutPhase): string {
  switch (phase) {
    case 'review':
      return 'Review';
    case 'submitting':
      return 'Submitting';
    case 'success':
      return 'Success';
    case 'failure':
      return 'Failure';
    case 'editing':
    default:
      return 'Editing';
  }
}

function getFieldErrors(
  fieldErrors: Partial<Record<DraftField, string[] | undefined>>,
): DraftFieldErrors {
  return {
    recipient: fieldErrors.recipient?.[0],
    tokenMint: fieldErrors.tokenMint?.[0],
    amount: fieldErrors.amount?.[0],
    memo: fieldErrors.memo?.[0],
    disclosureLevel: fieldErrors.disclosureLevel?.[0],
  };
}

function getFieldErrorId(field: DraftField): string {
  return `create-payout-${field}-error`;
}

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof PayoutSubmissionError) {
    switch (error.reason) {
      case 'parameter':
        return PARAMETER_SUBMIT_ERROR_MESSAGE;
      case 'signing':
        return SIGNING_SUBMIT_ERROR_MESSAGE;
      case 'network':
        return NETWORK_SUBMIT_ERROR_MESSAGE;
      default:
        return SUBMIT_PAYOUT_ERROR_MESSAGE;
    }
  }

  if (error instanceof Error) {
    return SUBMIT_PAYOUT_ERROR_MESSAGE;
  }

  return SUBMIT_PAYOUT_ERROR_MESSAGE;
}

function buildCreatePayoutInput(draft: CreatePayoutDraft) {
  return {
    recipient: draft.recipient,
    tokenMint: draft.tokenMint,
    amount: draft.amount.trim() === '' ? undefined : draft.amount.trim(),
    memo: draft.memo,
    disclosureLevel: draft.disclosureLevel,
  };
}

async function previewSubmitCreatePayout(): Promise<CreatePrivatePayoutResult> {
  return {
    payoutId: 'preview-payout',
    transactionHash: 'preview-transaction',
    status: 'submitted',
  };
}

export function CreatePayoutPage({
  submitCreatePayout = previewSubmitCreatePayout,
  onSubmitSuccess,
}: CreatePayoutPageProps) {
  const wallet = useWallet();
  const [draft, setDraft] = useState<CreatePayoutDraft>(INITIAL_DRAFT);
  const [phase, setPhase] = useState<CreatePayoutPhase>('editing');
  const [fieldErrors, setFieldErrors] = useState<DraftFieldErrors>({});
  const [reviewValues, setReviewValues] = useState<CreatePayoutFormValues | null>(null);
  const [submitResult, setSubmitResult] = useState<CreatePrivatePayoutResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isWalletReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const walletMessage = isWalletReady
    ? `${wallet.walletLabel ?? 'Wallet'} ready on ${wallet.networkLabel}.`
    : 'Connect a supported wallet before reviewing or submitting a payout.';

  function updateDraft<Field extends DraftField>(field: Field, value: CreatePayoutDraft[Field]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    if (phase !== 'editing') {
      setPhase('editing');
      setSubmitError(null);
      setSubmitResult(null);
    }
  }

  function handleReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedValues = createPayoutFormSchema.safeParse(buildCreatePayoutInput(draft));

    if (!parsedValues.success) {
      setFieldErrors(getFieldErrors(parsedValues.error.flatten().fieldErrors));
      setReviewValues(null);
      setPhase('editing');
      return;
    }

    setFieldErrors({});
    setReviewValues(parsedValues.data);
    setSubmitError(null);
    setSubmitResult(null);
    setPhase('review');
  }

  async function handleSubmit() {
    if (!reviewValues || !isWalletReady) {
      return;
    }

    setSubmitError(null);
    setSubmitResult(null);
    setPhase('submitting');

    try {
      const result = await submitCreatePayout(reviewValues);
      const parsedResult = createPrivatePayoutResultSchema.safeParse(result);

      if (!parsedResult.success) {
        setSubmitError(INVALID_PAYOUT_RESULT_MESSAGE);
        setPhase('failure');
        return;
      }

      if (parsedResult.data.status === 'failed') {
        setSubmitResult(parsedResult.data);
        setSubmitError(FAILED_PAYOUT_MESSAGE);
        setPhase('failure');
        return;
      }

      setSubmitResult(parsedResult.data);
      onSubmitSuccess?.(parsedResult.data, reviewValues);
      setPhase('success');
    } catch (error: unknown) {
      setSubmitError(getSubmitErrorMessage(error));
      setPhase('failure');
    }
  }

  function handleReset() {
    setDraft(INITIAL_DRAFT);
    setFieldErrors({});
    setReviewValues(null);
    setSubmitResult(null);
    setSubmitError(null);
    setPhase('editing');
  }

  return (
    <section className="payout-page">
      <section className="ui-panel payout-page__hero">
        <div className="payout-page__hero-copy">
          <Badge className="payout-page__eyebrow" variant="accent">
            Authorize payout
          </Badge>
          <h1 className="page-title">Create Payout</h1>
          <p className="page-description">
            Configure and authorize a secure transfer from the vault reserve with a privacy-first
            review checkpoint before execution.
          </p>
          <div className="payout-page__badges" aria-label="Create payout meta">
            <Badge>{wallet.networkLabel}</Badge>
            <Badge>{getPhaseLabel(phase)}</Badge>
            <Badge>{isWalletReady ? 'Wallet ready' : 'Wallet required'}</Badge>
          </div>
        </div>

        <Panel
          className="payout-page__vault-card"
          heading="Vault status"
          description="Current reserve posture for this authorization session."
        >
          <dl className="payout-page__vault-metrics">
            <div>
              <dt>Available liquidity</dt>
              <dd>2,450,000</dd>
            </div>
            <div>
              <dt>Pending claims</dt>
              <dd>14</dd>
            </div>
          </dl>
          <p className="payout-page__vault-note">
            Payouts exceeding 50,000 require secondary approval before execution.
          </p>
        </Panel>
      </section>

      <div className="payout-page__grid">
        <Panel className="payout-page__panel" heading="Payout details">
          {phase === 'review' && reviewValues ? (
            <div className="payout-review" aria-live="polite">
              <div className="payout-page__section-heading">
                <h2 className="payout-page__section-title">Review checkpoint</h2>
                <p className="payout-review__lead">
                  Review the normalized payout details before the final action.
                </p>
              </div>
              <dl className="payout-review__list">
                <div>
                  <dt>Recipient</dt>
                  <dd>{reviewValues.recipient}</dd>
                </div>
                <div>
                  <dt>Token mint</dt>
                  <dd>{reviewValues.tokenMint}</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>{reviewValues.amount}</dd>
                </div>
                <div>
                  <dt>Memo</dt>
                  <dd>{reviewValues.memo ?? 'No memo added'}</dd>
                </div>
                <div>
                  <dt>Disclosure level</dt>
                  <dd>{getDisclosureLabel(reviewValues.disclosureLevel)}</dd>
                </div>
              </dl>
              <div className="payout-review__actions">
                <button
                  className="payout-page__button payout-page__button--ghost"
                  type="button"
                  onClick={() => setPhase('editing')}
                >
                  Back to form
                </button>
                <button
                  className="payout-page__button"
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isWalletReady}
                >
                  Create payout
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'submitting' && reviewValues ? (
            <div className="payout-feedback" aria-live="polite">
              <div className="payout-page__section-heading">
                <h2 className="payout-page__section-title">Execution in progress</h2>
                <p className="payout-feedback__copy">
                  Sending {reviewValues.amount} to {reviewValues.recipient} through the typed
                  payout service.
                </p>
              </div>
              <button className="payout-page__button" type="button" disabled>
                Submitting payout
              </button>
            </div>
          ) : null}

          {phase === 'success' && submitResult && reviewValues ? (
            <div className="payout-feedback" aria-live="polite">
              <div className="payout-page__section-heading">
                <h2 className="payout-page__section-title">Payout ready</h2>
                <p className="payout-feedback__copy">
                  The payout response is ready for confirmation and follow-up actions.
                </p>
              </div>
              <section aria-label="Payout result">
                <dl className="payout-feedback__result">
                  <div>
                    <dt>Payout id</dt>
                    <dd>{submitResult.payoutId}</dd>
                  </div>
                  <div>
                    <dt>Transaction hash</dt>
                    <dd>{submitResult.transactionHash}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{submitResult.status}</dd>
                  </div>
                </dl>
              </section>

              <div className="payout-feedback__next-steps">
                <p className="payout-feedback__title">Claim guidance</p>
                <p className="payout-feedback__copy">
                  Recipient claims from Claim Center using a supported wallet on {wallet.networkLabel}.
                </p>
                <div className="payout-review__actions">
                  <Link className="payout-page__button" href={CLAIM_ROUTE.href}>
                    Open Claim Center
                  </Link>
                  <Link className="payout-page__button payout-page__button--ghost" href={ACTIVITY_ROUTE.href}>
                    Review activity
                  </Link>
                </div>
              </div>

              <div className="payout-feedback__next-steps">
                <p className="payout-feedback__title">Share-safe summary</p>
                <p className="payout-feedback__copy">
                  Safe to share with collaborators without exposing recipient, amount, or memo.
                </p>
                <dl className="payout-feedback__result">
                  <div>
                    <dt>Payout id</dt>
                    <dd>{submitResult.payoutId}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{submitResult.status}</dd>
                  </div>
                  <div>
                    <dt>Disclosure level</dt>
                    <dd>{getDisclosureLabel(reviewValues.disclosureLevel)}</dd>
                  </div>
                </dl>
              </div>

              <button className="payout-page__button" type="button" onClick={handleReset}>
                Create another payout
              </button>
            </div>
          ) : null}

          {phase === 'failure' ? (
            <div className="payout-feedback" aria-live="assertive">
              <div className="payout-page__section-heading">
                <h2 className="payout-page__section-title">Submission failed</h2>
                <p className="payout-feedback__copy" role="alert">
                  {submitError ?? 'Unexpected error'}
                </p>
              </div>
              <div className="payout-review__actions">
                <button
                  className="payout-page__button payout-page__button--ghost"
                  type="button"
                  onClick={() => setPhase('review')}
                >
                  Back to review
                </button>
                <button
                  className="payout-page__button"
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isWalletReady}
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}

          {phase === 'editing' ? (
            <form className="payout-form" onSubmit={handleReview} noValidate>
              <section className="payout-page__section">
                <div className="payout-page__section-heading">
                  <h2 className="payout-page__section-title">Resolution target</h2>
                  <p className="payout-page__section-copy">
                    The linked claim selector remains outside this slice, while the payout draft
                    below stays available for review before execution.
                  </p>
                </div>
                <div className="payout-page__resolution-card">
                  <p className="payout-page__resolution-label">Linked bounty / claim ID</p>
                  <p className="payout-page__resolution-value">Manual authorization entry</p>
                  <p className="payout-page__resolution-copy">
                    Use the recipient and token fields below to stage the payout, then confirm the
                    normalized values in review.
                  </p>
                </div>
              </section>

              <section className="payout-page__section payout-page__section--sensitive">
                <div className="payout-page__section-heading">
                  <div className="payout-page__security-row">
                    <h2 className="payout-page__section-title">Recipient cryptography</h2>
                    <span className="payout-page__security-chip">Private entry</span>
                  </div>
                  <p className="payout-page__section-copy">
                    Sensitive recipient details stay confined to this step and out of the share-safe
                    summary.
                  </p>
                </div>
                <div className="payout-form__group payout-form__group--two-up">
                  <label className="payout-form__field">
                    <span>Recipient</span>
                    <input
                      aria-describedby={fieldErrors.recipient ? getFieldErrorId('recipient') : undefined}
                      aria-invalid={fieldErrors.recipient ? 'true' : undefined}
                      aria-label="Recipient"
                      name="recipient"
                      type="text"
                      value={draft.recipient}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        updateDraft('recipient', event.target.value)
                      }
                    />
                    {fieldErrors.recipient ? (
                      <p className="payout-form__error" id={getFieldErrorId('recipient')} role="alert">
                        {fieldErrors.recipient}
                      </p>
                    ) : null}
                  </label>

                  <label className="payout-form__field">
                    <span>Token mint</span>
                    <input
                      aria-describedby={fieldErrors.tokenMint ? getFieldErrorId('tokenMint') : undefined}
                      aria-invalid={fieldErrors.tokenMint ? 'true' : undefined}
                      aria-label="Token mint"
                      name="tokenMint"
                      type="text"
                      value={draft.tokenMint}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        updateDraft('tokenMint', event.target.value)
                      }
                    />
                    {fieldErrors.tokenMint ? (
                      <p className="payout-form__error" id={getFieldErrorId('tokenMint')} role="alert">
                        {fieldErrors.tokenMint}
                      </p>
                    ) : null}
                  </label>
                </div>
              </section>

              <section className="payout-page__section">
                <div className="payout-page__section-heading">
                  <h2 className="payout-page__section-title">Parameter configuration</h2>
                  <p className="payout-page__section-copy">
                    Set the transfer amount, disclosure posture, and any internal memo before the
                    review checkpoint.
                  </p>
                </div>

                <div className="payout-form__group payout-form__group--two-up">
                  <label className="payout-form__field payout-form__field--amount">
                    <span>Amount</span>
                    <input
                      aria-describedby={fieldErrors.amount ? getFieldErrorId('amount') : undefined}
                      aria-invalid={fieldErrors.amount ? 'true' : undefined}
                      aria-label="Amount"
                      name="amount"
                      type="number"
                      min="0"
                      step="any"
                      value={draft.amount}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        updateDraft('amount', event.target.value)
                      }
                    />
                    {fieldErrors.amount ? (
                      <p className="payout-form__error" id={getFieldErrorId('amount')} role="alert">
                        {fieldErrors.amount}
                      </p>
                    ) : null}
                  </label>

                  <label className="payout-form__field">
                    <span>Disclosure level</span>
                    <select
                      aria-describedby={fieldErrors.disclosureLevel ? getFieldErrorId('disclosureLevel') : undefined}
                      aria-invalid={fieldErrors.disclosureLevel ? 'true' : undefined}
                      aria-label="Disclosure level"
                      name="disclosureLevel"
                      value={draft.disclosureLevel}
                      onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                        const parsedDisclosureLevel = disclosureLevelSchema.safeParse(
                          event.target.value,
                        );

                        if (!parsedDisclosureLevel.success) {
                          return;
                        }

                        updateDraft('disclosureLevel', parsedDisclosureLevel.data);
                      }}
                    >
                      <option value="none">No disclosure</option>
                      <option value="partial">Partial disclosure</option>
                      <option value="verification-ready">Verification-ready</option>
                    </select>
                    {fieldErrors.disclosureLevel ? (
                      <p className="payout-form__error" id={getFieldErrorId('disclosureLevel')} role="alert">
                        {fieldErrors.disclosureLevel}
                      </p>
                    ) : null}
                  </label>
                </div>

                <label className="payout-form__field">
                  <span>Memo</span>
                  <textarea
                    aria-describedby={fieldErrors.memo ? getFieldErrorId('memo') : undefined}
                    aria-invalid={fieldErrors.memo ? 'true' : undefined}
                    aria-label="Memo"
                    name="memo"
                    rows={4}
                    value={draft.memo}
                    onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                      updateDraft('memo', event.target.value)
                    }
                  />
                  {fieldErrors.memo ? (
                    <p className="payout-form__error" id={getFieldErrorId('memo')} role="alert">
                      {fieldErrors.memo}
                    </p>
                  ) : null}
                </label>

                <button className="payout-page__button" type="submit" disabled={!isWalletReady}>
                  Review payout
                </button>
              </section>
            </form>
          ) : null}
        </Panel>

        <Panel
          className="payout-page__status"
          heading="Workflow status"
          description="Workflow status for the current authorization session."
        >
          <p className="payout-page__status-copy">{walletMessage}</p>
          <dl className="payout-page__status-list">
            <div>
              <dt>Network</dt>
              <dd>{wallet.networkLabel}</dd>
            </div>
            <div>
              <dt>Phase</dt>
              <dd>{getPhaseLabel(phase)}</dd>
            </div>
            <div>
              <dt>Wallet</dt>
              <dd>{wallet.walletLabel ?? 'Not connected'}</dd>
            </div>
          </dl>
          <p className="payout-page__status-note">
            Payouts above 50,000 require secondary multi-sig approval before final execution.
          </p>
        </Panel>
      </div>
    </section>
  );
}
