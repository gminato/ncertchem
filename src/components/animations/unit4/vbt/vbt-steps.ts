/**
 * Step targets for the Unit 4 valence bond Scrollies (Sections 4.5 and 4.6). Each Step is one
 * deterministic target state. The animations tween the live state towards it, so scrolling in
 * either direction lands on the same picture. Reduced motion jumps straight to the target.
 */

import { H2_MORSE, morseEnergy } from '@/components/molecule/morse'
import type { OverlapKind, OverlapPhase } from '@/components/molecule/overlap-geometry'

// ---------------------------------------------------------------------------
// H₂ formation: the potential energy curve and the overlap of two 1s orbitals
// ---------------------------------------------------------------------------

/**
 * Internuclear distance (pm) at each Step: far apart, approaching, the minimum, too close.
 * The last Step is 40 pm, the closest distance the curve plots (PotentialEnergyCurve starts at
 * 40 pm). Closer than that the Morse energy is above the plotted range, so it is not shown.
 */
export const H2_STEP_DISTANCES_PM = [240, 120, 74, 40] as const

/** Number of Steps in the H₂ curve Scrolly. */
export const H2_STEP_COUNT = H2_STEP_DISTANCES_PM.length

/** Clamp a Step index to the valid range. */
export function clampIndex(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

/** Model energy (kJ mol⁻¹) of two H atoms at distance r (pm), from the Morse form in morse.ts. */
export function h2EnergyAt(r: number): number {
  return morseEnergy(r, H2_MORSE)
}

/**
 * Overlap separation for OverlapDiagram: 1 far apart, falling as the atoms approach, and held at
 * the minimum width (MIN_SEPARATION) when the nuclei come closer than the bond length allows.
 * Linear between 40 pm (fully overlapped) and 240 pm (apart).
 */
export function h2OverlapSeparation(r: number): number {
  return Math.min(1, Math.max(0.15, (r - 40) / 200))
}

/** The distance target for a Step. */
export function h2StepTarget(step: number): { r: number } {
  return { r: H2_STEP_DISTANCES_PM[clampIndex(step, H2_STEP_COUNT)] }
}

// ---------------------------------------------------------------------------
// σ and π overlap: the five overlap pictures of Section 4.5.3 and 4.5.4
// ---------------------------------------------------------------------------

export interface OverlapStep {
  kind: OverlapKind
  phase: OverlapPhase
  separation: number
  /** Caption shown under the diagram. */
  caption: string
}

export const OVERLAP_STEPS: readonly OverlapStep[] = [
  { kind: 'ss', phase: 'positive', separation: 0.2, caption: 'σ: s–s, head on, same sign' },
  { kind: 'pp-sigma', phase: 'positive', separation: 0.3, caption: 'σ: p–p, head on, same sign' },
  { kind: 'pp-sigma', phase: 'negative', separation: 0.3, caption: 'Opposite signs face: negative overlap' },
  { kind: 'pp-pi', phase: 'positive', separation: 0.45, caption: 'π: p–p, side on, same sign' },
  { kind: 'pp-sigma', phase: 'zero', separation: 0.45, caption: 'Right-angled p orbitals: zero net overlap' },
]

export const OVERLAP_STEP_COUNT = OVERLAP_STEPS.length

export function overlapStepAt(step: number): OverlapStep {
  return OVERLAP_STEPS[clampIndex(step, OVERLAP_STEP_COUNT)]
}

// ---------------------------------------------------------------------------
// Ethyne: the two π bonds seen down the C≡C axis
// ---------------------------------------------------------------------------

/** Visibility of each bond at a Step. 0 is absent, 1 is drawn. */
export type EthyneSnapshot = {
  sigma: number
  piY: number
  piZ: number
}

export const ETHYNE_STEPS: readonly EthyneSnapshot[] = [
  { sigma: 1, piY: 0, piZ: 0 },
  { sigma: 1, piY: 1, piZ: 0 },
  { sigma: 1, piY: 1, piZ: 1 },
  { sigma: 1, piY: 1, piZ: 1 },
]

export const ETHYNE_STEP_COUNT = ETHYNE_STEPS.length

export function ethyneStepAt(step: number): EthyneSnapshot {
  return ETHYNE_STEPS[clampIndex(step, ETHYNE_STEP_COUNT)]
}

// ---------------------------------------------------------------------------
// Hybridisation geometry: the shape each Step shows
// ---------------------------------------------------------------------------

export type GeometryShape = 'BeCl2' | 'BCl3' | 'CH4' | 'H2O' | 'PCl5' | 'SF6'

export interface HybridStep {
  shape: GeometryShape
  /** The hybrid orbitals drawn as lobes, or null when only the geometry is drawn. */
  lobes: 'sp' | 'sp2' | 'sp3' | null
  /** In-plane rotation of the drawing, in degrees, so each shape reads well. */
  turn: number
  caption: string
}

export const HYBRID_STEPS: readonly HybridStep[] = [
  { shape: 'BeCl2', lobes: 'sp', turn: 90, caption: 'sp: two hybrids 180° apart. BeCl₂ is linear.' },
  { shape: 'BCl3', lobes: 'sp2', turn: 0, caption: 'sp²: three hybrids at 120°. BCl₃ is trigonal planar.' },
  { shape: 'CH4', lobes: 'sp3', turn: 0, caption: 'sp³: four hybrids to the corners of a tetrahedron.' },
  { shape: 'H2O', lobes: 'sp3', turn: 0, caption: 'Two lone pairs bend H₂O to 104.5°.' },
  { shape: 'PCl5', lobes: null, turn: 0, caption: 'sp³d: five bonds, three equatorial at 120°, two axial.' },
  { shape: 'SF6', lobes: null, turn: 0, caption: 'sp³d²: six bonds to the corners of an octahedron.' },
]

export const HYBRID_STEP_COUNT = HYBRID_STEPS.length

export function hybridStepAt(step: number): HybridStep {
  return HYBRID_STEPS[clampIndex(step, HYBRID_STEP_COUNT)]
}
