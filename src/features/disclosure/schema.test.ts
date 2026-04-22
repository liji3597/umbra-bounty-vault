import { describe, expect, it } from 'vitest';

import { buildDisclosureViewInputSchema, disclosureViewSchema } from './schema';

describe('disclosure schema', () => {
  it('parses disclosure view input and a verification-ready view', () => {
    expect(
      buildDisclosureViewInputSchema.parse({
        payoutId: 'payout-1',
        level: 'verification-ready',
        viewerRole: 'reviewer',
      }),
    ).toEqual({
      payoutId: 'payout-1',
      level: 'verification-ready',
      viewerRole: 'reviewer',
    });

    expect(
      disclosureViewSchema.parse({
        payoutId: 'payout-1',
        level: 'verification-ready',
        title: 'Verification package ready',
        summary: 'Bounded disclosure is ready for reviewer access.',
        revealedFields: ['recipient', 'amount'],
        verificationArtifacts: ['commitment-proof'],
      }),
    ).toEqual({
      payoutId: 'payout-1',
      level: 'verification-ready',
      title: 'Verification package ready',
      summary: 'Bounded disclosure is ready for reviewer access.',
      revealedFields: ['recipient', 'amount'],
      verificationArtifacts: ['commitment-proof'],
    });
  });

  it('rejects partial disclosure without revealed fields', () => {
    expect(() =>
      disclosureViewSchema.parse({
        payoutId: 'payout-1',
        level: 'partial',
        title: 'Partial disclosure',
        summary: 'Only limited context is visible.',
        revealedFields: [],
      }),
    ).toThrow();
  });
});
