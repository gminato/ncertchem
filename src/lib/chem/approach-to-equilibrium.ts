/**
 * Reactions for the Unit 6 Sections 6.2 and 6.3 visuals and the approach-to-equilibrium
 * Simulation: the equilibrium constant of each reaction, computed from NCERT Table 6.2 (for H2 + I2)
 * or Table 6.5 (Kp, converted to Kc), and the start mixtures used to reach it from either side.
 *
 * Kinetics follow mass-action rate laws. The forward rate constant kf is set by the Learner; the
 * reverse rate constant is kr = kf / K, so the time course settles at the K of the reaction.
 */

import { NCERT_TABLE_6_2_H2_I2_HI, NCERT_TABLE_6_5_KP } from './ncert-unit6-tables'
import {
  deltaNGas,
  kcFromConcentrations,
  kcFromKp,
  solveIce,
  timeCourse,
  type IceTable,
  type Reaction,
  type TimeSample,
} from './equilibrium'

/** Table 6.2 concentrations are printed in units of 10⁻² mol L⁻¹. */
const TABLE_6_2_UNIT = 1e-2

/** The H2 + I2 ⇌ 2HI reaction as used by Table 6.2. */
export const H2_I2_REACTION: Reaction = {
  reactants: [
    { species: 'H2', coefficient: 1, phase: 'g' },
    { species: 'I2', coefficient: 1, phase: 'g' },
  ],
  products: [{ species: 'HI', coefficient: 2, phase: 'g' }],
}

/** Kc for each experiment of Table 6.2, recomputed from its equilibrium concentrations (mol L⁻¹). */
export function kcFromTable62(): number[] {
  return NCERT_TABLE_6_2_H2_I2_HI.rows.map((row) =>
    kcFromConcentrations(H2_I2_REACTION, {
      H2: row.equilibrium.h2 * TABLE_6_2_UNIT,
      I2: row.equilibrium.i2 * TABLE_6_2_UNIT,
      HI: row.equilibrium.hi * TABLE_6_2_UNIT,
    })
  )
}

/** Mean of the six Kc values from Table 6.2: the constant of H2 + I2 ⇌ 2HI at 731 K. */
export function meanKcFromTable62(): number {
  const values = kcFromTable62()
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** The Kp row of Table 6.5 for a reaction written as in the table, at a temperature. */
export function tableKp(reactionText: string, temperatureK: number): number {
  const row = NCERT_TABLE_6_5_KP.rows.find((r) => r.reaction === reactionText && r.temperatureK === temperatureK)
  if (!row) throw new RangeError(`No Kp in Table 6.5 for ${reactionText} at ${temperatureK} K`)
  return row.kp
}

/** One reaction the Simulation can run. */
export interface ApproachPreset {
  id: string
  /** Formula as displayed, with Unicode subscripts. */
  label: string
  /** Display names of the species, in the order of the sliders. */
  species: Array<{ id: string; name: string }>
  reaction: Reaction
  temperatureK: number
  /** Where the constant comes from, for the readout. */
  kSource: string
  /** Equilibrium constant in mol L⁻¹ units (Kc). */
  k: number
  /** Start from reactants only, mol L⁻¹. */
  fromReactants: Record<string, number>
  /** Start from products only, with the same atoms as the reactant start, mol L⁻¹. */
  fromProducts: Record<string, number>
  /** Forward rate constant at speed 1, in the units shown in `kfUnit`. */
  kfDefault: number
  kfUnit: string
  /** Time window of the plot, s. */
  tEnd: number
  /** Concentration at the top of the plot, mol L⁻¹, chosen so the four ticks are round numbers. */
  concMax: number
  /** Largest starting amount a slider allows, mol L⁻¹. */
  sliderMax: number
  /** Slider step, mol L⁻¹. */
  sliderStep: number
}

/**
 * The four reactions of the Simulation. Two come from NCERT (H2 + I2 at 731 K, N2O4 at 400 K) and
 * two are added from the Table 6.5 Kp values (N2 + 3H2 at 500 K, and 2SO2 + O2 at 700 K).
 */
export function approachPresets(): ApproachPreset[] {
  const kfromTable = meanKcFromTable62()
  const n2o4Reaction: Reaction = {
    reactants: [{ species: 'N2O4', coefficient: 1, phase: 'g' }],
    products: [{ species: 'NO2', coefficient: 2, phase: 'g' }],
  }
  const haberReaction: Reaction = {
    reactants: [
      { species: 'N2', coefficient: 1, phase: 'g' },
      { species: 'H2', coefficient: 3, phase: 'g' },
    ],
    products: [{ species: 'NH3', coefficient: 2, phase: 'g' }],
  }
  const sulphurReaction: Reaction = {
    reactants: [
      { species: 'SO2', coefficient: 2, phase: 'g' },
      { species: 'O2', coefficient: 1, phase: 'g' },
    ],
    products: [{ species: 'SO3', coefficient: 2, phase: 'g' }],
  }

  const kN2O4 = kcFromKp(tableKp('N2O4(g) ⇌ 2NO2(g)', 400), deltaNGas(n2o4Reaction), 400)
  const kHaber = kcFromKp(tableKp('N2(g) + 3H2(g) ⇌ 2NH3(g)', 500), deltaNGas(haberReaction), 500)
  const kSulphur = kcFromKp(tableKp('2SO2(g) + O2(g) ⇌ 2SO3(g)', 700), deltaNGas(sulphurReaction), 700)

  return [
    {
      id: 'h2-i2',
      label: 'H₂ + I₂ ⇌ 2HI',
      species: [
        { id: 'H2', name: 'H₂' },
        { id: 'I2', name: 'I₂' },
        { id: 'HI', name: 'HI' },
      ],
      reaction: H2_I2_REACTION,
      temperatureK: 731,
      kSource: 'Mean of the six Kc values in NCERT Table 6.2 (731 K)',
      k: kfromTable,
      fromReactants: { H2: 0.02, I2: 0.02, HI: 0 },
      fromProducts: { H2: 0, I2: 0, HI: 0.04 },
      kfDefault: 100,
      kfUnit: 'L mol⁻¹ s⁻¹',
      tEnd: 4,
      concMax: 0.04,
      sliderMax: 0.04,
      sliderStep: 0.001,
    },
    {
      id: 'n2o4',
      label: 'N₂O₄ ⇌ 2NO₂',
      species: [
        { id: 'N2O4', name: 'N₂O₄' },
        { id: 'NO2', name: 'NO₂' },
      ],
      reaction: n2o4Reaction,
      temperatureK: 400,
      kSource: 'Kc from Kp = 47.9 at 400 K in Table 6.5, with Δn = +1',
      k: kN2O4,
      fromReactants: { N2O4: 0.05, NO2: 0 },
      fromProducts: { N2O4: 0, NO2: 0.1 },
      kfDefault: 5,
      kfUnit: 's⁻¹',
      tEnd: 1.5,
      concMax: 0.12,
      sliderMax: 0.12,
      sliderStep: 0.001,
    },
    {
      id: 'nh3',
      label: 'N₂ + 3H₂ ⇌ 2NH₃',
      species: [
        { id: 'N2', name: 'N₂' },
        { id: 'H2', name: 'H₂' },
        { id: 'NH3', name: 'NH₃' },
      ],
      reaction: haberReaction,
      temperatureK: 500,
      kSource: 'Kc from Kp = 3.6 × 10⁻² at 500 K in Table 6.5, with Δn = −2',
      k: kHaber,
      fromReactants: { N2: 0.5, H2: 1.5, NH3: 0 },
      fromProducts: { N2: 0, H2: 0, NH3: 1.0 },
      kfDefault: 10,
      kfUnit: 'L³ mol⁻³ s⁻¹',
      tEnd: 5,
      concMax: 2.0,
      sliderMax: 2.0,
      sliderStep: 0.01,
    },
    {
      id: 'so3',
      label: '2SO₂ + O₂ ⇌ 2SO₃',
      species: [
        { id: 'SO2', name: 'SO₂' },
        { id: 'O2', name: 'O₂' },
        { id: 'SO3', name: 'SO₃' },
      ],
      reaction: sulphurReaction,
      temperatureK: 700,
      kSource: 'Kc from Kp = 3.0 × 10⁴ at 700 K in Table 6.5, with Δn = −1',
      k: kSulphur,
      fromReactants: { SO2: 0.1, O2: 0.05, SO3: 0 },
      fromProducts: { SO2: 0, O2: 0, SO3: 0.1 },
      kfDefault: 10000,
      kfUnit: 'L² mol⁻² s⁻¹',
      tEnd: 20,
      concMax: 0.12,
      sliderMax: 0.12,
      sliderStep: 0.001,
    },
  ]
}

/** Speed multipliers offered by the Simulation: kf = kfDefault × speed. */
export const SPEED_CHOICES = [0.5, 1, 2, 4] as const

/** The rate constants for a preset at a speed: kf as given, and kr = kf / K. */
export function rateConstants(preset: ApproachPreset, speed: number): { kf: number; kr: number } {
  if (!(speed > 0)) throw new RangeError(`speed must be positive (received ${speed})`)
  const kf = preset.kfDefault * speed
  return { kf, kr: kf / preset.k }
}

/** A run of the approach: the time course, and the equilibrium that the ICE table gives. */
export interface ApproachRun {
  samples: TimeSample[]
  equilibrium: IceTable
  kf: number
  kr: number
}

const STEPS = 4000

/**
 * The time course from an initial mixture, and the equilibrium the same mixture reaches (solveIce
 * with K = kf / kr). Both come from the library, so the curves settle on the equilibrium table.
 */
export function runApproach(preset: ApproachPreset, initial: Record<string, number>, speed: number): ApproachRun {
  const { kf, kr } = rateConstants(preset, speed)
  const samples = timeCourse(preset.reaction, initial, kf, kr, preset.tEnd, STEPS)
  const equilibrium = solveIce(preset.reaction, initial, kf / kr, { basis: 'concentration' })
  return { samples, equilibrium, kf, kr }
}

/** Concentrations at time t, linearly interpolated between samples and clamped to the run. */
export function concentrationsAt(samples: readonly TimeSample[], t: number): Record<string, number> {
  if (samples.length === 0) throw new RangeError('No samples to interpolate')
  const first = samples[0]
  if (t <= first.time) return { ...first.concentrations }
  for (let i = 1; i < samples.length; i++) {
    const later = samples[i]
    if (t <= later.time) {
      const earlier = samples[i - 1]
      const f = later.time === earlier.time ? 0 : (t - earlier.time) / (later.time - earlier.time)
      return Object.fromEntries(
        Object.keys(later.concentrations).map((name) => {
          const a = earlier.concentrations[name]
          const b = later.concentrations[name]
          return [name, a + f * (b - a)]
        })
      )
    }
  }
  return { ...samples[samples.length - 1].concentrations }
}

/**
 * The first time at which a species reaches `target` (rising or falling), by linear interpolation
 * between samples. Returns the end time when it is never reached.
 */
export function timeReaching(samples: readonly TimeSample[], species: string, target: number): number {
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1].concentrations[species]
    const b = samples[i].concentrations[species]
    if ((a - target) * (b - target) <= 0 && a !== b) {
      const f = (target - a) / (b - a)
      return samples[i - 1].time + f * (samples[i].time - samples[i - 1].time)
    }
  }
  return samples[samples.length - 1].time
}

/** Forward and reverse rates at a composition, from the mass-action laws, in mol L⁻¹ s⁻¹. */
export function ratesOf(
  preset: ApproachPreset,
  kf: number,
  kr: number,
  concentrations: Record<string, number>
): { forward: number; reverse: number } {
  const power = (name: string, n: number) => Math.max(concentrations[name] ?? 0, 0) ** n
  let forward = kf
  for (const term of preset.reaction.reactants) forward *= power(term.species, term.coefficient)
  let reverse = kr
  for (const term of preset.reaction.products) reverse *= power(term.species, term.coefficient)
  return { forward, reverse }
}

/**
 * First time after which every species stays within `tolAbs` (mol L⁻¹) of its equilibrium amount,
 * so the curves look flat. Returns the start time when they never leave the band.
 */
export function settledTimeOf(run: ApproachRun, equilibrium: Record<string, number>, tolAbs: number): number {
  const samples = run.samples
  const within = (i: number) =>
    Object.keys(equilibrium).every((name) => Math.abs(samples[i].concentrations[name] - equilibrium[name]) <= tolAbs)
  for (let i = samples.length - 1; i >= 0; i--) {
    if (!within(i)) return samples[Math.min(i + 1, samples.length - 1)].time
  }
  return samples[0].time
}
