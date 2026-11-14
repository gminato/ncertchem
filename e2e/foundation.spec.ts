import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Foundation screenshots (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('vocab Matter & molecules section renders without errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab')
      const section = page.locator('#matter')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Matter & molecules')
      await page.evaluate(() => document.fonts.ready)
      await section.screenshot({ path: path.join(SCREEN_DIR, `vocab-matter-${scheme}.png`) })

      expect(errors).toEqual([])
    })

    test('dev controls page renders every primitive and both Check modes', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/dev/controls')
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Controls and Checks')
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({
        path: path.join(SCREEN_DIR, `dev-controls-${scheme}.png`),
        fullPage: true,
      })

      expect(errors).toEqual([])
    })
  })
}

test.describe('Check behaviour', () => {
  test('a wrong answer invites a retry, then two tries reveal the explanation', async ({ page }) => {
    await page.goto('/dev/controls')
    const check = page.locator('section[data-status]').first()
    await check.getByRole('radio', { name: /Proton/ }).check({ force: true })
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'wrong')
    await expect(check.getByText(/Not quite/)).toBeVisible()

    await check.getByRole('button', { name: 'Try again' }).click()
    await check.getByRole('radio', { name: /Neutron/ }).check({ force: true })
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'revealed')
    await expect(check.getByText(/Electrons carry a negative charge/)).toBeVisible()
  })

  test('the right answer is confirmed and recorded only in localStorage', async ({ page }) => {
    await page.goto('/dev/controls')
    const check = page.locator('section[data-status]').nth(1)
    await check.getByRole('spinbutton').fill('0.405')
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'correct')
    await expect(check.getByText('Correct.')).toBeVisible()

    const stored = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('check:'))
      return keys
    })
    expect(stored).toContain('check:controls:dev-numeric')
  })
})

test.describe('Unit navigation', () => {
  test('the Unit page lists Sections and links into them', async ({ page }) => {
    await page.goto('/class-11/unit-2')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Structure of Atom')
    const row = page.getByRole('link', { name: /Bohr's Model for Hydrogen Atom/ })
    await expect(row).toBeVisible()
    await row.click()
    await expect(page).toHaveURL(/\/class-11\/unit-2\/2-4-bohr-model$/)
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Unit 2')
  })

  test('a Unit with no Sections yet shows a calm empty state', async ({ page }) => {
    await page.goto('/class-11/unit-3')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Classification of Elements and Periodicity in Properties'
    )
    await expect(page.getByText('The Sections of this Unit are being written.')).toBeVisible()
  })

  test('Unit 1 lists all ten Sections in order', async ({ page }) => {
    await page.goto('/class-11/unit-1')
    const links = page.locator('a[href^="/class-11/unit-1/"]')
    await expect(links).toHaveCount(10)
    await expect(links.first()).toHaveAttribute('href', /1-1-importance-of-chemistry$/)
    await expect(links.last()).toHaveAttribute('href', /1-10-stoichiometry$/)
  })
})
