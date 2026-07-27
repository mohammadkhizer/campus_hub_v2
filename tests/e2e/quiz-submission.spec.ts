import { test, expect } from '@playwright/test';

test.describe('Pricing & Quizzes E2E Flow', () => {
  test('renders 3-tier pricing comparison page', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('h1')).toContainText(/Institutional Subscription Plans/i || /Every Institution/i);
    await expect(page.getByText('Starter', { exact: false })).toBeVisible();
    await expect(page.getByText('Pro Institutional', { exact: false })).toBeVisible();
    await expect(page.getByText('Enterprise', { exact: false })).toBeVisible();
  });
});
