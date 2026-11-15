import React, { forwardRef } from 'react'
import { CurvedArrow } from './CurvedArrow'
import { ease } from './morph'

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

const HALF_BOND = 70
const SEPARATION = 130
const CY = 0
/** The bond never fully disappears: it stays faint to show what was broken. */
const FADED_BOND = 0.22

/**
 * A bond splitting into two fragments. The bond fades to a faint line (so the learner sees what
 * broke), the fragments drift apart, and each charge or radical is a superscript on its own atom.
 */
export const BondCleavage = forwardRef<SVGGElement, BondCleavageProps>(function BondCleavage(
  { kind, left, right, progress = 1, anionSide = 'right', x = 0, y = 0, ...rest },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  const e = ease(p)
  const xl = -HALF_BOND - e * SEPARATION * 0.5
  const xr = HALF_BOND + e * SEPARATION * 0.5
  const bondOpacity = 1 - e * (1 - FADED_BOND)
  const mid = { x: 0, y: CY }
  const anionLeft = anionSide === 'left'
  const sup = (text: string) => (
    <tspan baselineShift="super" fontSize={22} fontWeight={600} dx={2}>
      {text}
    </tspan>
  )
  // Plain signs with a baseline shift: Unicode superscript glyphs render too small to read.
  const leftSup = kind === 'homolytic' ? '•' : anionLeft ? '−' : '+'
  const rightSup = kind === 'homolytic' ? '•' : anionLeft ? '+' : '−'

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <line x1={-HALF_BOND} y1={CY} x2={HALF_BOND} y2={CY} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" opacity={bondOpacity} />
      <text x={xl + 6} y={CY} textAnchor="end" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {left}
        {sup(leftSup)}
      </text>
      <text x={xr - 6} y={CY} textAnchor="start" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {right}
        {sup(rightSup)}
      </text>

      {kind === 'homolytic' ? (
        <g>
          <CurvedArrow from={mid} to={{ x: xl + 10, y: CY - 34 }} bend={0.35} kind="radical" progress={p} gap={2} />
          <CurvedArrow from={mid} to={{ x: xr - 10, y: CY - 34 }} bend={-0.35} kind="radical" progress={p} gap={2} />
          <text x={0} y={62} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Homolysis: each fragment keeps one electron
          </text>
        </g>
      ) : (
        <g>
          <CurvedArrow
            from={mid}
            to={anionLeft ? { x: xl + 12, y: CY - 30 } : { x: xr - 12, y: CY - 30 }}
            bend={anionLeft ? 0.35 : -0.35}
            kind="pair"
            progress={p}
            gap={2}
          />
          <text x={0} y={62} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Heterolysis: the pair goes to {anionLeft ? left : right}
          </text>
        </g>
      )}
    </g>
  )
})
