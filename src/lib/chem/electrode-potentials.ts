/**
 * Standard electrode potential data, cell EMF calculations, and redox spontaneity
 * predictions based on NCERT Class 11 Part II Unit 7 (Table 7.1 and Section 7.2 / 7.4).
 */

import { NCERT_TABLE_7_1_ELECTRODE_POTENTIALS } from './ncert-unit7-tables'

/** Cobalt redox couple not present in NCERT Table 7.1, cited from standard electrochemical tables. */
export const COBALT_REDUCTION_POTENTIAL = {
  couple: 'Co2+/Co',
  oxidised: 'Co2+',
  reduced: 'Co(s)',
  electrons: 2,
  halfEquation: '\\ce{Co^{2+} + 2e- -> Co(s)}',
  e0: -0.28,
  source: 'standard tables, not NCERT',
} as const

/** Halogens ordered by decreasing oxidising power / displacement hierarchy. */
export const HALOGEN_DISPLACEMENT_ORDER = ['F2', 'Cl2', 'Br2', 'I2'] as const

/**
 * Normalised lookup mapping aliases (couple notation, elemental symbols, ions)
 * to standard reduction potentials in volts (E° / V at 298 K).
 */
const POTENTIAL_LOOKUP = new Map<string, number>()

function normaliseKey(key: string): string {
  return key.trim().replace(/\s+/g, '')
}

// Populate from NCERT Table 7.1
for (const row of NCERT_TABLE_7_1_ELECTRODE_POTENTIALS.rows) {
  // Couple key as oxidised/reduced
  const oxidisedClean = row.oxidised.replace(/\([a-z]+\)/g, '').trim()
  const reducedClean = row.reduced.replace(/\([a-z]+\)/g, '').trim()

  const coupleClean = `${oxidisedClean}/${reducedClean}`
  POTENTIAL_LOOKUP.set(normaliseKey(coupleClean), row.e0)
  POTENTIAL_LOOKUP.set(normaliseKey(`${row.oxidised}/${row.reduced}`), row.e0)

  // Map pure elemental symbols and simple ions for convenience
  // E.g., Zn2+/Zn(s) -> 'Zn', 'Zn2+', 'Zn2+/Zn'
  if (row.reduced.includes('Zn')) {
    POTENTIAL_LOOKUP.set('Zn', row.e0)
    POTENTIAL_LOOKUP.set('Zn2+', row.e0)
    POTENTIAL_LOOKUP.set('Zn2+/Zn', row.e0)
  }
  if (row.reduced.includes('Cu') && row.oxidised.includes('Cu2+')) {
    POTENTIAL_LOOKUP.set('Cu', row.e0)
    POTENTIAL_LOOKUP.set('Cu2+', row.e0)
    POTENTIAL_LOOKUP.set('Cu2+/Cu', row.e0)
  }
  if (row.reduced.includes('Cu') && row.oxidised.includes('Cu+')) {
    POTENTIAL_LOOKUP.set('Cu+/Cu', row.e0)
  }
  if (row.reduced.includes('Ag') && row.oxidised.includes('Ag+')) {
    POTENTIAL_LOOKUP.set('Ag', row.e0)
    POTENTIAL_LOOKUP.set('Ag+', row.e0)
    POTENTIAL_LOOKUP.set('Ag+/Ag', row.e0)
  }
  if (row.reduced.includes('H2') && row.oxidised.includes('2H+')) {
    POTENTIAL_LOOKUP.set('H2', row.e0)
    POTENTIAL_LOOKUP.set('H+', row.e0)
    POTENTIAL_LOOKUP.set('2H+/H2', row.e0)
  }
  if (row.oxidised.includes('F2')) {
    POTENTIAL_LOOKUP.set('F2/F-', row.e0)
  }
  if (row.oxidised.includes('Cl2')) {
    POTENTIAL_LOOKUP.set('Cl2/Cl-', row.e0)
  }
  if (row.oxidised.includes('Br2')) {
    POTENTIAL_LOOKUP.set('Br2/Br-', row.e0)
  }
  if (row.oxidised.includes('I2')) {
    POTENTIAL_LOOKUP.set('I2/I-', row.e0)
  }
  if (row.reduced.includes('Li')) {
    POTENTIAL_LOOKUP.set('Li', row.e0)
    POTENTIAL_LOOKUP.set('Li+', row.e0)
    POTENTIAL_LOOKUP.set('Li+/Li', row.e0)
  }
  if (row.reduced.includes('K')) {
    POTENTIAL_LOOKUP.set('K', row.e0)
    POTENTIAL_LOOKUP.set('K+', row.e0)
    POTENTIAL_LOOKUP.set('K+/K', row.e0)
  }
  if (row.reduced.includes('Ca')) {
    POTENTIAL_LOOKUP.set('Ca', row.e0)
    POTENTIAL_LOOKUP.set('Ca2+', row.e0)
    POTENTIAL_LOOKUP.set('Ca2+/Ca', row.e0)
  }
  if (row.reduced.includes('Na')) {
    POTENTIAL_LOOKUP.set('Na', row.e0)
    POTENTIAL_LOOKUP.set('Na+', row.e0)
    POTENTIAL_LOOKUP.set('Na+/Na', row.e0)
  }
  if (row.reduced.includes('Mg')) {
    POTENTIAL_LOOKUP.set('Mg', row.e0)
    POTENTIAL_LOOKUP.set('Mg2+', row.e0)
    POTENTIAL_LOOKUP.set('Mg2+/Mg', row.e0)
  }
  if (row.reduced.includes('Al')) {
    POTENTIAL_LOOKUP.set('Al', row.e0)
    POTENTIAL_LOOKUP.set('Al3+', row.e0)
    POTENTIAL_LOOKUP.set('Al3+/Al', row.e0)
  }
  if (row.reduced.includes('Cr') && row.oxidised === 'Cr3+') {
    POTENTIAL_LOOKUP.set('Cr', row.e0)
    POTENTIAL_LOOKUP.set('Cr3+', row.e0)
    POTENTIAL_LOOKUP.set('Cr3+/Cr', row.e0)
  }
  if (row.reduced.includes('Fe') && row.oxidised === 'Fe2+') {
    POTENTIAL_LOOKUP.set('Fe', row.e0)
    POTENTIAL_LOOKUP.set('Fe2+', row.e0)
    POTENTIAL_LOOKUP.set('Fe2+/Fe', row.e0)
  }
  if (row.reduced.includes('Ni')) {
    POTENTIAL_LOOKUP.set('Ni', row.e0)
    POTENTIAL_LOOKUP.set('Ni2+', row.e0)
    POTENTIAL_LOOKUP.set('Ni2+/Ni', row.e0)
  }
  if (row.reduced.includes('Sn')) {
    POTENTIAL_LOOKUP.set('Sn', row.e0)
    POTENTIAL_LOOKUP.set('Sn2+', row.e0)
    POTENTIAL_LOOKUP.set('Sn2+/Sn', row.e0)
  }
  if (row.reduced.includes('Pb')) {
    POTENTIAL_LOOKUP.set('Pb', row.e0)
    POTENTIAL_LOOKUP.set('Pb2+', row.e0)
    POTENTIAL_LOOKUP.set('Pb2+/Pb', row.e0)
  }
  if (row.reduced.includes('Au')) {
    POTENTIAL_LOOKUP.set('Au', row.e0)
    POTENTIAL_LOOKUP.set('Au3+', row.e0)
    POTENTIAL_LOOKUP.set('Au3+/Au', row.e0)
  }
}

// Add Cobalt couple
POTENTIAL_LOOKUP.set('Co', COBALT_REDUCTION_POTENTIAL.e0)
POTENTIAL_LOOKUP.set('Co2+', COBALT_REDUCTION_POTENTIAL.e0)
POTENTIAL_LOOKUP.set('Co2+/Co', COBALT_REDUCTION_POTENTIAL.e0)

/**
 * Metals ordered by decreasing reducing power (most negative E° to most positive E°),
 * representing the electrochemical activity series for metals in Table 7.1 (plus Co).
 */
export const ACTIVITY_SERIES_METALS: readonly string[] = [
  'Li',
  'K',
  'Ca',
  'Na',
  'Mg',
  'Al',
  'Zn',
  'Cr',
  'Fe',
  'Co',
  'Ni',
  'Sn',
  'Pb',
  'Cu',
  'Ag',
  'Au',
]

/**
 * Looks up the standard reduction potential E° / V at 298 K for a given redox couple,
 * element, or ion.
 *
 * @param coupleOrSymbol Redox couple name (e.g. 'Zn2+/Zn', 'F2/F-') or element symbol ('Zn', 'Cu2+').
 * @returns Standard reduction potential in Volts.
 * @throws RangeError if coupleOrSymbol is not recognised.
 */
export function lookupPotential(coupleOrSymbol: string): number {
  const key = normaliseKey(coupleOrSymbol)
  const val = POTENTIAL_LOOKUP.get(key)
  if (val !== undefined) {
    return val
  }
  throw new RangeError(`Unknown redox couple or element symbol: "${coupleOrSymbol}"`)
}

/**
 * Identifies the stronger oxidising agent between two redox couples or species
 * (the one with the higher reduction potential).
 *
 * @param a First couple or oxidising species.
 * @param b Second couple or oxidising species.
 * @returns The key representing the stronger oxidant.
 */
export function strongerOxidant(a: string, b: string): string {
  const potA = lookupPotential(a)
  const potB = lookupPotential(b)
  return potA >= potB ? a : b
}

/**
 * Identifies the stronger reducing agent between two redox couples or species
 * (the one with the lower / more negative reduction potential).
 *
 * @param a First reductant or couple.
 * @param b Second reductant or couple.
 * @returns The key representing the stronger reductant.
 */
export function strongerReductant(a: string, b: string): string {
  const potA = lookupPotential(a)
  const potB = lookupPotential(b)
  return potA <= potB ? a : b
}

/**
 * Calculates standard cell EMF: E°cell = E°(cathode) - E°(anode).
 *
 * @param cathodeCouple Reduction couple occurring at cathode (reduction half-cell).
 * @param anodeCouple Oxidation couple occurring at anode (reduction potential of anode couple).
 * @returns Cell potential in Volts.
 */
export function cellEmf(cathodeCouple: string, anodeCouple: string): number {
  const eCathode = lookupPotential(cathodeCouple)
  const eAnode = lookupPotential(anodeCouple)
  return eCathode - eAnode
}

/**
 * Determines whether a reductant (e.g. metal) can thermodynamically reduce an oxidant
 * (e.g. cation) under standard conditions (spontaneous when E°cell > 0).
 *
 * @param reductant Reducing agent (e.g. 'Zn').
 * @param oxidant Oxidising agent to be reduced (e.g. 'Cu2+').
 * @returns True if E°cell > 0, false otherwise.
 */
export function canReduce(reductant: string, oxidant: string): boolean {
  const eOxidant = lookupPotential(oxidant)
  const eReductant = lookupPotential(reductant)
  return eOxidant - eReductant > 0
}

/**
 * Determines whether a metal can liberate H2 gas from dilute acid
 * (i.e. E°(M^n+/M) < E°(2H+/H2) = 0.00 V).
 *
 * @param metal Metal symbol, e.g. 'Zn', 'Mg', 'Cu'.
 * @returns True if metal reduces H+ to H2.
 */
export function liberatesHydrogenFromAcid(metal: string): boolean {
  const pot = lookupPotential(metal)
  return pot < 0
}

/**
 * Classifies the qualitative outcome of a metal-ion displacement reaction according to
 * NCERT Section 7.2.1:
 * - 'products strongly favoured' when E°cell > 0.05 V (e.g. Zn + Cu2+, Cu + 2Ag+).
 * - 'moderate both ways' when E°cell is close to 0 (0 <= E°cell <= 0.05 V, e.g. Co + Ni2+).
 * - 'no visible reaction' when E°cell < 0 V (e.g. Cu + Zn2+).
 *
 * @param metal Reducing metal.
 * @param ion Aqueous cation.
 * @returns Qualitative displacement outcome string.
 */
export function displacementOutcome(
  metal: string,
  ion: string,
): 'products strongly favoured' | 'moderate both ways' | 'no visible reaction' {
  const eCathode = lookupPotential(ion)
  const eAnode = lookupPotential(metal)
  const deltaE = eCathode - eAnode

  if (deltaE < 0) {
    return 'no visible reaction'
  }
  if (deltaE <= 0.05) {
    return 'moderate both ways'
  }
  return 'products strongly favoured'
}

/**
 * Predicts whether a halogen can displace a halide ion from its aqueous solution
 * based on the halogen displacement hierarchy (F2 > Cl2 > Br2 > I2).
 *
 * @param halogen Elemental halogen ('F2', 'Cl2', 'Br2', 'I2').
 * @param halide Halide ion ('F-', 'Cl-', 'Br-', 'I-').
 * @returns True if halogen displaces halide, false otherwise.
 * @throws RangeError if halogen or halide is invalid.
 */
export function canDisplaceHalogen(halogen: string, halide: string): boolean {
  const halogenClean = halogen.trim()
  const halideClean = halide.trim().replace('-', '')

  const halogenIndex = HALOGEN_DISPLACEMENT_ORDER.indexOf(
    halogenClean as (typeof HALOGEN_DISPLACEMENT_ORDER)[number],
  )
  if (halogenIndex === -1) {
    throw new RangeError(`Unknown halogen: "${halogen}"`)
  }

  const halideMap: Record<string, number> = {
    F: 0,
    Cl: 1,
    Br: 2,
    I: 3,
  }

  const halideIndex = halideMap[halideClean]
  if (halideIndex === undefined) {
    throw new RangeError(`Unknown halide: "${halide}"`)
  }

  // A halogen higher in oxidising power (lower index) displaces a halide of a less oxidising halogen (higher index)
  return halogenIndex < halideIndex
}
