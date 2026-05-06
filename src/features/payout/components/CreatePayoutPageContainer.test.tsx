import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WalletContextValue } from '@/providers/WalletProvider';

import type { CreatePayoutFormValues, CreatePrivatePayoutResult } from '../schema';
import type { SubmitCreatePayout } from './CreatePayoutPage';

const mockResolveRecipientRegistration = vi.fn();
const mockSaveDemoFlowSession = vi.fn();
const mockCreatePrivatePayout = vi.fn();
let mockSdkCreateEnabled = false;

vi.mock('@/features/protocol/umbraSdkClient', async () => {
  const actual = await vi.importActual<typeof import('@/features/protocol/umbraSdkClient')>(
    '@/features/protocol/umbraSdkClient',
  );

  return {
    ...actual,
    loadUmbraSdkModule: vi.fn(),
  };
});

vi.mock('@/features/protocol/umbraProviderResolver', async () => {
  const actual = await vi.importActual<typeof import('@/features/protocol/umbraProviderResolver')>(
    '@/features/protocol/umbraProviderResolver',
  );

  return {
    ...actual,
    resolveCreatePayoutProvider: vi.fn((config) => {
      if (config?.loadSdkModule && config.walletAddress) {
        return {
          kind: 'sdk-live' as const,
          capabilities: {
            canCreatePrivatePayout: mockSdkCreateEnabled,
            canScanClaimablePayouts: false,
            canClaimPrivatePayout: false,
            canBuildLiveDisclosure: false,
          },
          service: {
            createPrivatePayout: mockCreatePrivatePayout,
            getPayoutStatus: vi.fn(),
            scanClaimablePayouts: vi.fn(),
            claimPrivatePayout: vi.fn(),
            buildDisclosureView: vi.fn(),
          },
          resolveRecipientRegistration: mockResolveRecipientRegistration,
          createAvailability: mockSdkCreateEnabled
            ? {
                status: 'available' as const,
              }
            : {
                status: 'blocked' as const,
                reason: 'sdk-create-not-wired' as const,
              },
        };
      }

      return actual.resolveCreatePayoutProvider(config);
    }),
  };
});


const mockWallet: WalletContextValue = {
  status: 'disconnected',
  network: 'devnet',
  walletLabel: null,
  message: null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  isSupportedNetwork: true,
  networkLabel: 'Solana Devnet',
  connectionVersion: 0,
  walletAddress: null,
  submitTransaction: null,
  signTransaction: null,
  signAllTransactions: null,
  signMessage: null,
  connection: null,
  demoFlowSession: null,
  saveDemoFlowSession: mockSaveDemoFlowSession,
  updateDemoFlowClaimResult: vi.fn(),
  clearDemoFlowSession: vi.fn(),
};

vi.mock('@/providers/WalletProvider', () => ({
  useWallet: () => mockWallet,
}));

let capturedSubmitCreatePayout: SubmitCreatePayout | null | undefined;
let capturedSubmitUnavailableMessage: string | undefined;
let capturedOnReviewValuesChange:
  | ((values: {
      recipient: string;
      tokenMint: string;
      amount: string;
      memo: string | null;
      disclosureLevel: 'none' | 'partial' | 'verification-ready';
    }) => Promise<string | undefined>)
  | undefined;
let capturedOnSubmitSuccess:
  | ((result: CreatePrivatePayoutResult, values: CreatePayoutFormValues) => void)
  | undefined;

vi.mock('./CreatePayoutPage', () => ({
  CreatePayoutPage: ({
    submitCreatePayout,
    submitUnavailableMessage,
    onReviewValuesChange,
    onSubmitSuccess,
  }: {
    submitCreatePayout?: SubmitCreatePayout | null;
    submitUnavailableMessage?: string;
    onReviewValuesChange?: (values: {
      recipient: string;
      tokenMint: string;
      amount: string;
      memo: string | null;
      disclosureLevel: 'none' | 'partial' | 'verification-ready';
    }) => Promise<string | undefined>;
    onSubmitSuccess?: (result: CreatePrivatePayoutResult, values: CreatePayoutFormValues) => void;
  }) => {
    capturedSubmitCreatePayout = submitCreatePayout;
    capturedSubmitUnavailableMessage = submitUnavailableMessage;
    capturedOnReviewValuesChange = onReviewValuesChange;
    capturedOnSubmitSuccess = onSubmitSuccess;
    return <div>Mock create payout page</div>;
  },
}));

import { CreatePayoutPageContainer } from './CreatePayoutPageContainer';

describe('CreatePayoutPageContainer', () => {
  beforeEach(() => {
    capturedSubmitCreatePayout = undefined;
    capturedSubmitUnavailableMessage = undefined;
    capturedOnReviewValuesChange = undefined;
    capturedOnSubmitSuccess = undefined;
    mockResolveRecipientRegistration.mockReset();
    mockSaveDemoFlowSession.mockReset();
    mockCreatePrivatePayout.mockReset();
    mockSdkCreateEnabled = false;
    mockWallet.status = 'disconnected';
    mockWallet.network = 'devnet';
    mockWallet.walletLabel = null;
    mockWallet.message = null;
    mockWallet.isSupportedNetwork = true;
    mockWallet.networkLabel = 'Solana Devnet';
    mockWallet.connectionVersion = 0;
    mockWallet.walletAddress = null;
    mockWallet.submitTransaction = null;
    mockWallet.signTransaction = null;
    mockWallet.signAllTransactions = null;
    mockWallet.signMessage = null;
    mockWallet.connection = null;
    mockWallet.demoFlowSession = null;
  });

  it('withholds the submit handler when a connected supported wallet has no wallet address yet', () => {
    mockWallet.status = 'connected';

    render(<CreatePayoutPageContainer />);

    expect(screen.getByText('Mock create payout page')).toBeInTheDocument();
    expect(capturedSubmitCreatePayout).toBeNull();
    expect(capturedSubmitUnavailableMessage).toBe(
      'Recipient registration cannot be verified until the connected wallet exposes a Solana address for this session.',
    );
  });

  it('keeps review registration checks unavailable when the wallet address is missing', async () => {
    mockWallet.status = 'connected';

    render(<CreatePayoutPageContainer />);

    await expect(
      capturedOnReviewValuesChange?.({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBe(
      'Recipient registration cannot be verified until the connected wallet exposes a Solana address for this session.',
    );
  });

  it('shows the registered-but-create-unavailable message when sdk-backed registration succeeds', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockResolveRecipientRegistration.mockResolvedValue({ status: 'registered' });

    render(<CreatePayoutPageContainer />);

    expect(capturedSubmitCreatePayout).toBeNull();
    expect(capturedSubmitUnavailableMessage).toBe(
      'Recipient registration is verified, but official Umbra SDK payout creation is not wired for this wallet session yet.',
    );
    await expect(
      capturedOnReviewValuesChange?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBe(
      'Recipient registration is verified, but official Umbra SDK payout creation is not wired for this wallet session yet.',
    );
    expect(mockResolveRecipientRegistration).toHaveBeenCalledWith(
      '11111111111111111111111111111111',
    );
  });

  it('shows a wallet-address-required message when sdk-backed registration stays unavailable for a non-address recipient', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockResolveRecipientRegistration.mockResolvedValue({ status: 'unavailable' });

    render(<CreatePayoutPageContainer />);

    await expect(
      capturedOnReviewValuesChange?.({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBe(
      'Recipient registration currently requires a Solana wallet address for the official Umbra SDK path.',
    );
    expect(mockResolveRecipientRegistration).toHaveBeenCalledWith('alice.sol');
  });

  it('shows the x25519-specific message when sdk-backed registration reports a missing x25519 key', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockResolveRecipientRegistration.mockResolvedValue({
      status: 'unregistered',
      reason: 'x25519-missing',
    });

    render(<CreatePayoutPageContainer />);

    await expect(
      capturedOnReviewValuesChange?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBe(
      'Recipient has not completed Umbra X25519 registration for the current official SDK payout path yet.',
    );
  });

  it('shows the anonymous-usage-specific message when sdk-backed registration is not active for anonymous usage', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockResolveRecipientRegistration.mockResolvedValue({
      status: 'unregistered',
      reason: 'anonymous-usage-inactive',
    });

    render(<CreatePayoutPageContainer />);

    await expect(
      capturedOnReviewValuesChange?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBe(
      'Recipient Umbra account is not active for anonymous usage yet, so the current official SDK payout path remains blocked.',
    );
  });

  it('shows the commitment-specific message when sdk-backed registration reports a missing commitment', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockResolveRecipientRegistration.mockResolvedValue({
      status: 'unregistered',
      reason: 'commitment-missing',
    });

    render(<CreatePayoutPageContainer />);

    await expect(
      capturedOnReviewValuesChange?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBe(
      'Recipient has not completed Umbra commitment registration for the current official SDK payout path yet.',
    );
  });

  it('withholds the submit handler when a connected supported mainnet wallet has no wallet address yet', () => {
    mockWallet.status = 'connected';
    mockWallet.network = 'mainnet';
    mockWallet.networkLabel = 'Solana Mainnet';

    render(<CreatePayoutPageContainer />);

    expect(screen.getByText('Mock create payout page')).toBeInTheDocument();
    expect(capturedSubmitCreatePayout).toBeNull();
    expect(capturedSubmitUnavailableMessage).toBe(
      'Recipient registration cannot be verified until the connected wallet exposes a Solana address for this session.',
    );
  });


  it('injects the sdk-live submit handler when sdk create is available', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockSdkCreateEnabled = true;
    mockCreatePrivatePayout.mockResolvedValue({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted',
    });

    render(<CreatePayoutPageContainer />);

    expect(screen.getByText('Mock create payout page')).toBeInTheDocument();
    expect(capturedSubmitCreatePayout).toBeDefined();
    expect(capturedSubmitUnavailableMessage).toBeUndefined();

    if (!capturedSubmitCreatePayout) {
      throw new Error('Expected sdk-live submit handler to be injected.');
    }

    await expect(
      capturedSubmitCreatePayout({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toEqual({
      payoutId: 'sdk-payout-1',
      transactionHash: 'sdk-signature-1',
      status: 'submitted',
    });
    expect(mockCreatePrivatePayout).toHaveBeenCalledWith({
      recipient: '11111111111111111111111111111111',
      tokenMint: 'So11111111111111111111111111111111111111112',
      amount: '12.5',
      memo: null,
      disclosureLevel: 'partial',
    });
  });

  it('clears the registered review message when sdk create is available', async () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockSdkCreateEnabled = true;
    mockResolveRecipientRegistration.mockResolvedValue({ status: 'registered' });

    render(<CreatePayoutPageContainer />);

    await expect(
      capturedOnReviewValuesChange?.({
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toBeUndefined();
    expect(mockResolveRecipientRegistration).toHaveBeenCalledWith(
      '11111111111111111111111111111111',
    );
  });

  it('does not save demo flow continuity after sdk-live submit success', () => {
    mockWallet.status = 'connected';
    mockWallet.walletAddress = '11111111111111111111111111111111';
    mockSdkCreateEnabled = true;

    render(<CreatePayoutPageContainer />);

    capturedOnSubmitSuccess?.(
      {
        payoutId: 'sdk-payout-1',
        transactionHash: 'sdk-signature-1',
        status: 'submitted',
      },
      {
        recipient: '11111111111111111111111111111111',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      },
    );

    expect(mockSaveDemoFlowSession).not.toHaveBeenCalled();
  });

  it('keeps saving demo flow continuity after demo submit success', () => {
    mockWallet.status = 'disconnected';

    render(<CreatePayoutPageContainer />);

    capturedOnSubmitSuccess?.(
      {
        payoutId: 'demo-payout-1',
        transactionHash: 'demo-signature-1',
        status: 'submitted',
      },
      {
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      },
    );

    expect(mockSaveDemoFlowSession).not.toHaveBeenCalled();
  });


  it('injects the demo submit handler when the connected wallet network is unsupported', async () => {
    mockWallet.status = 'connected';
    mockWallet.network = 'unsupported';
    mockWallet.isSupportedNetwork = false;
    mockWallet.networkLabel = 'Unsupported network';

    render(<CreatePayoutPageContainer />);

    expect(screen.getByText('Mock create payout page')).toBeInTheDocument();
    expect(capturedSubmitCreatePayout).toBeDefined();
    expect(capturedSubmitUnavailableMessage).toBeUndefined();

    if (!capturedSubmitCreatePayout) {
      throw new Error('Expected demo submit handler to be injected.');
    }

    await expect(
      capturedSubmitCreatePayout({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toEqual({
      payoutId: expect.any(String),
      transactionHash: expect.any(String),
      status: 'submitted',
    });
  });
});
