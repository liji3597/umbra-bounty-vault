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
}

export interface WalletContextValue extends WalletProviderState {
  connect: () => void;
  disconnect: () => void;
  isSupportedNetwork: boolean;
  networkLabel: string;
  connectionVersion: number;
  walletAddress: string | null;
  submitTransaction: SolanaWalletSubmitTransaction | null;
  connection: SolanaWalletConnection | null;
  demoFlowSession: DemoFlowSession | null;
  saveDemoFlowSession: (session: Omit<DemoFlowSession, 'claimResult'>) => void;
  updateDemoFlowClaimResult: (claimResult: ClaimPrivatePayoutResult) => void;
  clearDemoFlowSession: () => void;
}

interface WalletSessionState {
  connectionVersion: number;
  walletState: WalletProviderState;
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
  const latestWalletSessionRef = useRef<{ connectionVersion: number; network: WalletNetwork; isSupportedNetwork: boolean } | null>(null);

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

  const saveDemoFlowSession = useCallback((session: Omit<DemoFlowSession, 'claimResult'>) => {
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
  const isActiveWalletSupported = activeWalletState.network !== 'unsupported';

  useInsertionEffect(() => {
    latestWalletSessionRef.current = {
      connectionVersion: activeConnectionVersion,
      network: activeWalletState.network,
      isSupportedNetwork: isActiveWalletSupported,
    };
  }, [activeConnectionVersion, activeWalletState.network, isActiveWalletSupported]);

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
      connection: solanaWalletBridge?.connection ?? null,
      demoFlowSession,
      saveDemoFlowSession,
      updateDemoFlowClaimResult,
      clearDemoFlowSession,
    }),
    [
      activeConnectionVersion,
      activeWalletState,
      clearDemoFlowSession,
      connect,
      demoFlowSession,
      disconnect,
      isActiveWalletSupported,
      saveDemoFlowSession,
      solanaWalletBridge?.connection,
      solanaWalletBridge?.submitTransaction,
      solanaWalletBridge?.walletAddress,
      updateDemoFlowClaimResult,
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
