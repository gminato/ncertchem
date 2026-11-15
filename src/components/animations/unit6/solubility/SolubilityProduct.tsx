'use client'

import { SolubilityBeaker } from '@/components/equilibrium/SolubilityBeaker'
import { Tex } from '../qk/Tex'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { solubilitySteps } from './solubility-steps'

export interface SolubilityProductProps {
  step: number
  reducedMotion: boolean
}

/** A wide panel: the beaker on the left, the Ksp and S working on the right. */
const VIEW = { width: 1000, height: 520 }
/** The beaker is drawn at 1.8 times its native 240 × 262 frame, so it fills the left half of the panel. */
const BEAKER_TRANSFORM = 'translate(40, 4) scale(1.8)'
const BAND = { x: 530, y: 50, width: 450, height: 420 }

const STEPS = solubilitySteps()

/**
 * The solubility-product Scrolly: a saturated BaSO₄ beaker (SolubilityBeaker, scaled up), with a
 * band of KaTeX beneath it that gives Ksp, Qsp or the molar solubility for the Step.
 */
export function SolubilityProduct({ step, reducedMotion }: SolubilityProductProps) {
  const index = Math.min(Math.max(step, 0), STEPS.length - 1)
  const s = STEPS[index]
  const solidAmount = useTweenedNumber(s.beaker.solidAmount, reducedMotion, 1.0)

  return (
    <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} role="img" aria-label={`Step ${index + 1} of 5: ${s.title}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g transform={BEAKER_TRANSFORM}>
        <SolubilityBeaker
          ionCounts={[
            { label: s.beaker.cation, count: s.beaker.counts[0] },
            { label: s.beaker.anion, count: s.beaker.counts[1] },
          ]}
          qVsKsp={s.beaker.qVsKsp}
          solidAmount={solidAmount}
          seed={3}
          title={`Saturated solution over solid, Q ${s.beaker.qVsKsp} Ksp`}
        />
      </g>
      <foreignObject x={BAND.x} y={BAND.y} width={BAND.width} height={BAND.height}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 10,
            fontSize: 18,
            color: 'var(--fg)',
          }}
        >
          {s.tex.map((line) => (
            <div key={line} style={{ textAlign: 'center' }}>
              <Tex tex={line} display />
            </div>
          ))}
        </div>
      </foreignObject>
    </svg>
  )
}
