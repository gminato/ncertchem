'use client'

import { useEffect, useState, type RefObject } from 'react'

/**
 * True while the element is on screen and the tab is visible. Simulations that
 * run a requestAnimationFrame loop should pause when this is false.
 */
export function useIsActive(ref: RefObject<Element | null>): boolean {
  const [onScreen, setOnScreen] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      setOnScreen(entry.isIntersecting)
    })
    observer.observe(el)

    const onVisibilityChange = () => {
      setTabVisible(document.visibilityState === 'visible')
    }
    onVisibilityChange()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [ref])

  return onScreen && tabVisible
}
