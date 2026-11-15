import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const CARD_NAMES = [
  'card-1-skeletal-tmp',
  'card-2-butanoic',
  'card-3-chlorotoluene',
  'card-4-cyclohexene',
  'card-5-complete',
  'card-6-condensed',
  'card-7-bond-line',
  'card-8-morph',
  'card-8b-morph-strip',
  'card-9-wedge',
  'card-10-3d',
  'card-11-curved-arrows',
  'card-12-resonance-acetate',
  'card-13-resonance-benzene',
  'card-14-inductive',
  'card-15-carbocation',
  'card-16-carbanion',
  'card-17-radical',
  'card-18-hyperconjugation',
  'card-19-homolytic',
  'card-20-heterolytic',
  'card-21-badge',
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8 organic structures on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('skeletal, structural, wedge, arrows, resonance, inductive, orbitals and cleavage render without console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#organic')

      const section = page.locator('#organic')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Organic structures')

      const articles = section.locator('article')
      await expect(articles).toHaveCount(CARD_NAMES.length)

      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(500)

      await section.screenshot({
        path: path.join(SCREEN_DIR, `vocab-unit8s-${scheme}-1440.png`),
      })

      for (let i = 0; i < CARD_NAMES.length; i++) {
        await articles.nth(i).screenshot({
          path: path.join(SCREEN_DIR, `vocab-unit8s-${scheme}-${CARD_NAMES[i]}.png`),
        })
      }

      expect(errors).toEqual([])
    })
  })
}
