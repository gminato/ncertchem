/**
 * The Precipitation Lab for NCERT Class 11 Unit 6, Section 6.13: two salt solutions mixed in equal
 * volumes, the ionic product Qsp of the salt they can form, and the common-ion solubility of a
 * sparingly soluble salt. Ksp values are looked up in NCERT Table 6.9; every ion concentration,
 * Qsp and molar solubility here comes from solubility.ts.
 */

import { NCERT_TABLE_6_9_KSP } from './ncert-unit6-tables'
import { ionicProduct, molarSolubility, solubilityWithCommonIon, willPrecipitate, type PrecipitationVerdict } from './solubility'

export type CationId = 'Ag' | 'Pb' | 'Ba' | 'Ca'
export type AnionId = 'Cl' | 'I' | 'SO4' | 'F' | 'CrO4'

/** A cation supplied by a soluble salt. The stock concentration of the salt equals [M^(z+)] of the stock. */
export interface CationSource {
  id: CationId
  ion: string
  charge: number
  salt: string
}

/** An anion supplied by a soluble salt. The stock concentration of the salt equals [X^(z-)] of the stock. */
export interface AnionSource {
  id: AnionId
  ion: string
  charge: number
  salt: string
}

export const CATION_SOURCES: readonly CationSource[] = [
  { id: 'Ag', ion: 'Ag⁺', charge: 1, salt: 'AgNO₃' },
  { id: 'Pb', ion: 'Pb²⁺', charge: 2, salt: 'Pb(NO₃)₂' },
  { id: 'Ba', ion: 'Ba²⁺', charge: 2, salt: 'BaCl₂' },
  { id: 'Ca', ion: 'Ca²⁺', charge: 2, salt: 'CaCl₂' },
]

export const ANION_SOURCES: readonly AnionSource[] = [
  { id: 'Cl', ion: 'Cl⁻', charge: 1, salt: 'NaCl' },
  { id: 'I', ion: 'I⁻', charge: 1, salt: 'KI' },
  { id: 'SO4', ion: 'SO₄²⁻', charge: 2, salt: 'Na₂SO₄' },
  { id: 'F', ion: 'F⁻', charge: 1, salt: 'NaF' },
  { id: 'CrO4', ion: 'CrO₄²⁻', charge: 2, salt: 'K₂CrO₄' },
]

/** A salt that a cation and an anion from the lists can form, with its Table 6.9 formula. */
interface PairRow {
  cation: CationId
  anion: AnionId
  formula: string
  x: number
  y: number
}

/** Every pair of sources whose salt is listed in Table 6.9. Other pairs have no Ksp to compare with. */
const PAIRS: readonly PairRow[] = [
  { cation: 'Ag', anion: 'Cl', formula: 'AgCl', x: 1, y: 1 },
  { cation: 'Ag', anion: 'I', formula: 'AgI', x: 1, y: 1 },
  { cation: 'Ag', anion: 'SO4', formula: 'Ag2SO4', x: 2, y: 1 },
  { cation: 'Ag', anion: 'CrO4', formula: 'Ag2CrO4', x: 2, y: 1 },
  { cation: 'Pb', anion: 'Cl', formula: 'PbCl2', x: 1, y: 2 },
  { cation: 'Pb', anion: 'I', formula: 'PbI2', x: 1, y: 2 },
  { cation: 'Pb', anion: 'F', formula: 'PbF2', x: 1, y: 2 },
  { cation: 'Pb', anion: 'SO4', formula: 'PbSO4', x: 1, y: 1 },
  { cation: 'Ba', anion: 'SO4', formula: 'BaSO4', x: 1, y: 1 },
  { cation: 'Ba', anion: 'CrO4', formula: 'BaCrO4', x: 1, y: 1 },
  { cation: 'Ba', anion: 'F', formula: 'BaF2', x: 1, y: 2 },
  { cation: 'Ca', anion: 'F', formula: 'CaF2', x: 1, y: 2 },
  { cation: 'Ca', anion: 'SO4', formula: 'CaSO4', x: 1, y: 1 },
]

/** The salt a pair of sources can form, with its Ksp from Table 6.9 at 298 K. */
export interface PairSalt {
  formula: string
  x: number
  y: number
  ksp: number
}

/** Ksp of a formula in Table 6.9, or null if the table does not list it. */
export function tableKsp(formula: string): number | null {
  const row = NCERT_TABLE_6_9_KSP.rows.find((r) => r.formula === formula)
  return row ? row.ksp : null
}

/** The salt that a cation source and an anion source can form, or null when Table 6.9 lists no such salt. */
export function pairSalt(cation: CationId, anion: AnionId): PairSalt | null {
  const row = PAIRS.find((p) => p.cation === cation && p.anion === anion)
  if (!row) return null
  const ksp = tableKsp(row.formula)
  if (ksp === null) return null
  return { formula: row.formula, x: row.x, y: row.y, ksp }
}

/** Result of mixing two stock solutions in equal volumes and comparing Qsp with Ksp. */
export interface MixPrecipitation {
  salt: PairSalt
  /** [M^(z+)] after mixing, mol L⁻¹. */
  cationConc: number
  /** [X^(z-)] after mixing, mol L⁻¹. */
  anionConc: number
  qsp: number
  /** Qsp / Ksp. */
  ratio: number
  verdict: PrecipitationVerdict
}

/**
 * Mixes equal volumes of a cation stock and an anion stock. Each ion is diluted by half. Qsp is the
 * ionic product of the salt the pair forms, compared with its Ksp (Section 6.13.1).
 * Returns null when Table 6.9 lists no salt for the pair.
 *
 * @param cationStock Concentration of the cation salt in its own solution, mol L⁻¹
 * @param anionStock Concentration of the anion salt in its own solution, mol L⁻¹
 */
export function mixEqualVolumes(cation: CationId, anion: AnionId, cationStock: number, anionStock: number): MixPrecipitation | null {
  const salt = pairSalt(cation, anion)
  if (!salt) return null
  const cationConc = cationStock / 2
  const anionConc = anionStock / 2
  const qsp = ionicProduct(cationConc, anionConc, salt.x, salt.y)
  return {
    salt,
    cationConc,
    anionConc,
    qsp,
    ratio: qsp / salt.ksp,
    verdict: willPrecipitate(qsp, salt.ksp),
  }
}

/** A sparingly soluble salt whose solubility the lab shows against an added common ion. */
export interface CommonIonSalt {
  formula: string
  x: number
  y: number
  ksp: number
  /** The ion the salt shares with the added solution, as text. */
  commonIon: string
  /** Name of the added salt, as text. */
  addedSalt: string
}

/** The three salts of the common-ion control, each with its Table 6.9 Ksp. */
export function commonIonSalts(): CommonIonSalt[] {
  const rows: Array<Omit<CommonIonSalt, 'ksp'>> = [
    { formula: 'AgCl', x: 1, y: 1, commonIon: 'Cl⁻', addedSalt: 'NaCl' },
    { formula: 'BaSO4', x: 1, y: 1, commonIon: 'SO₄²⁻', addedSalt: 'Na₂SO₄' },
    { formula: 'PbI2', x: 1, y: 2, commonIon: 'I⁻', addedSalt: 'KI' },
  ]
  return rows.map((row) => {
    const ksp = tableKsp(row.formula)
    if (ksp === null) throw new Error(`${row.formula} is not in Table 6.9`)
    return { ...row, ksp }
  })
}

/** Molar solubility of a salt in pure water and with an added common ion, mol L⁻¹. */
export function solubilityPair(salt: CommonIonSalt, addedConc: number): { pure: number; withIon: number } {
  return {
    pure: molarSolubility(salt.ksp, salt.x, salt.y),
    withIon: solubilityWithCommonIon(salt.ksp, salt.x, salt.y, addedConc, 'anion'),
  }
}
