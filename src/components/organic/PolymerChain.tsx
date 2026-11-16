import React, { forwardRef } from 'react'
import { revealFraction, unitClamp } from './hydrocarbon-geometry'

/** Size of the polymerisation drawing, for a parent viewBox. */
export const POLYMER_CHAIN_SIZE = { width: 560, height: 300 } as const

export type Monomer = 'ethene' | 'propene' | 'ethyne'

const MONOMER: Record<Monomer, { formula: string; repeat: string; pendant: boolean; double: boolean }> = {
  ethene: { formula: 'H₂C=CH₂', repeat: '–CH₂–CH₂–', pendant: false, double: false },
  propene: { formula: 'H₂C=CH–CH₃', repeat: '–CH₂–CH(CH₃)–', pendant: true, double: false },
  ethyne: { formula: 'HC≡CH', repeat: '–CH=CH–', pendant: false, double: true },
}

/** Backbone carbons: two per repeat unit, zigzagged. */
const UNITS = 3
const CARBON_DX = 56
const CHAIN_Y = 214
const ZIG = 16
const chainX = (k: number) => 98 + k * CARBON_DX
const chainY = (k: number) => CHAIN_Y + (k % 2 === 0 ? 0 : -ZIG)

export interface PolymerChainProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  monomer?: Monomer
  /** 0 to 1: the monomers move down and join into a chain, the bonds are drawn in and the repeat unit is bracketed. */
  progress?: number
  x?: number
  y?: number
}

/**
 * Addition polymerisation: monomers (ethene, propene, ethyne) join, one bond at a time, into a chain
 * whose repeat unit is bracketed with the subscript n. `progress` drives the joining.
 */
export const PolymerChain = forwardRef<SVGGElement, PolymerChainProps>(function PolymerChain(
  { monomer = 'ethene', progress = 1, x = 0, y = 0, ...rest },
  ref
) {
  const spec = MONOMER[monomer]
  const p = unitClamp(progress)
  const starts = [110, 250, 390]
  const ends = Array.from({ length: UNITS }, (_, i) => (chainX(2 * i) + chainX(2 * i + 1)) / 2)
  const carbons = Array.from({ length: UNITS * 2 }, (_, k) => k)
  const bonds = carbons.slice(0, -1)
  const bracketL = chainX(0) - 30
  const bracketR = chainX(UNITS * 2 - 1) + 30
  const monomerOpacity = 1 - revealFraction(p, 0.8, 1)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Monomers, moving down into place */}
      <g opacity={monomerOpacity}>
        {starts.map((sx, i) => {
          const t = revealFraction(p, 0, 0.8)
          const ease = t * t * (3 - 2 * t)
          const mx = sx + (ends[i] - sx) * ease
          const my = 74 + (CHAIN_Y - 40 - 74) * ease
          return (
            <text key={`m-${i}`} x={mx} y={my} textAnchor="middle" dominantBaseline="central" fontSize={20} fontFamily="var(--font-sans)" fill="var(--fg)">
              {spec.formula}
            </text>
          )
        })}
      </g>
      {starts.slice(0, -1).map((sx, i) => (
        <text key={`plus-${i}`} x={(sx + starts[i + 1]) / 2} y={74} textAnchor="middle" dominantBaseline="central" fontSize={22} fontFamily="var(--font-sans)" fill="var(--fg-muted)" opacity={1 - p}>
          +
        </text>
      ))}

      {/* Chain bonds appear in order */}
      {bonds.map((k) => {
        const op = revealFraction(p, 0.35 + (0.5 * k) / bonds.length, 0.35 + (0.5 * (k + 1)) / bonds.length)
        const double = spec.double && k % 2 === 0
        return (
          <g key={`b-${k}`} opacity={op}>
            <line x1={chainX(k)} y1={chainY(k)} x2={chainX(k + 1)} y2={chainY(k + 1)} stroke="var(--polymer)" strokeWidth={3.4} strokeLinecap="round" />
            {double && <line x1={chainX(k)} y1={chainY(k) + 6} x2={chainX(k + 1)} y2={chainY(k + 1) + 6} stroke="var(--polymer)" strokeWidth={2.2} strokeLinecap="round" />}
          </g>
        )
      })}
      {carbons.map((k) => (
        <circle key={`c-${k}`} cx={chainX(k)} cy={chainY(k)} r={3.6} fill="var(--polymer)" opacity={revealFraction(p, 0.35, 0.6)} />
      ))}
      {spec.pendant &&
        carbons
          .filter((k) => k % 2 === 1)
          .map((k) => (
            <g key={`pend-${k}`} opacity={revealFraction(p, 0.5, 0.8)}>
              <line x1={chainX(k)} y1={chainY(k)} x2={chainX(k)} y2={chainY(k) - 34} stroke="var(--polymer)" strokeWidth={3} strokeLinecap="round" />
              <text x={chainX(k)} y={chainY(k) - 46} textAnchor="middle" dominantBaseline="central" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg)">
                CH₃
              </text>
            </g>
          ))}

      {/* Brackets around the repeat unit, with the subscript n */}
      <g opacity={revealFraction(p, 0.8, 1)}>
        <path d={`M${bracketL + 8},${CHAIN_Y - 58} L${bracketL},${CHAIN_Y - 58} L${bracketL},${CHAIN_Y + 42} L${bracketL + 8},${CHAIN_Y + 42}`} fill="none" stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
        <path d={`M${bracketR - 8},${CHAIN_Y - 58} L${bracketR},${CHAIN_Y - 58} L${bracketR},${CHAIN_Y + 42} L${bracketR - 8},${CHAIN_Y + 42}`} fill="none" stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
        <text x={bracketR + 4} y={CHAIN_Y - 40} textAnchor="start" dominantBaseline="central" fontSize={22} fontFamily="var(--font-sans)" fill="var(--fg)">
          <tspan baselineShift="sub" fontSize={16}>
            n
          </tspan>
        </text>
        <text x={(bracketL + bracketR) / 2} y={CHAIN_Y + 78} textAnchor="middle" dominantBaseline="central" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg)">
          {spec.repeat}
        </text>
      </g>
    </g>
  )
})
