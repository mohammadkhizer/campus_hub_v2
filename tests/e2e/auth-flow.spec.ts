import { test, expect } from '@playwright/test';

test.describe('Authentication & Navigation E2E Flow', () => {
  test('navigates to login page and displays form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Campus Hub/i);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('loads governance routes (Privacy, Terms, Security, Help)', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('h1')).toContainText(/Privacy/i);

    await page.goto('/terms');
    await expect(page.locator('h1')).toContainText(/Terms/i);

    await page.goto('/security');
    await expect(page.locator('h1')).toContainText(/Security/i);

    await page.goto('/help');
    await expect(page.locator('h1')).toContainText(/Questions/i);
  });
});
