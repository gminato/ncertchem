/**
 * Resistance, conductance, conductivity and molar conductivity (NCERT Class 12 Unit 2, Sec. 2.4,
 * Eqs. 2.17 to 2.27, Examples 2.4 to 2.9). Conductivity κ is in S cm⁻¹ (or S m⁻¹ in SI helpers),
 * molar conductivity Λm in S cm² mol⁻¹, and concentration in mol L⁻¹ unless a function says otherwise.
 */

import { NCERT_LIMITING_ION_CONDUCTIVITY, type LimitingIonRow } from './ncert-c12-unit2-tables'

/** R = ρl/A. ρ in Ω m (or Ω cm with l and A in cm), l in m or cm, A in m² or cm². */
export function resistanceFromResistivity(rho: number, l: number, area: number): number {
  if (!(area > 0)) throw new RangeError(`Area must be positive, got ${area}`)
  return (rho * l) / area
}

/** Conductance G = 1/R, in siemens when R is in ohms. */
export function conductanceFromResistance(r: number): number {
  if (!(r > 0)) throw new RangeError(`Resistance must be positive, got ${r}`)
  return 1 / r
}

/** Conductivity κ = 1/ρ. */
export function conductivityFromResistivity(rho: number): number {
  if (!(rho > 0)) throw new RangeError(`Resistivity must be positive, got ${rho}`)
  return 1 / rho
}

/** Cell constant G* = l/A, in m⁻¹ (or cm⁻¹). */
export function cellConstant(l: number, area: number): number {
  if (!(area > 0)) throw new RangeError(`Area must be positive, got ${area}`)
  return l / area
}

/** Cell constant from a measured resistance and a reference conductivity: G* = R κ (Eq. 2.18). */
export function cellConstantFromReference(resistanceOhm: number, kappaRef: number): number {
  return resistanceOhm * kappaRef
}

/** Conductivity of an unknown solution from the cell constant and its measured resistance: κ = G* divided by R (Eq. 2.20). */
export function conductivityFromCell(cellConst: number, resistanceOhm: number): number {
  if (!(resistanceOhm > 0)) throw new RangeError(`Resistance must be positive, got ${resistanceOhm}`)
  return cellConst / resistanceOhm
}

/** Wheatstone bridge balance: unknown R2 = R1 R4 / R3 (Eq. 2.19, NCERT Fig. 2.5). */
export function unknownResistanceFromBridge(r1: number, r3: number, r4: number): number {
  if (!(r3 > 0)) throw new RangeError(`R3 must be positive, got ${r3}`)
  return (r1 * r4) / r3
}

/** Unit conversions. 1 S m⁻¹ = 0.01 S cm⁻¹; 1 S cm² mol⁻¹ = 10⁻⁴ S m² mol⁻¹. */
export const sPerCmToSPerM = (kappa: number): number => kappa * 100
export const sPerMToSPerCm = (kappa: number): number => kappa / 100
export const molarScm2ToSm2 = (lambda: number): number => lambda * 1e-4
export const molarSm2ToScm2 = (lambda: number): number => lambda * 1e4

/** Λm = κ × 1000 / c, with κ in S cm⁻¹ and c in mol L⁻¹, result in S cm² mol⁻¹. */
export function molarConductivityScm2(kappaScmInv: number, molPerL: number): number {
  if (!(molPerL > 0)) throw new RangeError(`Concentration must be positive, got ${molPerL}`)
  return (kappaScmInv * 1000) / molPerL
}

/** Λm = κ / c in SI: κ in S m⁻¹, c in mol m⁻³, result in S m² mol⁻¹. */
export function molarConductivitySm2(kappaSmInv: number, molPerM3: number): number {
  if (!(molPerM3 > 0)) throw new RangeError(`Concentration must be positive, got ${molPerM3}`)
  return kappaSmInv / molPerM3
}

export interface ConductanceDatum {
  /** Concentration, mol L⁻¹. */
  readonly c: number
  /** Molar conductivity, S cm² mol⁻¹. */
  readonly lambdaScm2: number
}

/**
 * Least-squares fit of Λm = Λ°m − A √c (Debye–Hückel–Onsager, Eq. 2.23) against √c.
 * Returns the intercept Λ°m and A = −slope, both in S cm² mol⁻¹ units (A per (mol L⁻¹)^½).
 */
export function fitDebyeHuckelOnsager(data: readonly ConductanceDatum[]): { lambda0Scm2: number; A: number } {
  if (data.length < 2) throw new RangeError('At least two data points are needed')
  const xs = data.map((d) => Math.sqrt(d.c))
  const ys = data.map((d) => d.lambdaScm2)
  const n = data.length
  const mx = xs.reduce((s, v) => s + v, 0) / n
  const my = ys.reduce((s, v) => s + v, 0) / n
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my)
    sxx += (xs[i] - mx) ** 2
  }
  if (sxx === 0) throw new RangeError('Concentrations must not all be equal')
  const slope = sxy / sxx
  return { lambda0Scm2: my - slope * mx, A: -slope }
}

/** λ° of one ion from Table 2.4 (S cm² mol⁻¹). Throws for an unknown ion. */
export function lambda0OfIon(id: LimitingIonRow['id']): number {
  const row = NCERT_LIMITING_ION_CONDUCTIVITY.find((r) => r.id === id)
  if (!row) throw new RangeError(`Unknown ion: ${id}`)
  return row.lambda0Scm2
}

/** Kohlrausch: Λ°m = Σ ν λ°, for ν copies of each ion (Eq. 2.25). */
export function lambda0Electrolyte(parts: readonly { readonly ion: LimitingIonRow['id']; readonly count: number }[]): number {
  return parts.reduce((sum, p) => sum + p.count * lambda0OfIon(p.ion), 0)
}

/**
 * Combine known Λ° values by addition and subtraction, e.g. Λ°(HAc) = Λ°(HCl) + Λ°(NaAc) − Λ°(NaCl) (Example 2.8).
 */
export function lambda0ByCombination(add: readonly number[], subtract: readonly number[]): number {
  return add.reduce((s, v) => s + v, 0) - subtract.reduce((s, v) => s + v, 0)
}

/** Degree of dissociation α = Λm / Λ°m (Eq. 2.26). */
export function degreeOfDissociation(lambdaM: number, lambda0: number): number {
  if (!(lambda0 > 0)) throw new RangeError(`Λ°m must be positive, got ${lambda0}`)
  return lambdaM / lambda0
}

/** Ka = c α² / (1 − α) for a weak electrolyte (Eq. 2.27). Requires 0 ≤ α < 1 and c > 0. */
export function dissociationConstantFromAlpha(molPerL: number, alpha: number): number {
  if (!(molPerL > 0)) throw new RangeError(`Concentration must be positive, got ${molPerL}`)
  if (!(alpha >= 0 && alpha < 1)) throw new RangeError(`Degree of dissociation must be in [0, 1), got ${alpha}`)
  return (molPerL * alpha * alpha) / (1 - alpha)
}
