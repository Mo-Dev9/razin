import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads and shows main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/RentRate/);
    await expect(page.locator('body')).toContainText('RentRate');
  });

  test('has search link', async ({ page }) => {
    await page.goto('/');
    const searchLink = page.locator('a[href*="search"]').first();
    await expect(searchLink).toBeVisible();
  });
});

test.describe('Static pages', () => {
  const pages = [
    { path: '/about', text: 'RentRate' },
    { path: '/contact', text: 'تواصل' },
    { path: '/privacy', text: 'خصوصية' },
    { path: '/terms', text: 'شروط' },
    { path: '/search', text: 'بحث' },
  ];

  for (const { path, text } of pages) {
    test(`${path} loads correctly`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/RentRate/);
      await expect(page.locator('body')).toContainText(text);
    });
  }
});

test.describe('Building detail', () => {
  test('building page shows rating criteria', async ({ page }) => {
    await page.goto('/building/b1');
    await expect(page.locator('body')).toContainText('الزحمة');
  });
});
