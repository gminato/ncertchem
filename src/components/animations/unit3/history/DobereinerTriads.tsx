'use client'

import { NCERT_TABLE_3_1_TRIADS, triadMean } from '@/lib/chem/ncert-unit3-tables'
import { Label } from '@/components/vocab'
import { triadStep, triadStepMean, type TriadStep } from './history-steps'
import styles from './history.module.css'

export interface DobereinerTriadsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 300
const AXIS_Y = 190
const MASS_MAX = 140
const X0 = 44
const X1 = 540

/** Maps an atomic weight onto the number line. */
const massX = (mass: number) => X0 + (mass / MASS_MAX) * (X1 - X0)

const fmt = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, ''))

/**
 * Döbereiner's triads on a number line of atomic weight. The outer two elements are
 * fixed. The middle element starts at the mean of the outer two and then slides to its
 * own weight, which is close to that mean in every triad of Table 3.1.
 */
export function DobereinerTriads({ step, reducedMotion }: DobereinerTriadsProps) {
  const s: TriadStep = triadStep(step)
  const row = NCERT_TABLE_3_1_TRIADS.rows[s.triad]
  const mean = triadMean(row)
  const meanX = massX(triadStepMean(step))
  const middleWeight = s.middleAtOwnWeight ? row.middle.atomicWeight : mean
  const middleX = massX(middleWeight)
  const transition = reducedMotion ? 'none' : undefined
  const low = massX(row.low.atomicWeight)
  const high = massX(row.high.atomicWeight)

  const note =
    s.triad === 0 && !s.middleAtOwnWeight
      ? `Mean of ${row.low.symbol} (${row.low.atomicWeight}) and ${row.high.symbol} (${row.high.atomicWeight}) is ${fmt(mean)}.`
      : s.triad === 0
        ? `${row.middle.symbol} sits exactly at that mean, ${fmt(row.middle.atomicWeight)}.`
        : `${row.middle.symbol} (${fmt(row.middle.atomicWeight)}) is close to the mean ${fmt(mean)}.`

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Döbereiner's triad on a number line of atomic weight, with the middle element near the mean of the outer two"
        data-testid="triads"
        data-step={step}
      >
        <text x={X0} y={44} className={styles.note}>
          Triad: {row.low.symbol}, {row.middle.symbol}, {row.high.symbol}
        </text>
        <text x={X0} y={68} className={styles.noteStrong}>
          {note}
        </text>

        <line x1={X0} x2={X1} y1={AXIS_Y} y2={AXIS_Y} className={styles.axis} />
        {[0, 20, 40, 60, 80, 100, 120, 140].map((m) => (
          <line key={m} x1={massX(m)} x2={massX(m)} y1={AXIS_Y} y2={AXIS_Y + 5} className={styles.axis} />
        ))}
        <text x={X1} y={AXIS_Y + 40} textAnchor="end" className={styles.tick}>
          atomic weight / u
        </text>

        {s.showMean && (
          <g data-testid="triad-mean">
            <path
              d={`M ${meanX} ${AXIS_Y + 7} L ${meanX - 6} ${AXIS_Y + 16} L ${meanX + 6} ${AXIS_Y + 16} Z`}
              className={styles.meanMarker}
            />
            <text x={meanX} y={AXIS_Y + 40} textAnchor="middle" className={styles.note}>
              mean {fmt(triadStepMean(step))}
            </text>
          </g>
        )}

        <g>
          <circle cx={low} cy={AXIS_Y} r={9} className={styles.dot} />
          <Label x={low} y={AXIS_Y - 22} fontSize={16} fill="var(--fg)" fontWeight={600}>
            {row.low.symbol} {fmt(row.low.atomicWeight)}
          </Label>
        </g>
        <g>
          <circle cx={high} cy={AXIS_Y} r={9} className={styles.dot} />
          <Label x={high} y={AXIS_Y - 22} fontSize={16} fill="var(--fg)" fontWeight={600}>
            {row.high.symbol} {fmt(row.high.atomicWeight)}
          </Label>
        </g>

        {s.showMiddle && (
          <g
            style={{
              transform: `translateX(${middleX}px)`,
              transition: transition ?? 'transform 0.7s var(--ease-out)',
            }}
            data-testid="triad-middle"
          >
            <circle cx={0} cy={AXIS_Y} r={9} className={s.middleAtOwnWeight ? styles.dot : styles.dotMean} />
            <Label x={0} y={AXIS_Y - 22} fontSize={16} fill="var(--fg)" fontWeight={600}>
              {row.middle.symbol} {fmt(row.middle.atomicWeight)}
            </Label>
          </g>
        )}
      </svg>
    </div>
  )
}
