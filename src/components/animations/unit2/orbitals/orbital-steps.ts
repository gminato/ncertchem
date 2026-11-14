/**
 * Step states and data for the "orbital-quantum-numbers" Scrolly Animation. Every Step is a
 * deterministic target: which picture is showing and which quantum numbers have been picked.
 * The radial curves and energies come from the physics lib, so the numbers on screen are
 * the same ones the simulation and the tests use.
 */

import { BOHR_RADIUS_PM, EV_JOULES } from '@/lib/chem/constants'
import { energyLevel } from '@/lib/chem/bohr'
import { radialProbability, radialR } from '@/lib/chem/hydrogen-orbitals'
import { aufbauOrder } from '@/lib/chem/quantum'

/** Number of Steps in the animation. */
export const ORBITAL_STEP_COUNT = 6

/** The picture shown on the stage. */
export type OrbitalView = 'address' | 'radial' | 'energy'

/** The quantum numbers picked so far, with null for those not yet chosen. */
export interface AddressState {
  n: number | null
  l: number | null
  ml: number | null
  /** Spin quantum number, +½ or −½. */
  ms: number | null
}

export interface OrbitalStepState {
  view: OrbitalView
  address: AddressState
}

export function clampOrbitalStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(ORBITAL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/**
 * The target state for each Step. Steps 0 to 3 drill down the quantum-number address, one
 * number at a time. Step 4 shows the radial probability, and Step 5 the energies.
 */
export function stateForStep(step: number): OrbitalStepState {
  switch (clampOrbitalStep(step)) {
    case 0:
      return { view: 'address', address: { n: 3, l: null, ml: null, ms: null } }
    case 1:
      return { view: 'address', address: { n: 3, l: 1, ml: null, ms: null } }
    case 2:
      return { view: 'address', address: { n: 3, l: 1, ml: 0, ms: null } }
    case 3:
      return { view: 'address', address: { n: 3, l: 1, ml: 0, ms: 0.5 } }
    case 4:
      return { view: 'radial', address: { n: null, l: null, ml: null, ms: null } }
    default:
      return { view: 'energy', address: { n: null, l: null, ml: null, ms: null } }
  }
}

/** A radial curve: the radial probability r²R² of one orbital. */
export interface RadialCurve {
  n: number
  l: number
  label: string
}

/** The five orbitals plotted in the radial probability view. */
export const RADIAL_CURVES: readonly RadialCurve[] = [
  { n: 1, l: 0, label: '1s' },
  { n: 2, l: 0, label: '2s' },
  { n: 2, l: 1, label: '2p' },
  { n: 3, l: 0, label: '3s' },
  { n: 3, l: 1, label: '3p' },
]

/** Distance in pm for a distance in a₀ (the Bohr radius, 52.9 pm). */
export function a0ToPm(r: number): number {
  return r * BOHR_RADIUS_PM
}

/** Samples r²R²(r) for one orbital, from r = 0 to `maxPm`. Values are in a₀⁻¹. */
export function radialCurvePoints(
  n: number,
  l: number,
  maxPm = 1000,
  samples = 200
): { pm: number; density: number }[] {
  const points: { pm: number; density: number }[] = []
  for (let k = 0; k <= samples; k++) {
    const pm = (k / samples) * maxPm
    const r = pm / BOHR_RADIUS_PM
    points.push({ pm, density: radialProbability(n, l, r) })
  }
  return points
}

/**
 * Radial nodes of an orbital, in pm: the distances where R_nl changes sign. Found by scanning
 * a fine grid and bisecting each sign change, so the answer does not depend on a formula.
 */
export function radialNodePm(n: number, l: number, maxA0 = 30): number[] {
  const step = 0.005
  const nodes: number[] = []
  let previous = radialR(n, l, step)
  for (let r = 2 * step; r <= maxA0; r += step) {
    const current = radialR(n, l, r)
    if (previous * current < 0) {
      let lo = r - step
      let hi = r
      for (let iter = 0; iter < 60; iter++) {
        const mid = (lo + hi) / 2
        if (radialR(n, l, lo) * radialR(n, l, mid) <= 0) hi = mid
        else lo = mid
      }
      nodes.push(a0ToPm((lo + hi) / 2))
    }
    previous = current
  }
  return nodes
}

/** Position and height of the highest point of r²R², in pm and a₀⁻¹. */
export function radialPeak(n: number, l: number, maxA0 = 30): { pm: number; density: number } {
  let best = { pm: 0, density: -1 }
  for (let r = 0.005; r <= maxA0; r += 0.005) {
    const density = radialProbability(n, l, r)
    if (density > best.density) best = { pm: a0ToPm(r), density }
  }
  return best
}

/** Hydrogen energy levels in eV, from the Bohr energies in the lib. */
export function hydrogenLevelsEv(maxN = 4): { n: number; energyEv: number }[] {
  return Array.from({ length: maxN }, (_, i) => {
    const n = i + 1
    return { n, energyEv: energyLevel(n) / EV_JOULES }
  })
}

/** Subshells of a hydrogen shell, in order of l: n = 3 gives 3s, 3p, 3d. */
export function subshellsOfShell(n: number): string[] {
  return Array.from({ length: n }, (_, l) => `${n}${'spdf'[l]}`)
}

/** Subshell labels in Aufbau order up to 4p: 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p. */
export function multiElectronOrder(): string[] {
  return aufbauOrder('4p')
}
