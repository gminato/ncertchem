/**
 * The metal and non-metal boundary of NCERT Fig. 3.3, drawn as a staircase through the gaps
 * of the long-form table. For each period, the boundary sits just right of the furthest
 * metal or metalloid in that period, so the metalloids lie on the line. The geometry comes
 * from the table's own cell rectangles, so the line follows whatever layout is in use.
 */

import { cellRect } from '@/components/periodic/layout'
import type { ElementRecord, PositionFn } from '@/components/periodic/types'

export interface ZigzagPoint {
  x: number
  y: number
}

/**
 * The furthest group, per period, that holds a metal or a metalloid in the main table. Period 1
 * has none, because hydrogen is a non-metal. Periods with no such element are left out.
 */
export function boundaryGroups(
  elements: readonly ElementRecord[]
): { period: number; group: number }[] {
  const rows: { period: number; group: number }[] = []
  for (let period = 2; period <= 7; period++) {
    let furthest = 0
    for (const el of elements) {
      if (el.period !== period || el.fBlockRow !== null || el.group === null) continue
      if (el.category === 'non-metal') continue
      furthest = Math.max(furthest, el.group)
    }
    if (furthest > 0) rows.push({ period, group: furthest })
  }
  return rows
}

/**
 * The corner points of the zig-zag, in SVG coordinates. Each period contributes a vertical
 * run at the right edge of its boundary cell, and a horizontal step between periods.
 */
export function zigzagPoints(elements: readonly ElementRecord[], position: PositionFn): ZigzagPoint[] {
  const byPos = new Map<string, ElementRecord>()
  for (const el of elements) {
    if (el.fBlockRow !== null || el.group === null) continue
    byPos.set(`${el.period}:${el.group}`, el)
  }
  const points: ZigzagPoint[] = []
  for (const { period, group } of boundaryGroups(elements)) {
    const el = byPos.get(`${period}:${group}`)
    if (!el) continue
    const rect = cellRect(el.Z, position)
    if (!rect) continue
    const gap = 3 // half of the gap between cells, so the line sits between cells
    const right = rect.x + rect.width + gap
    points.push({ x: right, y: rect.y - gap })
    points.push({ x: right, y: rect.y + rect.height + gap })
  }
  return points
}

/**
 * An SVG polyline through the points. The points come in pairs per period (top, then bottom).
 * The bottom of one period and the top of the next lie on the same gap line, so the segment
 * between them is the horizontal step of the staircase.
 */
export function zigzagPath(points: readonly ZigzagPoint[]): string {
  if (points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
}
