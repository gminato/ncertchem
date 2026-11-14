'use client'

import { Children, isValidElement, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { animations, type AnimationName } from '@/components/animations/registry'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'
import { FitToBox } from './FitToBox'
import styles from './Scrolly.module.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const DESKTOP_QUERY = '(min-width: 960px)'
const NARROW_QUERY = '(max-width: 959.98px)'
/** Viewport fraction (from the top) where a Step counts as reached: 'top center' and 'top 60%'. */
const DESKTOP_LINE = 0.5
const NARROW_LINE = 0.6

export interface ScrollyProps {
  animation: AnimationName
  children?: ReactNode
  /**
   * 'side' (default): the visual is pinned beside the Steps on desktop.
   * 'wide': the visual is pinned full-width across the top and the Steps scroll
   * beneath it at every width. Use it for wide visuals such as the full
   * periodic table, which would be illegible in the side column.
   */
  layout?: 'side' | 'wide'
}

/**
 * Viewport fraction where a Step counts as reached in the 'wide' layout: as soon
 * as it rises into view below the ~60vh visual, so it is active while readable.
 */
const WIDE_LINE = 0.97

/**
 * A Scrolly Animation: Steps of Prose on one side, a pinned Animation on the other.
 * Scrolling through the Steps changes the active Step index, which the Animation
 * receives as its `step` prop. Desktop pins the visual beside the text; narrow
 * screens pin it to the top and let the text scroll underneath.
 */
export function Scrolly({ animation, children, layout = 'side' }: ScrollyProps) {
  const wide = layout === 'wide'
  const rootRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  const stepCount = Children.toArray(children).filter(isValidElement).length
  const Visual = animations[animation]

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      const steps = gsap.utils.toArray<HTMLElement>('[data-scrolly-step]', root)

      // The active Step is derived from positions, not from which trigger fired
      // last: a large scroll jump can fire several triggers in any order. The
      // active Step is the last one whose top has reached the trigger line.
      const narrowQuery = window.matchMedia(NARROW_QUERY)
      const syncActive = () => {
        const line = window.innerHeight * (wide ? WIDE_LINE : narrowQuery.matches ? NARROW_LINE : DESKTOP_LINE)
        let active = 0
        steps.forEach((el, index) => {
          if (el.getBoundingClientRect().top <= line) active = index
        })
        steps.forEach((el, index) => {
          el.setAttribute('data-active', index === active ? 'true' : 'false')
        })
        setStep(active)
      }
      syncActive()

      const mm = gsap.matchMedia()
      const configure = (start: string, end: string) =>
        steps.map((el) =>
          ScrollTrigger.create({
            trigger: el,
            start,
            end,
            onToggle: syncActive,
          })
        )

      if (wide) {
        // The visual covers the top ~60% of the view at every width, so a Step
        // becomes active as soon as it rises into the band beneath it.
        mm.add('all', () => {
          const triggers = configure('top 97%', 'bottom 97%')
          return () => triggers.forEach((t) => t.kill())
        })
      } else {
        mm.add(DESKTOP_QUERY, () => {
          const triggers = configure('top center', 'bottom center')
          return () => triggers.forEach((t) => t.kill())
        })
        mm.add(NARROW_QUERY, () => {
          // Narrow screens: the visual covers the top of the viewport, so a Step
          // becomes active once it has risen into the lower part of the view.
          const triggers = configure('top 60%', 'bottom 60%')
          return () => triggers.forEach((t) => t.kill())
        })
      }

      // Web fonts change the layout after the first measurement; re-measure once
      // they are ready so the Step trigger positions are current.
      let cancelled = false
      document.fonts?.ready.then(() => {
        if (!cancelled) ScrollTrigger.refresh()
      })

      return () => {
        cancelled = true
        mm.revert()
      }
    },
    { scope: rootRef, dependencies: [stepCount, wide] }
  )

  return (
    <div
      ref={rootRef}
      className={styles.scrolly}
      data-animation={animation}
      data-layout={layout}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <div className={styles.visual}>
        <div className={styles.visualPanel} data-testid="scrolly-visual">
          {wide ? (
            <FitToBox>
              <Visual step={step} reducedMotion={reducedMotion} />
            </FitToBox>
          ) : (
            <Visual step={step} reducedMotion={reducedMotion} />
          )}
        </div>
      </div>
      <div className={styles.steps}>{children}</div>
    </div>
  )
}
