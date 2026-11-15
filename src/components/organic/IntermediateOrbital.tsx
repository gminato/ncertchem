import React, { forwardRef } from 'react'
import { CurvedArrow } from './CurvedArrow'
import { bondAnchor } from './arrows'

export type IntermediateKind = 'carbocation' | 'carbanion' | 'radical' | 'hyperconjugation'

/** Drawing size in SVG units for one intermediate. Parents use it as the viewBox. */
export const INTERMEDIATE_SIZE = { width: 300, height: 260 } as const

export interface IntermediateOrbitalProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  kind: IntermediateKind
  /** Pixels per bond length. */
  scale?: number
  x?: number
  y?: number
}

/** Substituent directions (SVG angles, y down): up-left, up-right and down, all in the plane. */
const PLANE = [210, 330, 90].map((d) => (d * Math.PI) / 180)

const LOBE = { rx: 15, ry: 30 }

/** Points in the plane of the drawing, measured from the carbon. */
function at(c: { x: number; y: number }, th: number, r: number) {
  return { x: c.x + r * Math.cos(th), y: c.y + r * Math.sin(th) }
}

const LABELS: Record<'carbocation' | 'radical', string[]> = {
  carbocation: ['H', 'CH₃', 'CH₃'],
  radical: ['H', 'CH₃', 'CH₃'],
}

/** One orbital picture: sp2 for carbocations and radicals, sp3 for carbanions, plus hyperconjugation. */
export const IntermediateOrbital = forwardRef<SVGGElement, IntermediateOrbitalProps>(function IntermediateOrbital(
  { kind, scale = 80, x = 0, y = 0, ...rest },
  ref
) {
  const C = { x: 0, y: 0 }
  const r = scale
  const planar = kind === 'carbocation' || kind === 'radical' || kind === 'hyperconjugation'
  // In the hyperconjugation panel the methyl that carries the C-H bond is drawn without a label.
  const labels =
    kind === 'radical' ? LABELS.radical : kind === 'hyperconjugation' ? ['H', '', 'CH₃'] : LABELS.carbocation
  const centreMark = kind === 'carbanion' ? '−' : kind === 'radical' ? '' : '+'
  // The charge sits in the free sector: right for the carbanion (its lone pair is up), up otherwise.
  const markAt = kind === 'carbanion' ? { x: C.x + 0.95 * r, y: C.y } : { x: C.x, y: C.y - 0.95 * r }

  // The p orbital of a planar carbon is drawn as two lobes along an oblique axis: the front lobe
  // (solid) and the back lobe (faint). Its axis is perpendicular to the plane, drawn in
  // perspective towards the lower right.
  const axis = { x: 0.42, y: 0.9 }
  const lobeFront = { x: C.x + axis.x * 0.62 * r, y: C.y + axis.y * 0.62 * r }
  const lobeBack = { x: C.x - axis.x * 0.62 * r, y: C.y - axis.y * 0.62 * r }
  const lobeAngle = (Math.atan2(axis.y, axis.x) * 180) / Math.PI

  const subst = PLANE.map((th, i) => ({ th, p: at(C, th, r), label: labels[i] }))

  const planarBlock = (
    <g>
      {/* Back lobe: behind the plane */}
      {kind !== 'carbanion' && (
        <ellipse
          cx={lobeBack.x}
          cy={lobeBack.y}
          rx={LOBE.rx * 0.85}
          ry={LOBE.ry * 0.85}
          transform={`rotate(${lobeAngle - 90} ${lobeBack.x} ${lobeBack.y})`}
          fill={kind === 'radical' ? 'var(--surface-raised)' : 'none'}
          stroke="var(--orbital-pos)"
          strokeWidth={1.6}
          strokeDasharray={kind === 'carbocation' ? '4 4' : undefined}
          opacity={0.45}
        />
      )}
      {subst.map((s, i) => {
        const start = at(C, s.th, 14)
        const end = at(C, s.th, r * 0.82)
        const tip = at(C, s.th, r * 1.05)
        return (
          <g key={i}>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
            <text x={tip.x} y={tip.y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {s.label}
            </text>
          </g>
        )
      })}
      {/* Front lobe: in front of the plane */}
      {kind !== 'carbanion' && (
        <ellipse
          cx={lobeFront.x}
          cy={lobeFront.y}
          rx={LOBE.rx}
          ry={LOBE.ry}
          transform={`rotate(${lobeAngle - 90} ${lobeFront.x} ${lobeFront.y})`}
          fill={kind === 'carbocation' ? 'none' : 'var(--orbital-pos)'}
          fillOpacity={kind === 'carbocation' ? 0 : 0.28}
          stroke="var(--orbital-pos)"
          strokeWidth={1.8}
          strokeDasharray={kind === 'carbocation' ? '4 4' : undefined}
        />
      )}
      {kind === 'radical' && (
        <circle cx={lobeFront.x} cy={lobeFront.y} r={5} fill="var(--fg)" />
      )}
      <text x={C.x} y={C.y} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      {centreMark && (
        <g>
          <circle cx={markAt.x} cy={markAt.y} r={10} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.2} />
          <text x={markAt.x} y={markAt.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {centreMark}
          </text>
        </g>
      )}
    </g>
  )

  const carbanionBlock = (
    <g>
      {/* sp3 lone pair: a lobe pointing up with two electrons */}
      <ellipse cx={C.x} cy={C.y - 0.7 * r} rx={LOBE.rx * 1.05} ry={LOBE.ry * 1.05} fill="var(--orbital-neg)" fillOpacity={0.3} stroke="var(--orbital-neg)" strokeWidth={1.8} />
      <circle cx={C.x - 5} cy={C.y - 0.7 * r - 6} r={3.4} fill="var(--fg)" />
      <circle cx={C.x + 5} cy={C.y - 0.7 * r + 6} r={3.4} fill="var(--fg)" />
      {subst.map((s, i) => {
        const end = at(C, s.th, r * 0.82)
        const tip = at(C, s.th, r * 1.05)
        return (
          <g key={i}>
            <line x1={C.x} y1={C.y} x2={end.x} y2={end.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
            <text x={tip.x} y={tip.y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {s.label}
            </text>
          </g>
        )
      })}
      <text x={C.x} y={C.y} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      <g>
        <circle cx={markAt.x} cy={markAt.y} r={10} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.2} />
        <text x={markAt.x} y={markAt.y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">−</text>
      </g>
    </g>
  )

  if (kind === 'hyperconjugation') {
    // The neighbouring C-H sigma bond (on the up-right methyl) overlaps the empty p orbital.
    const cb = at(C, PLANE[1], r * 0.82)
    const hb = at(cb, (300 * Math.PI) / 180, r * 0.8)
    const mid = bondAnchor(cb, hb, 0.5)
    const target = { x: C.x + axis.x * 0.5 * r, y: C.y + axis.y * 0.5 * r }
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        {planarBlock}
        <line x1={cb.x} y1={cb.y} x2={hb.x} y2={hb.y} stroke="var(--e-arrow)" strokeWidth={6} strokeLinecap="round" opacity={0.35} />
        <line x1={cb.x} y1={cb.y} x2={hb.x} y2={hb.y} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
        <text x={hb.x + 10} y={hb.y - 4} fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">H</text>
        <CurvedArrow from={mid} to={target} bend={-0.45} kind="pair" gap={2} />
        <text x={-r * 1.5} y={r * 1.35} fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          σ C–H bond into the empty p orbital
        </text>
      </g>
    )
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {kind === 'carbanion' ? carbanionBlock : planarBlock}
      <text x={0} y={118} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {kind === 'carbocation' ? 'sp² · empty p orbital' : kind === 'carbanion' ? 'sp³ · lone pair' : 'sp² · one electron in p'}
      </text>
    </g>
  )
})
