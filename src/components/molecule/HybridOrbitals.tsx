import React, { forwardRef } from 'react'
import { Label } from '../vocab/Label'
import { cameraBasis, depthOf, norm3, projectOrthographic, type Vec3 } from './geometry'

export type HybridKind = 'sp' | 'sp2' | 'sp3'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const HYBRID_SIZE = { width: 340, height: 180 } as const

const CLUSTER = { x: 262, y: 90 }
const BIG_OFFSET = 22
const BIG_RX = 31
const BIG_RY = 15
const SMALL_OFFSET = 12
const SMALL_RX = 11
const SMALL_RY = 8

/** Unit directions in the drawing plane, with a depth for each (negative is behind). */
interface LobeDirection {
  x: number
  y: number
  depth: number
}

const SP_ANGLES = [180, 0]
const SP2_ANGLES = [-90, 30, 150]

/** Tetrahedral directions, viewed from a generic angle so that the four lobes spread out. */
const TETRA: Vec3[] = [
  norm3([1, 1, 1]),
  norm3([1, -1, -1]),
  norm3([-1, 1, -1]),
  norm3([-1, -1, 1]),
]

export function hybridDirections(kind: HybridKind): LobeDirection[] {
  if (kind === 'sp') {
    return SP_ANGLES.map((deg) => ({
      x: Math.cos((deg * Math.PI) / 180),
      y: Math.sin((deg * Math.PI) / 180),
      depth: 0,
    }))
  }
  if (kind === 'sp2') {
    return SP2_ANGLES.map((deg) => ({
      x: Math.cos((deg * Math.PI) / 180),
      y: Math.sin((deg * Math.PI) / 180),
      depth: 0,
    }))
  }
  const basis = cameraBasis([0.55, 0.35, 1].map((c) => c * 5) as Vec3)
  return TETRA.map((d) => {
    const p = projectOrthographic(d, basis)
    const len = Math.hypot(p.x, p.y) || 1
    return { x: p.x / len, y: p.y / len, depth: -depthOf(d, basis) }
  })
}

/** Number of p orbitals that combine with the s orbital to make each hybrid set. */
const P_COUNT: Record<HybridKind, number> = { sp: 1, sp2: 2, sp3: 3 }

/**
 * The s and p orbitals that mix, and the hybrid lobes they make. Each hybrid is
 * one large lobe in the positive phase and a small back lobe in the negative
 * phase. Directions follow the geometry of sp (180°), sp² (120°) and sp³
 * (tetrahedral, projected). Lobes further away are drawn fainter.
 */
export const HybridOrbitals = forwardRef<SVGGElement, { kind: HybridKind; x?: number; y?: number } & Omit<React.SVGAttributes<SVGGElement>, 'children'>>(
  function HybridOrbitals({ kind, x = 0, y = 0, className, style, ...rest }, ref) {
    const directions = hybridDirections(kind)
    const ordered = [...directions].sort((a, b) => a.depth - b.depth)
    const pCount = P_COUNT[kind]
    const pStep = 36
    const pTop = 90 - ((pCount - 1) * pStep) / 2

    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} data-kind={kind} {...rest}>
        {/* The s orbital: one positive sphere */}
        <circle cx={44} cy={90} r={18} style={{ fill: 'var(--orbital-pos)', fillOpacity: 0.3, stroke: 'var(--orbital-pos)' }} strokeWidth={1} />
        <Label x={44} y={90} fontSize={13} fill="var(--fg)">
          s
        </Label>

        {/* The p orbitals: dumbbells along x, one per hybrid pair that mixes */}
        {Array.from({ length: pCount }, (_, i) => {
          const cy = pTop + i * pStep
          return (
            <g key={`p-${i}`}>
              <ellipse cx={112 - 11} cy={cy} rx={11} ry={15} style={{ fill: 'var(--orbital-neg)', fillOpacity: 0.3, stroke: 'var(--orbital-neg)' }} strokeWidth={1} />
              <ellipse cx={112 + 11} cy={cy} rx={11} ry={15} style={{ fill: 'var(--orbital-pos)', fillOpacity: 0.3, stroke: 'var(--orbital-pos)' }} strokeWidth={1} />
            </g>
          )
        })}
        <Label x={112} y={pTop + (pCount - 1) * pStep + 30} fontSize={13} fill="var(--fg)">
          p
        </Label>

        {/* The mixing arrow */}
        <path
          d="M160,90 H186"
          strokeWidth={1.4}
          strokeLinecap="round"
          style={{ stroke: 'var(--fg-muted)' }}
        />
        <path d="M182,85 L188,90 L182,95" fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--fg-muted)' }} />

        {/* The hybrid lobes */}
        {ordered.map((dir, i) => {
          const angle = (Math.atan2(dir.y, dir.x) * 180) / Math.PI
          const faded = dir.depth < 0
          const opacity = faded ? 0.42 : 0.9
          const bx = CLUSTER.x + dir.x * BIG_OFFSET
          const by = CLUSTER.y + dir.y * BIG_OFFSET
          const sx = CLUSTER.x - dir.x * SMALL_OFFSET
          const sy = CLUSTER.y - dir.y * SMALL_OFFSET
          return (
            <g key={`hyb-${i}`} data-testid="hybrid-lobe">
              <ellipse
                cx={bx}
                cy={by}
                rx={BIG_RX}
                ry={BIG_RY}
                transform={`rotate(${angle} ${bx} ${by})`}
                style={{ fill: 'var(--orbital-pos)', fillOpacity: opacity }}
              />
              <ellipse
                cx={sx}
                cy={sy}
                rx={SMALL_RX}
                ry={SMALL_RY}
                transform={`rotate(${angle} ${sx} ${sy})`}
                style={{ fill: 'var(--orbital-neg)', fillOpacity: faded ? 0.35 : 0.8 }}
              />
            </g>
          )
        })}

        <Label x={CLUSTER.x} y={CLUSTER.y + 62} fontSize={14} fill="var(--fg)" sup={kind === 'sp' ? undefined : kind === 'sp2' ? '2' : '3'}>
          sp
        </Label>
      </g>
    )
  }
)
