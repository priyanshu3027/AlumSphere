const { expect } = require('@playwright/test');

// Demo accounts created by `npm run seed` in the backend.
const DEMO_PASSWORD = 'Password@123';
const DEMO = {
  student: 'priyanshu@cu.ac.in',
  verifiedAlumni: 'rahul.verma@tcs.com',
  admin: 'admin@alumsphere.com',
};

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const uniqueEmail = (prefix = 'e2e') => `${prefix}.${uniqueSuffix()}@example.com`;

/** Registers a brand-new user through the API and returns { token, user, email, password }. */
async function registerViaApi(request, overrides = {}) {
  const account = {
    name: 'E2E Student',
    email: uniqueEmail(),
    password: 'E2e-Password-1',
    role: 'student',
    ...overrides,
  };
  const res = await request.post('/api/auth/register', { data: account });
  expect(res.status(), 'register via API').toBe(201);
  const body = await res.json();
  return { token: body.token, user: body.user, email: account.email, password: account.password };
}

/** Logs in through the API and returns { token, user }. */
async function loginViaApi(request, email, password = DEMO_PASSWORD) {
  const res = await request.post('/api/auth/login', { data: { email, password } });
  expect(res.status(), `login via API as ${email}`).toBe(200);
  const body = await res.json();
  return { token: body.token, user: body.user };
}

/**
 * Opens the app already signed in, by writing the same localStorage keys
 * the app itself writes after a successful login.
 */
async function startSignedIn(page, session) {
  await page.addInitScript(({ token, user }) => {
    window.localStorage.setItem('alumsphere_token', token);
    window.localStorage.setItem('alumsphere_user', JSON.stringify(user));
  }, { token: session.token, user: session.user });
}

/** Collects uncaught browser exceptions so a test can assert the page did not crash. */
function trackPageErrors(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = {
  DEMO,
  DEMO_PASSWORD,
  uniqueSuffix,
  uniqueEmail,
  registerViaApi,
  loginViaApi,
  startSignedIn,
  trackPageErrors,
  authHeader,
};
