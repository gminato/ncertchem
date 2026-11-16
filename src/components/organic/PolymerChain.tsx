import React, { forwardRef } from 'react'

/** Size of the polymer drawing, for a parent viewBox. */
export const POLYMER_CHAIN_SIZE = { width: 900, height: 300 } as const

export type Monomer = 'ethene' | 'propene' | 'ethyne'

export interface PolymerChainProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  monomer?: Monomer
  /** 0 to 1: the monomers move down and join, one at a time, into a chain. */
  progress?: number
  x?: number
  y?: number
}

type Pt = { x: number; y: number }
const INK = 'var(--fg)'
const SIGMA = 'var(--sigma-bond)'
const UNITS = 4
const CHAIN_X0 = 329
const CHAIN_Y0 = 150
const ZIG = 20
const MONO_Y = 74
const BOND = 40

const SPEC: Record<Monomer, { formula: string; repeat: [string, string]; start: 'double' | 'triple'; end: 'single' | 'double'; branch: boolean }> = {
  ethene: { formula: 'H₂C=CH₂', repeat: ['CH₂', 'CH₂'], start: 'double', end: 'single', branch: false },
  propene: { formula: 'H₂C=CH–CH₃', repeat: ['CH₂', 'CH'], start: 'double', end: 'single', branch: true },
  ethyne: { formula: 'HC≡CH', repeat: ['CH', 'CH'], start: 'triple', end: 'double', branch: false },
}

function smooth(t: number) {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}
function lerpPt(a: Pt, b: Pt, t: number): Pt {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

/** Chain carbon j at its place in the chain: a zig-zag of 40-unit bonds. */
function chainCarbon(j: number): Pt {
  return { x: CHAIN_X0 + j * 34.64, y: CHAIN_Y0 + (j % 2 === 1 ? -ZIG : 0) }
}

/** Monomer k's two carbons, before it joins: a horizontal C=C centred on its slot. */
function monomerCarbons(k: number): [Pt, Pt] {
  const cx = 150 + k * 190
  return [
    { x: cx - BOND / 2, y: MONO_Y },
    { x: cx + BOND / 2, y: MONO_Y },
  ]
}

/** Bond between two points, drawn as one line (single), or as the parallel lines of a double or triple bond. */
function MultiBond({ a, b, order, opacity }: { a: Pt; b: Pt; order: 1 | 2 | 3; opacity: number }) {
  if (opacity <= 0.001) return null
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * 4.5
  const ny = (dx / len) * 4.5
  const offsets = order === 1 ? [0] : order === 2 ? [-1, 1] : [-1, 0, 1]
  return (
    <g opacity={opacity}>
      {offsets.map((o, i) => (
        <line key={i} x1={a.x + nx * o} y1={a.y + ny * o} x2={b.x + nx * o} y2={b.y + ny * o} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      ))}
    </g>
  )
}

function Carbon({ at }: { at: Pt }) {
  return <circle cx={at.x} cy={at.y} r={4.5} fill={INK} />
}

function Label({ x, y, children, size = 18, anchor = 'middle', weight = 600, opacity = 1 }: { x: number; y: number; children: React.ReactNode; size?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number; opacity?: number }) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={size} fontWeight={weight} fontFamily="var(--font-sans)" fill={INK} opacity={opacity} stroke="var(--surface)" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  )
}

/** The bracketed repeat unit: brackets with the subscript n, and the bonds from the next and previous units crossing them. */
function RepeatUnit({ monomer }: { monomer: Monomer }) {
  const spec = SPEC[monomer]
  const top = 232
  const bottom = 292
  const bl = 326
  const br = 574
  const c1 = { x: 374, y: 262 }
  const c2 = { x: 454, y: 262 }
  const stubL = { x: 286, y: 262 }
  const stubR = { x: 622, y: 262 }
  const bracket = (x: number, flip: boolean) => {
    const serif = flip ? -8 : 8
    return (
      <path d={`M${x + serif},${top} L${x},${top} L${x},${bottom} L${x + serif},${bottom}`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
    )
  }
  return (
    <g>
      {bracket(bl, false)}
      {bracket(br, true)}
      <Label x={br + 36} y={bottom - 8} size={18}>{'n'}</Label>
      {/* Bonds crossing the brackets, to the neighbouring repeat units. */}
      <line x1={stubL.x} y1={stubL.y} x2={c1.x} y2={c1.y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      <line x1={c2.x} y1={c2.y} x2={stubR.x} y2={stubR.y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      <MultiBond a={c1} b={c2} order={spec.end === 'double' ? 2 : 1} opacity={1} />
      <Carbon at={c1} />
      <Carbon at={c2} />
      <Label x={c1.x} y={c1.y + 26} size={18}>{spec.repeat[0]}</Label>
      <Label x={c2.x} y={c2.y + 26} size={18}>{spec.repeat[1]}</Label>
      {spec.branch && (
        <g>
          <line x1={c2.x} y1={c2.y} x2={c2.x} y2={c2.y + 36} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
          <Label x={c2.x} y={c2.y + 56} size={18}>CH₃</Label>
        </g>
      )}
      <Label x={(bl + br) / 2} y={bottom + 24} size={17} weight={600}>{'repeat unit, bracketed with n'}</Label>
    </g>
  )
}

/**
 * Addition polymerisation. The monomers (ethene, propene, ethyne) join one at a time into a chain:
 * each monomer's C=C (or C≡C) becomes a single or double bond as it joins, and the bond to the
 * previous unit forms. The chain carries a dangling bond at each end. Below, the repeat unit is
 * bracketed with the subscript n, and the bonds to the neighbouring units cross the brackets.
 */
export const PolymerChain = forwardRef<SVGGElement, PolymerChainProps>(function PolymerChain(
  { monomer = 'ethene', progress = 1, x = 0, y = 0, ...rest },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  const spec = SPEC[monomer]
  // Monomer k joins at a time that depends on its index, so the joins are staggered and each one is exact at any progress.
  const joinT = (k: number) => smooth((p - 0.12 * k) / 0.6)

  // Positions of the carbons of each unit at this progress.
  const carbons: Pt[] = []
  for (let k = 0; k < UNITS; k++) {
    const [a, b] = monomerCarbons(k)
    const t = joinT(k)
    carbons.push(lerpPt(a, chainCarbon(2 * k), t), lerpPt(b, chainCarbon(2 * k + 1), t))
  }

  // Each unit's internal bond morphs from the monomer's bond to the chain's bond.
  const intra = Array.from({ length: UNITS }, (_, k) => joinT(k))
  // The bond from unit k to unit k+1 appears as unit k+1 joins.
  const inter = Array.from({ length: UNITS - 1 }, (_, k) => joinT(k + 1))

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Monomers: their formulas, fading as they join */}
      {Array.from({ length: UNITS }, (_, k) => {
        const [a, b] = monomerCarbons(k)
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const cMid = { x: (chainCarbon(2 * k).x + chainCarbon(2 * k + 1).x) / 2, y: (chainCarbon(2 * k).y + chainCarbon(2 * k + 1).y) / 2 }
        const t = joinT(k)
        const m = lerpPt(mid, cMid, t)
        return (
          <Label key={`f-${k}`} x={m.x} y={m.y - 26 * (1 - t) - 2} size={16} weight={500} opacity={1 - t}>
            {spec.formula}
          </Label>
        )
      })}

      {/* Intra-unit bonds: from the monomer's multiple bond to the chain's bond */}
      {Array.from({ length: UNITS }, (_, k) => {
        const t = intra[k]
        const a = carbons[2 * k]
        const b = carbons[2 * k + 1]
        return (
          <g key={`intra-${k}`}>
            <MultiBond a={a} b={b} order={monomer === 'ethyne' ? 3 : 2} opacity={1 - t} />
            <MultiBond a={a} b={b} order={spec.end === 'double' ? 2 : 1} opacity={t} />
          </g>
        )
      })}

      {/* Inter-unit bonds, forming as each unit joins */}
      {inter.map((t, k) => (
        <MultiBond key={`inter-${k}`} a={carbons[2 * k + 1]} b={carbons[2 * k + 2]} order={1} opacity={t} />
      ))}

      {/* Dangling bonds at the two ends of the chain, shown once the chain has formed */}
      <g opacity={joinT(0)}>
        <line x1={carbons[0].x} y1={carbons[0].y} x2={carbons[0].x - 26} y2={carbons[0].y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" strokeDasharray="0" />
      </g>
      <g opacity={joinT(UNITS - 1)}>
        <line x1={carbons[carbons.length - 1].x} y1={carbons[carbons.length - 1].y} x2={carbons[carbons.length - 1].x + 26} y2={carbons[carbons.length - 1].y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* Methyl branches for propene, one per unit, on the CH carbon */}
      {spec.branch &&
        Array.from({ length: UNITS }, (_, k) => {
          const c = carbons[2 * k + 1]
          return <line key={`me-${k}`} x1={c.x} y1={c.y} x2={c.x} y2={c.y + 30} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
        })}

      {Array.from({ length: UNITS * 2 }, (_, j) => (
        <Carbon key={`c-${j}`} at={carbons[j]} />
      ))}

      <Label x={CHAIN_X0 + 3.5 * 34.64} y={CHAIN_Y0 + 44} size={17} weight={600}>{'Growing chain, dangling bonds at both ends'}</Label>
      <Label x={150} y={24} size={17} weight={600} opacity={1 - joinT(UNITS - 1)}>{'Monomers'}</Label>

      <RepeatUnit monomer={monomer} />
    </g>
  )
})
