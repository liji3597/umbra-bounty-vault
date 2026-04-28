import { z } from 'zod';

import {
  buildDisclosureViewInputSchema,
  claimPrivatePayoutInputSchema,
  claimPrivatePayoutResultSchema,
  claimablePayoutSchema,
  createPrivatePayoutFormSchema,
  createPrivatePayoutResultSchema,
  disclosureViewSchema,
  payoutStatusSchema,
  scanClaimablePayoutsInputSchema,
} from './schema';

import { classifyPayoutSubmissionError } from './payoutSubmission';
import type { UmbraService, UmbraServiceGateway } from './umbraService.types';

function createNotImplementedMethod(methodName: keyof UmbraServiceGateway) {
  return async () => {
    throw new Error(`${methodName} is not implemented`);
  };
}

export function createUmbraService(gateway: UmbraServiceGateway): UmbraService {
  return {
    async createPrivatePayout(input) {
      let parsedInput;

      try {
        parsedInput = createPrivatePayoutFormSchema.parse(input);
      } catch (error: unknown) {
        const classifiedError = classifyPayoutSubmissionError(error);

        if (classifiedError) {
          throw classifiedError;
        }

        throw error;
      }

      let result;

      try {
        result = await gateway.createPrivatePayout(parsedInput);
      } catch (error: unknown) {
        const classifiedError = classifyPayoutSubmissionError(error);

        if (classifiedError) {
          throw classifiedError;
        }

        throw error;
      }

      return createPrivatePayoutResultSchema.parse(result);
    },
    async getPayoutStatus(payoutId) {
      const parsedPayoutId = z.string().trim().min(1).parse(payoutId);
      const result = await gateway.getPayoutStatus(parsedPayoutId);

      return payoutStatusSchema.parse(result);
    },
    async scanClaimablePayouts(input) {
      const parsedInput = scanClaimablePayoutsInputSchema.parse(input);
      const result = await gateway.scanClaimablePayouts(parsedInput);

      return z.array(claimablePayoutSchema).parse(result);
    },
    async claimPrivatePayout(input) {
      const parsedInput = claimPrivatePayoutInputSchema.parse(input);
      const result = await gateway.claimPrivatePayout(parsedInput);

      return claimPrivatePayoutResultSchema.parse(result);
    },
    async buildDisclosureView(input) {
      const parsedInput = buildDisclosureViewInputSchema.parse(input);
      const result = await gateway.buildDisclosureView(parsedInput);

      return disclosureViewSchema.parse(result);
    },
  };
}

export function createNotImplementedUmbraService(): UmbraService {
  return createUmbraService({
    createPrivatePayout: createNotImplementedMethod('createPrivatePayout'),
    getPayoutStatus: createNotImplementedMethod('getPayoutStatus'),
    scanClaimablePayouts: createNotImplementedMethod('scanClaimablePayouts'),
    claimPrivatePayout: createNotImplementedMethod('claimPrivatePayout'),
    buildDisclosureView: createNotImplementedMethod('buildDisclosureView'),
  });
}
