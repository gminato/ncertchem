import { test, expect, type Page } from '@playwright/test'

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

for (const scheme of ['light', 'dark'] as const) {
  test(`Unit 6 drawing vocabulary renders cleanly in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto('/vocab#c12-unit6-vocab')
    const section = page.locator('#c12-unit6-vocab')
    await expect(section).toBeVisible()
    await expect(section.locator('svg')).toHaveCount(13)
    await section.scrollIntoViewIfNeeded()
    await section.screenshot({ path: `test-results/screens/c12u6-vocab-${scheme}.png` })

    // Rendered text size (R4): font-size × (rendered svg width / viewBox width), at least 13 px.
    const sizes = await section.locator('svg').evaluateAll((svgs) => {
      const out: { text: string; px: number }[] = []
      for (const svg of svgs as SVGSVGElement[]) {
        const vb = svg.viewBox.baseVal
        const scale = svg.getBoundingClientRect().width / vb.width
        svg.querySelectorAll('text').forEach((t) => {
          const fs = parseFloat(getComputedStyle(t).fontSize)
          out.push({ text: (t.textContent ?? '').trim(), px: fs * scale })
        })
      }
      return out
    })
    expect(sizes.length).toBeGreaterThan(50)
    const small = sizes.filter((s) => s.px < 13)
    expect(small, `texts under 13 px: ${JSON.stringify(small.slice(0, 10))}`).toEqual([])

    expect(errors).toEqual([])
  })
}

test('Unit 6 drawing vocabulary does not scroll sideways at phone width', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vocab#c12-unit6-vocab')
  await expect(page.locator('#c12-unit6-vocab svg').first()).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
