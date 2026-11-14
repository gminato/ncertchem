'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { PERIODIC_TABLE, tablePosition } from '@/lib/chem/periodic-data'
import type { ElementRecord } from '@/components/periodic/types'
import { PeriodicFrame } from './PeriodicFrame'
import {
  LONG_FORM_STEP_COUNT,
  clampStep,
  elementsThroughPeriod,
  longFormTarget,
  periodLength,
} from './modern-steps'
import styles from './modern.module.css'

export interface PeriodicLongFormProps {
  step: number
  reducedMotion: boolean
}

const PERIOD_LENGTHS = [1, 2, 3, 4, 5, 6, 7].map((p) => periodLength(p))

/** The caption that goes with each Step. Every number comes from PERIODIC_TABLE. */
function captionFor(step: number): string {
  const s = clampStep(step, LONG_FORM_STEP_COUNT)
  switch (s) {
    case 0:
      return 'The long form has seven periods, which are the rows, and 18 groups, which are the columns. The lanthanoids and actinoids sit in two rows below.'
    case 1:
      return `Period 1 holds ${PERIOD_LENGTHS[0]} elements and period 2 holds ${PERIOD_LENGTHS[1]}. Running total: ${elementsThroughPeriod(2)}.`
    case 2:
      return `Period 3 holds ${PERIOD_LENGTHS[2]} elements and period 4 holds ${PERIOD_LENGTHS[3]}. Running total: ${elementsThroughPeriod(4)}.`
    case 3:
      return `Period 5 holds ${PERIOD_LENGTHS[4]} elements. Period 6 holds ${PERIOD_LENGTHS[5]}: 18 in the main table and 14 lanthanoids below. Running total: ${elementsThroughPeriod(6)}.`
    case 4:
      return `Period 7 holds ${PERIOD_LENGTHS[6]}: 18 in the main table and 14 actinoids below. Running total: ${elementsThroughPeriod(7)}, the last element being Z = 118.`
    default:
      return 'Now the columns. Groups 1 to 18 use the IUPAC numbering from 1984. Group 18 holds the noble gases, and each group shares an outer configuration.'
  }
}

/**
 * PeriodicLongForm: the periodic table as a Scrolly visual. Periods light up in order, and the
 * running total of elements grows with them. The last Step sweeps across the 18 groups.
 * GSAP staggers the cells that light up, and reduced motion cuts straight to the target.
 */
export function PeriodicLongForm({ step, reducedMotion }: PeriodicLongFormProps) {
  const target = longFormTarget(step)
  const rootRef = useRef<HTMLDivElement>(null)
  const previous = useRef({ periodsLit: 0, groupsLit: 0 })

  useEffect(() => {
    const root = rootRef.current
    const before = previous.current
    previous.current = { periodsLit: target.periodsLit, groupsLit: target.groupsLit }
    if (!root || reducedMotion) return

    const cells = Array.from(root.querySelectorAll<SVGGElement>('g[data-z]'))
    const byZ = (a: SVGGElement, b: SVGGElement) => Number(a.dataset.z) - Number(b.dataset.z)

    if (target.groupsLit > before.groupsLit) {
      // Sweep the columns left to right: sort by group, then by Z within a group.
      const sorted = [...cells].sort((a, b) => {
        const ga = Number(a.dataset.group || 99)
        const gb = Number(b.dataset.group || 99)
        return ga !== gb ? ga - gb : byZ(a, b)
      })
      const tween = gsap.fromTo(
        sorted,
        { opacity: 0.2 },
        { opacity: 1, duration: 0.6, stagger: { amount: 1.4, ease: 'none' }, clearProps: 'opacity' }
      )
      return () => {
        tween.kill()
        gsap.set(cells, { clearProps: 'opacity' })
      }
    }

    // Newly lit periods fade up in Z order.
    const fresh = cells
      .filter((c) => {
        const p = Number(c.dataset.period)
        return p > before.periodsLit && p <= target.periodsLit
      })
      .sort(byZ)
    if (fresh.length === 0) return
    const tween = gsap.fromTo(
      fresh,
      { opacity: 0.2 },
      { opacity: 1, duration: 0.5, stagger: { amount: 0.9, ease: 'power1.out' }, clearProps: 'opacity' }
    )
    return () => {
      tween.kill()
      gsap.set(fresh, { clearProps: 'opacity' })
    }
  }, [target.periodsLit, target.groupsLit, reducedMotion])

  const cell = (el: ElementRecord) => {
    const lit = el.period <= target.periodsLit || target.groupsLit > 0
    return { dim: !lit }
  }

  return (
    <PeriodicFrame
      wrapperRef={rootRef}
      elements={PERIODIC_TABLE}
      position={tablePosition}
      cell={cell}
      title="Long-form periodic table, periods then groups"
    >
      <p className={styles.caption} aria-live="polite">
        {captionFor(step)}
      </p>
    </PeriodicFrame>
  )
}
