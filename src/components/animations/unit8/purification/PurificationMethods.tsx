'use client'

import { CRYSTALLISATION_SIZE, Crystallisation, DISTILLATION_RIG_SIZE, DistillationRig, FUNNEL_LAYERS, SEPARATING_FUNNEL_SIZE, SUBLIMATION_SETUP_SIZE, SeparatingFunnel, SublimationSetup } from '@/components/organic/lab'
import { Label } from '@/components/vocab'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { clampStep, purificationTargets, type PurificationStage } from './purification-steps'

export interface PurificationMethodsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 480
const TARGETS = purificationTargets()

/** The apparatus of each Step, scaled so that its drawing fills most of the panel. */
interface Frame {
  size: { width: number; height: number }
  scale: number
  /** Explicit placement; when absent the drawing is centred in the panel. */
  x?: number
  y?: number
}

/**
 * Cooling and filtration draw one vessel each, which sits off-centre in the native size, so they
 * are placed by hand to fill the panel. The other apparatus are centred.
 */
const FRAME: Record<PurificationStage, Frame> = {
  sublimation: { size: SUBLIMATION_SETUP_SIZE, scale: 1.4 },
  cooling: { size: CRYSTALLISATION_SIZE, scale: 1.6, x: 50, y: -74 },
  filtration: { size: CRYSTALLISATION_SIZE, scale: 1.6, x: -7, y: -56 },
  fractional: { size: DISTILLATION_RIG_SIZE, scale: 1.15 },
  steam: { size: DISTILLATION_RIG_SIZE, scale: 1.15 },
  funnel: { size: SEPARATING_FUNNEL_SIZE, scale: 1.35 },
}

/**
 * The purification methods of Section 8.8 in six Steps: sublimation, crystallisation with
 * filtration, fractional distillation, steam distillation and differential extraction. Each Step
 * draws one piece of lab apparatus from the organic lab set, driven by the target state from
 * purificationTargets().
 */
export function PurificationMethods({ step, reducedMotion }: PurificationMethodsProps) {
  const target = TARGETS[clampStep(step, TARGETS.length)]
  const progress = useTweenedNumber(target.progress, reducedMotion, 1.2)
  const temperature = Math.round(useTweenedNumber(target.temperatureC, reducedMotion, 1.2) * 10) / 10
  const frame = FRAME[target.stage]
  const x = frame.x ?? (VIEW_WIDTH - frame.size.width * frame.scale) / 2
  const y = frame.y ?? (VIEW_HEIGHT - 50 - frame.size.height * frame.scale) / 2

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={target.caption}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="purification-methods"
      data-stage={target.stage}
    >
      <g transform={`translate(${x} ${y}) scale(${frame.scale})`}>
        {target.stage === 'sublimation' && <SublimationSetup progress={progress} heating />}
        {target.stage === 'cooling' && <Crystallisation stage="cooling" progress={progress} temperature={temperature} />}
        {target.stage === 'filtration' && <Crystallisation stage="filtration" progress={progress} />}
        {target.stage === 'fractional' && (
          <DistillationRig mode="fractional" progress={progress} temperature={temperature} flaskLevel={0.6} receiverLevel={progress * 0.6} receiverColor="var(--liquid)" />
        )}
        {target.stage === 'steam' && (
          <DistillationRig mode="steam" progress={progress} temperature={temperature} flaskLevel={0.6} receiverLevel={progress * 0.7} receiverColor="var(--liquid)" />
        )}
        {target.stage === 'funnel' && <SeparatingFunnel layers={FUNNEL_LAYERS} partition={5} extraction={2} shake={1} drain={0} particles={18} />}
      </g>
      <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 16} fontSize={16} fill="var(--fg)" textAnchor="middle">
        {target.caption}
      </Label>
    </svg>
  )
}
