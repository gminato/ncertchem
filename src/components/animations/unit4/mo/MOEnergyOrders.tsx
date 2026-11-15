'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { MODiagram, MO_DIAGRAM_SIZE } from '@/components/molecule/MODiagram'
import { formatOrder } from '@/lib/chem/mo-builder'
import { LADDER_STEP_COUNT, ladderLevels, ladderTargetForStep } from './mo-visual-steps'
import styles from './mo.module.css'

export interface MOEnergyOrdersProps {
  step: number
  reducedMotion: boolean
}

const CAPTION_HEIGHT = 58

/**
 * MOEnergyOrders: the MO diagram for each homonuclear species in the NCERT ladder (H₂ to O₂).
 * Each Step fills the species with its electrons in the NCERT energy order, with the highest
 * occupied level outlined. The readouts are bond order and magnetism from the lib.
 */
export function MOEnergyOrders({ step, reducedMotion }: MOEnergyOrdersProps) {
  const target = ladderTargetForStep(step)
  const { levels, homo } = ladderLevels(target)
  const unpaired = levels.reduce((sum, l) => sum + l.unpaired, 0)
  const bondOrder = levels.filter((l) => l.bonding).reduce((s, l) => s + l.electrons, 0)
  const antibonding = levels.filter((l) => !l.bonding).reduce((s, l) => s + l.electrons, 0)
  const order = (bondOrder - antibonding) / 2
  const index = Math.round(Math.min(LADDER_STEP_COUNT - 1, Math.max(0, Number.isFinite(step) ? step : 0)))
  const orderText = `${target.mixing ? 'with 2s–2p mixing' : 'without 2s–2p mixing'}`

  return (
    <svg
      viewBox={`0 0 ${MO_DIAGRAM_SIZE.width} ${MO_DIAGRAM_SIZE.height + CAPTION_HEIGHT}`}
      className={styles.moSvg}
      role="img"
      aria-label={`MO diagram of ${target.formula}: ${target.electrons} electrons, bond order ${formatOrder(order)}, ${unpaired > 0 ? 'paramagnetic' : 'diamagnetic'}`}
      data-testid="mo-energy-orders"
      data-step={index}
      data-formula={target.formula}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <VocabDefs idPrefix="mo-energy" />
      <MODiagram
        levels={levels}
        mixing={target.mixing}
        highlight={homo ? [homo] : []}
        elementA={target.element}
        elementB={target.element}
        bondOrder={formatOrder(order)}
        magnetism={order === 0 ? '—' : unpaired > 0 ? 'Paramagnetic' : 'Diamagnetic'}
      />
      <Label x={MO_DIAGRAM_SIZE.width / 2} y={MO_DIAGRAM_SIZE.height + 18} fontSize={17} fill="var(--fg)">
        {target.formula}: {target.electrons} electrons, {orderText}
      </Label>
      <Label x={MO_DIAGRAM_SIZE.width / 2} y={MO_DIAGRAM_SIZE.height + 50} fontSize={14} fill="var(--fg-subtle)">
        Outlined: the highest occupied level. Filled in the NCERT order for this species.
      </Label>
    </svg>
  )
}
