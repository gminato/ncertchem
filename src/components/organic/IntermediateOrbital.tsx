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
/** Carbanion substituents (SVG angles, y down): up-left, up-right and down. */
const TETRA = [210, 330, 90].map(deg)
/** sp2 substituents: right, and two to the lower left. The empty p orbital is then vertical,
 *  above and below the carbon, with no bond running through either lobe. */
const PLANAR = [0, 150, 210].map(deg)
/** Clear distance from the carbon centre to where a bond starts, so the letter is never struck. */
const CLEAR = 18
/** The two p lobes: identical, vertical, dashed outline, no fill. */
const LOBE = { rx: 12, ry: 20, offset: 0.6 }
const LOBE_STYLE = {
  fill: 'none',
  stroke: 'var(--orbital-pos)',
  strokeWidth: 1.8,
  strokeDasharray: '4 4',
} as const

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

/** One orbital picture: sp2 for carbocations, radicals and hyperconjugation; sp3 for carbanions. */
export const IntermediateOrbital = forwardRef<SVGGElement, IntermediateOrbitalProps>(function IntermediateOrbital(
  { kind, scale = 80, x = 0, y = 0, ...rest },
  ref
) {
  const C = { x: 0, y: 0 }
  const r = scale
  const lobeUp = { x: 0, y: -LOBE.offset * r }
  const lobeDown = { x: 0, y: LOBE.offset * r }
  const caption =
    kind === 'carbocation'
      ? 'sp² · empty p orbital'
      : kind === 'carbanion'
        ? 'sp³ · lone pair'
        : kind === 'radical'
          ? 'sp² · one electron in p'
          : 'σ C–H aligned with the empty p orbital'
  const caption2 = (
    <text x={0} y={118} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
      {caption}
    </text>
  )
  // The charge sits at the carbon's upper right, clear of the lobe and the bond to the right.
  const chargeAt = { x: 26, y: -22 }

  if (kind === 'hyperconjugation') {
    // Ethyl cation H3C-CH2+. The methyl carbon sits to the right; its C-H that points up is aligned with
    // the upper p lobe. The arrow pushes that C-H electron pair into the upper lobe.
    const cMe = at(C, PLANAR[0], r * 0.82)
    const hUp = { x: cMe.x, y: cMe.y - 0.78 * r }
    const mid = { x: cMe.x, y: (cMe.y + hUp.y) / 2 }
    const target = { x: LOBE.rx + 6, y: lobeUp.y }
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <ellipse cx={lobeDown.x} cy={lobeDown.y} rx={LOBE.rx} ry={LOBE.ry} {...LOBE_STYLE} />
        <ellipse cx={lobeUp.x} cy={lobeUp.y} rx={LOBE.rx} ry={LOBE.ry} {...LOBE_STYLE} />
        <Bond from={at(C, PLANAR[1], CLEAR)} to={at(C, PLANAR[1], r * 0.82)} />
        <Label x={at(C, PLANAR[1], r * 1.05).x} y={at(C, PLANAR[1], r * 1.05).y}>H</Label>
        <Bond from={at(C, PLANAR[2], CLEAR)} to={at(C, PLANAR[2], r * 0.82)} />
        <Label x={at(C, PLANAR[2], r * 1.05).x} y={at(C, PLANAR[2], r * 1.05).y}>H</Label>
        <Bond from={at(C, PLANAR[0], CLEAR)} to={cMe} />
        <Label x={C.x} y={C.y}>C</Label>
        <ChargeMark x={chargeAt.x} y={chargeAt.y} sign="+" />
        {/* One of the methyl hydrogens is drawn explicitly (the aligned C–H), so the label carries the other two. */}
        <Label x={cMe.x} y={cMe.y + 22} size={16}>H₂C</Label>
        {/* The highlighted C-H, aligned with the p axis */}
        <line x1={cMe.x} y1={cMe.y} x2={hUp.x} y2={hUp.y} stroke="var(--e-arrow)" strokeWidth={7} strokeLinecap="round" opacity={0.3} />
        <Bond from={cMe} to={hUp} />
        <Label x={hUp.x} y={hUp.y - 12} size={16}>H</Label>
        <CurvedArrow from={{ x: mid.x + 4, y: mid.y }} to={target} bend={0.35} kind="pair" gap={3} />
        {caption2}
      </g>
    )
  }

  if (kind === 'carbanion') {
    // sp3: pyramidal, with the lone pair in a lobe pointing up.
    const lp = { x: C.x, y: C.y - 0.7 * r }
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <ellipse cx={lp.x} cy={lp.y} rx={LOBE.rx * 1.3} ry={LOBE.ry * 1.5} fill="var(--orbital-neg)" fillOpacity={0.3} stroke="var(--orbital-neg)" strokeWidth={1.8} />
        <circle cx={C.x - 5} cy={lp.y - 6} r={3.4} fill="var(--fg)" />
        <circle cx={C.x + 5} cy={lp.y + 6} r={3.4} fill="var(--fg)" />
        {TETRA.map((th, i) => (
          <g key={i}>
            <Bond from={at(C, th, CLEAR)} to={at(C, th, r * 0.82)} />
            <Label x={at(C, th, r * 1.05).x} y={at(C, th, r * 1.05).y} size={18}>{['H', 'CH₃', 'CH₃'][i]}</Label>
          </g>
        ))}
        <Label x={C.x} y={C.y} size={22}>C</Label>
        <ChargeMark x={28} y={-40} sign="−" />
        {caption2}
      </g>
    )
  }

  // Planar sp2: carbocation (both lobes empty) and radical (one lobe holds the single electron).
  const subs = ['CH₃', 'CH₃', 'H']
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <ellipse cx={lobeDown.x} cy={lobeDown.y} rx={LOBE.rx} ry={LOBE.ry} {...LOBE_STYLE} />
      <ellipse
        cx={lobeUp.x}
        cy={lobeUp.y}
        rx={LOBE.rx}
        ry={LOBE.ry}
        {...LOBE_STYLE}
        fill={kind === 'radical' ? 'var(--orbital-pos)' : 'none'}
        fillOpacity={kind === 'radical' ? 0.22 : 0}
        strokeDasharray={kind === 'radical' ? undefined : '4 4'}
      />
      {PLANAR.map((th, i) => (
        <g key={i}>
          <Bond from={at(C, th, CLEAR)} to={at(C, th, r * 0.82)} />
          <Label x={at(C, th, r * 1.05).x} y={at(C, th, r * 1.05).y}>{subs[i]}</Label>
        </g>
      ))}
      {kind === 'radical' && <circle cx={lobeUp.x} cy={lobeUp.y} r={5} fill="var(--fg)" />}
      <Label x={C.x} y={C.y} size={22}>C</Label>
      {kind === 'carbocation' && <ChargeMark x={chargeAt.x} y={chargeAt.y} sign="+" />}
      {caption2}
    </g>
  )
})
