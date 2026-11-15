'use client'

import { PistonCylinder, pistonGasFraction } from '@/components/thermo'
import { Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { BAR_PER_ATM } from '@/lib/chem/pv-work'
import { Symbolised } from './symbols'
import { CYLINDER_FULL_L, PISTON_DEMO, PISTON_STEP_COUNT, pistonStep } from './work-steps'

export interface PistonWorkProps {
  step: number
  reducedMotion: boolean
}

/** Cylinder geometry in SVG units, matching the PistonCylinder defaults for travel and piston height. */
const CYL = { x: 170, base: 330, width: 120, height: 250 }
const PISTON_H = 10
const TRAVEL = CYL.height - PISTON_H - 2

/** SVG y of the piston's lower face for a gas volume, as PistonCylinder draws it. */
function pistonY(volumeL: number): number {
  return CYL.base - pistonGasFraction(volumeL / CYLINDER_FULL_L) * TRAVEL
}

/**
 * The piston Scrolly: a gas cylinder under a weight. The piston rises by ΔV as the Steps advance,
 * and the working line shows w = −p_ex ΔV in L bar and J. The weight is drawn as whole units of
 * pressure, one per atm, so a 2.00 bar weight is two plates.
 */
export function PistonWork({ step, reducedMotion }: PistonWorkProps) {
  const index = Math.min(PISTON_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = pistonStep(index)
  const { v } = useStepTween({ v: current.volumeL }, reducedMotion)
  const plates = Math.round(current.pExtBar / BAR_PER_ATM)
  const startY = pistonY(PISTON_DEMO.startL)
  const nowY = pistonY(v)
  const showMove = index === 1 || index === 2
  const dimX = CYL.x + CYL.width / 2 + 40

  return (
    <svg
      viewBox="0 0 580 400"
      role="img"
      aria-label={`Gas in a cylinder under a weight. ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      <PistonCylinder
        x={CYL.x}
        y={CYL.base}
        width={CYL.width}
        height={CYL.height}
        volume={v / CYLINDER_FULL_L}
        externalPressure={plates}
        particles={18}
        seed={9}
      />

      {/* Reference line at the start volume, and a dimension for ΔV while the piston moves */}
      <line x1={CYL.x - CYL.width / 2 - 14} x2={CYL.x + CYL.width / 2 + 14} y1={startY} y2={startY} strokeWidth={1.2} strokeDasharray="4 4" style={{ stroke: 'var(--fg-subtle)' }} />
      {showMove && (
        <g data-testid="piston-dv">
          <line x1={dimX} x2={dimX} y1={startY} y2={nowY} strokeWidth={2} style={{ stroke: 'var(--work)' }} />
          <line x1={dimX - 6} x2={dimX + 6} y1={startY} y2={startY} strokeWidth={2} style={{ stroke: 'var(--work)' }} />
          <line x1={dimX - 6} x2={dimX + 6} y1={nowY} y2={nowY} strokeWidth={2} style={{ stroke: 'var(--work)' }} />
          <Label x={dimX + 16} y={(startY + nowY) / 2} textAnchor="start" fontSize={16} fill="var(--work)">
            <Symbolised text="ΔV = 3.00 L" />
          </Label>
        </g>
      )}

      {/* Labels: the external pressure beside the weights, the volume beside the gas */}
      <Label x={CYL.x + CYL.width / 2 + 40} y={CYL.base - CYL.height - 6} textAnchor="start" fontSize={16} fill="var(--fg)" data-testid="piston-pext">
        <Symbolised text={`p_ex = ${PISTON_DEMO.pExtBar.toFixed(2)} bar`} />
      </Label>
      <Label x={CYL.x - CYL.width / 2 - 16} y={(nowY + CYL.base) / 2} textAnchor="end" fontSize={16} fill="var(--fg)">
        <Symbolised text="gas" />
      </Label>

      <Label x={290} y={352} fontSize={18} fill="var(--fg)" data-testid="piston-working">
        <Symbolised text={current.working} />
      </Label>
      <Label x={290} y={380} fontSize={15} fill="var(--fg-muted)">
        {index === 2 ? 'Work done on the gas is positive, and work done by the gas is negative.' : 'Expansion gives negative w; compression gives positive w.'}
      </Label>
    </svg>
  )
}
