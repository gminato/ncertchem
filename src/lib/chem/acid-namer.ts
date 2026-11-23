/**
 * Model for the Acid Namer simulation (Class 12 Unit 8, Section 8.6): a carboxylic acid built from a chain
 * (1 to 6 carbons, C1 is the COOH carbon), an optional CH₃ or Cl on one chain carbon, and an optional second COOH;
 * or a benzoic acid ring, with an optional ortho second COOH (phthalic acid). Ring substitution is deliberately not
 * offered: the namer cannot name every substituted benzoic acid (R24), so only the table's benzoic and phthalic acids appear.
 */
import { TABLE_8_3_ACIDS, unit8Name } from './ncert-c12-unit8-data'
import { canonicalKey, molecularFormula, parseSmiles, toCondensed } from './molecule-parse'
import type { MolGraph } from './molecule-graph'

export type Skeleton = 'chain' | 'ring'
export type Substituent = 'none' | 'CH3' | 'Cl'

export const MIN_CARBONS = 1
export const MAX_CARBONS = 6

export interface AcidSpec {
  skeleton: Skeleton
  /** Chain carbons, C1 being the COOH carbon (chain only). */
  carbons: number
  substituent: Substituent
  /** Chain carbon that carries the substituent, numbered from the COOH carbon (2 or more). */
  position: number
  /** A second COOH: at the far end of the chain, or ortho on the ring. */
  diacid: boolean
}

export const DEFAULT_SPEC: AcidSpec = {
  skeleton: 'chain',
  carbons: 5,
  substituent: 'CH3',
  position: 3,
  diacid: false,
}

/** The spec as it will be drawn: out-of-range settings are pulled into range, and unavailable ones switched off. */
export function resolveSpec(spec: AcidSpec): AcidSpec {
  if (spec.skeleton === 'ring') return { ...spec, substituent: 'none', position: 0 }
  const carbons = Math.min(MAX_CARBONS, Math.max(MIN_CARBONS, Math.round(spec.carbons)))
  const diacid = spec.diacid && carbons >= 2
  const resolved: AcidSpec = { skeleton: 'chain', carbons, substituent: spec.substituent, position: 0, diacid }
  const top = maxPosition(resolved)
  if (top < 2) return { ...resolved, substituent: 'none', position: 0 }
  return { ...resolved, position: Math.min(top, Math.max(2, Math.round(spec.position))) }
}

/** The highest chain carbon that can carry a substituent: the far COOH carbon is taken when there is a second COOH. */
export function maxPosition(spec: AcidSpec): number {
  return spec.diacid ? spec.carbons - 1 : spec.carbons
}

export interface AcidModel {
  smiles: string
  graph: MolGraph
  formula: string
  /** The name the namer gives, or NCERT's name where a lead override applies. */
  name: string
  /** Table 8.3's common name, lower case, or null where the table has none. */
  commonName: string | null
  /** Condensed line for acyclic acids (for example CH₃CH(CH₃)CH₂COOH); null on the ring. */
  condensed: string | null
  /** Atom indices of the chain carbons C1..Cn (chain) or the ring carbons that carry locants 1 and 2 (ring). */
  locantAtoms: { atom: number; label: string }[]
  /** Atom index of the carboxyl carbon (C1 of the chain or the ring carbon that carries the COOH). */
  carboxylAtom: number
  /** Chain carbons in order (chain only); empty on the ring. */
  chainAtoms: number[]
}

interface Built {
  smiles: string
  chainAtoms: number[]
  locants: { atom: number; label: string }[]
  carboxyl: number
}

function buildChain(spec: AcidSpec): Built {
  let smiles = 'OC(=O)'
  let idx = 3
  const chainAtoms = [1]
  for (let k = 2; k <= spec.carbons; k++) {
    if (spec.diacid && k === spec.carbons) {
      chainAtoms.push(idx)
      smiles += 'C(=O)O'
      idx += 3
    } else if (k === spec.position && spec.substituent !== 'none') {
      chainAtoms.push(idx)
      smiles += spec.substituent === 'CH3' ? 'C(C)' : 'C(Cl)'
      idx += 2
    } else {
      chainAtoms.push(idx)
      smiles += 'C'
      idx += 1
    }
  }
  const locants = chainAtoms.map((atom, i) => ({ atom, label: String(i + 1) }))
  return { smiles, chainAtoms, locants, carboxyl: 1 }
}

function buildRing(spec: AcidSpec): Built {
  // Ring carbons are atoms 3 to 8; the ipso carbon (3) carries the COOH, and C8 is its ortho neighbour.
  if (!spec.diacid) return { smiles: 'OC(=O)C1=CC=CC=C1', chainAtoms: [], locants: [{ atom: 3, label: '1' }], carboxyl: 3 }
  return {
    smiles: 'OC(=O)C1=CC=CC=C1C(O)=O',
    chainAtoms: [],
    locants: [
      { atom: 3, label: '1' },
      { atom: 8, label: '2' },
    ],
    carboxyl: 3,
  }
}

function commonNameOf(smiles: string): string | null {
  const key = canonicalKey(parseSmiles(smiles))
  const row = TABLE_8_3_ACIDS.find((r) => canonicalKey(parseSmiles(r.smiles)) === key)
  if (!row) return null
  return row.common.charAt(0).toLowerCase() + row.common.slice(1)
}

/** Everything the simulation shows for a spec. Call resolveSpec first, or pass a spec the controls produce. */
export function acidModel(input: AcidSpec): AcidModel {
  const spec = resolveSpec(input)
  const built = spec.skeleton === 'ring' ? buildRing(spec) : buildChain(spec)
  const graph = parseSmiles(built.smiles)
  return {
    smiles: built.smiles,
    graph,
    formula: molecularFormula(graph),
    name: unit8Name(built.smiles),
    commonName: commonNameOf(built.smiles),
    condensed: spec.skeleton === 'chain' ? toCondensed(graph) : null,
    locantAtoms: built.locants,
    carboxylAtom: built.carboxyl,
    chainAtoms: built.chainAtoms,
  }
}
