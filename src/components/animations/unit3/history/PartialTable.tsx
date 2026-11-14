import type { ReactNode } from 'react'
import { PERIODIC_TABLE } from '@/lib/chem/periodic-data'
import { KNOWN_IN_1869 } from '@/lib/chem/mendeleev'
import styles from './history.module.css'

/**
 * A partial periodic table in Mendeleev's period-by-group layout: periods 1 to 5 and
 * groups 1 to 17 in the modern long form. The full PeriodicTable draws every cell far
 * too small for a Scrolly panel, so this compact grid shows only what Mendeleev could
 * have placed in 1869. Noble gases (group 18) are left out, as they were not in his table.
 */

export const PARTIAL_ROWS = 5
export const PARTIAL_COLS = 17
const PITCH_X = 33.5
const PITCH_Y = 40
const CELL_W = 30
const CELL_H = 32
const LEFT = 8
const TOP = 16

/** Centre of a cell in the SVG, for a 1-based period and group. */
export function cellCentre(period: number, group: number): { x: number; y: number } {
  return {
    x: LEFT + (group - 1) * PITCH_X + CELL_W / 2,
    y: TOP + (period - 1) * PITCH_Y + CELL_H / 2,
  }
}

export interface PartialTableProps {
  /** Atomic numbers outlined as gaps (unknown in 1869, to be predicted). */
  gapZ?: readonly number[]
  /** Atomic numbers highlighted as the focus of the Step or Simulation. */
  focusZ?: readonly number[]
  /** Atomic numbers drawn with the swap accent. */
  swapZ?: readonly number[]
  /** Small text drawn beneath a cell, keyed by atomic number. */
  captions?: Readonly<Record<number, string>>
  /** Extra overlay in SVG coordinates (arrows, notes). */
  children?: ReactNode
  height?: number
  label: string
  dataTestId?: string
}

export function PartialTable({
  gapZ = [],
  focusZ = [],
  swapZ = [],
  captions = {},
  children,
  height = PARTIAL_ROWS * PITCH_Y + TOP + 8,
  label,
  dataTestId,
}: PartialTableProps) {
  const width = LEFT * 2 + (PARTIAL_COLS - 1) * PITCH_X + CELL_W
  const gaps = new Set(gapZ)
  const focus = new Set(focusZ)
  const swap = new Set(swapZ)
  const cells = PERIODIC_TABLE.filter(
    (el) => el.fBlockRow === null && el.period <= PARTIAL_ROWS && el.group !== null && el.group <= PARTIAL_COLS
  )

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={styles.partial}
      role="img"
      aria-label={label}
      data-testid={dataTestId}
    >
      {cells.map((el) => {
        const { x, y } = cellCentre(el.period, el.group as number)
        const known = KNOWN_IN_1869.has(el.Z)
        const isFocus = focus.has(el.Z)
        const isSwap = swap.has(el.Z)
        const isGap = gaps.has(el.Z)
        if (!known && !isGap) return null
        const className = isGap
          ? styles.cellGap
          : isSwap
            ? styles.cellSwap
            : isFocus
              ? styles.cellFocus
              : styles.cellKnown
        return (
          <g key={el.Z} data-z={el.Z} data-state={isGap ? 'gap' : 'known'}>
            <rect
              x={x - CELL_W / 2}
              y={y - CELL_H / 2}
              width={CELL_W}
              height={CELL_H}
              rx={5}
              className={className}
            />
            {!isGap && (
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className={styles.symbolText}>
                {el.symbol}
              </text>
            )}
            {isGap && (
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" className={styles.gapMark}>
                ?
              </text>
            )}
            {captions[el.Z] && (
              <text x={x} y={y + CELL_H / 2 + 14} textAnchor="middle" className={styles.caption}>
                {captions[el.Z]}
              </text>
            )}
          </g>
        )
      })}
      {children}
    </svg>
  )
}
