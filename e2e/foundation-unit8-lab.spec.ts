import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const CARD_NAMES = [
  'card-1-distill-simple',
  'card-2-distill-fractional',
  'card-3-distill-reduced',
  'card-4-distill-steam',
  'card-5-sublimation',
  'card-6-crystallise-cooling',
  'card-7-crystallise-filtration',
  'card-8-funnel-before',
  'card-9-funnel-after',
  'card-10-tlc-rf',
  'card-11-paper',
  'card-12-column',
  'card-13-lassaigne-rack',
  'card-14-fusion',
  'card-15-combustion',
  'card-16-dumas',
  'card-17-kjeldahl',
  'card-18-carius',
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8 organic laboratory on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('organic laboratory apparatus renders without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#organic-lab')

      const section = page.locator('#organic-lab')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Organic laboratory')

      const articles = section.locator('article')
      await expect(articles).toHaveCount(CARD_NAMES.length)

      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(500)

      await section.screenshot({
        path: path.join(SCREEN_DIR, `vocab-unit8l-${scheme}-1440.png`),
      })

      for (let i = 0; i < CARD_NAMES.length; i++) {
        await articles.nth(i).screenshot({
          path: path.join(SCREEN_DIR, `vocab-unit8l-${scheme}-${CARD_NAMES[i]}.png`),
        })
      }

      expect(errors).toEqual([])
    })
  })
}
