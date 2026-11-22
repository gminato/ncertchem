import {
  NCERT_TABLE_6_2,
  type CarbonHalogenBond,
  type Halogen,
} from '@/lib/chem/ncert-c12-unit6-data'

/** Halogens in group order, F → I (the order every Step and the explorer use). */
export const HALOGEN_ORDER: readonly Halogen[] = ['F', 'Cl', 'Br', 'I']

export interface CxBondStepState {
  /** Rows drawn: one CH₃–X row per halogen listed here. */
  rows: readonly Halogen[]
  /** Row drawn at zoom (Step 1: the single lopsided pair). */
  zoom: boolean
  /** Electron cloud pulled toward the halogen. */
  cloud: boolean
  /** Bond length (pm) shown above each bond, with the 100 pm scale bar. */
  showLength: boolean
  /** Bar column: enthalpy bars, dipole arrows, or nothing. */
  readout: 'none' | 'enthalpy' | 'dipole'
  /** Row emphasised with its δ+ carbon. */
  focus: Halogen | null
  /** Rows drawn faded. */
  dim: readonly Halogen[]
  /** Lone-pair nucleophile drawn approaching the δ+ carbon of the focus row. */
  approach: boolean
}

/** Target state for each Step (0-based, as Scrolly passes it). */
export function getCxBondStepState(step: number): CxBondStepState {
  const base: CxBondStepState = {
    rows: HALOGEN_ORDER,
    zoom: false,
    cloud: false,
    showLength: false,
    readout: 'none',
    focus: null,
    dim: [],
    approach: false,
  }
  switch (step) {
    case 0:
      return { ...base, rows: ['Cl'], zoom: true, cloud: true }
    case 1:
      return { ...base, showLength: true }
    case 2:
      return { ...base, showLength: true, readout: 'enthalpy' }
    case 3:
      return { ...base, readout: 'dipole', focus: 'Cl', dim: ['F'] }
    default:
      return { ...base, focus: 'I', dim: ['F', 'Cl', 'Br'], approach: true }
  }
}

/** Table 6.2 row for a halogen. Throws if the lead data is missing it. */
export function bondRow(h: Halogen): CarbonHalogenBond {
  const row = NCERT_TABLE_6_2.find((r) => r.halogen === h)
  if (!row) throw new Error(`No Table 6.2 row for ${h}`)
  return row
}

/** Bond enthalpy difference C–F minus C–I in CH₃–X (kJ mol⁻¹), from Table 6.2. */
export function enthalpyDifferenceFI(): number {
  return bondRow('F').enthalpyKjPerMol - bondRow('I').enthalpyKjPerMol
}

/** The halogen whose CH₃–X has the largest dipole moment in Table 6.2. */
export function largestDipoleHalogen(): Halogen {
  return HALOGEN_ORDER.reduce((best, h) =>
    bondRow(h).dipoleDebye > bondRow(best).dipoleDebye ? h : best,
  )
}
