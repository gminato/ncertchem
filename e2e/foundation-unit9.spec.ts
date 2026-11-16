import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

/** One name per card of the Hydrocarbons section, in page order. */
const CARD_NAMES = [
  'card-01-ethane-0',
  'card-02-ethane-30',
  'card-03-ethane-60',
  'card-04-propene-hbr',
  'card-05-ethyne-steps',
  'card-06-ethene-pi',
  'card-07-ethyne-pi',
  'card-08-benzene-pi',
  'card-09-benzene-styles',
  'card-10-disubstituted',
  'card-11-arenium',
  'card-12-arenium-contributors',
  'card-13-eas-1',
  'card-14-eas-2',
  'card-15-eas-3',
  'card-16-markovnikov',
  'card-17-minor-branch',
  'card-18-radical-initiation',
  'card-19-radical-propagation',
  'card-20-radical-termination',
  'card-21-peroxide',
  'card-22-polymer-ethene',
  'card-23-polymer-propene',
  'card-24-polymer-ethyne',
  'card-25-reagent-tests',
  'card-26-carbide',
] as const

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9 hydrocarbons on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('conformations, schemes, π systems, arenes, mechanisms, polymers and lab drawings render without console errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#hydrocarbons')

      const section = page.locator('#hydrocarbons')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Hydrocarbons')

      const articles = section.locator('article')
      await expect(articles).toHaveCount(CARD_NAMES.length)

      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(500)

      await section.screenshot({
        path: path.join(SCREEN_DIR, `vocab-unit9-${scheme}-section.png`),
      })

      for (let i = 0; i < CARD_NAMES.length; i++) {
        await articles.nth(i).screenshot({
          path: path.join(SCREEN_DIR, `vocab-unit9-${scheme}-${CARD_NAMES[i]}.png`),
        })
      }

      expect(errors).toEqual([])
    })
  })
}
