import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const CARD_NAMES = [
  'card-1-tags',
  'card-2-transfer',
  'card-3-ladder',
  'card-4-beaker',
  'card-5-daniell',
  'card-6-potential',
  'card-7-titration',
  'card-8-halfequation',
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 7 redox and electrochemistry on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('tags, electron transfer, ON ladder, beaker, Daniell cell, potential ladder, titration and half-equation card render without console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#redox')

      const section = page.locator('#redox')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Redox and electrochemistry')

      const articles = section.locator('article')
      await expect(articles).toHaveCount(8)

      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(500)

      // Full section screenshot
      await section.screenshot({
        path: path.join(SCREEN_DIR, `vocab-unit7-${scheme}-1440.png`),
      })

      // Individual card screenshots
      for (let i = 0; i < CARD_NAMES.length; i++) {
        const card = articles.nth(i)
        await card.screenshot({
          path: path.join(SCREEN_DIR, `vocab-unit7-${scheme}-${CARD_NAMES[i]}.png`),
        })
      }

      expect(errors).toEqual([])
    })
  })
}
