'use client'

import { EntropyBox } from '@/components/thermo'
import { Label } from '@/components/vocab'
import { phaseSteps, signed } from './gibbs-steps'

export interface EntropyPhasesProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const BOX = { x: 50, y: 16, width: 480, height: 300 }
const PHASE_NAMES = ['Solid', 'Liquid', 'Gas'] as const
const PHASE_X = [170, 290, 410] as const
const PHASE_Y = 346
const LINE_1 = 390
const LINE_2 = 418

const PHASES = phaseSteps()

/**
 * Entropy rises from the solid to the liquid to the gas. Each Step is one phase, drawn with the
 * shared EntropyBox. At a transition the surroundings take up the equal and opposite entropy, so
 * ΔS_total is zero at the transition temperature (equilibrium).
 */
export function EntropyPhases({ step }: EntropyPhasesProps) {
  const index = Math.min(PHASES.length - 1, Math.max(0, Math.round(step)))
  const active = PHASES[index]

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Particles in the ${PHASE_NAMES[active.state].toLowerCase()} state, with the entropy readout for that transition`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="gibbs-entropy-phases"
      data-step={index}
    >
      <EntropyBox state={active.state} x={BOX.x} y={BOX.y} width={BOX.width} height={BOX.height} />

      {PHASE_NAMES.map((name, i) => (
        <Label
          key={name}
          x={PHASE_X[i]}
          y={PHASE_Y}
          fontSize={16}
          fill={i === index ? 'var(--fg)' : 'var(--fg-subtle)'}
          fontWeight={i === index ? 600 : 400}
        >
          {name}
        </Label>
      ))}

      {active.transitionK === null ? (
        <>
          <Label x={290} y={LINE_1} fontSize={16} fill="var(--fg)">
            Solid: particles locked in a lattice, the lowest entropy
          </Label>
        </>
      ) : (
        <>
          <Label x={290} y={LINE_1} fontSize={16} fill="var(--fg)">
            {active.state === 1 ? 'Melting' : 'Boiling'} at {active.transitionK.toFixed(2)} K:{' '}
            <tspan className="sym">ΔS</tspan>
            <Label.Sub>{active.state === 1 ? 'fus' : 'vap'}</Label.Sub> = {signed(active.deltaSSys ?? 0)} J K⁻¹ mol⁻¹
          </Label>
          <Label x={290} y={LINE_2} fontSize={16} fill="var(--fg-muted)">
            <tspan className="sym">ΔS</tspan>
            <Label.Sub>surr</Label.Sub> = {signed(active.deltaSSurr ?? 0)} and{' '}
            <tspan className="sym">ΔS</tspan>
            <Label.Sub>total</Label.Sub> = {signed(active.deltaSTotal ?? 0)}: equilibrium
          </Label>
        </>
      )}
    </svg>
  )
}
