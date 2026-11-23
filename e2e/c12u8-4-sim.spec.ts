import { test, expect, type Locator } from '@playwright/test'
import { watchErrors, auditSvg, smallHtmlText, expectNoSidewaysScroll } from './support/svg-audit'

// Template: replace the constants and write the STATES (default + at least 2 changed states driven
// through the controls by role and name). Each state's expects should check the model's answer.
const SIM = 'carbonyl-bp-ladder'
const TAG = 'c12u8-4' // e.g. c12u8-3: screenshots go to test-results/screens/<TAG>-sim-<state>-<scheme>.png

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
    name: 'butane',
    act: async (sim) => {
      await sim.getByRole('button', { name: 'n-Butane', exact: true }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('n-Butane boils at 273 K')
    },
  },
  {
    name: 'propanol',
    act: async (sim) => {
      await sim.getByRole('button', { name: 'Propan-1-ol', exact: true }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Its strongest attraction is hydrogen bonding')
    },
  },
  {
    name: 'chain-end',
    act: async (sim) => {
      await sim.getByRole('button', { name: 'Acetone', exact: true }).click()
      await sim.getByRole('slider').press('End')
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Least soluble of these aldehydes.')
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
