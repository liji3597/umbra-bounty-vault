'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { WalletError } from '@solana/wallet-adapter-base';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletAdapterProvider,
  useConnection,
  useWallet as useSolanaWallet,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  useWalletModal,
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import {
  PhantomWalletAdapter,
} from '@solana/wallet-adapter-phantom';
import {
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-solflare';
import type {
  Connection,
  Transaction,
} from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';

import type { SupportedWalletNetwork } from '@/features/shared/network';

import type { WalletProviderState } from './WalletProvider';

interface SolanaWalletBridgeValue {
  connection: Pick<Connection, 'confirmTransaction' | 'getLatestBlockhashAndContext'> | null;
  connectionIdentity: string | null;
  connectionVersion: number;
  submitTransaction: ((transaction: Transaction, minContextSlot: number) => Promise<string>) | null;
  walletAddress: string | null;
  walletState: WalletProviderState;
  connect: () => void;
  disconnect: () => void;
}

interface SolanaWalletBridgeProviderProps {
  children: ReactNode;
}

interface SolanaWalletBridgeStateProviderProps extends SolanaWalletBridgeProviderProps {
  bumpConnectionVersion: () => void;
  clearMessage: () => void;
  connectionVersion: number;
  message: string | null;
  setMessage: (message: string | null) => void;
}

const SOLANA_NETWORK: SupportedWalletNetwork = 'devnet';
const SOLANA_ADAPTER_NETWORK = WalletAdapterNetwork.Devnet;
const WalletBridgeContext = createContext<SolanaWalletBridgeValue | null>(null);

function getWalletErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Wallet connection failed.';
}

function buildWalletState(
  status: WalletProviderState['status'],
  walletLabel: string | null,
  message: string | null,
): WalletProviderState {
  return {
    status,
    network: SOLANA_NETWORK,
    walletLabel,
    message,
  };
}

function SolanaWalletBridgeStateProvider({
  children,
  bumpConnectionVersion,
  clearMessage,
  connectionVersion,
  message,
  setMessage,
}: SolanaWalletBridgeStateProviderProps) {
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();
  const {
    connect,
    connected,
    connecting,
    disconnect,
    disconnecting,
    publicKey,
    sendTransaction,
    wallet,
  } = useSolanaWallet();

  useEffect(() => {
    if (connected) {
      clearMessage();
    }
  }, [clearMessage, connected]);

  const handleConnect = useCallback(() => {
    clearMessage();

    if (!wallet) {
      setVisible(true);
      return;
    }

    void connect()
      .then(() => {
        bumpConnectionVersion();
      })
      .catch((error: unknown) => {
        setMessage(getWalletErrorMessage(error));
      });
  }, [bumpConnectionVersion, clearMessage, connect, setMessage, setVisible, wallet]);

  const handleDisconnect = useCallback(() => {
    clearMessage();

    void disconnect()
      .then(() => {
        bumpConnectionVersion();
      })
      .catch((error: unknown) => {
        setMessage(getWalletErrorMessage(error));
      });
  }, [bumpConnectionVersion, clearMessage, disconnect, setMessage]);

  const walletAddress = publicKey?.toBase58() ?? null;
  const walletLabel = connected
    ? walletAddress ?? wallet?.adapter.name ?? null
    : wallet?.adapter.name ?? null;
  const walletState = useMemo<WalletProviderState>(() => {
    if (connected) {
      return buildWalletState('connected', walletLabel, null);
    }

    if (connecting || disconnecting) {
      return buildWalletState('initializing', walletLabel, null);
    }

    if (message) {
      return buildWalletState('error', walletLabel, message);
    }

    return buildWalletState('disconnected', null, null);
  }, [connected, connecting, disconnecting, message, walletLabel]);
  const connectionIdentity = connected && walletAddress ? `${wallet?.adapter.name ?? 'wallet'}:${walletAddress}` : null;
  const submitTransaction = useCallback(
    async (transaction: Transaction, minContextSlot: number) => {
      if (!publicKey) {
        throw new Error('Wallet not connected.');
      }

      return sendTransaction(transaction, connection, { minContextSlot });
    },
    [connection, publicKey, sendTransaction],
  );
  const contextValue = useMemo<SolanaWalletBridgeValue>(
    () => ({
      connection: connected && walletAddress ? connection : null,
      connectionIdentity,
      connectionVersion,
      submitTransaction: connected && walletAddress ? submitTransaction : null,
      walletAddress,
      walletState,
      connect: handleConnect,
      disconnect: handleDisconnect,
    }),
    [
      connected,
      connection,
      connectionIdentity,
      connectionVersion,
      handleConnect,
      handleDisconnect,
      submitTransaction,
      walletAddress,
      walletState,
    ],
  );

  return <WalletBridgeContext.Provider value={contextValue}>{children}</WalletBridgeContext.Provider>;
}

export function SolanaWalletBridgeProvider({ children }: SolanaWalletBridgeProviderProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const endpoint = useMemo(() => clusterApiUrl(SOLANA_ADAPTER_NETWORK), []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: SOLANA_ADAPTER_NETWORK })],
    [],
  );
  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);
  const handleError = useCallback((error: WalletError) => {
    setMessage(getWalletErrorMessage(error));
  }, []);
  const bumpConnectionVersion = useCallback(() => {
    setConnectionVersion((currentVersion) => currentVersion + 1);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletAdapterProvider
        wallets={wallets}
        autoConnect
        localStorageKey="umbra-wallet-adapter"
        onError={handleError}
      >
        <WalletModalProvider>
          <SolanaWalletBridgeStateProvider
            bumpConnectionVersion={bumpConnectionVersion}
            clearMessage={clearMessage}
            connectionVersion={connectionVersion}
            message={message}
            setMessage={setMessage}
          >
            {children}
          </SolanaWalletBridgeStateProvider>
        </WalletModalProvider>
      </SolanaWalletAdapterProvider>
    </ConnectionProvider>
  );
}

export function useSolanaWalletBridge(): SolanaWalletBridgeValue | null {
  return useContext(WalletBridgeContext);
}
