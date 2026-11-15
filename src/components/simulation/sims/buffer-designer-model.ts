/**
 * Pure model behind the buffer designer (Section 6.12.1 and Section 6.11.9). Every pH is computed by the
 * acid-base library; constants come from NCERT Tables 6.6 and 6.7, never typed in here.
 */

import {
  bufferAfterAddition,
  hendersonPH,
  kaFromKb,
  kw,
  pH as pHOfConc,
  pKa,
  saltHydrolysisPH,
  strongAcidPH,
  strongBasePH,
  type SaltType,
} from '@/lib/chem/acid-base'
import { NCERT_TABLE_6_6_KA, NCERT_TABLE_6_7_KB } from '@/lib/chem/ncert-unit6-tables'

/** The volume of the designed buffer and of the water it is compared with, in mL. */
export const DESIGN_VOLUME_ML = 100

function tableKa(formula: string): number {
  const row = NCERT_TABLE_6_6_KA.rows.find((r) => r.formula === formula)
  if (!row) throw new RangeError(`No Ka for ${formula} in Table 6.6`)
  return row.ka
}

function tableKb(formula: string): number {
  const row = NCERT_TABLE_6_7_KB.rows.find((r) => r.formula === formula)
  if (!row) throw new RangeError(`No Kb for ${formula} in Table 6.7`)
  return row.kb
}

export interface BufferPair {
  id: 'acetic' | 'hypochlorous' | 'ammonia'
  /** Acid form and conjugate base form, as written on the buttons. */
  label: string
  acidName: string
  baseName: string
  /** Whether the buffer is built from a weak base and its conjugate acid. */
  basic: boolean
  pKa: number
  source: string
}

const KA_ACETIC = tableKa('CH3COOH')
const KA_HYPOCHLOROUS = tableKa('HClO')
const KB_AMMONIA = tableKb('NH3 or NH4OH')

/** The three buffer pairs offered. The ammonia pair is basic: its pKa is that of NH₄⁺, Kw / Kb. */
export const BUFFER_PAIRS: readonly BufferPair[] = [
  {
    id: 'acetic',
    label: 'CH₃COOH / CH₃COO⁻',
    acidName: 'CH₃COOH',
    baseName: 'CH₃COO⁻',
    basic: false,
    pKa: pKa(KA_ACETIC),
    source: 'Ka of acetic acid, NCERT Table 6.6 (1.74 × 10⁻⁵)',
  },
  {
    id: 'hypochlorous',
    label: 'HOCl / OCl⁻',
    acidName: 'HOCl',
    baseName: 'OCl⁻',
    basic: false,
    pKa: pKa(KA_HYPOCHLOROUS),
    source: 'Ka of hypochlorous acid, NCERT Table 6.6 (3.0 × 10⁻⁸)',
  },
  {
    id: 'ammonia',
    label: 'NH₄⁺ / NH₃',
    acidName: 'NH₄⁺',
    baseName: 'NH₃',
    basic: true,
    pKa: pKa(kaFromKb(KB_AMMONIA)),
    source: 'Ka of NH₄⁺ = Kw / Kb, with Kb of NH₃ from NCERT Table 6.7 (1.77 × 10⁻⁵)',
  },
]

export interface BufferDesign {
  pair: BufferPair
  /** Fraction of the buffer that is the conjugate base form, 0 to 1. */
  baseShare: number
  /** Total concentration of the two forms, mol L⁻¹. */
  totalConc: number
  /** Signed strong acid (+) or strong base (−), mmol, added to the 100 mL. */
  addedMmol: number
}

export interface BufferDesignResult {
  /** Concentration of the acid form, mol L⁻¹. */
  acidConc: number
  /** Concentration of the conjugate base form, mol L⁻¹. */
  baseConc: number
  /** pH before any addition, from Henderson–Hasselbalch. */
  pHStart: number
  /** pH after the addition, from the buffer library. */
  pHBuffer: number
  /** pH of 100 mL of water with the same addition. */
  pHWater: number
  /** Acid form, mmol, after the addition. */
  acidMmol: number
  /** Conjugate base form, mmol, after the addition. */
  baseMmol: number
  /** True when the addition is larger than the buffer can absorb. */
  exceedsCapacity: boolean
}

/**
 * The pH of a buffer designed from a pair, a ratio and a total concentration, and its pH after adding a
 * strong acid or base. Water is treated with the same addition for comparison.
 *
 * @throws {RangeError} If the share is not strictly between 0 and 1, or the concentration is not positive
 */
export function designBuffer(design: BufferDesign): BufferDesignResult {
  const { pair, baseShare, totalConc, addedMmol } = design
  if (!(baseShare > 0 && baseShare < 1)) throw new RangeError('The base share must be between 0 and 1')
  if (!(totalConc > 0)) throw new RangeError('The total concentration must be positive')
  const volumeL = DESIGN_VOLUME_ML / 1000
  const acidConc = totalConc * (1 - baseShare)
  const baseConc = totalConc * baseShare
  const pHStart = hendersonPH(pair.pKa, baseConc, acidConc)
  const acidMoles = acidConc * volumeL
  const baseMoles = baseConc * volumeL
  const addMoles = Math.abs(addedMmol) / 1000
  const pHBuffer =
    addedMmol === 0
      ? pHStart
      : bufferAfterAddition(
          { pKa: pair.pKa, acidMoles, saltMoles: baseMoles, volumeL },
          { kind: addedMmol > 0 ? 'acid' : 'base', moles: addMoles }
        )
  const concWater = Math.abs(addedMmol) / DESIGN_VOLUME_ML
  const pHWater =
    addedMmol === 0
      ? pHOfConc(Math.sqrt(kw()))
      : addedMmol > 0
        ? strongAcidPH(concWater)
        : strongBasePH(concWater)
  // Strong acid turns A⁻ into HA; strong base turns HA into A⁻.
  const acidMmol = acidConc * DESIGN_VOLUME_ML + addedMmol
  const baseMmol = baseConc * DESIGN_VOLUME_ML - addedMmol
  const exceedsCapacity = addedMmol > 0 ? addedMmol > baseConc * DESIGN_VOLUME_ML : -addedMmol > acidConc * DESIGN_VOLUME_ML
  return {
    acidConc,
    baseConc,
    pHStart,
    pHBuffer,
    pHWater,
    acidMmol,
    baseMmol,
    exceedsCapacity,
  }
}

export interface SaltCase {
  id: 'nacl' | 'naac' | 'nh4cl' | 'nh4hcoo'
  /** Formula of the salt, written in the button. */
  label: string
  type: SaltType
  /** Which parts are weak, in words. */
  parts: string
  ka?: number
  kb?: number
  /** The hydrolysis equation for the weak part, or null when neither part hydrolyses. */
  hydrolysis: 'none' | 'anion' | 'cation' | 'both'
  /** Source of the constants. */
  source: string
}

/** The four salt types of Section 6.11.9, each with an example from the NCERT tables. */
export const SALT_CASES: readonly SaltCase[] = [
  {
    id: 'nacl',
    label: 'NaCl',
    type: 'strong-strong',
    parts: 'strong acid HCl and strong base NaOH',
    hydrolysis: 'none',
    source: 'no weak part',
  },
  {
    id: 'naac',
    label: 'CH₃COONa',
    type: 'weak-acid-strong-base',
    parts: 'weak acid CH₃COOH and strong base NaOH',
    ka: KA_ACETIC,
    hydrolysis: 'anion',
    source: 'Ka of CH₃COOH, NCERT Table 6.6',
  },
  {
    id: 'nh4cl',
    label: 'NH₄Cl',
    type: 'strong-acid-weak-base',
    parts: 'strong acid HCl and weak base NH₄OH',
    kb: KB_AMMONIA,
    hydrolysis: 'cation',
    source: 'Kb of NH₃ (NH₄OH), NCERT Table 6.7',
  },
  {
    id: 'nh4hcoo',
    label: 'HCOONH₄',
    type: 'weak-weak',
    parts: 'weak acid HCOOH and weak base NH₄OH',
    ka: tableKa('HCOOH'),
    kb: KB_AMMONIA,
    hydrolysis: 'both',
    source: 'Ka of HCOOH (1.8 × 10⁻⁴), NCERT Table 6.6; Kb of NH₃ (1.77 × 10⁻⁵), NCERT Table 6.7',
  },
]

export interface SaltResult {
  pH: number
  /** Which way the solution leans. */
  nature: 'acidic' | 'neutral' | 'alkaline'
  /** The pH formula the library applied. */
  formula: string
}

/**
 * The pH of a salt solution at concentration c, from the hydrolysis formula for its type. The weak–weak
 * formula does not depend on c; the others do through the square root of Kh c.
 *
 * @throws {RangeError} If c is not positive
 */
export function saltPH(salt: SaltCase, c: number): SaltResult {
  const pHValue = saltHydrolysisPH(salt.type, c, { ka: salt.ka, kb: salt.kb })
  const nature = Math.abs(pHValue - 7) < 1e-9 ? 'neutral' : pHValue > 7 ? 'alkaline' : 'acidic'
  const formula =
    salt.type === 'strong-strong'
      ? 'pH = 7'
      : salt.type === 'weak-acid-strong-base'
        ? 'pH = 7 + ½ (pKa + log c)'
        : salt.type === 'strong-acid-weak-base'
          ? 'pH = 7 − ½ (pKb + log c)'
          : 'pH = 7 + ½ (pKa − pKb)'
  return { pH: pHValue, nature, formula }
}
