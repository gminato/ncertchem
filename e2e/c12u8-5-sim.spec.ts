import { test, expect, type Locator } from '@playwright/test'
import { watchErrors, auditSvg, smallHtmlText, expectNoSidewaysScroll } from './support/svg-audit'

const SIM = 'nucleophilic-addition-lab'
const TAG = 'c12u8-5'

async function expectCleanSim(sim: Locator, where: string) {
  for (const svg of await sim.locator('svg[role="img"]').all()) {
    if (!(await svg.isVisible())) continue
    expect(await auditSvg(svg, { minPx: 14 }), `SVG audit at ${where}`).toEqual({ small: [], overlaps: [], outside: [] })
  }
  expect(await smallHtmlText(sim, 14), `HTML text at ${where}`).toEqual([])
}

const STATES: { name: string; act: (sim: Locator) => Promise<void>; live: string }[] = [
  { name: 'default', act: async () => {}, live: 'Ethanal with CN⁻ with a base: addition faster. Product: 2-hydroxypropanenitrile.' },
  {
    name: 'intermediate',
    act: async (sim) => {
      await sim.getByRole('radio', { name: '2 Intermediate' }).click()
    },
    live: 'Ethanal with CN⁻ with a base: addition faster. Product: 2-hydroxypropanenitrile.',
  },
  {
    name: 'bisulphite-ketone',
    act: async (sim) => {
      await sim.getByRole('radio', { name: 'HSO₃⁻ from NaHSO₃' }).click()
      await sim.getByRole('radio', { name: 'Propan-2-one' }).click()
      await sim.getByRole('radio', { name: '3 Product' }).click()
    },
    live: 'Propan-2-one with HSO₃⁻ from NaHSO₃: addition slower, not favoured. Product: hydrogensulphite addition compound.',
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
      await expect(sim.locator('[aria-live="polite"]')).toHaveText(state.live)
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
