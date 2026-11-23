/**
 * Model for the Section 8.1 Carbonyl Namer: an open-chain aldehyde or ketone with one optional substituent,
 * or one of three ring compounds. Every name comes from unit8Name (the namer plus lead overrides); the
 * common names follow NCERT's rules for aldehydes (from the acid) and unsubstituted ketones (alkyl groups).
 */
import { TABLE_8_1_ALDEHYDES, unit8Name } from './ncert-c12-unit8-data'

export type ChainLength = 3 | 4 | 5 | 6
export type SubstituentKind = 'none' | 'methyl' | 'chloro' | 'bromo' | 'methoxy'

export interface ChainModel {
  /** Number of carbons in the chain, 3 to 6. */
  n: ChainLength
  /** Position of the carbonyl carbon. 1 means an aldehyde (CHO); 2 to n-1 means a ketone. */
  carbonyl: number
  substituent: SubstituentKind
  /** Chain carbon that carries the substituent (interior carbons only), or null when there is none. */
  at: number | null
}

export interface BuiltChain {
  smiles: string
  /** Atom index (in parseSmiles order) of chain carbons C1 … Cn. */
  carbons: number[]
  /** Atom index of the carbonyl carbon. */
  carbonylCarbon: number
  /** Atom index of the carbonyl oxygen. */
  carbonylOxygen: number
  /** Atom index of the substituent's first atom, or null. */
  substituentAtom: number | null
  verdict: 'aldehyde' | 'ketone'
  name: string
  common: string | null
}

export const CHAIN_LENGTHS: readonly ChainLength[] = [3, 4, 5, 6]
export const SUBSTITUENTS: readonly { id: SubstituentKind; label: string; name: string }[] = [
  { id: 'none', label: 'None', name: '' },
  { id: 'methyl', label: 'CH₃', name: 'methyl' },
  { id: 'chloro', label: 'Cl', name: 'chloro' },
  { id: 'bromo', label: 'Br', name: 'bromo' },
  { id: 'methoxy', label: 'OCH₃', name: 'methoxy' },
]

/**
 * Carbonyl positions for a chain of n carbons: 1 (aldehyde) and each interior carbon that is numbered from the
 * end nearer C1 (the ketone takes the lowest locant, so C(n+1-p) is never offered).
 */
export function carbonylPositions(n: number): number[] {
  const ketones = Array.from({ length: n - 2 }, (_, k) => k + 2).filter((p) => p <= n + 1 - p)
  return [1, ...ketones]
}

/**
 * Chain carbons that may carry the substituent: interior carbons other than the carbonyl carbon. A ketone in the
 * middle of an odd chain has no numbering direction of its own, so it takes no substituent.
 */
export function substituentPositions(n: number, carbonyl: number): number[] {
  if (carbonyl > 1 && carbonyl === n + 1 - carbonyl) return []
  return Array.from({ length: n - 2 }, (_, k) => k + 2).filter((c) => c !== carbonyl)
}

/** Greek letter for a chain carbon counted from the carbonyl carbon (C2 is alpha). */
const GREEK: Record<number, string> = { 2: 'α', 3: 'β', 4: 'γ', 5: 'δ', 6: 'ε' }

/** Stem of an aldehyde name, from the acid it comes from (NCERT's common names). */
const ALDEHYDE_STEM: Record<number, string> = {
  1: 'formaldehyde',
  2: 'acetaldehyde',
  3: 'propionaldehyde',
  4: 'butyraldehyde',
  5: 'valeraldehyde',
  6: 'caproaldehyde',
}

/** Alkyl group names for the unsubstituted ketone rule (NCERT writes "methyl n-propyl ketone"). */
const ALKYL: Record<number, string> = { 1: 'methyl', 2: 'ethyl', 3: 'n-propyl', 4: 'n-butyl', 5: 'n-pentyl' }

const SUB_SMILES: Record<SubstituentKind, string> = {
  none: '',
  methyl: '(C)',
  chloro: '(Cl)',
  bromo: '(Br)',
  methoxy: '(OC)',
}

/** Writes the chain as SMILES and records where each atom lands, so the drawing can number the chain. */
export function buildChain(m: ChainModel): BuiltChain {
  if (!carbonylPositions(m.n).includes(m.carbonyl)) throw new RangeError(`carbonyl position ${m.carbonyl} is not valid for C${m.n}`)
  const hasSub = m.substituent !== 'none' && m.at !== null
  if (hasSub && !substituentPositions(m.n, m.carbonyl).includes(m.at as number)) {
    throw new RangeError(`substituent position ${m.at} is not valid for this chain`)
  }
  let smiles = ''
  let idx = 0
  const carbons: number[] = []
  let carbonylOxygen = -1
  let substituentAtom: number | null = null
  for (let i = 1; i <= m.n; i++) {
    if (i === 1 && m.carbonyl === 1) {
      smiles += 'O='
      carbonylOxygen = idx++
    }
    smiles += 'C'
    carbons.push(idx++)
    if (i === m.carbonyl && m.carbonyl !== 1) {
      smiles += '(=O)'
      carbonylOxygen = idx++
    }
    if (hasSub && i === m.at) {
      smiles += SUB_SMILES[m.substituent]
      substituentAtom = idx
    }
  }
  const carbonylCarbon = carbons[m.carbonyl - 1]
  return {
    smiles,
    carbons,
    carbonylCarbon,
    carbonylOxygen,
    substituentAtom,
    verdict: m.carbonyl === 1 ? 'aldehyde' : 'ketone',
    name: unit8Name(smiles),
    common: commonChainName(m, hasSub),
  }
}

/** Common name by NCERT's rules: aldehydes from the acid, unsubstituted ketones from their two alkyl groups. */
export function commonChainName(m: ChainModel, substituted: boolean): string | null {
  if (m.carbonyl === 1) {
    const stem = ALDEHYDE_STEM[m.n]
    if (!substituted || m.at === null) return stem
    const greek = GREEK[m.at]
    const prefix = SUBSTITUENTS.find((s) => s.id === m.substituent)?.name ?? ''
    return `${greek}-${prefix}${stem}`
  }
  if (substituted) return null
  const a = m.carbonyl - 1
  const b = m.n - m.carbonyl
  if (a === 1 && b === 1) return 'acetone'
  const first = ALKYL[a]
  const second = ALKYL[b]
  if (a === b) return `di${first} ketone`
  return [first, second].sort((x, y) => x.replace('n-', '').localeCompare(y.replace('n-', ''))).join(' ') + ' ketone'
}

export interface RingOption {
  id: 'benzaldehyde' | 'methylcyclohexane' | 'acetophenone'
  label: string
  smiles: string
  /** Common name as NCERT prints it, or null when NCERT gives none. */
  common: string | null
  verdict: 'aldehyde' | 'ketone'
}

/** Ring compounds from Section 8.1: their names are NCERT's (Table 8.1) or the namer's. */
export const RING_OPTIONS: readonly RingOption[] = [
  { id: 'benzaldehyde', label: 'Benzaldehyde', smiles: 'O=CC1=CC=CC=C1', common: 'benzaldehyde', verdict: 'aldehyde' },
  {
    id: 'methylcyclohexane',
    label: 'Methylcyclohexanecarbaldehyde',
    smiles: 'CC1CCCC(C1)C=O',
    common: TABLE_8_1_ALDEHYDES.find((c) => c.iupac === '3-Methylcyclohexanecarbaldehyde')?.common ?? null,
    verdict: 'aldehyde',
  },
  { id: 'acetophenone', label: 'Acetophenone', smiles: 'CC(=O)C1=CC=CC=C1', common: 'acetophenone', verdict: 'ketone' },
]

/** Distance from a vertex to its locant, in drawing units. */
export const LOCANT_OFFSET = 14

/**
 * Where a locant goes: LOCANT_OFFSET units out from its own vertex, along the bisector of the widest free
 * angle between that vertex's bonds. For a chain carbon that is the outside of the zig-zag, away from its bonds.
 */
export function locantPosition(
  atom: number,
  points: readonly { x: number; y: number }[],
  neighbours: readonly number[],
): { x: number; y: number } {
  const p = points[atom]
  const angles = neighbours.map((j) => Math.atan2(points[j].y - p.y, points[j].x - p.x)).sort((a, b) => a - b)
  let bisector = -Math.PI / 2
  let widest = -1
  angles.forEach((start, i) => {
    const end = i + 1 < angles.length ? angles[i + 1] : angles[0] + 2 * Math.PI
    if (end - start > widest) {
      widest = end - start
      bisector = start + widest / 2
    }
  })
  return { x: p.x + LOCANT_OFFSET * Math.cos(bisector), y: p.y + LOCANT_OFFSET * Math.sin(bisector) }
}
