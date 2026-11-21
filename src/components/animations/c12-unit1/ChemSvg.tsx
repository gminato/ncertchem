'use client'

import { useEffect, useState, type ReactNode } from 'react'

/**
 * Compact SVG typography helpers for chemistry symbols (subscripts, superscripts)
 * and a gentle rAF phase clock for subtle living particle motion in Scrolly animations.
 */

export function Sub({ children }: { children: ReactNode }) {
  return (
    <tspan baselineShift="sub" fontSize="72%">
      {children}
    </tspan>
  )
}

export function Sup({ children }: { children: ReactNode }) {
  return (
    <tspan baselineShift="super" fontSize="72%">
      {children}
    </tspan>
  )
}

/**
 * Returns a smoothly advancing time in seconds while mounted and `!reducedMotion`.
 * Returns `0` immediately when `reducedMotion` is true so visuals stay completely still.
 * Caps frame delta to avoid jumps after tab switches.
 */
export function useAmbientTime(reducedMotion: boolean): number {
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let last: number | null = null
    let acc = 0
    const tick = (now: number) => {
      if (last !== null) {
        acc += Math.min(0.05, Math.max(0, (now - last) / 1000))
        setTime(acc)
      }
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  return reducedMotion ? 0 : time
}
