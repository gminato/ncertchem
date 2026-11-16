import React from 'react'
import { AreniumIon, BENZENE_RING_SIZE, BenzeneRing, SkeletalFormula, skeletalBounds } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import type { RowItem } from './row'

/* Drawing parts for the electrophilic substitution Scrolly and the workbench. Every size is in drawing units. */

const INK = 'var(--sigma-bond)'
const FONT = 'var(--font-sans)'
const deg = (d: number) => (d * Math.PI) / 180
/** The σ-complex geometry of the shared AreniumIon (ring radius 70, sp³ bonds 62 long, splayed 38°). */
const R = 70
const BOND = 62
const SPLAY = 38
const HORSESHOE_R = R + 18
const EXTENT = { minX: -112, maxX: 172, minY: -(HORSESHOE_R + 12), maxY: HORSESHOE_R + 12 }
const CONTRIB_SPACING = 352

/** Width and height of the σ-complex drawings (one ion; the three contributors side by side). */
export const SIGMA_HYBRID_SIZE = { width: EXTENT.maxX - EXTENT.minX + 16, height: EXTENT.maxY - EXTENT.minY + 16 }
export const SIGMA_CONTRIBUTORS_SIZE = { width: 2 * CONTRIB_SPACING + SIGMA_HYBRID_SIZE.width, height: SIGMA_HYBRID_SIZE.height }

type Pt = { x: number; y: number }
function vertex(k: number): Pt {
  return { x: R * Math.cos(deg(60 * k)), y: R * Math.sin(deg(60 * k)) }
}

/** The σ-complex with any electrophile label, drawn as the shared AreniumIon draws it. Used where the shared one has no label (CH₃, Cl, SO₃⁻, COCH₃). */
function Ion({ label, kekule }: { label: string; kekule?: readonly number[] }) {
  const v = [0, 1, 2, 3, 4, 5].map(vertex)
  const H = { x: v[0].x + BOND * Math.cos(deg(-SPLAY)), y: v[0].y + BOND * Math.sin(deg(-SPLAY)) }
  const E = { x: v[0].x + BOND * Math.cos(deg(SPLAY)), y: v[0].y + BOND * Math.sin(deg(SPLAY)) }
  const dbl = new Set(kekule ?? [])
  const line = (a: Pt, b: Pt, w = 3.6, key?: string) => <line key={key} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={w} strokeLinecap="round" />
  const sub = (end: Pt, text: string, key: string) => (
    <text key={key} x={end.x + 6} y={end.y} dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)" stroke="var(--surface)" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke">
      {text}
    </text>
  )
  return (
    <g>
      {v.map((p, j) => line(p, v[(j + 1) % 6], 3.6, `b${j}`))}
      {[...dbl].map((j) => {
        const A = v[j]
        const B = v[(j + 1) % 6]
        const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
        const len = Math.hypot(mid.x, mid.y)
        const n = { x: -mid.x / len, y: -mid.y / len }
        const t = 0.14
        const pA = { x: A.x + (B.x - A.x) * t + n.x * 7, y: A.y + (B.y - A.y) * t + n.y * 7 }
        const pB = { x: A.x + (B.x - A.x) * (1 - t) + n.x * 7, y: A.y + (B.y - A.y) * (1 - t) + n.y * 7 }
        return line(pA, pB, 3.2, `d${j}`)
      })}
      {line(v[0], H, 3.6, 'h')}
      {line(v[0], E, 3.6, 'e')}
      {sub(H, 'H', 'H')}
      {sub(E, label, 'E')}
    </g>
  )
}

/** The hybrid σ-complex of a non-nitro electrophile: dashed horseshoe with the + at its centre. */
export function SigmaHybrid({ label }: { label: string }) {
  const r = 0.6 * R
  const a = { x: r * Math.cos(deg(60)), y: r * Math.sin(deg(60)) }
  const b = { x: r * Math.cos(deg(300)), y: r * Math.sin(deg(300)) }
  const cx = (EXTENT.minX + EXTENT.maxX) / 2
  return (
    <g transform={`translate(${-cx}, 0)`}>
      <Ion label={label} />
      <path d={`M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r} ${r} 0 1 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`} fill="none" stroke="var(--delta-plus)" strokeWidth={2.4} strokeDasharray="7 6" strokeLinecap="round" />
      <text x={0} y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={600} fontFamily={FONT} fill="var(--delta-plus)">
        +
      </text>
    </g>
  )
}

/** The nitronium ion, linear: O=N⁺=O with the + on the nitrogen. */
export function Nitronium() {
  const half = 62
  const gap = 14
  return (
    <g>
      <g stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round">
        <line x1={-half + 16} x2={-gap} y1={-4} y2={-4} />
        <line x1={-half + 16} x2={-gap} y1={4} y2={4} />
        <line x1={gap} x2={half - 16} y1={-4} y2={-4} />
        <line x1={gap} x2={half - 16} y1={4} y2={4} />
      </g>
      <text x={-half - 2} y={0} textAnchor="middle" dominantBaseline="central" fontSize={28} fontWeight={600} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={28} fontWeight={600} fontFamily={FONT} fill="var(--atom-n)">
        N
      </text>
      <text x={half + 2} y={0} textAnchor="middle" dominantBaseline="central" fontSize={28} fontWeight={600} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <circle cx={18} cy={-34} r={11} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.8} />
      <text x={18} y={-33} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        +
      </text>
    </g>
  )
}
export const NITRONIUM_WIDTH = 2 * 62 + 40
export const NITRONIUM_HEIGHT = 70

/** Benzene as the hexagon with its inscribed circle (no Kekulé bonds). */
export function BenzeneHexagon() {
  return <BenzeneRing variant="hexagon" />
}
export const BENZENE_HEX_WIDTH = BENZENE_RING_SIZE.width

/** A graph as a skeletal drawing at the given scale (bond length in drawing units); width from its bounds. */
export function skeletalNode(graph: MolGraph, scale: number): RowItem {
  const b = skeletalBounds(graph, scale)
  return { kind: 'node', width: b.width, render: () => <SkeletalFormula graph={graph} scale={scale} /> }
}

/** The σ-complex as a row item: the shared AreniumIon for NO₂⁺ (its own label), otherwise the same drawing with the given label. */
export function sigmaItem(electrophile: 'NO2' | string, options: { contributors?: boolean } = {}): RowItem {
  if (electrophile === 'NO2') {
    if (options.contributors) return { kind: 'node', width: SIGMA_CONTRIBUTORS_SIZE.width, render: () => <AreniumIon electrophile="NO2" contributors /> }
    return { kind: 'node', width: SIGMA_HYBRID_SIZE.width, render: () => <AreniumIon electrophile="NO2" /> }
  }
  if (options.contributors) {
    return { kind: 'node', width: SIGMA_CONTRIBUTORS_SIZE.width, render: () => <SigmaContributors label={electrophile} /> }
  }
  return { kind: 'node', width: SIGMA_HYBRID_SIZE.width, render: () => <SigmaHybrid label={electrophile} /> }
}

/** The three contributors (ortho, para, ortho) of a non-nitro σ-complex, with the same spacing and arrows as the shared one. */
function SigmaContributors({ label }: { label: string }) {
  const specs = [
    { cation: 1, doubles: [2, 4] },
    { cation: 3, doubles: [1, 4] },
    { cation: 5, doubles: [1, 3] },
  ]
  const cx = (EXTENT.minX + EXTENT.maxX) / 2
  const total = CONTRIB_SPACING + cx
  return (
    <g transform={`translate(${-total}, 0)`}>
      {specs.map((s, i) => (
        <g key={i} transform={`translate(${i * CONTRIB_SPACING}, 0)`}>
          <Ion label={label} kekule={s.doubles} />
          <g>
            {(() => {
              const p = vertex(s.cation)
              const len = Math.hypot(p.x, p.y)
              const c = { x: p.x + (p.x / len) * 26, y: p.y + (p.y / len) * 26 }
              return (
                <g>
                  <circle cx={c.x} cy={c.y} r={10} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.8} />
                  <text x={c.x} y={c.y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
                    +
                  </text>
                </g>
              )
            })()}
          </g>
        </g>
      ))}
      {[0, 1].map((i) => {
        const mx = i * CONTRIB_SPACING + (EXTENT.maxX + (CONTRIB_SPACING + EXTENT.minX)) / 2
        return (
          <g key={`a${i}`} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" fill="none">
            <line x1={mx - 30} x2={mx + 30} y1={0} y2={0} />
            <path d={`M${mx - 30 + 9},-7 L${mx - 30},0 L${mx - 30 + 9},7`} />
            <path d={`M${mx + 30 - 9},-7 L${mx + 30},0 L${mx + 30 - 9},7`} />
          </g>
        )
      })}
    </g>
  )
}
