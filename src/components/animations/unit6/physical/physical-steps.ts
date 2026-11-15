/**
 * Step targets for the Section 6.1 Scrolly (physical equilibria). Every number a Learner sees is
 * computed here from the libraries: the water vapour pressure from physical-equilibrium.ts and the
 * sealed-box approach from sealed-container.ts. The particle counts are illustrative only.
 */

import { waterVapourPressureMmHg } from '@/lib/chem/physical-equilibrium'
import { sealedFraction } from '@/lib/chem/sealed-container'
import { rateState, type RateConfig } from '@/components/equilibrium/geometry'

/** Temperature of the sealed-box Scrolly, °C. */
export const PHYSICAL_T_C = 25

/** Equilibrium vapour pressure of water at PHYSICAL_T_C, mmHg, from the lib. */
export const WATER_P_STAR_MMHG = waterVapourPressureMmHg(PHYSICAL_T_C)

/** Full scale of the pressure dial in the Scrolly, mmHg. */
export const GAUGE_FULL_SCALE_MMHG = 40

/** Rate constant used to draw the sealed-box relaxation: a time constant of 1 / kc, arbitrary units. */
export const SEALED_KC = 0.5

export type PhysicalScene = 'sealed-water' | 'open-dish' | 'sealed-sugar'

export interface PhysicalStep {
  scene: PhysicalScene
  /** Accessible summary of the picture for this Step. */
  summary: string
  /** Illustrative number of vapour (or dissolved sugar) particles. */
  gasCount: number
  /** Illustrative number of crystal particles (sugar scene only). */
  solidCount: number
  /** Dial reading in mmHg, or null when the scene has no pressure dial. */
  pressureMmHg: number | null
  /** Forward and reverse rates for the RateBars, and the progress that places them. */
  rates: RateConfig & { progress: number }
  forwardLabel: string
  reverseLabel: string
}

/**
 * RateBars moves each rate with an ease-out cubic: reverse = start + (equilibrium − start) × e(progress).
 * This returns the progress at which the reverse rate reaches fraction f of its equilibrium value, so
 * the bars show the true ratio p / p* rather than an eased one.
 */
export function progressForFraction(f: number): number {
  const c = Math.min(1, Math.max(0, f))
  return 1 - Math.cbrt(1 - c)
}

/** The five Steps: water in a sealed box, the box opened, then sugar in a sealed saturated solution. */
export function physicalSteps(): PhysicalStep[] {
  const f = (t: number) => sealedFraction(SEALED_KC, t)
  // Sealed box, relative rates: evaporation is the forward rate and stays at 1, condensation grows with p.
  const sealedRates = (fraction: number): RateConfig & { progress: number } => ({
    forwardStart: 1,
    reverseStart: 0,
    equilibrium: 1,
    progress: progressForFraction(fraction),
  })
  // Part-way to equilibrium: the share of p* reached 1.2 s after sealing, from the closed form.
  const early = f(1.2)

  return [
    {
      scene: 'sealed-water',
      summary: 'Water in a sealed flask with no vapour yet: only evaporation is running, and the pressure dial reads zero.',
      gasCount: 0,
      solidCount: 0,
      pressureMmHg: 0,
      rates: sealedRates(0),
      forwardLabel: 'Evaporation',
      reverseLabel: 'Condensation',
    },
    {
      scene: 'sealed-water',
      summary: 'Vapour has built up. Condensation has started, so the return rate is rising, and the dial reads part of the vapour pressure.',
      gasCount: Math.round(14 * early),
      solidCount: 0,
      pressureMmHg: WATER_P_STAR_MMHG * early,
      rates: sealedRates(early),
      forwardLabel: 'Evaporation',
      reverseLabel: 'Condensation',
    },
    {
      scene: 'sealed-water',
      summary: `Equilibrium: the two rates are equal and the dial holds at ${WATER_P_STAR_MMHG.toFixed(1)} mmHg, the vapour pressure of water at ${PHYSICAL_T_C} °C.`,
      gasCount: 14,
      solidCount: 0,
      pressureMmHg: WATER_P_STAR_MMHG,
      rates: { ...sealedRates(1), progress: 1 },
      forwardLabel: 'Evaporation',
      reverseLabel: 'Condensation',
    },
    {
      scene: 'open-dish',
      summary: 'The same water in an open dish: vapour drifts into the room, the return rate is tiny, and no equilibrium forms.',
      gasCount: 3,
      solidCount: 0,
      pressureMmHg: null,
      rates: { forwardStart: 1, reverseStart: 0.1, equilibrium: 1, progress: 0 },
      forwardLabel: 'Evaporation',
      reverseLabel: 'Condensation',
    },
    {
      scene: 'sealed-sugar',
      summary: 'Sugar crystals and a saturated sugar solution in a sealed flask: dissolution and crystallisation are equal, so the concentration holds steady.',
      gasCount: 14,
      solidCount: 16,
      pressureMmHg: null,
      rates: { forwardStart: 1, reverseStart: 1, equilibrium: 1, progress: 1 },
      forwardLabel: 'Dissolution',
      reverseLabel: 'Crystallisation',
    },
  ]
}
