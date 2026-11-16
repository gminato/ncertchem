import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const CLASSIFICATION = '/class-11/unit-9/9-1-classification'
const ALKANES = '/class-11/unit-9/9-2-alkanes-nomenclature-isomerism'

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

/** Screenshots the visual of one Scrolly Step once its fade has finished. */
async function shotStep(page: Page, animation: string, index: number, name: string, scheme: string) {
  await gotoStep(page, animation, index)
  await page.waitForTimeout(1200)
  await page
    .locator(`[data-animation="${animation}"] [data-testid="scrolly-visual"]`)
    .screenshot({ path: path.join(SCREEN_DIR, `u9-${name}-step${index + 1}-${scheme}.png`) })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Sections 9.1 and 9.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('9.1: every Scrolly Step and the family sorter render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(CLASSIFICATION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Classification of Hydrocarbons')

      await waitForScrolly(page, 'hydrocarbon-family')
      await expect(page.locator('[data-animation="hydrocarbon-family"] [data-scrolly-step]')).toHaveCount(5)
      for (let i = 0; i < 5; i++) await shotStep(page, 'hydrocarbon-family', i, '9-1-family', scheme)
      await gotoStep(page, 'hydrocarbon-family', 0)
      await expect(page.getByTestId('family-visual').first()).toHaveAttribute('data-step', '0')
      await gotoStep(page, 'hydrocarbon-family', 4)
      await expect(page.locator('[data-animation="hydrocarbon-family"] [data-testid="family-name"]')).toHaveText('benzene')

      const section = page.locator('[data-simulation="family-sorter"]')
      await section.scrollIntoViewIfNeeded()
      await expect(section.getByRole('img')).toBeVisible()
      await page.waitForTimeout(300)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-1-sorter-default-${scheme}.png`) })

      await section.getByRole('button', { name: 'Alkyne' }).click()
      await expect(section.getByTestId('sorter-feedback')).not.toHaveText('Choose a family for the molecule on screen.')
      await page.waitForTimeout(200)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-1-sorter-answered-${scheme}.png`) })

      await section.getByRole('button', { name: 'Next molecule' }).click()
      await section.getByRole('button', { name: 'Aromatic' }).click()
      await page.waitForTimeout(200)
      await section.screenshot({ path: path.join(SCREEN_DIR, `u9-9-1-sorter-benzene-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })

    test('9.2: every Scrolly Step and the carbon counter render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(ALKANES)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Alkanes: Structure, Nomenclature and Isomerism')

      await waitForScrolly(page, 'alkane-isomers')
      await expect(page.locator('[data-animation="alkane-isomers"] [data-scrolly-step]')).toHaveCount(4)
      for (let i = 0; i < 4; i++) await shotStep(page, 'alkane-isomers', i, '9-2-isomers', scheme)
      await gotoStep(page, 'alkane-isomers', 3)
      await expect(page.getByTestId('isomer-visual').first()).toHaveAttribute('data-step', '3')

      const lab = page.getByTestId('carbon-counter')
      await lab.scrollIntoViewIfNeeded()
      await expect(lab.getByTestId('counter-drawing')).toBeVisible()
      await page.waitForTimeout(300)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-counter-default-${scheme}.png`) })

      await lab.getByTestId('counter-chip').nth(1).click()
      await lab.getByTestId('counter-class').nth(1).click()
      await expect(lab.getByTestId('counter-score')).toHaveText('1 of 5 predicted.')
      await lab.getByRole('button', { name: 'Reveal from the lib' }).click()
      await expect(lab.getByTestId('counter-score')).toContainText('predictions match.')
      await page.waitForTimeout(200)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-counter-revealed-${scheme}.png`) })

      await page.getByTestId('counter-preset').selectOption({ label: '2,2-dimethylpropane' })
      await expect(lab.getByTestId('counter-products')).toHaveText('1 distinct product')
      await page.waitForTimeout(200)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-counter-neopentane-${scheme}.png`) })

      await page.getByTestId('counter-preset').selectOption({ label: '2-methylbutane' })
      await expect(lab.getByTestId('counter-products')).toHaveText('4 distinct products')
      await expect(lab.getByTestId('counter-isomers')).toContainText('2-methylbutane (this molecule)')
      await page.waitForTimeout(200)
      await lab.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-counter-isopentane-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
