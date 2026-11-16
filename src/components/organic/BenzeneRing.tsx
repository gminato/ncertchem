import React, { forwardRef } from 'react'
import { benzeneExoAngle, benzeneVertices, kekuleWeights, relativeLocant } from './hydrocarbon-geometry'

/** Circumradius of the ring in px. */
export const BENZENE_R = 92

/** Size of a benzene drawing, for a parent viewBox centred on the origin. */
export const BENZENE_RING_SIZE = { width: 380, height: 380 } as const

export type BenzeneStyle = 'kekule' | 'hexagon'

export interface RingSubstituent {
  /** Ring position, 1 to 6. */
  position: number
  /** Label at the end of the bond, e.g. 'CH₃', 'Cl', 'NO₂'. */
  label: string
}

export interface BenzeneRingProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** `kekule` draws double bonds (Kekulé A or B, or a mix); `hexagon` draws the hexagon with an inscribed circle. */
  variant?: BenzeneStyle
  /** For `kekule`: 0 is Kekulé A (double bonds on 1=2, 3=4, 5=6), 1 is Kekulé B. Between them the double bonds slide. */
  kekuleMix?: number
  /** Groups on the ring. */
  substituents?: readonly RingSubstituent[]
  /** Numbers 1 to 6 at the positions with no substituent. */
  numbered?: boolean
  /** Ring position of the principal group: other free positions are labelled o, m or p relative to it. */
  relativeTo?: number
  x?: number
  y?: number
}

/**
 * Benzene and substituted benzenes in the NCERT styles: Kekulé A, Kekulé B (with the double bonds
 * sliding between them) and the hexagon with the inscribed circle. Positions run clockwise from
 * the top vertex, so position 1 is the top.
 */
export const BenzeneRing = forwardRef<SVGGElement, BenzeneRingProps>(function BenzeneRing(
  { variant = 'kekule', kekuleMix = 0, substituents = [], numbered = false, relativeTo, x = 0, y = 0, ...rest },
  ref
) {
  const R = BENZENE_R
  const verts = benzeneVertices(R)
  const weights = kekuleWeights(kekuleMix)
  // The inscribed circle touches each edge: its radius is the apothem, R · √3 / 2.
  const innerR = R * Math.sqrt(3) / 2 - 2
  const bondStroke = 3.2

  // Inner line of a double bond: parallel to the ring bond, on the side facing the ring centre.
  const innerLine = (i: number) => {
    const p = verts[i]
    const q = verts[(i + 1) % 6]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy)
    let nx = -dy / len
    let ny = dx / len
    const mx = (p.x + q.x) / 2
    const my = (p.y + q.y) / 2
    if (nx * mx + ny * my > 0) {
      nx = -nx
      ny = -ny
    }
    const off = 13
    const shrink = 0.14
    return {
      ax: p.x + dx * shrink + nx * off,
      ay: p.y + dy * shrink + ny * off,
      bx: q.x - dx * shrink + nx * off,
      by: q.y - dy * shrink + ny * off,
    }
  }

  const exoLabel = (pos: number) => {
    const th = (benzeneExoAngle(pos) * Math.PI) / 180
    const r = R + 30
    return { x: r * Math.cos(th), y: r * Math.sin(th), th }
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {variant === 'hexagon' ? (
        <>
          <polygon points={verts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} fill="none" stroke="var(--fg)" strokeWidth={bondStroke} strokeLinejoin="round" />
          <circle r={innerR} fill="none" stroke="var(--fg)" strokeWidth={2} />
        </>
      ) : (
        <>
          {verts.map((p, i) => {
            const q = verts[(i + 1) % 6]
            return <line key={`s-${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--fg)" strokeWidth={bondStroke} strokeLinecap="round" />
          })}
          {verts.map((_, i) => {
            const l = innerLine(i)
            return (
              <line
                key={`d-${i}`}
                x1={l.ax}
                y1={l.ay}
                x2={l.bx}
                y2={l.by}
                stroke="var(--fg)"
                strokeWidth={2.4}
                strokeLinecap="round"
                opacity={weights[i]}
              />
            )
          })}
        </>
      )}

      {/* Substituent bonds and labels */}
      {substituents.map((s) => {
        const p = verts[s.position - 1]
        const e = exoLabel(s.position)
        const bond = { x: p.x + (e.x - p.x) * 0.45, y: p.y + (e.y - p.y) * 0.45 }
        const left = e.x < -1
        const right = e.x > 1
        return (
          <g key={`sub-${s.position}`}>
            <line x1={p.x} y1={p.y} x2={bond.x} y2={bond.y} stroke="var(--fg)" strokeWidth={bondStroke} strokeLinecap="round" />
            <text
              x={e.x + (left ? -6 : right ? 6 : 0)}
              y={e.y}
              textAnchor={left ? 'end' : right ? 'start' : 'middle'}
              dominantBaseline="central"
              fontSize={22}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {s.label}
            </text>
          </g>
        )
      })}

      {/* Position numbers, or o/m/p letters relative to a principal group */}
      {Array.from({ length: 6 }, (_, k) => k + 1)
        .filter((pos) => !substituents.some((s) => s.position === pos))
        .map((pos) => {
          const e = exoLabel(pos)
          const rel = relativeTo !== undefined ? relativeLocant(pos, relativeTo) : ''
          const text = relativeTo !== undefined ? rel : numbered ? String(pos) : ''
          if (!text) return null
          const r = R + 24
          const th = e.th
          const left = Math.cos(th) < -0.5
          const right = Math.cos(th) > 0.5
          return (
            <text
              key={`n-${pos}`}
              x={r * Math.cos(th)}
              y={r * Math.sin(th)}
              textAnchor={left ? 'end' : right ? 'start' : 'middle'}
              dominantBaseline="central"
              fontSize={17}
              fontWeight={500}
              fontStyle={relativeTo !== undefined ? 'italic' : 'normal'}
              fontFamily="var(--font-sans)"
              fill="var(--locant)"
            >
              {text}
            </text>
          )
        })}
    </g>
  )
})
