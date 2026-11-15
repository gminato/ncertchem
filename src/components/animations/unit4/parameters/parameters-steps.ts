import { covalentRadius, estimateBondLength, resonanceAverageBondOrder } from '@/lib/chem/bond-parameters'
import {
  NCERT_FIG_4_21_MO_DATA,
  NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS,
  NCERT_TABLE_4_3_MOLECULE_BOND_LENGTHS,
  NCERT_TEXT_BOND_LENGTHS,
  NCERT_TEXT_ENTHALPIES,
} from '@/lib/chem/ncert-unit4-tables'

/** Number of Steps in each Scrolly of Section 4.3. */
export const BOND_LENGTH_STEP_COUNT = 4
export const BOND_ORDER_STEP_COUNT = 5
export const RESONANCE_STEP_COUNT = 5

/** Clamps a Step index to the Steps a Scrolly defines. */
export function clampStep(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

// ---------------------------------------------------------------------------
// 4.3.1 Bond length: two carbon atoms touching at their covalent radii
// ---------------------------------------------------------------------------

export interface BondLengthTarget {
  /** Bond order used for the radius, 1 to 3. */
  bondOrder: 1 | 2 | 3
  /** Covalent radius of each carbon atom, pm (Table 4.4). */
  radiusPm: number
  /** 0 when the second atom is not yet placed, 1 when it touches the first. */
  second: number
  /** Bond length between the two nuclei, pm: the sum of the two radii. */
  lengthPm: number
}

/** Target state for each Step of the bond-length Scrolly. */
export function bondLengthTarget(step: number): BondLengthTarget {
  const s = clampStep(step, BOND_LENGTH_STEP_COUNT)
  const bondOrder: 1 | 2 | 3 = s === 2 ? 2 : s === 3 ? 3 : 1
  return {
    bondOrder,
    radiusPm: covalentRadius('C', bondOrder),
    second: s >= 1 ? 1 : 0,
    lengthPm: s >= 1 ? estimateBondLength('C', 'C', bondOrder) : 0,
  }
}

// ---------------------------------------------------------------------------
// 4.3.4 Bond order against bond length and bond enthalpy
// ---------------------------------------------------------------------------

export interface BondOrderSpecies {
  id: 'H2' | 'O2' | 'N2' | 'F2' | 'carbon'
  label: string
  bondOrder: number
  /** Bond length, pm: Table 4.3 for diatomics, Table 4.2 for the carbon family (C–C shown). */
  lengthPm: number
  /** Bond enthalpy, kJ mol⁻¹, or null when this Section gives no value for the species. */
  enthalpyKj: number | null
  /** Where the length and the enthalpy come from, for the on-screen source line. */
  source: string
}

function printedLength(molecule: string): number {
  const row = NCERT_TABLE_4_3_MOLECULE_BOND_LENGTHS.rows.find((r) => r.molecule === molecule)
  if (!row) throw new RangeError(`No Table 4.3 length for ${molecule}`)
  return row.lengthPm
}

function printedAverageLength(bond: string): number {
  const row = NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS.rows.find((r) => r.bond === bond)
  if (!row) throw new RangeError(`No Table 4.2 length for ${bond}`)
  return row.lengthPm
}

function printedEnthalpy(prefix: string): number {
  const row = NCERT_TEXT_ENTHALPIES.find((q) => q.label.startsWith(prefix))
  if (!row) throw new RangeError(`No enthalpy for ${prefix}`)
  return row.value
}

function fig421Energy(species: string): number {
  const row = NCERT_FIG_4_21_MO_DATA.rows.find((r) => r.species === species)
  if (!row || row.bondEnergyKj === null) throw new RangeError(`No Fig. 4.21 energy for ${species}`)
  return row.bondEnergyKj
}

/** The five species shown, in Step order. */
export const BOND_ORDER_SPECIES: readonly BondOrderSpecies[] = [
  {
    id: 'H2',
    label: 'H₂',
    bondOrder: 1,
    lengthPm: printedLength('H2'),
    enthalpyKj: printedEnthalpy('H–H bond enthalpy'),
    source: 'Length: Table 4.3. Enthalpy: Section 4.3.3 text.',
  },
  {
    id: 'O2',
    label: 'O₂',
    bondOrder: 2,
    lengthPm: printedLength('O2'),
    enthalpyKj: printedEnthalpy('O=O bond enthalpy'),
    source: 'Length: Table 4.3. Enthalpy: Section 4.3.3 text.',
  },
  {
    id: 'N2',
    label: 'N₂',
    bondOrder: 3,
    lengthPm: printedLength('N2'),
    enthalpyKj: printedEnthalpy('N≡N bond enthalpy'),
    source: 'Length: Table 4.3. Enthalpy: Section 4.3.4 text.',
  },
  {
    id: 'F2',
    label: 'F₂',
    bondOrder: 1,
    lengthPm: printedLength('F2'),
    enthalpyKj: fig421Energy('F2'),
    source: 'Length: Table 4.3. Enthalpy: Fig. 4.21 bar chart.',
  },
  {
    id: 'carbon',
    label: 'C–C, C=C, C≡C',
    bondOrder: 1,
    lengthPm: printedAverageLength('C–C'),
    enthalpyKj: null,
    source: 'Lengths: Table 4.2 (single, double and triple bonds).',
  },
]

/** Carbon's three bonds, from Table 4.2. */
export const CARBON_BONDS: readonly { label: string; order: 1 | 2 | 3; lengthPm: number }[] = [
  { label: 'C–C', order: 1, lengthPm: printedAverageLength('C–C') },
  { label: 'C=C', order: 2, lengthPm: printedAverageLength('C=C') },
  { label: 'C≡C', order: 3, lengthPm: printedAverageLength('C≡C') },
]

export interface BondOrderTarget {
  /** Index into BOND_ORDER_SPECIES shown in the Lewis panel, or -1 for the carbon trio. */
  species: number
  /** Bar length for the bond length, pm. */
  lengthPm: number
  /** Bar length for the bond enthalpy, kJ mol⁻¹. Zero when no enthalpy is shown. */
  enthalpyKj: number
  /** 1 when the enthalpy row is shown. */
  showEnthalpy: number
}

/** Target state for each Step of the bond-order Scrolly. */
export function bondOrderTarget(step: number): BondOrderTarget {
  const s = clampStep(step, BOND_ORDER_STEP_COUNT)
  const species = BOND_ORDER_SPECIES[s]
  const hasEnthalpy = species.enthalpyKj !== null
  return {
    species: s === 4 ? -1 : s,
    lengthPm: species.lengthPm,
    enthalpyKj: species.enthalpyKj ?? 0,
    showEnthalpy: hasEnthalpy ? 1 : 0,
  }
}

// ---------------------------------------------------------------------------
// 4.3.5 Resonance: ozone as two canonical forms and one hybrid
// ---------------------------------------------------------------------------

export interface ResonanceTarget {
  /** Canonical form I (double bond on the left) visible: 0 or 1. */
  formI: number
  /** Canonical form II (double bond on the right) visible: 0 or 1. */
  formII: number
  /** Double-headed resonance arrow between the forms. */
  arrow: number
  /** Hybrid drawn with 1.5-order bonds. */
  hybrid: number
  /** Number line of bond order against bond length. */
  scale: number
}

/** Target state for each Step of the resonance Scrolly. */
export function resonanceTarget(step: number): ResonanceTarget {
  const s = clampStep(step, RESONANCE_STEP_COUNT)
  return {
    formI: s === 0 || s === 2 ? 1 : 0,
    formII: s === 1 || s === 2 ? 1 : 0,
    arrow: s === 2 ? 1 : 0,
    hybrid: s === 3 || s === 4 ? 1 : 0,
    scale: s === 4 ? 1 : 0,
  }
}

/** The O–O bond lengths of ozone: the two canonical forms' single and double bonds, and the measured value, pm. */
export const OZONE_LENGTHS = {
  single: NCERT_TEXT_BOND_LENGTHS[0].value,
  double: NCERT_TEXT_BOND_LENGTHS[1].value,
  measured: NCERT_TEXT_BOND_LENGTHS[2].value,
} as const

/** The average bond order of each O–O bond of ozone: (2 + 1) / 2. */
export const OZONE_AVERAGE_ORDER = resonanceAverageBondOrder('O3')
