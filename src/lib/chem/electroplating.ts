/**
 * Electroplating arithmetic for the Electroplating Lab (NCERT Class 12 Unit 2, Sec. 2.5).
 * Charge, moles of electrons and masses come from electrolysis.ts and FARADAY; electron
 * counts come from the NCERT Table 2.1 rows; molar masses come from elements.ts.
 */

import { ELEMENTS } from './elements'
import { NCERT_STANDARD_POTENTIALS, FARADAY } from './ncert-c12-unit2-tables'
import { chargeFromCurrent, massDeposited, massesInSeries, molesOfElectrons } from './electrolysis'

export type PlatingMetalId = 'Ag' | 'Cu' | 'Ni'

export interface PlatingMetal {
  readonly id: PlatingMetalId
  /** Plain-text ion, e.g. "Ag⁺", built from the electron count. */
  readonly ion: string
  /** Ionic charge as text for the Ion drawing, e.g. "+" or "2+". */
  readonly charge: string
  /** Plain-text salt used for the bath, e.g. "AgNO₃". */
  readonly salt: string
  /** The anion that travels with the bath salt. */
  readonly anion: { readonly formula: string; readonly charge: string }
  /** Table 2.1 id of the couple whose electron count is used. */
  readonly couple: 'Ag+/Ag' | 'Cu2+/Cu' | 'Ni2+/Ni'
  /** Electrons per ion in the deposition reaction (Table 2.1). */
  readonly electrons: number
  /** Standard atomic mass from elements.ts, g mol⁻¹. */
  readonly molarMass: number
}

const SUPER: Record<string, string> = { '1': '¹', '2': '²', '3': '³' }

/** Ionic charge for a cation with `n` electrons per ion: n = 1 gives "+", n = 2 gives "²⁺". */
export function ionLabel(symbol: string, n: number): string {
  return n === 1 ? `${symbol}⁺` : `${symbol}${SUPER[String(n)] ?? String(n)}⁺`
}

function tableElectrons(couple: PlatingMetal['couple']): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === couple)
  if (!row) throw new RangeError(`No Table 2.1 row for ${couple}`)
  return row.electrons
}

function plating(
  id: PlatingMetalId,
  symbol: keyof typeof ELEMENTS,
  couple: PlatingMetal['couple'],
  salt: string,
  anion: PlatingMetal['anion'],
): PlatingMetal {
  const electrons = tableElectrons(couple)
  return {
    id,
    ion: ionLabel(symbol, electrons),
    charge: electrons === 1 ? '+' : `${electrons}+`,
    salt,
    anion,
    couple,
    electrons,
    molarMass: ELEMENTS[symbol].atomicMass,
  }
}

/** Metals that plate well from an aqueous bath. Aluminium is left out: it cannot be deposited from water. */
export const PLATING_METALS: readonly PlatingMetal[] = [
  plating('Ag', 'Ag', 'Ag+/Ag', 'AgNO₃', { formula: 'NO3', charge: '-' }),
  plating('Cu', 'Cu', 'Cu2+/Cu', 'CuSO₄', { formula: 'SO4', charge: '2-' }),
  plating('Ni', 'Ni', 'Ni2+/Ni', 'NiSO₄', { formula: 'SO4', charge: '2-' }),
]

export function platingMetal(id: PlatingMetalId): PlatingMetal {
  const metal = PLATING_METALS.find((m) => m.id === id)
  if (!metal) throw new RangeError(`Unknown plating metal: ${id}`)
  return metal
}

/** Electrons per ion in the deposition reaction. */
export function electronsPerIon(metal: PlatingMetal): number {
  return metal.electrons
}

/**
 * Round half up to `dp` decimals and format with exactly `dp` digits. Scaling the decimal
 * string (not the binary value) keeps exact halves: 63.55 / 2 = 31.775 gives "31.78", where
 * toFixed(2) gives "31.77".
 */
export function formatHalfUp(x: number, dp: number): string {
  const rounded = Number(`${Math.round(Number(`${x}e${dp}`))}e-${dp}`)
  return rounded.toFixed(dp)
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
