'use client'

import { SkeletalFormula } from '@/components/organic'
import { describeStep } from './halide-classes-steps'

export interface HalideClassesProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  /** Each Step is a cut to its target state, so there is no tween to switch off. */
  reducedMotion: boolean
}

const W = 580
const H = 400

/** Drawing size per layout: one molecule fills the panel, two or three share it. */
const LAYOUT = {
  // Atom labels in SkeletalFormula are 0.36 × scale: scale 40 gives 14-unit halogen labels.
  1: { scale: 64, cy: 168, nameY: 300, classY: 328, formulaY: 354, font: 16, formulaFont: 15 },
  2: { scale: 40, cy: 130, nameY: 236, classY: 262, formulaY: 288, font: 15, formulaFont: 14 },
  3: { scale: 40, cy: 125, nameY: 236, classY: 262, formulaY: 288, font: 14, formulaFont: 14 },
} as const

export function HalideClasses({ step }: HalideClassesProps) {
  const panels = describeStep(step)
  const count = panels.length as 1 | 2 | 3
  const layout = LAYOUT[count]
  const colW = W / panels.length
  const label = panels.map((p) => `${p.name}, ${p.classLabel}`).join('; ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} style={{ display: 'block', height: 'auto' }}>
      {panels.map((p, i) => {
        const cx = colW * (i + 0.5)
        return (
          <g key={p.smiles}>
            <SkeletalFormula graph={p.graph} scale={layout.scale} x={cx} y={layout.cy} highlightAtoms={p.highlight} />
            <text x={cx} y={layout.nameY} textAnchor="middle" fontSize={layout.font} fill="var(--fg)">
              {p.name}
            </text>
            <text x={cx} y={layout.classY} textAnchor="middle" fontSize={layout.font} fill="var(--accent)">
              {p.classLabel}
            </text>
            <text x={cx} y={layout.formulaY} textAnchor="middle" fontSize={layout.formulaFont} fill="var(--fg-muted)">
              {p.formula}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
