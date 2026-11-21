/**
 * Electroplating arithmetic for the Electroplating Lab (NCERT Class 12 Unit 2, Sec. 2.5).
 * Charge, moles of electrons and masses come from electrolysis.ts and FARADAY; electron
 * counts come from the NCERT Table 2.1 rows. Only the molar masses are supplied here.
 */

import { NCERT_STANDARD_POTENTIALS, FARADAY } from './ncert-c12-unit2-tables'
import { chargeFromCurrent, massDeposited, massesInSeries, molesOfElectrons } from './electrolysis'

export type PlatingMetalId = 'Ag' | 'Cu' | 'Ni'

export interface PlatingMetal {
  readonly id: PlatingMetalId
  /** Plain-text ion, e.g. "Ag⁺". */
  readonly ion: string
  /** Plain-text salt used for the bath, e.g. "AgNO₃". */
  readonly salt: string
  /** Table 2.1 id of the couple whose electron count is used. */
  readonly couple: 'Ag+/Ag' | 'Cu2+/Cu' | 'Ni2+/Ni'
  /** Standard atomic mass, g mol⁻¹ (IUPAC two-decimal values). */
  readonly molarMass: number
}

/** Metals that plate well from an aqueous bath. Aluminium is left out: it cannot be deposited from water. */
export const PLATING_METALS: readonly PlatingMetal[] = [
  { id: 'Ag', ion: 'Ag⁺', salt: 'AgNO₃', couple: 'Ag+/Ag', molarMass: 107.87 },
  { id: 'Cu', ion: 'Cu²⁺', salt: 'CuSO₄', couple: 'Cu2+/Cu', molarMass: 63.55 },
  { id: 'Ni', ion: 'Ni²⁺', salt: 'NiSO₄', couple: 'Ni2+/Ni', molarMass: 58.69 },
]

export function platingMetal(id: PlatingMetalId): PlatingMetal {
  const metal = PLATING_METALS.find((m) => m.id === id)
  if (!metal) throw new RangeError(`Unknown plating metal: ${id}`)
  return metal
}

/** Electrons per ion in the deposition reaction, read from the Table 2.1 row. */
export function electronsPerIon(metal: PlatingMetal): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === metal.couple)
  if (!row) throw new RangeError(`No Table 2.1 row for ${metal.couple}`)
  return row.electrons
}

export interface PlatingReadout {
  /** Q = I × t, coulombs. */
  readonly charge: number
  /** Q / F, moles of electrons. */
  readonly molesOfElectrons: number
  /** Mass deposited, grams. */
  readonly massG: number
  readonly electrons: number
}

/** Readout for one cell: Q, n(e⁻) and the mass deposited on the cathode. */
export function platingReadout(metal: PlatingMetal, currentA: number, timeS: number): PlatingReadout {
  const charge = chargeFromCurrent(currentA, timeS)
  const electrons = electronsPerIon(metal)
  return {
    charge,
    molesOfElectrons: molesOfElectrons(charge, FARADAY),
    massG: massDeposited({ charge, molarMass: metal.molarMass, electrons }),
    electrons,
  }
}

/** Series mode: one charge Q flows through each cell, so each mass is proportional to M/n. */
export function seriesReadout(
  metals: readonly PlatingMetal[],
  currentA: number,
  timeS: number,
): { charge: number; masses: readonly number[] } {
  const charge = chargeFromCurrent(currentA, timeS)
  const masses = massesInSeries(
    charge,
    metals.map((m) => ({ molarMass: m.molarMass, electrons: electronsPerIon(m) })),
  )
  return { charge, masses }
}
