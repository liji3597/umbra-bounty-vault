// @vitest-environment node
import {
  Keypair,
  SystemInstruction,
  type Transaction,
} from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import { createDevnetUmbraService } from './devnetUmbraService';
import { SOLANA_WRAPPED_SOL_MINT } from './solanaPayoutProgram';

const BLOCKHASH = '11111111111111111111111111111111';
const ONE_POINT_TWO_FIVE_SOL_LAMPORTS = BigInt(1_250_000_000);
const MEMO_PROGRAM_ADDRESS = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const DEVNET_UNSUPPORTED_METHOD_MESSAGE = 'Only createPrivatePayout is wired to the live devnet gateway right now.';

describe('devnetUmbraService', () => {
  it('submits and confirms a devnet payout transaction through the injected authority', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();
    const getLatestBlockhashAndContext = vi.fn().mockResolvedValue({
      context: {
        slot: 42,
      },
      value: {
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 123,
      },
    });
    const confirmTransaction = vi.fn().mockResolvedValue({
      value: {
        err: null,
      },
    });
    const submitTransaction = vi.fn().mockResolvedValue('signature-1');
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction,
      },
      connection: {
        confirmTransaction,
        getLatestBlockhashAndContext,
      },
    });

    await expect(
      service.createPrivatePayout({
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).resolves.toEqual({
      payoutId: 'signature-1',
      transactionHash: 'signature-1',
      status: 'confirmed',
    });

    expect(getLatestBlockhashAndContext).toHaveBeenCalledWith('confirmed');
    expect(submitTransaction).toHaveBeenCalledTimes(1);
    expect(submitTransaction).toHaveBeenCalledWith(expect.anything(), 42);
    expect(confirmTransaction).toHaveBeenCalledWith(
      {
        signature: 'signature-1',
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 123,
      },
      'confirmed',
    );

    const transaction = submitTransaction.mock.calls[0][0] as Transaction;
    const transferInstruction = SystemInstruction.decodeTransfer(transaction.instructions[0]);

    expect(transaction.feePayer?.toBase58()).toBe(sender);
    expect(transaction.instructions).toHaveLength(1);
    expect(SystemInstruction.decodeInstructionType(transaction.instructions[0])).toBe('Transfer');
    expect(transferInstruction.fromPubkey.toBase58()).toBe(sender);
    expect(transferInstruction.toPubkey.toBase58()).toBe(recipient);
    expect(transferInstruction.lamports).toBe(ONE_POINT_TWO_FIVE_SOL_LAMPORTS);
  });

  it('includes the memo instruction in the submitted transaction when memo text is provided', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();
    const getLatestBlockhashAndContext = vi.fn().mockResolvedValue({
      context: { slot: 11 },
      value: {
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 123,
      },
    });
    const confirmTransaction = vi.fn().mockResolvedValue({
      value: {
        err: null,
      },
    });
    const submitTransaction = vi.fn().mockResolvedValue('signature-memo');
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction,
      },
      connection: {
        confirmTransaction,
        getLatestBlockhashAndContext,
      },
    });

    await expect(
      service.createPrivatePayout({
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: 'bounty-1',
        disclosureLevel: 'none',
      }),
    ).resolves.toEqual({
      payoutId: 'signature-memo',
      transactionHash: 'signature-memo',
      status: 'confirmed',
    });

    const transaction = submitTransaction.mock.calls[0][0] as Transaction;

    expect(transaction.instructions).toHaveLength(2);
    expect(transaction.instructions[1]?.programId.toBase58()).toBe(MEMO_PROGRAM_ADDRESS);
    expect(new TextDecoder().decode(transaction.instructions[1]?.data)).toBe('bounty-1');
  });

  it('maps invalid payout parameters to a classified submission error', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const getLatestBlockhashAndContext = vi.fn().mockResolvedValue({
      context: { slot: 1 },
      value: {
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 100,
      },
    });
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction: vi.fn(),
      },
      connection: {
        confirmTransaction: vi.fn(),
        getLatestBlockhashAndContext,
      },
    });

    await expect(
      service.createPrivatePayout({
        recipient: 'alice.sol',
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).rejects.toMatchObject({
      name: 'PayoutSubmissionError',
      reason: 'parameter',
    });

    expect(getLatestBlockhashAndContext).not.toHaveBeenCalled();
  });

  it('rejects unsupported disclosure levels before submission', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const submitTransaction = vi.fn();
    const getLatestBlockhashAndContext = vi.fn().mockResolvedValue({
      context: { slot: 1 },
      value: {
        blockhash: BLOCKHASH,
        lastValidBlockHeight: 100,
      },
    });
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction,
      },
      connection: {
        confirmTransaction: vi.fn(),
        getLatestBlockhashAndContext,
      },
    });

    await expect(
      service.createPrivatePayout({
        recipient: Keypair.generate().publicKey.toBase58(),
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).rejects.toMatchObject({
      name: 'PayoutSubmissionError',
      reason: 'parameter',
    });

    expect(getLatestBlockhashAndContext).not.toHaveBeenCalled();
    expect(submitTransaction).not.toHaveBeenCalled();
  });

  it('maps signing failures from the authority to a classified submission error', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction: vi.fn().mockRejectedValue(new Error('User rejected the signature request.')),
      },
      connection: {
        confirmTransaction: vi.fn(),
        getLatestBlockhashAndContext: vi.fn().mockResolvedValue({
          context: { slot: 7 },
          value: {
            blockhash: BLOCKHASH,
            lastValidBlockHeight: 200,
          },
        }),
      },
    });

    await expect(
      service.createPrivatePayout({
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).rejects.toMatchObject({
      name: 'PayoutSubmissionError',
      reason: 'signing',
    });
  });

  it('maps confirmation failures to a classified network error', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const recipient = Keypair.generate().publicKey.toBase58();
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction: vi.fn().mockResolvedValue('signature-2'),
      },
      connection: {
        confirmTransaction: vi.fn().mockResolvedValue({
          value: {
            err: {
              InstructionError: [0, 'Custom'],
            },
          },
        }),
        getLatestBlockhashAndContext: vi.fn().mockResolvedValue({
          context: { slot: 9 },
          value: {
            blockhash: BLOCKHASH,
            lastValidBlockHeight: 300,
          },
        }),
      },
    });

    await expect(
      service.createPrivatePayout({
        recipient,
        tokenMint: SOLANA_WRAPPED_SOL_MINT,
        amount: '1.25',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).rejects.toMatchObject({
      name: 'PayoutSubmissionError',
      reason: 'network',
    });
  });

  it('keeps non-create methods explicitly unsupported on the live devnet gateway', async () => {
    const sender = Keypair.generate().publicKey.toBase58();
    const getLatestBlockhashAndContext = vi.fn();
    const confirmTransaction = vi.fn();
    const submitTransaction = vi.fn();
    const service = createDevnetUmbraService({
      authority: {
        walletAddress: sender,
        submitTransaction,
      },
      connection: {
        confirmTransaction,
        getLatestBlockhashAndContext,
      },
    });

    await expect(service.getPayoutStatus('payout-1')).rejects.toThrow(
      `getPayoutStatus is not supported by the current devnet gateway. ${DEVNET_UNSUPPORTED_METHOD_MESSAGE}`,
    );
    await expect(
      service.scanClaimablePayouts({
        walletAddress: sender,
        network: 'devnet',
      }),
    ).rejects.toThrow(
      `scanClaimablePayouts is not supported by the current devnet gateway. ${DEVNET_UNSUPPORTED_METHOD_MESSAGE}`,
    );
    await expect(
      service.claimPrivatePayout({
        payoutId: 'payout-1',
        walletAddress: sender,
        network: 'devnet',
      }),
    ).rejects.toThrow(
      `claimPrivatePayout is not supported by the current devnet gateway. ${DEVNET_UNSUPPORTED_METHOD_MESSAGE}`,
    );
    await expect(
      service.buildDisclosureView({
        payoutId: 'payout-1',
        level: 'none',
        viewerRole: 'recipient',
      }),
    ).rejects.toThrow(
      `buildDisclosureView is not supported by the current devnet gateway. ${DEVNET_UNSUPPORTED_METHOD_MESSAGE}`,
    );

    expect(getLatestBlockhashAndContext).not.toHaveBeenCalled();
    expect(confirmTransaction).not.toHaveBeenCalled();
    expect(submitTransaction).not.toHaveBeenCalled();
  });
});
