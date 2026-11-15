import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION_84 = '/class-11/unit-8/8-4-classification-of-organic-compounds'
const ANIMATION = 'classification-tree'
const STEP_COUNT = 6
const DEFAULT_FRACTION = 0.4

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el, f) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - f * window.innerHeight)
    }, DEFAULT_FRACTION)
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute(
    'data-active',
    'true'
  )
}

/** Screenshots the visual of one Scrolly Step once its fade has finished. */
async function shotStep(page: Page, index: number, scheme: string) {
  await gotoStep(page, index)
  await page.waitForTimeout(1200)
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-8-4-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Section 8.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('classification-tree Scrolly, the alcohol series and the functional-group sorter render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION_84)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Classification of Organic Compounds')

      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(STEP_COUNT)

      // Tree: each Step reveals one more class, and the leaves are drawn from the lib's classes.
      for (let i = 0; i < 4; i++) await shotStep(page, i, scheme)
      await gotoStep(page, 3)
      await expect(page.getByTestId('tree').first()).toHaveAttribute('data-active', 'heterocyclic')
      await expect(page.getByTestId('tree-leaf')).toHaveCount(12)

      // Ladder and boiling points.
      await shotStep(page, 4, scheme)
      await expect(page.getByTestId('ladder-member')).toHaveCount(5)
      await expect(page.getByTestId('ladder-member').nth(4)).toHaveAttribute('data-name', 'pentan-1-ol')
      await shotStep(page, 5, scheme)
      await expect(page.getByTestId('boiling-bar').nth(4)).toHaveAttribute('data-bp', '138')

      // Sorter: default state, then a right answer with the group highlighted, then a wrong one.
      const sim = page.locator('[data-simulation="functional-group-sorter"]')
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      await expect(sim.getByTestId('sorter-count')).toContainText('Card 1 of 19')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-4-sorter-default-${scheme}.png`) })

      await sim.getByRole('group', { name: 'Class' }).getByRole('button', { name: 'Acyclic', exact: true }).click()
      await sim.getByRole('group', { name: 'Functional group' }).getByRole('button', { name: 'carboxylic acid', exact: true }).click()
      await sim.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(sim.getByTestId('sorter-feedback')).toContainText('Class: acyclic.')
      await expect(sim.getByTestId('sorter-badge')).toBeVisible()
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-4-sorter-right-${scheme}.png`) })

      await sim.getByRole('button', { name: 'Next card', exact: true }).click()
      await expect(sim.getByTestId('sorter-count')).toContainText('Card 2 of 19')
      await sim.getByRole('group', { name: 'Class' }).getByRole('button', { name: 'Alicyclic', exact: true }).click()
      await sim.getByRole('group', { name: 'Functional group' }).getByRole('button', { name: 'None', exact: true }).click()
      await sim.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(sim.getByTestId('sorter-feedback')).toContainText('not alicyclic')
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u8-8-4-sorter-wrong-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
