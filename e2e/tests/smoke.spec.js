const { test, expect } = require('@playwright/test');

test.describe('smoke', () => {
  test('API health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test('landing page offers sign in and registration', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AlumSphere/);
    await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Join Now' }).first()).toBeVisible();
  });

  test('unknown API route returns a JSON 404', async ({ request }) => {
    const res = await request.get('/api/does-not-exist');
    expect(res.status()).toBe(404);
    expect((await res.json()).success).toBe(false);
  });
});
