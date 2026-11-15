'use client'

import { ProjectedPose } from './ProjectedPose'
import { usePoseTween } from './usePoseTween'
import { REPULSION_PX, repulsionStep } from './vsepr-steps'

export interface VseprRepulsionProps {
  step: number
  reducedMotion: boolean
}

/**
 * Electron pairs repel and spread to the maximum separation. Step 0 bunches four pairs together;
 * the later Steps show the five base arrangements of Table 4.6, each drawn in 2D.
 */
export function VseprRepulsion({ step, reducedMotion }: VseprRepulsionProps) {
  const current = repulsionStep(step)
  const pose = usePoseTween(current.target, reducedMotion)
  const index = Math.min(5, Math.max(0, Math.round(step)))

  return (
    <ProjectedPose
      pose={pose}
      px={REPULSION_PX}
      centre={current.centre}
      ligand="F"
      arcLabel={current.arcLabel}
      label="Electron pairs around a central atom, shown spreading to the maximum separation"
      caption={current.caption}
      testId="vsepr-repulsion"
      step={index}
      defsPrefix="vsepr-rep"
    />
  )
}
