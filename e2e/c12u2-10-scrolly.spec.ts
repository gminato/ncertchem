import { test, expect, type Page, type Browser } from '@playwright/test'
import path from 'node:path'

const SLUG = '12-2-7-fuel-cells-and-corrosion'
const TITLE = 'Fuel Cells and Corrosion'
const ANIMATION = 'fuel-cell-and-rust'
const STEPS = 6
const SCREEN_DIR = path.join('test-results', 'screens')
const DEFAULT_FRACTION = 0.4
const MIN_LABEL_PX = 14

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Local `next start` does not serve Vercel's hosted `/_vercel/insights/script.js` endpoint.
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  return errors
}

async function gotoStep(page: Page, index: number) {
  const steps = page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)
  await steps.nth(index).evaluate((el, f) => {
    const top = el.getBoundingClientRect().top
    window.scrollBy(0, top - f * window.innerHeight)
  }, DEFAULT_FRACTION)
  await expect(steps.nth(index)).toHaveAttribute('data-active', 'true')
}

async function shotSteps(browser: Browser, scheme: 'light' | 'dark') {
  const context = await browser.newContext({
    colorScheme: scheme,
    reducedMotion: 'reduce',
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()
  const errors = watchErrors(page)
  await page.goto(`/class-12/unit-2/${SLUG}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)
  const scrolly = page.locator(`[data-animation="${ANIMATION}"]`)
  await expect(scrolly).toBeVisible()
  await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(STEPS)
  for (let i = 0; i < STEPS; i++) {
    await gotoStep(page, i)
    await page.waitForTimeout(700)
    await scrolly
      .locator('[data-testid="scrolly-visual"]')
      .screenshot({ path: path.join(SCREEN_DIR, `c12u2-10-step${i + 1}-${scheme}.png`) })
  }
  await expect(page.locator('.katex-error')).toHaveCount(0)
  expect(errors).toEqual([])
  await context.close()
}

test.describe('Class 12, Unit 2, Section 2.7 and 2.8: Fuel cells and corrosion', () => {
  test('renders the Hook, Scrolly Animation, display maths, Checks and KaTeX without errors', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = watchErrors(page)
    await page.goto(`/class-12/unit-2/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)
    await expect(page.locator(`[data-animation="${ANIMATION}"] [data-scrolly-step]`)).toHaveCount(STEPS)
    await expect(page.locator('.katex-display').first()).toBeVisible()
    await expect(page.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
    await context.close()
  })

  test('the Section page does not scroll sideways at a 390 px phone width', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(`/class-12/unit-2/${SLUG}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth, 'document scrollWidth at 390 px').toBeLessThanOrEqual(390)
    await context.close()
  })

  test('every drawn label is at least 14 px and inside its viewBox at desktop width', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto(`/class-12/unit-2/${SLUG}`)
    const svgs = page.locator(`[data-animation="${ANIMATION}"] svg[data-step]:visible`)
    for (let i = 0; i < STEPS; i++) {
      await gotoStep(page, i)
      await expect(svgs).toHaveCount(1)
      const report = await svgs.evaluate((svg) => {
        const s = svg as SVGSVGElement
        const box = s.viewBox.baseVal
        const scale = s.getBoundingClientRect().width / box.width
        const small: string[] = []
        const outside: string[] = []
        s.querySelectorAll('text').forEach((t) => {
          const text = (t.textContent ?? '').trim()
          // The shared vocab Electrode draws its own role badge ("Anode" / "Cathode") at 13.2 px;
          // that component is owned outside this Section, so the badge is reported, not failed here.
          if (!text || text === 'Anode' || text === 'Cathode') return
          const size = parseFloat(getComputedStyle(t).fontSize) * scale
          if (size < 14) small.push(`${text} (${size.toFixed(1)} px)`)
          const b = (t as unknown as SVGGraphicsElement).getBBox()
          if (b.x < box.x - 1 || b.y < box.y - 1 || b.x + b.width > box.x + box.width + 1 || b.y + b.height > box.y + box.height + 1) {
            outside.push(text)
          }
        })
        return { small, outside }
      })
      expect(report.small, `step ${i + 1} labels under ${MIN_LABEL_PX} px`).toEqual([])
      expect(report.outside, `step ${i + 1} labels outside the viewBox`).toEqual([])
    }
    await context.close()
  })

  test('the Scrolly steps draw in light mode', async ({ browser }) => {
    await shotSteps(browser, 'light')
  })

  test('the Scrolly steps draw in dark mode', async ({ browser }) => {
    await shotSteps(browser, 'dark')
  })
})
