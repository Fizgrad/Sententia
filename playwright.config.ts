import { defineConfig, devices } from '@playwright/test';

const externalBaseURL = process.env.SENTENTIA_BASE_URL;
const localBaseURL = 'http://127.0.0.1:3100';
if (!externalBaseURL) process.env.SENTENTIA_OFFLINE_QA ??= '1';

export default defineConfig({
  testDir: './tests',
  testMatch: ['**/product.spec.ts', '**/audit-ui.spec.ts', '**/cloud-ui.spec.ts'],
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalBaseURL || localBaseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    actionTimeout: 10_000,
    launchOptions: { channel: 'chrome' },
  },
  webServer: externalBaseURL ? undefined : {
    command: 'npm run test:serve',
    url: localBaseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { NEXT_PUBLIC_BASE_PATH: '' },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 }, defaultBrowserType: 'chromium' } },
  ],
});
