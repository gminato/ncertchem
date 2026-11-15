/**
 * Hydrogen bonding for NCERT Class 11 Unit 4, Section 4.9: which X–H···Y contacts qualify,
 * the intermolecular and intramolecular types, the NCERT examples, and a boiling-point data set
 * for the hydrides of groups 14 to 17 for a "water is anomalous" chart.
 *
 * NCERT says a hydrogen bond forms when H is bonded to a strongly electronegative atom (F, O or
 * N) and a second such atom attracts it (Section 4.9). The boiling-point data are not from NCERT.
 * They are labelled as such and cited to a standard handbook.
 */

/** The atoms NCERT allows on both sides of a hydrogen bond. */
export const HYDROGEN_BOND_ATOMS: readonly string[] = ['F', 'O', 'N']

/**
 * True if an X–H···Y contact can be a hydrogen bond: X and Y are both F, O or N (Section 4.9).
 */
export function qualifiesForHydrogenBond(donor: string, acceptor: string): boolean {
  return HYDROGEN_BOND_ATOMS.includes(donor) && HYDROGEN_BOND_ATOMS.includes(acceptor)
}

/** A specific X–H···Y contact in a given structure. */
export interface HydrogenBondContact {
  /** Atom the hydrogen is covalently bonded to (X). */
  donor: string
  /** Atom the hydrogen is attracted to (Y). */
  acceptor: string
  /** True when X and Y are in the same molecule (intramolecular), false when in different molecules. */
  sameMolecule: boolean
}

/**
 * Type of an X–H···Y contact: intramolecular when X and Y share a molecule, otherwise
 * intermolecular (Section 4.9.2).
 *
 * @throws {RangeError} If the donor or acceptor is not F, O or N
 */
export function hydrogenBondType(contact: HydrogenBondContact): 'intermolecular' | 'intramolecular' {
  if (!qualifiesForHydrogenBond(contact.donor, contact.acceptor)) {
    throw new RangeError(`${contact.donor}–H···${contact.acceptor} is not a hydrogen bond: both atoms must be F, O or N`)
  }
  return contact.sameMolecule ? 'intramolecular' : 'intermolecular'
}

/** A named example from Section 4.9 or its figures. */
export interface HydrogenBondExample {
  name: string
  /** The contact in the form X–H···Y, as drawn in NCERT. */
  contact: string
  type: 'intermolecular' | 'intramolecular'
  /** Where the example appears in the unit. */
  ncertRef: string
}

/** The examples NCERT gives in Section 4.9 (book pp. 131–132). */
export const NCERT_HYDROGEN_BOND_EXAMPLES: readonly HydrogenBondExample[] = [
  {
    name: 'Hydrogen fluoride chain', contact: 'F–H···F', type: 'intermolecular',
    ncertRef: 'Section 4.9, book p. 131 (HF zig-zag chain)',
  },
  {
    name: 'Water', contact: 'O–H···O', type: 'intermolecular',
    ncertRef: 'Section 4.9.2, book p. 132 (H2O, alcohols)',
  },
  {
    name: 'Ethanol', contact: 'O–H···O', type: 'intermolecular',
    ncertRef: 'Section 4.9.2, book p. 132 (alcohol)',
  },
  {
    name: 'o-Nitrophenol', contact: 'O–H···O (within one molecule)', type: 'intramolecular',
    ncertRef: 'Section 4.9.2, Fig. 4.22, book p. 132',
  },
]

/** One hydride in the boiling-point data set (not from NCERT). */
export interface HydrideBoilingPoint {
  group: 14 | 15 | 16 | 17
  period: 2 | 3 | 4 | 5
  formula: string
  /** Normal boiling point in kelvin. */
  boilingPointK: number
}

/**
 * Normal boiling points of the hydrides of groups 14 to 17. Not from NCERT. Taken from the
 * CRC Handbook of Chemistry and Physics (normal boiling points, as recalled) and converted
 * from °C with 273.15. These were not re-checked against the handbook in this session and
 * must be verified before they appear in a Learner-facing chart.
 */
export const HYDRIDE_BOILING_POINTS: readonly HydrideBoilingPoint[] = [
  { group: 14, period: 2, formula: 'CH4', boilingPointK: 111.7 },
  { group: 14, period: 3, formula: 'SiH4', boilingPointK: 161.3 },
  { group: 14, period: 4, formula: 'GeH4', boilingPointK: 184.7 },
  { group: 14, period: 5, formula: 'SnH4', boilingPointK: 220.7 },
  { group: 15, period: 2, formula: 'NH3', boilingPointK: 239.8 },
  { group: 15, period: 3, formula: 'PH3', boilingPointK: 185.4 },
  { group: 15, period: 4, formula: 'AsH3', boilingPointK: 210.8 },
  { group: 15, period: 5, formula: 'SbH3', boilingPointK: 254.8 },
  { group: 16, period: 2, formula: 'H2O', boilingPointK: 373.1 },
  { group: 16, period: 3, formula: 'H2S', boilingPointK: 212.9 },
  { group: 16, period: 4, formula: 'H2Se', boilingPointK: 231.7 },
  { group: 16, period: 5, formula: 'H2Te', boilingPointK: 271.0 },
  { group: 17, period: 2, formula: 'HF', boilingPointK: 292.7 },
  { group: 17, period: 3, formula: 'HCl', boilingPointK: 188.1 },
  { group: 17, period: 4, formula: 'HBr', boilingPointK: 206.4 },
  { group: 17, period: 5, formula: 'HI', boilingPointK: 237.7 },
]

/** Result of {@link hydrideAnomaly} for the period-2 hydride of a group. */
export interface HydrideAnomaly {
  formula: string
  observedK: number
  /** Boiling point expected from a straight line through the heavier hydrides of the group. */
  expectedK: number
  /** Observed minus expected, in kelvin. Large positive values mark hydrogen-bonded hydrides. */
  anomalyK: number
}

/**
 * Compares the period-2 hydride of a group with the trend of its heavier hydrides (periods 3
 * to 5). The trend is a least-squares line through those three points, extrapolated to period 2.
 *
 * @throws {RangeError} If the group is not 14 to 17
 */
export function hydrideAnomaly(group: 14 | 15 | 16 | 17): HydrideAnomaly {
  const members = HYDRIDE_BOILING_POINTS.filter((h) => h.group === group)
  const heavy = members.filter((h) => h.period >= 3)
  const light = members.find((h) => h.period === 2)
  if (!light || heavy.length !== 3) throw new RangeError(`No hydride data for group ${group}`)
  const meanX = heavy.reduce((s, h) => s + h.period, 0) / heavy.length
  const meanY = heavy.reduce((s, h) => s + h.boilingPointK, 0) / heavy.length
  const slope = heavy.reduce((s, h) => s + (h.period - meanX) * (h.boilingPointK - meanY), 0)
    / heavy.reduce((s, h) => s + (h.period - meanX) ** 2, 0)
  const expectedK = meanY + slope * (light.period - meanX)
  return {
    formula: light.formula,
    observedK: light.boilingPointK,
    expectedK,
    anomalyK: light.boilingPointK - expectedK,
  }
}
