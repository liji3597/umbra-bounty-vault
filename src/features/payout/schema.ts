import { z } from 'zod';

const AMOUNT_REQUIRED_MESSAGE = 'Amount is required.';
const AMOUNT_INVALID_MESSAGE = 'Amount must be a number.';
const AMOUNT_NON_FINITE_MESSAGE = 'Amount must be a finite number.';
const AMOUNT_UNSAFE_PRECISION_MESSAGE = 'Amount exceeds supported numeric precision.';
const MAX_AMOUNT_INPUT_LENGTH = 400;
const MAX_NORMALIZED_AMOUNT_LENGTH = 400;
const NUMERIC_AMOUNT_PATTERN = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;
const INFINITY_AMOUNT_PATTERN = /^[+-]?Infinity$/i;

export const disclosureLevelSchema = z.enum(['none', 'partial', 'verification-ready']);

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

const payoutAmountSchema = z
  .unknown()
  .transform((input, context) => {
    if (input === undefined) {
      context.addIssue({
        code: 'custom',
        message: AMOUNT_REQUIRED_MESSAGE,
      });
      return z.NEVER;
    }

    if (typeof input === 'string') {
      const trimmedInput = input.trim();

      if (trimmedInput === '') {
        context.addIssue({
          code: 'custom',
          message: AMOUNT_REQUIRED_MESSAGE,
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
          message: AMOUNT_REQUIRED_MESSAGE,
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

export const createPayoutFormSchema = z.object({
  recipient: z.string().trim().min(1, 'Recipient is required.'),
  tokenMint: z.string().trim().min(1, 'Token mint is required.'),
  amount: payoutAmountSchema,
  memo: z
    .string()
    .trim()
    .transform((value) => value || null)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
  disclosureLevel: disclosureLevelSchema,
});

export const createPrivatePayoutResultSchema = z.object({
  payoutId: z.string().trim().min(1),
  transactionHash: z.string().trim().min(1),
  status: z.enum(['submitted', 'confirmed', 'failed']),
});

export const payoutStatusSchema = z.object({
  payoutId: z.string().trim().min(1),
  status: z.enum(['pending', 'claimable', 'claimed', 'failed']),
  network: z.enum(['devnet', 'mainnet']),
});

export type DisclosureLevel = z.infer<typeof disclosureLevelSchema>;
export type CreatePayoutFormInput = z.input<typeof createPayoutFormSchema>;
export type CreatePayoutFormValues = z.output<typeof createPayoutFormSchema>;
export type CreatePrivatePayoutResult = z.infer<typeof createPrivatePayoutResultSchema>;
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;
