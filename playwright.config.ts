import { defineConfig, devices } from '@playwright/test'

// Port 3000 is often in use by another local app, so the e2e server runs on 3200. Set E2E_PORT
// to run a second checkout's e2e tests at the same time without the two sharing a server.
const PORT = Number(process.env.E2E_PORT) || 3200
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
