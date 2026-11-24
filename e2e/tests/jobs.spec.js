const { test, expect } = require('@playwright/test');
const {
  DEMO, registerViaApi, loginViaApi, startSignedIn, uniqueSuffix, authHeader,
} = require('./helpers');

const jobPayload = (title) => ({
  title,
  company: 'E2E Robotics',
  location: 'Chennai',
  description: 'Created by the end-to-end test suite.',
  type: 'full-time',
  skills: ['Playwright', 'Node.js'],
});

test.describe('jobs', () => {
  test('a student sees the seeded jobs', async ({ page, request }) => {
    const student = await registerViaApi(request);
    await startSignedIn(page, student);

    await page.goto('/jobs');

    await expect(page.getByRole('heading', { name: 'Job Portal', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Details' }).first()).toBeVisible();
    // Students cannot post jobs, so the button must not be offered.
    await expect(page.getByRole('button', { name: 'Post a Job' })).toHaveCount(0);
  });

  test('searching narrows the list to matching jobs', async ({ page, request }) => {
    // Post a job with a title nothing else can match.
    const alumni = await loginViaApi(request, DEMO.verifiedAlumni);
    const title = `Zephyr Engineer ${uniqueSuffix()}`;
    const created = await request.post('/api/jobs', {
      headers: authHeader(alumni.token),
      data: jobPayload(title),
    });
    expect(created.status()).toBe(201);

    const student = await registerViaApi(request);
    await startSignedIn(page, student);
    await page.goto('/jobs');
    await expect(page.getByRole('button', { name: 'View Details' }).first()).toBeVisible();

    const search = page.getByPlaceholder('Search titles, skills, or companies...');
    await search.fill(title);
    await search.press('Enter');

    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'View Details' })).toHaveCount(1);
  });

  test('a verified alumni can post a job from the UI', async ({ page, request }) => {
    const alumni = await loginViaApi(request, DEMO.verifiedAlumni);
    await startSignedIn(page, alumni);
    const title = `Test Automation Engineer ${uniqueSuffix()}`;

    await page.goto('/jobs');
    await page.getByRole('button', { name: 'Post a Job' }).click();
    await page.getByPlaceholder('e.g. Senior React Developer').fill(title);
    await page.getByPlaceholder('e.g. Google, Infosys').fill('E2E Robotics');
    await page.getByPlaceholder('e.g. Bangalore, Remote').fill('Chennai');
    await page.getByPlaceholder('e.g. React, Node.js, MongoDB, AWS').fill('Playwright, Docker');
    await page.getByPlaceholder(/Describe the role, responsibilities/).fill('Own the end-to-end regression suite.');
    await page.getByRole('button', { name: 'Publish Job' }).click();

    await expect(page.getByText('Job posted successfully!')).toBeVisible();
    await expect(page.getByRole('heading', { name: title, level: 3 })).toBeVisible();
  });

  test('a student can apply to a job with a cover letter', async ({ page, request }) => {
    const alumni = await loginViaApi(request, DEMO.verifiedAlumni);
    const title = `Apply Target ${uniqueSuffix()}`;
    const created = await request.post('/api/jobs', {
      headers: authHeader(alumni.token),
      data: jobPayload(title),
    });
    expect(created.status()).toBe(201);
    const jobId = (await created.json()).job._id;

    const student = await registerViaApi(request);
    await startSignedIn(page, student);
    await page.goto('/jobs');

    // Newest jobs are listed first, so the job just created is on the first page.
    const card = page.locator('div.glass').filter({ has: page.getByRole('heading', { name: title, level: 3 }) });
    await card.getByRole('button', { name: 'View Details' }).click();
    await page.getByPlaceholder(/Tell us why you're a great fit/).fill('I maintain Playwright suites and would love to help.');
    await page.getByRole('button', { name: 'Submit Application' }).click();

    await expect(page.getByText('Application submitted successfully!')).toBeVisible();

    // The application is stored against the job.
    const applications = await request.get('/api/jobs/my-applications', { headers: authHeader(student.token) });
    expect(applications.status()).toBe(200);
    expect(JSON.stringify(await applications.json())).toContain(jobId);
  });
});

test.describe('job posting permissions (API)', () => {
  test('a request without a token is rejected', async ({ request }) => {
    const res = await request.post('/api/jobs', { data: jobPayload('No token') });
    expect(res.status()).toBe(401);
  });

  test('a student cannot post a job', async ({ request }) => {
    const student = await registerViaApi(request);
    const res = await request.post('/api/jobs', {
      headers: authHeader(student.token),
      data: jobPayload('Student attempt'),
    });
    expect(res.status()).toBe(403);
  });

  test('an unverified alumni cannot post a job', async ({ request }) => {
    const alumni = await registerViaApi(request, { role: 'alumni', name: 'Unverified Alumni' });
    const res = await request.post('/api/jobs', {
      headers: authHeader(alumni.token),
      data: jobPayload('Unverified attempt'),
    });
    expect(res.status()).toBe(403);
    expect((await res.json()).message).toBe('Only verified alumni can post jobs');
  });

  test('a student cannot reach the admin API', async ({ request }) => {
    const student = await registerViaApi(request);
    const res = await request.get('/api/admin/stats', { headers: authHeader(student.token) });
    expect(res.status()).toBe(403);
  });
});
