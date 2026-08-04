import { test, expect } from '@playwright/test';

test.describe('Public site smoke test', () => {
  test('home page loads and shows the hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /live entertainment/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /see what's on/i })).toBeVisible();
  });

  test('entertainment page loads with search and filters', async ({ page }) => {
    await page.goto('/entertainment');
    await expect(page.getByPlaceholder(/search entertainment/i)).toBeVisible();
  });

  test('skip-to-content link is the first focusable element', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByText('Skip to main content')).toBeFocused();
  });

  test('unauthenticated visitor is redirected away from /admin', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('contact page shows opening hours and phone number', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.getByText('01934 633406').or(page.getByText('01934633406'))).toBeVisible();
  });
});
