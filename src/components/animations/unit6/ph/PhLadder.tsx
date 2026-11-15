'use client'

import { Label } from '@/components/vocab'
import { formatSci } from '@/components/equilibrium/geometry'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { PhAxis } from './PhAxis'
import { KwSeesaw } from './KwSeesaw'
import { phScaleSteps } from './ph-steps'

export interface PhLadderProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 470
const STEPS = phScaleSteps()
const AXIS = { x0: 118, x1: 562, y: 96, height: 30 }
const SEESAW = { cx: 340, cy: 300, half: 170 }

/** Verdict word for a frame, from its pH against its neutral pH. */
function verdictOf(pH: number, neutral: number): string {
  if (Math.abs(pH - neutral) < 0.005) return 'neutral'
  return pH < neutral ? 'acidic' : 'basic'
}

/**
 * The pH Scrolly visual. The pH bar with its pointer, and beneath it the Kw seesaw. Each Step moves
 * the pointer and the beam to the Step's target; under reduced motion they cut to the target.
 */
export function PhLadder({ step, reducedMotion }: PhLadderProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, step))
  const target = STEPS[index]
  const pH = useTweenedNumber(target.pH, reducedMotion, 0.9)
  const pKw = useTweenedNumber(target.pKw, reducedMotion, 0.9)
  const pOH = pKw - pH
  const verdict = verdictOf(target.pH, target.neutralPH)
  const neutralCaption = `neutral at ${Math.round(target.temperatureK)} K: pH ${target.neutralPH.toFixed(2)}`
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${target.label}: pH ${target.pH.toFixed(2)}, [H₃O⁺] ${formatSci(target.hPlus)} mol L⁻¹, [OH⁻] ${formatSci(target.oh)} mol L⁻¹, ${verdict}`}
      data-testid="ph-ladder"
      data-step={index}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <Label x={20} y={24} textAnchor="start" fontSize={15} fill="var(--fg)" fontWeight={600}>
        {target.label}
        <tspan fill="var(--fg-muted)" fontWeight={400}>
          {'  ·  '}
          {Math.round(target.temperatureK)} K
        </tspan>
      </Label>
      <Label x={VIEW_WIDTH - 20} y={24} textAnchor="end" fontSize={15} fill={verdict === 'acidic' ? 'var(--acid)' : verdict === 'basic' ? 'var(--base)' : 'var(--fg-muted)'} fontWeight={700}>
        {verdict}
      </Label>

      <PhAxis
        x0={AXIS.x0}
        x1={AXIS.x1}
        y={AXIS.y}
        height={AXIS.height}
        pH={pH}
        neutralPH={target.neutralPH}
        neutralCaption={neutralCaption}
        callout={`pH ${pH.toFixed(2)}`}
      />

      <KwSeesaw
        cx={SEESAW.cx}
        cy={SEESAW.cy}
        half={SEESAW.half}
        pH={pH}
        pOH={pOH}
        hPlus={target.hPlus}
        oh={target.oh}
        kwValue={10 ** -pKw}
        temperatureK={target.temperatureK}
      />

    </svg>
  )
}
