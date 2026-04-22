'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { ClaimPrivatePayoutResult } from '@/features/claim/schema';
import type { CreatePayoutFormValues, CreatePrivatePayoutResult } from '@/features/payout/schema';

export type WalletStatus = 'initializing' | 'disconnected' | 'connected' | 'error';
export type WalletNetwork = 'devnet' | 'mainnet' | 'unsupported';

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
  demoFlowSession: DemoFlowSession | null;
  saveDemoFlowSession: (session: Omit<DemoFlowSession, 'claimResult'>) => void;
  updateDemoFlowClaimResult: (claimResult: ClaimPrivatePayoutResult) => void;
  clearDemoFlowSession: () => void;
}

interface WalletSessionState {
  connectionVersion: number;
  walletState: WalletProviderState;
  demoFlowSession: DemoFlowSession | null;
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
    demoFlowSession: null,
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

  const connect = useCallback(() => {
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
        demoFlowSession: null,
      };
    });
  }, []);

  const disconnect = useCallback(() => {
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
        demoFlowSession: null,
      };
    });
  }, []);

  const saveDemoFlowSession = useCallback((session: Omit<DemoFlowSession, 'claimResult'>) => {
    setWalletSession((currentSession) => ({
      ...currentSession,
      demoFlowSession: {
        ...session,
        claimResult: null,
      },
    }));
  }, []);

  const updateDemoFlowClaimResult = useCallback((claimResult: ClaimPrivatePayoutResult) => {
    setWalletSession((currentSession) => {
      if (!currentSession.demoFlowSession) {
        return currentSession;
      }

      if (currentSession.demoFlowSession.payout.payoutId !== claimResult.payoutId) {
        return currentSession;
      }

      return {
        ...currentSession,
        demoFlowSession: {
          ...currentSession.demoFlowSession,
          claimResult,
        },
      };
    });
  }, []);

  const clearDemoFlowSession = useCallback(() => {
    setWalletSession((currentSession) => ({
      ...currentSession,
      demoFlowSession: null,
    }));
  }, []);

  const contextValue = useMemo<WalletContextValue>(
    () => ({
      ...walletSession.walletState,
      connect,
      disconnect,
      isSupportedNetwork: walletSession.walletState.network !== 'unsupported',
      networkLabel: getNetworkLabel(walletSession.walletState.network),
      connectionVersion: walletSession.connectionVersion,
      demoFlowSession: walletSession.demoFlowSession,
      saveDemoFlowSession,
      updateDemoFlowClaimResult,
      clearDemoFlowSession,
    }),
    [clearDemoFlowSession, connect, disconnect, saveDemoFlowSession, updateDemoFlowClaimResult, walletSession],
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
