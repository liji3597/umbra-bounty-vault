import { z } from 'zod';

import { supportedWalletNetworkSchema } from '@/features/shared/network';

const REQUIRED_RECIPIENT_MESSAGE = 'Recipient is required.';
const REQUIRED_TOKEN_MINT_MESSAGE = 'Token mint is required.';
const REQUIRED_AMOUNT_MESSAGE = 'Amount is required.';
const AMOUNT_INVALID_MESSAGE = 'Amount must be a number.';
const AMOUNT_NON_FINITE_MESSAGE = 'Amount must be a finite number.';
const AMOUNT_UNSAFE_PRECISION_MESSAGE = 'Amount exceeds supported numeric precision.';
const MAX_AMOUNT_INPUT_LENGTH = 400;
const MAX_NORMALIZED_AMOUNT_LENGTH = 400;
const NUMERIC_AMOUNT_PATTERN = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;
const INFINITY_AMOUNT_PATTERN = /^[+-]?Infinity$/i;

export const payoutIdSchema = z.string().trim().min(1);
export const transactionHashSchema = z.string().trim().min(1);
export const walletAddressSchema = z.string().trim().min(1);
export const protocolDisclosureLevelSchema = z.enum(['none', 'partial', 'verification-ready']);
export const payoutSubmissionStatusSchema = z.enum(['submitted', 'confirmed', 'failed']);
export const payoutLifecycleStatusValueSchema = z.enum(['pending', 'claimable', 'claimed', 'failed']);
export const claimablePayoutStatusSchema = z.enum(['claimable', 'claimed', 'pending']);
export const claimResultStatusSchema = z.enum(['pending', 'claimed', 'failed']);
export const disclosureViewerRoleSchema = z.enum(['sender', 'recipient', 'reviewer']);

export const scanClaimablePayoutsInputSchema = z.object({
  walletAddress: walletAddressSchema,
  network: supportedWalletNetworkSchema,
});


export const claimPrivatePayoutInputSchema = z.object({
  payoutId: payoutIdSchema,
  walletAddress: walletAddressSchema,
  network: supportedWalletNetworkSchema,
});

function normalizeAmountNumericString(value: string): string | null {
  const trimmedValue = value.trim();

  if (trimmedValue.length > MAX_AMOUNT_INPUT_LENGTH) {
    return null;
  }

  const match = trimmedValue.match(NUMERIC_AMOUNT_PATTERN);

  if (!match) {
    return null;
  }

  const [, sign, integerPart = '', fractionalPartFromInteger = '', fractionalPartOnly = '', exponentPart = '0'] =
    match;
  const fractionalPart = fractionalPartFromInteger || fractionalPartOnly;
  const digits = `${integerPart}${fractionalPart}`.replace(/^0+/, '');
  const parsedExponent = Number(exponentPart);

  if (
    !Number.isSafeInteger(parsedExponent) ||
    digits.length > MAX_NORMALIZED_AMOUNT_LENGTH ||
    fractionalPart.length > MAX_NORMALIZED_AMOUNT_LENGTH
  ) {
    return null;
  }

  if (digits === '') {
    return '0';
  }

  const exponent = parsedExponent - fractionalPart.length;

  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > MAX_NORMALIZED_AMOUNT_LENGTH) {
    return null;
  }

  const unsignedValue =
    exponent >= 0
      ? `${digits}${'0'.repeat(exponent)}`
      : (() => {
          const decimalIndex = digits.length + exponent;

          return decimalIndex > 0
            ? `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`
            : `0.${'0'.repeat(Math.abs(decimalIndex))}${digits}`;
        })();

  const normalizedValue = unsignedValue
    .replace(/^0+(?=\d)/, '')
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1');

  if (normalizedValue.length > MAX_NORMALIZED_AMOUNT_LENGTH) {
    return null;
  }

  if (normalizedValue === '0') {
    return '0';
  }

  return sign === '-' ? `-${normalizedValue}` : normalizedValue;
}

export const createPrivatePayoutAmountSchema = z
  .unknown()
  .transform((input, context) => {
    if (input === undefined) {
      context.addIssue({
        code: 'custom',
        message: REQUIRED_AMOUNT_MESSAGE,
      });
      return z.NEVER;
    }

    if (typeof input === 'string') {
      const trimmedInput = input.trim();

      if (trimmedInput === '') {
        context.addIssue({
          code: 'custom',
          message: REQUIRED_AMOUNT_MESSAGE,
        });
        return z.NEVER;
      }

      const normalizedValue = normalizeAmountNumericString(trimmedInput);

      if (normalizedValue === null) {
        context.addIssue({
          code: 'custom',
          message: INFINITY_AMOUNT_PATTERN.test(trimmedInput)
            ? AMOUNT_NON_FINITE_MESSAGE
            : NUMERIC_AMOUNT_PATTERN.test(trimmedInput)
              ? AMOUNT_UNSAFE_PRECISION_MESSAGE
              : AMOUNT_INVALID_MESSAGE,
        });
        return z.NEVER;
      }

      return normalizedValue;
    }

    if (typeof input === 'number') {
      if (Number.isNaN(input)) {
        context.addIssue({
          code: 'custom',
          message: REQUIRED_AMOUNT_MESSAGE,
        });
        return z.NEVER;
      }

      if (!Number.isFinite(input)) {
        context.addIssue({
          code: 'custom',
          message: AMOUNT_NON_FINITE_MESSAGE,
        });
        return z.NEVER;
      }

      context.addIssue({
        code: 'custom',
        message: AMOUNT_UNSAFE_PRECISION_MESSAGE,
      });
      return z.NEVER;
    }

    context.addIssue({
      code: 'custom',
      message: AMOUNT_INVALID_MESSAGE,
    });
    return z.NEVER;
  })
  .pipe(
    z
      .string()
      .refine((value) => value !== '0' && !value.startsWith('-'), 'Amount must be greater than zero.'),
  );

export const createPrivatePayoutValuesSchema = z.object({
  recipient: z.string().trim().min(1, REQUIRED_RECIPIENT_MESSAGE),
  tokenMint: z.string().trim().min(1, REQUIRED_TOKEN_MINT_MESSAGE),
  amount: z.string().trim().min(1, REQUIRED_AMOUNT_MESSAGE),
  memo: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  disclosureLevel: protocolDisclosureLevelSchema,
});

export const createPrivatePayoutFormSchema = createPrivatePayoutValuesSchema.extend({
  amount: createPrivatePayoutAmountSchema,
});

export const createPrivatePayoutResultSchema = z.object({
  payoutId: payoutIdSchema,
  transactionHash: transactionHashSchema,
  status: payoutSubmissionStatusSchema,
});

export const payoutStatusSchema = z.object({
  payoutId: payoutIdSchema,
  status: payoutLifecycleStatusValueSchema,
  network: supportedWalletNetworkSchema,
});

export const claimablePayoutSchema = z.object({
  payoutId: payoutIdSchema,
  senderLabel: z.string().trim().min(1),
  tokenSymbol: z.string().trim().min(1),
  amount: z.number().positive(),
  claimStatus: claimablePayoutStatusSchema,
});

export const claimPrivatePayoutResultSchema = z.object({
  payoutId: payoutIdSchema,
  claimStatus: claimResultStatusSchema,
  transactionHash: transactionHashSchema,
});

export const buildDisclosureViewInputSchema = z.object({
  payoutId: payoutIdSchema,
  level: protocolDisclosureLevelSchema,
  viewerRole: disclosureViewerRoleSchema,
});

export const disclosureViewSchema = z
  .object({
    payoutId: payoutIdSchema,
    level: protocolDisclosureLevelSchema,
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    revealedFields: z.array(z.string().trim().min(1)).default([]),
    verificationArtifacts: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((value, context) => {
    if (value.level === 'partial' && value.revealedFields.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Partial disclosure requires at least one revealed field.',
        path: ['revealedFields'],
      });
    }
  });

export type CreatePrivatePayoutInput = {
  recipient: string;
  tokenMint: string;
  amount: unknown;
  memo?: string | null;
  disclosureLevel: ProtocolDisclosureLevel;
};

export type ProtocolDisclosureLevel = z.infer<typeof protocolDisclosureLevelSchema>;
export type PayoutSubmissionStatus = z.infer<typeof payoutSubmissionStatusSchema>;
export type PayoutLifecycleStatusValue = z.infer<typeof payoutLifecycleStatusValueSchema>;
export type ClaimablePayoutStatus = z.infer<typeof claimablePayoutStatusSchema>;
export type ClaimResultStatus = z.infer<typeof claimResultStatusSchema>;
export type DisclosureViewerRole = z.infer<typeof disclosureViewerRoleSchema>;
export type ScanClaimablePayoutsInput = z.infer<typeof scanClaimablePayoutsInputSchema>;
export type ClaimPrivatePayoutInput = z.infer<typeof claimPrivatePayoutInputSchema>;
export type CreatePrivatePayoutValues = z.infer<typeof createPrivatePayoutValuesSchema>;
export type CreatePrivatePayoutResult = z.infer<typeof createPrivatePayoutResultSchema>;
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;
export type ClaimablePayout = z.infer<typeof claimablePayoutSchema>;
export type ClaimPrivatePayoutResult = z.infer<typeof claimPrivatePayoutResultSchema>;
export type BuildDisclosureViewInput = z.infer<typeof buildDisclosureViewInputSchema>;
export type DisclosureView = z.infer<typeof disclosureViewSchema>;
