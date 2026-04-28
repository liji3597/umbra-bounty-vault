import {
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
} from '@solana/web3.js';
import { Buffer } from 'buffer';

import type { SupportedWalletNetwork } from '@/features/shared/network';

import { PayoutSubmissionError } from './payoutSubmission';
import type {
  CreatePrivatePayoutValues,
  ProtocolDisclosureLevel,
} from './schema';

const MAINNET_CLUSTER = 'mainnet-beta';
const SOLANA_DECIMALS = 9;
const SOLANA_LAMPORT_MULTIPLIER = BigInt(1_000_000_000);
const SOLANA_AMOUNT_PATTERN = /^\d+(?:\.\d+)?$/;
const MAX_SAFE_TRANSFER_LAMPORTS = BigInt(Number.MAX_SAFE_INTEGER);
const ZERO_LAMPORTS = BigInt(0);
const MAX_SOLANA_MEMO_BYTES = 512;
const MAX_SOLANA_TRANSACTION_BYTES = 1232;
const SOLANA_MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const SUPPORTED_DISCLOSURE_LEVEL: ProtocolDisclosureLevel = 'none';

export const SOLANA_WRAPPED_SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface BuildSolanaPayoutTransactionInput {
  walletAddress: string;
  payout: CreatePrivatePayoutValues;
  network: SupportedWalletNetwork;
  blockhash: string;
  lastValidBlockHeight: number;
}

export interface SolanaPayoutTransactionPlan {
  transaction: Transaction;
  sender: PublicKey;
  recipient: PublicKey;
  lamports: bigint;
  rpcEndpoint: string;
}

interface ParsedSolanaPayoutParameters {
  sender: PublicKey;
  recipient: PublicKey;
  lamports: bigint;
  memoData: Buffer | null;
}

function createParameterError(): PayoutSubmissionError {
  return new PayoutSubmissionError('parameter');
}

function parseWalletAddress(value: string): PublicKey {
  try {
    return new PublicKey(value);
  } catch {
    throw createParameterError();
  }
}

function assertSupportedTokenMint(tokenMint: string): void {
  if (tokenMint !== SOLANA_WRAPPED_SOL_MINT) {
    throw createParameterError();
  }
}

function assertSupportedDisclosureLevel(disclosureLevel: ProtocolDisclosureLevel): void {
  if (disclosureLevel !== SUPPORTED_DISCLOSURE_LEVEL) {
    throw createParameterError();
  }
}

function parseMemoData(memo: string | null): Buffer | null {
  if (!memo) {
    return null;
  }

  const memoData = Buffer.from(memo, 'utf8');

  if (memoData.byteLength > MAX_SOLANA_MEMO_BYTES) {
    throw createParameterError();
  }

  return memoData;
}

function buildMemoInstruction(memoData: Buffer): TransactionInstruction {
  return new TransactionInstruction({
    keys: [],
    programId: SOLANA_MEMO_PROGRAM_ID,
    data: memoData,
  });
}

function parseSolanaPayoutParameters(
  walletAddress: string,
  payout: CreatePrivatePayoutValues,
): ParsedSolanaPayoutParameters {
  const sender = parseWalletAddress(walletAddress);
  const recipient = parseWalletAddress(payout.recipient);

  assertSupportedTokenMint(payout.tokenMint);
  assertSupportedDisclosureLevel(payout.disclosureLevel);

  return {
    sender,
    recipient,
    lamports: parseSolAmountToLamports(payout.amount),
    memoData: parseMemoData(payout.memo),
  };
}

function assertTransactionFitsWithinSizeLimit(transaction: Transaction): void {
  try {
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });

    if (serializedTransaction.byteLength > MAX_SOLANA_TRANSACTION_BYTES) {
      throw createParameterError();
    }
  } catch {
    throw createParameterError();
  }
}

export function getSolanaRpcEndpoint(network: SupportedWalletNetwork): string {
  return clusterApiUrl(network === 'mainnet' ? MAINNET_CLUSTER : 'devnet');
}

export function parseSolAmountToLamports(amount: string): bigint {
  const normalizedAmount = amount.trim();

  if (!SOLANA_AMOUNT_PATTERN.test(normalizedAmount)) {
    throw createParameterError();
  }

  const [wholePart, fractionalPart = ''] = normalizedAmount.split('.');

  if (fractionalPart.length > SOLANA_DECIMALS) {
    throw createParameterError();
  }

  const paddedFractionalPart = fractionalPart.padEnd(SOLANA_DECIMALS, '0');
  const lamports =
    BigInt(wholePart) * SOLANA_LAMPORT_MULTIPLIER + BigInt(paddedFractionalPart || '0');

  if (lamports <= ZERO_LAMPORTS) {
    throw createParameterError();
  }

  return lamports;
}

export function assertSolanaPayoutIsSupported(
  walletAddress: string,
  payout: CreatePrivatePayoutValues,
): void {
  parseSolanaPayoutParameters(walletAddress, payout);
}

function toInstructionLamports(lamports: bigint): number {
  if (lamports > MAX_SAFE_TRANSFER_LAMPORTS) {
    throw createParameterError();
  }

  return Number(lamports);
}

export function buildSolanaPayoutTransaction(
  input: BuildSolanaPayoutTransactionInput,
): SolanaPayoutTransactionPlan {
  const {
    sender,
    recipient,
    lamports,
    memoData,
  } = parseSolanaPayoutParameters(input.walletAddress, input.payout);
  const transaction = new Transaction({
    blockhash: input.blockhash,
    lastValidBlockHeight: input.lastValidBlockHeight,
    feePayer: sender,
  }).add(
    SystemProgram.transfer({
      fromPubkey: sender,
      toPubkey: recipient,
      lamports: toInstructionLamports(lamports),
    }),
  );

  if (memoData) {
    transaction.add(buildMemoInstruction(memoData));
  }

  assertTransactionFitsWithinSizeLimit(transaction);

  return {
    transaction,
    sender,
    recipient,
    lamports,
    rpcEndpoint: getSolanaRpcEndpoint(input.network),
  };
}
