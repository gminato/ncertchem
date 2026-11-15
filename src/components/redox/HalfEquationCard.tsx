import React from 'react'
import { formatTrueMinus, formatSignedNumber } from './geometry'
import styles from './redox.module.css'

export interface TallyItem {
  item: string
  left: number
  right: number
}

export interface HalfReactionData {
  title?: string
  equation: React.ReactNode
  electrons: number
  tally: readonly TallyItem[]
  multiplier?: number
}

export interface HalfEquationCardProps {
  oxHalf: HalfReactionData
  redHalf: HalfReactionData
  title?: string
  overallEquation?: React.ReactNode
  className?: string
}

function renderTallyValue(item: string, val: number): string {
  if (item.toLowerCase() === 'charge') {
    return formatSignedNumber(val)
  }
  return `${val}`
}

function HalfRowView({
  tone,
  data,
}: {
  tone: 'ox' | 'red'
  data: HalfReactionData
}) {
  const isOx = tone === 'ox'
  const rowClass = isOx ? styles.halfRowOx : styles.halfRowRed
  const toneClass = isOx ? styles.toneOx : styles.toneRed
  const chipToneClass = isOx ? styles.chipOx : styles.chipRed

  return (
    <div className={`${styles.halfRow} ${rowClass}`}>
      {/* Header */}
      <div className={styles.rowHeader}>
        <div className={styles.rowTitleGroup}>
          <span className={`${styles.rowToneBadge} ${toneClass}`}>
            {data.title ?? (isOx ? 'Oxidation half' : 'Reduction half')}
          </span>
        </div>

        <div className={styles.chipsGroup}>
          {data.multiplier !== undefined && data.multiplier > 1 && (
            <span className={styles.multiplierChip}>× {data.multiplier}</span>
          )}
          <span className={`${styles.electronChip} ${chipToneClass}`}>
            {data.electrons}{' '}
            <span className="sym">e</span>
            <sup style={{ fontSize: '0.75em' }}>−</sup>
          </span>
        </div>
      </div>

      {/* Equation */}
      <div className={styles.equation}>{data.equation}</div>

      {/* Atom & Charge Tally */}
      <table className={styles.tallyTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Left</th>
            <th>Right</th>
            <th className={styles.matchCell}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {data.tally.map((t, idx) => {
            const matches = t.left === t.right
            return (
              <tr key={idx}>
                <td className={styles.tallyElement}>{t.item}</td>
                <td className={styles.tallyNumber}>
                  {renderTallyValue(t.item, t.left)}
                </td>
                <td className={styles.tallyNumber}>
                  {renderTallyValue(t.item, t.right)}
                </td>
                <td className={styles.matchCell}>
                  {matches ? (
                    <span className={styles.matchBadge}>✓ Balanced</span>
                  ) : (
                    <span className={styles.mismatchBadge}>
                      {formatTrueMinus('≠ Unbalanced')}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function HalfEquationCard({
  oxHalf,
  redHalf,
  title = 'Ion-electron half-reaction method',
  overallEquation,
  className,
}: HalfEquationCardProps) {
  // Check if both halves are balanced
  const allBalanced =
    oxHalf.tally.every((t) => t.left === t.right) &&
    redHalf.tally.every((t) => t.left === t.right) &&
    (oxHalf.multiplier ? oxHalf.electrons * oxHalf.multiplier : oxHalf.electrons) ===
      (redHalf.multiplier ? redHalf.electrons * redHalf.multiplier : redHalf.electrons)

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>{title}</span>
        <span
          className={`${styles.statusChip} ${
            allBalanced ? styles.statusChipBalanced : ''
          }`}
        >
          {allBalanced ? 'Balanced' : 'Balancing in progress'}
        </span>
      </div>

      <div className={styles.rowsContainer}>
        <HalfRowView tone="ox" data={oxHalf} />
        <HalfRowView tone="red" data={redHalf} />
      </div>

      {overallEquation && (
        <div className={styles.overallRow}>
          <span className={styles.overallLabel}>Net ionic equation:</span>
          <div className={styles.overallEquation}>{overallEquation}</div>
        </div>
      )}
    </div>
  )
}
