import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

const SECTIONS = [
  {
    url: '/class-11/unit-2/2-1-discovery-of-subatomic-particles',
    heading: 'Discovery of Sub-atomic Particles',
    short: '2-1',
    scrollies: [
      { animation: 'subatomic-cathode-ray', steps: 4, what: 'cathode-ray' },
      { animation: 'subatomic-oil-drop', steps: 5, what: 'oil-drop' },
      { animation: 'subatomic-particles', steps: 3, what: 'particles' },
    ],
  },
  {
    url: '/class-11/unit-2/2-2-atomic-models',
    heading: 'Atomic Models',
    short: '2-2',
    scrollies: [
      { animation: 'atomic-rutherford', steps: 5, what: 'rutherford' },
      { animation: 'atomic-isotopes', steps: 4, what: 'isotopes' },
      { animation: 'atomic-collapse', steps: 4, what: 'collapse' },
    ],
  },
] as const

/** Waits until hydration has run the Scrolly effects (they mark the first Step of each animation active). */
async function waitForHydration(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, animation: string, index: number) {
  const step = page.locator(`[data-animation="${animation}"] [data-scrolly-step]`).nth(index)
  await step.evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
  await expect(step).toHaveAttribute('data-active', 'true')
}

for (const scheme of ['light', 'dark'] as const) {
  for (const section of SECTIONS) {
    test.describe(`Section ${section.short} (${scheme})`, () => {
      test.use({ colorScheme: scheme })

      test('renders every Scrolly Step with no console errors', async ({ page }) => {
        const errors: string[] = []
        page.on('console', (msg) => {
          if (msg.type() === 'error') errors.push(msg.text())
        })
        page.on('pageerror', (err) => errors.push(err.message))

        fs.mkdirSync(SCREEN_DIR, { recursive: true })

        await page.goto(section.url)
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(section.heading)
        await waitForHydration(page)
        await expect(page.locator('.katex-error')).toHaveCount(0)
        await expect(page.locator('[data-testid="scrolly-visual"]').first()).toBeVisible()

        for (const scrolly of section.scrollies) {
          const steps = page.locator(`[data-animation="${scrolly.animation}"] [data-scrolly-step]`)
          await expect(steps).toHaveCount(scrolly.steps)
          for (let i = 0; i < scrolly.steps; i++) {
            await gotoStep(page, scrolly.animation, i)
            // Tweens last about one second; wait for them to settle before the picture is taken.
            await page.waitForTimeout(1600)
            const visual = page.locator(`[data-animation="${scrolly.animation}"] [data-testid="scrolly-visual"]`)
            await visual.screenshot({
              path: path.join(SCREEN_DIR, `u2-${section.short}-${scrolly.what}-step${i}-${scheme}.png`),
            })
          }
        }

        await page.evaluate(() => window.scrollTo(0, 0))
        await page.screenshot({
          path: path.join(SCREEN_DIR, `u2-${section.short}-page-${scheme}.png`),
          fullPage: true,
        })

        expect(errors).toEqual([])
      })
    })
  }
}

test.describe('Section 2.1 specifics', () => {
  test('the particle table shows the three fundamental particles from the library values', async ({ page }) => {
    await page.goto(SECTIONS[0].url)
    await waitForHydration(page)
    await gotoStep(page, 'subatomic-particles', 2)
    const table = page.getByTestId('particle-table')
    await expect(table.locator('tbody tr')).toHaveCount(3)
    await expect(table).toContainText('1.602 × 10⁻¹⁹')
    await expect(table).toContainText('1.759 × 10¹¹')
    await expect(table).toContainText('1.6726')
    await expect(table).toContainText('1.6749')
    await expect(table).toContainText('9.1094')
  })

  test('the oil drop histogram is drawn at the final Step', async ({ page }) => {
    await page.goto(SECTIONS[0].url)
    await waitForHydration(page)
    await gotoStep(page, 'subatomic-oil-drop', 4)
    await expect(page.getByTestId('oil-drop')).toHaveAttribute('data-step', '4')
  })
})

test.describe('Section 2.2 specifics', () => {
  test('the Rutherford scene reaches the zoomed nucleus Step', async ({ page }) => {
    await page.goto(SECTIONS[1].url)
    await waitForHydration(page)
    await gotoStep(page, 'atomic-rutherford', 4)
    await expect(page.getByTestId('rutherford-scattering')).toHaveAttribute('data-step', '4')
  })

  test('the isobar Step shows A = 40 for both species', async ({ page }) => {
    await page.goto(SECTIONS[1].url)
    await waitForHydration(page)
    await gotoStep(page, 'atomic-isotopes', 3)
    const svg = page.getByTestId('isotope-nuclei')
    await expect(svg).toHaveAttribute('data-step', '3')
    await expect(svg.locator('text', { hasText: 'p⁺ 18' })).toHaveCount(1)
    await expect(svg.locator('text', { hasText: 'p⁺ 20' })).toHaveCount(1)
  })
})

test.describe('Reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('jumps straight to the final Rutherford Step', async ({ page }) => {
    await page.goto(SECTIONS[1].url)
    await waitForHydration(page)
    await gotoStep(page, 'atomic-rutherford', 4)
    await expect(page.getByTestId('rutherford-scattering')).toHaveAttribute('data-step', '4')
  })
})
