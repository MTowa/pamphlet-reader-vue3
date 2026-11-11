import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const consumers = process.env.FLIPBOOK_CONSUMER_ROOT
const vue = consumers ? path.join(consumers, 'vue-app') : path.resolve('playground/vue-app')
const nuxt = consumers ? path.join(consumers, 'nuxt-app') : path.resolve('playground/nuxt-app')
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1100 } },
    },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command:
        'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
      cwd: vue,
      url: 'http://127.0.0.1:4173/demo/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'node .output/server/index.mjs',
      cwd: nuxt,
      env: { PORT: '4174', HOST: '127.0.0.1' },
      url: 'http://127.0.0.1:4174/nuxt-demo/',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
