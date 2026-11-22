/**
 * Model for the Section 4.3.5 Electrode Potential Lab. Every number comes from the d-block lib:
 * the energy cycle uses Table 4.4 (electrodeCycle, ruling R7); the hydrogen rule uses E°(M²⁺/M).
 */
import { electrodeCycle, liberatesH2FromDiluteAcid } from './dblock'

/** The 3d metals the lab can show, in NCERT order. */
export const LAB_METALS = ['Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'] as const
export type LabMetal = (typeof LAB_METALS)[number]

/** Negative E° but passive in practice: no visible hydrogen (the Section's note). */
export const PASSIVE_METALS: readonly LabMetal[] = ['Ti', 'V']

/** What the beaker shows: bubbles only for a negative E°, and not for the passive metals. */
export type GasState = 'bubbles' | 'none-positive' | 'passive'

export interface LabMetalReadout {
  symbol: LabMetal
  /** kJ mol⁻¹, Table 4.4. */
  atomisation: number
  /** IE₁ + IE₂, kJ mol⁻¹. */
  ionisation: number
  /** kJ mol⁻¹, negative. */
  hydration: number
  /** Cycle total, kJ mol⁻¹. Always positive across Ti to Zn. */
  sum: number
  /** E°(M²⁺/M) in V. */
  eStandard: number
  gas: GasState
}

export function labReadout(symbol: LabMetal): LabMetalReadout {
  const c = electrodeCycle(symbol)
  let gas: GasState = 'none-positive'
  if (liberatesH2FromDiluteAcid(symbol) === true) {
    gas = PASSIVE_METALS.includes(symbol) ? 'passive' : 'bubbles'
  }
  return {
    symbol,
    atomisation: c.atomisation,
    ionisation: c.ie1PlusIe2,
    hydration: c.hydration,
    sum: c.sum,
    eStandard: c.eStandard,
    gas,
  }
}

/** The three cycle steps in order: atomisation, IE₁ + IE₂, hydration. */
export function cycleSteps(r: LabMetalReadout): number[] {
  return [r.atomisation, r.ionisation, r.hydration]
}

/** Signed kJ mol⁻¹ with a real minus sign: "+921", "−2121". */
export function signedKj(value: number): string {
  return value >= 0 ? `+${value}` : `−${Math.abs(value)}`
}

/** Signed volts to two places with a real minus sign: "+0.34", "−1.63". */
export function signedVolt(value: number): string {
  return value >= 0 ? `+${value.toFixed(2)}` : `−${Math.abs(value).toFixed(2)}`
}
