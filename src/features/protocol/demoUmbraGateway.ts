import type {
  BuildDisclosureViewInput,
  DisclosureView,
} from '@/features/disclosure/schema';
import type {
  ClaimPrivatePayoutInput,
  ClaimPrivatePayoutResult,
  ClaimablePayout,
  ScanClaimablePayoutsInput,
} from '@/features/claim/schema';
import type {
  CreatePayoutFormValues,
  CreatePrivatePayoutResult,
} from '@/features/payout/schema';

import type { UmbraServiceGateway } from './umbraService.types';

type UnsupportedGatewayMethod = Exclude<
  keyof UmbraServiceGateway,
  'buildDisclosureView' | 'claimPrivatePayout' | 'createPrivatePayout' | 'scanClaimablePayouts'
>;

type DisclosurePreset = Pick<DisclosureView, 'title' | 'summary' | 'revealedFields' | 'verificationArtifacts'>;

function createNotImplementedGatewayMethod(methodName: UnsupportedGatewayMethod) {
  return async () => {
    throw new Error(`${methodName} is not implemented`);
  };
}

function getRecipientSlug(recipient: string): string {
  const recipientSlug = recipient
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return recipientSlug || 'payout';
}

function createPreviewPayoutResult(input: CreatePayoutFormValues): CreatePrivatePayoutResult {
  return {
    payoutId: `preview-${getRecipientSlug(input.recipient)}`,
    transactionHash: `preview-${input.tokenMint.slice(0, 8)}-${input.amount}`,
    status: 'submitted',
  };
}

function getPreviewPayoutId(network: ScanClaimablePayoutsInput['network'], walletAddress: string): string {
  return `preview-${network}-${getRecipientSlug(walletAddress)}`;
}

function createPreviewClaimablePayouts(input: ScanClaimablePayoutsInput): ClaimablePayout[] {
  const payoutId = getPreviewPayoutId(input.network, input.walletAddress);

  if (input.network === 'mainnet') {
    return [
      {
        payoutId,
        senderLabel: 'Umbra Treasury',
        tokenSymbol: 'USDC',
        amount: 125,
        claimStatus: 'claimable',
      },
    ];
  }

  return [
    {
      payoutId,
      senderLabel: 'Umbra Labs',
      tokenSymbol: 'SOL',
      amount: 5,
      claimStatus: 'claimable',
    },
  ];
}

function createPreviewClaimResult(input: ClaimPrivatePayoutInput): ClaimPrivatePayoutResult {
  const expectedPayoutId = getPreviewPayoutId(input.network, input.walletAddress);

  if (input.payoutId !== expectedPayoutId) {
    throw new Error('Preview payout does not belong to the connected wallet session.');
  }

  return {
    payoutId: input.payoutId,
    claimStatus: 'claimed',
    transactionHash: `preview-claim-${getRecipientSlug(input.walletAddress)}-${input.payoutId}`,
  };
}

function getPreviewDisclosurePreset(input: BuildDisclosureViewInput): DisclosurePreset {
  if (input.level === 'none') {
    return {
      title: 'Opaque disclosure view',
      summary: 'No payout fields are revealed for this disclosure package.',
      revealedFields: [],
      verificationArtifacts: [],
    };
  }

  if (input.level === 'partial') {
    switch (input.viewerRole) {
      case 'sender':
        return {
          title: 'Sender disclosure view',
          summary: 'Sender access reveals recipient routing context for this payout preview.',
          revealedFields: ['recipient'],
          verificationArtifacts: ['network-confirmation'],
        };
      case 'recipient':
        return {
          title: 'Recipient disclosure view',
          summary: 'Recipient access reveals expected payout amount for this payout preview.',
          revealedFields: ['amount'],
          verificationArtifacts: ['network-confirmation'],
        };
      case 'reviewer':
      default:
        return {
          title: 'Partial disclosure view',
          summary: 'Only bounded payout context is revealed for this disclosure package.',
          revealedFields: ['recipient'],
          verificationArtifacts: ['network-confirmation'],
        };
    }
  }

  switch (input.viewerRole) {
    case 'sender':
      return {
        title: 'Sender verification package',
        summary: 'Bounded sender access is available for this payout preview.',
        revealedFields: ['recipient', 'amount'],
        verificationArtifacts: ['network-confirmation'],
      };
    case 'recipient':
      return {
        title: 'Recipient verification package',
        summary: 'Bounded recipient access is available for this payout preview.',
        revealedFields: ['amount'],
        verificationArtifacts: ['network-confirmation', 'claim-window'],
      };
    case 'reviewer':
    default:
      return {
        title: 'Verification package ready',
        summary: 'Bounded reviewer access is available for this payout preview.',
        revealedFields: ['recipient', 'amount'],
        verificationArtifacts: ['commitment-proof', 'network-confirmation'],
      };
  }
}

function createPreviewDisclosureView(input: BuildDisclosureViewInput): DisclosureView {
  const preset = getPreviewDisclosurePreset(input);

  return {
    payoutId: input.payoutId,
    level: input.level,
    ...preset,
  };
}

export function createDemoUmbraGateway(): UmbraServiceGateway {
  return {
    async createPrivatePayout(input) {
      return createPreviewPayoutResult(input);
    },
    getPayoutStatus: createNotImplementedGatewayMethod('getPayoutStatus'),
    async scanClaimablePayouts(input) {
      return createPreviewClaimablePayouts(input);
    },
    async claimPrivatePayout(input) {
      return createPreviewClaimResult(input);
    },
    async buildDisclosureView(input) {
      return createPreviewDisclosureView(input);
    },
  };
}
