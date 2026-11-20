'use client'

import { sectionProgress } from '@/lib/progress/rules'
import { useProgress } from '@/lib/progress/useProgress'
import { Tick } from './Tick'
import styles from './SectionStatus.module.css'

export interface SectionStatusProps {
  /** The Section's slug, which its Checks are recorded under. */
  slug: string
  /** The numbers of the Checks the Section holds now. */
  checkNumbers: readonly string[]
}

/**
 * How far the Learner has got through the Checks of a Section, shown at its end. A Complete
 * Section gets a success pill with a tick. The first render has no Progress, so it always shows
 * the count, and both states are the same height, so the pager below does not move.
 */
export function SectionStatus({ slug, checkNumbers }: SectionStatusProps) {
  const progress = useProgress()
  const { answered, total, complete } = sectionProgress(progress, { slug, checkNumbers })
  if (total === 0) return null

  const noun = total === 1 ? 'Check' : 'Checks'
  return (
    <div className={styles.wrap}>
      <div
        role="status"
        aria-live="polite"
        data-testid="section-status"
        data-complete={complete ? 'true' : 'false'}
        className={`${styles.pill} ${complete ? styles.complete : styles.neutral}`}
      >
        {complete ? (
          <>
            <Tick size={20} className={styles.tick} />
            <span>Section complete</span>
          </>
        ) : (
          <span>
            {answered} of {total} {noun} answered
          </span>
        )}
      </div>
    </div>
  )
}
