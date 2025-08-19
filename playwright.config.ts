import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 1,
  workers: process.env.CI ? 4 : undefined,
  timeout: 60000, // Increase test timeout to 60 seconds
  outputDir: process.env.PW_TEST_RESULTS_DIR || 'test-results',
  reporter: [
    ['html', { outputFolder: process.env.PW_OUTPUT_DIR || 'playwright-report' }],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || 'test-results.json' }]
  ],
  use: {
    baseURL: 'https://amazon.in',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile tests disabled due to Amazon.in's different mobile layout
    // Can be re-enabled after mobile-specific test adjustments
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});
