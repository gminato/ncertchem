import React, { forwardRef } from 'react'
import { CurvedArrow } from './CurvedArrow'

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

const deg = (d: number) => (d * Math.PI) / 180
/** Substituent directions (SVG angles, y down): up-left, up-right and down. */
const PLANE = [210, 330, 90].map(deg)
/** Clear distance from the carbon centre to where a bond starts, so the letter is never struck. */
const CLEAR = 18
const LOBE = { rx: 15, ry: 30 }
/** Oblique axis of the p orbital (perpendicular to the plane, drawn in perspective). */
const AXIS = { x: 0.42, y: 0.9 }
const AXIS_ANGLE = (Math.atan2(AXIS.y, AXIS.x) * 180) / Math.PI

function at(c: { x: number; y: number }, th: number, r: number) {
  return { x: c.x + r * Math.cos(th), y: c.y + r * Math.sin(th) }
}

function Bond({ from, to, width = 2.6 }: { from: { x: number; y: number }; to: { x: number; y: number }; width?: number }) {
  return <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--fg)" strokeWidth={width} strokeLinecap="round" />
}

function Label({ x, y, children, size = 18 }: { x: number; y: number; children: React.ReactNode; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
      {children}
    </text>
  )
}

function ChargeMark({ x, y, sign }: { x: number; y: number; sign: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.2} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {sign}
      </text>
    </g>
  )
}

/** One orbital picture: sp2 for carbocations and radicals, sp3 for carbanions, plus hyperconjugation. */
export const IntermediateOrbital = forwardRef<SVGGElement, IntermediateOrbitalProps>(function IntermediateOrbital(
  { kind, scale = 80, x = 0, y = 0, ...rest },
  ref
) {
  const C = { x: 0, y: 0 }
  const r = scale
  const lobeFront = { x: C.x + AXIS.x * 0.62 * r, y: C.y + AXIS.y * 0.62 * r }
  const lobeBack = { x: C.x - AXIS.x * 0.62 * r, y: C.y - AXIS.y * 0.62 * r }
  const lobeRot = (p: { x: number; y: number }) => `rotate(${AXIS_ANGLE - 90} ${p.x} ${p.y})`
  const markSign = kind === 'carbanion' ? '−' : kind === 'radical' ? '' : '+'
  // Charges sit at the carbon's upper right, clear of the bonds and the lobes.
  const markAt = kind === 'carbanion' ? { x: 28, y: -40 } : { x: 32, y: -44 }
  const caption =
    kind === 'carbocation' ? 'sp² · empty p orbital' : kind === 'carbanion' ? 'sp³ · lone pair' : kind === 'radical' ? 'sp² · one electron in p' : ''

  if (kind === 'hyperconjugation') {
    // Ethyl cation, H3C-CH2+. The methyl carbon sits at up-right; its C-H bond that points
    // along the p-orbital axis is highlighted and the arrow pushes it into the empty p lobe.
    const cMe = at(C, PLANE[1], r * 0.82)
    const hHyper = { x: cMe.x + r * 0.78 * Math.cos(deg(AXIS_ANGLE)), y: cMe.y + r * 0.78 * Math.sin(deg(AXIS_ANGLE)) }
    const mid = { x: (cMe.x + hHyper.x) / 2, y: (cMe.y + hHyper.y) / 2 }
    const target = { x: C.x + AXIS.x * 0.5 * r + 4, y: C.y + AXIS.y * 0.5 * r }
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <ellipse cx={lobeBack.x} cy={lobeBack.y} rx={LOBE.rx * 0.85} ry={LOBE.ry * 0.85} transform={lobeRot(lobeBack)} fill="none" stroke="var(--orbital-pos)" strokeWidth={1.6} strokeDasharray="4 4" opacity={0.45} />
        <Bond from={at(C, PLANE[0], CLEAR)} to={at(C, PLANE[0], r * 0.82)} />
        <Label x={at(C, PLANE[0], r * 1.05).x} y={at(C, PLANE[0], r * 1.05).y}>H</Label>
        <Bond from={at(C, PLANE[2], CLEAR)} to={at(C, PLANE[2], r * 0.82)} />
        <Label x={at(C, PLANE[2], r * 1.05).x} y={at(C, PLANE[2], r * 1.05).y}>H</Label>
        <Bond from={at(C, PLANE[1], CLEAR)} to={cMe} />
        <Label x={C.x} y={C.y}>C</Label>
        <ChargeMark x={markAt.x} y={markAt.y} sign="+" />
        <text x={cMe.x + 4} y={cMe.y - 16} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">H₃C</text>
        {/* The highlighted, aligned C-H bond */}
        <line x1={cMe.x} y1={cMe.y} x2={hHyper.x} y2={hHyper.y} stroke="var(--e-arrow)" strokeWidth={7} strokeLinecap="round" opacity={0.3} />
        <Bond from={cMe} to={hHyper} />
        <Label x={hHyper.x + 12} y={hHyper.y + 2} size={16}>H</Label>
        <ellipse cx={lobeFront.x} cy={lobeFront.y} rx={LOBE.rx} ry={LOBE.ry} transform={lobeRot(lobeFront)} fill="var(--orbital-pos)" fillOpacity={0.22} stroke="var(--orbital-pos)" strokeWidth={1.8} />
        <CurvedArrow from={mid} to={target} bend={0.3} kind="pair" gap={3} />
        <text x={0} y={118} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          σ C–H aligned with the empty p orbital
        </text>
      </g>
    )
  }

  if (kind === 'carbanion') {
    // sp3: pyramidal, with the lone pair in a lobe pointing up and two electrons.
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <ellipse cx={C.x} cy={C.y - 0.7 * r} rx={LOBE.rx * 1.05} ry={LOBE.ry * 1.05} fill="var(--orbital-neg)" fillOpacity={0.3} stroke="var(--orbital-neg)" strokeWidth={1.8} />
        <circle cx={C.x - 5} cy={C.y - 0.7 * r - 6} r={3.4} fill="var(--fg)" />
        <circle cx={C.x + 5} cy={C.y - 0.7 * r + 6} r={3.4} fill="var(--fg)" />
        {PLANE.map((th, i) => (
          <g key={i}>
            <Bond from={at(C, th, CLEAR)} to={at(C, th, r * 0.82)} />
            <Label x={at(C, th, r * 1.05).x} y={at(C, th, r * 1.05).y} size={18}>{['H', 'CH₃', 'CH₃'][i]}</Label>
          </g>
        ))}
        <Label x={C.x} y={C.y} size={22}>C</Label>
        <ChargeMark x={markAt.x} y={markAt.y} sign="−" />
        <text x={0} y={118} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">{caption}</text>
      </g>
    )
  }

  // Planar sp2: carbocation (empty lobes) and radical (one electron in the front lobe).
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <ellipse
        cx={lobeBack.x}
        cy={lobeBack.y}
        rx={LOBE.rx * 0.85}
        ry={LOBE.ry * 0.85}
        transform={lobeRot(lobeBack)}
        fill={kind === 'radical' ? 'var(--surface-raised)' : 'none'}
        stroke="var(--orbital-pos)"
        strokeWidth={1.6}
        strokeDasharray={kind === 'carbocation' ? '4 4' : undefined}
        opacity={0.45}
      />
      {PLANE.map((th, i) => (
        <g key={i}>
          <Bond from={at(C, th, CLEAR)} to={at(C, th, r * 0.82)} />
          <Label x={at(C, th, r * 1.05).x} y={at(C, th, r * 1.05).y}>{['H', 'CH₃', 'CH₃'][i]}</Label>
        </g>
      ))}
      <ellipse
        cx={lobeFront.x}
        cy={lobeFront.y}
        rx={LOBE.rx}
        ry={LOBE.ry}
        transform={lobeRot(lobeFront)}
        fill={kind === 'carbocation' ? 'none' : 'var(--orbital-pos)'}
        fillOpacity={kind === 'carbocation' ? 0 : 0.28}
        stroke="var(--orbital-pos)"
        strokeWidth={1.8}
        strokeDasharray={kind === 'carbocation' ? '4 4' : undefined}
      />
      {kind === 'radical' && <circle cx={lobeFront.x} cy={lobeFront.y} r={5} fill="var(--fg)" />}
      <Label x={C.x} y={C.y} size={22}>C</Label>
      {markSign && <ChargeMark x={markAt.x} y={markAt.y} sign={markSign} />}
      <text x={0} y={118} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">{caption}</text>
    </g>
  )
})
