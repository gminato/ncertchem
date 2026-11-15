'use client'

import {
  BORN_HABER_NAMES,
  BORN_HABER_STEP_COUNT,
  bornHaberReadout,
  clampSteps,
  formatSignedKJ,
  schematicLevelY,
} from './nacl-steps'
import { NCERT_UNIT5_NACL_BORN_HABER } from '@/lib/chem/ncert-unit5-tables'
import styles from './nacl.module.css'

export interface NaClBornHaberProps {
  step: number
  reducedMotion: boolean
}

const VIEW = { width: 600, height: 330 }
const BASE_Y = 300
const GUTTER_END = 170
const LEVEL_FONT = 15
const STEP_FONT = 15
/** Arrow columns, one per cycle step, spaced so that alternating labels clear each other. */
const COLUMN_X = [205, 280, 355, 430, 505] as const
/** Which side of its arrow each step label sits on. Chosen so no label meets a level line or an arrow. */
const LABEL_SIDE: readonly ('left' | 'right')[] = ['right', 'left', 'left', 'right', 'left']
/** Each level sits at a cycle index; the cycle arrows join level i to level i+1. */
const LEVEL_LABELS = [
  'Na(s) + ½Cl₂(g)',
  'Na(g) + ½Cl₂(g)',
  'Na(g) + Cl(g)',
  'Na⁺(g) + Cl(g) + e⁻',
  'Na⁺(g) + Cl⁻(g)',
  'NaCl(s)',
] as const

/** Horizontal extent of the level line that joins arrow columns a and b (a ≤ b). */
function levelSpan(index: number): [number, number] {
  const cols: number[] = []
  if (index - 1 >= 0) cols.push(index - 1)
  if (index < BORN_HABER_STEP_COUNT - 1) cols.push(index)
  const first = Math.min(...cols)
  const last = Math.max(...cols)
  return [COLUMN_X[first] - 16, COLUMN_X[last] + 16]
}

/**
 * The Born–Haber cycle for NaCl drawn as a schematic enthalpy diagram. Levels are evenly spaced
 * (not to scale) in their true order; every number printed is the exact Unit 5 value. A Step adds
 * one arrow, and earlier arrows are dimmed.
 */
export function NaClBornHaber({ step }: NaClBornHaberProps) {
  const s = clampSteps(step, BORN_HABER_STEP_COUNT)
  const readout = bornHaberReadout(s)
  const yOf = (i: number) => schematicLevelY(i, BASE_Y)

  return (
    <div className={styles.wrapper} data-testid="nacl-born-haber" data-step={s}>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className={styles.svg}
        role="img"
        aria-label={`Born–Haber cycle for NaCl as an enthalpy diagram. ${readout}`}
      >
        {LEVEL_LABELS.map((label, i) => {
          const [x1, x2] = levelSpan(i)
          const y = yOf(i)
          return (
            <g key={`level-${i}`}>
              <line x1={x1} x2={x2} y1={y} y2={y} strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />
              <text
                x={GUTTER_END}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={LEVEL_FONT}
                fontFamily="var(--font-sans)"
                style={{ fill: 'var(--fg)' }}
              >
                {label}
              </text>
            </g>
          )
        })}

        {NCERT_UNIT5_NACL_BORN_HABER.map((cycleStep, i) => {
          if (i >= s) return null
          const current = i === s - 1
          const yFrom = yOf(i)
          const yTo = yOf(i + 1)
          const up = cycleStep.enthalpyKJ > 0
          const x = COLUMN_X[i]
          const tone = up ? 'var(--heat)' : 'var(--work)'
          const tip = up ? yTo + 6 : yTo - 6
          const midY = (yFrom + yTo) / 2
          const side = LABEL_SIDE[i]
          const textX = side === 'right' ? x + 12 : x - 12
          const anchor = side === 'right' ? 'start' : 'end'
          const head = up ? `${x},${yTo} ${x - 6},${yTo + 10} ${x + 6},${yTo + 10}` : `${x},${yTo} ${x - 6},${yTo - 10} ${x + 6},${yTo - 10}`
          return (
            <g key={`arrow-${i}`} opacity={current ? 1 : 0.45} data-testid={`bh-arrow-${i}`}>
              <line x1={x} x2={x} y1={yFrom} y2={tip} strokeWidth={current ? 3 : 2.2} strokeLinecap="round" style={{ stroke: tone }} />
              <polygon points={head} style={{ fill: tone }} />
              <text x={textX} y={midY - 9} textAnchor={anchor} fontSize={STEP_FONT} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
                <tspan className="sym">{BORN_HABER_NAMES[i]}</tspan>
              </text>
              <text x={textX} y={midY + 9} textAnchor={anchor} fontSize={STEP_FONT} fontFamily="var(--font-sans)" style={{ fill: tone }}>
                {formatSignedKJ(cycleStep.enthalpyKJ)}
              </text>
            </g>
          )
        })}
      </svg>
      <p className={styles.readout} aria-live="polite">
        {readout}
      </p>
      <p className={styles.note}>
        Levels not to scale; values exact. Up arrows take heat in (endothermic, orange). Down arrows give heat out (exothermic,
        teal). The lattice arrow points down in the formation direction: <span className="sym">ΔlatH</span> = −788 kJ mol⁻¹, so
        separating the solid into ions takes in +788 kJ mol⁻¹.
      </p>
    </div>
  )
}
