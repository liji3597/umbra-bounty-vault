'use client';

import { useMemo } from 'react';

import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import { useWallet } from '@/providers/WalletProvider';

import { DisclosurePage, type BuildDisclosureView } from './DisclosurePage';

export function DisclosurePageContainer() {
  const wallet = useWallet();
  const activeDemoFlowSession =
    wallet.demoFlowSession &&
    wallet.demoFlowSession.connectionVersion === wallet.connectionVersion &&
    wallet.demoFlowSession.network === wallet.network
      ? wallet.demoFlowSession
      : null;

  const buildDisclosureView: BuildDisclosureView = (input) => demoUmbraService.buildDisclosureView(input);
  const defaultInput = useMemo(
    () =>
      activeDemoFlowSession
        ? {
            payoutId: activeDemoFlowSession.payout.payoutId,
            level: activeDemoFlowSession.draft.disclosureLevel,
            viewerRole: 'recipient' as const,
          }
        : undefined,
    [activeDemoFlowSession],
  );

  return <DisclosurePage buildDisclosureView={buildDisclosureView} defaultInput={defaultInput} />;
}
