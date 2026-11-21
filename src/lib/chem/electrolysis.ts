/**
 * Quantitative electrolysis and Faraday's laws (NCERT Class 12 Unit 2, Sec. 2.5, Examples 2.10)
 * and the products NCERT discusses for each electrolyte and electrode combination.
 */

import { FARADAY } from './ncert-c12-unit2-tables'

/** Q = I × t, in coulombs, for current in amperes and time in seconds. */
export function chargeFromCurrent(currentA: number, timeS: number): number {
  if (currentA < 0 || timeS < 0) throw new RangeError('Current and time must be non-negative')
  return currentA * timeS
}

/** Moles of electrons passed, Q / F. */
export function molesOfElectrons(charge: number, faraday: number = FARADAY): number {
  if (charge < 0) throw new RangeError('Charge must be non-negative')
  return charge / faraday
}

export interface DepositInput {
  /** Charge passed, C. */
  readonly charge: number
  /** Molar mass of the species deposited or liberated, g mol⁻¹. */
  readonly molarMass: number
  /** Electrons per ion for the electrode reaction (e.g. 2 for Cu²⁺ + 2e⁻ → Cu). */
  readonly electrons: number
}

/** Mass deposited m = (Q/F) × (M/n), in grams (Faraday's first law with the second-law equivalent mass M/n). */
export function massDeposited({ charge, molarMass, electrons }: DepositInput): number {
  if (!Number.isInteger(electrons) || electrons < 1) throw new RangeError(`electrons must be a positive integer, got ${electrons}`)
  return molesOfElectrons(charge) * (molarMass / electrons)
}

/** Faraday's second law: masses liberated by the same charge in series are proportional to M/n. */
export function massesInSeries(charge: number, species: readonly Omit<DepositInput, 'charge'>[]): number[] {
  return species.map((s) => massDeposited({ ...s, charge }))
}

/** Time in seconds needed to deposit a target mass at a constant current: t = m n F / (M I). */
export function timeForMass(massG: number, molarMass: number, electrons: number, currentA: number): number {
  if (currentA <= 0) throw new RangeError(`Current must be positive, got ${currentA}`)
  if (!Number.isInteger(electrons) || electrons < 1) throw new RangeError(`electrons must be a positive integer, got ${electrons}`)
  return (massG * electrons * FARADAY) / (molarMass * currentA)
}

export type ElectrolysisCaseId =
  | 'molten-NaCl'
  | 'aqueous-NaCl-inert'
  | 'dilute-H2SO4-inert'
  | 'concentrated-H2SO4-inert'
  | 'aqueous-CuSO4-Cu-electrodes'
  | 'aqueous-CuSO4-Pt-electrodes'
  | 'aqueous-AgNO3-Ag-electrodes'
  | 'aqueous-AgNO3-Pt-electrodes'

export type ElectrolysisReason =
  | 'only-ions-present'
  | 'lower-E°'
  | 'overpotential-of-O2'
  | 'active-anode-dissolves'
  | 'concentration-favours-persulfate'

export interface ElectrolysisCase {
  readonly id: ElectrolysisCaseId
  readonly description: string
  /** Cathode half-reaction as an mhchem body, with the species that is reduced first. */
  readonly cathodeCe: string
  /** Anode half-reaction as an mhchem body, with the species that is oxidised. */
  readonly anodeCe: string
  readonly products: readonly string[]
  readonly reason: ElectrolysisReason
  /** Plain-language reason, for Section agents. */
  readonly note: string
  readonly source: 'NCERT Sec. 2.5' | 'standard textbook (not in NCERT)'
  /** NCERT book page range where the case appears, or null when it is textbook-only. */
  readonly bookPages: readonly [number, number] | null
}

/** Electrolysis cases NCERT discusses (Sec. 2.5.1), plus the silver and copper cases the Unit uses. */
export const ELECTROLYSIS_CASES: readonly ElectrolysisCase[] = [
  {
    id: 'molten-NaCl',
    description: 'Molten NaCl with inert electrodes',
    cathodeCe: 'Na^+ + e- -> Na(s)',
    anodeCe: '2Cl^- -> Cl2(g) + 2e-',
    products: ['Na(s)', 'Cl2(g)'],
    reason: 'only-ions-present',
    note: 'Only one cation and one anion are present, so no competition.',
    source: 'NCERT Sec. 2.5',
    bookPages: [53, 53],
  },
  {
    id: 'aqueous-NaCl-inert',
    description: 'Aqueous NaCl with inert electrodes',
    cathodeCe: 'H2O + e- -> 1/2H2(g) + OH^-',
    anodeCe: 'Cl^- -> 1/2Cl2(g) + e-',
    products: ['H2(g)', 'Cl2(g)', 'NaOH (left in solution)'],
    reason: 'overpotential-of-O2',
    note: 'At the cathode H⁺/H₂ (E° 0.00 V) is preferred over Na⁺ (−2.71 V). At the anode water (1.23 V) would be oxidised first, but O₂ has a high overpotential, so Cl₂ forms.',
    source: 'NCERT Sec. 2.5',
    bookPages: [53, 53],
  },
  {
    id: 'dilute-H2SO4-inert',
    description: 'Dilute H₂SO₄ with inert (Pt) electrodes',
    cathodeCe: '2H^+ + 2e- -> H2(g)',
    anodeCe: '2H2O -> O2(g) + 4H^+ + 4e-',
    products: ['H2(g)', 'O2(g)'],
    reason: 'lower-E°',
    note: 'Water is oxidised (1.23 V) in preference to sulphate (1.96 V).',
    source: 'NCERT Sec. 2.5',
    bookPages: [53, 54],
  },
  {
    id: 'concentrated-H2SO4-inert',
    description: 'Concentrated H₂SO₄ with inert electrodes',
    cathodeCe: '2H^+ + 2e- -> H2(g)',
    anodeCe: '2SO4^{2-} -> S2O8^{2-} + 2e-',
    products: ['H2(g)', 'S2O8^{2-}'],
    reason: 'concentration-favours-persulfate',
    note: 'At higher acid concentration NCERT says the persulfate reaction (E° 1.96 V) is preferred over water oxidation.',
    source: 'NCERT Sec. 2.5',
    bookPages: [54, 54],
  },
  {
    id: 'aqueous-CuSO4-Cu-electrodes',
    description: 'Aqueous CuSO₄ with copper electrodes',
    cathodeCe: 'Cu^{2+} + 2e- -> Cu(s)',
    anodeCe: 'Cu(s) -> Cu^{2+} + 2e-',
    products: ['Cu(s) deposited on the cathode', 'anode dissolves'],
    reason: 'active-anode-dissolves',
    note: 'The copper anode is oxidised itself, so the net effect is copper transfer from anode to cathode (refining principle, NCERT Sec. 2.5).',
    source: 'NCERT Sec. 2.5',
    bookPages: [51, 51],
  },
  {
    id: 'aqueous-CuSO4-Pt-electrodes',
    description: 'Aqueous CuSO₄ with platinum electrodes',
    cathodeCe: 'Cu^{2+} + 2e- -> Cu(s)',
    anodeCe: '2H2O -> O2(g) + 4H^+ + 4e-',
    products: ['Cu(s)', 'O2(g)'],
    reason: 'lower-E°',
    note: 'Water (1.23 V) is oxidised in preference to sulphate; Cu²⁺ (0.34 V) is reduced in preference to H₂O.',
    source: 'standard textbook (not in NCERT)',
    bookPages: null,
  },
  {
    id: 'aqueous-AgNO3-Ag-electrodes',
    description: 'Aqueous AgNO₃ with silver electrodes',
    cathodeCe: 'Ag^+ + e- -> Ag(s)',
    anodeCe: 'Ag(s) -> Ag^+ + e-',
    products: ['Ag(s) deposited on the cathode', 'anode dissolves'],
    reason: 'active-anode-dissolves',
    note: 'Silver anode dissolves; mass deposited equals mass lost, and the solution concentration stays constant.',
    source: 'standard textbook (not in NCERT)',
    bookPages: null,
  },
  {
    id: 'aqueous-AgNO3-Pt-electrodes',
    description: 'Aqueous AgNO₃ with platinum electrodes',
    cathodeCe: 'Ag^+ + e- -> Ag(s)',
    anodeCe: '2H2O -> O2(g) + 4H^+ + 4e-',
    products: ['Ag(s)', 'O2(g)'],
    reason: 'lower-E°',
    note: 'Ag⁺ (0.80 V) is reduced at the cathode; water (1.23 V) is oxidised at the anode, since nitrate is not oxidised under these conditions.',
    source: 'standard textbook (not in NCERT)',
    bookPages: null,
  },
]

/** Look up one electrolysis case. Throws for an unknown id. */
export function electrolysisProducts(id: ElectrolysisCaseId): ElectrolysisCase {
  const found = ELECTROLYSIS_CASES.find((c) => c.id === id)
  if (!found) throw new RangeError(`Unknown electrolysis case: ${id}`)
  return found
}
