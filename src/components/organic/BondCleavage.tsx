import React, { forwardRef } from 'react'
import { CurvedArrow } from './CurvedArrow'
import { ease } from './morph'
import { chargeText } from './frame'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const BOND_CLEAVAGE_SIZE = { width: 460, height: 200 } as const

export interface BondCleavageProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Homolytic: two radicals (two fishhooks). Heterolytic: a cation and an anion (one full arrow). */
  kind: 'homolytic' | 'heterolytic'
  /** Label on the left fragment, e.g. "CH₃". */
  left: string
  /** Label on the right fragment, e.g. "Br". */
  right: string
  /** 0 to 1: how far the bond has broken. */
  progress?: number
  /** Heterolytic only: which fragment takes the electron pair (the anion). Default right. */
  anionSide?: 'left' | 'right'
  x?: number
  y?: number
}

const HALF_BOND = 80
const SEPARATION = 150
const CY = 0

/** A bond splitting into two fragments: homolysis gives two radicals, heterolysis a cation and an anion. */
export const BondCleavage = forwardRef<SVGGElement, BondCleavageProps>(function BondCleavage(
  { kind, left, right, progress = 1, anionSide = 'right', x = 0, y = 0, ...rest },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  const e = ease(p)
  const xl = -HALF_BOND - e * SEPARATION * 0.5
  const xr = HALF_BOND + e * SEPARATION * 0.5
  const bondOpacity = 1 - e
  const mid = { x: 0, y: CY }
  const labelY = CY
  const anionLeft = anionSide === 'left'

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* The bond, fading as it breaks */}
      <line
        x1={-HALF_BOND}
        y1={CY}
        x2={HALF_BOND}
        y2={CY}
        stroke="var(--fg)"
        strokeWidth={2.8}
        strokeLinecap="round"
        opacity={bondOpacity}
      />
      {/* Fragments */}
      <text x={xl} y={labelY} textAnchor="end" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        <tspan dx={-4}>{left}</tspan>
      </text>
      <text x={xr} y={labelY} textAnchor="start" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        <tspan dx={4}>{right}</tspan>
      </text>

      {kind === 'homolytic' ? (
        <g>
          {/* Two fishhooks from the bond midpoint, one to each fragment */}
          <CurvedArrow from={mid} to={{ x: xl + 24, y: CY - 26 }} bend={0.35} kind="radical" progress={p} gap={2} />
          <CurvedArrow from={mid} to={{ x: xr - 24, y: CY - 26 }} bend={-0.35} kind="radical" progress={p} gap={2} />
          {p > 0.6 && (
            <g opacity={Math.min(1, (p - 0.6) / 0.3)}>
              <circle cx={xl - 30} cy={CY - 26} r={4} fill="var(--fg)" />
              <circle cx={xr + 30} cy={CY - 26} r={4} fill="var(--fg)" />
            </g>
          )}
          <text x={0} y={62} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Homolysis: each fragment keeps one electron
          </text>
        </g>
      ) : (
        <g>
          {/* One full arrow from the bond to the fragment that takes both electrons */}
          <CurvedArrow
            from={mid}
            to={anionLeft ? { x: xl + 26, y: CY - 22 } : { x: xr - 26, y: CY - 22 }}
            bend={anionLeft ? 0.35 : -0.35}
            kind="pair"
            progress={p}
            gap={2}
          />
          {p > 0.7 && (
            <g opacity={Math.min(1, (p - 0.7) / 0.3)}>
              <text
                x={xl - 22}
                y={CY - 40}
                textAnchor="middle"
                fontSize={22}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                {chargeText(anionLeft ? -1 : 1)}
              </text>
              <text
                x={xr + 14}
                y={CY - 40}
                textAnchor="middle"
                fontSize={22}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                {chargeText(anionLeft ? 1 : -1)}
              </text>
            </g>
          )}
          <text x={0} y={62} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Heterolysis: the pair goes to {anionLeft ? 'left' : 'right'}
          </text>
        </g>
      )}
    </g>
  )
})
