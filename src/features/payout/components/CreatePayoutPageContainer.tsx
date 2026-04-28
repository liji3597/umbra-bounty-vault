'use client';

import { createDevnetUmbraService } from '@/features/protocol/devnetUmbraService';
import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import { useWallet } from '@/providers/WalletProvider';

import { CreatePayoutPage, type SubmitCreatePayout } from './CreatePayoutPage';

export function CreatePayoutPageContainer() {
  const wallet = useWallet();
  const submitCreatePayout: SubmitCreatePayout = async (values) => {
    if (wallet.network === 'devnet' && wallet.walletAddress && wallet.submitTransaction && wallet.connection) {
      const devnetUmbraService = createDevnetUmbraService({
        authority: {
          walletAddress: wallet.walletAddress,
          submitTransaction: wallet.submitTransaction,
        },
        connection: wallet.connection,
      });

      return devnetUmbraService.createPrivatePayout(values);
    }

    return demoUmbraService.createPrivatePayout(values);
  };

  return (
    <CreatePayoutPage
      submitCreatePayout={submitCreatePayout}
      onSubmitSuccess={(result, values) => {
        if (wallet.status !== 'connected' || !wallet.isSupportedNetwork) {
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
