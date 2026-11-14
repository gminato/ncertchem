import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const PAGE_A = '/class-11/unit-3/3-3-modern-periodic-law-and-nomenclature'
const PAGE_B = '/class-11/unit-3/3-5-electronic-configuration-and-blocks'

const SCHEMES = ['light', 'dark'] as const

/** Scrolls the Scrolly Step with the given index into the top half of the viewport. */
async function activateStep(page: Page, scrolly: number, step: number) {
  const block = page.locator('[data-animation]').nth(scrolly)
  const steps = block.locator('[data-scrolly-step]')
  await steps.nth(step).scrollIntoViewIfNeeded()
  await steps.nth(step).evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await expect(steps.nth(step)).toHaveAttribute('data-active', 'true')
  await page.waitForTimeout(700)
}

function trackErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

for (const scheme of SCHEMES) {
  test.describe(`Section 3.3 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly steps, IUPAC builder and checks render cleanly', async ({ page }) => {
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(PAGE_A)
      await page.evaluate(() => document.fonts.ready)

      const moseley = page.locator('[data-animation="moseley-plot"]')
      const longForm = page.locator('[data-animation="periodic-long-form"]')
      await expect(moseley).toBeVisible()
      for (let s = 0; s < 4; s++) {
        await activateStep(page, 0, s)
        await page.waitForTimeout(600)
        await moseley.screenshot({ path: path.join(SCREEN_DIR, `u3-3-3-moseley-step${s}-${scheme}.png`) })
      }
      for (let s = 0; s < 6; s++) {
        await activateStep(page, 1, s)
        await page.waitForTimeout(700)
        await longForm.screenshot({ path: path.join(SCREEN_DIR, `u3-3-3-longform-step${s}-${scheme}.png`) })
      }

      const builder = page.locator('[data-simulation="iupac-namer"]')
      await builder.scrollIntoViewIfNeeded()
      await expect(builder.getByTestId('iupac-name')).toHaveText('unbinilium')
      await builder.screenshot({ path: path.join(SCREEN_DIR, `u3-3-4-iupac-default-${scheme}.png`) })
      await builder.getByRole('button', { name: '999' }).click()
      await expect(builder.getByTestId('iupac-name')).toHaveText('ennennennium')
      await builder.getByRole('button', { name: '137' }).click()
      await expect(builder.getByTestId('iupac-name')).toHaveText('untriseptium')
      await builder.screenshot({ path: path.join(SCREEN_DIR, `u3-3-4-iupac-changed-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })

  test.describe(`Section 3.5 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('block Scrolly, table explorer and checks render cleanly', async ({ page }) => {
      const errors = trackErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(PAGE_B)
      await page.evaluate(() => document.fonts.ready)

      const blocks = page.locator('[data-animation="periodic-blocks"]')
      for (let s = 0; s < 6; s++) {
        await activateStep(page, 0, s)
        await blocks.screenshot({ path: path.join(SCREEN_DIR, `u3-3-5-blocks-step${s}-${scheme}.png`) })
      }
      const cats = page.locator('[data-animation="periodic-categories"]')
      for (let s = 0; s < 3; s++) {
        await activateStep(page, 1, s)
        await cats.screenshot({ path: path.join(SCREEN_DIR, `u3-3-5-categories-step${s}-${scheme}.png`) })
      }

      const explorer = page.locator('[data-simulation="table-explorer"]')
      await explorer.scrollIntoViewIfNeeded()
      await explorer.screenshot({ path: path.join(SCREEN_DIR, `u3-3-5-explorer-default-${scheme}.png`) })
      // Keyboard: focus iron and select cobalt with the arrow key, then Enter.
      const fe = explorer.locator('[data-z="26"]')
      await fe.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Enter')
      await expect(explorer.locator('[role="status"]')).toContainText('Co')
      await explorer.getByRole('radio', { name: 'Period lengths' }).click()
      await explorer.screenshot({ path: path.join(SCREEN_DIR, `u3-3-5-explorer-periods-${scheme}.png`) })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Section 3.3 and 3.5 headings', () => {
  test('both pages load with their titles', async ({ page }) => {
    await page.goto(PAGE_A)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'The Modern Periodic Law and Naming New Elements'
    )
    await page.goto(PAGE_B)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Electronic Configurations and the Blocks of the Periodic Table'
    )
  })
})
