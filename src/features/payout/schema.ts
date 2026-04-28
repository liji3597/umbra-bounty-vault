import { z } from 'zod';

import {
  createPrivatePayoutFormSchema,
  createPrivatePayoutResultSchema as protocolCreatePrivatePayoutResultSchema,
  payoutStatusSchema as protocolPayoutStatusSchema,
  protocolDisclosureLevelSchema,
} from '@/features/protocol/schema';

export const disclosureLevelSchema = protocolDisclosureLevelSchema;

export const createPayoutFormSchema = createPrivatePayoutFormSchema;

export const createPrivatePayoutResultSchema = protocolCreatePrivatePayoutResultSchema;

export const payoutStatusSchema = protocolPayoutStatusSchema;

export type DisclosureLevel = z.infer<typeof disclosureLevelSchema>;
export type CreatePayoutFormInput = z.input<typeof createPayoutFormSchema>;
export type CreatePayoutFormValues = z.output<typeof createPayoutFormSchema>;
export type CreatePrivatePayoutResult = z.infer<typeof createPrivatePayoutResultSchema>;
export type PayoutStatus = z.infer<typeof payoutStatusSchema>;
