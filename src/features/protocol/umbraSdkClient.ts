import { PublicKey, VersionedTransaction, clusterApiUrl } from '@solana/web3.js';


import type { QueryUserAccountResult } from '@umbra-privacy/sdk';
import {
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
} from '@umbra-privacy/web-zk-prover';

import type { SupportedWalletNetwork } from '@/features/shared/network';
import type {
  SolanaWalletSignAllTransactions,
  SolanaWalletSignMessage,
  SolanaWalletSignTransaction,
} from '@/providers/WalletProvider';

import type { ClaimablePayout } from './schema';
import type {
  UmbraRecipientRegistrationResolver,
  UmbraRecipientRegistrationResult,
  UmbraServiceGateway,
} from './umbraService.types';
import { PayoutSubmissionError } from './payoutSubmission';
import { parseSolAmountToLamports, SOLANA_WRAPPED_SOL_MINT } from './solanaPayoutProgram';

export const UMBRA_SDK_UNAVAILABLE_MESSAGE =
  'Official Umbra SDK is not configured for this environment yet.';
export const UMBRA_SDK_READ_ONLY_SIGNER_MESSAGE =
  'Official Umbra SDK wallet signing is not wired for this environment yet.';
export const UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE =
  'Official Umbra SDK wallet signer is not available for this session yet.';
export const UMBRA_SDK_SCANNER_UNAVAILABLE_MESSAGE =
  'Official Umbra SDK scanner is not configured for this environment yet.';
export const UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE =
  'Official Umbra SDK claim flow is not configured for this environment yet.';

const LAMPORTS_PER_SOL = BigInt(1_000_000_000);
const SDK_SCAN_TREE_INDEX = BigInt(0);

type UmbraSdkCreateResult = {
  createUtxoSignature: string;
};

type WalletStandardSignTransactionInput = {
  account: WalletStandardAccount;
  transaction: Uint8Array;
};

type WalletStandardSignTransactionOutput = {
  signedTransaction: Uint8Array;
};

type WalletStandardSignMessageInput = {
  account: WalletStandardAccount;
  message: Uint8Array;
};

type WalletStandardSignMessageOutput = {
  signature: Uint8Array;
};

interface WalletStandardAccount {
  address: string;
  publicKey?: Uint8Array;
  chains?: readonly string[];
  features?: readonly string[];
  icon?: string;
  label?: string;
}

interface WalletStandardFeatures {
  'solana:signTransaction'?: {
    signTransaction: (...inputs: WalletStandardSignTransactionInput[]) => Promise<WalletStandardSignTransactionOutput[]>;
  };
  'solana:signMessage'?: {
    signMessage: (...inputs: WalletStandardSignMessageInput[]) => Promise<WalletStandardSignMessageOutput[]>;
  };
}

interface WalletStandardWallet {
  name: string;
  features: WalletStandardFeatures;
}

export interface UmbraSdkModule {
  getUmbraClient: typeof import('@umbra-privacy/sdk').getUmbraClient;
  getUserAccountQuerierFunction: typeof import('@umbra-privacy/sdk').getUserAccountQuerierFunction;
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction:
    typeof import('@umbra-privacy/sdk').getPublicBalanceToReceiverClaimableUtxoCreatorFunction;
  getClaimableUtxoScannerFunction: typeof import('@umbra-privacy/sdk').getClaimableUtxoScannerFunction;
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction:
    typeof import('@umbra-privacy/sdk').getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction;
  getUmbraRelayer: typeof import('@umbra-privacy/sdk').getUmbraRelayer;
  createSignerFromWalletAccount: typeof import('@umbra-privacy/sdk').createSignerFromWalletAccount;
}

export type UmbraSdkModuleLoader = () => Promise<UmbraSdkModule>;
export type UmbraSdkClientStatus = 'ready' | 'unavailable';

type UmbraSigner = Parameters<UmbraSdkModule['getUmbraClient']>[0]['signer'];
type UmbraNetwork = Parameters<UmbraSdkModule['getUmbraClient']>[0]['network'];
type UmbraCreateSignerFromWalletAccount = UmbraSdkModule['createSignerFromWalletAccount'];

export interface UmbraSdkClientConfig {
  network: SupportedWalletNetwork;
  loadSdkModule?: UmbraSdkModuleLoader;
  resolveRecipientRegistration?: UmbraRecipientRegistrationResolver;
  createPrivatePayout?: UmbraServiceGateway['createPrivatePayout'];
  scanClaimablePayouts?: UmbraServiceGateway['scanClaimablePayouts'];
  claimPrivatePayout?: UmbraServiceGateway['claimPrivatePayout'];
  buildDisclosureView?: UmbraServiceGateway['buildDisclosureView'];
  walletAddress?: string | null;
  walletLabel?: string | null;
  signMessage?: SolanaWalletSignMessage | null;
  signTransaction?: SolanaWalletSignTransaction | null;
  signAllTransactions?: SolanaWalletSignAllTransactions | null;
  rpcUrl?: string;
  rpcSubscriptionsUrl?: string;
  indexerApiEndpoint?: string;
  relayerApiEndpoint?: string;
}

export interface UmbraSdkClient {
  network: SupportedWalletNetwork;
  status: UmbraSdkClientStatus;
  loadSdkModule(): Promise<UmbraSdkModule>;
  resolveRecipientRegistration(recipient: string): Promise<UmbraRecipientRegistrationResult>;
  createPrivatePayout?: UmbraServiceGateway['createPrivatePayout'];
  scanClaimablePayouts?: UmbraServiceGateway['scanClaimablePayouts'];
  claimPrivatePayout?: UmbraServiceGateway['claimPrivatePayout'];
  buildDisclosureView?: UmbraServiceGateway['buildDisclosureView'];
}

export async function loadUmbraSdkModule(): Promise<UmbraSdkModule> {
  const sdk = await import('@umbra-privacy/sdk');

  return {
    getUmbraClient: sdk.getUmbraClient,
    getUserAccountQuerierFunction: sdk.getUserAccountQuerierFunction,
    getPublicBalanceToReceiverClaimableUtxoCreatorFunction:
      sdk.getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
    getClaimableUtxoScannerFunction: sdk.getClaimableUtxoScannerFunction,
    getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction:
      sdk.getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
    getUmbraRelayer: sdk.getUmbraRelayer,
    createSignerFromWalletAccount: sdk.createSignerFromWalletAccount,
  };
}

async function loadUnavailableSdkModule(): Promise<never> {
  throw new Error(UMBRA_SDK_UNAVAILABLE_MESSAGE);
}

async function resolveUnavailableRecipientRegistration(): Promise<UmbraRecipientRegistrationResult> {
  return {
    status: 'unavailable',
  };
}

function getUmbraNetwork(network: SupportedWalletNetwork): UmbraNetwork {
  return network === 'mainnet' ? 'mainnet' : 'devnet';
}

function getDefaultRpcUrl(network: SupportedWalletNetwork): string {
  return clusterApiUrl(network === 'mainnet' ? 'mainnet-beta' : 'devnet');
}

function getDefaultRpcSubscriptionsUrl(network: SupportedWalletNetwork): string {
  return getDefaultRpcUrl(network).replace(/^http/i, 'ws');
}

function isSolanaWalletAddress(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function createReadOnlyUmbraSigner(walletAddress: string): UmbraSigner {
  const rejectTransactionSigning: UmbraSigner['signTransaction'] = async () => {
    throw new Error(UMBRA_SDK_READ_ONLY_SIGNER_MESSAGE);
  };
  const rejectTransactionBatchSigning: UmbraSigner['signTransactions'] = async () => {
    throw new Error(UMBRA_SDK_READ_ONLY_SIGNER_MESSAGE);
  };
  const rejectMessageSigning: UmbraSigner['signMessage'] = async () => {
    throw new Error(UMBRA_SDK_READ_ONLY_SIGNER_MESSAGE);
  };

  return {
    address: walletAddress as UmbraSigner['address'],
    signTransaction: rejectTransactionSigning,
    signTransactions: rejectTransactionBatchSigning,
    signMessage: rejectMessageSigning,
  };
}

function stringifyInteger(value: bigint | number | string): string {
  return typeof value === 'bigint' ? value.toString() : String(value);
}

function decodeAddressComponent(value: bigint | number | string): bigint {
  return BigInt(stringifyInteger(value));
}

function decodeAddressFromLowHigh(low: bigint | number | string, high: bigint | number | string): string {
  const bytes = new Uint8Array(32);
  let lowValue = decodeAddressComponent(low);
  let highValue = decodeAddressComponent(high);

  for (let index = 0; index < 16; index += 1) {
    bytes[index] = Number(lowValue & BigInt(0xff));
    lowValue >>= BigInt(8);
    bytes[16 + index] = Number(highValue & BigInt(0xff));
    highValue >>= BigInt(8);
  }

  return new PublicKey(bytes).toBase58();
}

function formatSenderLabel(senderAddress: string): string {
  return `Sender ${senderAddress.slice(0, 4)}…${senderAddress.slice(-4)}`;
}

function parseLamportsToSolAmount(amount: bigint | number | string): number {
  const lamports = decodeAddressComponent(amount);

  if (lamports > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Official Umbra SDK scan amount cannot be represented safely in the claim view.');
  }

  return Number(lamports) / Number(LAMPORTS_PER_SOL);
}

type UmbraScannedUtxoData = {
  amount: bigint | number | string;
  treeIndex: bigint | number | string;
  insertionIndex: bigint | number | string;
  h1Components: {
    senderAddressLow: bigint | number | string;
    senderAddressHigh: bigint | number | string;
    mintAddressLow: bigint | number | string;
    mintAddressHigh: bigint | number | string;
  };
};

type UmbraScannedUtxoResult = {
  selfBurnable: UmbraScannedUtxoData[];
  received: UmbraScannedUtxoData[];
  publicSelfBurnable: UmbraScannedUtxoData[];
  publicReceived: UmbraScannedUtxoData[];
};

type UmbraClaimBatchResult = {
  signatures?: Record<string, string | string[]>;
};

function getSdkClaimPayoutId(utxo: Pick<UmbraScannedUtxoData, 'treeIndex' | 'insertionIndex'>): string {
  return `sdk-${stringifyInteger(utxo.treeIndex)}-${stringifyInteger(utxo.insertionIndex)}`;
}

function getFirstClaimTransactionHash(result: UmbraClaimBatchResult): string | null {
  if (!result.signatures) {
    return null;
  }

  for (const batchSignatures of Object.values(result.signatures)) {
    if (typeof batchSignatures === 'string' && batchSignatures.trim()) {
      return batchSignatures;
    }

    if (Array.isArray(batchSignatures)) {
      const transactionHash = batchSignatures.find(
        (signature): signature is string => typeof signature === 'string' && signature.trim().length > 0,
      );

      if (transactionHash) {
        return transactionHash;
      }
    }
  }

  return null;
}

function findClaimableUtxoByPayoutId(
  scannedUtxos: UmbraScannedUtxoResult,
  payoutId: string,
): UmbraScannedUtxoData | null {
  return scannedUtxos.received.find((utxo) => getSdkClaimPayoutId(utxo) === payoutId) ?? null;
}

function mapScannedUtxoToClaimablePayout(utxo: UmbraScannedUtxoData) {
  const mintAddress = decodeAddressFromLowHigh(
    utxo.h1Components.mintAddressLow,
    utxo.h1Components.mintAddressHigh,
  );

  if (mintAddress !== SOLANA_WRAPPED_SOL_MINT) {
    return null;
  }

  const senderAddress = decodeAddressFromLowHigh(
    utxo.h1Components.senderAddressLow,
    utxo.h1Components.senderAddressHigh,
  );

  return {
    payoutId: getSdkClaimPayoutId(utxo),
    senderLabel: formatSenderLabel(senderAddress),
    tokenSymbol: 'SOL',
    amount: parseLamportsToSolAmount(utxo.amount),
    claimStatus: 'claimable' as const,
  };
}

function deserializeWalletStandardTransaction(transactionBytes: Uint8Array): VersionedTransaction {
  return VersionedTransaction.deserialize(transactionBytes);
}

function serializeWalletStandardTransaction(transaction: unknown): Uint8Array {
  if (!(transaction instanceof VersionedTransaction)) {
    throw new Error(UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE);
  }

  return transaction.serialize();
}

function getWalletStandardChain(network: SupportedWalletNetwork): string {
  return network === 'mainnet' ? 'solana:mainnet' : 'solana:devnet';
}

function createWalletStandardUmbraSigner(
  createSignerFromWalletAccount: UmbraCreateSignerFromWalletAccount,
  config: UmbraSdkClientConfig,
): UmbraSigner | null {
  const { walletAddress, signAllTransactions, signMessage, signTransaction, walletLabel } = config;

  if (!walletAddress || !signMessage || !signTransaction) {
    return null;
  }

  const account: WalletStandardAccount = {
    address: walletAddress,
    publicKey: new PublicKey(walletAddress).toBytes(),
    chains: [getWalletStandardChain(config.network)],
    features: ['solana:signTransaction', 'solana:signMessage'],
    label: walletLabel ?? undefined,
  };
  const wallet: WalletStandardWallet = {
    name: walletLabel ?? 'Wallet Adapter',
    features: {
      'solana:signTransaction': {
        signTransaction: async (...inputs) => {
          if (inputs.length === 1) {
            const signedTransaction = await signTransaction(
              deserializeWalletStandardTransaction(inputs[0].transaction),
            );

            return [
              {
                signedTransaction: serializeWalletStandardTransaction(signedTransaction),
              },
            ];
          }

          const signedTransactions = signAllTransactions
            ? await signAllTransactions(
                inputs.map((input) => deserializeWalletStandardTransaction(input.transaction)),
              )
            : await Promise.all(
                inputs.map(async (input) =>
                  signTransaction(deserializeWalletStandardTransaction(input.transaction)),
                ),
              );

          if (signedTransactions.length !== inputs.length) {
            throw new Error(UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE);
          }

          return signedTransactions.map((signedTransaction) => ({
            signedTransaction: serializeWalletStandardTransaction(signedTransaction),
          }));
        },
      },
      'solana:signMessage': {
        signMessage: async (...inputs) => {
          return Promise.all(
            inputs.map(async (input) => ({
              signature: await signMessage(input.message),
            })),
          );
        },
      },
    },
  };

  return createSignerFromWalletAccount(
    wallet as Parameters<UmbraCreateSignerFromWalletAccount>[0],
    account as Parameters<UmbraCreateSignerFromWalletAccount>[1],
  );
}

function mapQueryUserAccountResultToRegistration(
  result: QueryUserAccountResult,
): UmbraRecipientRegistrationResult {
  if (result.state === 'non_existent') {
    return {
      status: 'unregistered',
      reason: 'non-existent',
    };
  }

  const details = {
    isInitialised: result.data.isInitialised,
    isUserAccountX25519KeyRegistered: result.data.isUserAccountX25519KeyRegistered,
    isUserCommitmentRegistered: result.data.isUserCommitmentRegistered,
    isActiveForAnonymousUsage: result.data.isActiveForAnonymousUsage,
  };

  if (!details.isInitialised) {
    return {
      status: 'unregistered',
      reason: 'account-uninitialized',
      details,
    };
  }

  if (!details.isUserAccountX25519KeyRegistered) {
    return {
      status: 'unregistered',
      reason: 'x25519-missing',
      details,
    };
  }

  if (!details.isUserCommitmentRegistered) {
    return {
      status: 'unregistered',
      reason: 'commitment-missing',
      details,
    };
  }

  if (!details.isActiveForAnonymousUsage) {
    return {
      status: 'unregistered',
      reason: 'anonymous-usage-inactive',
      details,
    };
  }

  return {
    status: 'registered',
    details,
  };
}

function createSdkRecipientRegistrationResolver(
  config: UmbraSdkClientConfig,
): UmbraRecipientRegistrationResolver {
  return async (recipient: string) => {
    if (!config.loadSdkModule || !config.walletAddress || !isSolanaWalletAddress(recipient)) {
      return resolveUnavailableRecipientRegistration();
    }

    try {
      const sdkModule = await config.loadSdkModule();
      const client = await sdkModule.getUmbraClient({
        signer: createReadOnlyUmbraSigner(config.walletAddress),
        network: getUmbraNetwork(config.network),
        rpcUrl: config.rpcUrl ?? getDefaultRpcUrl(config.network),
        rpcSubscriptionsUrl:
          config.rpcSubscriptionsUrl ?? getDefaultRpcSubscriptionsUrl(config.network),
        deferMasterSeedSignature: true,
      });
      const queryUserAccount = sdkModule.getUserAccountQuerierFunction({ client });
      const queryResult = await queryUserAccount(recipient as Parameters<typeof queryUserAccount>[0]);

      return mapQueryUserAccountResultToRegistration(queryResult);
    } catch {
      return resolveUnavailableRecipientRegistration();
    }
  };
}

function createSdkCreatePrivatePayout(
  config: UmbraSdkClientConfig,
): UmbraServiceGateway['createPrivatePayout'] | undefined {
  const { loadSdkModule, signMessage, signTransaction, walletAddress } = config;

  if (!loadSdkModule || !walletAddress || !signMessage || !signTransaction) {
    return undefined;
  }

  return async (input) => {
    if (input.tokenMint !== SOLANA_WRAPPED_SOL_MINT || input.memo) {
      throw new PayoutSubmissionError('parameter');
    }

    if (!isSolanaWalletAddress(input.recipient)) {
      throw new PayoutSubmissionError('parameter');
    }

    const sdkModule = await loadSdkModule();
    const signer = createWalletStandardUmbraSigner(
      sdkModule.createSignerFromWalletAccount,
      config,
    );

    if (!signer) {
      throw new Error(UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE);
    }

    const client = await sdkModule.getUmbraClient({
      signer,
      network: getUmbraNetwork(config.network),
      rpcUrl: config.rpcUrl ?? getDefaultRpcUrl(config.network),
      rpcSubscriptionsUrl:
        config.rpcSubscriptionsUrl ?? getDefaultRpcSubscriptionsUrl(config.network),
    });
    const createUtxo = sdkModule.getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
      { client },
      { zkProver: getCreateReceiverClaimableUtxoFromPublicBalanceProver() },
    );
    const result = (await createUtxo({
      destinationAddress: input.recipient as Parameters<typeof createUtxo>[0]['destinationAddress'],
      mint: input.tokenMint as Parameters<typeof createUtxo>[0]['mint'],
      amount: parseSolAmountToLamports(input.amount) as Parameters<typeof createUtxo>[0]['amount'],
    })) as UmbraSdkCreateResult;

    return {
      payoutId: result.createUtxoSignature,
      transactionHash: result.createUtxoSignature,
      status: 'submitted' as const,
    };
  };
}

function createSdkScanClaimablePayouts(
  config: UmbraSdkClientConfig,
): UmbraServiceGateway['scanClaimablePayouts'] | undefined {
  const { indexerApiEndpoint, loadSdkModule, signMessage, signTransaction, walletAddress } = config;

  if (!loadSdkModule || !walletAddress || !signMessage || !signTransaction || !indexerApiEndpoint) {
    return undefined;
  }

  return async () => {
    const sdkModule = await loadSdkModule();
    const signer = createWalletStandardUmbraSigner(
      sdkModule.createSignerFromWalletAccount,
      config,
    );

    if (!signer) {
      throw new Error(UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE);
    }

    const client = await sdkModule.getUmbraClient({
      signer,
      network: getUmbraNetwork(config.network),
      rpcUrl: config.rpcUrl ?? getDefaultRpcUrl(config.network),
      rpcSubscriptionsUrl:
        config.rpcSubscriptionsUrl ?? getDefaultRpcSubscriptionsUrl(config.network),
      indexerApiEndpoint,
    });
    const scanClaimableUtxos = sdkModule.getClaimableUtxoScannerFunction({ client });
    const scannedUtxos = (await scanClaimableUtxos(
      SDK_SCAN_TREE_INDEX as Parameters<typeof scanClaimableUtxos>[0],
      BigInt(0) as Parameters<typeof scanClaimableUtxos>[1],
    )) as UmbraScannedUtxoResult;

    return scannedUtxos.received
      .map(mapScannedUtxoToClaimablePayout)
      .filter((payout): payout is NonNullable<typeof payout> => payout !== null);
  };
}

function createSdkClaimPrivatePayout(
  config: UmbraSdkClientConfig,
): UmbraServiceGateway['claimPrivatePayout'] | undefined {
  const { indexerApiEndpoint, loadSdkModule, relayerApiEndpoint, signMessage, signTransaction, walletAddress } = config;

  if (!loadSdkModule || !walletAddress || !signMessage || !signTransaction || !indexerApiEndpoint || !relayerApiEndpoint) {
    return undefined;
  }

  return async (input) => {
    const sdkModule = await loadSdkModule();
    const signer = createWalletStandardUmbraSigner(
      sdkModule.createSignerFromWalletAccount,
      config,
    );

    if (!signer) {
      throw new Error(UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE);
    }

    const client = await sdkModule.getUmbraClient({
      signer,
      network: getUmbraNetwork(config.network),
      rpcUrl: config.rpcUrl ?? getDefaultRpcUrl(config.network),
      rpcSubscriptionsUrl:
        config.rpcSubscriptionsUrl ?? getDefaultRpcSubscriptionsUrl(config.network),
      indexerApiEndpoint,
    });
    const scanClaimableUtxos = sdkModule.getClaimableUtxoScannerFunction({ client });
    const scannedUtxos = (await scanClaimableUtxos(
      SDK_SCAN_TREE_INDEX as Parameters<typeof scanClaimableUtxos>[0],
      BigInt(0) as Parameters<typeof scanClaimableUtxos>[1],
    )) as UmbraScannedUtxoResult;
    const claimableUtxo = findClaimableUtxoByPayoutId(scannedUtxos, input.payoutId);

    if (!claimableUtxo) {
      throw new Error('Requested payout is no longer claimable for the current wallet session.');
    }

    const relayer = sdkModule.getUmbraRelayer({
      apiEndpoint: relayerApiEndpoint,
    });

    if (!client.fetchBatchMerkleProof) {
      throw new Error(UMBRA_SDK_CLAIM_UNAVAILABLE_MESSAGE);
    }
    const claim = sdkModule.getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
      { client },
      {
        zkProver: getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver(),
        relayer,
        fetchBatchMerkleProof: client.fetchBatchMerkleProof,
      },
    );
    const result = (await claim([
      claimableUtxo as Parameters<typeof claim>[0][number],
    ])) as UmbraClaimBatchResult;
    const transactionHash = getFirstClaimTransactionHash(result);

    if (!transactionHash) {
      throw new Error('Official Umbra SDK claim did not return a transaction signature.');
    }

    return {
      payoutId: input.payoutId,
      claimStatus: 'pending' as const,
      transactionHash,
    };
  };
}

function createSdkBuildDisclosureView(
  config: UmbraSdkClientConfig,
): UmbraServiceGateway['buildDisclosureView'] | undefined {
  const scanClaimablePayouts = config.scanClaimablePayouts ?? createSdkScanClaimablePayouts(config);
  const walletAddress = config.walletAddress;

  if (!scanClaimablePayouts || !walletAddress) {
    return undefined;
  }

  return async (input) => {
    const claimablePayouts = (await scanClaimablePayouts({
      walletAddress,
      network: config.network,
    })) as ClaimablePayout[];
    const matchingPayout = claimablePayouts.find(
      (claimablePayout) => claimablePayout.payoutId === input.payoutId,
    );

    if (!matchingPayout) {
      throw new Error('Requested payout is no longer available in the current wallet-scoped disclosure context.');
    }

    switch (input.viewerRole) {
      case 'sender':
        return {
          payoutId: input.payoutId,
          level: input.level,
          title: 'Wallet-scoped sender summary',
          summary:
            'This bounded disclosure package is derived from wallet-scoped provider truth and stays limited to an app-level sender summary.',
          revealedFields: input.level === 'none' ? [] : ['network'],
          verificationArtifacts:
            input.level === 'verification-ready' ? ['wallet-session', 'network-confirmation'] : ['wallet-session'],
        };
      case 'reviewer':
        return {
          payoutId: input.payoutId,
          level: input.level,
          title: 'Wallet-scoped reviewer summary',
          summary:
            'This bounded disclosure package is derived from wallet-scoped provider truth and remains an app-level reviewer summary rather than a full protocol artifact.',
          revealedFields:
            input.level === 'none'
              ? []
              : input.level === 'partial'
                ? ['amount']
                : ['amount', 'network'],
          verificationArtifacts:
            input.level === 'verification-ready'
              ? ['wallet-session', 'network-confirmation', 'claimable-state']
              : ['wallet-session'],
        };
      case 'recipient':
      default:
        return {
          payoutId: input.payoutId,
          level: input.level,
          title: 'Wallet-scoped recipient summary',
          summary:
            'This bounded disclosure package is derived from wallet-scoped provider truth and stays limited to an app-level recipient summary.',
          revealedFields:
            input.level === 'none'
              ? []
              : input.level === 'partial'
                ? ['amount']
                : ['amount', 'network'],
          verificationArtifacts:
            input.level === 'verification-ready'
              ? ['wallet-session', 'network-confirmation', 'claimable-state']
              : ['wallet-session'],
        };
    }
  };
}

function hasConfiguredSdkSession(config: UmbraSdkClientConfig): boolean {
  return Boolean(config.loadSdkModule && config.walletAddress);
}

export function createUmbraSdkClient(config: UmbraSdkClientConfig): UmbraSdkClient {
  return {
    network: config.network,
    status: hasConfiguredSdkSession(config) ? 'ready' : 'unavailable',
    loadSdkModule: config.loadSdkModule ?? loadUnavailableSdkModule,
    resolveRecipientRegistration:
      config.resolveRecipientRegistration ?? createSdkRecipientRegistrationResolver(config),
    createPrivatePayout: config.createPrivatePayout ?? createSdkCreatePrivatePayout(config),
    scanClaimablePayouts: config.scanClaimablePayouts ?? createSdkScanClaimablePayouts(config),
    claimPrivatePayout: config.claimPrivatePayout ?? createSdkClaimPrivatePayout(config),
    buildDisclosureView: config.buildDisclosureView ?? createSdkBuildDisclosureView(config),
  };
}

export function createUnavailableUmbraSdkClient(
  network: SupportedWalletNetwork,
): UmbraSdkClient {
  return createUmbraSdkClient({ network });
}
