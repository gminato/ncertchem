import { test, expect, type Locator } from '@playwright/test'
import { watchErrors, auditSvg, smallHtmlText, expectNoSidewaysScroll } from './support/svg-audit'

const SIM = 'acid-strength-lab'
const TAG = 'c12u8-12' // e.g. c12u8-3: screenshots go to test-results/screens/<TAG>-sim-<state>-<scheme>.png

async function expectCleanSim(sim: Locator, where: string) {
  for (const svg of await sim.locator('svg[role="img"]').all()) {
    if (!(await svg.isVisible())) continue
    expect(await auditSvg(svg, { minPx: 14 }), `SVG audit at ${where}`).toEqual({ small: [], overlaps: [], outside: [] })
  }
  expect(await smallHtmlText(sim, 14), `HTML text at ${where}`).toEqual([])
}

const STATES: { name: string; act: (sim: Locator) => Promise<void> }[] = [
  { name: 'default', act: async () => {} },
  {
    name: 'tfa-ruler',
    act: async (sim) => {
      await sim.getByRole('radio', { name: 'Trifluoroacetic acid' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Trifluoroacetic acid has pKₐ 0.23')
    },
  },
  {
    name: 'phenyl-beta',
    act: async (sim) => {
      await sim.getByRole('button', { name: 'Ph', exact: true }).click()
      await sim.getByRole('radio', { name: 'β, one further' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('lists no acid for Ph')
    },
  },
  {
    name: 'phenol-tube',
    act: async (sim) => {
      await sim.getByRole('radio', { name: 'Phenol', exact: true }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Phenol gives no fizz')
    },
  },
]

for (const scheme of ['light', 'dark'] as const) {
  test(`${TAG} Simulation (${scheme})`, async ({ page }) => {
    test.setTimeout(180_000)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
    const errors = watchErrors(page)
    await page.goto(`/dev/sim/${SIM}`)
    const sim = page.locator(`[data-simulation="${SIM}"]`)
    await expect(sim).toBeVisible()
    for (const state of STATES) {
      await state.act(sim)
      await page.waitForTimeout(400)
      await sim.screenshot({ path: `test-results/screens/${TAG}-sim-${state.name}-${scheme}.png` })
      await expectCleanSim(sim, `${state.name} (${scheme})`)
    }
    await expect(sim.locator('.katex-error')).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

test(`${TAG} Simulation does not scroll sideways at 390 px`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`/dev/sim/${SIM}`)
  await expect(page.locator(`[data-simulation="${SIM}"]`)).toBeVisible()
  await expectNoSidewaysScroll(page)
})
