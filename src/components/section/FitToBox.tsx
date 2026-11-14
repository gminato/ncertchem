'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import styles from './Scrolly.module.css'

/**
 * Scales its content down uniformly so it fits inside the parent box, keeping
 * its aspect ratio and centring it. Used by the 'wide' Scrolly layout, whose
 * pinned panel has a fixed height that a tall visual (a table plus a legend)
 * would otherwise overflow. Never scales up.
 */
export function FitToBox({ children }: { children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const box = boxRef.current
    const content = contentRef.current
    if (!box || !content) return
    const measure = () => {
      // offsetHeight ignores transforms, so this is the natural height.
      const natural = content.offsetHeight
      const available = box.clientHeight
      if (natural === 0 || available === 0) return
      setScale(Math.min(1, available / natural))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={boxRef} className={styles.fitBox}>
      <div
        ref={contentRef}
        className={styles.fitContent}
        style={{ transform: scale < 1 ? `scale(${scale})` : undefined }}
        data-fit-scale={scale.toFixed(3)}
      >
        {children}
      </div>
    </div>
  )
}
