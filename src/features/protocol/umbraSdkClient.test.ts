import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { describe, expect, it, vi } from 'vitest';

import type { QueryUserAccountResult } from '@umbra-privacy/sdk';

import {
  createUmbraSdkClient,
  createUnavailableUmbraSdkClient,
  UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE,
  UMBRA_SDK_UNAVAILABLE_MESSAGE,
} from './umbraSdkClient';

type RegistrationDataOverrides = Partial<{
  isInitialised: boolean;
  isActiveForAnonymousUsage: boolean;
  isUserCommitmentRegistered: boolean;
  isUserAccountX25519KeyRegistered: boolean;
}>;

function createExistingUserAccountResult(
  overrides: RegistrationDataOverrides = {},
): QueryUserAccountResult {
  return {
    state: 'exists',
    data: {
      isInitialised: true,
      isActiveForAnonymousUsage: true,
      isUserCommitmentRegistered: true,
      isUserAccountX25519KeyRegistered: true,
      ...overrides,
    } as unknown as Extract<QueryUserAccountResult, { state: 'exists' }>['data'],
  };
}

function createVersionedTransaction(): VersionedTransaction {
  return Object.assign(Object.create(VersionedTransaction.prototype), {
    serialize: vi.fn().mockReturnValue(new Uint8Array([7, 8, 9])),
  }) as VersionedTransaction;
}

function createAddressLowHigh(address: string): { low: bigint; high: bigint } {
  const bytes = new PublicKey(address).toBytes();
  let low = BigInt(0);
  let high = BigInt(0);

  for (let index = 15; index >= 0; index -= 1) {
    low = (low << BigInt(8)) | BigInt(bytes[index]);
    high = (high << BigInt(8)) | BigInt(bytes[16 + index]);
  }

  return { low, high };
}

describe('umbraSdkClient', () => {
  it('marks the client ready when an SDK module loader and wallet address are configured', async () => {
    const sdkModule = {
      name: 'umbra-sdk-module',
    } as unknown as Awaited<ReturnType<ReturnType<typeof createUmbraSdkClient>['loadSdkModule']>>;
    const loadSdkModule = vi.fn().mockResolvedValue(sdkModule);
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
    });

    expect(client.network).toBe('devnet');
    expect(client.status).toBe('ready');
    await expect(client.loadSdkModule()).resolves.toBe(sdkModule);
    expect(loadSdkModule).toHaveBeenCalledTimes(1);
  });

  it('keeps an injected create payout gateway on the client', async () => {
    const createPrivatePayout = vi.fn().mockResolvedValue({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted' as const,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      createPrivatePayout,
    });

    expect(client.createPrivatePayout).toBe(createPrivatePayout);
    await expect(
      client.createPrivatePayout?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '1',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted',
    });
  });

  it('builds an sdk live create gateway when wallet signing is configured', async () => {
    const originalDeserialize = VersionedTransaction.deserialize;
    const deserializeSpy = vi
      .spyOn(VersionedTransaction, 'deserialize')
      .mockReturnValue(createVersionedTransaction());
    const signedTransaction = createVersionedTransaction();
    const signTransaction = vi.fn().mockResolvedValue(signedTransaction);
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const capturedWallets: Array<{ wallet: unknown; account: unknown }> = [];
    const sdkSigner = { address: '11111111111111111111111111111111' };
    const createSignerFromWalletAccount = vi.fn((wallet, account) => {
      capturedWallets.push({ wallet, account });
      return sdkSigner;
    });
    const createUtxo = vi.fn().mockResolvedValue({
      createUtxoSignature: 'sdk-create-signature-1',
    });
    const getPublicBalanceToReceiverClaimableUtxoCreatorFunction = vi.fn().mockReturnValue(createUtxo);
    const getUmbraClient = vi.fn().mockResolvedValue({ client: 'sdk-client' });
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient,
      getUserAccountQuerierFunction: vi.fn(),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
      createSignerFromWalletAccount,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      walletLabel: 'Phantom',
      signTransaction,
      signMessage,
    });

    await expect(
      client.createPrivatePayout?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '1.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-create-signature-1',
      transactionHash: 'sdk-create-signature-1',
      status: 'submitted',
    });
    expect(loadSdkModule).toHaveBeenCalledTimes(1);
    expect(createSignerFromWalletAccount).toHaveBeenCalledTimes(1);
    expect(capturedWallets).toHaveLength(1);
    expect(capturedWallets[0]).toEqual({
      wallet: expect.objectContaining({
        name: 'Phantom',
        features: expect.objectContaining({
          'solana:signTransaction': expect.objectContaining({
            signTransaction: expect.any(Function),
          }),
          'solana:signMessage': expect.objectContaining({
            signMessage: expect.any(Function),
          }),
        }),
      }),
      account: expect.objectContaining({
        address: '11111111111111111111111111111111',
        chains: ['solana:devnet'],
        features: ['solana:signTransaction', 'solana:signMessage'],
        label: 'Phantom',
        publicKey: expect.any(Uint8Array),
      }),
    });
    expect(getUmbraClient).toHaveBeenCalledWith({
      signer: sdkSigner,
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      rpcSubscriptionsUrl: 'wss://api.devnet.solana.com',
    });
    expect(getPublicBalanceToReceiverClaimableUtxoCreatorFunction).toHaveBeenCalledWith(
      { client: { client: 'sdk-client' } },
      { zkProver: expect.any(Object) },
    );
    expect(createUtxo).toHaveBeenCalledWith({
      destinationAddress: '11111111111111111111111111111111',
      mint: 'So11111111111111111111111111111111111111112',
      amount: BigInt('1500000000'),
    });
    deserializeSpy.mockImplementation(originalDeserialize);
  });

  it('uses mainnet Wallet Standard chain metadata for mainnet sdk signer sessions', async () => {
    const signTransaction = vi.fn().mockResolvedValue(createVersionedTransaction());
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const capturedWallets: Array<{ wallet: unknown; account: unknown }> = [];
    const createSignerFromWalletAccount = vi.fn((wallet, account) => {
      capturedWallets.push({ wallet, account });
      return { address: '11111111111111111111111111111111' };
    });
    const createUtxo = vi.fn().mockResolvedValue({
      createUtxoSignature: 'sdk-create-signature-1',
    });
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient: vi.fn().mockResolvedValue({}),
      getUserAccountQuerierFunction: vi.fn(),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction: vi.fn().mockReturnValue(createUtxo),
      createSignerFromWalletAccount,
    });
    const client = createUmbraSdkClient({
      network: 'mainnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      signTransaction,
      signMessage,
    });

    await client.createPrivatePayout?.({
      recipient: '11111111111111111111111111111111',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '1',
      memo: null,
      disclosureLevel: 'none',
    });

    expect(capturedWallets).toHaveLength(1);
    expect(capturedWallets[0]).toEqual({
      wallet: expect.objectContaining({
        name: 'Wallet Adapter',
      }),
      account: expect.objectContaining({
        address: '11111111111111111111111111111111',
        chains: ['solana:mainnet'],
      }),
    });
  });

  it('falls back to per-transaction signing when batch signing is unavailable', async () => {
    const originalDeserialize = VersionedTransaction.deserialize;
    const deserializeSpy = vi
      .spyOn(VersionedTransaction, 'deserialize')
      .mockReturnValue(createVersionedTransaction());
    const signTransaction = vi.fn().mockResolvedValue(createVersionedTransaction());
    let capturedWallet:
      | {
          features: {
            'solana:signTransaction': {
              signTransaction: (...inputs: Array<{ account: unknown; transaction: Uint8Array }>) => Promise<Array<{ signedTransaction: Uint8Array }>>;
            };
          };
        }
      | undefined;
    const createSignerFromWalletAccount = vi.fn((wallet) => {
      capturedWallet = wallet as typeof capturedWallet;
      return { address: '11111111111111111111111111111111' };
    });
    const createUtxo = vi.fn().mockResolvedValue({
      createUtxoSignature: 'sdk-create-signature-1',
    });
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient: vi.fn().mockResolvedValue({}),
      getUserAccountQuerierFunction: vi.fn(),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction: vi.fn().mockReturnValue(createUtxo),
      createSignerFromWalletAccount,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      signTransaction,
      signMessage: vi.fn().mockResolvedValue(new Uint8Array([1])),
    });

    await client.createPrivatePayout?.({
      recipient: '11111111111111111111111111111111',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '1',
      memo: null,
      disclosureLevel: 'none',
    });

    if (!capturedWallet) {
      throw new Error('Expected Wallet Standard signer wrapper to be captured.');
    }

    await capturedWallet.features['solana:signTransaction'].signTransaction(
      { account: {}, transaction: new Uint8Array([1]) },
      { account: {}, transaction: new Uint8Array([2]) },
    );

    expect(signTransaction).toHaveBeenCalledTimes(2);
    deserializeSpy.mockImplementation(originalDeserialize);
  });

  it('throws when sdk live create is invoked after signer construction becomes unavailable', async () => {
    const createSignerFromWalletAccount = vi.fn().mockReturnValue(null);
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient: vi.fn(),
      getUserAccountQuerierFunction: vi.fn(),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction: vi.fn(),
      createSignerFromWalletAccount,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      signTransaction: vi.fn(),
      signMessage: vi.fn().mockResolvedValue(new Uint8Array([1])),
    });

    await expect(
      client.createPrivatePayout?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '1',
        memo: null,
        disclosureLevel: 'none',
      }),
    ).rejects.toThrow(UMBRA_SDK_SIGNER_UNAVAILABLE_MESSAGE);
  });

  it('uses the injected recipient registration resolver when available', async () => {
    const resolveRecipientRegistration = vi.fn().mockResolvedValue({
      status: 'registered' as const,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      resolveRecipientRegistration,
    });

    await expect(client.resolveRecipientRegistration('alice.sol')).resolves.toEqual({
      status: 'registered',
    });
    expect(resolveRecipientRegistration).toHaveBeenCalledWith('alice.sol');
  });

  it('maps a fully registered SDK user account to registered with readiness details', async () => {
    const queryUserAccount = vi.fn<
      (recipient: string) => Promise<QueryUserAccountResult>
    >().mockResolvedValue(createExistingUserAccountResult());
    const getUmbraClient = vi.fn().mockResolvedValue({});
    const getUserAccountQuerierFunction = vi.fn().mockReturnValue(queryUserAccount);
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient,
      getUserAccountQuerierFunction,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      rpcUrl: 'https://rpc.example.com',
      rpcSubscriptionsUrl: 'wss://rpc.example.com',
    });

    await expect(client.resolveRecipientRegistration('11111111111111111111111111111111')).resolves.toEqual({
      status: 'registered',
      details: {
        isInitialised: true,
        isUserAccountX25519KeyRegistered: true,
        isUserCommitmentRegistered: true,
        isActiveForAnonymousUsage: true,
      },
    });
    expect(loadSdkModule).toHaveBeenCalledTimes(1);
    expect(getUmbraClient).toHaveBeenCalledWith({
      signer: expect.objectContaining({
        address: '11111111111111111111111111111111',
        signMessage: expect.any(Function),
        signTransaction: expect.any(Function),
        signTransactions: expect.any(Function),
      }),
      network: 'devnet',
      rpcUrl: 'https://rpc.example.com',
      rpcSubscriptionsUrl: 'wss://rpc.example.com',
      deferMasterSeedSignature: true,
    });
    expect(getUserAccountQuerierFunction).toHaveBeenCalledWith({ client: {} });
    expect(queryUserAccount).toHaveBeenCalledWith('11111111111111111111111111111111');
  });

  it('maps a missing SDK user account to unregistered with a non-existent reason', async () => {
    const queryUserAccount = vi.fn<
      (recipient: string) => Promise<QueryUserAccountResult>
    >().mockResolvedValue({
      state: 'non_existent',
    });
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient: vi.fn().mockResolvedValue({}),
      getUserAccountQuerierFunction: vi.fn().mockReturnValue(queryUserAccount),
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
    });

    await expect(client.resolveRecipientRegistration('11111111111111111111111111111111')).resolves.toEqual({
      status: 'unregistered',
      reason: 'non-existent',
    });
  });

  it('maps a user account without x25519 registration to unregistered with details', async () => {
    const queryUserAccount = vi.fn<
      (recipient: string) => Promise<QueryUserAccountResult>
    >().mockResolvedValue(
      createExistingUserAccountResult({
        isUserAccountX25519KeyRegistered: false,
        isActiveForAnonymousUsage: false,
      }),
    );
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({
        getUmbraClient: vi.fn().mockResolvedValue({}),
        getUserAccountQuerierFunction: vi.fn().mockReturnValue(queryUserAccount),
      }),
      walletAddress: '11111111111111111111111111111111',
    });

    await expect(client.resolveRecipientRegistration('11111111111111111111111111111111')).resolves.toEqual({
      status: 'unregistered',
      reason: 'x25519-missing',
      details: {
        isInitialised: true,
        isUserAccountX25519KeyRegistered: false,
        isUserCommitmentRegistered: true,
        isActiveForAnonymousUsage: false,
      },
    });
  });

  it('maps a user account without commitment registration to unregistered with details', async () => {
    const queryUserAccount = vi.fn<
      (recipient: string) => Promise<QueryUserAccountResult>
    >().mockResolvedValue(
      createExistingUserAccountResult({
        isUserCommitmentRegistered: false,
        isActiveForAnonymousUsage: false,
      }),
    );
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({
        getUmbraClient: vi.fn().mockResolvedValue({}),
        getUserAccountQuerierFunction: vi.fn().mockReturnValue(queryUserAccount),
      }),
      walletAddress: '11111111111111111111111111111111',
    });

    await expect(client.resolveRecipientRegistration('11111111111111111111111111111111')).resolves.toEqual({
      status: 'unregistered',
      reason: 'commitment-missing',
      details: {
        isInitialised: true,
        isUserAccountX25519KeyRegistered: true,
        isUserCommitmentRegistered: false,
        isActiveForAnonymousUsage: false,
      },
    });
  });

  it('maps an initialized account with inactive anonymous usage to unregistered with details', async () => {
    const queryUserAccount = vi.fn<
      (recipient: string) => Promise<QueryUserAccountResult>
    >().mockResolvedValue(
      createExistingUserAccountResult({
        isActiveForAnonymousUsage: false,
      }),
    );
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({
        getUmbraClient: vi.fn().mockResolvedValue({}),
        getUserAccountQuerierFunction: vi.fn().mockReturnValue(queryUserAccount),
      }),
      walletAddress: '11111111111111111111111111111111',
    });

    await expect(client.resolveRecipientRegistration('11111111111111111111111111111111')).resolves.toEqual({
      status: 'unregistered',
      reason: 'anonymous-usage-inactive',
      details: {
        isInitialised: true,
        isUserAccountX25519KeyRegistered: true,
        isUserCommitmentRegistered: true,
        isActiveForAnonymousUsage: false,
      },
    });
  });


  it('builds an sdk live scan gateway from received utxos only', async () => {
    const signTransaction = vi.fn().mockResolvedValue(createVersionedTransaction());
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const sdkSigner = { address: '11111111111111111111111111111111' };
    const createSignerFromWalletAccount = vi.fn().mockReturnValue(sdkSigner);
    const senderAddress = '11111111111111111111111111111111';
    const solMint = createAddressLowHigh('So11111111111111111111111111111111111111112');
    const sender = createAddressLowHigh(senderAddress);
    const receivedUtxo = {
      amount: BigInt(1500000000),
      treeIndex: BigInt(0),
      insertionIndex: BigInt(42),
      h1Components: {
        senderAddressLow: sender.low,
        senderAddressHigh: sender.high,
        mintAddressLow: solMint.low,
        mintAddressHigh: solMint.high,
      },
    };
    const publicReceivedUtxo = {
      amount: BigInt(2500000000),
      treeIndex: BigInt(0),
      insertionIndex: BigInt(77),
      h1Components: {
        senderAddressLow: sender.low,
        senderAddressHigh: sender.high,
        mintAddressLow: solMint.low,
        mintAddressHigh: solMint.high,
      },
    };
    const scanClaimableUtxos = vi.fn().mockResolvedValue({
      selfBurnable: [],
      received: [receivedUtxo],
      publicSelfBurnable: [],
      publicReceived: [publicReceivedUtxo],
    });
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient: vi.fn().mockResolvedValue({ client: 'sdk-client' }),
      getUserAccountQuerierFunction: vi.fn(),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction: vi.fn(),
      getClaimableUtxoScannerFunction: vi.fn().mockReturnValue(scanClaimableUtxos),
      createSignerFromWalletAccount,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      walletLabel: 'Phantom',
      signTransaction,
      signMessage,
      indexerApiEndpoint: 'https://indexer.example.com',
    });

    await expect(
      client.scanClaimablePayouts?.({
        walletAddress: '11111111111111111111111111111111',
        network: 'devnet',
      }),
    ).resolves.toEqual([
      {
        payoutId: 'sdk-0-42',
        senderLabel: 'Sender 1111…1111',
        tokenSymbol: 'SOL',
        amount: 1.5,
        claimStatus: 'claimable',
      },
    ]);
  });

  it('derives a disclosure gateway from wallet-scoped scan truth when scan capability is configured', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'sdk-0-42',
        senderLabel: 'Sender 1111…1111',
        tokenSymbol: 'SOL',
        amount: 1.5,
        claimStatus: 'claimable' as const,
      },
    ]);
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      scanClaimablePayouts,
    });

    await expect(
      client.buildDisclosureView?.({
        payoutId: 'sdk-0-42',
        level: 'partial',
        viewerRole: 'recipient',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-0-42',
      level: 'partial',
      title: 'Wallet-scoped recipient summary',
      summary:
        'This bounded disclosure package is derived from wallet-scoped provider truth and stays limited to an app-level recipient summary.',
      revealedFields: ['amount'],
      verificationArtifacts: ['wallet-session'],
    });
    expect(scanClaimablePayouts).toHaveBeenCalledWith({
      walletAddress: '11111111111111111111111111111111',
      network: 'devnet',
    });
  });

  it('keeps disclosure unavailable when only claim capability is configured', () => {
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      claimPrivatePayout: vi.fn(),
    });

    expect(client.buildDisclosureView).toBeUndefined();
  });

  it('rejects disclosure requests for payouts missing from wallet-scoped scan truth', async () => {
    const scanClaimablePayouts = vi.fn().mockResolvedValue([
      {
        payoutId: 'sdk-0-99',
        senderLabel: 'Sender 1111…1111',
        tokenSymbol: 'SOL',
        amount: 1.5,
        claimStatus: 'claimable' as const,
      },
    ]);
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      scanClaimablePayouts,
    });

    await expect(
      client.buildDisclosureView?.({
        payoutId: 'sdk-0-42',
        level: 'partial',
        viewerRole: 'recipient',
      }),
    ).rejects.toThrow('Requested payout is no longer available in the current wallet-scoped disclosure context.');
  });


  it('builds an sdk live claim gateway when scanner, signer, indexer, and relayer are configured', async () => {
    const signTransaction = vi.fn().mockResolvedValue(createVersionedTransaction());
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const sdkSigner = { address: '11111111111111111111111111111111' };
    const createSignerFromWalletAccount = vi.fn().mockReturnValue(sdkSigner);
    const scannedUtxo = {
      amount: BigInt(1500000000),
      treeIndex: BigInt(0),
      insertionIndex: BigInt(42),
      h1Components: {
        senderAddressLow: BigInt(0),
        senderAddressHigh: BigInt(0),
        mintAddressLow: BigInt(0),
        mintAddressHigh: BigInt(0),
      },
    };
    const scanClaimableUtxos = vi.fn().mockResolvedValue({
      selfBurnable: [],
      received: [scannedUtxo],
      publicSelfBurnable: [],
      publicReceived: [],
    });
    const claim = vi.fn().mockResolvedValue({
      signatures: {
        '0': ['sdk-claim-tx-1'],
      },
    });
    const relayer = { name: 'umbra-relayer' };
    const fetchBatchMerkleProof = vi.fn();
    const getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction = vi.fn().mockReturnValue(claim);
    const getUmbraRelayer = vi.fn().mockReturnValue(relayer);
    const sdkClient = { client: 'sdk-client', fetchBatchMerkleProof };
    const getUmbraClient = vi.fn().mockResolvedValue(sdkClient);
    const loadSdkModule = vi.fn().mockResolvedValue({
      getUmbraClient,
      getUserAccountQuerierFunction: vi.fn(),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction: vi.fn(),
      getClaimableUtxoScannerFunction: vi.fn().mockReturnValue(scanClaimableUtxos),
      getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
      getUmbraRelayer,
      createSignerFromWalletAccount,
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule,
      walletAddress: '11111111111111111111111111111111',
      walletLabel: 'Phantom',
      signTransaction,
      signMessage,
      indexerApiEndpoint: 'https://indexer.example.com',
      relayerApiEndpoint: 'https://relayer.example.com',
    });

    await expect(
      client.claimPrivatePayout?.({
        payoutId: 'sdk-0-42',
        walletAddress: '11111111111111111111111111111111',
        network: 'devnet',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-0-42',
      claimStatus: 'pending',
      transactionHash: 'sdk-claim-tx-1',
    });
    expect(loadSdkModule).toHaveBeenCalledTimes(1);
    expect(getUmbraClient).toHaveBeenCalledWith({
      signer: sdkSigner,
      network: 'devnet',
      rpcUrl: 'https://api.devnet.solana.com',
      rpcSubscriptionsUrl: 'wss://api.devnet.solana.com',
      indexerApiEndpoint: 'https://indexer.example.com',
    });
    expect(scanClaimableUtxos).toHaveBeenCalledWith(BigInt(0), BigInt(0));
    expect(getUmbraRelayer).toHaveBeenCalledWith({
      apiEndpoint: 'https://relayer.example.com',
    });
    expect(getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction).toHaveBeenCalledWith(
      { client: sdkClient },
      {
        zkProver: expect.any(Object),
        relayer,
        fetchBatchMerkleProof,
      },
    );
    expect(claim).toHaveBeenCalledWith([scannedUtxo]);
  });

  it('keeps claim unavailable when relayer configuration is missing', () => {
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
      walletAddress: '11111111111111111111111111111111',
      signTransaction: vi.fn(),
      signMessage: vi.fn().mockResolvedValue(new Uint8Array([1])),
      indexerApiEndpoint: 'https://indexer.example.com',
    });

    expect(client.claimPrivatePayout).toBeUndefined();
  });

  it('throws a session-scoped error when the requested sdk payout can no longer be found during claim', async () => {
    const signTransaction = vi.fn().mockResolvedValue(createVersionedTransaction());
    const signMessage = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
    const createSignerFromWalletAccount = vi.fn().mockReturnValue({
      address: '11111111111111111111111111111111',
    });
    const scanClaimableUtxos = vi.fn().mockResolvedValue({
      selfBurnable: [],
      received: [],
      publicSelfBurnable: [],
      publicReceived: [],
    });
    const client = createUmbraSdkClient({
      network: 'devnet',
      loadSdkModule: vi.fn().mockResolvedValue({
        getUmbraClient: vi.fn().mockResolvedValue({ client: 'sdk-client' }),
        getUserAccountQuerierFunction: vi.fn(),
        getPublicBalanceToReceiverClaimableUtxoCreatorFunction: vi.fn(),
        getClaimableUtxoScannerFunction: vi.fn().mockReturnValue(scanClaimableUtxos),
        getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction: vi.fn(),
        getUmbraRelayer: vi.fn(),
        createSignerFromWalletAccount,
      }),
      walletAddress: '11111111111111111111111111111111',
      signTransaction,
      signMessage,
      indexerApiEndpoint: 'https://indexer.example.com',
      relayerApiEndpoint: 'https://relayer.example.com',
    });

    await expect(
      client.claimPrivatePayout?.({
        payoutId: 'sdk-0-42',
        walletAddress: '11111111111111111111111111111111',
        network: 'devnet',
      }),
    ).rejects.toThrow('Requested payout is no longer claimable for the current wallet session.');
  });

  it('marks the client unavailable when no wallet address is configured yet', async () => {
    const client = createUmbraSdkClient({
      network: 'mainnet',
      loadSdkModule: vi.fn().mockResolvedValue({}),
    });

    expect(client.network).toBe('mainnet');
    expect(client.status).toBe('unavailable');
    await expect(client.resolveRecipientRegistration('11111111111111111111111111111111')).resolves.toEqual({
      status: 'unavailable',
    });
  });

  it('marks the client unavailable when no SDK module loader is configured', async () => {
    const client = createUnavailableUmbraSdkClient('mainnet');

    expect(client.network).toBe('mainnet');
    expect(client.status).toBe('unavailable');
    await expect(client.loadSdkModule()).rejects.toThrow(UMBRA_SDK_UNAVAILABLE_MESSAGE);
  });

  it('reports recipient registration as unavailable by default', async () => {
    const client = createUnavailableUmbraSdkClient('devnet');

    await expect(client.resolveRecipientRegistration('alice.sol')).resolves.toEqual({
      status: 'unavailable',
    });
  });
});
