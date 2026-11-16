import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-3-5-oxidation-ozonolysis-polymerisation'
const ANIMATION = 'alkene-cleavage'
const SIM = 'ozonolysis-detective'
const STEP_NAMES = ['baeyer', 'diol', 'cut', 'products', 'reverse', 'polymer'] as const
// The wide layout activates a Step once it rises into the band just above the 97% line, so park it near 0.9.
const DEFAULT_FRACTION = 0.9

/** Waits for hydration and the Scrolly's first Step to be marked active. */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Scrolls so that the Step is the active one. */
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
 * Every drawn element (text, line, path, circle) of an SVG sits inside the SVG's box. Returns the
 * elements that do not, by tag and text, so a failure names what is clipped.
 */
async function outsideBox(svg: Locator): Promise<string[]> {
  return svg.evaluate((el) => {
    const box = el.getBoundingClientRect()
    const out: string[] = []
    el.querySelectorAll('text, line, path, circle, rect').forEach((n) => {
      const r = n.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      const tol = 1
      if (r.left < box.left - tol || r.right > box.right + tol || r.top < box.top - tol || r.bottom > box.bottom + tol) {
        out.push(`${n.tagName} "${(n.textContent ?? '').trim().slice(0, 40)}"`)
      }
    })
    return out
  })
}

/**
 * Every text element in the simulation, excluding the shell's eyebrow and title: HTML text at least
 * 14 px (names in the drawings 16 px, equations 15 px); SVG text at least 14 px after the viewBox scale.
 */
async function smallText(sim: Locator): Promise<string[]> {
  return sim.evaluate((root) => {
    const bad: string[] = []
    root.querySelectorAll('*').forEach((el) => {
      if (el.closest('header')) return
      // Text runs: ignore zero-width spacers, and skip KaTeX's internal spans (its subscripts are drawn
      // at 70% of the equation size by design). The equation container itself is checked below.
      const text = (el.textContent ?? '').replace(/\u200b/g, '').trim()
      const direct = [...el.childNodes].some((c) => c.nodeType === 3 && (c.textContent ?? '').replace(/\u200b/g, '').trim())
      if (!direct || !text) return
      if (el.closest('.katex') && !el.classList.contains('katex')) return
      const label = text.slice(0, 40)
      if (el instanceof SVGElement) {
        const svg = el.ownerSVGElement
        if (!svg) return
        const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width
        const size = parseFloat(el.getAttribute('font-size') ?? getComputedStyle(el).fontSize) * scale
        const min = el.getAttribute('data-role') === 'name' ? 16 : 14
        if (size < min - 0.05) bad.push(`svg ${size.toFixed(1)}px "${label}"`)
        return
      }
      const inEquation = el.closest('[data-testid="forward-equation"]') !== null
      const size = parseFloat(getComputedStyle(el).fontSize)
      const min = inEquation ? 15 : 14
      if (size < min - 0.05) bad.push(`html ${size.toFixed(1)}px "${label}"`)
    })
    root.querySelectorAll('[data-testid="forward-equation"]').forEach((eq) => {
      const size = parseFloat(getComputedStyle(eq).fontSize)
      if (size < 15) bad.push(`equation ${size.toFixed(1)}px`)
    })
    return bad
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.3.5 part 2 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('Scrolly Steps and the ozonolysis detective render inside their boxes, at legible sizes, with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Properties of Alkenes: Oxidation, Ozonolysis and Polymerisation')

      const root = await waitForScrolly(page)
      await expect(root.locator('[data-scrolly-step]')).toHaveCount(6)
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(1100)
        const visual = root.getByTestId('cleavage-visual')
        expect(await outsideBox(visual), `Scrolly step ${i + 1} clips`).toEqual([])
        await visual.screenshot({
          path: path.join(SCREEN_DIR, `u9-9-3-5-b-step${i + 1}-${STEP_NAMES[i]}-${scheme}.png`),
        })
      }

      const sim = page.locator(`[data-simulation="${SIM}"]`)
      await sim.scrollIntoViewIfNeeded()
      await page.waitForTimeout(400)
      const stageSvg = sim.locator('svg').first()
      const check = async (name: string) => {
        expect(await smallText(sim), `${name}: text too small`).toEqual([])
        expect(await outsideBox(stageSvg), `${name}: drawing clips`).toEqual([])
        await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-3-5-b-sim-${name}-${scheme}.png`) })
      }

      await check('forward-default')

      await sim.getByRole('radio', { name: 'Preset' }).click()
      await sim.getByRole('radio', { name: 'Hot acidic KMnO₄' }).click()
      await sim.getByRole('radio', { name: '1-methylcyclohexene' }).click()
      await page.waitForTimeout(300)
      await check('forward-acidic')

      await sim.getByRole('radio', { name: 'Penta-1,3-diene' }).click()
      await sim.getByRole('radio', { name: 'Ozone, then Zn and water' }).click()
      await page.waitForTimeout(300)
      await check('forward-diene')

      await sim.getByRole('radio', { name: 'Reverse: products to alkene' }).click()
      await page.waitForTimeout(300)
      await check('reverse-default')

      const carbonyls = sim.locator('circle[role="button"]')
      await carbonyls.nth(0).click()
      await carbonyls.nth(1).click()
      await expect(sim.getByTestId('reverse-readout')).toContainText('Joined: 2-methylpent-2-ene')
      await page.waitForTimeout(300)
      await check('reverse-joined')

      expect(errors).toEqual([])
    })
  })
}
