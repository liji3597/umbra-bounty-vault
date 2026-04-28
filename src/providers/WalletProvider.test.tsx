import { StrictMode } from 'react';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CreatePayoutFormValues, CreatePrivatePayoutResult } from '@/features/payout/schema';

import type { WalletProviderState } from './WalletProvider';
import { useWallet, WalletProvider } from './WalletProvider';

interface MockBridgeState {
  connect: ReturnType<typeof vi.fn>;
  connection: null;
  connectionIdentity: string | null;
  connectionVersion: number;
  disconnect: ReturnType<typeof vi.fn>;
  submitTransaction: null;
  walletAddress: string | null;
  walletState: WalletProviderState;
}

const mockBridgeState: MockBridgeState = {
  connect: vi.fn(),
  connection: null,
  connectionIdentity: null,
  connectionVersion: 0,
  disconnect: vi.fn(),
  submitTransaction: null,
  walletAddress: null,
  walletState: {
    status: 'disconnected',
    network: 'devnet',
    walletLabel: null,
    message: null,
  },
};

vi.mock('./SolanaWalletBridgeProvider', () => ({
  useSolanaWalletBridge: () => ({
    connect: mockBridgeState.connect,
    connection: mockBridgeState.connection,
    connectionIdentity: mockBridgeState.connectionIdentity,
    connectionVersion: mockBridgeState.connectionVersion,
    disconnect: mockBridgeState.disconnect,
    submitTransaction: mockBridgeState.submitTransaction,
    walletAddress: mockBridgeState.walletAddress,
    walletState: mockBridgeState.walletState,
  }),
}));

const SESSION_DRAFT: CreatePayoutFormValues = {
  recipient: 'alice.sol',
  tokenMint: 'So11111111111111111111111111111111111111112',
  amount: '12.5',
  memo: null,
  disclosureLevel: 'partial',
};

const SESSION_RESULT: CreatePrivatePayoutResult = {
  payoutId: 'session-payout',
  transactionHash: 'session-transaction',
  status: 'submitted',
};

const STALE_SESSION_RESULT: CreatePrivatePayoutResult = {
  payoutId: 'stale-session-payout',
  transactionHash: 'stale-session-transaction',
  status: 'submitted',
};

function WalletProbe() {
  const wallet = useWallet();

  return (
    <>
      <span>{wallet.status}</span>
      <span>{wallet.networkLabel}</span>
      <span>{wallet.isSupportedNetwork ? 'supported' : 'unsupported'}</span>
      <span>{wallet.walletLabel ?? 'no-wallet'}</span>
      <span>{wallet.connectionVersion}</span>
      <button type="button" onClick={wallet.connect}>
        Connect
      </button>
      <button type="button" onClick={wallet.disconnect}>
        Disconnect
      </button>
    </>
  );
}

function DemoFlowSessionView() {
  const wallet = useWallet();

  return <span>{wallet.demoFlowSession?.payout.payoutId ?? 'no-session'}</span>;
}

function DemoFlowSessionWriter({
  session,
  onWrite,
}: {
  session: {
    connectionVersion: number;
    network: 'devnet' | 'mainnet';
    payout: CreatePrivatePayoutResult;
  };
  onWrite: () => void;
}) {
  const wallet = useWallet();

  return (
    <button
      type="button"
      onClick={() => {
        wallet.saveDemoFlowSession({
          payout: session.payout,
          draft: SESSION_DRAFT,
          network: session.network,
          connectionVersion: session.connectionVersion,
        });
        onWrite();
      }}
    >
      Write session
    </button>
  );
}

describe('WalletProvider', () => {
  beforeEach(() => {
    mockBridgeState.connect.mockReset();
    mockBridgeState.disconnect.mockReset();
    mockBridgeState.connection = null;
    mockBridgeState.connectionIdentity = null;
    mockBridgeState.connectionVersion = 0;
    mockBridgeState.submitTransaction = null;
    mockBridgeState.walletAddress = null;
    mockBridgeState.walletState = {
      status: 'disconnected',
      network: 'devnet',
      walletLabel: null,
      message: null,
    };
  });

  it('provides the bridged disconnected wallet state', async () => {
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('disconnected')).toBeInTheDocument();
    });
    expect(screen.getByText('Solana Devnet')).toBeInTheDocument();
    expect(screen.getByText('supported')).toBeInTheDocument();
    expect(screen.getByText('no-wallet')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('delegates connect and disconnect actions to the Solana bridge', async () => {
    render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Connect' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(mockBridgeState.connect).toHaveBeenCalledTimes(1);
      expect(mockBridgeState.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  it('exposes the bridged connection version as the wallet session version', async () => {
    const { rerender } = render(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    mockBridgeState.connectionIdentity = 'Phantom:wallet-1';
    mockBridgeState.connectionVersion = 1;
    mockBridgeState.walletAddress = 'wallet-1';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-1',
      message: null,
    };

    rerender(
      <WalletProvider>
        <WalletProbe />
      </WalletProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('connected')).toBeInTheDocument();
      expect(screen.getByText('wallet-1')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('keeps the bridged version stable through StrictMode rerenders until the bridge changes', async () => {
    const { rerender } = render(
      <StrictMode>
        <WalletProvider>
          <WalletProbe />
        </WalletProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    mockBridgeState.connectionIdentity = 'Phantom:wallet-2';
    mockBridgeState.connectionVersion = 1;
    mockBridgeState.walletAddress = 'wallet-2';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-2',
      message: null,
    };

    rerender(
      <StrictMode>
        <WalletProvider>
          <WalletProbe />
        </WalletProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    rerender(
      <StrictMode>
        <WalletProvider>
          <WalletProbe />
        </WalletProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    mockBridgeState.connectionIdentity = null;
    mockBridgeState.connectionVersion = 2;
    mockBridgeState.walletAddress = null;
    mockBridgeState.walletState = {
      status: 'disconnected',
      network: 'devnet',
      walletLabel: null,
      message: null,
    };

    rerender(
      <StrictMode>
        <WalletProvider>
          <WalletProbe />
        </WalletProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('ignores a stale demo flow session write after the bridged wallet session changes', async () => {
    const onWrite = vi.fn();

    mockBridgeState.connectionIdentity = 'Phantom:wallet-1';
    mockBridgeState.connectionVersion = 1;
    mockBridgeState.walletAddress = 'wallet-1';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-1',
      message: null,
    };

    const { rerender } = render(
      <WalletProvider>
        <DemoFlowSessionWriter
          session={{ connectionVersion: 1, network: 'devnet', payout: SESSION_RESULT }}
          onWrite={onWrite}
        />
        <DemoFlowSessionView />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Write session' }));

    await waitFor(() => {
      expect(screen.getByText('session-payout')).toBeInTheDocument();
    });

    mockBridgeState.connectionIdentity = 'Phantom:wallet-2';
    mockBridgeState.connectionVersion = 2;
    mockBridgeState.walletAddress = 'wallet-2';
    mockBridgeState.walletState = {
      status: 'connected',
      network: 'devnet',
      walletLabel: 'wallet-2',
      message: null,
    };

    rerender(
      <WalletProvider>
        <DemoFlowSessionWriter
          session={{ connectionVersion: 1, network: 'devnet', payout: STALE_SESSION_RESULT }}
          onWrite={onWrite}
        />
        <DemoFlowSessionView />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Write session' }));

    await waitFor(() => {
      expect(onWrite).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText('stale-session-payout')).not.toBeInTheDocument();
    expect(screen.getByText('session-payout')).toBeInTheDocument();
  });
});
