import { z } from 'zod';

import {
  buildDisclosureViewInputSchema as protocolBuildDisclosureViewInputSchema,
  disclosureViewSchema as protocolDisclosureViewSchema,
} from '@/features/protocol/schema';

export const buildDisclosureViewInputSchema = protocolBuildDisclosureViewInputSchema;
export const disclosureViewSchema = protocolDisclosureViewSchema;

export type BuildDisclosureViewInput = z.infer<typeof buildDisclosureViewInputSchema>;
export type DisclosureView = z.infer<typeof disclosureViewSchema>;
