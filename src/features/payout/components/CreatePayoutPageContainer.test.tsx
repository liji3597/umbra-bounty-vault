import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WalletProvider } from '@/providers/WalletProvider';

import type { SubmitCreatePayout } from './CreatePayoutPage';

let capturedSubmitCreatePayout: SubmitCreatePayout | undefined;

vi.mock('./CreatePayoutPage', () => ({
  CreatePayoutPage: ({ submitCreatePayout }: { submitCreatePayout?: SubmitCreatePayout }) => {
    capturedSubmitCreatePayout = submitCreatePayout;
    return <div>Mock create payout page</div>;
  },
}));

import { CreatePayoutPageContainer } from './CreatePayoutPageContainer';

describe('CreatePayoutPageContainer', () => {
  beforeEach(() => {
    capturedSubmitCreatePayout = undefined;
  });

  it('injects a service-backed submit handler into the page view', async () => {
    render(
      <WalletProvider initialState={{ status: 'connected', network: 'devnet' }}>
        <CreatePayoutPageContainer />
      </WalletProvider>,
    );

    expect(screen.getByText('Mock create payout page')).toBeInTheDocument();
    expect(capturedSubmitCreatePayout).toBeDefined();

    if (!capturedSubmitCreatePayout) {
      throw new Error('Expected submit handler to be injected.');
    }

    await expect(
      capturedSubmitCreatePayout({
        recipient: 'alice.sol',
        tokenMint: 'So11111111111111111111111111111111111111112',
        amount: '12.5',
        memo: null,
        disclosureLevel: 'partial',
      }),
    ).resolves.toEqual({
      payoutId: expect.any(String),
      transactionHash: expect.any(String),
      status: 'submitted',
    });
  });
});
