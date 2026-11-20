import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const UNIT_3_TITLE = 'Classification of Elements and Periodicity in Properties'
/** The browser's own message for the 404 response of the document. It is the only console error allowed. */
const EXPECTED_404_MESSAGE = 'Failed to load resource: the server responded with a status of 404'

/** Collects page errors and console errors, so a test can assert there were none. */
function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    if (msg.text().startsWith(EXPECTED_404_MESSAGE)) return
    errors.push(msg.text())
  })
  return errors
}

test.describe('Page not found', () => {
  test('an unknown address returns 404 and offers a way home', async ({ page }) => {
    const errors = watchErrors(page)
    const response = await page.goto('/no-such-page')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist')

    await page.getByRole('link', { name: 'Go to home' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('See the chemistry your textbook describes.')

    expect(errors).toEqual([])
  })

  test('a Section address inside a real Unit returns 404 and links to that Unit', async ({ page }) => {
    const errors = watchErrors(page)
    const response = await page.goto('/class-11/unit-3/renamed-section')
    expect(response?.status()).toBe(404)
    const hint = page.getByTestId('not-found-unit-hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText(UNIT_3_TITLE)

    await page.getByRole('link', { name: 'Open Unit 3' }).click()
    await expect(page).toHaveURL(/\/class-11\/unit-3$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(UNIT_3_TITLE)

    expect(errors).toEqual([])
  })

  for (const address of ['/class-11/unit-99/x', '/class-11/unit-99']) {
    test(`${address} returns 404 with no Unit hint`, async ({ page }) => {
      const errors = watchErrors(page)
      const response = await page.goto(address)
      expect(response?.status()).toBe(404)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist')
      await expect(page.getByTestId('not-found-unit-hint')).toHaveCount(0)

      expect(errors).toEqual([])
    })
  }

  test('a real Unit page still returns 200', async ({ page }) => {
    const errors = watchErrors(page)
    const response = await page.goto('/class-11/unit-3')
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(UNIT_3_TITLE)

    expect(errors).toEqual([])
  })

  test('the page does not redirect by itself', async ({ page }) => {
    await page.goto('/no-such-page')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForTimeout(3000)
    await expect(page).toHaveURL(/\/no-such-page$/)
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Page not found screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('plain 404 page', async ({ page }) => {
      const errors = watchErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/no-such-page')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: path.join(SCREEN_DIR, `not-found-plain-${scheme}.png`), fullPage: true })

      expect(errors).toEqual([])
    })

    test('404 page with the Unit hint', async ({ page }) => {
      const errors = watchErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/class-11/unit-3/renamed-section')
      await expect(page.getByTestId('not-found-unit-hint')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: path.join(SCREEN_DIR, `not-found-hint-${scheme}.png`), fullPage: true })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Page not found on a phone', () => {
  test.use({ colorScheme: 'light', viewport: { width: 390, height: 844 } })

  test('the 404 page with the Unit hint fits 390px without sideways scrolling', async ({ page }) => {
    const errors = watchErrors(page)
    fs.mkdirSync(SCREEN_DIR, { recursive: true })
    await page.goto('/class-11/unit-3/renamed-section')
    await expect(page.getByTestId('not-found-unit-hint')).toBeVisible()
    await page.evaluate(() => document.fonts.ready)

    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(widths.scroll).toBeLessThanOrEqual(widths.client)

    await page.screenshot({ path: path.join(SCREEN_DIR, 'not-found-mobile-390.png'), fullPage: true })
    expect(errors).toEqual([])
  })
})
