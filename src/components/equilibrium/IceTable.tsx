import React, { forwardRef } from 'react'
import styles from './IceTable.module.css'
import { formatSci, trueMinus } from './geometry'

export type IceCell = number | string | React.ReactNode

export interface IceTableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Column headings: one per species. Use <span className="sym"> for symbols such as K. */
  species: readonly React.ReactNode[]
  /** Initial row (I). Numbers are formatted with a true minus and ×10ⁿ. */
  initial: readonly IceCell[]
  /** Change row (C). Strings such as "−x" are passed through with a true minus. */
  change: readonly IceCell[]
  /** Equilibrium row (E). */
  equilibrium: readonly IceCell[]
  /** Notes shown in a last column beside each row (for example the value of x). */
  rowNotes?: Partial<Record<'I' | 'C' | 'E', React.ReactNode>>
  /**
   * How many rows are revealed: 0 shows none, 1 shows I, 2 adds C, 3 adds E.
   * The newest row is highlighted. Rows not yet revealed are faded.
   */
  revealStep?: 0 | 1 | 2 | 3
  /** Accessible caption. */
  caption?: string
}

/** A number in plain or scientific form, with a true minus sign. Strings are returned as given. */
export function formatIceCell(value: IceCell): React.ReactNode {
  if (typeof value === 'number') {
    if (value === 0) return '0'
    const a = Math.abs(value)
    const plain = a >= 0.01 && a < 1000
    if (plain) return trueMinus(String(Number(value.toPrecision(3))))
    return formatSci(value, 2)
  }
  if (typeof value === 'string') return trueMinus(value)
  return value
}

const STEP = { I: 1, C: 2, E: 3 } as const

/**
 * An ICE (Initial, Change, Equilibrium) table. Rows reveal one by one with `revealStep`,
 * so the Learner follows the bookkeeping. Numbers use a true minus sign and ×10ⁿ.
 */
export const IceTable = forwardRef<HTMLDivElement, IceTableProps>(function IceTable(
  { species, initial, change, equilibrium, rowNotes, revealStep = 3, caption, className, ...rest },
  ref
) {
  const rows: Array<{ key: 'I' | 'C' | 'E'; label: string; cells: readonly IceCell[] }> = [
    { key: 'I', label: 'I', cells: initial },
    { key: 'C', label: 'C', cells: change },
    { key: 'E', label: 'E', cells: equilibrium },
  ]
  const showNotes = rowNotes !== undefined && Object.values(rowNotes).some((v) => v !== undefined)

  return (
    <div ref={ref} className={`${styles.wrap} ${className ?? ''}`.trim()} {...rest}>
      <table className={styles.table}>
        {caption && <caption style={{ captionSide: 'top', textAlign: 'left', fontSize: 15, color: 'var(--fg-muted)', paddingBottom: 8 }}>{caption}</caption>}
        <thead>
          <tr>
            <th scope="col" className={styles.rowHead} aria-label="Row" />
            {species.map((s, i) => (
              <th key={i} scope="col">
                {s}
              </th>
            ))}
            {showNotes && <th scope="col" />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const step = STEP[row.key]
            const state = revealStep >= step ? (revealStep === step ? 'active' : '') : 'hidden'
            const rowClass = [
              state === 'active' ? styles.active : '',
              state === 'hidden' ? styles.hidden : '',
              row.key === 'E' ? styles.equilibrium : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <tr key={row.key} className={rowClass}>
                <th scope="row" className={`${styles.rowHead} sym`}>
                  {row.label}
                </th>
                {row.cells.map((c, i) => (
                  <td key={i} className={styles.cell}>
                    {formatIceCell(c)}
                  </td>
                ))}
                {showNotes && (
                  <td className={styles.note}>{rowNotes?.[row.key] ?? ''}</td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})
