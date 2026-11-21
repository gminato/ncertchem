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
  test(`electrochem Visual Vocabulary renders cleanly in ${scheme}`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme })
    const errors = watchErrors(page)

    await page.goto('/vocab#electrochem')
    const section = page.locator('#electrochem')
    await expect(section).toBeVisible()
    await expect(section.locator('svg')).toHaveCount(6)
    await section.scrollIntoViewIfNeeded()

    await section.screenshot({ path: `test-results/screens/c12u2-vocab-${scheme}.png` })
    expect(errors).toEqual([])
  })
}
