import { test, expect, type Page } from '@playwright/test';

test.describe('Critical Path: Student Journey', () => {
  test('should allow a student to login and view their dashboard', async ({ page }: { page: Page }) => {
    // 1. Navigate to login
    await page.goto('/login');

    // 2. Fill credentials
    await page.fill('input[name="email"]', 'student@demo.com');
    await page.fill('input[name="password"]', 'password123');

    // 3. Submit
    await page.click('button[type="submit"]');

    // 4. Verify redirection to student dashboard
    await expect(page).toHaveURL(/\/student/);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should prevent cross-tenant access via URL manipulation', async ({ page }: { page: Page }) => {
    // 1. Login as Student A (Institution A)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student-a@inst-a.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // 2. Attempt to access a course belonging to Institution B
    const courseIdB = '65f1a2b3c4d5e6f7a8b9c0d1'; 
    await page.goto(`/courses/${courseIdB}`);

    // 3. Verify access is denied
    await expect(page.locator('text=Forbidden')).toBeVisible();
  });
});
