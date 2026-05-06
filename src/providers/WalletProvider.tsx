'use client';

import {
  createContext,
  useCallback,
  useContext,
  useInsertionEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type {
  Connection,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';

import type { WalletNetwork } from '@/features/shared/network';
import type { ClaimPrivatePayoutResult } from '@/features/claim/schema';
import type { CreatePayoutFormValues, CreatePrivatePayoutResult } from '@/features/payout/schema';

import { useSolanaWalletBridge } from './SolanaWalletBridgeProvider';

export type WalletStatus = 'initializing' | 'disconnected' | 'connected' | 'error';
export type SolanaWalletConnection = Pick<Connection, 'confirmTransaction' | 'getLatestBlockhashAndContext'>;
export type SolanaWalletSubmitTransaction = (
  transaction: Transaction,
  minContextSlot: number,
) => Promise<string>;

export type SolanaWalletSignMessage = (message: Uint8Array) => Promise<Uint8Array>;
export type SolanaWalletSignTransaction = (
  transaction: Transaction | VersionedTransaction,
) => Promise<Transaction | VersionedTransaction>;
export type SolanaWalletSignAllTransactions = (
  transactions: readonly (Transaction | VersionedTransaction)[],
) => Promise<(Transaction | VersionedTransaction)[]>;

export interface WalletProviderState {
  status: WalletStatus;
  network: WalletNetwork;
  walletLabel: string | null;
  message: string | null;
}

export interface DemoFlowSession {
  payout: CreatePrivatePayoutResult;
  draft: CreatePayoutFormValues;
  claimResult: ClaimPrivatePayoutResult | null;
  network: Exclude<WalletNetwork, 'unsupported'>;
  connectionVersion: number;
  walletAddress: string;
}

export interface WalletContextValue extends WalletProviderState {
  connect: () => void;
  disconnect: () => void;
  isSupportedNetwork: boolean;
  networkLabel: string;
  connectionVersion: number;
  walletAddress: string | null;
  submitTransaction: SolanaWalletSubmitTransaction | null;
  signTransaction: SolanaWalletSignTransaction | null;
  signAllTransactions: SolanaWalletSignAllTransactions | null;
  signMessage: SolanaWalletSignMessage | null;
  connection: SolanaWalletConnection | null;
  demoFlowSession: DemoFlowSession | null;
  saveDemoFlowSession: (session: Omit<DemoFlowSession, 'claimResult' | 'walletAddress'>) => void;
  updateDemoFlowClaimResult: (claimResult: ClaimPrivatePayoutResult) => void;
  clearDemoFlowSession: () => void;
}

interface WalletSessionState {
  connectionVersion: number;
  walletState: WalletProviderState;
}

interface LatestWalletSessionState {
  connectionVersion: number;
  network: WalletNetwork;
  isSupportedNetwork: boolean;
  walletAddress: string;
}

const DEFAULT_WALLET_STATE: WalletProviderState = {
  status: 'disconnected',
  network: 'devnet',
  walletLabel: null,
  message: null,
};

const DEFAULT_CONNECTED_WALLET_LABEL = 'Embedded wallet preview';

function getNetworkLabel(network: WalletNetwork): string {
  switch (network) {
    case 'mainnet':
      return 'Solana Mainnet';
    case 'unsupported':
      return 'Unsupported network';
    case 'devnet':
    default:
      return 'Solana Devnet';
  }
}

function getDemoFlowSessionWalletAddress(walletAddress: string | null, connectionVersion: number): string {
  return walletAddress ?? `preview-wallet-${connectionVersion}`;
}

function createInitialWalletState(initialState?: Partial<WalletProviderState>): WalletProviderState {
  return {
    ...DEFAULT_WALLET_STATE,
    ...initialState,
  };
}

function createInitialWalletSessionState(
  initialState?: Partial<WalletProviderState>,
): WalletSessionState {
  return {
    connectionVersion: 0,
    walletState: createInitialWalletState(initialState),
  };
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  initialState?: Partial<WalletProviderState>;
}

export function WalletProvider({ children, initialState }: WalletProviderProps) {
  const [walletSession, setWalletSession] = useState<WalletSessionState>(() =>
    createInitialWalletSessionState(initialState),
  );
  const [demoFlowSession, setDemoFlowSession] = useState<DemoFlowSession | null>(null);
  const solanaWalletBridge = useSolanaWalletBridge();
  const latestWalletSessionRef = useRef<LatestWalletSessionState | null>(null);

  const connect = useCallback(() => {
    if (solanaWalletBridge) {
      solanaWalletBridge.connect();
      return;
    }

    setWalletSession((currentSession) => {
      const { walletState } = currentSession;

      if (
        walletState.status === 'initializing' ||
        walletState.status === 'connected' ||
        walletState.network === 'unsupported'
      ) {
        return currentSession;
      }

      return {
        connectionVersion: currentSession.connectionVersion + 1,
        walletState: {
          ...walletState,
          status: 'connected',
          walletLabel: walletState.walletLabel ?? DEFAULT_CONNECTED_WALLET_LABEL,
          message: null,
        },
      };
    });
    setDemoFlowSession(null);
  }, [solanaWalletBridge]);

  const disconnect = useCallback(() => {
    if (solanaWalletBridge) {
      solanaWalletBridge.disconnect();
      return;
    }

    setWalletSession((currentSession) => {
      const { walletState } = currentSession;

      if (walletState.status === 'disconnected') {
        return currentSession;
      }

      return {
        connectionVersion: currentSession.connectionVersion + 1,
        walletState: {
          ...walletState,
          status: 'disconnected',
          walletLabel: null,
          message: null,
        },
      };
    });
    setDemoFlowSession(null);
  }, [solanaWalletBridge]);

  const saveDemoFlowSession = useCallback((session: Omit<DemoFlowSession, 'claimResult' | 'walletAddress'>) => {
    setDemoFlowSession((currentSession) => {
      const latestWalletSession = latestWalletSessionRef.current;

      if (
        !latestWalletSession ||
        !latestWalletSession.isSupportedNetwork ||
        latestWalletSession.connectionVersion !== session.connectionVersion ||
        latestWalletSession.network !== session.network
      ) {
        return currentSession;
      }

      return {
        ...session,
        claimResult: null,
        walletAddress: latestWalletSession.walletAddress,
      };
    });
  }, []);

  const updateDemoFlowClaimResult = useCallback((claimResult: ClaimPrivatePayoutResult) => {
    setDemoFlowSession((currentSession) => {
      if (!currentSession) {
        return currentSession;
      }

      if (currentSession.payout.payoutId !== claimResult.payoutId) {
        return currentSession;
      }

      return {
        ...currentSession,
        claimResult,
      };
    });
  }, []);

  const clearDemoFlowSession = useCallback(() => {
    setDemoFlowSession(null);
  }, []);

  const activeWalletState = solanaWalletBridge?.walletState ?? walletSession.walletState;
  const activeConnectionVersion = solanaWalletBridge?.connectionVersion ?? walletSession.connectionVersion;
  const activeWalletAddress = getDemoFlowSessionWalletAddress(
    solanaWalletBridge?.walletAddress ?? null,
    activeConnectionVersion,
  );
  const isActiveWalletSupported = activeWalletState.network !== 'unsupported';
  const visibleDemoFlowSession = useMemo(() => {
    if (!demoFlowSession) {
      return demoFlowSession;
    }

    if (
      !isActiveWalletSupported ||
      demoFlowSession.connectionVersion !== activeConnectionVersion ||
      demoFlowSession.network !== activeWalletState.network ||
      demoFlowSession.walletAddress !== activeWalletAddress
    ) {
      return null;
    }

    return demoFlowSession;
  }, [
    activeConnectionVersion,
    activeWalletAddress,
    activeWalletState.network,
    demoFlowSession,
    isActiveWalletSupported,
  ]);

  useInsertionEffect(() => {
    latestWalletSessionRef.current = {
      connectionVersion: activeConnectionVersion,
      network: activeWalletState.network,
      isSupportedNetwork: isActiveWalletSupported,
      walletAddress: activeWalletAddress,
    };
  }, [activeConnectionVersion, activeWalletAddress, activeWalletState.network, isActiveWalletSupported]);

  const contextValue = useMemo<WalletContextValue>(
    () => ({
      ...activeWalletState,
      connect,
      disconnect,
      isSupportedNetwork: isActiveWalletSupported,
      networkLabel: getNetworkLabel(activeWalletState.network),
      connectionVersion: activeConnectionVersion,
      walletAddress: solanaWalletBridge?.walletAddress ?? null,
      submitTransaction: solanaWalletBridge?.submitTransaction ?? null,
      signTransaction: solanaWalletBridge?.signTransaction ?? null,
      signAllTransactions: solanaWalletBridge?.signAllTransactions ?? null,
      signMessage: solanaWalletBridge?.signMessage ?? null,
      connection: solanaWalletBridge?.connection ?? null,
      demoFlowSession: visibleDemoFlowSession,
      saveDemoFlowSession,
      updateDemoFlowClaimResult,
      clearDemoFlowSession,
    }),
    [
      activeConnectionVersion,
      activeWalletState,
      clearDemoFlowSession,
      connect,
      disconnect,
      isActiveWalletSupported,
      saveDemoFlowSession,
      solanaWalletBridge?.connection,
      solanaWalletBridge?.submitTransaction,
      solanaWalletBridge?.signTransaction,
      solanaWalletBridge?.signAllTransactions,
      solanaWalletBridge?.signMessage,
      solanaWalletBridge?.walletAddress,
      updateDemoFlowClaimResult,
      visibleDemoFlowSession,
    ],
  );

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }

  return context;
}
