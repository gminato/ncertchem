'use client'

import dynamic from 'next/dynamic'
import type { Stage3DProps } from './Stage3D'
import styles from './Stage3D.module.css'

/**
 * Loads the three.js stage only in the browser, so the pages that show it stay
 * static. The placeholder keeps the card's height while the chunk arrives.
 */
const Stage3DImpl = dynamic(() => import('./Stage3D').then((mod) => mod.Stage3D), {
  ssr: false,
  loading: () => <div className={styles.loading} aria-hidden="true" />,
})

export function Stage3DLazy(props: Stage3DProps) {
  return <Stage3DImpl {...props} />
}
