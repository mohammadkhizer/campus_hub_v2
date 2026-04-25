import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load the login page and show validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    
    // Check that the title is correct
    await expect(page).toHaveTitle(/Campus Hub/i);
    
    // Find the login button and click it without entering data
    const loginButton = page.getByRole('button', { name: /login/i });
    await loginButton.click();
    
    // Wait for the Zod validation errors to appear
    const emailError = page.getByText(/Invalid email/i);
    await expect(emailError).toBeVisible();
  });
});
