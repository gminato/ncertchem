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

const SECTIONS = [
  {
    slug: '12-1-1-types-of-solutions',
    title: 'Types of Solutions',
    animation: 'solutions-nine-types',
    simulation: 'solution-type-explorer',
    steps: 4,
  },
  {
    slug: '12-1-2-expressing-concentration',
    title: 'Expressing Concentration of Solutions',
    animation: 'concentration-scales',
    simulation: 'concentration-converter',
    steps: 5,
  },
  {
    slug: '12-1-3-solubility',
    title: 'Solubility of Solids and Gases',
    animation: 'henry-law-piston',
    simulation: 'henry-solubility-lab',
    steps: 5,
  },
  {
    slug: '12-1-4-vapour-pressure-liquid-solutions',
    title: 'Vapour Pressure of Liquid Solutions',
    animation: 'raoult-surface',
    simulation: 'raoult-mixture-lab',
    steps: 5,
  },
  {
    slug: '12-1-5-ideal-and-non-ideal-solutions',
    title: 'Ideal and Non-ideal Solutions',
    animation: 'raoult-deviations',
    simulation: 'azeotrope-explorer',
    steps: 5,
  },
  {
    slug: '12-1-6-1-vapour-boiling-freezing',
    title: 'Vapour Pressure Lowering, Boiling Elevation and Freezing Depression',
    animation: 'colligative-phase-shift',
    simulation: 'colligative-thermal-lab',
    steps: 5,
  },
  {
    slug: '12-1-6-4-osmosis-and-reverse-osmosis',
    title: 'Osmosis, Osmotic Pressure and Reverse Osmosis',
    animation: 'osmosis-membrane',
    simulation: 'osmosis-pressure-lab',
    steps: 5,
  },
  {
    slug: '12-1-7-abnormal-molar-masses',
    title: "Abnormal Molar Masses and the van't Hoff Factor",
    animation: 'vant-hoff-particles',
    simulation: 'vant-hoff-lab',
    steps: 5,
  },
] as const

test.describe('Class 12, Unit 1: Solutions', () => {
  for (const sec of SECTIONS) {
    test(`Section ${sec.slug} renders Scrolly Animation, Simulation, KaTeX, and Checks without errors`, async ({ page }) => {
      const errors = watchErrors(page)
      await page.goto(`/class-12/unit-1/${sec.slug}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(sec.title)

      const scrolly = page.locator(`[data-animation="${sec.animation}"]`)
      await expect(scrolly).toBeVisible()
      await expect(scrolly.locator('[data-scrolly-step]')).toHaveCount(sec.steps)

      const sim = page.locator(`[data-simulation="${sec.simulation}"]`)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim).toBeVisible()
      await expect(sim.locator('svg').first()).toBeVisible()

      await expect(page.locator('.katex-error')).toHaveCount(0)
      await expect(page.locator('section[data-status]')).toHaveCount(3)
      expect(errors).toEqual([])
    })
  }
})
