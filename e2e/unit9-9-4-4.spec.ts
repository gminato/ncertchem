import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-4-4-properties-of-alkynes'
const ANIMATION = 'alkyne-reactions'
const SIM = 'alkyne-acid-test'
const STEP_COUNT = 5
const DEFAULT_FRACTION = 0.9

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
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
}


/**
 * The rendered font size, in CSS px, of every text element inside the sim (SVG text is scaled by its
 * viewBox). The eyebrow of the Simulation shell is outside the sim root, so it is not included.
 */
async function simTextSizes(sim: Locator): Promise<{ text: string; size: number }[]> {
  return sim.evaluate((root) => {
    const out: { text: string; size: number }[] = []
    for (const el of Array.from(root.querySelectorAll<HTMLElement | SVGElement>('*'))) {
      const own = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('')
        .replace(/[\s\u200b]/g, '')
      if (!own) continue
      let size = parseFloat(getComputedStyle(el).fontSize)
      if (el instanceof SVGElement && el.ownerSVGElement) {
        const ctm = (el as SVGGraphicsElement).getScreenCTM()
        size *= ctm ? ctm.a : 1
      }
      out.push({ text: own.slice(0, 40), size })
    }
    return out
  })
}

async function expectSimTextAtLeast14(section: Locator) {
  const sizes = await simTextSizes(section.getByTestId('alkyne-acid-test'))
  expect(sizes.length).toBeGreaterThan(0)
  const small = sizes.filter((x) => x.size < 14)
  expect(small, JSON.stringify(small)).toEqual([])
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.4.4 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the acid-test lab render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Properties of Alkynes')

      const root = await waitForScrolly(page)
      await expect(root.locator('[data-scrolly-step]')).toHaveCount(STEP_COUNT)
      const panel = root.locator('[data-testid="scrolly-visual"]')
      for (let i = 0; i < STEP_COUNT; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(600)
        await panel.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-4-alkyne-step${i + 1}-${scheme}.png`) })
      }

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByRole('heading', { level: 3 })).toHaveText('The sodium test and addition lab')
      await page.waitForTimeout(400)
      await expectSimTextAtLeast14(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-4-sim-default-${scheme}.png`) })

      // Changed state 1: but-2-yne (internal) does not react with sodium.
      await sim.getByRole('radiogroup', { name: 'Hydrocarbon' }).getByRole('radio', { name: 'but-2-yne' }).click()
      await expect(sim.getByTestId('acid-verdict')).toHaveAttribute('data-reacts', 'no')
      await page.waitForTimeout(300)
      await expectSimTextAtLeast14(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-4-sim-butyne-${scheme}.png`) })

      // Changed state 2: propyne with sodamide, and the addition with HBr.
      await sim.getByRole('radiogroup', { name: 'Hydrocarbon' }).getByRole('radio', { name: 'propyne' }).click()
      await sim.getByRole('radiogroup', { name: 'Base for the test' }).getByRole('radio', { name: 'Sodamide' }).click()
      await sim.getByRole('radiogroup', { name: 'Reagent for addition' }).getByRole('radio', { name: 'HBr' }).click()
      await expect(sim.getByTestId('acid-verdict')).toHaveAttribute('data-reacts', 'yes')
      await page.waitForTimeout(300)
      await expectSimTextAtLeast14(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-4-sim-propyne-${scheme}.png`) })

      // Changed state 3: ethyne with water under mercury(II).
      await sim.getByRole('radiogroup', { name: 'Hydrocarbon' }).getByRole('radio', { name: 'ethyne' }).click()
      await sim.getByRole('radiogroup', { name: 'Reagent for addition' }).getByRole('radio', { name: 'H₂O, Hg²⁺' }).click()
      await page.waitForTimeout(300)
      await expectSimTextAtLeast14(sim)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-4-4-sim-water-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
