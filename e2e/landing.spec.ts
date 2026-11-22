import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

/** Collects page errors and console errors, so a test can assert there were none. */
function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  return errors
}

test.describe('Home page', () => {
  test('shows the brand, the headline and a way into Unit 1', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/NCERTCHEM/)
    await expect(page.getByRole('banner').getByRole('link', { name: 'NCERTCHEM' })).toHaveAttribute('href', '/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('See the chemistry your textbook describes.')

    await page.getByRole('link', { name: 'Start with Unit 1' }).click()
    await expect(page).toHaveURL(/\/class-11\/unit-1$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Some Basic Concepts of Chemistry')
  })

  test('says that the site is independent of NCERT', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('contentinfo')).toContainText('not affiliated with or endorsed by NCERT')
  })

  test('the Syllabus Map links every Class 11 Unit and Class 12 Units 1 to 4, and lists remaining Class 12 Units as being written', async ({ page }) => {
    await page.goto('/')
    const class11 = page.getByRole('list', { name: 'Class 11 Units' })
    const hrefs = await class11.getByRole('link').evaluateAll((els) => els.map((el) => el.getAttribute('href')))
    expect(hrefs).toEqual(Array.from({ length: 9 }, (_, i) => `/class-11/unit-${i + 1}`))
    await expect(class11.getByRole('link', { name: /Unit 9\s*Hydrocarbons/ })).toContainText('15 Sections')

    const class12Live = page.getByRole('list', { name: 'Class 12 Units' })
    await expect(class12Live.getByRole('link')).toHaveCount(4)
    await expect(class12Live.getByRole('link', { name: /Unit 1\s*Solutions/ })).toHaveAttribute('href', '/class-12/unit-1')
    await expect(class12Live.getByRole('link', { name: /Unit 1\s*Solutions/ })).toContainText('8 Sections')
    await expect(class12Live.getByRole('link', { name: /Unit 2\s*Electrochemistry/ })).toHaveAttribute('href', '/class-12/unit-2')
    await expect(class12Live.getByRole('link', { name: /Unit 2\s*Electrochemistry/ })).toContainText('10 Sections')
    await expect(class12Live.getByRole('link', { name: /Unit 3\s*Chemical Kinetics/ })).toHaveAttribute('href', '/class-12/unit-3')
    await expect(class12Live.getByRole('link', { name: /Unit 3\s*Chemical Kinetics/ })).toContainText('10 Sections')
    await expect(class12Live.getByRole('link', { name: /Unit 4\s*The d- and f-Block Elements/ })).toHaveAttribute('href', '/class-12/unit-4')
    await expect(class12Live.getByRole('link', { name: /Unit 4\s*The d- and f-Block Elements/ })).toContainText('11 Sections')

    const class12 = page.getByRole('list', { name: 'Class 12 Units that are being written' })
    await expect(class12.getByRole('listitem')).toHaveCount(6)
    await expect(class12.getByRole('link')).toHaveCount(0)
    await expect(class12).toContainText('Biomolecules')
  })

  test('the Section count in the stats is the sum of the Unit cards', async ({ page }) => {
    await page.goto('/')
    const class11Metas = await page
      .getByRole('list', { name: 'Class 11 Units' })
      .getByRole('link')
      .evaluateAll((els) => els.map((el) => el.textContent ?? ''))
    const class12Metas = await page
      .getByRole('list', { name: 'Class 12 Units' })
      .getByRole('link')
      .evaluateAll((els) => els.map((el) => el.textContent ?? ''))
    const total = [...class11Metas, ...class12Metas].reduce(
      (sum, text) => sum + Number(/(\d+) Sections?/.exec(text)?.[1] ?? 0),
      0
    )
    expect(total).toBeGreaterThan(0)
    const stat = page.locator('dl > div', { hasText: /^Sections/ })
    await expect(stat.locator('dd')).toHaveText(String(total))
  })

  test('the hero Animation plays by itself, can be paused, and jumps to a chosen Step', async ({ page }) => {
    await page.goto('/')
    const hero = page.getByTestId('hero-animation')
    const bohr = hero.getByTestId('bohr-emission')
    await expect(bohr).toHaveAttribute('data-step', '0')
    await expect(bohr).toHaveAttribute('data-step', '1', { timeout: 8000 })

    await hero.getByRole('button', { name: 'Pause' }).click()
    const pausedAt = await bohr.getAttribute('data-step')
    await page.waitForTimeout(4500)
    await expect(bohr).toHaveAttribute('data-step', pausedAt ?? '')
    await expect(hero.getByRole('button', { name: 'Play' })).toBeVisible()

    await hero.getByRole('button', { name: /Spectral line/ }).click()
    await expect(bohr).toHaveAttribute('data-step', '3')
    await expect(hero.getByTestId('hero-caption')).toContainText('Balmer series')
    await expect(hero.getByRole('link', { name: /Open Section 2\.4/ })).toHaveAttribute(
      'href',
      '/class-11/unit-2/2-4-bohr-model'
    )
  })

  test('with reduced motion the Animation rests on its last Step and does not play', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const hero = page.getByTestId('hero-animation')
    const bohr = hero.getByTestId('bohr-emission')
    await expect(bohr).toHaveAttribute('data-step', '3')
    await expect(hero.getByRole('button', { name: 'Pause' })).toHaveCount(0)
    await page.waitForTimeout(5000)
    await expect(bohr).toHaveAttribute('data-step', '3')

    await hero.getByRole('button', { name: /Ground state/ }).click()
    await expect(bohr).toHaveAttribute('data-step', '0')
  })

  test('the Check on the page confirms the right answer', async ({ page }) => {
    await page.goto('/')
    const check = page.locator('section[data-status]')
    await check.getByText('Balmer', { exact: true }).click()
    await check.getByRole('button', { name: 'Check' }).click()
    await expect(check).toHaveAttribute('data-status', 'correct')
    await expect(check.getByText(/Every fall that ends on n = 2/)).toBeVisible()
  })

  test('the Simulation picker loads a real Simulation and switches to another', async ({ page }) => {
    const errors = watchErrors(page)
    await page.goto('/')
    const showcase = page.getByTestId('simulation-showcase')
    await showcase.scrollIntoViewIfNeeded()
    await expect(showcase.locator('[data-simulation="hydrogen-spectrum"]')).toBeVisible()
    await expect(showcase.getByRole('link', { name: /Section 2\.4/ })).toHaveAttribute(
      'href',
      '/class-11/unit-2/2-4-bohr-model'
    )

    await showcase.getByRole('radio', { name: 'Newman rotor' }).click()
    await expect(showcase.locator('[data-simulation="newman-rotor"]')).toBeVisible()
    await expect(showcase.locator('[data-simulation="hydrogen-spectrum"]')).toHaveCount(0)
    await expect(showcase.getByRole('link', { name: /Section 9\.2\.4/ })).toHaveAttribute(
      'href',
      '/class-11/unit-9/9-2-4-conformations'
    )
    expect(errors).toEqual([])
  })

  test('the header links jump to their parts of the page', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Syllabus Map' }).click()
    await expect(page).toHaveURL(/#syllabus$/)
    await expect(page.getByRole('heading', { name: 'Open the Unit you are studying' })).toBeInViewport()
  })

  for (const scheme of ['light', 'dark'] as const) {
    test(`renders without errors and without sideways scroll (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
      const errors = watchErrors(page)
      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      for (const [name, width, height] of [
        ['desktop', 1280, 800],
        ['phone', 390, 844],
      ] as const) {
        await page.setViewportSize({ width, height })
        await page.goto('/')
        await page.evaluate(() => document.fonts.ready)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        )
        expect(overflow, `sideways scroll at ${width}px`).toBe(0)
        await page.screenshot({ path: path.join(SCREEN_DIR, `landing-${name}-${scheme}.png`), fullPage: true })
      }

      expect(errors).toEqual([])
    })
  }
})

test.describe('Brand on the inner pages', () => {
  test('a Unit page and a Section page carry the brand in the header and the title', async ({ page }) => {
    await page.goto('/class-11/unit-2')
    await expect(page).toHaveTitle('Structure of Atom · NCERTCHEM')
    await expect(page.getByRole('banner').first().getByRole('link', { name: 'NCERTCHEM' })).toHaveAttribute('href', '/')

    await page.goto('/class-11/unit-2/2-4-bohr-model')
    await expect(page).toHaveTitle("Bohr's Model for Hydrogen Atom · NCERTCHEM")
    await page.getByRole('banner').first().getByRole('link', { name: 'NCERTCHEM' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('See the chemistry your textbook describes.')
  })
})
