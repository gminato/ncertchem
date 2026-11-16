import React, { forwardRef } from 'react'

type Electrophile = 'NO2' | 'Br'

/** Ring radius of the flat-top hexagon. Vertex 0 (the sp³ carbon) sits at the right, angle 0. */
const R = 70
/** Length of the H and E bonds on the sp³ carbon. */
const BOND = 62
/** Half-angle of the V: H leaves up-right, E leaves down-right. */
const SPLAY = 38
const HORSESHOE_R = R + 18
const SIGMA = 'var(--sigma-bond)'

type Pt = { x: number; y: number }
const deg = (d: number) => (d * Math.PI) / 180

/** Vertex k of the ring; vertex 0 is the sp³ carbon. Screen y grows downward. */
function vertex(k: number): Pt {
  return { x: R * Math.cos(deg(60 * k)), y: R * Math.sin(deg(60 * k)) }
}

function electrophileLabel(e: Electrophile): string {
  return e === 'NO2' ? 'NO₂' : 'Br'
}

/** Positions of the sp³ carbon and of its H and E bond ends, in the drawing's frame (origin at the ring centre). */
export function areniumAnchors(electrophile: Electrophile = 'NO2') {
  const C0 = vertex(0)
  const H = { x: C0.x + BOND * Math.cos(deg(-SPLAY)), y: C0.y + BOND * Math.sin(deg(-SPLAY)) }
  const E = { x: C0.x + BOND * Math.cos(deg(SPLAY)), y: C0.y + BOND * Math.sin(deg(SPLAY)) }
  return { C0, H, E, electrophile, ringRadius: R }
}

/** x of the drawing's bounding-box centre relative to the sp³ ring centre; AreniumIon's x is the box centre. */
export const ARENIUM_CENTRE_X = (-112 + 172) / 2

/** Horizontal extent of one σ-complex, including the labels and the circled charges. */
const EXTENT = { minX: -112, maxX: 172, minY: -(HORSESHOE_R + 12), maxY: HORSESHOE_R + 12 }

/** Bounds of the drawing, with the origin at its centre (so a viewBox of width/height centred on 0 fits). */
export function areniumBounds(_electrophile: Electrophile = 'NO2', contributors = false): { width: number; height: number } {
  const h = EXTENT.maxY - EXTENT.minY + 16
  if (contributors) return { width: 2 * CONTRIB_SPACING + (EXTENT.maxX - EXTENT.minX) + 16, height: h }
  return { width: EXTENT.maxX - EXTENT.minX + 16, height: h }
}

/** Spacing of the three contributor units; the gap between units holds the ↔ arrow. */
const CONTRIB_SPACING = 352

/**
 * Dashed horseshoe inside the ring, as textbooks draw it: an arc concentric with the ring at 0.6 of
 * its radius, running from vertex 2 round through the far side to vertex 4, so it is open towards
 * the sp³ carbon (vertex 0).
 */
function Horseshoe() {
  const r = 0.6 * R
  const a = { x: r * Math.cos(deg(60)), y: r * Math.sin(deg(60)) }
  const b = { x: r * Math.cos(deg(300)), y: r * Math.sin(deg(300)) }
  return (
    <path
      d={`M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r} ${r} 0 1 1 ${b.x.toFixed(2)},${b.y.toFixed(2)}`}
      fill="none"
      stroke="var(--delta-plus)"
      strokeWidth={2.4}
      strokeDasharray="7 6"
      strokeLinecap="round"
    />
  )
}

function Line({ a, b, width = 3.6 }: { a: Pt; b: Pt; width?: number }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SIGMA} strokeWidth={width} strokeLinecap="round" />
}

/** A labelled substituent on the sp³ carbon. */
function Substituent({ end, text }: { end: Pt; text: string }) {
  return (
    <text x={end.x + 6} y={end.y} dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" stroke="var(--surface)" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke">
      {text}
    </text>
  )
}

/** The six ring bonds (solid) with the sp³ carbon marked by its two substituent bonds. */
function Skeleton({ electrophile, kekule }: { electrophile: Electrophile; kekule?: readonly number[] }) {
  const v = [0, 1, 2, 3, 4, 5].map(vertex)
  const { H, E } = areniumAnchors(electrophile)
  const dbl = new Set(kekule ?? [])
  return (
    <g>
      {v.map((p, j) => (
        <Line key={`b-${j}`} a={p} b={v[(j + 1) % 6]} />
      ))}
      {kekule &&
        [...dbl].map((j) => {
          const A = v[j]
          const B = v[(j + 1) % 6]
          const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
          const n = { x: -mid.x / Math.hypot(mid.x, mid.y), y: -mid.y / Math.hypot(mid.x, mid.y) }
          const t = 0.14
          const pA = { x: A.x + (B.x - A.x) * t + n.x * 7, y: A.y + (B.y - A.y) * t + n.y * 7 }
          const pB = { x: A.x + (B.x - A.x) * (1 - t) + n.x * 7, y: A.y + (B.y - A.y) * (1 - t) + n.y * 7 }
          return <Line key={`d-${j}`} a={pA} b={pB} width={3.2} />
        })}
      <Line a={v[0]} b={H} />
      <Line a={v[0]} b={E} />
      <Substituent end={H} text="H" />
      <Substituent end={E} text={electrophileLabel(electrophile)} />
    </g>
  )
}

/** A circled + on a ring carbon, pushed outward so it touches neither bonds nor the ring. */
function Charge({ k }: { k: number }) {
  const p = vertex(k)
  const len = Math.hypot(p.x, p.y)
  const c = { x: p.x + (p.x / len) * 26, y: p.y + (p.y / len) * 26 }
  return (
    <g>
      <circle cx={c.x} cy={c.y} r={10} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.8} />
      <text x={c.x} y={c.y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        +
      </text>
    </g>
  )
}

/** Kekulé double bonds for the three contributors: the + sits on ring carbon k, and the bonds avoid it. */
const CONTRIBUTOR_DOUBLES: Record<'ortho' | 'para' | 'ortho2', { cation: number; doubles: number[] }> = {
  ortho: { cation: 1, doubles: [2, 4] },
  para: { cation: 3, doubles: [1, 4] },
  ortho2: { cation: 5, doubles: [1, 3] },
}

export interface AreniumIonProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  electrophile?: Electrophile
  /** Draw the three contributors (ortho, para, ortho) instead of the hybrid. */
  contributors?: boolean
  x?: number
  y?: number
}

/** A σ-complex: the sp³ carbon with H and E in a V, the dashed horseshoe for the delocalised charge. */
export const AreniumIon = forwardRef<SVGGElement, AreniumIonProps>(function AreniumIon(
  { electrophile = 'NO2', contributors = false, x = 0, y = 0, ...rest },
  ref
) {
  if (!contributors) {
    // Centre the drawing: its horizontal extent runs from EXTENT.minX to EXTENT.maxX.
    const cx = (EXTENT.minX + EXTENT.maxX) / 2
    return (
      <g ref={ref} transform={`translate(${x - cx}, ${y})`} {...rest}>
        <Skeleton electrophile={electrophile} />
        <Horseshoe />
        <text x={0} y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
          +
        </text>
      </g>
    )
  }

  const units = (['ortho', 'para', 'ortho2'] as const).map((key, i) => {
    const spec = CONTRIBUTOR_DOUBLES[key]
    const ux = i * CONTRIB_SPACING
    return (
      <g key={key} transform={`translate(${ux}, 0)`}>
        <Skeleton electrophile={electrophile} kekule={spec.doubles} />
        <Charge k={spec.cation} />
      </g>
    )
  })
  // Arrows: the ↔ between units, placed in the gap so that it touches no charge.
  const arrows = [0, 1].map((i) => {
    const mx = i * CONTRIB_SPACING + (EXTENT.maxX + (CONTRIB_SPACING + EXTENT.minX)) / 2
    return (
      <g key={`arr-${i}`} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" fill="none">
        <line x1={mx - 30} x2={mx + 30} y1={0} y2={0} />
        <path d={`M${mx - 30 + 9},-7 L${mx - 30},0 L${mx - 30 + 9},7`} />
        <path d={`M${mx + 30 - 9},-7 L${mx + 30},0 L${mx + 30 - 9},7`} />
      </g>
    )
  })
  const totalCentre = CONTRIB_SPACING + (EXTENT.minX + EXTENT.maxX) / 2
  return (
    <g ref={ref} transform={`translate(${x - totalCentre}, ${y})`} {...rest}>
      {units}
      {arrows}
    </g>
  )
})
