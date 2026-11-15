'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { MODiagram, MO_DIAGRAM_SIZE } from '@/components/molecule/MODiagram'
import { formatOrder } from '@/lib/chem/mo-builder'
import { O2_FILL_STEP_COUNT, o2Levels, o2TargetForStep } from './mo-visual-steps'
import styles from './mo.module.css'

export interface MOO2FillingProps {
  step: number
  reducedMotion: boolean
}

const CAPTION_HEIGHT = 58

/**
 * MOO2Filling: O₂ with 16 electrons in the unmixed order. The Steps place the electrons in
 * their levels until the last two sit alone in the two π*2p orbitals. The final Step sets
 * that against the Lewis picture, in which every electron is paired.
 */
export function MOO2Filling({ step, reducedMotion }: MOO2FillingProps) {
  const target = o2TargetForStep(step)
  const levels = o2Levels(step)
  const unpaired = levels.reduce((sum, l) => sum + l.unpaired, 0)
  const bondingCount = levels.filter((l) => l.bonding).reduce((s, l) => s + l.electrons, 0)
  const antibondingCount = levels.filter((l) => !l.bonding).reduce((s, l) => s + l.electrons, 0)
  const order = (bondingCount - antibondingCount) / 2
  const isFinal = step >= O2_FILL_STEP_COUNT - 1
  const highlight = isFinal || target.placed === 16 ? ['π*2p'] : []

  return (
    <svg
      viewBox={`0 0 ${MO_DIAGRAM_SIZE.width} ${MO_DIAGRAM_SIZE.height + CAPTION_HEIGHT}`}
      className={styles.moSvg}
      role="img"
      aria-label={`O₂ MO diagram with ${target.placed} electrons placed: bond order ${formatOrder(order)}, ${unpaired} unpaired electrons`}
      data-testid="mo-o2-filling"
      data-step={Math.round(step)}
      data-placed={target.placed}
      data-unpaired={unpaired}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <VocabDefs idPrefix="mo-o2" />
      <MODiagram
        levels={levels}
        mixing={false}
        highlight={highlight}
        elementA="O"
        elementB="O"
        bondOrder={formatOrder(order)}
        magnetism={unpaired > 0 ? `Paramagnetic (${unpaired} unpaired)` : 'Diamagnetic'}
      />
      <Label x={MO_DIAGRAM_SIZE.width / 2} y={MO_DIAGRAM_SIZE.height + 18} fontSize={17} fill="var(--fg)">
        {`${target.placed} of 16 electrons placed`}
      </Label>
      <Label x={MO_DIAGRAM_SIZE.width / 2} y={MO_DIAGRAM_SIZE.height + 50} fontSize={14} fill="var(--fg-subtle)">
        Unmixed order: σ2p lies below π2p. The π*2p pair is outlined.
      </Label>
    </svg>
  )
}
