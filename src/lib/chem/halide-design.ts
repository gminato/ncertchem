import { iupacNameFromSmiles, nameSteps, type NameStep } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import type { HalogenElement } from './haloalkanes'

/**
 * The halide designer for the Unit 6 Halide Namer. A design is a straight chain of 1 to 6 carbons
 * with one halogen and an optional methyl branch, or a benzene ring with one halogen or two of the
 * same halogen (ortho, meta or para). Every SMILES here is Kekulé; every name comes from the namer.
 */

export const MIN_HALIDE_CHAIN = 1
export const MAX_HALIDE_CHAIN = 6

export type HalideShape = 'chain' | 'ring'
export type RingPattern = 'mono' | 'ortho' | 'meta' | 'para'

export interface HalideDesign {
  shape: HalideShape
  halogen: HalogenElement
  /** Chain only: the carbons in the chain (1 to 6). */
  chain: number
  /** Chain only: the carbon that bears the halogen (1 to chain). */
  halogenCarbon: number
  /** Chain only: the carbon that bears a methyl branch (2 to chain − 1), or null for none. */
  methylCarbon: number | null
  /** Ring only: one halogen, or a second of the same kind at ortho, meta or para. */
  ringPattern: RingPattern
}

export const DEFAULT_HALIDE_DESIGN: HalideDesign = {
  shape: 'chain',
  halogen: 'Br',
  chain: 4,
  halogenCarbon: 2,
  methylCarbon: null,
  ringPattern: 'mono',
}

/** Whether a design is a molecule the controls may show (the chain and branch limits hold). */
export function isValidHalideDesign(d: HalideDesign): boolean {
  if (d.shape === 'ring') return true
  if (!Number.isInteger(d.chain) || d.chain < MIN_HALIDE_CHAIN || d.chain > MAX_HALIDE_CHAIN) return false
  if (!Number.isInteger(d.halogenCarbon) || d.halogenCarbon < 1 || d.halogenCarbon > d.chain) return false
  if (d.methylCarbon === null) return true
  return Number.isInteger(d.methylCarbon) && d.methylCarbon >= 2 && d.methylCarbon <= d.chain - 1
}

/** Kekulé SMILES of the design. Chain carbons are written in order, with the branches in brackets. */
export function designSmiles(d: HalideDesign): string {
  const x = d.halogen
  if (d.shape === 'ring') {
    switch (d.ringPattern) {
      case 'mono':
        return `${x}C1=CC=CC=C1`
      case 'ortho':
        return `${x}C1=CC=CC=C1${x}`
      case 'meta':
        return `${x}C1=CC=CC(${x})=C1`
      case 'para':
        return `${x}C1=CC=C(${x})C=C1`
    }
  }
  let smiles = ''
  for (let i = 1; i <= d.chain; i++) {
    smiles += 'C'
    if (i === d.halogenCarbon) smiles += `(${x})`
    if (i === d.methylCarbon) smiles += '(C)'
  }
  return smiles
}

const ALKYL_STEM: readonly string[] = ['', 'methyl', 'ethyl', 'propyl', 'butyl', 'pentyl', 'hexyl']
const HALIDE_WORD: Record<HalogenElement, string> = { F: 'fluoride', Cl: 'chloride', Br: 'bromide', I: 'iodide' }
const HALO_STEM: Record<HalogenElement, string> = { F: 'fluoro', Cl: 'chloro', Br: 'bromo', I: 'iodo' }

/** The alkyl group name for a straight chain: methyl, ethyl, n-propyl, n-butyl and so on. */
function primaryAlkyl(n: number): string {
  return n >= 3 ? `n-${ALKYL_STEM[n]}` : ALKYL_STEM[n]
}

/**
 * The common name where NCERT's alkyl-group-plus-halide convention gives one: methyl bromide,
 * n-propyl bromide, isopropyl bromide, sec-butyl bromide; for rings o-, m- and p-dihalobenzene.
 * Null when there is no common name (a methyl branch, a secondary carbon with two long arms,
 * a benzene with one halogen, whose name is the IUPAC name).
 */
export function commonName(d: HalideDesign): string | null {
  if (d.shape === 'ring') {
    if (d.ringPattern === 'mono') return null
    const prefix = d.ringPattern === 'ortho' ? 'o' : d.ringPattern === 'meta' ? 'm' : 'p'
    return `${prefix}-di${HALO_STEM[d.halogen]}benzene`
  }
  if (d.methylCarbon !== null) return null
  const n = d.chain
  const p = d.halogenCarbon
  const m = Math.min(p, n + 1 - p)
  let alkyl: string
  if (m === 1) alkyl = primaryAlkyl(n)
  else if (m === 2 && n === 3) alkyl = 'isopropyl'
  else if (m === 2) alkyl = `sec-${ALKYL_STEM[n]}`
  else return null
  return `${alkyl} ${HALIDE_WORD[d.halogen]}`
}

/** The IUPAC name, from the namer. Null if the namer does not name the molecule. */
export function designName(d: HalideDesign): string | null {
  try {
    return iupacNameFromSmiles(designSmiles(d))
  } catch {
    return null
  }
}

/** The namer's steps (parent, numbering, substituents, name), or an empty list if it cannot name the molecule. */
export function designNameSteps(d: HalideDesign): NameStep[] {
  try {
    return nameSteps(parseSmiles(designSmiles(d)))
  } catch {
    return []
  }
}

/** The molecular formula, e.g. C4H9Br, from the parsed SMILES. */
export function designFormula(d: HalideDesign): string {
  return molecularFormula(parseSmiles(designSmiles(d)))
}
