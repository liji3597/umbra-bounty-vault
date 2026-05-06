import { expect, test } from '@playwright/test';

test('shows explicit unavailable disclosure and activity states for connected wallet sessions without truth-backed context', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/app/disclosure?mockWallet=connected&mockWalletAddress=e2e-wallet-no-truth');

  await expect(page.getByRole('heading', { name: 'Disclosure / Verification', level: 1 })).toBeVisible();
  await expect(page.getByText('Wallet connected')).toBeVisible();
  await expect(page.getByText('Mock wallet preview', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert', { name: 'Disclosure unavailable' })).toContainText(
    'Disclosure preview is currently unavailable.',
  );
  await expect(page.getByRole('region', { name: 'Disclosure overview' })).toHaveCount(0);

  await page.goto('/app/activity?mockWallet=connected&mockWalletAddress=e2e-wallet-no-truth');

  await expect(page.getByRole('heading', { name: 'Activity', level: 1 })).toBeVisible();
  await expect(page.getByText('Wallet connected')).toBeVisible();
  await expect(page.getByText('Mock wallet preview', { exact: true })).toBeVisible();
  await expect(page.getByRole('alert', { name: 'Activity unavailable' })).toContainText(
    'Activity narrative is currently unavailable.',
  );
  await expect(page.getByRole('region', { name: 'Narrative summary' })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
