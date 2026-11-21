import { test, expect, type Page } from '@playwright/test'

const SIM = '/dev/sim/opposing-voltage-lab'
const STAGE_SVG = 'svg[aria-label^="Daniell cell"]'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      if (text.includes('Failed to load resource: the server responded with a status of 404')) return
      errors.push(text)
    }
  })
  return errors
}

async function setEext(page: Page, value: number) {
  await page.getByRole('slider', { name: 'Opposing source Eext' }).fill(String(value))
}

async function expectTextAtLeast14px(page: Page) {
  const small = await page.locator(STAGE_SVG).evaluate((svg) => {
    const root = svg.closest('div')?.parentElement as HTMLElement
    const nodes = Array.from(root.querySelectorAll<HTMLElement | SVGElement>('text, p, span, label, button, dt, dd'))
    return nodes
      .filter((el) => !el.closest('.katex') && !el.className.toString().includes('srOnly'))
      .filter((el) => Array.from(el.childNodes).some((n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim() !== ''))
      .map((el) => ({ text: (el.textContent ?? '').trim(), size: parseFloat(getComputedStyle(el).fontSize) }))
      .filter((x) => x.size < 14)
  })
  expect(small).toEqual([])
}

async function expectSvgContentInBounds(page: Page) {
  const outside = await page.locator(STAGE_SVG).evaluate((svg) => {
    const s = svg as SVGSVGElement
    const sr = s.getBoundingClientRect()
    const out: string[] = []
    const items = Array.from(s.querySelectorAll<SVGGraphicsElement>('text, path, circle, rect, line, ellipse, polyline, polygon'))
    for (const el of items) {
      if (el.closest('defs, clipPath, pattern, marker, mask, symbol')) continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      const tol = 1.5
      if (r.left < sr.left - tol || r.right > sr.right + tol || r.top < sr.top - tol || r.bottom > sr.bottom + tol) {
        out.push(`${el.tagName}:${(el.textContent ?? '').trim().slice(0, 30)}`)
      }
    }
    return out
  })
  expect(outside).toEqual([])
}

for (const scheme of ['light', 'dark'] as const) {
  test(`Opposing Voltage Lab: states, text size, bounds and screenshots in ${scheme}`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto(SIM)
    const stage = page.locator(STAGE_SVG).locator('xpath=..')
    await expect(page.locator(STAGE_SVG)).toBeVisible()

    // Default: Eext 0, galvanic
    await expect(page.locator('p[data-mode="galvanic"]')).toHaveText('Galvanic: the cell pushes electrons through the wire')
    await expectSvgContentInBounds(page)
    await expectTextAtLeast14px(page)
    await stage.screenshot({ path: `test-results/screens/c12u2-1-sim-default-${scheme}.png` })

    // Balanced at the cell EMF: no current, no electrons
    await setEext(page, 1.1)
    await expect(page.locator('p[data-mode="balanced"]')).toHaveText('Balanced: Eext equals the cell EMF, so no current flows')
    await stage.screenshot({ path: `test-results/screens/c12u2-1-sim-balanced-${scheme}.png` })

    // Electrolytic: reversed, with 2 minutes of play
    await setEext(page, 1.6)
    await expect(page.locator('p[data-mode="electrolytic"]')).toHaveText('Electrolytic: the source overpowers the cell and reverses it')
    await page.getByRole('button', { name: 'Play time' }).click()
    await expect(page.getByText('Pause time')).toBeVisible()
    await page.waitForTimeout(2500)
    await page.getByRole('button', { name: 'Pause time' }).click()
    await expect(page.getByText('Play time')).toBeVisible()
    await expect(page.locator('p[aria-live="polite"]')).toContainText('Eext 1.60 V')
    await expectSvgContentInBounds(page)
    await expectTextAtLeast14px(page)
    await stage.screenshot({ path: `test-results/screens/c12u2-1-sim-electrolytic-${scheme}.png` })

    expect(errors).toEqual([])
  })
}
