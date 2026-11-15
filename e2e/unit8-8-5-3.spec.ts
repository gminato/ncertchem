import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_853 = '/class-11/unit-8/8-5-3-functional-naming'
const STEP_COUNT = 6
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page, animation: string) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${animation}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, animation: string, index: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its fade-in has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1600)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-3-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.5.3 (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('functional-naming Scrolly steps and the functional group namer render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_853)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Naming Compounds with Functional Groups and Benzene Derivatives')

      await waitForScrolly(page, 'functional-naming')
      await expect(page.locator('[data-animation="functional-naming"] [data-scrolly-step]')).toHaveCount(STEP_COUNT)
      for (let i = 0; i < STEP_COUNT; i++) await shotStep(page, 'functional-naming', i, 'fgnaming', scheme)

      // Functional group namer, chain mode: default state, then a carboxylic acid on C5 (the acid becomes principal).
      const sim = page.locator('[data-simulation="functional-group-namer"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-3-namer-chain-default-${scheme}.png`) })

      await page.getByRole('group', { name: 'Carbon to edit' }).getByRole('button', { name: /^C5/ }).click()
      await page.getByRole('group', { name: 'Group on C5' }).getByRole('button', { name: '–COOH' }).click()
      await expect(page.getByTestId('namer-name')).toHaveText('5-hydroxy-3-oxopentanoic acid')
      await page.waitForTimeout(400)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-3-namer-chain-acid-${scheme}.png`) })

      // Benzene mode: default 4-chlorophenol, then a methyl group on position 2.
      await page.getByRole('radio', { name: 'Benzene' }).click()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-3-namer-ring-default-${scheme}.png`) })

      await page.getByRole('group', { name: 'Ring position to edit' }).getByRole('button', { name: /^2$/ }).click()
      await page.getByRole('group', { name: 'Substituent on position 2' }).getByRole('button', { name: '–CH₃' }).click()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-3-namer-ring-methyl-${scheme}.png`) })

      // Quiz mode: a choice, checked against the lib's name.
      await page.getByRole('radio', { name: 'Quiz' }).click()
      await page.getByRole('group', { name: 'Choose the name' }).getByRole('button').first().click()
      await page.getByRole('button', { name: 'Check my answer' }).click()
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-5-3-namer-quiz-checked-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
