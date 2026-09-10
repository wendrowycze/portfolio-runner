import { defineConfig, devices } from '@playwright/test';

// Testy e2e ZAWSZE na zbudowanej wersji (dist/) serwowanej pod tym samym `base`
// co GitHub Pages — patrz CLAUDE.md, "Pułapki Phaser + Vite".
const BASE_PATH = '/portfolio-runner/';
const PORT = String(4173);

// Opcjonalnie: ścieżka do już zainstalowanego Chromium (środowiska bez dostępu do CDN Playwrighta).
// Na CI zmienna nie jest ustawiona i Playwright używa własnej instalacji.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Pełne przejście case'a wymaga realnego biegu przez tekst (ok. 3 minuty).
  timeout: 300_000,
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
    ...(executablePath !== undefined ? { launchOptions: { executablePath } } : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview',
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
