import type { ReactNode } from 'react'
import styles from './blocks.module.css'

export interface HookProps {
  children?: ReactNode
}

/** The opening question or puzzling observation of a Section. */
export function Hook({ children }: HookProps) {
  return <aside className={styles.hook}>{children}</aside>
}
