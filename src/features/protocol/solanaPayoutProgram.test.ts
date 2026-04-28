// @vitest-environment node
import {
  Keypair,
  SystemInstruction,
} from '@solana/web3.js';
import { describe, expect, it } from 'vitest';

import { PayoutSubmissionError } from './payoutSubmission';
import {
  SOLANA_WRAPPED_SOL_MINT,
  assertSolanaPayoutIsSupported,
  buildSolanaPayoutTransaction,
  getSolanaRpcEndpoint,
  parseSolAmountToLamports,
} from './solanaPayoutProgram';

const ONE_SOL_LAMPORTS = BigInt(1_000_000_000);
const ONE_POINT_TWO_FIVE_SOL_LAMPORTS = BigInt(1_250_000_000);
const ONE_LAMPORT = BigInt(1);
const MEMO_PROGRAM_ADDRESS = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const MAX_MEMO_TEXT = 'a'.repeat(512);
const TOO_LARGE_MEMO_TEXT = 'a'.repeat(513);

describe('solanaPayoutProgram', () => {
  it('maps supported networks to Solana RPC endpoints', () => {
    expect(getSolanaRpcEndpoint('devnet')).toBe('https://api.devnet.solana.com');
    expect(getSolanaRpcEndpoint('mainnet')).toBe('https://api.mainnet-beta.solana.com/');
  });

  it('parses normalized SOL amounts into lamports', () => {
    expect(parseSolAmountToLamports('1')).toBe(ONE_SOL_LAMPORTS);
    expect(parseSolAmountToLamports('1.25')).toBe(ONE_POINT_TWO_FIVE_SOL_LAMPORTS);
    expect(parseSolAmountToLamports('0.000000001')).toBe(ONE_LAMPORT);
  });

  it('accepts the largest supported memo payload during local validation', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    expect(() =>
      assertSolanaPayoutIsSupported(sender, {
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: MAX_MEMO_TEXT,
        disclosureLevel: 'none',
      }),
    ).not.toThrow();
  });

  it('rejects amounts more precise than one lamport', () => {
    expect(() => parseSolAmountToLamports('0.0000000001')).toThrowError(PayoutSubmissionError);
  });

  it('builds a transfer transaction for the specified recipient', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    const plan = buildSolanaPayoutTransaction({
      walletAddress: sender,
      payout: {
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: null,
        disclosureLevel: 'none',
      },
      network: 'devnet',
      blockhash: '11111111111111111111111111111111',
      lastValidBlockHeight: 123,
    });

    expect(plan.sender.toBase58()).toBe(sender);
    expect(plan.recipient.toBase58()).toBe(recipient);
    expect(plan.lamports).toBe(ONE_POINT_TWO_FIVE_SOL_LAMPORTS);
    expect(plan.rpcEndpoint).toBe('https://api.devnet.solana.com');
    expect(plan.transaction.feePayer?.toBase58()).toBe(sender);
    expect(plan.transaction.instructions).toHaveLength(1);
    expect(SystemInstruction.decodeInstructionType(plan.transaction.instructions[0])).toBe('Transfer');
    expect(SystemInstruction.decodeTransfer(plan.transaction.instructions[0])).toMatchObject({
      fromPubkey: plan.sender,
      toPubkey: plan.recipient,
      lamports: ONE_POINT_TWO_FIVE_SOL_LAMPORTS,
    });
  });

  it('appends a memo instruction when memo text is provided', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    const plan = buildSolanaPayoutTransaction({
      walletAddress: sender,
      payout: {
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: 'bounty-1',
        disclosureLevel: 'none',
      },
      network: 'devnet',
      blockhash: '11111111111111111111111111111111',
      lastValidBlockHeight: 123,
    });

    expect(plan.transaction.instructions).toHaveLength(2);
    expect(plan.transaction.instructions[1]?.programId.toBase58()).toBe(MEMO_PROGRAM_ADDRESS);
    expect(new TextDecoder().decode(plan.transaction.instructions[1]?.data)).toBe('bounty-1');
  });

  it('rejects memo payloads that exceed the supported byte budget', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    expect(() =>
      assertSolanaPayoutIsSupported(sender, {
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: TOO_LARGE_MEMO_TEXT,
        disclosureLevel: 'none',
      }),
    ).toThrowError(PayoutSubmissionError);
  });

  it('rejects transfer amounts beyond the safe runtime instruction range', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    expect(() =>
      buildSolanaPayoutTransaction({
        walletAddress: sender,
        payout: {
          recipient,
          tokenMint: SOLANA_WRAPPED_SOL_MINT,
          amount: '9007199.254740992',
          memo: null,
          disclosureLevel: 'none',
        },
        network: 'devnet',
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 321,
      }),
    ).toThrowError(PayoutSubmissionError);
  });

  it('rejects unsupported token mints', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    expect(() =>
      buildSolanaPayoutTransaction({
        walletAddress: sender,
        payout: {
          recipient,
          tokenMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          amount: '1',
          memo: null,
          disclosureLevel: 'none',
        },
        network: 'devnet',
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 456,
      }),
    ).toThrowError(PayoutSubmissionError);
  });

  it('rejects unsupported disclosure levels', () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();

    expect(() =>
      buildSolanaPayoutTransaction({
        walletAddress: sender,
        payout: {
          recipient,
          tokenMint: SOLANA_WRAPPED_SOL_MINT,
          amount: '1',
          memo: null,
          disclosureLevel: 'partial',
        },
        network: 'devnet',
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 789,
      }),
    ).toThrowError(PayoutSubmissionError);
  });

  it('rejects invalid recipient addresses', () => {
    const sender = Keypair.generate().publicKey.toBase58();

    expect(() =>
      buildSolanaPayoutTransaction({
        walletAddress: sender,
        payout: {
          recipient: 'alice.sol',
          tokenMint: SOLANA_WRAPPED_SOL_MINT,
          amount: '1',
          memo: null,
          disclosureLevel: 'none',
        },
        network: 'devnet',
        blockhash: '11111111111111111111111111111111',
        lastValidBlockHeight: 789,
      }),
    ).toThrowError(PayoutSubmissionError);
  });
});
