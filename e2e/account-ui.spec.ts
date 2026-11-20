import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

/**
 * The sign-in screens, signed out. The build reads .env.local, so Accounts are configured, but
 * these tests never sign in: Google's popup cannot be automated.
 */

const SCREEN_DIR = path.join('test-results', 'screens')

interface SeedSection {
  slug: string
  class: number
  unit: number
  order: number
  checkNumbers: string[]
}

const sections = (JSON.parse(fs.readFileSync(path.join('.velite', 'sections.json'), 'utf8')) as SeedSection[]).sort(
  (a, b) => a.class - b.class || a.unit - b.unit || a.order - b.order
)
const complete = sections[0]
const other = sections[1]
const href = (s: SeedSection) => `/class-${s.class}/unit-${s.unit}/${s.slug}`

function answeredAll(section: SeedSection): Record<string, number> {
  return Object.fromEntries(section.checkNumbers.map((n) => [`${section.slug}:${n}`, 1_700_000_000_000]))
}

async function seed(page: Page): Promise<void> {
  const progress = JSON.stringify({ answered: answeredAll(complete), lastOpened: null })
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('progress:v1', value)
      sessionStorage.setItem('seeded', '1')
    }
  }, progress)
}

let errors: string[] = []

test.beforeEach(async ({ page }) => {
  errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const where = msg.location().url ?? ''
    // Google's own script logs in a test browser, e.g. that this test port is not a registered origin.
    if (/accounts\.google\.com|gstatic\.com/.test(where) || msg.text().includes('[GSI_LOGGER]')) return
    errors.push(`${msg.text()} [${where}]`)
  })
})

test.afterEach(() => {
  expect(errors, errors.join('\n')).toEqual([])
})

test.describe('the Sign in button in the header', () => {
  for (const url of ['/', '/class-11/unit-1', href(complete)]) {
    test(`shows on ${url} without moving the header`, async ({ page }) => {
      await page.goto(url)
      const header = page.locator('header').first()
      const before = await header.boundingBox()
      await expect(page.getByTestId('sign-in-button')).toBeVisible()
      const after = await header.boundingBox()
      expect(after!.height).toBeCloseTo(before!.height, 0)
    })
  }

  test('opens the panel, which closes on Escape and on a click outside', async ({ page }) => {
    await page.goto('/class-11/unit-1')
    const button = page.getByTestId('sign-in-button')
    await button.click()
    const panel = page.getByTestId('sign-in-panel')
    await expect(panel).toBeVisible()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(panel.getByText('Under 18? Ask a parent or guardian first.')).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy')
    await expect(panel.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms')
    await expect(panel.getByTestId('google-sign-in')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute('aria-expanded', 'false')

    await button.click()
    await expect(panel).toBeVisible()
    await page.mouse.click(10, 400)
    await expect(panel).toBeHidden()
  })
})

test.describe('inside another app', () => {
  test.use({
    userAgent:
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0 Mobile Safari/537.36 Instagram 300.0.0.0',
  })

  test('the panel says to open the page in Chrome', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('sign-in-button').click()
    await expect(page.getByText('Open this page in Chrome to sign in.')).toBeVisible()
  })
})

test.describe('the nudge after a Complete Section', () => {
  test('shows on a Complete Section, not on another, and Not now hides it for good', async ({ page }) => {
    await seed(page)
    await page.goto(href(other))
    await expect(page.getByTestId('section-status')).toBeVisible()
    await expect(page.getByTestId('sign-in-nudge')).toHaveCount(0)

    await page.goto(href(complete))
    const nudge = page.getByTestId('sign-in-nudge')
    await expect(nudge).toBeVisible()
    await expect(nudge.getByRole('heading', { name: 'Keep this Progress' })).toBeVisible()
    await nudge.getByRole('button', { name: 'Not now' }).click()
    await expect(nudge).toHaveCount(0)

    await page.reload()
    await expect(page.getByTestId('section-status')).toHaveAttribute('data-complete', 'true')
    await expect(page.getByTestId('sign-in-nudge')).toHaveCount(0)
  })
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the panel fits on screen and the page does not scroll sideways', async ({ page }) => {
    await page.goto('/class-11/unit-1')
    await page.getByTestId('sign-in-button').click()
    const box = await page.getByTestId('sign-in-panel').boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
})

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('header, open panel and nudge', async ({ page }) => {
      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await seed(page)
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(href(complete))
      await expect(page.getByTestId('sign-in-button')).toBeVisible()
      await page.getByTestId('sign-in-button').click()
      await expect(page.getByTestId('sign-in-panel')).toBeVisible()
      await page.waitForTimeout(800)
      await page.screenshot({ path: path.join(SCREEN_DIR, `account-ui-panel-${scheme}.png`), clip: { x: 640, y: 0, width: 640, height: 460 } })
      await page.keyboard.press('Escape')

      const nudge = page.getByTestId('sign-in-nudge')
      await nudge.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      await nudge.screenshot({ path: path.join(SCREEN_DIR, `account-ui-nudge-${scheme}.png`) })

      await page.setViewportSize({ width: 390, height: 844 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.getByTestId('sign-in-button').click()
      await page.waitForTimeout(800)
      await page.screenshot({ path: path.join(SCREEN_DIR, `account-ui-panel-phone-${scheme}.png`) })
    })
  })
}
