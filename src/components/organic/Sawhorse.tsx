import React, { forwardRef } from 'react'
import { sawhorseGeometry } from './hydrocarbon-geometry'

/** Length of one bond in px in the sawhorse drawing. */
export const SAWHORSE_BOND = 60

/** Bounds of the sawhorse over every dihedral, so the drawing never clips as it rotates. Centred on the middle of the C–C bond. */
export const SAWHORSE_BOUNDS = (() => {
  let minX = 0
  let maxX = 0
  let minY = 0
  let maxY = 0
  const grow = (x: number, y: number) => {
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
  }
  for (let d = 0; d <= 360; d += 2) {
    const g = sawhorseGeometry(d)
    grow(g.back.x, g.back.y)
    for (const b of [...g.front, ...g.backBonds]) {
      grow(b.to.x, b.to.y)
      grow(b.label.x, b.label.y)
    }
  }
  const pad = 30
  const cx = ((minX + maxX) / 2) * SAWHORSE_BOND
  const cy = ((minY + maxY) / 2) * SAWHORSE_BOND
  const width = (maxX - minX) * SAWHORSE_BOND + 2 * pad
  const height = (maxY - minY) * SAWHORSE_BOND + 2 * pad
  return { cx, cy, width, height }
})()

/** Size of a sawhorse drawing, for a parent viewBox. */
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

function Glyph({ x, y, children, fill }: { x: number; y: number; children: string; fill: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={18}
      fontWeight={600}
      fontFamily="var(--font-sans)"
      fill={fill}
      stroke="var(--surface)"
      strokeWidth={5}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  )
}

/**
 * Sawhorse projection of the same C–C bond as the Newman drawing: the front carbon at the
 * lower left, the back carbon at the upper right, three bonds on each. Same `dihedral` prop.
 */
export const SawhorseProjection = forwardRef<SVGGElement, SawhorseProjectionProps>(function SawhorseProjection(
  { dihedral = 0, front = ['H', 'H', 'H'], back = ['H', 'H', 'H'], x = 0, y = 0, ...rest },
  ref
) {
  const g = sawhorseGeometry(dihedral)
  const k = SAWHORSE_BOND
  // Shift so the drawing's bounds centre on the parent's origin.
  const ox = -SAWHORSE_BOUNDS.cx + 0
  const oy = -SAWHORSE_BOUNDS.cy + 0
  const P = (p: { x: number; y: number }) => ({ x: p.x * k + ox, y: p.y * k + oy })
  const origin = P({ x: 0, y: 0 })
  const backAt = P(g.back)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {g.backBonds.map((b, i) => {
        const to = P(b.to)
        return <line key={`bb-${i}`} x1={backAt.x} y1={backAt.y} x2={to.x} y2={to.y} stroke="var(--h-back)" strokeWidth={3} strokeLinecap="round" />
      })}
      <line x1={origin.x} y1={origin.y} x2={backAt.x} y2={backAt.y} stroke="var(--sigma-bond)" strokeWidth={4} strokeLinecap="round" />
      {g.front.map((b, i) => {
        const to = P(b.to)
        return <line key={`fb-${i}`} x1={origin.x} y1={origin.y} x2={to.x} y2={to.y} stroke="var(--h-front)" strokeWidth={3.4} strokeLinecap="round" />
      })}
      {g.backBonds.map((b, i) => {
        const l = P(b.label)
        return (
          <Glyph key={`bl-${i}`} x={l.x} y={l.y} fill="var(--fg-muted)">
            {back[i]}
          </Glyph>
        )
      })}
      {g.front.map((b, i) => {
        const l = P(b.label)
        return (
          <Glyph key={`fl-${i}`} x={l.x} y={l.y} fill="var(--fg)">
            {front[i]}
          </Glyph>
        )
      })}
      <circle cx={origin.x} cy={origin.y} r={4} fill="var(--fg)" />
      <circle cx={backAt.x} cy={backAt.y} r={4} fill="var(--fg)" />
    </g>
  )
})
