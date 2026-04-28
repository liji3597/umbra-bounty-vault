import type {
  Connection,
  Transaction,
} from '@solana/web3.js';

import type { CreatePrivatePayoutValues } from './schema';
import { PayoutSubmissionError } from './payoutSubmission';
import {
  assertSolanaPayoutIsSupported,
  buildSolanaPayoutTransaction,
} from './solanaPayoutProgram';
import {
  createUmbraService,
} from './umbraService';
import type {
  UmbraService,
  UmbraServiceGateway,
} from './umbraService.types';

type DevnetUmbraConnection = Pick<Connection, 'confirmTransaction' | 'getLatestBlockhashAndContext'>;

export interface DevnetUmbraAuthority {
  walletAddress: string;
  submitTransaction: (transaction: Transaction, minContextSlot: number) => Promise<string>;
}

export interface DevnetUmbraGatewayConfig {
  authority: DevnetUmbraAuthority;
  connection: DevnetUmbraConnection;
}

type UnsupportedGatewayMethod = Exclude<
  keyof UmbraServiceGateway,
  'createPrivatePayout'
>;

const DEVNET_UNSUPPORTED_METHOD_MESSAGE =
  'Only createPrivatePayout is wired to the live devnet gateway right now.';

function createUnsupportedDevnetGatewayMethod(methodName: UnsupportedGatewayMethod) {
  return async () => {
    throw new Error(`${methodName} is not supported by the current devnet gateway. ${DEVNET_UNSUPPORTED_METHOD_MESSAGE}`);
  };
}

async function submitDevnetPayout(
  input: CreatePrivatePayoutValues,
  config: DevnetUmbraGatewayConfig,
) {
  assertSolanaPayoutIsSupported(config.authority.walletAddress, input);

  const {
    context: { slot: minContextSlot },
    value: { blockhash, lastValidBlockHeight },
  } = await config.connection.getLatestBlockhashAndContext('confirmed');
  const transactionPlan = buildSolanaPayoutTransaction({
    walletAddress: config.authority.walletAddress,
    payout: input,
    network: 'devnet',
    blockhash,
    lastValidBlockHeight,
  });
  const signature = await config.authority.submitTransaction(
    transactionPlan.transaction,
    minContextSlot,
  );
  const confirmation = await config.connection.confirmTransaction(
    {
      signature,
      blockhash,
      lastValidBlockHeight,
    },
    'confirmed',
  );

  if (confirmation.value.err) {
    throw new PayoutSubmissionError('network');
  }

  return {
    payoutId: signature,
    transactionHash: signature,
    status: 'confirmed' as const,
  };
}

export function createDevnetUmbraGateway(
  config: DevnetUmbraGatewayConfig,
): UmbraServiceGateway {
  return {
    async createPrivatePayout(input) {
      return submitDevnetPayout(input, config);
    },
    getPayoutStatus: createUnsupportedDevnetGatewayMethod('getPayoutStatus'),
    scanClaimablePayouts: createUnsupportedDevnetGatewayMethod('scanClaimablePayouts'),
    claimPrivatePayout: createUnsupportedDevnetGatewayMethod('claimPrivatePayout'),
    buildDisclosureView: createUnsupportedDevnetGatewayMethod('buildDisclosureView'),
  };
}

export function createDevnetUmbraService(
  config: DevnetUmbraGatewayConfig,
): UmbraService {
  return createUmbraService(createDevnetUmbraGateway(config));
}
