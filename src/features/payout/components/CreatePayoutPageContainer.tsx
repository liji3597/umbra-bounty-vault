'use client';

import { PublicKey } from '@solana/web3.js';
import { useCallback } from 'react';

import { resolveCreatePayoutProvider } from '@/features/protocol/umbraProviderResolver';
import { loadUmbraSdkModule } from '@/features/protocol/umbraSdkClient';
import type {
  ResolvedUmbraProvider,
  UmbraCreateAvailability,
  UmbraProviderKind,
  UmbraRecipientRegistrationResult,
} from '@/features/protocol/umbraService.types';
import type { WalletNetwork } from '@/features/shared/network';
import { useWallet } from '@/providers/WalletProvider';

import { CreatePayoutPage, type SubmitCreatePayout } from './CreatePayoutPage';
import type { CreatePayoutFormValues } from '../schema';

const REGISTERED_CREATE_UNAVAILABLE_MESSAGE =
  'Recipient registration is verified, but official Umbra SDK payout creation is not wired for this wallet session yet.';
const RECIPIENT_UNREGISTERED_MESSAGE =
  'Recipient is not registered for the current official Umbra SDK payout path yet. Ask the recipient to complete registration before retrying.';
const RECIPIENT_X25519_UNREGISTERED_MESSAGE =
  'Recipient has not completed Umbra X25519 registration for the current official SDK payout path yet.';
const RECIPIENT_COMMITMENT_UNREGISTERED_MESSAGE =
  'Recipient has not completed Umbra commitment registration for the current official SDK payout path yet.';
const RECIPIENT_ANONYMOUS_USAGE_INACTIVE_MESSAGE =
  'Recipient Umbra account is not active for anonymous usage yet, so the current official SDK payout path remains blocked.';
const RECIPIENT_ACCOUNT_UNINITIALIZED_MESSAGE =
  'Recipient Umbra account exists but is not fully initialized for the current official SDK payout path yet.';
const RECIPIENT_REGISTRATION_UNAVAILABLE_MESSAGE =
  'Recipient registration could not be verified for this wallet session yet. Retry after the official Umbra SDK registration query is available.';
const SDK_UNAVAILABLE_MESSAGE =
  'Recipient registration cannot be verified because the official Umbra SDK is not configured for this wallet session.';
const SDK_WALLET_ADDRESS_REQUIRED_MESSAGE =
  'Recipient registration currently requires a Solana wallet address for the official Umbra SDK path.';
const WALLET_ADDRESS_UNAVAILABLE_MESSAGE =
  'Recipient registration cannot be verified until the connected wallet exposes a Solana address for this session.';

function getSupportedWalletNetwork(network: WalletNetwork): Exclude<WalletNetwork, 'unsupported'> {
  if (network === 'unsupported') {
    throw new Error('Supported network is required before creating private payouts.');
  }

  return network;
}

function isSolanaWalletAddress(value: string): boolean {
  try {
    new PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

function getCreateAvailabilityMessage(
  createAvailability: UmbraCreateAvailability | undefined,
  providerKind: UmbraProviderKind,
): string | undefined {
  if (createAvailability?.status === 'available') {
    return undefined;
  }

  if (createAvailability?.reason === 'sdk-create-not-wired') {
    return REGISTERED_CREATE_UNAVAILABLE_MESSAGE;
  }

  return providerKind === 'sdk-live'
    ? REGISTERED_CREATE_UNAVAILABLE_MESSAGE
    : SDK_UNAVAILABLE_MESSAGE;
}

function getRegistrationGateMessage(
  registration: UmbraRecipientRegistrationResult,
  providerKind: UmbraProviderKind,
  recipient: string,
  createAvailability?: UmbraCreateAvailability,
): string | undefined {
  if (registration.status === 'registered') {
    return getCreateAvailabilityMessage(createAvailability, providerKind);
  }

  if (registration.status === 'unregistered') {
    switch (registration.reason) {
      case 'x25519-missing':
        return RECIPIENT_X25519_UNREGISTERED_MESSAGE;
      case 'commitment-missing':
        return RECIPIENT_COMMITMENT_UNREGISTERED_MESSAGE;
      case 'anonymous-usage-inactive':
        return RECIPIENT_ANONYMOUS_USAGE_INACTIVE_MESSAGE;
      case 'account-uninitialized':
        return RECIPIENT_ACCOUNT_UNINITIALIZED_MESSAGE;
      case 'non-existent':
      default:
        return RECIPIENT_UNREGISTERED_MESSAGE;
    }
  }

  if (providerKind === 'sdk-live' && !isSolanaWalletAddress(recipient)) {
    return SDK_WALLET_ADDRESS_REQUIRED_MESSAGE;
  }

  return providerKind === 'sdk-live'
    ? RECIPIENT_REGISTRATION_UNAVAILABLE_MESSAGE
    : SDK_UNAVAILABLE_MESSAGE;
}

function getSubmitUnavailableMessage(
  provider: ResolvedUmbraProvider,
  isCreateSessionReady: boolean,
  isWalletAddressReady: boolean,
): string | undefined {
  if (!isCreateSessionReady) {
    return undefined;
  }

  if (!isWalletAddressReady) {
    return WALLET_ADDRESS_UNAVAILABLE_MESSAGE;
  }

  return getCreateAvailabilityMessage(provider.createAvailability, provider.kind);
}

export function CreatePayoutPageContainer() {
  const wallet = useWallet();
  const isCreateSessionReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const isWalletAddressReady = Boolean(wallet.walletAddress);
  const provider = isCreateSessionReady
    ? resolveCreatePayoutProvider({
        network: getSupportedWalletNetwork(wallet.network),
        loadSdkModule: loadUmbraSdkModule,
        walletAddress: wallet.walletAddress,
        walletLabel: wallet.walletLabel,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
        signMessage: wallet.signMessage,
      })
    : resolveCreatePayoutProvider();
  const submitUnavailableMessage = getSubmitUnavailableMessage(
    provider,
    isCreateSessionReady,
    isWalletAddressReady,
  );
  const submitCreatePayout: SubmitCreatePayout | null = isCreateSessionReady
    ? provider.capabilities.canCreatePrivatePayout
      ? async (values) => {
          return provider.service.createPrivatePayout(values);
        }
      : null
    : async (values) => {
        return provider.service.createPrivatePayout(values);
      };

  const handleReviewValuesChange = useCallback(
    async (values: CreatePayoutFormValues) => {
      if (!isCreateSessionReady || !provider.resolveRecipientRegistration) {
        return undefined;
      }

      if (!isWalletAddressReady) {
        return WALLET_ADDRESS_UNAVAILABLE_MESSAGE;
      }

      const registration = await provider.resolveRecipientRegistration(values.recipient);

      if (registration.status === 'registered') {
        return getCreateAvailabilityMessage(provider.createAvailability, provider.kind);
      }

      return getRegistrationGateMessage(
        registration,
        provider.kind,
        values.recipient,
        provider.createAvailability,
      );
    },
    [isCreateSessionReady, isWalletAddressReady, provider],
  );

  return (
    <CreatePayoutPage
      submitCreatePayout={submitCreatePayout}
      submitUnavailableMessage={submitUnavailableMessage}
      onReviewValuesChange={handleReviewValuesChange}
      onSubmitSuccess={(result, values) => {
        if (wallet.status !== 'connected' || !wallet.isSupportedNetwork || provider.kind !== 'demo') {
          return;
        }

        wallet.saveDemoFlowSession({
          payout: result,
          draft: values,
          network: wallet.network === 'mainnet' ? 'mainnet' : 'devnet',
          connectionVersion: wallet.connectionVersion,
        });
      }}
    />
  );
}
