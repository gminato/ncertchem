'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/** Clamps a Step index to 0..count-1, rounding and treating non-finite values as 0. */
export function clampStepIndex(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

export interface StepStateOptions<S> {
  step: number
  stepCount: number
  reducedMotion: boolean
  /** The target state of a Step. Must be a plain object of numbers. */
  snapshot: (step: number) => S
  /**
   * Builds the tween that takes the live state to the target of `step`. It starts
   * from whatever the state is now, so scrolling in either direction lands on the
   * same picture. `onFrame` redraws the view.
   */
  build: (step: number, state: S, prevStep: number | null, onFrame: () => void) => gsap.core.Timeline
}

/**
 * Keeps a mutable state object that GSAP tweens between Step targets, and returns a
 * React copy of it for rendering. Under reduced motion the state is cut straight to
 * the Step's end state. This is the same pattern as BohrEmission, generalised.
 */
export function useStepState<S extends object>({
  step,
  stepCount,
  reducedMotion,
  snapshot,
  build,
}: StepStateOptions<S>): S {
  const active = clampStepIndex(step, stepCount)
  const [state] = useState<S>(() => ({ ...snapshot(active) }))
  const [view, setView] = useState<S>(() => ({ ...state }))
  const prevStep = useRef<number | null>(null)

  useEffect(() => {
    const render = () => setView({ ...state })

    if (reducedMotion) {
      // Cut straight to the Step's end state. The redraw is deferred to the next
      // GSAP tick so that no state update happens synchronously inside the effect.
      Object.assign(state, snapshot(active))
      prevStep.current = active
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }

    const tl = build(active, state, prevStep.current, render)
    prevStep.current = active
    return () => {
      tl.kill()
    }
    // `state` is stable for the component lifetime. Callers pass module-level
    // snapshot and build functions, so only the Step and the motion preference re-run this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reducedMotion])

  return view
}
