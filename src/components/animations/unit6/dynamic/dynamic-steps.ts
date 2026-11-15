/**
 * Step targets for the dynamic-equilibrium Scrolly (Section 6.2). Every number comes from the
 * approach-to-equilibrium library: the time course of H₂ + I₂ ⇌ 2HI from reactants, the rates from
 * the mass-action laws, and the equilibrium that solveIce gives. The last Step uses the isotope
 * model: the share of deuterium atoms in ammonia, spread over the four NH₃ isotopologues.
 */

import {
  approachPresets,
  concentrationsAt,
  runApproach,
  settledTimeOf,
  timeReaching,
  type ApproachRun,
} from '@/lib/chem/approach-to-equilibrium'

/** Concentration (mol L⁻¹) that the vessel draws with PARTICLES_AT_CONC particles. */
export const PARTICLE_CONC = 0.04
export const PARTICLES_AT_CONC = 24

/** Number of particles drawn for a concentration (mol L⁻¹). */
export function particleCount(conc: number): number {
  return Math.round((Math.max(0, conc) / PARTICLE_CONC) * PARTICLES_AT_CONC)
}

/** Forward and reverse rates in mmol L⁻¹ s⁻¹, the unit the bars show. */
export interface RatePair {
  forward: number
  reverse: number
}

/** One picture of the H₂ + I₂ flask: concentrations, particle counts and the two rates. */
export interface DynamicPicture {
  t: number
  concentrations: Record<string, number>
  /** Particles of H₂, I₂ and HI in the vessel. */
  counts: [number, number, number]
  /** Mass-action rates kf[H₂][I₂] and kr[HI]², in mmol L⁻¹ s⁻¹. */
  rates: RatePair
}

export interface DynamicModel {
  run: ApproachRun
  kf: number
  kr: number
  /** Kc of H₂ + I₂ ⇌ 2HI at 731 K. */
  k: number
  /** Equilibrium concentrations from solveIce, mol L⁻¹. */
  equilibrium: Record<string, number>
  /** Time at which [HI] first reaches half its equilibrium value, s. */
  halfwayTime: number
  /** First time after which every curve stays within 1 % of its equilibrium value, s. */
  settledAt: number
  /** Steps 0 to 3 of the Scrolly. */
  pictures: [DynamicPicture, DynamicPicture, DynamicPicture, DynamicPicture]
}

/** Share of deuterium among the hydrogen-type atoms of ammonia, as a number from 0 to 1. */
export function deuteriumShare(deuteriumAtoms: number, hydrogenAtoms: number): number {
  const total = deuteriumAtoms + hydrogenAtoms
  if (!(total > 0)) throw new RangeError('The mixture must contain some hydrogen-type atoms')
  return deuteriumAtoms / total
}

/**
 * Fractions of the four NH₃ isotopologues (NH₃, NH₂D, NHD₂, ND₃) when each of the three N–H
 * positions is D with probability p, independently. The four fractions sum to 1.
 */
export function isotopologueFractions(p: number): [number, number, number, number] {
  if (!(p >= 0 && p <= 1)) throw new RangeError(`p must be between 0 and 1 (received ${p})`)
  const q = 1 - p
  return [q ** 3, 3 * p * q * q, 3 * p * p * q, p ** 3]
}

const MMOL = 1000

/** Top of the concentration axis of the curves, mol L⁻¹. */
export const PLOT_CONC = 0.04

function picture(t: number, concentrations: Record<string, number>, kf: number, kr: number): DynamicPicture {
  return {
    t,
    concentrations,
    counts: [
      particleCount(concentrations.H2),
      particleCount(concentrations.I2),
      particleCount(concentrations.HI),
    ],
    rates: {
      forward: kf * concentrations.H2 * concentrations.I2 * MMOL,
      reverse: kr * concentrations.HI * concentrations.HI * MMOL,
    },
  }
}

/** The H₂ + I₂ run from reactants at the default speed, and the four pictures built from it. */
export function dynamicModel(): DynamicModel {
  const preset = approachPresets().find((p) => p.id === 'h2-i2')
  if (!preset) throw new Error('H2 + I2 preset missing')
  const run = runApproach(preset, preset.fromReactants, 1)
  const { kf, kr } = run
  const equilibrium = run.equilibrium.equilibrium
  const halfwayTime = timeReaching(run.samples, 'HI', equilibrium.HI / 2)
  const settledAt = settledTimeOf(run, equilibrium, 0.01 * PLOT_CONC)

  const start = picture(0, concentrationsAt(run.samples, 0), kf, kr)
  const reverseStarts = picture(halfwayTime, concentrationsAt(run.samples, halfwayTime), kf, kr)
  // At equilibrium the composition is the solveIce result itself, so both rates are exactly equal.
  const atEquilibrium = picture(settledAt, { ...equilibrium }, kf, kr)
  const flat = picture(settledAt, { ...equilibrium }, kf, kr)

  return {
    run,
    kf,
    kr,
    k: preset.k,
    equilibrium,
    halfwayTime,
    settledAt,
    pictures: [start, reverseStarts, atEquilibrium, flat],
  }
}
