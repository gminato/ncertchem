'use client'

import { AdditionMechanism, ADDITION_MECHANISM_SIZE } from '@/components/organic'
import { VocabDefs } from '@/components/vocab'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { markovnikovStep } from './markovnikov-steps'

/** The drawing's content sits between these units of its 900 × 290 box; the rest is empty margin. */
const VIEW_TOP = 50
const VIEW_HEIGHT = 210

export interface MarkovnikovProps {
  step: number
  reducedMotion: boolean
}

/**
 * The Markovnikov Scrolly: propene and HBr drawn by the AdditionMechanism. Ionic steps show the H⁺
 * attack, the 2° carbocation that leads to 2-bromopropane, the 1° carbocation that does not, and the
 * product. The last step is the peroxide (free-radical) route to 1-bromopropane.
 */
export function Markovnikov({ step, reducedMotion }: MarkovnikovProps) {
  const target = markovnikovStep(step)
  const { progress } = useStepTween({ progress: target.progress }, reducedMotion)
  const { width } = ADDITION_MECHANISM_SIZE

  return (
    <svg
      viewBox={`0 ${VIEW_TOP} ${width} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Addition of HBr to propene, ${target.mode === 'radical' ? 'by the free-radical route' : `${target.branch === 'major' ? 'major' : 'minor'} carbocation route`}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={Math.min(4, Math.max(0, Math.round(step)))}
      data-testid="markovnikov-visual"
    >
      <VocabDefs />
      <AdditionMechanism
        mode={target.mode}
        branch={target.branch}
        step={target.step}
        progress={progress}
      />
    </svg>
  )
}
