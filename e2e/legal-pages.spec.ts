import { test, expect, type Page } from '@playwright/test'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const where = msg.location().url ?? ''
    if (/accounts\.google\.com|gstatic\.com/.test(where) || msg.text().includes('[GSI_LOGGER]')) return
    errors.push(msg.text())
  })
  return errors
}

test.describe('Privacy and Terms pages', () => {
  test('the Privacy page loads and displays published disclosures', async ({ page }) => {
    const errors = watchErrors(page)
    const response = await page.goto('/privacy')
    expect(response?.status()).toBe(200)

    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()
    await expect(page.getByText('Draft, pending legal review')).toHaveCount(0)
    await expect(page.getByText(/Last updated:/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'What is stored' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Payments and Razorpay' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Learners under 18' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('the Terms page loads and displays published commercial and grievance terms', async ({ page }) => {
    const errors = watchErrors(page)
    const response = await page.goto('/terms')
    expect(response?.status()).toBe(200)

    await expect(page.getByRole('heading', { level: 1, name: 'Terms of Use' })).toBeVisible()
    await expect(page.getByText('Draft, pending legal review')).toHaveCount(0)
    await expect(page.getByText(/Last updated:/)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Access and Accounts' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Grievance Officer' })).toBeVisible()
    await expect(page.getByText('grievance@ncertchem.com').first()).toBeVisible()

    expect(errors).toEqual([])
  })

  test('sign-in panel links navigate to Privacy and Terms', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/class-11/unit-1')
    await page.getByTestId('sign-in-button').click()

    const panel = page.getByTestId('sign-in-panel')
    await expect(panel).toBeVisible()

    await panel.getByRole('link', { name: 'Privacy' }).click()
    await expect(page).toHaveURL(/\/privacy$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible()

    expect(errors).toEqual([])
  })

  test('legal pages fit a 390px phone screen without sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    for (const url of ['/privacy', '/terms']) {
      await page.goto(url)
      const widths = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(widths.scroll, `${url} fits 390px`).toBeLessThanOrEqual(widths.client)
    }
  })
})
