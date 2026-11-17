'use client'

import { useProgress } from '@/lib/progress/useProgress'
import { unitProgress } from '@/lib/progress/rules'
import { Tick } from './Tick'
import styles from './unit-progress.module.css'

export interface UnitProgressLineProps {
  sections: readonly { slug: string; checkNumbers: readonly string[] }[]
}

/** The Progress line under a Unit title: how many of its Sections are complete. */
export function UnitProgressLine({ sections }: UnitProgressLineProps) {
  const progress = useProgress()
  const { complete, started, total } = unitProgress(progress, sections)
  const allComplete = total > 0 && complete === total

  if (allComplete) {
    return (
      <p className={`${styles.line} ${styles.lineComplete}`} data-testid="unit-progress">
        <Tick size={18} />
        <span>All {total} Sections complete</span>
      </p>
    )
  }

  return (
    <p className={styles.line} data-testid="unit-progress">
      {started > 0 && (
        <span>
          {complete} of {total} Sections complete
        </span>
      )}
    </p>
  )
}
