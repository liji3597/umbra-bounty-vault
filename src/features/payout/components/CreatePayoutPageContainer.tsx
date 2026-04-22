'use client';

import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import { useWallet } from '@/providers/WalletProvider';

import { CreatePayoutPage, type SubmitCreatePayout } from './CreatePayoutPage';

const submitCreatePayout: SubmitCreatePayout = (values) =>
  demoUmbraService.createPrivatePayout(values);

export function CreatePayoutPageContainer() {
  const wallet = useWallet();

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
