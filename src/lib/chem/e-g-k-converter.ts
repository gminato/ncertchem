/**
 * Model for the E°, ΔrG° and K converter (NCERT Class 12 Unit 2, Sec. 2.3.1 to 2.3.2, Eqs. 2.14 to 2.16).
 * Each preset is a cell reaction written as the cathode (reduction) and anode (oxidation) half-reactions
 * taken from Table 2.1. E°cell, n, ΔrG° and log K all follow from the table and the existing libs.
 */

import { gibbsFromCellKJ, log10KFromE } from './electrochemical-cell'
import { nernstLog10Slope } from './nernst'
import { NCERT_STANDARD_POTENTIALS, T_REFERENCE_K, type StandardPotentialRow } from './ncert-c12-unit2-tables'

export interface ConverterPreset {
  readonly id: string
  readonly label: string
  /** Table 2.1 id of the couple that is reduced (cathode). */
  readonly cathodeId: string
  /** Table 2.1 id of the couple whose reduced form is oxidised (anode). */
  readonly anodeId: string
  /** Cathode half-reaction as balanced for the overall equation. */
  readonly cathodeHalf: string
  /** Anode half-reaction as balanced for the overall equation (oxidation). */
  readonly anodeHalf: string
  /** Overall cell reaction, balanced with the same electron count n. */
  readonly overall: string
}

export const CONVERTER_PRESETS: readonly ConverterPreset[] = [
  {
    id: 'ag-zn',
    label: 'Ag⁺ / Zn²⁺',
    cathodeId: 'Ag+/Ag',
    anodeId: 'Zn2+/Zn',
    cathodeHalf: '2Ag⁺ + 2e⁻ → 2Ag(s)',
    anodeHalf: 'Zn(s) → Zn²⁺ + 2e⁻',
    overall: '2Ag⁺(aq) + Zn(s) → 2Ag(s) + Zn²⁺(aq)',
  },
  {
    id: 'fe-zn',
    label: 'Fe²⁺ / Zn²⁺',
    cathodeId: 'Fe2+/Fe',
    anodeId: 'Zn2+/Zn',
    cathodeHalf: 'Fe²⁺ + 2e⁻ → Fe(s)',
    anodeHalf: 'Zn(s) → Zn²⁺ + 2e⁻',
    overall: 'Fe²⁺(aq) + Zn(s) → Fe(s) + Zn²⁺(aq)',
  },
  {
    id: 'cl-fe',
    label: 'Cl₂ / Fe²⁺',
    cathodeId: 'Cl2/Cl-',
    anodeId: 'Fe3+/Fe2+',
    cathodeHalf: 'Cl₂(g) + 2e⁻ → 2Cl⁻(aq)',
    anodeHalf: '2Fe²⁺(aq) → 2Fe³⁺(aq) + 2e⁻',
    overall: 'Cl₂(g) + 2Fe²⁺(aq) → 2Cl⁻(aq) + 2Fe³⁺(aq)',
  },
  {
    id: 'pb-sn',
    label: 'Pb²⁺ / Sn²⁺',
    cathodeId: 'Pb2+/Pb',
    anodeId: 'Sn2+/Sn',
    cathodeHalf: 'Pb²⁺ + 2e⁻ → Pb(s)',
    anodeHalf: 'Sn(s) → Sn²⁺ + 2e⁻',
    overall: 'Pb²⁺(aq) + Sn(s) → Pb(s) + Sn²⁺(aq)',
  },
  {
    id: 'ni-mg',
    label: 'Ni²⁺ / Mg²⁺',
    cathodeId: 'Ni2+/Ni',
    anodeId: 'Mg2+/Mg',
    cathodeHalf: 'Ni²⁺ + 2e⁻ → Ni(s)',
    anodeHalf: 'Mg(s) → Mg²⁺ + 2e⁻',
    overall: 'Ni²⁺(aq) + Mg(s) → Ni(s) + Mg²⁺(aq)',
  },
  {
    id: 'ag-fe',
    label: 'Ag⁺ / Fe²⁺',
    cathodeId: 'Ag+/Ag',
    anodeId: 'Fe3+/Fe2+',
    cathodeHalf: 'Ag⁺ + e⁻ → Ag(s)',
    anodeHalf: 'Fe²⁺(aq) → Fe³⁺(aq) + e⁻',
    overall: 'Ag⁺(aq) + Fe²⁺(aq) → Ag(s) + Fe³⁺(aq)',
  },
  {
    id: 'au-zn',
    label: 'Au³⁺ / Zn²⁺',
    cathodeId: 'Au3+/Au',
    anodeId: 'Zn2+/Zn',
    cathodeHalf: '2Au³⁺ + 6e⁻ → 2Au(s)',
    anodeHalf: '3Zn(s) → 3Zn²⁺ + 6e⁻',
    overall: '2Au³⁺(aq) + 3Zn(s) → 2Au(s) + 3Zn²⁺(aq)',
  },
  {
    id: 'zn-cu',
    label: 'Zn²⁺ / Cu²⁺ (as written, not spontaneous)',
    cathodeId: 'Zn2+/Zn',
    anodeId: 'Cu2+/Cu',
    cathodeHalf: 'Zn²⁺ + 2e⁻ → Zn(s)',
    anodeHalf: 'Cu(s) → Cu²⁺ + 2e⁻',
    overall: 'Zn²⁺(aq) + Cu(s) → Zn(s) + Cu²⁺(aq)',
  },
]

/** Temperatures at or near 298 K use NCERT's 0.059 V slope (lib convention); other values use RT/F exactly. */
export function thermoTemperature(tempK: number): number | undefined {
  return tempK === T_REFERENCE_K ? undefined : tempK
}

export function findCouple(id: string): StandardPotentialRow {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Unknown Table 2.1 couple: ${id}`)
  return row
}

export function leastCommonMultiple(a: number, b: number): number {
  const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y))
  return (a * b) / gcd(a, b)
}

export interface PresetThermo {
  readonly cathode: StandardPotentialRow
  readonly anode: StandardPotentialRow
  /** Electrons in the balanced overall equation. */
  readonly n: number
  /** E°cell / V = E°(cathode) − E°(anode). */
  readonly eCell: number
  /** ΔrG° in kJ mol⁻¹ = −nFE°cell. */
  readonly gibbsKJ: number
  /** log₁₀K at the chosen temperature. */
  readonly log10K: number
}

export function presetThermo(preset: ConverterPreset, tempK: number): PresetThermo {
  const cathode = findCouple(preset.cathodeId)
  const anode = findCouple(preset.anodeId)
  const n = leastCommonMultiple(cathode.electrons, anode.electrons)
  const eCell = cathode.e0 - anode.e0
  return {
    cathode,
    anode,
    n,
    eCell,
    gibbsKJ: gibbsFromCellKJ(n, eCell),
    log10K: log10KFromE(n, eCell, thermoTemperature(tempK)),
  }
}

export interface ScientificParts {
  /** Mantissa in [1, 10) at the requested number of decimals. */
  readonly mantissa: string
  readonly exponent: number
}

/** Splits 10^log10 into a mantissa and an integer exponent, so any finite log10 is representable. */
export function scientificFromLog10(log10: number, decimals = 2): ScientificParts {
  let exponent = Math.floor(log10)
  let mantissa = 10 ** (log10 - exponent)
  let text = mantissa.toFixed(decimals)
  if (Number(text) >= 10) {
    exponent += 1
    mantissa = 10 ** (log10 - exponent)
    text = mantissa.toFixed(decimals)
  }
  return { mantissa: text, exponent }
}

export interface ProgressState {
  /** log₁₀ Q at this progress: 0 for a fresh cell (Q = 1), log₁₀K at equilibrium. */
  readonly log10Q: number
  /** Cell potential E = E°cell − (slope) log₁₀Q, in volts. */
  readonly eCell: number
  /** Actual ΔrG = −nFE in kJ mol⁻¹. */
  readonly gibbsKJ: number
}

/**
 * Cell state after a fraction of the discharge. progress runs from 0 (fresh cell) to 1 (equilibrium,
 * Q = K). Because log Q = progress × log K, E falls linearly on the log scale and is exactly 0 at progress 1.
 */
export function stateAtProgress(thermo: PresetThermo, progress: number, tempK: number): ProgressState {
  const clamped = Math.min(1, Math.max(0, progress))
  const log10Q = clamped * thermo.log10K
  const slope = nernstLog10Slope(thermo.n, thermoTemperature(tempK))
  const raw = thermo.eCell - slope * log10Q
  const eCell = Math.abs(raw) < 1e-12 ? 0 : raw
  // "+ 0" turns -0 into 0 so a finished cell reads as exactly zero.
  return { log10Q, eCell, gibbsKJ: gibbsFromCellKJ(thermo.n, eCell) + 0 }
}

export type Verdict = 'spontaneous' | 'equilibrium' | 'reverse'

/** Direction of the reaction as written, from the sign of E°cell. */
export function verdictFor(eCell: number): Verdict {
  if (Math.abs(eCell) < 1e-9) return 'equilibrium'
  return eCell > 0 ? 'spontaneous' : 'reverse'
}
