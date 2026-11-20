import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const where = msg.location().url ?? ''
    if (/accounts\.google\.com|gstatic\.com/.test(where) || msg.text().includes('[GSI_LOGGER]')) return
    errors.push(`${msg.text()} [${where}]`)
  })
})

test.afterEach(() => {
  expect(errors, errors.join('\n')).toEqual([])
})

test.describe('signed out /account page', () => {
  test('shows the signed-out text and a link to /#syllabus', async ({ page }) => {
    await page.goto('/account')
    await expect(page).toHaveTitle('Account · NCERTCHEM')
    await expect(page.getByRole('heading', { name: 'Your Account' })).toBeVisible()
    await expect(
      page.getByText('Sign in to see your Account here. Your Progress stays in this browser until you do.')
    ).toBeVisible()

    const link = page.getByRole('link', { name: 'Back to the Syllabus Map' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/#syllabus')

    // No sign-in widget rendered in the page content itself (header has it).
    await expect(page.locator('main').getByTestId('sign-in-button')).toHaveCount(0)
    await expect(page.locator('main').getByTestId('google-sign-in')).toHaveCount(0)
  })

  test('header does not move between / and /account', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('sign-in-button')).toBeVisible()
    const homeHeader = page.locator('header').first()
    const homeBox = await homeHeader.boundingBox()

    await page.goto('/account')
    await expect(page.getByTestId('sign-in-button')).toBeVisible()
    const accountHeader = page.locator('header').first()
    const accountBox = await accountHeader.boundingBox()

    expect(homeBox).not.toBeNull()
    expect(accountBox).not.toBeNull()
    expect(accountBox!.y).toBeCloseTo(homeBox!.y, 0)
    expect(accountBox!.height).toBeCloseTo(homeBox!.height, 0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the page has no sideways scroll at 390px', async ({ page }) => {
    await page.goto('/account')
    await expect(page.getByRole('heading', { name: 'Your Account' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('account page desktop and phone', async ({ page }) => {
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto('/account')
      await expect(page.getByRole('heading', { name: 'Your Account' })).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: path.join(SCREEN_DIR, `account-page-${scheme}.png`) })

      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: path.join(SCREEN_DIR, `account-page-phone-${scheme}.png`) })
    })
  })
}
