'use client'

import { PistonCylinder } from '@/components/thermo'
import { Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { Symbolised } from './symbols'
import { WeightBlock, pistonTopY, type CylinderGeometry } from './cylinder'
import { CYLINDER_FULL_L, PISTON_DEMO, PISTON_STEP_COUNT, pistonStep } from './work-steps'

export interface PistonWorkProps {
  step: number
  reducedMotion: boolean
}

/**
 * The cylinder is drawn large, so it and its labels fill about 60% of the panel width. The weight
 * is drawn in proportion to p_ex (see WeightBlock), so 2.00 bar is twice the height of 1.00 bar.
 */
const GEO: CylinderGeometry = { x: 200, base: 372, width: 150, height: 300, fullL: CYLINDER_FULL_L }
const DIM_X = GEO.x + GEO.width / 2 + 40

/**
 * The piston Scrolly: a gas cylinder under a weight. The piston rises by ΔV as the Steps advance,
 * and the working line shows w = −p_ex ΔV in L bar and J.
 */
export function PistonWork({ step, reducedMotion }: PistonWorkProps) {
  const index = Math.min(PISTON_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = pistonStep(index)
  const { v } = useStepTween({ v: current.volumeL }, reducedMotion)
  const startY = pistonTopY(GEO, PISTON_DEMO.startL)
  const nowY = pistonTopY(GEO, v)
  const showMove = index === 1 || index === 2

  return (
    <svg
      viewBox="0 0 580 440"
      role="img"
      aria-label={`Gas in a cylinder under a weight. ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      <PistonCylinder
        x={GEO.x}
        y={GEO.base}
        width={GEO.width}
        height={GEO.height}
        volume={v / GEO.fullL}
        externalPressure={0}
        particles={22}
        seed={9}
      />
      <WeightBlock geo={GEO} volumeL={v} pBar={current.pExtBar} />

      {/* Reference line at the start volume, and a dimension for ΔV while the piston moves */}
      <line x1={GEO.x - GEO.width / 2 - 16} x2={GEO.x + GEO.width / 2 + 16} y1={startY} y2={startY} strokeWidth={1.2} strokeDasharray="4 4" style={{ stroke: 'var(--fg-subtle)' }} />
      {showMove && (
        <g data-testid="piston-dv">
          <line x1={DIM_X} x2={DIM_X} y1={startY} y2={nowY} strokeWidth={2.2} style={{ stroke: 'var(--work)' }} />
          <line x1={DIM_X - 7} x2={DIM_X + 7} y1={startY} y2={startY} strokeWidth={2.2} style={{ stroke: 'var(--work)' }} />
          <line x1={DIM_X - 7} x2={DIM_X + 7} y1={nowY} y2={nowY} strokeWidth={2.2} style={{ stroke: 'var(--work)' }} />
          <Label x={DIM_X + 16} y={(startY + nowY) / 2} textAnchor="start" fontSize={18} fill="var(--work)">
            <Symbolised text="ΔV = 3.00 L" />
          </Label>
        </g>
      )}

      <Label x={GEO.x + GEO.width / 2 + 16} y={GEO.base - GEO.height + 14} textAnchor="start" fontSize={18} fill="var(--fg)" data-testid="piston-pext">
        <Symbolised text={`p_ex = ${PISTON_DEMO.pExtBar.toFixed(2)} bar`} />
      </Label>
      <Label x={GEO.x - GEO.width / 2 - 16} y={(nowY + GEO.base) / 2} textAnchor="end" fontSize={18} fill="var(--fg)">
        <Symbolised text="gas" />
      </Label>

      <Label x={290} y={408} fontSize={17} fill="var(--fg)" data-testid="piston-working">
        <Symbolised text={current.working} />
      </Label>
      <Label x={290} y={432} fontSize={16} fill="var(--fg-muted)">
        {index === 2 ? 'Work done on the gas is positive, and work done by the gas is negative.' : 'Expansion gives negative w; compression gives positive w.'}
      </Label>
    </svg>
  )
}
