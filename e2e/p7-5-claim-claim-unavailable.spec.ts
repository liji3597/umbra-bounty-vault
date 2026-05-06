import { expect, test } from '@playwright/test';

test('shows explicit unavailable payout claim state after a prepared payout is found for a connected wallet session without claim capability', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/app/claim?mockWallet=connected&mockWalletAddress=e2e-wallet-claim-unavailable&mockClaimablePayout=claim-unavailable');

  await expect(page.getByRole('heading', { name: 'Claim Center', level: 1 })).toBeVisible();
  await expect(page.getByText('Wallet connected')).toBeVisible();
  await expect(page.getByRole('banner').getByText('Mock wallet preview', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Scan claimable payouts' }).click();

  const claimablePayoutResults = page.getByRole('region', { name: 'Claimable payouts found' });
  const claimablePayoutCard = page.getByRole('listitem', { name: 'Payout from Umbra Labs for 5 SOL' });

  await expect(claimablePayoutResults).toBeVisible();
  await expect(claimablePayoutCard).toBeVisible();
  await expect(claimablePayoutCard.getByRole('button', { name: 'Claim', exact: true })).toBeVisible();

  await claimablePayoutCard.getByRole('button', { name: 'Claim', exact: true }).click();

  await expect(page.getByText('Live payout claiming is unavailable in the current environment.')).toBeVisible();
  await expect(
    page.getByText('If the issue persists, rescan the current wallet session before retrying the claim.'),
  ).toBeVisible();
  await expect(claimablePayoutResults).toBeVisible();

  expect(consoleErrors).toEqual([]);
});
