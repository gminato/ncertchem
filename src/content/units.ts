/**
 * The Units of the Syllabus Map that have a title. A Unit page exists for each
 * entry, even before its Sections are written.
 */
export interface UnitInfo {
  class: 11 | 12
  unit: number
  title: string
}

export const UNITS: readonly UnitInfo[] = [
  { class: 11, unit: 1, title: 'Some Basic Concepts of Chemistry' },
  { class: 11, unit: 2, title: 'Structure of Atom' },
  { class: 11, unit: 3, title: 'Classification of Elements and Periodicity in Properties' },
  { class: 11, unit: 4, title: 'Chemical Bonding and Molecular Structure' },
  { class: 11, unit: 5, title: 'Thermodynamics' },
  { class: 11, unit: 6, title: 'Equilibrium' },
  { class: 11, unit: 7, title: 'Redox Reactions' },
  { class: 11, unit: 8, title: 'Organic Chemistry – Some Basic Principles and Techniques' },
  { class: 11, unit: 9, title: 'Hydrocarbons' },
  { class: 12, unit: 1, title: 'Solutions' },
  { class: 12, unit: 2, title: 'Electrochemistry' },
  { class: 12, unit: 3, title: 'Chemical Kinetics' },
  { class: 12, unit: 4, title: 'The d- and f-Block Elements' },
  { class: 12, unit: 5, title: 'Coordination Compounds' },
  { class: 12, unit: 6, title: 'Haloalkanes and Haloarenes' },
  { class: 12, unit: 7, title: 'Alcohols, Phenols and Ethers' },
  { class: 12, unit: 8, title: 'Aldehydes, Ketones and Carboxylic Acids' },
  { class: 12, unit: 9, title: 'Amines' },
  { class: 12, unit: 10, title: 'Biomolecules' },
]

/** The Units of one class, in book order. */
export function unitsForClass(cls: number): UnitInfo[] {
  return UNITS.filter((u) => u.class === cls)
}

/** Finds a Unit by class and unit number. */
export function findUnit(cls: number, unit: number): UnitInfo | undefined {
  return UNITS.find((u) => u.class === cls && u.unit === unit)
}
