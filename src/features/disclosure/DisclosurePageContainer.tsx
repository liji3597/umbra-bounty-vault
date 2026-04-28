'use client';

import { useCallback, useMemo } from 'react';

import { demoUmbraService } from '@/features/protocol/demoUmbraService';
import { useWallet, type DemoFlowSession } from '@/providers/WalletProvider';

import { DisclosurePage, type BuildDisclosureView } from './DisclosurePage';

export function DisclosurePageContainer() {
  const wallet = useWallet();
  const isDisclosureSessionReady = wallet.status === 'connected' && wallet.isSupportedNetwork;
  const activeDemoFlowSession = useMemo<DemoFlowSession | null>(
    () =>
      isDisclosureSessionReady &&
      wallet.demoFlowSession &&
      wallet.demoFlowSession.connectionVersion === wallet.connectionVersion &&
      wallet.demoFlowSession.network === wallet.network
        ? wallet.demoFlowSession
        : null,
    [isDisclosureSessionReady, wallet.connectionVersion, wallet.demoFlowSession, wallet.network],
  );

  const buildDisclosureView: BuildDisclosureView = useCallback(
    (input) => demoUmbraService.buildDisclosureView(input),
    [],
  );
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
