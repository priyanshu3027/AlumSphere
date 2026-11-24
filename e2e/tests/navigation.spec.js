const { test, expect } = require('@playwright/test');
const { registerViaApi, startSignedIn, trackPageErrors } = require('./helpers');

// Every page reachable from the sidebar. `heading` is checked when the page has a fixed title.
const PAGES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/network', name: 'Network', heading: 'My Network' },
  { path: '/jobs', name: 'Jobs', heading: 'Job Portal' },
  { path: '/chat', name: 'Chat' },
  { path: '/events', name: 'Events', heading: 'Events & Webinars' },
  { path: '/ai-hub', name: 'AI Hub', heading: 'AI Hub' },
  { path: '/leaderboard', name: 'Leaderboard', heading: 'Leaderboard' },
  { path: '/community', name: 'Community' },
  { path: '/games', name: 'Arcade', heading: 'Arcade Hub' },
  { path: '/profile', name: 'Profile' },
];

test.describe('signed-in navigation', () => {
  let session;

  test.beforeAll(async ({ request }) => {
    session = await registerViaApi(request, { name: 'Nav Tester' });
  });

  test.beforeEach(async ({ page }) => {
    await startSignedIn(page, session);
  });

  for (const { path, name, heading } of PAGES) {
    test(`${name} page loads inside the app shell without crashing`, async ({ page }) => {
      const errors = trackPageErrors(page);

      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(`${path}$`));
      // The top bar is part of the shared layout, so it proves the shell rendered.
      await expect(page.getByPlaceholder('Search alumni, jobs, events...')).toBeVisible();
      if (heading) {
        await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
      }
      expect(errors, `uncaught errors on ${path}`).toEqual([]);
    });
  }

  test('the sidebar moves between pages without a full reload', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'Jobs', exact: true }).first().click();
    await expect(page).toHaveURL(/\/jobs$/);
    await expect(page.getByRole('heading', { name: 'Job Portal', level: 1 })).toBeVisible();
  });
});
