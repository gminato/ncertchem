import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 5 energy and thermodynamics on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('systems, pistons, PV, calorimeters, enthalpy, Gibbs and entropy render without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#thermo')

      const section = page.locator('#thermo')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Energy and thermodynamics')
      // One card per demo: system types, pistons, PV, two calorimeters, Hess, four Gibbs cases, entropy.
      await expect(section.locator('article')).toHaveCount(11)
      await expect(section.locator('svg[role="img"]')).toHaveCount(11)

      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(400)
      await section.screenshot({ path: path.join(SCREEN_DIR, `vocab-unit5-${scheme}-1440.png`) })

      expect(errors).toEqual([])
    })
  })
}
