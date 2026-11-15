'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  interpolatePose,
  poseFromDomains,
  poseTo,
  type Domain,
  type Pose,
  type V3,
} from '@/lib/chem/vsepr-morph'

/** The arrangement a Step or a Learner setting asks for, with the view it is drawn from. */
export interface PoseTarget {
  domains: Domain[]
  right: V3
  up: V3
}

/** Seconds for one morph between two arrangements. */
export const MORPH_SECONDS = 0.9

/**
 * The pose for `target`, tweened from the picture as it is at the moment the target changes, so a
 * fast scroll never jumps back. Reduced motion cuts straight to the end state.
 */
export function usePoseTween(target: PoseTarget, reducedMotion: boolean): Pose {
  const [pose, setPose] = useState<Pose>(() => poseFromDomains(target.domains, target.right, target.up))
  const live = useRef<Pose>(pose)

  useEffect(() => {
    const from = live.current
    const to = poseTo(from, target.domains, target.right, target.up)

    if (reducedMotion) {
      // The redraw waits for the next GSAP tick, so no state update happens synchronously here.
      const cut = gsap.delayedCall(0, () => {
        live.current = to
        setPose(to)
      })
      return () => {
        cut.kill()
      }
    }

    const progress = { t: 0 }
    const tween = gsap.to(progress, {
      t: 1,
      duration: MORPH_SECONDS,
      ease: 'power2.inOut',
      onUpdate: () => {
        const next = interpolatePose(from, to, progress.t)
        live.current = next
        setPose(next)
      },
    })
    return () => {
      tween.kill()
    }
  }, [target, reducedMotion])

  return pose
}
