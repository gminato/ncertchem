'use client'

import { RateBars, SealedVessel, WATER_VAPOUR_SPECIES, type VesselSpecies } from '@/components/equilibrium'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { GAUGE_FULL_SCALE_MMHG, physicalSteps, type PhysicalStep } from './physical-steps'
import { OpenDish } from './OpenDish'

export interface PhysicalEquilibriaProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 580
/** The drawings are scaled up from their native sizes so their labels stay at 13 px or more. */
const SCALE = 1.3
const FRAME_W = 360 * SCALE
const X = (VIEW_WIDTH - FRAME_W) / 2
const VESSEL_Y = 8
const RATES_Y = 376

const STEPS = physicalSteps()

const SUGAR_SPECIES: VesselSpecies[] = [
  { id: 'sugar-aq', color: 'var(--accent)', phase: 'liquid', label: 'sugar(aq)' },
  { id: 'sugar-s', color: 'var(--fg-muted)', phase: 'solid', label: 'sugar(s)' },
]

/** A dial reading in mmHg to one decimal place. */
function mmHgText(p: number): string {
  return `${p.toFixed(1)} mmHg`
}

/**
 * The Section 6.1 Scrolly: water in a sealed box (evaporation, then condensation, then equal rates
 * and a flat pressure), the same water in an open dish, and sugar in a sealed saturated solution.
 * The RateBars and the dial tween between Steps, so a change in rate or pressure is seen, not cut.
 */
export function PhysicalEquilibria({ step, reducedMotion }: PhysicalEquilibriaProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current: PhysicalStep = STEPS[index]
  const progress = useTweenedNumber(current.rates.progress, reducedMotion, 1.0)
  const dial = useTweenedNumber(current.pressureMmHg ?? 0, reducedMotion, 1.0)
  const rateCfg = current.rates

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={current.summary}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="physical-equilibria"
      data-step={index}
    >
      <g transform={`translate(${X}, ${VESSEL_Y}) scale(${SCALE})`}>
        {current.scene === 'sealed-water' && (
          <SealedVessel
            species={WATER_VAPOUR_SPECIES}
            counts={[current.gasCount, 12]}
            seed={12}
            liquid
            exchange="evaporation"
            gauge={{ fraction: dial / GAUGE_FULL_SCALE_MMHG, label: mmHgText(dial) }}
            title={current.summary}
          />
        )}
        {current.scene === 'open-dish' && <OpenDish title={current.summary} />}
        {current.scene === 'sealed-sugar' && (
          <SealedVessel
            species={SUGAR_SPECIES}
            counts={[current.gasCount, current.solidCount]}
            seed={5}
            liquid
            solid
            title={current.summary}
          />
        )}
      </g>

      <g transform={`translate(${X}, ${RATES_Y}) scale(${SCALE})`}>
        <RateBars
          progress={progress}
          config={{ forwardStart: rateCfg.forwardStart, reverseStart: rateCfg.reverseStart, equilibrium: rateCfg.equilibrium }}
          forwardLabel={current.forwardLabel}
          reverseLabel={current.reverseLabel}
          title={`${current.forwardLabel} and ${current.reverseLabel.toLowerCase()} rates`}
        />
      </g>
    </svg>
  )
}
