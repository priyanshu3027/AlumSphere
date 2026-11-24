const { test, expect } = require('@playwright/test');
const { registerViaApi, uniqueEmail, trackPageErrors } = require('./helpers');

test.describe('authentication', () => {
  test('a signed-out visitor is sent to the login page', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
  });

  test('a new student can register and reaches the dashboard', async ({ page }) => {
    const errors = trackPageErrors(page);

    await page.goto('/register');
    await page.locator('input[name="name"]').fill('Asha Tester');
    await page.locator('input[name="email"]').fill(uniqueEmail('register'));
    await page.locator('input[name="password"]').fill('E2e-Password-1');
    await page.locator('input[name="institution"]').fill('Chandigarh University');
    await page.locator('input[name="course"]').fill('MCA');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Welcome back, Asha')).toBeVisible();
    expect(errors, 'uncaught errors on the dashboard').toEqual([]);
  });

  test('registering with an email that is already taken shows an error', async ({ page, request }) => {
    const existing = await registerViaApi(request);

    await page.goto('/register');
    await page.locator('input[name="name"]').fill('Duplicate User');
    await page.locator('input[name="email"]').fill(existing.email);
    await page.locator('input[name="password"]').fill('E2e-Password-1');
    await page.getByRole('button', { name: 'Create Account' }).click();

    await expect(page.getByText('Email already registered')).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('a wrong password is rejected', async ({ page, request }) => {
    const account = await registerViaApi(request);

    await page.goto('/login');
    await page.getByPlaceholder('you@university.edu').fill(account.email);
    await page.getByPlaceholder('••••••••').fill('not-the-right-password');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('a registered user can sign in and sign out', async ({ page, request }) => {
    const account = await registerViaApi(request, { name: 'Ravi Signin' });

    await page.goto('/login');
    await page.getByPlaceholder('you@university.edu').fill(account.email);
    await page.getByPlaceholder('••••••••').fill(account.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText('Welcome back, Ravi')).toBeVisible();

    // Open the profile menu in the top bar and sign out.
    await page.getByRole('button').filter({ has: page.getByAltText('avatar') }).click();
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    expect(await page.evaluate(() => window.localStorage.getItem('alumsphere_token'))).toBeNull();
  });
});
