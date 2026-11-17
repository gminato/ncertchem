'use client'

import { useProgress } from '@/lib/progress/useProgress'
import { sectionProgress } from '@/lib/progress/rules'
import { Tick } from './Tick'
import styles from './unit-progress.module.css'

export interface SectionRowStatusProps {
  slug: string
  checkNumbers: readonly string[]
}

/** The Progress status of one Section row on the Unit page. */
export function SectionRowStatus({ slug, checkNumbers }: SectionRowStatusProps) {
  const progress = useProgress()
  const { answered, total, complete } = sectionProgress(progress, { slug, checkNumbers })
  const state = complete ? 'complete' : answered > 0 ? 'started' : 'none'

  return (
    <span className={styles.rowStatus} data-testid="section-row-status" data-state={state}>
      {complete && (
        <>
          <Tick size={22} />
          <span className={styles.visuallyHidden}>Section complete</span>
        </>
      )}
      {state === 'started' && (
        <>
          <span className={styles.count}>
            {answered} of {total}
          </span>
          <span className={styles.visuallyHidden}> Checks answered</span>
        </>
      )}
    </span>
  )
}
