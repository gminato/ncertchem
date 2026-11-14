import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

interface AnimationCase {
  name: string
  steps: number
  /** Short name used in the screenshot file names. */
  file: string
}

interface SectionCase {
  name: string
  url: string
  heading: string
  animations: AnimationCase[]
}

const SECTIONS: SectionCase[] = [
  {
    name: '1-5',
    url: '/class-11/unit-1/1-5-laws-of-chemical-combinations',
    heading: 'Laws of Chemical Combinations',
    animations: [
      { name: 'mass-balance', steps: 4, file: 'mass' },
      { name: 'gay-lussac-avogadro', steps: 5, file: 'gaslaws' },
    ],
  },
  {
    name: '1-6',
    url: '/class-11/unit-1/1-6-daltons-atomic-theory',
    heading: "Dalton's Atomic Theory",
    animations: [{ name: 'dalton-postulates', steps: 4, file: 'dalton' }],
  },
  {
    name: '1-7',
    url: '/class-11/unit-1/1-7-atomic-and-molecular-masses',
    heading: 'Atomic and Molecular Masses',
    animations: [
      { name: 'isotope-seesaw', steps: 4, file: 'isotope' },
      { name: 'molecular-mass', steps: 5, file: 'molmass' },
    ],
  },
]

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

/** Scrolls one Step of a Scrolly Animation to the middle of the viewport. */
async function gotoStep(page: Page, animation: string, stepIndex: number) {
  await page
    .locator(`[data-animation="${animation}"] [data-scrolly-step]`)
    .nth(stepIndex)
    .evaluate((el) => {
      el.scrollIntoView({ block: 'center' })
    })
}

for (const scheme of ['light', 'dark'] as const) {
  for (const section of SECTIONS) {
    test.describe(`Unit 1 Section ${section.name} (${scheme})`, () => {
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
        await waitForScrolly(page)

        for (const anim of section.animations) {
          const scrolly = page.locator(`[data-animation="${anim.name}"]`)
          await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(anim.steps)

          for (let i = 0; i < anim.steps; i++) {
            await gotoStep(page, anim.name, i)
            // Tweens run for up to about 2 s; wait for them to finish before the screenshot.
            await page.waitForTimeout(2200)
            await expect(scrolly.locator('svg[data-step]')).toHaveAttribute('data-step', String(i))
            await scrolly.getByTestId('scrolly-visual').screenshot({
              path: path.join(SCREEN_DIR, `u1-${section.name}-${anim.file}-step${i}-${scheme}.png`),
            })
          }
        }

        expect(errors).toEqual([])
      })
    })
  }
}

test.describe('Unit 1 Scrolly Animations (reduced motion)', () => {
  test.use({ reducedMotion: 'reduce' })

  test('jump straight to the final Step of the gas-law animation', async ({ page }) => {
    await page.goto(SECTIONS[0].url)
    await waitForScrolly(page)
    await gotoStep(page, 'gay-lussac-avogadro', 4)
    await expect(page.getByTestId('gas-laws')).toHaveAttribute('data-step', '4')
  })
})
