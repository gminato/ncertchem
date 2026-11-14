import type { ReactNode } from 'react'
import styles from './Scrolly.module.css'

export interface StepProps {
  children?: ReactNode
}

/**
 * One Step of a Scrolly Animation: a passage of Prose that is tied to a single
 * animation state. Scrolly marks the active Step through `data-active`.
 */
export function Step({ children }: StepProps) {
  return (
    <div className={styles.step} data-scrolly-step="">
      <div className={styles.stepText}>{children}</div>
    </div>
  )
}
