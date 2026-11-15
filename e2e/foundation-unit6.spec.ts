import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const CARD_NAMES = [
  'card-1-vessel-water',
  'card-2-vessel-n2o4',
  'card-3-rates',
  'card-4-curves',
  'card-5-ice',
  'card-6-qk-below',
  'card-7-qk-above',
  'card-8-lechatelier',
  'card-9-ph',
  'card-10-ionisation',
  'card-11-buffer',
  'card-12-solubility',
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 6 equilibrium on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('sealed vessels, rates, curves, ICE, Q and K, Le Chatelier, pH, ionisation, buffer and solubility render without console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#equilibrium')

      const section = page.locator('#equilibrium')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Equilibrium')

      const articles = section.locator('article')
      await expect(articles).toHaveCount(CARD_NAMES.length)

      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(500)

      await section.screenshot({
        path: path.join(SCREEN_DIR, `vocab-unit6-${scheme}-1440.png`),
      })

      for (let i = 0; i < CARD_NAMES.length; i++) {
        await articles.nth(i).screenshot({
          path: path.join(SCREEN_DIR, `vocab-unit6-${scheme}-${CARD_NAMES[i]}.png`),
        })
      }

      expect(errors).toEqual([])
    })
  })
}
