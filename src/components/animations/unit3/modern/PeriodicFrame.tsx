'use client'

import type { CSSProperties, ReactNode, Ref } from 'react'
import { PeriodicTable } from '@/components/periodic/PeriodicTable'
import type { PeriodicTableProps } from '@/components/periodic/PeriodicTable'
import { COLS, GUTTER_LEFT, GUTTER_TOP, PITCH, colLeft, rowTop, tableViewBox } from '@/components/periodic/layout'
import styles from './modern.module.css'

export interface PeriodicFrameProps extends Omit<PeriodicTableProps, 'variant' | 'showGroupNumbers' | 'showPeriodNumbers'> {
  /** Captions or overlays placed under the table, inside the same frame. */
  children?: ReactNode
  /** Passed to the wrapper so an Animation can find its cells and captions. */
  wrapperRef?: Ref<HTMLDivElement>
  style?: CSSProperties
}

/**
 * The compact periodic table with its group and period numbers drawn as HTML. The SVG
 * axis text is 11 units tall, which becomes about 6 px in a Scrolly panel, so the numbers
 * are set outside the SVG at a size a reader can use.
 */
export function PeriodicFrame({ children, wrapperRef, style, ...rest }: PeriodicFrameProps) {
  const { width, height } = tableViewBox()
  const groups = Array.from({ length: COLS }, (_, i) => i + 1)
  const periods = [1, 2, 3, 4, 5, 6, 7]
  return (
    <div ref={wrapperRef} className={styles.frame} style={style}>
      <div className={styles.tableBox}>
        <PeriodicTable {...rest} variant="compact" />
        {groups.map((g) => (
          <span
            key={`g${g}`}
            className={styles.groupLabel}
            style={{
              left: `${((GUTTER_LEFT + colLeft(g) + PITCH / 2) / width) * 100}%`,
              top: `${((GUTTER_TOP - 14) / height) * 100}%`,
            }}
          >
            {g}
          </span>
        ))}
        {periods.map((p) => (
          <span
            key={`p${p}`}
            className={styles.periodLabel}
            style={{
              left: `${((GUTTER_LEFT - 14) / width) * 100}%`,
              top: `${((GUTTER_TOP + rowTop(p) + PITCH / 2) / height) * 100}%`,
            }}
          >
            {p}
          </span>
        ))}
      </div>
      {children}
    </div>
  )
}
