import { defineConfig, devices } from '@playwright/test';

// Testy e2e ZAWSZE na zbudowanej wersji (dist/) serwowanej pod tym samym `base`
// co GitHub Pages — patrz CLAUDE.md, "Pułapki Phaser + Vite".
const BASE_PATH = '/portfolio-runner/';
const PORT = String(4173);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
