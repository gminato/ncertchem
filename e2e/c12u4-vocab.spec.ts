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

/** Smallest rendered font size of any SVG text in the section: CSS font size times the SVG's rendered scale. */
async function smallestRenderedText(page: Page, sectionId: string): Promise<{ min: number; count: number; where: string }> {
  return page.evaluate((id) => {
    const section = document.getElementById(id)
    if (!section) return { min: 0, count: 0, where: 'missing section' }
    let min = Infinity
    let where = ''
    let count = 0
    for (const svg of Array.from(section.querySelectorAll('svg'))) {
      const vb = svg.viewBox.baseVal
      if (!vb || vb.width === 0) continue
      const scale = svg.getBoundingClientRect().width / vb.width
      for (const t of Array.from(svg.querySelectorAll('text'))) {
        const fs = parseFloat(getComputedStyle(t).fontSize)
        if (!fs || !t.textContent?.trim()) continue
        count++
        const rendered = fs * scale
        if (rendered < min) {
          min = rendered
          where = t.textContent.trim()
        }
      }
    }
    return { min, count, where }
  }, sectionId)
}

for (const scheme of ['light', 'dark'] as const) {
  test(`d- and f-block Visual Vocabulary renders cleanly in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto('/vocab#dblock')
    const section = page.locator('#dblock')
    await expect(section).toBeVisible()
    await expect(section.locator('svg')).toHaveCount(6)
    await section.scrollIntoViewIfNeeded()
    await section.screenshot({ path: `test-results/screens/c12u4-vocab-${scheme}.png` })

    const text = await smallestRenderedText(page, 'dblock')
    expect(text.count).toBeGreaterThan(40)
    expect(text.min, `smallest rendered text "${text.where}"`).toBeGreaterThanOrEqual(13)
    expect(errors).toEqual([])
  })
}

test('d- and f-block Visual Vocabulary does not scroll sideways at phone width', async ({ page }) => {
  test.setTimeout(120_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/vocab#dblock')
  await expect(page.locator('#dblock')).toBeVisible()
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
  expect(scrollWidth).toBeLessThanOrEqual(390)
})
