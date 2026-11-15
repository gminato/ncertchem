'use client'

import type { ReactNode } from 'react'
import { EnthalpyDiagram, type EnthalpyLevel, type EnthalpyStep } from '@/components/thermo'
import { Label, VocabDefs } from '@/components/vocab'
import { signedText } from '@/lib/chem/calorimetry-examples'
import { HESS_CO_OXIDATION_KJ, HESS_LEVEL_CO2_KJ, HESS_LEVEL_CO_KJ, clampHessStep, highlightForStep } from './hess-steps'

export interface HessRoutesProps {
  step: number
  /** Accepted for the Scrolly contract. The route highlight is a cut, so motion is not needed. */
  reducedMotion: boolean
}

/** The diagram is drawn at 1.25 times its own size and centred in the 600-unit panel. */
const DIAGRAM = { x: 75, y: 12, scale: 1.25 } as const

const LEVELS: EnthalpyLevel[] = [
  { id: 'C', label: 'C(s) + O₂(g)', H: 0, span: [0, 2] },
  { id: 'CO', label: 'CO(g) + ½O₂(g)', H: HESS_LEVEL_CO_KJ, span: [1, 3] },
  { id: 'CO2', label: 'CO₂(g)', H: HESS_LEVEL_CO2_KJ, span: [0, 3] },
]

const STEPS: EnthalpyStep[] = [
  { id: 'direct', from: 'C', to: 'CO2', column: 0, dH: HESS_LEVEL_CO2_KJ, name: 'ΔH₁', route: 'direct' },
  { id: 'to-co', from: 'C', to: 'CO', column: 1, dH: HESS_LEVEL_CO_KJ, name: 'ΔH₂', route: 'two-step' },
  { id: 'to-co2', from: 'CO', to: 'CO2', column: 2, dH: HESS_CO_OXIDATION_KJ, name: 'ΔH₃', route: 'two-step' },
]

/** The caption under the diagram at each Step. The numbers are the same as the diagram's arrows. */
function caption(step: number): { text: string; node: ReactNode } {
  const h1 = signedText(HESS_LEVEL_CO2_KJ, 1)
  const h2 = signedText(HESS_LEVEL_CO_KJ, 1)
  const h3 = signedText(HESS_CO_OXIDATION_KJ, 1)
  switch (clampHessStep(step)) {
    case 0:
      return {
        text: `Route 1, one step: ΔH₁ = ${h1} kJ mol⁻¹`,
        node: <>Route 1, one step: <tspan className="sym">ΔH</tspan>₁ = {h1} kJ mol⁻¹</>,
      }
    case 1:
      return {
        text: `Route 2, first step: ΔH₂ = ${h2} kJ mol⁻¹`,
        node: <>Route 2, first step: <tspan className="sym">ΔH</tspan>₂ = {h2} kJ mol⁻¹</>,
      }
    case 2:
      return {
        text: `Route 2, second step: ΔH₃ = ${h3} kJ mol⁻¹`,
        node: <>Route 2, second step: <tspan className="sym">ΔH</tspan>₃ = {h3} kJ mol⁻¹</>,
      }
    default:
      return {
        text: `ΔH₁ = ΔH₂ + ΔH₃: ${h2} + (${h3}) = ${h1} kJ mol⁻¹`,
        node: (
          <>
            <tspan className="sym">ΔH</tspan>₁ = <tspan className="sym">ΔH</tspan>₂ + <tspan className="sym">ΔH</tspan>₃: {h2} + (
            {h3}) = {h1} kJ mol⁻¹
          </>
        ),
      }
  }
}

/**
 * Hess's law on an enthalpy diagram. Route 1 goes straight from C(s) + O₂(g) to CO₂(g). Route 2
 * goes through CO(g) + ½O₂(g). Both end at the same level, so ΔH₁ = ΔH₂ + ΔH₃.
 */
export function HessRoutes({ step }: HessRoutesProps) {
  const index = clampHessStep(step)
  const { text, node } = caption(index)
  return (
    <svg
      viewBox="0 0 600 410"
      role="img"
      aria-label={`Enthalpy diagram of carbon burning to CO₂ by two routes, Step ${index + 1} of 4. ${text}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      <g transform={`translate(${DIAGRAM.x} ${DIAGRAM.y}) scale(${DIAGRAM.scale})`}>
        <EnthalpyDiagram
          columns={3}
          levels={LEVELS}
          steps={STEPS}
          highlightRoute={highlightForStep(index)}
          title="Enthalpy levels: C(s) + O₂(g), CO(g) + ½O₂(g) and CO₂(g), with the direct and two-step routes"
        />
      </g>
      <Label x={300} y={382} textAnchor="middle" fontSize={16} fill="var(--fg)" data-testid="hess-caption">
        {node}
      </Label>
      <Label x={300} y={404} textAnchor="middle" fontSize={14} fill="var(--fg-subtle)">
        {`Step ${index + 1} of 4`}
      </Label>
    </svg>
  )
}
