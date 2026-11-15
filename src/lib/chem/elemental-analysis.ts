/**
 * Simulated elemental analysis for NCERT Class 11 Unit 8 Section 8.10. The lab readings (masses of
 * CO₂ and H₂O, volumes of N₂, precipitate masses, titre volumes) are generated from the TRUE
 * composition of a sample with the same NCERT relations that quantitative-analysis.ts inverts, so a
 * learner who works the percentages from the readings recovers the composition.
 *
 * Readings are rounded the way a balance or burette would show them: masses to 0.1 mg, volumes of
 * gas to 0.1 mL and titres to 0.01 mL. An optional measurement error is applied through `measure`.
 */

import { ELEMENTS } from './elements'
import { massPercent, molarMassOfCounts, parseFormula, empiricalFormula, formatFormula, type FormulaCounts } from './formula'
import { iupacNameFromSmiles } from './iupac-organic'
import type { MolGraph } from './molecule-graph'
import { molecularFormula, neighbours, parseSmiles } from './molecule-parse'
import {
  percentCarbon,
  percentHalogen,
  percentHydrogen,
  percentNitrogenDumas,
  percentNitrogenKjeldahl,
  percentOxygenByDifference,
  percentPhosphorusAmmoniumMolybdate,
  percentPhosphorusMgPyrophosphate,
  percentSulphur,
} from './quantitative-analysis'

/** Conditions of the Dumas nitrometer and the titration, chosen by the simulation. */
export const ANALYSIS_CONDITIONS = {
  /** Room temperature of the nitrometer, K. */
  temperatureK: 300,
  /** Barometric pressure, mmHg. */
  pressureMmHg: 760,
  /**
   * Vapour pressure of water at 300 K (27 °C), about 3.57 kPa, i.e. 26.7 mmHg. Standard steam-table
   * value, not from NCERT (NCERT Problem 8.21 uses 15 mm).
   */
  aqueousTensionMmHg: 26.7,
  /** Molarity of the acid and of the alkali in the Kjeldahl titration, mol L⁻¹ (equal, as in NCERT). */
  kjeldahlMolarity: 0.1,
  /** Volume of standard acid placed in the receiver, mL. */
  kjeldahlAcidMl: 20,
} as const

/** Atomic mass of silver in the Carius AgX mass, as NCERT uses it. */
const AG = 108

/** A measurement hook: maps a true value to the value the instrument shows. Identity by default. */
export type Measure = (value: number) => number

const identity: Measure = (v) => v

/** Rounds to `dp` decimal places. */
function round(value: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(value * f) / f
}

/** Percentage composition of a compound by mass, with its molar mass. */
export interface Composition {
  formula: string
  molarMass: number
  /** Mass percentage of each element (unrounded), keyed by symbol. */
  percent: Record<string, number>
  counts: FormulaCounts
}

/** Composition of a molecular formula such as "C6H7N" (valid symbols, digits and groups only). */
export function compositionOf(formula: string): Composition {
  const counts = parseFormula(formula)
  return {
    formula,
    molarMass: molarMassOfCounts(counts),
    percent: massPercent(formula),
    counts,
  }
}

/** A sample the simulation can analyse: a formula, and a graph where a structure is known. */
export interface ElementalSample {
  id: string
  /** Name from iupacNameFromSmiles when the lib can name the structure; otherwise undefined. */
  name?: string
  formula: string
  smiles?: string
}

/** Presets offered by the Elemental analyser. Formulas come from the structures (molecular formula of the graph). */
const PRESET_SMILES: readonly { id: string; smiles: string }[] = [
  { id: 'aniline', smiles: 'NC1=CC=CC=C1' },
  { id: 'chloroaniline', smiles: 'NC1=CC=C(Cl)C=C1' },
  { id: 'nitrobenzene', smiles: 'C1=CC=C(C=C1)[N+](=O)[O-]' },
  { id: 'pyridine', smiles: 'C1=CC=NC=C1' },
  { id: 'chlorobenzene', smiles: 'ClC1=CC=CC=C1' },
  { id: 'ethyl-ethanoate', smiles: 'CC(=O)OCC' },
]

/** Presets whose heteroatoms are beyond the structure parser (hypervalent S and P): formula only. */
const PRESET_FORMULAS: readonly { id: string; formula: string }[] = [
  { id: 'dimethyl-sulphoxide', formula: 'C2H6OS' },
  { id: 'triethyl-phosphate', formula: 'C6H15O4P' },
]

/** Name and formula of a preset or a structure. The name is undefined when the lib cannot name it. */
export function sampleFromSmiles(id: string, smiles: string): ElementalSample {
  const graph = parseSmiles(smiles)
  let name: string | undefined
  try {
    name = iupacNameFromSmiles(smiles)
  } catch {
    name = undefined
  }
  return { id, name, formula: molecularFormula(graph), smiles }
}

/** Names for the presets the lib cannot name itself (the formula-only presets and pyridine). */
const PRESET_NAMES: Readonly<Record<string, string>> = {
  pyridine: 'pyridine',
  'dimethyl-sulphoxide': 'dimethyl sulphoxide',
  'triethyl-phosphate': 'triethyl phosphate',
}

/** The presets, in the order the simulation lists them. */
export function elementalSamples(): ElementalSample[] {
  return [
    ...PRESET_SMILES.map((p) => {
      const s = sampleFromSmiles(p.id, p.smiles)
      return PRESET_NAMES[p.id] ? { ...s, name: PRESET_NAMES[p.id] } : s
    }),
    ...PRESET_FORMULAS.map((p) => ({ id: p.id, name: PRESET_NAMES[p.id], formula: p.formula })),
  ]
}

// ---------------------------------------------------------------------------
// Nitrogen: is the Kjeldahl method applicable? (NCERT 8.10.2 (ii))
// ---------------------------------------------------------------------------

/**
 * True when atom `i` lies on a ring: two of its neighbours are joined by a path that avoids `i`.
 */
export function atomInRing(g: MolGraph, i: number): boolean {
  const ns = neighbours(g, i).map((n) => n.atom)
  for (let x = 0; x < ns.length; x++) {
    for (let y = x + 1; y < ns.length; y++) {
      const target = ns[y]
      const seen = new Set<number>([i, ns[x]])
      const stack = [ns[x]]
      while (stack.length > 0) {
        const cur = stack.pop()!
        if (cur === target) return true
        for (const n of neighbours(g, cur)) {
          if (!seen.has(n.atom)) {
            seen.add(n.atom)
            stack.push(n.atom)
          }
        }
      }
    }
  }
  return false
}

/**
 * Whether the Kjeldahl method can convert all the nitrogen of a compound to ammonium sulphate.
 * NCERT says it cannot for nitrogen in nitro groups, azo groups and in a ring (pyridine). The
 * function returns the reason for each nitrogen that breaks the rule.
 */
export function kjeldahlApplicability(g: MolGraph): { applicable: boolean; reasons: string[] } {
  const reasons: string[] = []
  g.atoms.forEach((atom, i) => {
    if (atom.element !== 'N') return
    const oxygens = neighbours(g, i).filter((n) => g.atoms[n.atom].element === 'O').length
    const azo = neighbours(g, i).some((n) => g.atoms[n.atom].element === 'N' && n.order === 2)
    if (oxygens >= 2) reasons.push('a nitro group')
    if (azo) reasons.push('an azo group')
    if (atomInRing(g, i)) reasons.push('a ring')
  })
  // Keep each reason once, in the order they were found.
  const unique = [...new Set(reasons)]
  return { applicable: unique.length === 0, reasons: unique }
}

/** Kjeldahl applicability from a SMILES string (a bond to no N gives applicable: true). */
export function kjeldahlApplicabilityOf(smiles: string): { applicable: boolean; reasons: string[] } {
  return kjeldahlApplicability(parseSmiles(smiles))
}

// ---------------------------------------------------------------------------
// Readings: what the apparatus shows for a sample of known composition
// ---------------------------------------------------------------------------

/** Liebig's combustion train: masses gained by the CaCl₂ tube (H₂O) and the KOH bulbs (CO₂), in g. */
export interface CombustionReadings {
  sampleMass: number
  /** Mass of CO₂ absorbed in the potash bulbs, g (0.1 mg). */
  massCO2: number
  /** Mass of H₂O absorbed in the anhydrous CaCl₂ tube, g (0.1 mg). */
  massH2O: number
}

/** Readings of the Liebig train for sample mass `sampleMass` (g). Uses the true %C and %H. */
export function combustionReadings(comp: Composition, sampleMass: number, measure: Measure = identity): CombustionReadings {
  const pctC = comp.percent.C ?? 0
  const pctH = comp.percent.H ?? 0
  // Inverse of %C = 12 m2 × 100 / (44 m) and %H = 2 m1 × 100 / (18 m).
  const massCO2 = measure((pctC / 100) * sampleMass * (44 / 12))
  const massH2O = measure((pctH / 100) * sampleMass * (18 / 2))
  return {
    sampleMass: round(sampleMass, 4),
    massCO2: round(Math.max(0, massCO2), 4),
    massH2O: round(Math.max(0, massH2O), 4),
  }
}

/** Dumas' nitrometer reading: the nitrogen volume at the lab conditions, mL (0.1 mL). */
export interface DumasReadings {
  sampleMass: number
  /** Volume of nitrogen collected over KOH, mL. */
  volumeMl: number
  temperatureK: number
  pressureMmHg: number
  aqueousTensionMmHg: number
}

/** Dumas reading for the true %N. The gas volume at the lab conditions is V = V_STP × 760 × T / (273 × p1). */
export function dumasReadings(comp: Composition, sampleMass: number, measure: Measure = identity): DumasReadings {
  const { temperatureK, pressureMmHg, aqueousTensionMmHg } = ANALYSIS_CONDITIONS
  const pctN = comp.percent.N ?? 0
  const vSTP = (pctN / 100) * sampleMass * (22400 / 28) // mL at STP, from %N = 28 V × 100 / (22400 m)
  const p1 = pressureMmHg - aqueousTensionMmHg
  const volumeMl = measure((vSTP * 760 * temperatureK) / (273 * p1))
  return {
    sampleMass: round(sampleMass, 4),
    volumeMl: round(Math.max(0, volumeMl), 1),
    temperatureK,
    pressureMmHg,
    aqueousTensionMmHg,
  }
}

/** Kjeldahl's titration reading: the alkali needed to titrate the acid left over, mL. */
export interface KjeldahlReadings {
  sampleMass: number
  /** Acid placed in the receiver, V mL. */
  acidMl: number
  /** Alkali used in the back-titration, V₁ mL (0.01 mL). */
  alkaliMl: number
  molarity: number
}

/** Kjeldahl reading for the true %N: V₁ = 2 (V − x), where x = %N × m × 1000 / (100 × 28 × M). */
export function kjeldahlReadings(comp: Composition, sampleMass: number, measure: Measure = identity): KjeldahlReadings {
  const { kjeldahlMolarity: M, kjeldahlAcidMl: V } = ANALYSIS_CONDITIONS
  const pctN = comp.percent.N ?? 0
  const x = (pctN / 100) * sampleMass * (1000 / (28 * M)) // mL of acid that took up the NH₃
  const alkaliMl = measure(2 * (V - x))
  return {
    sampleMass: round(sampleMass, 4),
    acidMl: V,
    alkaliMl: round(Math.max(0, alkaliMl), 2),
    molarity: M,
  }
}

/** A Carius reading: the precipitate weighed after the sample is oxidised, g (0.1 mg). */
export interface PrecipitateReading {
  sampleMass: number
  /** Mass of the precipitate: AgX for a halogen, BaSO₄ for sulphur, the phosphate salt for phosphorus. */
  mass: number
  kind: 'halogen' | 'sulphur' | 'phosphorus-molybdate' | 'phosphorus-pyrophosphate'
  /** Element symbol the precipitate analyses. */
  element: string
}

/** Mass of the precipitate for one Carius-type analysis of element `element` in a sample of mass `sampleMass`. */
export function precipitateReading(
  comp: Composition,
  sampleMass: number,
  kind: PrecipitateReading['kind'],
  element: string,
  measure: Measure = identity
): PrecipitateReading {
  const pct = comp.percent[element] ?? 0
  const ar = ELEMENTS[element].atomicMass
  // Inverses of the NCERT forms used in quantitative-analysis.ts, with the same molar masses.
  let mass: number
  if (kind === 'halogen') {
    mass = (pct / 100) * sampleMass * ((AG + ar) / ar)
  } else if (kind === 'sulphur') {
    mass = (pct / 100) * sampleMass * (233 / 32)
  } else if (kind === 'phosphorus-molybdate') {
    mass = (pct / 100) * sampleMass * (1877 / 31)
  } else {
    mass = (pct / 100) * sampleMass * (222 / 62)
  }
  return { sampleMass: round(sampleMass, 4), mass: round(Math.max(0, measure(mass)), 4), kind, element }
}

// ---------------------------------------------------------------------------
// The learner's arithmetic: the same NCERT formulas, applied to the readings
// ---------------------------------------------------------------------------

/** %C from the CO₂ reading. */
export function carbonFromReadings(r: CombustionReadings): number {
  return percentCarbon(r.massCO2, r.sampleMass)
}

/** %H from the H₂O reading. */
export function hydrogenFromReadings(r: CombustionReadings): number {
  return percentHydrogen(r.massH2O, r.sampleMass)
}

/** %N by Dumas from the nitrometer reading. */
export function nitrogenDumasFromReadings(r: DumasReadings): number {
  return percentNitrogenDumas({
    volumeMl: r.volumeMl,
    temperatureK: r.temperatureK,
    pressureMmHg: r.pressureMmHg,
    aqueousTensionMmHg: r.aqueousTensionMmHg,
    sampleMass: r.sampleMass,
  })
}

/** %N by Kjeldahl from the titration reading (acid and alkali of the same molarity). */
export function nitrogenKjeldahlFromReadings(r: KjeldahlReadings): number {
  return percentNitrogenKjeldahl({
    molarity: r.molarity,
    volumeAcid: r.acidMl,
    volumeAlkali: r.alkaliMl,
    sampleMass: r.sampleMass,
  })
}

/** Percentage of the element from a Carius-type precipitate reading. */
export function percentFromPrecipitate(r: PrecipitateReading): number {
  if (r.kind === 'halogen') {
    return percentHalogen({ massAgX: r.mass, atomicMassX: ELEMENTS[r.element].atomicMass, sampleMass: r.sampleMass })
  }
  if (r.kind === 'sulphur') return percentSulphur(r.mass, r.sampleMass)
  if (r.kind === 'phosphorus-molybdate') return percentPhosphorusAmmoniumMolybdate(r.mass, r.sampleMass)
  return percentPhosphorusMgPyrophosphate(r.mass, r.sampleMass)
}

/** Oxygen by difference from the other elements' percentages (NCERT 8.10.6). */
export function oxygenByDifference(others: Record<string, number>): number {
  return percentOxygenByDifference(others)
}

// ---------------------------------------------------------------------------
// Empirical formula from the percentages (the same steps as empirical-pipeline.ts)
// ---------------------------------------------------------------------------

/** One element's row: its percentage, moles per 100 g and the ratio to the smallest. */
export interface EmpiricalRow {
  symbol: string
  percent: number
  moles: number
  ratio: number
}

/** Empirical formula from percentages the learner has worked out. Uses the lib's empiricalFormula. */
export function empiricalFromPercentages(percent: Record<string, number>): {
  rows: EmpiricalRow[]
  counts: FormulaCounts
  label: string
} {
  const symbols = Object.keys(percent)
  const moles = symbols.map((s) => percent[s] / ELEMENTS[s].atomicMass)
  const smallest = Math.min(...moles)
  const rows = symbols.map((s, i) => ({
    symbol: s,
    percent: percent[s],
    moles: round(moles[i], 4),
    ratio: round(moles[i] / smallest, 2),
  }))
  const counts = empiricalFormula(percent)
  return { rows, counts, label: formatFormula(counts) }
}

/** The whole-number ratio n = molar mass ÷ empirical formula mass, rounded to an integer. */
export function multiplierN(molarMass: number, empirical: FormulaCounts): number {
  return Math.round(molarMass / molarMassOfCounts(empirical))
}
