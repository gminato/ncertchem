import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Shared checks for Scrolly Animation and Simulation specs. One call per Step (or per Simulation state)
 * replaces the text walk, bounds check and console watcher that each spec used to copy.
 */

/** Console errors and page errors, ignoring the 404 for Vercel's analytics script, which local servers don't serve. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const text = msg.text()
    if (text.includes('Failed to load resource: the server responded with a status of 404')) return
    errors.push(text)
  })
  return errors
}

export interface SvgAuditOptions {
  /** Smallest rendered font size for a label's main text: 13 for Scrolly Animations, 14 for Simulations. */
  minPx: number
  /** Two labels overlap when their shared area is more than this share of the smaller label's box. Default 0.2. */
  overlapShare?: number
}

export interface SvgAudit {
  /** Labels whose rendered size is under minPx. Sub/Sup tspans (baseline-shift) are exempt. */
  small: string[]
  /** Pairs of visible labels whose boxes overlap. */
  overlaps: string[]
  /** Visible drawn leaves whose box falls outside the viewBox by more than 1 unit (amount in viewBox units). */
  outside: string[]
}

/** Measures one rendered SVG: text size, label-on-label overlaps and drawing outside the viewBox. */
export async function auditSvg(svg: Locator, opts: SvgAuditOptions): Promise<SvgAudit> {
  return svg.evaluate(
    (el, { minPx, overlapShare }) => {
      const root = el as SVGSVGElement
      const vb = root.viewBox.baseVal
      const rect = root.getBoundingClientRect()
      const scale = vb && vb.width ? rect.width / vb.width : 1
      const visible = (e: Element) => {
        const cs = getComputedStyle(e)
        if (cs.display === 'none' || cs.visibility === 'hidden') return false
        let n: Element | null = e
        while (n && n !== root) {
          if (parseFloat(getComputedStyle(n).opacity) < 0.05) return false
          n = n.parentElement
        }
        return true
      }

      const small: string[] = []
      const boxes: { label: string; r: DOMRect }[] = []
      root.querySelectorAll('text').forEach((t) => {
        const label = t.textContent?.trim() ?? ''
        if (!label || !visible(t)) return
        const px = parseFloat(getComputedStyle(t).fontSize) * scale
        if (px < minPx - 0.05) small.push(`${px.toFixed(1)} px: ${label}`)
        const r = t.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) boxes.push({ label, r })
      })

      const overlaps: string[] = []
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i].r
          const b = boxes[j].r
          const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
          const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
          if (w <= 0 || h <= 0) continue
          const share = (w * h) / Math.min(a.width * a.height, b.width * b.height)
          // The same label drawn twice in one place is a deliberate overlay (a tinted copy over the original).
          if (boxes[i].label === boxes[j].label && share > 0.8) continue
          if (share > overlapShare) overlaps.push(`"${boxes[i].label}" × "${boxes[j].label}" (${Math.round(share * 100)} %)`)
        }
      }

      const outside: string[] = []
      if (vb && vb.width) {
        root.querySelectorAll('path, line, circle, ellipse, rect, polygon, polyline, text').forEach((n) => {
          if (!visible(n) || n.closest('defs, clipPath, mask, marker, pattern')) return
          const r = n.getBoundingClientRect()
          if (r.width === 0 && r.height === 0) return
          const x0 = (r.left - rect.left) / scale + vb.x
          const y0 = (r.top - rect.top) / scale + vb.y
          const x1 = x0 + r.width / scale
          const y1 = y0 + r.height / scale
          const over = Math.max(vb.x - x0, vb.y - y0, x1 - vb.x - vb.width, y1 - vb.y - vb.height)
          if (over > 1) {
            const label = n.textContent?.trim()
            outside.push(`${n.tagName}${label ? ` "${label}"` : ''} by ${over.toFixed(1)}`)
          }
        })
      }
      return { small, overlaps, outside }
    },
    { minPx: opts.minPx, overlapShare: opts.overlapShare ?? 0.2 }
  )
}

/** Asserts an SVG passes every audit; `where` names the Step or state in the failure message. */
export async function expectCleanSvg(svg: Locator, opts: SvgAuditOptions, where: string): Promise<void> {
  const audit = await auditSvg(svg, opts)
  expect(audit, `SVG audit failed at ${where}`).toEqual({ small: [], overlaps: [], outside: [] })
}

/** Asserts the page does not scroll sideways at its current viewport width. */
export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}
