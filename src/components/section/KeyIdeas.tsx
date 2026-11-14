import type { ReactNode } from 'react'
import styles from './blocks.module.css'

export interface KeyIdeasProps {
  children?: ReactNode
}

/** The closing revision summary of a Section. */
export function KeyIdeas({ children }: KeyIdeasProps) {
  return (
    <section className={styles.keyIdeas} aria-labelledby="key-ideas-heading">
      <h2 id="key-ideas-heading" className={styles.keyIdeasTitle}>
        Key ideas
      </h2>
      <div className={styles.keyIdeasBody}>{children}</div>
    </section>
  )
}
