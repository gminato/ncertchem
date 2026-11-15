/**
 * Deterministic targets for the MO wave-combination Scrolly (Section 4.7.1). The picture uses
 * two schematic 1s-like wave functions, ψA = e^(−|u − a|) and ψB = e^(−|u + a|), centred on the
 * two nuclei at u = ±a. It is a teaching sketch, not a computed molecular orbital.
 */

/** Half the internuclear distance, in the sketch's units. The nuclei sit at u = ±NUCLEUS_HALF. */
export const NUCLEUS_HALF = 1

/** A schematic 1s-like wave function centred at `centre`. */
export function atomicWave(u: number, centre: number): number {
  return Math.exp(-Math.abs(u - centre))
}

/** Bonding combination ψA + ψB, the σ1s picture (Section 4.7.1, addition of wave functions). */
export function bondingWave(u: number): number {
  return atomicWave(u, NUCLEUS_HALF) + atomicWave(u, -NUCLEUS_HALF)
}

/** Antibonding combination ψA − ψB, the σ*1s picture (Section 4.7.1, subtraction). */
export function antibondingWave(u: number): number {
  return atomicWave(u, NUCLEUS_HALF) - atomicWave(u, -NUCLEUS_HALF)
}

/** Electron density, the square of the wave function. */
export function density(psi: number): number {
  return psi * psi
}

/** What the picture shows at each Step. */
export interface WaveTarget {
  /** Show the two atomic waves ψA and ψB. */
  atomic: boolean
  /** Show the bonding sum. */
  sum: boolean
  /** Show the antibonding difference. */
  difference: boolean
  /** Lower panel: the atomic densities, the sum's density, the difference's density, both, or the energy ladder. */
  lower: 'atoms' | 'bonding' | 'antibonding' | 'both' | 'energy'
  /** Mark the nodal plane at the midpoint. */
  node: boolean
}

export const WAVE_STEP_TARGETS: readonly WaveTarget[] = [
  { atomic: true, sum: false, difference: false, lower: 'atoms', node: false },
  { atomic: false, sum: true, difference: false, lower: 'bonding', node: false },
  { atomic: false, sum: false, difference: true, lower: 'antibonding', node: true },
  { atomic: false, sum: true, difference: true, lower: 'both', node: true },
  { atomic: false, sum: false, difference: false, lower: 'energy', node: false },
]

export const WAVE_STEP_COUNT = WAVE_STEP_TARGETS.length

/** Target for a Step index, clamped to the valid range. */
export function waveTargetForStep(step: number): WaveTarget {
  const index = Number.isFinite(step) ? Math.min(WAVE_STEP_COUNT - 1, Math.max(0, Math.round(step))) : 0
  return WAVE_STEP_TARGETS[index]
}

/** Visually hidden summary of the Step, read by screen readers. */
export function waveDescription(step: number): string {
  switch (waveTargetForStep(step).lower) {
    case 'atoms':
      return 'Two 1s atomic wave functions, one on each nucleus. Each density is a peak on its own atom.'
    case 'bonding':
      return 'Adding the waves gives ψA + ψB. The two waves reinforce between the nuclei, so the density there is high. This is the bonding σ1s orbital.'
    case 'antibonding':
      return 'Subtracting the waves gives ψA − ψB. The waves cancel at the midpoint, which is a node with zero density. This is the antibonding σ*1s orbital.'
    case 'both':
      return 'Side by side: σ1s piles electron density between the nuclei, while σ*1s has none there.'
    case 'energy':
      return 'The bonding orbital lies below the atomic 1s level and the antibonding orbital lies above it.'
  }
}
