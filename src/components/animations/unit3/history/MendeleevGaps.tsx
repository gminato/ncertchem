'use client'

import { EKA_ALUMINIUM, EKA_SILICON } from '@/lib/chem/mendeleev'
import { PartialTable } from './PartialTable'
import { gapStep } from './history-steps'
import styles from './history.module.css'

export interface MendeleevGapsProps {
  step: number
  reducedMotion: boolean
}

/** Overlay text lines, placed beneath the partial table. */
function captionLines(step: number): string[] {
  switch (step) {
    case 0:
      return ['Only the elements known in 1869 are drawn.']
    case 1:
      return ['The dashed cells are gaps. Mendeleev named them', 'eka-aluminium and eka-silicon.']
    case 2:
      return [
        'Te (127.6) and I (126.9) are out of mass order.',
        'Mendeleev put I in group 17, with its halogen properties.',
      ]
    default:
      return [
        `${EKA_ALUMINIUM.name}: predicted mass ${EKA_ALUMINIUM.predicted.atomicMass}, density ${EKA_ALUMINIUM.predicted.density}.`,
        `${EKA_SILICON.name}: predicted mass ${EKA_SILICON.predicted.atomicMass}, density ${EKA_SILICON.predicted.density}.`,
      ]
  }
}

/**
 * Mendeleev's gaps on a partial table of the elements known in 1869. Step 1 outlines
 * the gaps for gallium and germanium, Step 2 swaps the tellurium and iodine pair, and
 * Step 3 writes his predictions beneath the table.
 */
export function MendeleevGaps({ step }: MendeleevGapsProps) {
  const s = gapStep(step)
  const lines = captionLines(Math.round(step))
  const TABLE_H = 16 + 5 * 40
  return (
    <PartialTable
      gapZ={s.gapZ}
      swapZ={s.swapZ}
      label="Partial periodic table of the elements known in 1869, with Mendeleev's gaps"
      dataTestId="mendeleev-gaps"
      height={TABLE_H + 80}
    >
      {lines.map((line, i) => (
        <text key={line} x={8} y={TABLE_H + 22 + i * 22} className={i === 0 ? styles.noteStrong : styles.note}>
          {line}
        </text>
      ))}
    </PartialTable>
  )
}
