import { expect, test } from '@playwright/test';

test('covers the current gated preview flow and explicit demo boundaries', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Composed reward distribution.');
  await expect(
    page.getByText(/A private workflow for payout creation, recipient claiming, and bounded disclosure\./i),
  ).toBeVisible();

  await page.locator('a[href="/app/payouts/new"]').first().click();
  await expect(page).toHaveURL('/app/payouts/new');
  await expect(page.getByRole('heading', { name: 'Create Payout', level: 1 })).toBeVisible();
  await expect(page.getByText('Wallet disconnected')).toBeVisible();
  await expect(page.getByText('Wallet required')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Review payout' })).toBeDisabled();

  await page.getByRole('banner').getByRole('button', { name: 'Connect wallet' }).click();
  await expect(page.getByRole('heading', { name: 'Connect a wallet on Solana to continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Phantom/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Solflare/i })).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/app/claim');
  await expect(page.getByRole('heading', { name: 'Claim Center', level: 1 })).toBeVisible();
  await expect(
    page.getByText('Connect a supported wallet to preview the wallet-scoped claim flow within the current demo boundary.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Connect wallet' }).first()).toBeVisible();

  await page.goto('/app/disclosure');
  await expect(page.getByRole('heading', { name: 'Disclosure / Verification', level: 1 })).toBeVisible();
  await expect(
    page.getByText(
      'Review a bounded disclosure package through the typed service boundary. This surface stays coherent with the reward narrative without implying one exact live continuation from the prior step.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Disclosure overview' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Revealed fields' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Verification artifacts' })).toBeVisible();
  await expect(page.getByRole('alert', { name: 'Disclosure unavailable' })).toHaveCount(0);

  await page.goto('/app/activity');
  await expect(page.getByRole('heading', { name: 'Activity', level: 1 })).toBeVisible();
  await expect(
    page.getByText(
      'Follow one coherent wallet-scoped narrative across payout submission, claim progress, and bounded disclosure output. When no active demo session exists, this surface falls back to a prepared preview narrative instead of implying a fully live end-to-end replay.',
    ),
  ).toBeVisible();
  const narrativeSummary = page.getByRole('region', { name: 'Narrative summary' });
  await expect(narrativeSummary).toBeVisible();
  await expect(narrativeSummary.getByText('Payout status: submitted')).toBeVisible();
  await expect(narrativeSummary.getByText('Claim status: claimed')).toBeVisible();
  await expect(narrativeSummary.getByText('Disclosure level: verification-ready')).toBeVisible();
  await expect(page.getByRole('alert', { name: 'Activity unavailable' })).toHaveCount(0);

  expect(consoleErrors).toEqual([]);
});
