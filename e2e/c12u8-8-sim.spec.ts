import { test, expect, type Locator } from '@playwright/test'
import { watchErrors, auditSvg, smallHtmlText, expectNoSidewaysScroll } from './support/svg-audit'

// Template: replace the constants and write the STATES (default + at least 2 changed states driven
// through the controls by role and name). Each state's expects should check the model's answer.
const SIM = 'aldol-builder'
const TAG = 'c12u8-8' // e.g. c12u8-3: screenshots go to test-results/screens/<TAG>-sim-<state>-<scheme>.png

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
    name: 'propanal-and-methylpropanal',
    act: async (sim) => {
      await sim.getByRole('radiogroup', { name: 'Second carbonyl compound' }).getByRole('radio', { name: '2-Methylpropanal' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('4 aldol products form, and 2 lose water on heating')
    },
  },
  {
    name: 'ethanal-and-benzaldehyde',
    act: async (sim) => {
      await sim.getByRole('radiogroup', { name: 'First carbonyl compound' }).getByRole('radio', { name: 'Ethanal' }).click()
      await sim.getByRole('radiogroup', { name: 'Second carbonyl compound' }).getByRole('radio', { name: 'Benzaldehyde' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('Benzaldehyde has no α-hydrogen, so it cannot form a carbanion')
    },
  },
  {
    name: 'methylpropanal-alone',
    act: async (sim) => {
      await sim.getByRole('radiogroup', { name: 'Second carbonyl compound' }).getByRole('radio', { name: 'None' }).click()
      await sim.getByRole('radiogroup', { name: 'First carbonyl compound' }).getByRole('radio', { name: '2-Methylpropanal' }).click()
      await expect(sim.locator('[aria-live="polite"]')).toContainText('cannot lose water on heating')
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
