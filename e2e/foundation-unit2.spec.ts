import fs from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`Unit 2 foundation on /vocab (${scheme})`, () => {
    test.use({ colorScheme: scheme })

    test('spectra, orbital boxes, waves and the 3D specimen render without errors', async ({
      page,
    }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      fs.mkdirSync(SCREEN_DIR, { recursive: true })
      await page.goto('/vocab#light-spectra')

      const section = page.locator('#light-spectra')
      await expect(section.getByRole('heading', { level: 2 })).toHaveText(
        'Light, spectra and electrons'
      )
      await expect(section.getByTestId('spectral-line').first()).toBeAttached()
      await page.evaluate(() => document.fonts.ready)
      await section.screenshot({ path: path.join(SCREEN_DIR, `vocab-unit2-spectra-${scheme}.png`) })

      // The 3D specimen: wait until the canvas has drawn at least one frame.
      const stage = page.getByTestId('stage3d')
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
      await page.waitForTimeout(800)

      const card = page.getByRole('article').filter({ has: stage })
      await card.screenshot({ path: path.join(SCREEN_DIR, `vocab-unit2-3d-${scheme}.png`) })

      expect(errors).toEqual([])
    })

    test('without WebGL the 3D card shows its 2D drawing and a short note', async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (err) => errors.push(err.message))
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text())
      })

      await page.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          type: string,
          ...rest: unknown[]
        ) {
          if (type.startsWith('webgl')) return null
          return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest)
        } as typeof original
      })

      await page.goto('/vocab#light-spectra')
      const stage = page.getByTestId('stage3d')
      await stage.scrollIntoViewIfNeeded()
      await expect(stage).toHaveAttribute('data-support', 'none')
      await expect(stage.getByTestId('stage3d-fallback')).toBeVisible()
      await expect(stage.getByText(/needs WebGL/)).toBeVisible()
      await expect(stage.locator('canvas')).toHaveCount(0)

      expect(errors).toEqual([])
    })
  })
}
