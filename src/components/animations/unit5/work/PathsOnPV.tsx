'use client'

import { PVDiagram } from '@/components/thermo'
import { Label, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { BAR_PER_ATM } from '@/lib/chem/pv-work'
import { nRTBar, processFor, pvPathAtm } from '@/lib/chem/isothermal-steps'
import { Symbolised } from './symbols'
import { PATH_STEP_COUNT, pathStep, percentOfReversible, signedJoule, signedLitreBar } from './work-steps'

export interface PathsOnPVProps {
  step: number
  reducedMotion: boolean
}

/**
 * One step, many steps and the reversible limit on the same p–V diagram. Each Step draws the
 * staircase for its step count, shades the area under it (the work), and gives w and its fraction
 * of the reversible maximum. The dashed curve is the isotherm, which the reversible path follows.
 */
export function PathsOnPV({ step, reducedMotion }: PathsOnPVProps) {
  const index = Math.min(PATH_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = pathStep(index)
  const expansion = processFor('expansion')
  const drawn = useReveal(index, reducedMotion)
  const points = pvPathAtm(expansion, current.steps, 1)
  const nRTAtm = nRTBar(expansion) / BAR_PER_ATM

  return (
    <svg
      viewBox="0 0 580 400"
      role="img"
      aria-label={`p–V diagram of an isothermal expansion. ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      <g transform="translate(36, 16) scale(1.3)">
        <PVDiagram
          series={[{ id: 'path', points, style: 'straight', tone: 'accent', label: current.label }]}
          shade="path"
          nRT={nRTAtm}
          progress={drawn}
          vMax={14}
          pMax={5.5}
          vTicks={[2, 4, 6, 8, 10, 12, 14]}
          pTicks={[1, 2, 3, 4, 5]}
          title="p–V diagram of an isothermal expansion from 6.00 L to 12.00 L"
        />
      </g>
      <Label x={290} y={364} fontSize={17} fill="var(--fg)" data-testid="paths-readout">
        <Symbolised text={`w = ${signedLitreBar(current.work)} = ${signedJoule(current.work)}`} />
      </Label>
      <Label x={290} y={388} fontSize={15} fill="var(--fg-muted)" data-testid="paths-fraction">
        {current.steps === 'reversible'
          ? 'The reversible maximum: 100% by definition'
          : `${percentOfReversible(current.fraction)} of the reversible maximum`}
      </Label>
    </svg>
  )
}
