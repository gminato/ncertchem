import { test, expect, type Page } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

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

/** Rendered font size of every text in the section: HTML text as computed, SVG text scaled by its viewBox. */
async function renderedTextSizes(page: Page) {
  return page.evaluate(() => {
    const section = document.querySelector('#kinetics')
    if (!section) return { missing: true, small: [] as string[], outside: [] as string[], count: 0 }
    const small: string[] = []
    const outside: string[] = []
    let count = 0
    const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = (node.textContent ?? '').trim()
      const el = node.parentElement
      if (text && el) {
        count++
        const svg = el.closest('svg')
        const cs = getComputedStyle(el)
        let size = parseFloat(cs.fontSize)
        if (svg && el instanceof SVGElement) {
          const vb = svg.viewBox.baseVal
          const box = svg.getBoundingClientRect()
          const scale = vb && vb.width ? box.width / vb.width : 1
          size = parseFloat(el.getAttribute('font-size') ?? cs.fontSize) * scale
          // Screen rectangles, so rotated axis titles are measured after their transform.
          const r = el.getBoundingClientRect()
          const tol = 1
          if (r.left < box.left - tol || r.top < box.top - tol || r.right > box.right + tol || r.bottom > box.bottom + tol) {
            outside.push(text.slice(0, 40))
          }
        }
        if (size < 13) small.push(`${text.slice(0, 40)} (${size.toFixed(1)}px)`)
      }
      node = walker.nextNode()
    }
    return { missing: false, small, outside, count }
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test(`kinetics Visual Vocabulary renders cleanly in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto('/vocab#kinetics')
    const section = page.locator('#kinetics')
    await expect(section).toBeVisible()
    await expect(section.locator('svg')).toHaveCount(9)
    await section.scrollIntoViewIfNeeded()

    const sizes = await renderedTextSizes(page)
    expect(sizes.missing).toBe(false)
    expect(sizes.count).toBeGreaterThan(20)
    expect(sizes.small).toEqual([])
    expect(sizes.outside).toEqual([])

    const dir = path.join(process.cwd(), 'test-results', 'screens')
    fs.mkdirSync(dir, { recursive: true })
    await section.screenshot({ path: path.join(dir, `c12u3-vocab-${scheme}.png`) })
    expect(errors).toEqual([])
  })
}

test('kinetics section does not scroll sideways at phone width', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vocab#kinetics')
  const section = page.locator('#kinetics')
  await expect(section).toBeVisible()
  const width = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(width).toBeLessThanOrEqual(390)
})
