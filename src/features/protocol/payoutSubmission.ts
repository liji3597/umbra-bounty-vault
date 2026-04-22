import { z } from 'zod';

export type PayoutSubmissionFailureReason = 'parameter' | 'signing' | 'network';

interface ErrorLike {
  code?: unknown;
  message?: unknown;
  name?: unknown;
}

const SIGNING_ERROR_PATTERNS = [
  '4001',
  'action_rejected',
  'signer unavailable',
  'signature request',
  'signing request',
  'user rejected',
  'wallet rejected',
  'wallet reject',
  'wallet refused',
] as const;

const NETWORK_ERROR_PATTERNS = [
  '502',
  '503',
  'econn',
  'fetch failed',
  'network',
  'rpc',
  'timed out',
  'timeout',
  'transport',
] as const;

function getErrorLike(error: unknown): ErrorLike | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  return error as ErrorLike;
}

function getNormalizedErrorText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.toLowerCase();
  }

  const errorLike = getErrorLike(error);

  if (!errorLike) {
    return '';
  }

  const code = typeof errorLike.code === 'number' ? String(errorLike.code) : errorLike.code;
  const parts = [code, errorLike.name, errorLike.message].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );

  return parts.join(' ').toLowerCase();
}

function matchesPattern(error: unknown, patterns: readonly string[]): boolean {
  const normalizedText = getNormalizedErrorText(error);

  return patterns.some((pattern) => normalizedText.includes(pattern));
}

export class PayoutSubmissionError extends Error {
  readonly reason: PayoutSubmissionFailureReason;

  constructor(reason: PayoutSubmissionFailureReason) {
    super(`Payout submission failed: ${reason}`);
    this.name = 'PayoutSubmissionError';
    this.reason = reason;
  }
}

export function isPayoutSubmissionError(error: unknown): error is PayoutSubmissionError {
  return error instanceof PayoutSubmissionError;
}

export function classifyPayoutSubmissionError(error: unknown): PayoutSubmissionError | null {
  if (isPayoutSubmissionError(error)) {
    return error;
  }

  if (error instanceof z.ZodError) {
    return new PayoutSubmissionError('parameter');
  }

  if (matchesPattern(error, SIGNING_ERROR_PATTERNS)) {
    return new PayoutSubmissionError('signing');
  }

  if (matchesPattern(error, NETWORK_ERROR_PATTERNS)) {
    return new PayoutSubmissionError('network');
  }

  return null;
}
