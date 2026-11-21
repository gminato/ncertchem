import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'

const SCREEN_DIR = path.join('test-results', 'screens')
const URL = '/dev/sim/corrosion-lab'

function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.location().url.includes('_vercel/insights')) errors.push(msg.text())
  })
  return errors
}


async function scratchOn(page: Page): Promise<void> {
  const toggle = page.getByRole('switch', { name: 'Scratch the coating' })
  if ((await toggle.getAttribute('aria-checked')) !== 'true') await toggle.click()
}

async function pick(page: Page, group: string, option: string): Promise<void> {
  await page.getByRole('radiogroup', { name: group }).getByRole('radio', { name: option }).click()
}

test.describe('Corrosion Lab', () => {
  test('renders in light and dark with no errors, readable text and a clean SVG', async ({ page }) => {
    const errors = watchErrors(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(URL)
    await expect(page.getByRole('radiogroup', { name: 'Environment' })).toBeVisible()

    for (const scheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })

      // Default state: bare iron, water and air, week 12.
      await page.screenshot({ path: path.join(SCREEN_DIR, `c12u2-10-sim-default-${scheme}.png`), fullPage: true })

      // Zinc coat, scratched: zinc corrodes, iron stays clean.
      await pick(page, 'Protection', 'Zinc coat')
      await scratchOn(page)
      await page.getByRole('slider', { name: 'Time' }).fill('52')
      await page.screenshot({ path: path.join(SCREEN_DIR, `c12u2-10-sim-zinc-scratched-${scheme}.png`), fullPage: true })

      // Tin coat, scratched, salt water: iron becomes the anode.
      await pick(page, 'Protection', 'Tin coat')
      await pick(page, 'Environment', 'Salt water')
      await scratchOn(page)
      await page.getByRole('slider', { name: 'Time' }).fill('30')
      await page.screenshot({ path: path.join(SCREEN_DIR, `c12u2-10-sim-tin-scratched-${scheme}.png`), fullPage: true })

      // Magnesium block in salt water: magnesium is the anode.
      await pick(page, 'Protection', 'Mg block')
      await page.screenshot({ path: path.join(SCREEN_DIR, `c12u2-10-sim-mg-${scheme}.png`), fullPage: true })

      // Reset for the next scheme.
      await pick(page, 'Environment', 'Water and air')
      await pick(page, 'Protection', 'Bare iron')
      await page.getByRole('slider', { name: 'Time' }).fill('12')
    }

    // Text at least 14 px, computed, inside the Simulation root.
    const small = await page.evaluate(() => {
      const root = (document.querySelector('[role="radiogroup"][aria-label="Environment"]')?.parentElement?.parentElement as HTMLElement | null)
      if (!root) return ['root not found']
      const bad: string[] = []
      root.querySelectorAll('*').forEach((el) => {
        const own = Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
        )
        if (!own) return
        if (el.closest('.katex')) return
        const style = getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') return
        if (parseFloat(style.fontSize) < 14) bad.push(`${el.tagName} ${parseFloat(style.fontSize)} ${(el.textContent ?? '').trim().slice(0, 40)}`)
      })
      return bad
    })
    expect(small).toEqual([])

    // SVG content stays inside the viewBox (0 0 420 300).
    const outside = await page.evaluate(() => {
      const root = (document.querySelector('[role="radiogroup"][aria-label="Environment"]')?.parentElement?.parentElement as HTMLElement | null)
      const svg = root?.querySelector('svg') as SVGSVGElement | null
      if (!svg) return ['svg not found']
      const bad: string[] = []
      svg.querySelectorAll('rect, path, circle, text').forEach((el) => {
        const box = (el as SVGGraphicsElement).getBBox()
        if (box.x < -1 || box.y < -1 || box.x + box.width > 421 || box.y + box.height > 301) {
          bad.push(`${el.tagName} ${box.x.toFixed(0)},${box.y.toFixed(0)} ${box.width.toFixed(0)}x${box.height.toFixed(0)}`)
        }
      })
      return bad
    })
    expect(outside).toEqual([])

    expect(errors).toEqual([])
  })

  test('phone width: no sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(URL)
    await expect(page.getByRole('radiogroup', { name: 'Environment' })).toBeVisible()
    const width = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(width).toBeLessThanOrEqual(390)
  })

  test('controls drive the state: scratching is only offered for zinc and tin', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(URL)
    const toggle = page.getByRole('switch', { name: 'Scratch the coating' })
    await expect(toggle).toBeDisabled()
    await pick(page, 'Protection', 'Tin coat')
    await expect(toggle).toBeEnabled()
    await toggle.click()
    await expect(page.locator('[aria-live="polite"]').first()).toContainText('Iron is the anode')
    await pick(page, 'Environment', 'Dry air')
    await expect(page.locator('[aria-live="polite"]').first()).toContainText('Nothing corrodes')
  })
})
