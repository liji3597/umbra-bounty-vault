import { expect, test } from '@playwright/test';

test('covers the next P7-5 golden path slice through activity narrative closure', async ({ page }) => {
  const payoutAmount = '12.5';

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Private rewards for bounties, grants, and contributors.',
  );
  const createPayoutEntryLink = page.locator('a[href="/app/payouts/new"]').first();
  await expect(createPayoutEntryLink).toBeVisible();
  await createPayoutEntryLink.click();

  await expect(page).toHaveURL('/app/payouts/new');

  await expect(page.getByRole('heading', { name: 'Create Payout', level: 1 })).toBeVisible();
  const primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(primaryNavigation).toBeVisible();

  const banner = page.getByRole('banner');
  await expect(banner.getByRole('button', { name: 'Connect wallet' })).toBeEnabled();
  await banner.getByRole('button', { name: 'Connect wallet' }).click();
  await expect(banner.getByRole('button', { name: 'Disconnect wallet' })).toBeEnabled();

  const createPayoutMain = page.getByRole('main');
  await createPayoutMain.getByLabel('Recipient').fill('alice.sol');
  await createPayoutMain.getByLabel('Token mint').fill('So11111111111111111111111111111111111111112');
  await createPayoutMain.getByLabel('Amount').fill(payoutAmount);
  await createPayoutMain.getByRole('button', { name: 'Review payout' }).click();
  await createPayoutMain.getByRole('button', { name: 'Create payout' }).click();

  await expect(createPayoutMain.getByText('Payout ready')).toBeVisible();
  await expect(createPayoutMain.getByRole('link', { name: 'Open Claim Center' })).toBeVisible();
  await expect(createPayoutMain.getByRole('link', { name: 'Review activity' })).toBeVisible();
  await createPayoutMain.getByRole('link', { name: 'Open Claim Center' }).click();

  await expect(page).toHaveURL('/app/claim');
  await expect(page.getByRole('heading', { name: 'Claim Center', level: 1 })).toBeVisible();
  const claimMain = page.getByRole('main');

  const scanClaimablePayoutsButton = claimMain.getByRole('button', { name: 'Scan claimable payouts' });
  await expect(scanClaimablePayoutsButton).toBeVisible();
  await scanClaimablePayoutsButton.click();

  const claimResults = claimMain.getByRole('region', { name: 'Claimable payouts found' });
  await expect(claimResults).toBeVisible();
  await expect(claimResults.getByText('Claimable payouts found')).toBeVisible();

  const targetPayoutCard = claimResults.getByRole('listitem').filter({ hasText: 'Umbra Labs' }).first();
  await expect(targetPayoutCard).toBeVisible();
  await expect(targetPayoutCard).toContainText(`${payoutAmount} SOL`);
  await expect(targetPayoutCard.getByText('claimable', { exact: true })).toBeVisible();

  const claimButton = targetPayoutCard.getByRole('button', { name: 'Claim' });
  await expect(claimButton).toBeEnabled();
  await claimButton.click();

  await expect(targetPayoutCard.getByRole('button', { name: 'Claimed' })).toBeDisabled();
  await expect(claimMain.getByText(/^Preview claim completed\. Reference: .+/)).toBeVisible();

  const claimNextAction = claimMain.getByRole('region', { name: 'Next action' });
  await expect(claimNextAction).toBeVisible();
  await expect(claimNextAction.getByRole('link', { name: 'Review disclosure preview' })).toBeVisible();
  await expect(claimNextAction.getByRole('link', { name: 'Review activity narrative' })).toBeVisible();
  await claimNextAction.getByRole('link', { name: 'Review disclosure preview' }).click();

  await expect(page).toHaveURL('/app/disclosure');
  await expect(page.getByRole('heading', { name: 'Disclosure / Verification', level: 1 })).toBeVisible();

  const disclosureMain = page.getByRole('main');
  const disclosureOverview = disclosureMain.getByRole('region', { name: 'Disclosure overview' });
  await expect(disclosureOverview).toBeVisible();
  await expect(disclosureMain.getByRole('region', { name: 'Revealed fields' })).toBeVisible();
  await expect(disclosureMain.getByRole('region', { name: 'Verification artifacts' })).toBeVisible();
  await expect(disclosureMain.getByRole('alert', { name: 'Disclosure unavailable' })).toHaveCount(0);

  const disclosureNextAction = disclosureMain.getByRole('region', { name: 'Next action' });
  await expect(disclosureNextAction).toBeVisible();
  await expect(disclosureNextAction.getByRole('link', { name: 'View activity timeline' })).toBeVisible();
  await expect(disclosureNextAction.getByRole('link', { name: 'Back to claim center' })).toBeVisible();
  await disclosureNextAction.getByRole('link', { name: 'View activity timeline' }).click();

  await expect(page).toHaveURL('/app/activity');
  await expect(page.getByRole('heading', { name: 'Activity', level: 1 })).toBeVisible();

  const activityMain = page.getByRole('main');
  const narrativeSummary = activityMain.getByRole('region', { name: 'Narrative summary' });
  await expect(narrativeSummary).toBeVisible();
  await expect(narrativeSummary.getByText('Payout status: submitted')).toBeVisible();
  await expect(narrativeSummary.getByText('Claim status: claimed')).toBeVisible();
  await expect(narrativeSummary.getByText(/^Disclosure level:\s+\S+/)).toBeVisible();

  const claimCompleted = activityMain.getByRole('region', { name: 'Recipient claim completed' });
  await expect(claimCompleted).toBeVisible();
  await expect(claimCompleted.getByText('Claim result: claimed')).toBeVisible();

  await expect(activityMain.getByRole('region', { name: 'Disclosure package ready' })).toBeVisible();
  await expect(activityMain.getByRole('alert', { name: 'Activity unavailable' })).toHaveCount(0);

  const activityNextAction = activityMain.getByRole('region', { name: 'Next action' });
  await expect(activityNextAction).toBeVisible();
  await expect(activityNextAction.getByRole('link', { name: 'Create another payout' })).toBeVisible();
  await expect(activityNextAction.getByRole('link', { name: 'Return to landing' })).toBeVisible();
  await activityNextAction.getByRole('link', { name: 'Create another payout' }).click();

  await expect(page).toHaveURL('/app/payouts/new');
  await expect(page.getByRole('heading', { name: 'Create Payout', level: 1 })).toBeVisible();
});
