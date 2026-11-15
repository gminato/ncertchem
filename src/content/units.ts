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
]

/** Finds a Unit by class and unit number. */
export function findUnit(cls: number, unit: number): UnitInfo | undefined {
  return UNITS.find((u) => u.class === cls && u.unit === unit)
}
