'use client'

import type { ReactNode } from 'react'
import { unitProgress, type SectionChecks } from '@/lib/progress/rules'
import { useProgress } from '@/lib/progress/useProgress'
import styles from './landing-progress.module.css'

export interface UnitCardProgressProps {
  /** The Sections of one Unit. */
  sections: readonly SectionChecks[]
  /** The meta line's class on the Unit card, so the line keeps its place and size. */
  className: string
  /** The meta text shown when no Section of the Unit has been started. */
  children: ReactNode
}

/**
 * The meta line of a Unit card on the Syllabus Map. Until a Section is started it is the plain
 * meta text. Once one is, the line reads the Learner's Progress, and a strip along the bottom edge
 * of the card shows how many Sections are complete. The strip is absolutely placed, so the card
 * keeps the same height with or without Progress.
 */
export function UnitCardProgress({ sections, className, children }: UnitCardProgressProps) {
  const progress = useProgress()
  const { complete, started, total } = unitProgress(progress, sections)

  if (started === 0) return <span className={className}>{children}</span>

  const allComplete = complete === total
  const percent = total === 0 ? 0 : (complete / total) * 100

  return (
    <span className={className} data-testid="unit-card-progress">
      {allComplete ? (
        <span className={styles.complete}>All {total} Sections complete</span>
      ) : (
        <>{complete} of {total} Sections complete</>
      )}
      <span className={styles.track} aria-hidden="true">
        <span
          className={styles.fill}
          data-testid="unit-card-progress-fill"
          style={{ width: `${percent}%` }}
        />
      </span>
    </span>
  )
}
