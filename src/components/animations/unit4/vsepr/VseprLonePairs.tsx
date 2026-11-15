'use client'

import { useMemo } from 'react'
import { ProjectedPose } from './ProjectedPose'
import { usePoseTween } from './usePoseTween'
import { LONE_PAIR_PX, LONE_PAIR_STEPS, lonePairStep, lonePairTarget } from './vsepr-steps'

export interface VseprLonePairsProps {
  step: number
  reducedMotion: boolean
}

/**
 * CH₄, then NH₃ with one lone pair, then the same NH₃ with its bond angle squeezed, then H₂O.
 * A lone pair takes the place of a bonded atom, and the two bonds closest to it move together.
 */
export function VseprLonePairs({ step, reducedMotion }: VseprLonePairsProps) {
  const index = Math.min(LONE_PAIR_STEPS.length - 1, Math.max(0, Math.round(step)))
  const target = useMemo(() => lonePairTarget(index), [index])
  const pose = usePoseTween(target, reducedMotion)
  const current = lonePairStep(index)

  return (
    <ProjectedPose
      pose={pose}
      px={LONE_PAIR_PX}
      centre={current.centre}
      ligand="H"
      arcLabel={current.arcLabel}
      label="A central atom with bonded atoms and lone-pair lobes, with the bond angle marked"
      caption={current.caption}
      testId="vsepr-lone-pairs"
      step={index}
      defsPrefix="vsepr-lp"
    />
  )
}
