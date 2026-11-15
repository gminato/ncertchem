'use client'

import { QKGauge, SealedVessel, type VesselSpecies } from '@/components/equilibrium'
import { Label } from '@/components/vocab'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { NOCL_K } from './example'
import { qkSteps } from './qk-steps'

export interface QAndKProps {
  step: number
  reducedMotion: boolean
}

const STEPS = qkSteps()

const SPECIES: VesselSpecies[] = [
  { id: 'NO', color: 'var(--accent)', phase: 'gas', label: 'NO' },
  { id: 'Cl2', color: 'var(--i2)', phase: 'gas', label: 'Cl₂' },
  { id: 'NOCl', color: 'var(--fwd)', phase: 'gas', label: 'NOCl' },
]

const TITLE = {
  below: 'Q < K: too little product, so the forward reaction runs',
  above: 'Q > K: too much product, so the reverse reaction runs',
  equal: 'Q = K: at equilibrium, forward and reverse rates are equal',
} as const

/**
 * Q against K on the log scale, with the mixture that gives Q drawn above it. The vessel holds
 * particles in proportion to each concentration, and the gauge marker glides to the new Q on each Step.
 * The reaction is 2NO(g) + Cl₂(g) ⇌ 2NOCl(g) with K = 2.0 (the chosen example value).
 */
export function QAndK({ step, reducedMotion }: QAndKProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current = STEPS[index]
  const logQ = useTweenedNumber(Math.log10(current.Q), reducedMotion, 1.0)
  const Q = 10 ** logQ
  const m = current.mixture

  return (
    <svg
      viewBox="0 0 580 552"
      role="img"
      aria-label={`Mixture with [NO] ${m.NO.toFixed(2)}, [Cl₂] ${m.Cl2.toFixed(2)} and [NOCl] ${m.NOCl.toFixed(2)} mol per litre. Q is ${current.Q.toPrecision(3)} and K is ${NOCL_K.toFixed(1)}. ${TITLE[current.kind]}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="qk-visual"
      data-step={index}
    >
      <Label x={290} y={18} fontSize={17} fill="var(--fg)">
        {TITLE[current.kind]}
      </Label>

      <SealedVessel
        x={110}
        y={32}
        species={SPECIES}
        counts={current.counts}
        seed={7}
        title="Gas mixture in a sealed flask: NO, Cl₂ and NOCl particles"
      />

      <Label x={290} y={344} fontSize={15} fill="var(--fg-muted)">
        [NO] = {m.NO.toFixed(2)}, [Cl₂] = {m.Cl2.toFixed(2)}, [NOCl] = {m.NOCl.toFixed(2)} mol L⁻¹
      </Label>

      <QKGauge x={10} y={362} K={NOCL_K} Q={Q} />
    </svg>
  )
}
