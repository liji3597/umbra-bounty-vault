import { expect, test } from '@playwright/test';

test('shows explicit unavailable claim scanning state for connected wallet sessions without scan capability', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/app/claim?mockWallet=connected&mockWalletAddress=e2e-wallet-no-scan');

  await expect(page.getByRole('heading', { name: 'Claim Center', level: 1 })).toBeVisible();
  await expect(page.getByText('Wallet connected')).toBeVisible();
  await expect(page.getByRole('banner').getByText('Mock wallet preview', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Scan claimable payouts' }).click();

  await expect(page.getByText('Live claim scanning is unavailable in the current environment.')).toBeVisible();
  await expect(page.getByText('Confirm the wallet stays connected, then scan again.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Claimable payouts found' })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
