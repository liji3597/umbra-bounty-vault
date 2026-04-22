import { z } from 'zod';

import { disclosureLevelSchema } from '@/features/payout/schema';

export const buildDisclosureViewInputSchema = z.object({
  payoutId: z.string().trim().min(1),
  level: disclosureLevelSchema,
  viewerRole: z.enum(['sender', 'recipient', 'reviewer']),
});

export const disclosureViewSchema = z
  .object({
    payoutId: z.string().trim().min(1),
    level: disclosureLevelSchema,
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

export type BuildDisclosureViewInput = z.infer<typeof buildDisclosureViewInputSchema>;
export type DisclosureView = z.infer<typeof disclosureViewSchema>;
