'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { OverlapDiagram } from '@/components/molecule'
import { useStepTween } from './useStepTween'
import { Symbolised } from './symbols'
import { OVERLAP_STEP_COUNT, overlapStepAt } from './vbt-steps'

export interface OverlapStepsProps {
  step: number
  reducedMotion: boolean
}

/**
 * Overlap pictures for Sections 4.5.3 to 4.5.4: a head-on σ overlap of s orbitals, p orbitals
 * with the same and with opposite signs, a side-on π overlap, and a right-angled pair with zero
 * net overlap. The lobes slide to their overlap distance with each Step.
 */
export function OverlapSteps({ step, reducedMotion }: OverlapStepsProps) {
  const index = Math.min(OVERLAP_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = overlapStepAt(index)
  const { s } = useStepTween({ s: current.separation }, reducedMotion)
  const isZero = current.phase === 'zero'
  const isPi = current.kind === 'pp-pi'
  const isNegative = current.phase === 'negative'
  const tag = isZero
    ? 'no bond: the lobes cancel, so the net overlap is zero'
    : isNegative
      ? 'no bond: opposite signs give an antibonding overlap'
      : isPi
        ? 'π bond: weaker, sideways'
        : 'σ bond: stronger, head on'

  return (
    <svg
      viewBox="0 0 600 384"
      role="img"
      aria-label={`Orbital overlap: ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      {/*
        The diagram's own net-sign badge sits 118 units right of its centre, so the scale is
        limited to keep that badge inside the panel. At 2.4 the lobes fill about 50 to 60% of
        the panel width, and the badge stays inside it.
      */}
      <g transform="translate(-90, -30) scale(2.4)">
        <OverlapDiagram kind={current.kind} phase={current.phase} separation={s} />
      </g>
      <Label x={300} y={322} fontSize={17} fill="var(--fg)" data-testid="overlap-caption">
        <Symbolised text={current.caption} />
      </Label>
      <Label x={300} y={352} fontSize={15} fill="var(--fg-muted)" data-testid="overlap-tag">
        <Symbolised text={tag} />
      </Label>
      <Label x={300} y={377} fontSize={14} fill="var(--fg-subtle)">
        Coral lobes are positive, teal negative. The dot marks each nucleus.
      </Label>
    </svg>
  )
}
