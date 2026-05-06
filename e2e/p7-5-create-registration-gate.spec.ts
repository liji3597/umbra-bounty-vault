import { expect, test } from '@playwright/test';

test('shows explicit registration-required gating for connected wallet sessions without live create capability', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/app/payouts/new?mockWallet=connected&mockWalletAddress=11111111111111111111111111111111');

  await expect(page.getByRole('heading', { name: 'Create Payout', level: 1 })).toBeVisible();
  await expect(page.getByText('Wallet connected')).toBeVisible();
  await expect(page.getByRole('banner').getByText('Mock wallet preview', { exact: true })).toBeVisible();

  await page.getByLabel('Recipient').fill('alice.sol');
  await page.getByLabel('Token mint').fill('So11111111111111111111111111111111111111112');
  await page.getByLabel('Amount').fill('12.5');
  await page.getByRole('button', { name: 'Review payout' }).click();

  await expect(page.getByText('Review the normalized payout details before the final action.')).toBeVisible();
  await expect(
    page.getByText('Recipient registration currently requires a Solana wallet address for the official Umbra SDK path.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create payout' })).toBeDisabled();

  expect(consoleErrors).toEqual([]);
});
