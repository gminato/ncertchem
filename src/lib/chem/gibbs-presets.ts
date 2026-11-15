/**
 * Presets and worked numbers for the Gibbs explorer (Sections 5.6 and 5.7). Every ΔH comes from
 * NCERT Table 5.1 or Table 5.2 through the existing libraries. Every entropy used here is NOT in
 * NCERT; it is a standard molar entropy at 298.15 K from a secondary thermochemical table that
 * cites NIST and CODATA, and each one carries its source string so it can be checked.
 *
 * Units: ΔH in kJ mol⁻¹, ΔS in J K⁻¹ mol⁻¹, T in K.
 */

import { NCERT_TABLE_5_1_FUSION_VAPORISATION } from './ncert-unit5-tables'
import { formationEnthalpyKJ, type ReactionSpec } from './hess'
import { crossoverTemperature, entropyOfPhaseChange, gibbsEnergyChange, kFromStandardGibbs } from './spontaneity'
import { R_J_PER_MOL_K } from './pv-work'

/** Standard molar entropy, J K⁻¹ mol⁻¹ at 298.15 K, with its provenance. */
export interface StandardEntropy {
  species: string
  entropy: number
  /** Where the value was taken. Not NCERT. */
  source: string
}

const ENTROPY_SOURCE =
  'Standard molar entropy at 298.15 K from a secondary thermochemical table citing NIST and CODATA (not NCERT; check the NIST WebBook before publishing)'

/** Standard molar entropies used by the presets. Calcite's value varies by source (91.7 to 92.9). */
export const STANDARD_ENTROPIES: readonly StandardEntropy[] = [
  { species: 'N2(g)', entropy: 191.61, source: ENTROPY_SOURCE },
  { species: 'H2(g)', entropy: 130.68, source: ENTROPY_SOURCE },
  { species: 'NH3(g)', entropy: 192.77, source: ENTROPY_SOURCE },
  { species: 'CaCO3(s)', entropy: 92.9, source: ENTROPY_SOURCE },
  { species: 'CaO(s)', entropy: 39.75, source: ENTROPY_SOURCE },
  { species: 'CO2(g)', entropy: 213.74, source: ENTROPY_SOURCE },
]

/** Standard molar entropy of a species, J K⁻¹ mol⁻¹. @throws {RangeError} if not in the list */
export function standardEntropy(species: string): number {
  const row = STANDARD_ENTROPIES.find((r) => r.species === species)
  if (!row) throw new RangeError(`no standard entropy for ${species}`)
  return row.entropy
}

/** ΔS° of a reaction from standard molar entropies: Σ ν S°(products) − Σ ν S°(reactants). J K⁻¹ mol⁻¹. */
export function reactionEntropyFromStandard(eq: ReactionSpec): number {
  const side = (terms: ReactionSpec['reactants']) =>
    terms.reduce((sum, t) => sum + t.coefficient * standardEntropy(t.species), 0)
  return side(eq.products) - side(eq.reactants)
}

/** ΔH° of a reaction from Table 5.2 formation enthalpies, kJ mol⁻¹. */
export function reactionEnthalpyFromTable(eq: ReactionSpec): number {
  const side = (terms: ReactionSpec['reactants']) =>
    terms.reduce((sum, t) => sum + t.coefficient * formationEnthalpyKJ(t.species), 0)
  return side(eq.products) - side(eq.reactants)
}

/** A preset for the explorer: its ΔH and ΔS, and where each came from. */
export interface GibbsPreset {
  id: 'ice' | 'caco3' | 'nh3'
  label: string
  reaction: string
  deltaHKJ: number
  deltaSJ: number
  /** Temperature the preset opens at, K. */
  defaultT: number
  /** Where ΔH came from. */
  hSource: string
  /** Where ΔS came from. */
  sSource: string
}

const CAO_CO2_EQ: ReactionSpec = {
  label: 'CaCO3(s) → CaO(s) + CO2(g)',
  reactants: [{ species: 'CaCO3(s)', coefficient: 1 }],
  products: [
    { species: 'CaO(s)', coefficient: 1 },
    { species: 'CO2(g)', coefficient: 1 },
  ],
}

const HABER_EQ: ReactionSpec = {
  label: 'N2(g) + 3H2(g) → 2NH3(g)',
  reactants: [
    { species: 'N2(g)', coefficient: 1 },
    { species: 'H2(g)', coefficient: 3 },
  ],
  products: [{ species: 'NH3(g)', coefficient: 2 }],
}

const ICE_FUSION_KJ = NCERT_TABLE_5_1_FUSION_VAPORISATION.rows.find((r) => r.substance === 'H2O')!

/** The three presets. ΔS for ice is ΔfusH / T at the melting point (Table 5.1 value). */
export function gibbsPresets(): GibbsPreset[] {
  const caco3H = reactionEnthalpyFromTable(CAO_CO2_EQ)
  const caco3S = reactionEntropyFromStandard(CAO_CO2_EQ)
  const haberH = reactionEnthalpyFromTable(HABER_EQ)
  const haberS = reactionEntropyFromStandard(HABER_EQ)
  return [
    {
      id: 'ice',
      label: 'Ice melting',
      reaction: 'H₂O(s) → H₂O(l) at 273.15 K',
      deltaHKJ: ICE_FUSION_KJ.fusionKJ,
      deltaSJ: entropyOfPhaseChange(ICE_FUSION_KJ.fusionKJ, ICE_FUSION_KJ.meltingPointK),
      defaultT: 273.15,
      hSource: 'NCERT Table 5.1, ΔfusH(H₂O) = 6.01 kJ mol⁻¹ at 273.15 K',
      sSource: 'ΔS = ΔfusH / T at the melting point (Section 5.6(b))',
    },
    {
      id: 'caco3',
      label: 'CaCO₃ decomposition',
      reaction: 'CaCO₃(s) → CaO(s) + CO₂(g)',
      deltaHKJ: caco3H,
      deltaSJ: caco3S,
      defaultT: 1000,
      hSource: 'NCERT Table 5.2 formation enthalpies (CaCO₃, CaO, CO₂)',
      sSource: 'standard entropies at 298.15 K from the secondary table (not NCERT)',
    },
    {
      id: 'nh3',
      label: 'NH₃ synthesis',
      reaction: 'N₂(g) + 3H₂(g) → 2NH₃(g)',
      deltaHKJ: haberH,
      deltaSJ: haberS,
      defaultT: 400,
      hSource: 'NCERT Table 5.2 formation enthalpy of NH₃(g), two moles',
      sSource: 'standard entropies at 298.15 K from the secondary table (not NCERT)',
    },
  ]
}

/** Equilibrium constant at T from ΔG° in kJ mol⁻¹, for a log₁₀ scale bar. */
export function log10KFromDeltaG(deltaGKJ: number, temperatureK: number): number {
  return Math.log10(kFromStandardGibbs(deltaGKJ, temperatureK))
}

/**
 * The decades shown on the K ladder: log₁₀K from −10 to +10, with ΔG° at temperature T. Each rung
 * is exact for its K, so ΔG° = −RT ln K. At 298 K one decade is about 5.7 kJ mol⁻¹.
 */
export function kLadderRungs(temperatureK: number): Array<{ exponent: number; deltaGKJ: number }> {
  const rungs: Array<{ exponent: number; deltaGKJ: number }> = []
  for (let e = 10; e >= -10; e--) {
    // K = 10^e, so ln K = e ln 10 and ΔG° = −RT ln K.
    const deltaG = (-R_J_PER_MOL_K * temperatureK * e * Math.LN10) / 1000
    rungs.push({ exponent: e, deltaGKJ: deltaG })
  }
  return rungs
}

/** A worked example with the author's own numbers, computed by the libraries. */
export interface WorkedKExample {
  deltaHKJ: number
  deltaSJ: number
  temperatureK: number
  deltaGKJ: number
  k: number
  crossoverK: number | null
}

/** ΔH = −40.0 kJ mol⁻¹, ΔS = −60.0 J K⁻¹ mol⁻¹ at 400 K. */
export function workedKExample(): WorkedKExample {
  const deltaHKJ = -40
  const deltaSJ = -60
  const temperatureK = 400
  const deltaGKJ = gibbsEnergyChange(deltaHKJ, temperatureK, deltaSJ)
  return {
    deltaHKJ,
    deltaSJ,
    temperatureK,
    deltaGKJ,
    k: kFromStandardGibbs(deltaGKJ, temperatureK),
    crossoverK: crossoverTemperature(deltaHKJ, deltaSJ),
  }
}
