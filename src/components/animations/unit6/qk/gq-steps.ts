import { predictDirection, solveIce, type Direction, type Reaction } from '@/lib/chem/equilibrium'
import { R_J_PER_MOL_K } from '@/lib/chem/pv-work'
import { kFromStandardGibbs } from '@/lib/chem/spontaneity'

/** A one-step model, A ⇌ B, with one mole of A at the start in an ideal mixture. */
export const AB_REACTION: Reaction = {
  reactants: [{ species: 'A', coefficient: 1, phase: 'g' }],
  products: [{ species: 'B', coefficient: 1, phase: 'g' }],
}

/** ΔG° of the model at 298 K, kJ mol⁻¹. Chosen for the picture. */
export const AB_DELTA_G0_KJ = -5
export const AB_TEMPERATURE_K = 298

/** K for the model from ΔG° = −RT ln K, so K = exp(−ΔG°/RT). */
export function abK(): number {
  return kFromStandardGibbs(AB_DELTA_G0_KJ, AB_TEMPERATURE_K)
}

const RT_KJ = (R_J_PER_MOL_K * AB_TEMPERATURE_K) / 1000

/**
 * The molar Gibbs energy of the mixture against the extent ξ (the mole fraction of A converted to B),
 * relative to pure A: G = ξ ΔG° + RT [(1 − ξ) ln(1 − ξ) + ξ ln ξ], in kJ mol⁻¹. Its slope is ΔG, so
 * the minimum sits where ΔG = 0, which is equilibrium (Section 6.7).
 */
export function gibbsAt(xi: number): number {
  const a = xi > 0 ? xi * Math.log(xi) : 0
  const b = xi < 1 ? (1 - xi) * Math.log(1 - xi) : 0
  return AB_DELTA_G0_KJ * xi + RT_KJ * (a + b)
}

/** The curve sampled from ξ = 0.001 to 0.999. */
export function gibbsCurve(samples = 200): Array<{ xi: number; G: number }> {
  const out: Array<{ xi: number; G: number }> = []
  for (let i = 0; i <= samples; i++) {
    const xi = 0.001 + ((0.999 - 0.001) * i) / samples
    out.push({ xi, G: gibbsAt(xi) })
  }
  return out
}

export interface GqStep {
  xi: number
  Q: number
  /** ΔG = ΔG° + RT ln Q, kJ mol⁻¹. */
  deltaG: number
  direction: Direction
  title: string
}

/** The equilibrium extent of the model, from the ICE solver rather than a formula. */
export function equilibriumExtent(): number {
  const ice = solveIce(AB_REACTION, { A: 1, B: 0 }, abK(), { basis: 'concentration' })
  return ice.extent
}

/**
 * The four Steps: Q below K (ΔG negative), Q = 1 (ΔG = ΔG°), Q = K at equilibrium (ΔG = 0), and Q above K
 * (ΔG positive). Each ΔG is ΔG° + RT ln Q with the library's K.
 */
export function gqSteps(): GqStep[] {
  const k = abK()
  const eq = equilibriumExtent()
  const points: Array<{ xi: number; title: string }> = [
    { xi: 0.2, title: 'Q below K: the reaction runs forward' },
    { xi: 0.5, title: 'Q = 1: the Gibbs energy change is ΔG°' },
    { xi: eq, title: 'Q = K: equilibrium, ΔG = 0' },
    { xi: 0.97, title: 'Q above K: the reverse reaction runs' },
  ]
  return points.map((p) => {
    const Q = p.xi / (1 - p.xi)
    return {
      xi: p.xi,
      Q,
      deltaG: AB_DELTA_G0_KJ + RT_KJ * Math.log(Q),
      direction: predictDirection(Q, k),
      title: p.title,
    }
  })
}
