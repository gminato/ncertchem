import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const INTRO = '/class-11/unit-8/8-1-general-introduction'
const SHAPES = '/class-11/unit-8/8-2-tetravalence-of-carbon-shapes-of-organic-compounds'

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
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}

/** Screenshots the visual of one Scrolly Step once its tween has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1400)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u8-${name}-step${index}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 8, Sections 8.1 and 8.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('8.1: every Scrolly Step and the catenation lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(INTRO)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('General Introduction')

      await waitForScrolly(page, 'vital-force')
      await expect(page.locator('[data-animation="vital-force"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'vital-force', i, '8-1-vital-force', scheme)
      await gotoStep(page, 'vital-force', 1)
      await expect(page.locator('[data-animation="vital-force"] [data-testid="intro-year"]')).toHaveText('1845')

      const section = page.locator('[data-simulation="carbon-catenation"]')
      const lab = page.getByTestId('carbon-catenation')
      await section.scrollIntoViewIfNeeded()
      await expect(lab.getByRole('img')).toBeVisible()
      await page.waitForTimeout(400)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u8-8-1-catenation-n4-default-${scheme}.png`) })
      await expect(lab).toHaveAttribute('data-isomers', '2')

      await section.locator('input[type="range"]').fill('5')
      await expect(lab).toHaveAttribute('data-isomers', '3')
      await expect(lab.getByTestId('catenation-readout')).toContainText('3 structural isomers')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u8-8-1-catenation-n5-${scheme}.png`) })

      await section.locator('input[type="range"]').fill('7')
      await expect(lab).toHaveAttribute('data-isomers', '9')
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u8-8-1-catenation-n7-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })

    test('8.2: every Scrolly Step and the hybridisation spotter render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SHAPES)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tetravalence of Carbon: Shapes of Organic Compounds')

      await waitForScrolly(page, 'carbon-shapes')
      await expect(page.locator('[data-animation="carbon-shapes"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'carbon-shapes', i, '8-2-shapes', scheme)
      await gotoStep(page, 'carbon-shapes', 0)
      await expect(page.locator('[data-animation="carbon-shapes"] [data-testid="shape-badge"]')).toContainText('109.5°')

      const spot = page.locator('[data-simulation="hybridisation-spotter"]')
      await spot.scrollIntoViewIfNeeded()
      await expect(spot.getByRole('img')).toBeVisible()
      await page.waitForTimeout(400)
      await spot.screenshot({ path: path.join(SCREEN_DIR, `u8-8-2-spotter-default-${scheme}.png`) })

      // Predict carbon 1 of propene, check it, then reveal the rest
      await spot.getByRole('button', { name: 'sp²', exact: true }).click()
      await spot.getByRole('button', { name: 'Check', exact: true }).click()
      await expect(spot.getByTestId('fact-hybrid')).toHaveText('sp²')
      await expect(spot.getByTestId('fact-angle')).toHaveText('120°')
      await spot.screenshot({ path: path.join(SCREEN_DIR, `u8-8-2-spotter-checked-${scheme}.png`) })

      await spot.getByRole('button', { name: 'Reveal all', exact: true }).click()
      await expect(spot.locator('[data-testid="badge-hybrid"]')).toHaveCount(3)
      await spot.screenshot({ path: path.join(SCREEN_DIR, `u8-8-2-spotter-revealed-${scheme}.png`) })

      // Acrylonitrile: sp², sp², sp
      await spot.getByRole('combobox').selectOption('acrylonitrile')
      await spot.getByRole('button', { name: 'Reveal all', exact: true }).click()
      await expect(spot.locator('[data-testid="badge-hybrid"]')).toHaveCount(3)
      await page.waitForTimeout(300)
      await spot.screenshot({ path: path.join(SCREEN_DIR, `u8-8-2-spotter-acrylonitrile-${scheme}.png`) })

      // Ethyne: linear carbons
      await spot.getByRole('combobox').selectOption('ethyne')
      await spot.getByRole('button', { name: 'Reveal all', exact: true }).click()
      await expect(spot.getByTestId('spotter-readout')).toContainText('sp')
      await page.waitForTimeout(300)
      await spot.screenshot({ path: path.join(SCREEN_DIR, `u8-8-2-spotter-ethyne-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
