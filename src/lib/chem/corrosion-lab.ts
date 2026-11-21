import { NCERT_STANDARD_POTENTIALS } from './ncert-c12-unit2-tables'

/**
 * Corrosion Lab model. Rates are an ILLUSTRATIVE relative scale (0 to 4), not
 * measured data. The only numbers shown as numbers are standard potentials,
 * taken from NCERT_STANDARD_POTENTIALS by id.
 */

export type Environment = 'dry-air' | 'water-no-air' | 'water-air' | 'salt-water' | 'acid'
export type Protection = 'none' | 'paint' | 'zinc' | 'tin' | 'magnesium'
export type Metal = 'iron' | 'zinc' | 'tin' | 'magnesium'
export type RateLevel = 0 | 1 | 2 | 3 | 4

export const ENVIRONMENTS: readonly { id: Environment; label: string; hasWater: boolean; hasAir: boolean }[] = [
  { id: 'dry-air', label: 'Dry air', hasWater: false, hasAir: true },
  { id: 'water-no-air', label: 'Water, no air', hasWater: true, hasAir: false },
  { id: 'water-air', label: 'Water and air', hasWater: true, hasAir: true },
  { id: 'salt-water', label: 'Salt water', hasWater: true, hasAir: true },
  { id: 'acid', label: 'Acid solution', hasWater: true, hasAir: true },
]

export const PROTECTIONS: readonly { id: Protection; label: string }[] = [
  { id: 'none', label: 'Bare iron' },
  { id: 'paint', label: 'Paint' },
  { id: 'zinc', label: 'Zinc coat' },
  { id: 'tin', label: 'Tin coat' },
  { id: 'magnesium', label: 'Mg block' },
]

export const RATE_LABELS: readonly string[] = ['none', 'very slow', 'slow', 'moderate', 'fast']
export const MAX_WEEKS = 52
/** Illustrative: weeks at rate 4 for a full rust fraction, scaled per rate level. */
const WEEKS_PER_FULL_RUST_AT_RATE_1 = 160

const ENVIRONMENT_RATE: Record<Environment, RateLevel> = {
  'dry-air': 0,
  'water-no-air': 0,
  'water-air': 2,
  'salt-water': 3,
  acid: 4,
}

export function environmentRate(env: Environment): RateLevel {
  return ENVIRONMENT_RATE[env]
}

export interface CorrosionState {
  /** Metal that is oxidised (the anode), or null when nothing corrodes. */
  anode: Metal | null
  /** Metal where oxygen is reduced (the cathode), or null when no cell runs. */
  cathode: Metal | null
  /** Relative rate at which iron itself rusts. */
  ironRate: RateLevel
  /** Relative rate of the sacrificial anode when it is zinc or magnesium (0 otherwise). */
  sacrificialRate: RateLevel
  /** True when the coating is scratched through to the iron (tin case). */
  scratched: boolean
}

/**
 * Which metal corrodes, and how fast, for one set of conditions.
 * Deterministic: no randomness, no time dependence (time is applied by rustFraction).
 */
export function corrosionState(input: {
  env: Environment
  protection: Protection
  scratched: boolean
}): CorrosionState {
  const { env, protection, scratched } = input
  const envRate = environmentRate(env)
  const none: CorrosionState = {
    anode: null,
    cathode: null,
    ironRate: 0,
    sacrificialRate: 0,
    scratched,
  }
  // No water or no air: no electrolyte or no O₂, so no cell runs (even with a sacrificial metal).
  const oxygenAndWater = ENVIRONMENTS.find((e) => e.id === env)
  if (envRate === 0 || !oxygenAndWater?.hasWater || !oxygenAndWater.hasAir) {
    return none
  }
  switch (protection) {
    case 'none':
      return { anode: 'iron', cathode: 'iron', ironRate: envRate, sacrificialRate: 0, scratched }
    case 'paint':
      // Paint keeps water and oxygen away from the iron: no cell forms.
      return none
    case 'zinc':
      // Zinc is more reactive than iron, so it corrodes first, even where the coat is scratched.
      return { anode: 'zinc', cathode: 'iron', ironRate: 0, sacrificialRate: envRate, scratched }
    case 'magnesium':
      // Magnesium is the most reactive of the options: a fast sacrificial anode.
      return { anode: 'magnesium', cathode: 'iron', ironRate: 0, sacrificialRate: 4, scratched }
    case 'tin':
      if (!scratched) return none
      // Tin is less reactive than iron: once it is scratched, iron is the anode and corrodes faster.
      return {
        anode: 'iron',
        cathode: 'tin',
        ironRate: Math.min(4, envRate + 1) as RateLevel,
        sacrificialRate: 0,
        scratched,
      }
  }
}

/** Fraction (0 to 1) of the drawn rust layer after a number of weeks. Illustrative scale. */
export function rustFraction(rate: RateLevel, weeks: number): number {
  if (rate === 0) return 0
  const w = Math.max(0, Math.min(MAX_WEEKS, weeks))
  return Math.min(1, (w * rate) / WEEKS_PER_FULL_RUST_AT_RATE_1)
}

const E0_IDS: Record<Metal | 'oxygen', string> = {
  iron: 'Fe2+/Fe',
  zinc: 'Zn2+/Zn',
  magnesium: 'Mg2+/Mg',
  tin: 'Sn2+/Sn',
  oxygen: 'O2/H2O',
}

/** Standard potential from the NCERT table (by id). Throws if the id is missing. */
export function standardPotential(key: keyof typeof E0_IDS): number {
  const id = E0_IDS[key]
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Missing standard potential row: ${id}`)
  return row.e0
}

const ANODE_EQUATION: Record<Metal, string> = {
  iron: 'Fe(s) → Fe²⁺(aq) + 2e⁻',
  zinc: 'Zn(s) → Zn²⁺(aq) + 2e⁻',
  magnesium: 'Mg(s) → Mg²⁺(aq) + 2e⁻',
  tin: 'Sn(s) → Sn²⁺(aq) + 2e⁻',
}

export const CATHODE_EQUATION = 'O₂(g) + 4H⁺ + 4e⁻ → 2H₂O(l)'
export const RUST_FORMULA = 'Fe₂O₃·xH₂O'

export function anodeEquation(metal: Metal): string {
  return ANODE_EQUATION[metal]
}

export function anodeE0(metal: Metal): number {
  return standardPotential(metal)
}

export function cathodeE0(): number {
  return standardPotential('oxygen')
}
