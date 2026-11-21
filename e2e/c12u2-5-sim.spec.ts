import { test, expect, type Page } from '@playwright/test'
import { balanceSetting, measureCell } from '../src/lib/chem/conductivity-bridge'

const SIM = '/dev/sim/conductivity-cell-lab'

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

function bridgeSvg(page: Page) {
  return page.getByRole('img', { name: /AC Wheatstone bridge/ })
}

/** Click the fine-trim buttons until the lib's trim value is reached. */
async function applyTrim(page: Page, trim: number) {
  const up = trim > 0
  const tens = Math.floor(Math.abs(trim) / 10)
  const ones = Math.abs(trim) % 10
  const tenLabel = up ? /^\+0\.1 %$/ : /^−0\.1 %$/
  const oneLabel = up ? /^\+0\.01 %$/ : /^−0\.01 %$/
  for (let k = 0; k < tens; k++) await page.getByRole('button', { name: tenLabel }).click()
  for (let k = 0; k < ones; k++) await page.getByRole('button', { name: oneLabel }).click()
}

/** Put the variable resistor on the coarse index and fine trim that the lib says balance the bridge. */
async function balanceFor(page: Page, rx: number, ratio: number) {
  const setting = balanceSetting(rx, ratio)
  await page.getByRole('slider', { name: 'Coarse resistor Rᵥ' }).fill(String(setting.index))
  await page.getByRole('button', { name: 'Reset trim' }).click()
  await applyTrim(page, setting.trim)
  return setting
}

for (const scheme of ['light', 'dark'] as const) {
  test(`conductivity cell lab: default, balanced and changed states in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(SIM)
    const svg = bridgeSvg(page)
    await expect(svg).toBeVisible()
    const stage = svg.locator('xpath=..')

    // Default state: unbalanced, so the readouts are provisional.
    await expect(page.locator('[aria-live="polite"]')).toContainText('Not balanced')
    await stage.screenshot({ path: `test-results/screens/c12u2-5-sim-default-${scheme}.png` })

    // Balanced state, reached by keyboard-reachable controls: coarse slider, then fine trim buttons.
    const rx = 1 / 0.0129 // KCl 0.1 mol L⁻¹ with G* = 1 cm⁻¹ (plate area 1 cm², separation 1 cm)
    const setting = await balanceFor(page, rx, 1)
    const expectedR = measureCell({
      solutionId: 'kcl-0.1',
      gapCm: 1,
      areaCm2: 1,
      ratio: 'unity',
      index: setting.index,
      trim: setting.trim,
    })
    await expect(page.locator('[aria-live="polite"]')).toContainText('Null: the bridge is balanced')
    await expect(page.locator('dt', { hasText: 'Balance' })).toBeVisible()
    await expect(page.locator('dt', { hasText: 'Molar conductivity' })).toBeVisible()
    expect(expectedR.isNull).toBe(true)
    await stage.screenshot({ path: `test-results/screens/c12u2-5-sim-balanced-${scheme}.png` })

    // Changed state: the 0.01 mol L⁻¹ KCl solution in a longer, narrower cell, rebalanced.
    await page.getByRole('radiogroup', { name: 'KCl concentration, mol L⁻¹' }).getByRole('radio', { name: '0.01', exact: true }).click()
    await page.getByRole('slider', { name: 'Plate area A' }).fill('4')
    await page.getByRole('slider', { name: 'Plate separation l' }).fill('0.5')
    await page.getByRole('radiogroup', { name: 'Ratio arms R₄ / R₃' }).getByRole('radio', { name: '0.1', exact: true }).click()
    const rx2 = (0.5 / 4) / 0.00141
    await balanceFor(page, rx2, 0.1)
    await expect(page.locator('[aria-live="polite"]')).toContainText('Null: the bridge is balanced')
    await stage.screenshot({ path: `test-results/screens/c12u2-5-sim-dilute-${scheme}.png` })

    expect(errors).toEqual([])
  })
}

test('conductivity cell lab text is at least 14 px and drawing stays inside its viewBox', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(SIM)
  const svg = bridgeSvg(page)
  await expect(svg).toBeVisible()

  const smallText = await page.evaluate(() => {
    const root = document.querySelector('[role="img"][aria-label^="AC Wheatstone"]')?.parentElement?.parentElement
    if (!root) return ['sim root not found']
    const offenders: string[] = []
    const walker = root.querySelectorAll<HTMLElement | SVGElement>('*')
    walker.forEach((el) => {
      if (el.closest('[class*="srOnly"]')) return
      const own = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      )
      if (!own) return
      if (el.closest('.katex')) return
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (size < 14) offenders.push(`${el.tagName} ${size}px "${(el.textContent ?? '').trim().slice(0, 30)}"`)
    })
    return offenders
  })
  expect(smallText).toEqual([])

  const clipped = await page.evaluate(() => {
    const svgEl = document.querySelector<SVGSVGElement>('svg[role="img"][aria-label^="AC Wheatstone"]')
    if (!svgEl) return ['svg not found']
    const box = svgEl.getBoundingClientRect()
    const out: string[] = []
    svgEl.querySelectorAll<SVGGraphicsElement>('path, rect, circle, text, line').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      const tol = 1
      if (r.left < box.left - tol || r.right > box.right + tol || r.top < box.top - tol || r.bottom > box.bottom + tol) {
        out.push(`${el.tagName} "${(el.textContent ?? '').trim().slice(0, 20)}"`)
      }
    })
    return out
  })
  expect(clipped).toEqual([])
})

test('conductivity cell lab does not scroll sideways at 390 by 844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(SIM)
  await expect(bridgeSvg(page)).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
