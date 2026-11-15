import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 4 bonds and molecules on /vocab (${scheme}, 1440)`, () => {
    test.use({ colorScheme: scheme, viewport: { width: 1440, height: 900 } })

    test('molecules, Lewis, MO, overlap and hybrids render without console errors', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#bonding')

      const section = page.locator('#bonding')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText('Bonds and molecules')

      // The three 3D molecules: wait until each canvas has drawn at least one frame.
      const stages = section.getByTestId('stage3d')
      await expect(stages).toHaveCount(3)
      for (let i = 0; i < 3; i++) {
        const stage = stages.nth(i)
        await stage.scrollIntoViewIfNeeded()
        await expect(stage).toHaveAttribute('data-support', 'webgl')
        const canvas = stage.locator('canvas')
        await expect(canvas).toBeVisible()
        await expect
          .poll(() =>
            canvas.evaluate((el) => {
              const c = el as HTMLCanvasElement
              return c.width > 0 && c.height > 0
            })
          )
          .toBe(true)
      }
      await page.waitForTimeout(800)

      await page.evaluate(() => document.fonts.ready)
      await section.screenshot({ path: path.join(SCREEN_DIR, `vocab-unit4-${scheme}-1440.png`) })

      // The water card on its own, so the 3D drawing can be checked at real size.
      const water = section.locator('article').first()
      await water.screenshot({ path: path.join(SCREEN_DIR, `vocab-unit4-water-${scheme}-1440.png`) })

      expect(errors).toEqual([])
    })

    test('without WebGL the 3D cards fall back to their flat drawings', async ({ page }) => {
      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null
          return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest) as RenderingContext | null
        } as typeof HTMLCanvasElement.prototype.getContext
      })

      await page.goto('/vocab#bonding')
      const section = page.locator('#bonding')
      const fallbacks = section.getByTestId('stage3d-fallback')
      await expect(fallbacks).toHaveCount(3)
      await expect(fallbacks.first().locator('svg')).toBeVisible()
    })
  })
}
