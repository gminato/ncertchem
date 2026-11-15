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
]

/** Finds a Unit by class and unit number. */
export function findUnit(cls: number, unit: number): UnitInfo | undefined {
  return UNITS.find((u) => u.class === cls && u.unit === unit)
}
