import { NCERT_STANDARD_POTENTIALS } from './ncert-c12-unit2-tables'
import { standardCellPotential } from './electrochemical-cell'
import { massDeposited } from './electrolysis'

/**
 * Model for the Opposing Voltage Lab: a Daniell cell wired against an
 * adjustable DC source. Everything here is at unit ion concentration.
 */

/** Standard atomic masses, g mol⁻¹ (IUPAC), for Zn and Cu electrode mass changes. */
export const MOLAR_MASS_ZN = 65.38
export const MOLAR_MASS_CU = 63.55

/** Schematic internal resistance expressed as mA of current per volt of net EMF. Illustrative only. */
export const ILLUSTRATIVE_MA_PER_VOLT = 100

/** Balanced when |Eext − Ecell| is within this tolerance, in volts. */
export const BALANCE_TOLERANCE_V = 0.005

export type OpposingMode = 'galvanic' | 'balanced' | 'electrolytic'

function standardPotential(id: string): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Missing standard potential row: ${id}`)
  return row.e0
}

/** E°cell of the Daniell cell, Cu²⁺/Cu cathode against Zn²⁺/Zn anode, rounded to 0.01 V. */
export const DANIELL_EMF_V = Number(
  standardCellPotential(standardPotential('Cu2+/Cu'), standardPotential('Zn2+/Zn')).toFixed(2),
)

/** Eext below the cell EMF is galvanic, equal is balanced, above is electrolytic. */
export function opposingMode(
  eExtV: number,
  eCellV: number = DANIELL_EMF_V,
  toleranceV: number = BALANCE_TOLERANCE_V,
): OpposingMode {
  const net = eCellV - eExtV
  if (Math.abs(net) <= toleranceV) return 'balanced'
  return net > 0 ? 'galvanic' : 'electrolytic'
}

/**
 * Schematic current in mA, signed. Positive: galvanic, electrons flow from the
 * zinc electrode to the copper electrode through the external wire. Negative:
 * the source has overpowered the cell and the reaction is reversed.
 */
export function schematicCurrentMilliAmp(
  eExtV: number,
  eCellV: number = DANIELL_EMF_V,
): number {
  const net = eCellV - eExtV
  if (Math.abs(net) <= BALANCE_TOLERANCE_V) return 0
  return Math.round(net * ILLUSTRATIVE_MA_PER_VOLT * 10) / 10
}

/**
 * Mass change of each electrode after `minutes` at the schematic current, in
 * grams. Negative means the electrode lost mass. Zinc loses mass and copper
 * gains it in the galvanic mode; the reverse happens in the electrolytic mode.
 */
export function electrodeMassChangeG(
  eExtV: number,
  minutes: number,
  eCellV: number = DANIELL_EMF_V,
): { zn: number; cu: number } {
  const currentA = Math.abs(schematicCurrentMilliAmp(eExtV, eCellV)) / 1000
  const charge = currentA * minutes * 60
  const mZn = massDeposited({ charge, molarMass: MOLAR_MASS_ZN, electrons: 2 })
  const mCu = massDeposited({ charge, molarMass: MOLAR_MASS_CU, electrons: 2 })
  const sign = opposingMode(eExtV, eCellV) === 'electrolytic' ? 1 : -1
  if (opposingMode(eExtV, eCellV) === 'balanced') return { zn: 0, cu: 0 }
  return { zn: sign * mZn, cu: -sign * mCu }
}
