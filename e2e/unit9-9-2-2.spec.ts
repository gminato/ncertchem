import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Locator, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const SECTION = '/class-11/unit-9/9-2-2-preparation-of-alkanes'
const ANIMATION = 'alkane-routes'
const SIM = '[data-simulation="alkane-synthesis-planner"]'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  const root = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(root.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
  return root
}

/** Moves the page so the Step is the active one, then waits for the visual to settle. */
async function gotoStep(page: Page, index: number) {
  await page
    .locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
    .nth(index)
    .evaluate((el) => {
      const top = el.getBoundingClientRect().top
      window.scrollBy(0, top - 0.4 * window.innerHeight)
    })
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`).nth(index)).toHaveAttribute('data-active', 'true')
  await expect(page.locator(`[data-animation="${ANIMATION}"] [data-testid="routes-visual"]`)).toHaveAttribute('data-step', String(index))
  await page.waitForTimeout(900)
}


/** The smallest computed font size of the planner's own text (outside SVG), with the element it belongs to. */
async function plannerTextSizes(sim: Locator) {
  return sim.evaluate((root) => {
    const out: { text: string; px: number; tag: string }[] = []
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    let node = walker.currentNode as Element | null
    while (node) {
      if (!(node instanceof SVGElement) && node.closest('svg') === null && node.closest('header') === null) {
        const own = Array.from(node.childNodes).filter((c) => c.nodeType === Node.TEXT_NODE && (c.textContent ?? '').replace(/\u200b/g, '').trim())
        if (own.length > 0) {
          const style = getComputedStyle(node)
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            out.push({ text: (own[0].textContent ?? '').trim().slice(0, 40), px: parseFloat(style.fontSize), tag: node.tagName.toLowerCase() })
          }
        }
      }
      node = walker.nextNode() as Element | null
    }
    return out
  })
}

/** Every drawn element of an SVG lies inside the SVG box, with a margin. */
async function drawingInsideBox(svg: Locator) {
  return svg.evaluate((el) => {
    const box = el.getBoundingClientRect()
    const bad: string[] = []
    el.querySelectorAll('text, path, line, polygon').forEach((n) => {
      const r = n.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      if (r.left < box.left + 4 || r.right > box.right - 4 || r.top < box.top + 2 || r.bottom > box.bottom - 2) {
        bad.push(`${n.tagName} ${(n.textContent ?? '').slice(0, 30)}`)
      }
    })
    return bad
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 9, Section 9.2.2 (${scheme})`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
    test.setTimeout(180_000)

    test('every Scrolly Step and the synthesis planner render with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto(SECTION)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Preparation of Alkanes')

      // The routes Scrolly: six Steps, four schemes and Kolbe's cell.
      await waitForScrolly(page)
      await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(6)
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        expect(await drawingInsideBox(page.locator(`[data-animation="${ANIMATION}"] [data-testid="routes-visual"]`)), `Step ${i} drawing`).toEqual([])
        await page
          .locator(`[data-animation="${ANIMATION}"] [data-testid="scrolly-visual"]`)
          .screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-routes-step${i}-${scheme}.png`) })
      }
      await gotoStep(page, 3)
      await expect(page.getByTestId('routes-arithmetic')).toContainText('1 + 1 = 2')
      await expect(page.getByTestId('routes-names')).toContainText('ethane, pentane, octane')
      await gotoStep(page, 5)
      await expect(page.getByTestId('routes-title')).toHaveText("Kolbe's electrolytic method")

      // The planner: the default state (a mixture), then a decarboxylation and the methane question.
      const sim = page.locator(SIM)
      await sim.evaluate((el) => el.scrollIntoView({ block: 'center' }))
      await expect(sim.getByTestId('planner-verdict')).toHaveText('Gives pentane, but only as one of 3 products.')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-default-${scheme}.png`) })

      // Planner text is at least 14 px, the outcome line 16 px, and the equation 15 px.
      const sizes = await plannerTextSizes(sim)
      expect(sizes.length).toBeGreaterThan(5)
      const small = sizes.filter((x) => x.px < 14)
      expect(small, JSON.stringify(small)).toEqual([])
      const verdict = await sim.getByTestId('planner-verdict').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      expect(verdict).toBeGreaterThanOrEqual(16)
      const eq = await sim.getByTestId('planner-equation').evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      expect(eq).toBeGreaterThanOrEqual(15)


      await sim.getByTestId('planner-route').selectOption('decarboxylate')
      await sim.getByTestId('planner-target').selectOption('propane')
      await sim.getByTestId('planner-a').selectOption('butanoic')
      await expect(sim.getByTestId('planner-verdict')).toHaveText('Gives propane, and nothing else.')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-decarboxylate-${scheme}.png`) })

      await sim.getByTestId('planner-route').selectOption('kolbe')
      await sim.getByTestId('planner-target').selectOption('methane')
      await sim.getByTestId('planner-a').selectOption('methanoic')
      await expect(sim.getByTestId('planner-verdict')).toContainText('methane cannot be made this way')
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-kolbe-methane-${scheme}.png`) })

      // The Wurtz row fits its box: nothing is clipped at either edge.
      await sim.getByTestId('planner-route').selectOption('wurtz')
      await sim.getByTestId('planner-target').selectOption('pentane')
      await sim.getByTestId('planner-a').selectOption('bromomethane')
      await sim.getByTestId('planner-b').selectOption('1-bromobutane')
      await expect(sim.getByTestId('planner-verdict')).toHaveText('Gives pentane, but only as one of 3 products.')
      expect(await drawingInsideBox(sim.getByTestId('planner-drawing')), 'planner drawing').toEqual([])
      await page.waitForTimeout(300)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u9-9-2-2-planner-wurtz-${scheme}.png`) })

      expect(errors, errors.join('\n')).toEqual([])
    })
  })
}
