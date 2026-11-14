import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const SECTION_URL = '/class-11/unit-2/2-6-quantum-mechanical-model-orbitals'
const SCREEN_DIR = path.join('test-results', 'screens')
const SIM = '[data-simulation="orbital-explorer"]'

/** Waits until hydration has run the Scrolly effects (they mark the first Step active). */
async function waitForScrolly(page: Page) {
  await page.waitForLoadState('load')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('[data-scrolly-step]').first()).toHaveAttribute('data-active', 'true')
}

async function gotoStep(page: Page, index: number) {
  await page.locator('[data-scrolly-step]').nth(index).evaluate((el) => {
    el.scrollIntoView({ block: 'center' })
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`2.6 Quantum mechanical model (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('steps through the Scrolly Animation with no console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        'Quantum Mechanical Model of Atom: Orbitals and Quantum Numbers'
      )
      await expect(page.locator('[data-scrolly-step]')).toHaveCount(6)
      await waitForScrolly(page)

      const views = ['address', 'address', 'address', 'address', 'radial', 'energy']
      for (let i = 0; i < 6; i++) {
        await gotoStep(page, i)
        await page.waitForTimeout(800)
        await expect(page.locator(`[data-layer="${views[i]}"]`)).toBeAttached()
        await page.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-step-${i}-${scheme}.png`) })
      }

      // Step 0 shows the shell and the address; Step 4 shows the radial layer; Step 5 the energies.
      await expect(page.locator('g[data-layer="radial"]').locator('xpath=..')).toHaveAttribute('data-visible', 'false')
      await gotoStep(page, 4)
      await page.waitForTimeout(700)
      await expect(page.locator('svg > g[data-visible="true"]')).toHaveCount(1)
      await expect(page.locator('g[data-layer="radial"]').locator('xpath=..')).toHaveAttribute('data-visible', 'true')

      expect(errors).toEqual([])
    })
  })
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Orbital explorer (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('constrains the choices and switches views with no console errors', async ({ page }) => {
      test.setTimeout(180_000)
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', (err) => errors.push(err.message))

      fs.mkdirSync(SCREEN_DIR, { recursive: true })

      await page.goto(SECTION_URL)
      await waitForScrolly(page)
      const sim = page.locator(SIM)
      await sim.scrollIntoViewIfNeeded()
      await expect(sim.getByRole('heading', { level: 3 })).toBeVisible()

      // Default state: 3dz² with the boundary surface.
      await expect(sim.locator('.readout, [class*="readout"]').first()).toBeVisible()
      await expect(sim.getByText('3dz²', { exact: true }).first()).toBeVisible()
      await expect(sim.getByRole('group', { name: 'Shell n' })).toBeVisible()
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-explorer-default-${scheme}.png`) })

      // With n = 1 only the s subshell is available.
      const subshells = sim.getByRole('group', { name: 'Subshell ℓ' })
      await sim.getByRole('group', { name: 'Shell n' }).getByRole('button', { name: '1', exact: true }).click()
      await expect(subshells.getByRole('button', { name: 'p', exact: true })).toBeDisabled()
      await expect(subshells.getByRole('button', { name: 'd', exact: true })).toBeDisabled()
      await expect(subshells.getByRole('button', { name: 's', exact: true })).toBeEnabled()

      // n = 4 with f, mℓ = −2 gives 4fxyz, and the cloud view with the nodes shown.
      await sim.getByRole('group', { name: 'Shell n' }).getByRole('button', { name: '4', exact: true }).click()
      await subshells.getByRole('button', { name: 'f', exact: true }).click()
      await sim.getByRole('group', { name: 'Orbital mℓ' }).getByRole('button', { name: 'fxyz' }).click()
      await expect(sim.getByText('4fxyz', { exact: true }).first()).toBeVisible()
      await expect(sim.locator('.sr, [aria-live="polite"]').first()).toContainText('4fxyz orbital in shell N')
      await sim.getByRole('radio', { name: 'Probability cloud' }).click()
      await sim.getByRole('switch', { name: 'Show nodes' }).click()
      await page.waitForTimeout(1200)
      await sim.screenshot({ path: path.join(SCREEN_DIR, `u2-2-6-explorer-cloud-nodes-${scheme}.png`) })

      // Back to 2s with the boundary surface: the node count matches the rule n − ℓ − 1 = 1.
      await sim.getByRole('group', { name: 'Shell n' }).getByRole('button', { name: '2', exact: true }).click()
      await subshells.getByRole('button', { name: 's', exact: true }).click()
      await sim.getByRole('radio', { name: 'Boundary surface' }).click()
      await expect(sim.getByText('2s', { exact: true }).first()).toBeVisible()
      await expect(sim.locator('dd').first()).toHaveText(/1/)

      expect(errors).toEqual([])
    })
  })
}

test.describe('Orbital explorer without WebGL', () => {
  test('shows the 2D cross-section fallback and keeps the controls working', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    fs.mkdirSync(SCREEN_DIR, { recursive: true })

    // Hide WebGL from the page, as a browser without it would: Stage3D then shows its fallback.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        if (type === 'webgl' || type === 'webgl2') return null
        return (original as (...args: unknown[]) => unknown).call(this, type, ...rest) as RenderingContext | null
      } as typeof original
    })
    await page.goto(SECTION_URL)
    await waitForScrolly(page)
    const sim = page.locator(SIM)
    await sim.scrollIntoViewIfNeeded()
    await expect(sim.locator('[data-testid="stage3d"]')).toHaveAttribute('data-support', 'none')
    await expect(sim.getByTestId('stage3d-fallback')).toBeVisible()
    await sim.getByRole('group', { name: 'Shell n' }).getByRole('button', { name: '2', exact: true }).click()
    await expect(sim.getByRole('group', { name: 'Orbital mℓ' })).toBeVisible()
    await sim.screenshot({ path: path.join(SCREEN_DIR, 'u2-2-6-explorer-fallback-light.png') })
    expect(errors).toEqual([])
  })
})
