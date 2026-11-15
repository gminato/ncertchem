/**
 * Pure model for the pH visuals of Section 6.11 (Kw and pH). Every number comes from the acid-base
 * library: pH, pOH, [H₃O⁺] and [OH⁻] are never typed in here.
 */

import { kw, strongAcidPH, strongBasePH } from '@/lib/chem/acid-base'

/** Kw at 298 K, the reference temperature of NCERT. */
export const REFERENCE_T_K = 298

/** One solution (or pure water) at one temperature, with every quantity the visuals need. */
export interface PhFrame {
  label: string
  temperatureK: number
  /** −log₁₀ Kw at this temperature. */
  pKw: number
  /** pH from the library. */
  pH: number
  /** pOH = pKw − pH. */
  pOH: number
  /** [H₃O⁺] in mol L⁻¹, 10^(−pH). */
  hPlus: number
  /** [OH⁻] in mol L⁻¹, Kw / [H₃O⁺]. */
  oh: number
  /** pH of pure water at this temperature, pKw / 2. */
  neutralPH: number
  /** The part of [H₃O⁺] that comes from water, Kw / [H₃O⁺] (equal to [OH⁻]). */
  waterHPlus: number
}

/** Kw at a temperature (library, van 't Hoff from 298 K). */
export function kwAt(temperatureK: number): number {
  return kw(temperatureK)
}

/** Neutral pH of pure water at a temperature: [H₃O⁺] = [OH⁻] = √Kw. */
export function neutralPH(temperatureK: number): number {
  return -Math.log10(Math.sqrt(kwAt(temperatureK)))
}

function frameFrom(label: string, temperatureK: number, pHValue: number): PhFrame {
  const kwValue = kwAt(temperatureK)
  const hPlus = 10 ** -pHValue
  const oh = kwValue / hPlus
  const pKw = -Math.log10(kwValue)
  return {
    label,
    temperatureK,
    pKw,
    pH: pHValue,
    pOH: pKw - pHValue,
    hPlus,
    oh,
    neutralPH: neutralPH(temperatureK),
    waterHPlus: oh,
  }
}

/** Pure water at a temperature: pH equals the neutral pH. */
export function waterFrame(temperatureK: number, label = 'Pure water'): PhFrame {
  return frameFrom(label, temperatureK, neutralPH(temperatureK))
}

/** A strong acid of molarity c, with the water term included (library strongAcidPH). */
export function strongAcidFrame(c: number, temperatureK = REFERENCE_T_K, label?: string): PhFrame {
  return frameFrom(label ?? `${c} M strong acid`, temperatureK, strongAcidPH(c, temperatureK))
}

/** A strong base of molarity c, with the water term included (library strongBasePH). */
export function strongBaseFrame(c: number, temperatureK = REFERENCE_T_K, label?: string): PhFrame {
  return frameFrom(label ?? `${c} M strong base`, temperatureK, strongBasePH(c, temperatureK))
}

/**
 * Concentration exponents for the explorer's dilution: c = 10ⁿ mol L⁻¹ for n from 0 down to −9.
 * Each step is a factor of ten, and the lowest value is where the water term decides the pH.
 */
export const DILUTION_EXPONENTS = [0, -1, -2, -3, -4, -5, -6, -7, -8, -9] as const
