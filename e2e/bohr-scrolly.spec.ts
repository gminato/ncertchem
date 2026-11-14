import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-2/2-4-bohr-model'
const SCREEN_DIR = path.join('test-results', 'screens')

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, index: number) {
  await page.locator('[data-scrolly-step]').nth(index).evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Bohr Scrolly Animation (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test(`steps through the animation with no console errors`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        "Bohr's Model for Hydrogen Atom"
      )
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(4)
      await waitForScrolly(page)

      for (let i = 0; i < 4; i++) {
        await gotoStep(page, i)
        // Step 2's photon travels for ~1.8s after the drop; wait until it has arrived.
        await page.waitForTimeout(i === 2 ? 2200 : 1500)
        await page.screenshot({ path: path.join(SCREEN_DIR, `step-${i}-${scheme}.png`) })
      }

      // The spectral line exists after Step 3
      await expect(page.getByTestId('spectral-line')).toHaveCount(1)
      await expect(page.getByTestId('bohr-emission')).toHaveAttribute('data-step', '3')

      expect(errors).toEqual([])
    })
  })
}

test.describe('Bohr Scrolly Animation (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('reaches the Step 3 state without tweening', async ({ page }) => {
    await page.goto(SECTION_URL)
    await waitForScrolly(page)
    await gotoStep(page, 3)
    await expect(page.getByTestId('bohr-emission')).toHaveAttribute('data-step', '3')
    await expect(page.getByTestId('spectral-line')).toHaveCount(1)
    await expect(page.getByTestId('spectral-line')).toHaveCSS('opacity', '1')
  })
})
