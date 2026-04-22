'use client';

import { Badge, Panel } from '@/components/ui';
import { useWallet } from '@/providers/WalletProvider';

function getWalletHeading(status: ReturnType<typeof useWallet>['status']): string {
  switch (status) {
    case 'connected':
      return 'Wallet connected';
    case 'initializing':
      return 'Wallet initializing';
    case 'error':
      return 'Wallet action required';
    case 'disconnected':
    default:
      return 'Wallet disconnected';
  }
}

function getWalletMessage(wallet: ReturnType<typeof useWallet>): string {
  if (!wallet.isSupportedNetwork) {
    return wallet.message ?? 'Switch to a supported Solana network before continuing.';
  }

  if (wallet.message) {
    return wallet.message;
  }

  switch (wallet.status) {
    case 'connected':
      return `${wallet.walletLabel ?? 'Wallet'} ready on ${wallet.networkLabel}.`;
    case 'initializing':
      return 'Preparing signer and network checks before enabling payout actions.';
    case 'error':
      return 'Resolve the wallet issue before continuing with payout or claim flows.';
    case 'disconnected':
    default:
      return 'Connect a wallet to continue with private payout, claim, and disclosure actions.';
  }
}

function getWalletBadgeVariant(wallet: ReturnType<typeof useWallet>): 'default' | 'accent' {
  return wallet.status === 'connected' && wallet.isSupportedNetwork ? 'accent' : 'default';
}

export function WalletStatusPanel() {
  const wallet = useWallet();

  const actionLabel = wallet.status === 'connected' ? 'Disconnect wallet' : 'Connect wallet';
  const action = wallet.status === 'connected' ? wallet.disconnect : wallet.connect;
  const isActionDisabled =
    wallet.status === 'initializing' ||
    (wallet.status !== 'connected' && !wallet.isSupportedNetwork);

  return (
    <Panel className="wallet-status-panel" heading={getWalletHeading(wallet.status)}>
      <div className="wallet-status-panel__badges">
        <Badge variant={getWalletBadgeVariant(wallet)}>{wallet.status}</Badge>
        <Badge>{wallet.networkLabel}</Badge>
      </div>
      <p className="wallet-status-panel__message">{getWalletMessage(wallet)}</p>
      {wallet.walletLabel ? <p className="wallet-status-panel__wallet">{wallet.walletLabel}</p> : null}
      <button
        type="button"
        className="wallet-status-panel__action"
        onClick={action}
        disabled={isActionDisabled}
      >
        {actionLabel}
      </button>
    </Panel>
  );
}
