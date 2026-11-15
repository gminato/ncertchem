'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { OverlapDiagram, PotentialEnergyCurve, H2_MORSE } from '@/components/molecule'
import { useStepTween } from './useStepTween'
import { H2_STEP_DISTANCES_PM, clampIndex, h2EnergyAt, h2OverlapSeparation, h2StepTarget } from './vbt-steps'

export interface H2PotentialCurveProps {
  step: number
  reducedMotion: boolean
}

/** Step captions, one per Step. Written for the picture, not copied from the Prose. */
const CAPTIONS = [
  'Far apart: no interaction',
  'Closer: attraction wins, energy falls',
  'Minimum: the bond forms at 74 pm',
  'Too close: nuclei repel, energy rises steeply',
] as const

/** A signed number with a true minus sign (U+2212), to one decimal place. */
function signedOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return rounded < 0 ? `−${Math.abs(rounded).toFixed(1)}` : rounded.toFixed(1)
}

/**
 * The H–H potential energy curve with the two 1s orbitals drawn beside it. As the Steps advance
 * the atoms move in from 240 pm to the 74 pm minimum, then to 40 pm, where the energy rises
 * steeply because the nuclei repel. The overlap picture tracks the same distance.
 */
export function H2PotentialCurve({ step, reducedMotion }: H2PotentialCurveProps) {
  const index = clampIndex(step, H2_STEP_DISTANCES_PM.length)
  const target = h2StepTarget(index)
  const { r } = useStepTween(target, reducedMotion)
  const separation = h2OverlapSeparation(r)
  const energy = h2EnergyAt(r)

  return (
    <svg viewBox="0 0 660 288" role="img" aria-label="Potential energy against distance for two hydrogen atoms, beside their overlapping 1s orbitals" style={{ width: '100%', height: 'auto', display: 'block' }} data-step={index}>
      <VocabDefs />
      <Label x={160} y={16} fontSize={15} fill="var(--fg)">
        1<tspan className="sym">s</tspan> + 1<tspan className="sym">s</tspan> overlap
      </Label>
      <g transform="translate(10, 30)">
        <OverlapDiagram kind="ss" phase="positive" separation={separation} showRegions={false} />
      </g>
      <Label x={160} y={248} fontSize={14} fill="var(--fg)" data-testid="h2-caption">
        {CAPTIONS[index]}
      </Label>
      <g transform="translate(300, 10)">
        <PotentialEnergyCurve distance={r} params={H2_MORSE} />
      </g>
      <Label x={160} y={278} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" data-testid="h2-readout">
        <tspan className="sym">r</tspan> = {Math.round(r)} pm, <tspan className="sym">E</tspan> = {signedOneDecimal(energy)} kJ mol⁻¹
      </Label>
    </svg>
  )
}
