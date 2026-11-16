import React, { forwardRef } from 'react'

/** Size of the polymer drawing, for a parent viewBox. */
export const POLYMER_CHAIN_SIZE = { width: 900, height: 344 } as const

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
const CHAIN_Y0 = 170
const ZIG = 20
const MONO_Y = 74
const BOND = 40
const REPEAT_Y = 270

/** Each monomer: its formula, the repeat unit as written inside the brackets, and the bond orders in the chain. */
const SPEC: Record<Monomer, { formula: string; unit: string; start: 'double' | 'triple'; end: 'single' | 'double'; methyl: boolean }> = {
  ethene: { formula: 'H₂C=CH₂', unit: 'CH₂–CH₂', start: 'double', end: 'single', methyl: false },
  propene: { formula: 'H₂C=CH–CH₃', unit: 'CH₂–CH(CH₃)', start: 'double', end: 'single', methyl: true },
  ethyne: { formula: 'HC≡CH', unit: 'CH=CH', start: 'triple', end: 'double', methyl: false },
}

/** Approximate advance of a run of text, in px at a font size. */
function textWidth(s: string, size: number): number {
  let w = 0
  for (const ch of s) {
    if (ch === ' ') w += 0.3
    else if (ch === '–' || ch === '=' || ch === '≡') w += 0.6
    else if (/[₀-₉]/.test(ch)) w += 0.6
    else if (/[A-Z]/.test(ch)) w += 0.7
    else w += 0.6
  }
  return w * size
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

/** Chain carbon j in the zig-zag of 40-unit bonds. Odd carbons (the CH carbons of propene) sit high, so their methyls point up. */
function chainCarbon(j: number): Pt {
  return { x: CHAIN_X0 + j * 34.64, y: CHAIN_Y0 + (j % 2 === 1 ? -ZIG : 0) }
}

/** Monomer k's two carbons before it joins: a horizontal C=C (or C≡C) centred on its slot. */
function monomerCarbons(k: number): [Pt, Pt] {
  const cx = 150 + k * 190
  return [
    { x: cx - BOND / 2, y: MONO_Y },
    { x: cx + BOND / 2, y: MONO_Y },
  ]
}

/** A bond as one line (single) or as parallel lines (double, triple), spaced so each line reads clearly. */
function MultiBond({ a, b, order, opacity }: { a: Pt; b: Pt; order: 1 | 2 | 3; opacity: number }) {
  if (opacity <= 0.001) return null
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * 5
  const ny = (dx / len) * 5
  const offsets = order === 1 ? [0] : order === 2 ? [-1, 1] : [-1, 0, 1]
  const width = order === 1 ? 3 : 2.4
  return (
    <g opacity={opacity}>
      {offsets.map((o, i) => (
        <line key={i} x1={a.x + nx * o} y1={a.y + ny * o} x2={b.x + nx * o} y2={b.y + ny * o} stroke={SIGMA} strokeWidth={width} strokeLinecap="round" />
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

/**
 * The repeat unit in the textbook form: –[unit]ₙ–, with the bonds to the neighbouring units
 * running through the brackets, the unit's atoms written on the line, and n at the lower right.
 */
function RepeatUnit({ monomer }: { monomer: Monomer }) {
  const unit = SPEC[monomer].unit
  const size = 22
  const unitW = textWidth(unit, size)
  const stub = 40
  const bracketGap = 12
  const total = stub + bracketGap + unitW + bracketGap + 14 + stub
  const left = 450 - total / 2
  const unitL = left + stub + bracketGap
  const unitR = unitL + unitW
  const bracketL = unitL - bracketGap
  const bracketR = unitR + bracketGap
  const top = REPEAT_Y - 26
  const bottom = REPEAT_Y + 26
  const bracket = (x: number, flip: boolean) => {
    const serif = flip ? -7 : 7
    return <path d={`M${x + serif},${top} L${x},${top} L${x},${bottom} L${x + serif},${bottom}`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
  }
  return (
    <g>
      {/* Bonds to the neighbouring units run through the brackets. */}
      <line x1={left} y1={REPEAT_Y} x2={unitL - 4} y2={REPEAT_Y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      <line x1={unitR + 4} y1={REPEAT_Y} x2={left + total} y2={REPEAT_Y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      {bracket(bracketL, false)}
      {bracket(bracketR, true)}
      <Label x={unitL} y={REPEAT_Y} anchor="start" size={size} weight={600}>
        {unit}
      </Label>
      <Label x={bracketR + 6} y={REPEAT_Y + 16} anchor="start" size={18} weight={600}>
        n
      </Label>
      <Label x={450} y={bottom + 24} size={17} weight={600}>
        {'repeat unit, bracketed, with n units'}
      </Label>
    </g>
  )
}

/**
 * Addition polymerisation. The monomers (ethene, propene, ethyne) join one at a time into a chain:
 * each monomer's multiple bond becomes a single or double bond as it joins, and the bond to the
 * previous unit forms. Propene's CH carbons carry a methyl. Below, the repeat unit is written
 * in brackets with n, and the bonds to the neighbouring units run through the brackets.
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
        const t = joinT(k)
        const a = carbons[2 * k]
        const b = carbons[2 * k + 1]
        const startOrder = monomer === 'ethyne' ? 3 : 2
        return (
          <g key={`intra-${k}`}>
            <MultiBond a={a} b={b} order={startOrder} opacity={1 - t} />
            <MultiBond a={a} b={b} order={spec.end === 'double' ? 2 : 1} opacity={t} />
          </g>
        )
      })}

      {/* Inter-unit bonds, forming as each unit joins */}
      {Array.from({ length: UNITS - 1 }, (_, k) => (
        <MultiBond key={`inter-${k}`} a={carbons[2 * k + 1]} b={carbons[2 * k + 2]} order={1} opacity={joinT(k + 1)} />
      ))}

      {/* Dangling bonds at the two ends of the chain, shown once the chain has formed */}
      <g opacity={joinT(0)}>
        <line x1={carbons[0].x} y1={carbons[0].y} x2={carbons[0].x - 26} y2={carbons[0].y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      </g>
      <g opacity={joinT(UNITS - 1)}>
        <line x1={carbons[carbons.length - 1].x} y1={carbons[carbons.length - 1].y} x2={carbons[carbons.length - 1].x + 26} y2={carbons[carbons.length - 1].y} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
      </g>

      {/* Methyls for propene: one on each CH carbon (every second carbon), pointing up from the chain */}
      {spec.methyl &&
        Array.from({ length: UNITS }, (_, k) => {
          const c = carbons[2 * k + 1]
          const t = joinT(k)
          return (
            <g key={`me-${k}`} opacity={t}>
              <line x1={c.x} y1={c.y} x2={c.x} y2={c.y - 34} stroke={SIGMA} strokeWidth={3} strokeLinecap="round" />
              <Label x={c.x} y={c.y - 50} size={16}>
                CH₃
              </Label>
            </g>
          )
        })}

      {Array.from({ length: UNITS * 2 }, (_, j) => (
        <Carbon key={`c-${j}`} at={carbons[j]} />
      ))}

      <Label x={CHAIN_X0 + 3.5 * 34.64} y={CHAIN_Y0 + 44} size={17} weight={600}>
        {'Growing chain, dangling bonds at both ends'}
      </Label>
      <Label x={150} y={24} size={17} weight={600} opacity={1 - joinT(UNITS - 1)}>
        {'Monomers'}
      </Label>

      <RepeatUnit monomer={monomer} />
    </g>
  )
})
