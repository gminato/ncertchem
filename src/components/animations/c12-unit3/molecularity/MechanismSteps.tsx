'use client'

import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { CollisionFlash, EnergyProfile, Particle, ReactionBox } from '@/components/vocab'
import {
  ENERGY_PROFILE,
  MECHANISM_STEPS,
  VESSEL,
  mechanismFrame,
  mechanismStepIndex,
} from './mechanism-steps'

export interface MechanismStepsProps {
  step: number
  reducedMotion: boolean
}

const SVG_H_ENERGY = 520
const SVG_H_PLAIN = 400
const TAG_FONT = 15

/** Pill with the Step's tag, drawn in vessel coordinates. */
function Tag({ text, accent }: { text: string; accent: boolean }) {
  const width = text.length * 8.2 + 24
  const stroke = accent ? 'var(--accent)' : 'var(--fg-muted)'
  return (
    <g>
      <rect x={14} y={12} width={width} height={28} rx={14} fill="var(--surface-raised)" stroke={stroke} strokeWidth={1.6} />
      <text x={26} y={31} fontSize={TAG_FONT} fill={accent ? 'var(--accent)' : 'var(--fg)'} fontFamily="var(--font-sans)">
        {text}
      </text>
    </g>
  )
}

/** Formula lines under the vessel (or under the energy profile). */
function FormulaBand({ lines, top }: { lines: readonly string[]; top: number }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={290}
          y={top + i * 26}
          textAnchor="middle"
          fontSize={i === 0 ? 17 : 15}
          fill={i === 0 ? 'var(--fg)' : 'var(--fg-muted)'}
          fontFamily="var(--font-sans)"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/**
 * Scrolly visual for Section 3.2.4. Particles, bursts and the energy profile come from the kinetics
 * vocabulary; the per-Step motion comes from mechanism-steps.ts so every frame is deterministic.
 */
export function MechanismSteps({ step, reducedMotion }: MechanismStepsProps) {
  const t = useAmbientTime(reducedMotion)
  const index = mechanismStepIndex(step)
  const spec = MECHANISM_STEPS[index]
  const q = reducedMotion ? spec.restPhase : (t / spec.period) % 1
  const frame = mechanismFrame(index, q)
  const svgH = spec.energy ? SVG_H_ENERGY : SVG_H_PLAIN

  return (
    <svg
      viewBox={`0 0 580 ${svgH}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={spec.ariaLabel}
    >
      <g transform="translate(30 24)">
        <ReactionBox x={0} y={0} width={VESSEL.width} height={VESSEL.height} radius={16}>
          {frame.bursts.map((b, i) => (
            <CollisionFlash key={`burst-${i}`} x={b.x} y={b.y} size={b.size} effective={b.effective} opacity={b.opacity} />
          ))}
          <g fontFamily="var(--font-sans)">
            {frame.dots.map((d) => (
              <Particle key={d.id} x={d.x} y={d.y} r={d.r} tone={d.tone} label={d.label} opacity={d.opacity} />
            ))}
          </g>
        </ReactionBox>
        <Tag text={spec.tag} accent={spec.tagAccent} />
      </g>
      {spec.energy ? (
        <g>
          <EnergyProfile
            x={20}
            y={292}
            width={540}
            height={130}
            reactant={ENERGY_PROFILE[0]}
            product={ENERGY_PROFILE[ENERGY_PROFILE.length - 1]}
            profile={ENERGY_PROFILE}
            reactantsLabel="Reactants"
            productsLabel="Products"
            intermediateLabel="IO⁻"
            eaLabel="Eₐ, step 1"
            xTitle="Reaction coordinate"
            yTitle="Energy"
          />
          <FormulaBand lines={spec.formula} top={478} />
        </g>
      ) : (
        <FormulaBand lines={spec.formula} top={336} />
      )}
    </svg>
  )
}
