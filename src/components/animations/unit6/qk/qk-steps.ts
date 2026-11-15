import { predictDirection, reactionQuotient, type Direction } from '@/lib/chem/equilibrium'
import { NOCL_K, NOCL_REACTION } from './example'
import { iceExample } from './ice-steps'

export interface QkStep {
  /** Which comparison this Step shows. */
  kind: 'below' | 'above' | 'equal'
  /** Molar concentrations of NO, Cl₂ and NOCl in the mixture. */
  mixture: Record<string, number>
  /** Particle counts for the vessel, in the order NO, Cl₂, NOCl. Proportional to the concentration. */
  counts: [number, number, number]
  Q: number
  direction: Direction
}

/** Particles per mol L⁻¹ in the vessel drawing. */
const PARTICLES_PER_MOLAR = 5

const countsFor = (mixture: Record<string, number>): [number, number, number] => [
  Math.round(mixture.NO * PARTICLES_PER_MOLAR),
  Math.round(mixture.Cl2 * PARTICLES_PER_MOLAR),
  Math.round(mixture.NOCl * PARTICLES_PER_MOLAR),
]

/**
 * The three Steps of the Q and K Scrolly: Q below K, Q above K and Q equal to K. The last mixture is
 * the equilibrium composition from the ICE solution, so its Q equals K.
 */
export function qkSteps(): QkStep[] {
  const below = { NO: 1, Cl2: 1, NOCl: 0.2 }
  const above = { NO: 0.5, Cl2: 0.5, NOCl: 3 }
  const equal = { ...iceExample().equilibrium }
  return [
    { kind: 'below', mixture: below },
    { kind: 'above', mixture: above },
    { kind: 'equal', mixture: equal },
  ].map((s) => {
    const Q = reactionQuotient(NOCL_REACTION, s.mixture)
    return {
      kind: s.kind as QkStep['kind'],
      mixture: s.mixture,
      counts: countsFor(s.mixture),
      Q,
      direction: predictDirection(Q, NOCL_K),
    }
  })
}
