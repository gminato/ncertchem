import React, { forwardRef } from 'react'
import { sawhorseRendered, type Pt } from './hydrocarbon-geometry'
import { NewmanGlyph, drawSegment } from './conformation-glyphs'

/** Length of one bond in px in the sawhorse drawing. */
export const SAWHORSE_BOND = 74

/** Bounds of the sawhorse over every dihedral, centred so the drawing never clips as it rotates. */
export const SAWHORSE_BOUNDS = (() => {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  const grow = (p: Pt) => {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  for (let d = 0; d <= 360; d += 2) {
    const r = sawhorseRendered(d, SAWHORSE_BOND)
    r.segments.forEach((s) => {
      grow(s.a)
      grow(s.b)
    })
    r.labels.forEach(grow)
  }
  const pad = 26
  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    width: maxX - minX + 2 * pad,
    height: maxY - minY + 2 * pad,
  }
})()

/** Size of a sawhorse drawing, for a parent viewBox centred on the drawing. */
export const SAWHORSE_SIZE = { width: Math.ceil(SAWHORSE_BOUNDS.width), height: Math.ceil(SAWHORSE_BOUNDS.height) } as const

export interface SawhorseProjectionProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Dihedral angle in degrees: 0 eclipsed, 60 staggered. */
  dihedral?: number
  /** Labels at the front carbon's bond ends. */
  front?: readonly [string, string, string]
  /** Labels at the back carbon's bond ends. */
  back?: readonly [string, string, string]
  x?: number
  y?: number
}

/**
 * Sawhorse projection of the same C–C bond as the Newman drawing: the front carbon at the lower
 * left, the back carbon at the upper right, three bonds on each. Bonds are cut back behind every
 * label, so no label touches a bond at any dihedral. The origin is the centre of the drawing.
 */
export const SawhorseProjection = forwardRef<SVGGElement, SawhorseProjectionProps>(function SawhorseProjection(
  { dihedral = 0, front = ['H', 'H', 'H'], back = ['H', 'H', 'H'], x = 0, y = 0, ...rest },
  ref
) {
  const r = sawhorseRendered(dihedral, SAWHORSE_BOND)
  const shift = (p: Pt): Pt => ({ x: p.x - SAWHORSE_BOUNDS.cx, y: p.y - SAWHORSE_BOUNDS.cy })
  const labels = r.labels.map(shift)
  const frontLabels = labels.slice(0, 3)
  const backLabels = labels.slice(3)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {r.segments.map((s, i) => {
        const a = shift(s.a)
        const b = shift(s.b)
        // The C–C axis lies along the back carbon's vector from the origin; bonds are either back (from the back carbon) or front.
        const cross = (s.b.x - s.a.x) * r.back.y - (s.b.y - s.a.y) * r.back.x
        const isAxis = Math.abs(cross) < 1e-3 * Math.hypot(r.back.x, r.back.y) * Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y)
        const fromBack = Math.hypot(s.a.x - r.back.x, s.a.y - r.back.y) < 1e-6 || Math.hypot(s.b.x - r.back.x, s.b.y - r.back.y) < 1e-6
        if (isAxis) return drawSegment({ a, b }, `s-${i}`, 'var(--sigma-bond)', 4.4)
        return drawSegment({ a, b }, `s-${i}`, fromBack ? 'var(--h-back)' : 'var(--h-front)', fromBack ? 3 : 3.4)
      })}
      {backLabels.map((p, i) => (
        <NewmanGlyph key={`bl-${i}`} x={p.x} y={p.y} fill="var(--fg-muted)">
          {back[i]}
        </NewmanGlyph>
      ))}
      {frontLabels.map((p, i) => (
        <NewmanGlyph key={`fl-${i}`} x={p.x} y={p.y} fill="var(--fg)">
          {front[i]}
        </NewmanGlyph>
      ))}
    </g>
  )
})
