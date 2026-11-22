'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import { SERIES_TONE } from '@/components/vocab/dblock'
import {
  FIRST_ROW,
  GROUP_6_METALS,
  STATE_LINE,
  explorerReadout,
  group6Entry,
  group6Summary,
  stateRows,
  type StateRow,
} from '@/lib/chem/oxidation-state-explorer'
import styles from './oxidation-state-explorer.module.css'

const GROUP_OPTIONS = GROUP_6_METALS.map((symbol) => ({ value: symbol, label: symbol }))

/** Series tone per group 6 metal: Cr is 3d, Mo 4d, W 5d (the same tones as the d-block strip). */
const GROUP_TONE: Record<string, string> = {
  Cr: SERIES_TONE['3d'],
  Mo: SERIES_TONE['4d'],
  W: SERIES_TONE['5d'],
}

const VIEW = { width: 600, height: 400 }
const LINE_Y = 124
const X_FIRST = 110
const X_STEP = 72

function stateX(state: number): number {
  return X_FIRST + (state - 1) * X_STEP
}

function StateMarker({ row, tone }: { row: StateRow; tone: string }) {
  const x = stateX(row.state)
  if (!row.listed) {
    return <circle cx={x} cy={LINE_Y} r={5} className={styles.absent} />
  }
  if (row.common) {
    return <circle cx={x} cy={LINE_Y} r={14} style={{ fill: tone }} />
  }
  return <circle cx={x} cy={LINE_Y} r={14} className={styles.hollow} style={{ stroke: tone }} />
}

export function OxidationStateExplorer() {
  const [element, setElement] = useState('Mn')
  const [group, setGroup] = useState('Cr')

  const rows = stateRows(element)
  const readout = explorerReadout(element)
  const tone = SERIES_TONE['3d']
  const groupEntry = group6Entry(group)
  const liveSummary = `${element}: listed states ${readout.states}. ${readout.lead} ${group6Summary(group)}`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.control}>
          <span className={styles.controlLabel}>First-row metal</span>
          <div className={styles.chips} role="group" aria-label="First-row element">
            {FIRST_ROW.map((symbol) => (
              <button
                key={symbol}
                type="button"
                className={styles.chip}
                aria-pressed={symbol === element}
                onClick={() => setElement(symbol)}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.control}>
          <span className={styles.controlLabel}>Group 6 metal</span>
          <Segmented label="Group 6 metal" options={GROUP_OPTIONS} value={group} onChange={setGroup} />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          role="img"
          aria-label={`Number line of ${element} oxidation states from +1 to +7, with the d electrons left and an example oxide or halide for each listed state. Group 6 comparison of the +6 state for ${group}, Mo and W.`}
        >
          <text x={8} y={36} className={styles.heading}>
            Oxidation state of {element}
          </text>
          <circle cx={318} cy={30} r={8} style={{ fill: tone }} />
          <text x={334} y={37} className={styles.muted}>
            common
          </text>
          <circle cx={422} cy={30} r={8} className={styles.hollow} style={{ stroke: tone }} />
          <text x={438} y={37} className={styles.muted}>
            listed, not bold
          </text>

          <line x1={X_FIRST - 40} y1={LINE_Y} x2={stateX(7) + 40} y2={LINE_Y} className={styles.axis} />
          {STATE_LINE.map((state) => (
            <text key={`t${state}`} x={stateX(state)} y={LINE_Y - 26} textAnchor="middle" className={styles.tick}>
              +{state}
            </text>
          ))}
          {rows.map((row) => (
            <StateMarker key={`m${row.state}`} row={row} tone={tone} />
          ))}

          <text x={8} y={LINE_Y + 46} className={styles.muted}>
            d left
          </text>
          <text x={8} y={LINE_Y + 84} className={styles.muted}>
            example
          </text>
          {rows.map((row) =>
            row.listed ? (
              <g key={`r${row.state}`}>
                <text x={stateX(row.state)} y={LINE_Y + 46} textAnchor="middle" className={styles.value}>
                  d{superscript(row.dLeft ?? 0)}
                </text>
                <text x={stateX(row.state)} y={LINE_Y + 84} textAnchor="middle" className={styles.value}>
                  {row.example ?? 'none'}
                </text>
              </g>
            ) : null
          )}

          <line x1={8} y1={222} x2={592} y2={222} className={styles.divider} />
          <text x={8} y={250} className={styles.muted}>
            Group 6: the +6 state, going down the group
          </text>
          {GROUP_6_METALS.map((symbol, index) => {
            const entry = group6Entry(symbol)
            const cx = 130 + index * 170
            const selected = symbol === group
            return (
              <g key={symbol} className={selected ? styles.cardOn : styles.card}>
                <rect x={cx - 78} y={262} width={156} height={130} rx={12} className={styles.frame} />
                <rect x={cx - 78} y={262} width={156} height={6} rx={3} style={{ fill: GROUP_TONE[symbol] }} />
                <text x={cx} y={298} textAnchor="middle" className={styles.symbol}>
                  {symbol}
                </text>
                <text x={cx} y={332} textAnchor="middle" className={styles.value}>
                  +{entry.state}
                </text>
                <text x={cx} y={364} textAnchor="middle" className={styles.value}>
                  {entry.species}
                </text>
                <text x={cx} y={382} textAnchor="middle" className={styles.muted}>
                  {entry.strongOxidant ? 'strong oxidant' : 'not a strong oxidant'}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className={styles.readout}>
        <p className={styles.lead}>{readout.lead}</p>
        {readout.halideKey ? <p className={styles.note}>In a halide formula, X stands for {readout.halideKey}.</p> : null}
        <p className={styles.note}>
          {groupEntry.symbol}: +{groupEntry.state} as {groupEntry.species}, {groupEntry.strongOxidant ? 'a strong oxidant in acid' : 'not a strong oxidant'}.
          Going down group 6 the +6 state becomes more stable.
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}

/** Unicode superscript digits for a non-negative count (d⁰ … d¹⁰). */
function superscript(n: number): string {
  const digits = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹']
  return String(n)
    .split('')
    .map((d) => digits[Number(d)])
    .join('')
}
