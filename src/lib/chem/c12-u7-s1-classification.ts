/**
 * Pure classification logic and builder model for Class 12 Unit 7 Section 7.1:
 * Classification of Alcohols, Phenols and Ethers.
 *
 * Imports shared NCERT reference tables from `ncert-c12-unit7-data.ts` and pure graph helpers
 * from `molecule-parse.ts` and `haloalkanes.ts`. No DOM or React dependencies.
 */

import type { MolGraph } from './molecule-graph'
import { formulaUnicode, isAromaticRingCarbon } from './haloalkanes'
import { hybridisation, molecularFormula, neighbours, parseSmiles, canonicalKey } from './molecule-parse'
import { NCERT_PHENOL_NAMES, NCERT_TABLE_7_1, NCERT_TABLE_7_2 } from './ncert-c12-unit7-data'

export type OxyFamily = 'alcohol' | 'phenol' | 'ether'
export type HydroxylClass = 'Monohydric' | 'Dihydric' | 'Trihydric' | 'Polyhydric'
export type EtherSymmetry = 'simple' | 'mixed'
export type AlcoholDegree = '1°' | '2°' | '3°'
export type AlcoholSubclassKind = 'alkyl' | 'allylic' | 'benzylic' | 'vinylic' | 'polyhydric'

export interface OxyClassification {
  family: OxyFamily
  hydroxylCount: number
  hydroxylClass: HydroxylClass | null
  etherSymmetry: EtherSymmetry | null
  carbonHybridisation: 'sp³' | 'sp²' | 'sp³ & sp²'
  degree: AlcoholDegree | 'N/A'
  subclassKind: AlcoholSubclassKind | 'phenol' | 'ether'
  subclassLabel: string
  /** Atom indices of the O atom(s) carrying –OH or –O–. */
  oxygenIndices: number[]
  /** Atom indices of the carbon atom(s) bonded directly to oxygen. */
  carbonIndices: number[]
  /** Adjacent C=C or aromatic ring atoms that decide allylic/benzylic/vinylic/phenol class. */
  decidingAtoms: number[]
  /** Spacer –CH₂– carbon(s) separating C–OH from a benzene ring when non-benzylic. */
  spacerAtoms: number[]
  /** Non-OH substituent atoms on a phenol ring (e.g. –CH₃ in 2-methylphenol). */
  ringSubstituentAtoms: number[]
  /** One-sentence explanation of why the molecule lands in this class. */
  ruleTrace: string
}

function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

/** Morgan-style constitutional signature of the carbon group rooted at `root` away from `centre`. */
function branchSignature(g: MolGraph, centre: number, root: number): string {
  const n = g.atoms.length
  const label = (i: number): string => {
    const a = g.atoms[i]
    return `${a.element}${a.hCount ?? 0}${a.charge ?? 0}`
  }
  const away = (i: number) => neighbours(g, i).filter((nb) => nb.atom !== centre)
  let colour = g.atoms.map((_a, i) => (i === centre ? 'centre' : i === root ? `root:${label(i)}` : label(i)))
  for (let round = 0; round < n; round++) {
    const current = colour
    colour = current.map((c, i) =>
      i === centre ? c : hash(`${c}#${away(i).map((nb) => `${nb.order}:${current[nb.atom]}`).sort().join('|')}`)
    )
  }
  const seen = new Set<number>([root])
  const queue = [root]
  for (let k = 0; k < queue.length; k++) {
    for (const nb of away(queue[k])) {
      if (!seen.has(nb.atom)) {
        seen.add(nb.atom)
        queue.push(nb.atom)
      }
    }
  }
  return hash([...seen].map((i) => colour[i]).sort().join(','))
}

function hydroxylWord(count: number): HydroxylClass {
  if (count === 1) return 'Monohydric'
  if (count === 2) return 'Dihydric'
  if (count === 3) return 'Trihydric'
  return 'Polyhydric'
}

function degreeWord(d: AlcoholDegree): string {
  if (d === '1°') return 'Primary (1°)'
  if (d === '2°') return 'Secondary (2°)'
  return 'Tertiary (3°)'
}

/** All aromatic ring carbons in `g`. */
function aromaticCarbons(g: MolGraph): number[] {
  return g.atoms.flatMap((a, i) => (a.element === 'C' && isAromaticRingCarbon(g, i) ? [i] : []))
}

/**
 * Shortest carbon path from `start` to any aromatic ring carbon, returning intermediate spacer
 * carbons (excluding `start` and the aromatic ring carbon itself), or [] if none or directly bonded.
 */
function spacerToAromaticRing(g: MolGraph, start: number): number[] {
  const aromatic = new Set(aromaticCarbons(g))
  if (aromatic.size === 0 || aromatic.has(start)) return []
  const prev = new Array<number>(g.atoms.length).fill(-2)
  prev[start] = -1
  const queue = [start]
  for (let h = 0; h < queue.length; h++) {
    const cur = queue[h]
    for (const nb of neighbours(g, cur)) {
      if (g.atoms[nb.atom].element !== 'C') continue
      if (aromatic.has(nb.atom)) {
        const path: number[] = []
        let v = cur
        while (v !== start && v >= 0) {
          path.push(v)
          v = prev[v]
        }
        return path.reverse()
      }
      if (prev[nb.atom] === -2) {
        prev[nb.atom] = cur
        queue.push(nb.atom)
      }
    }
  }
  return []
}

function isHydroxylO(g: MolGraph, i: number): boolean {
  if (g.atoms[i]?.element !== 'O' || (g.atoms[i].hCount ?? 0) !== 1) return false
  const nbs = neighbours(g, i)
  return nbs.length === 1 && nbs[0].order === 1 && g.atoms[nbs[0].atom].element === 'C'
}

function isEtherO(g: MolGraph, i: number): boolean {
  if (g.atoms[i]?.element !== 'O' || (g.atoms[i].hCount ?? 0) !== 0) return false
  const nbs = neighbours(g, i)
  return nbs.length === 2 && nbs.every((nb) => nb.order === 1 && g.atoms[nb.atom].element === 'C')
}

/** Classifies an alcohol, phenol, or ether directly from its molecular graph. */
export function classifyOxyGraph(g: MolGraph): OxyClassification {
  const ohIndices = g.atoms.flatMap((_, i) => (isHydroxylO(g, i) ? [i] : []))
  const etherIndices = g.atoms.flatMap((_, i) => (isEtherO(g, i) ? [i] : []))

  if (ohIndices.length === 0 && etherIndices.length > 0) {
    const oIdx = etherIndices[0]
    const nbs = neighbours(g, oIdx)
    const c1 = nbs[0].atom
    const c2 = nbs[1].atom
    const sig1 = branchSignature(g, oIdx, c1)
    const sig2 = branchSignature(g, oIdx, c2)
    const symmetry: EtherSymmetry = sig1 === sig2 ? 'simple' : 'mixed'
    const h1 = hybridisation(g, c1)
    const h2 = hybridisation(g, c2)
    const carbonHybridisation =
      h1 === h2 ? (h1 === 'sp2' ? 'sp²' : 'sp³') : 'sp³ & sp²'

    const subclassLabel =
      symmetry === 'simple' ? 'Simple (symmetrical) ether' : 'Mixed (unsymmetrical) ether'
    const ruleTrace =
      symmetry === 'simple'
        ? 'Both carbon groups flanking the divalent oxygen atom are identical, making this a simple (symmetrical) ether.'
        : 'Two different carbon groups flank the divalent oxygen atom, making this a mixed (unsymmetrical) ether.'

    return {
      family: 'ether',
      hydroxylCount: 0,
      hydroxylClass: null,
      etherSymmetry: symmetry,
      carbonHybridisation,
      degree: 'N/A',
      subclassKind: 'ether',
      subclassLabel,
      oxygenIndices: [oIdx],
      carbonIndices: [c1, c2],
      decidingAtoms: [],
      spacerAtoms: [],
      ringSubstituentAtoms: [],
      ruleTrace,
    }
  }

  if (ohIndices.length === 0) {
    throw new RangeError('classifyOxyGraph: molecule contains no hydroxyl or ether oxygen')
  }

  const ohCarbons = ohIndices.map((o) => neighbours(g, o)[0].atom)
  const aromaticOhCarbons = ohCarbons.filter((c) => isAromaticRingCarbon(g, c))

  // Phenols: -OH attached directly to an aromatic ring carbon.
  if (aromaticOhCarbons.length > 0) {
    const count = ohIndices.length
    const hClass = hydroxylWord(count)
    const ringSet = new Set(aromaticCarbons(g))
    const ohCarbonSet = new Set(ohCarbons)
    const ringSubstituentAtoms: number[] = []
    for (const rc of ringSet) {
      for (const nb of neighbours(g, rc)) {
        if (!ringSet.has(nb.atom) && !ohIndices.includes(nb.atom)) {
          ringSubstituentAtoms.push(nb.atom)
        }
      }
    }
    const extraNote =
      ringSubstituentAtoms.length > 0 && count === 1
        ? ' The alkyl ring substituent is not a hydroxyl group, so only 1 –OH counts.'
        : ''
    return {
      family: 'phenol',
      hydroxylCount: count,
      hydroxylClass: hClass,
      etherSymmetry: null,
      carbonHybridisation: 'sp²',
      degree: 'N/A',
      subclassKind: 'phenol',
      subclassLabel: `${hClass} phenol`,
      oxygenIndices: ohIndices,
      carbonIndices: [...ohCarbonSet],
      decidingAtoms: [...ringSet],
      spacerAtoms: [],
      ringSubstituentAtoms,
      ruleTrace: `${count === 1 ? 'One' : count === 2 ? 'Two' : 'Three'} –OH group${count === 1 ? '' : 's'} bond${count === 1 ? 's' : ''} directly to sp² aromatic ring carbon${count === 1 ? '' : 's'}, giving a ${hClass.toLowerCase()} phenol.${extraNote}`,
    }
  }

  // Alcohols: -OH on aliphatic / non-aromatic carbon(s).
  const count = ohIndices.length
  const hClass = hydroxylWord(count)
  if (count > 1) {
    const allSp2 = ohCarbons.every((c) => hybridisation(g, c) === 'sp2')
    return {
      family: 'alcohol',
      hydroxylCount: count,
      hydroxylClass: hClass,
      etherSymmetry: null,
      carbonHybridisation: allSp2 ? 'sp²' : 'sp³',
      degree: 'N/A',
      subclassKind: 'polyhydric',
      subclassLabel: `${hClass} alcohol`,
      oxygenIndices: ohIndices,
      carbonIndices: [...new Set(ohCarbons)],
      decidingAtoms: [],
      spacerAtoms: [],
      ringSubstituentAtoms: [],
      ruleTrace: `Contains ${count} hydroxyl (–OH) groups on aliphatic carbons, classifying it as a ${hClass.toLowerCase()} alcohol.`,
    }
  }

  const c = ohCarbons[0]
  const hyb = hybridisation(g, c)
  const carbonNbs = (idx: number) => neighbours(g, idx).filter((nb) => g.atoms[nb.atom].element === 'C')

  if (hyb === 'sp2') {
    const dbl = carbonNbs(c).find((nb) => nb.order === 2)
    return {
      family: 'alcohol',
      hydroxylCount: 1,
      hydroxylClass: 'Monohydric',
      etherSymmetry: null,
      carbonHybridisation: 'sp²',
      degree: 'N/A',
      subclassKind: 'vinylic',
      subclassLabel: 'Vinylic alcohol',
      oxygenIndices: ohIndices,
      carbonIndices: [c],
      decidingAtoms: dbl ? [c, dbl.atom] : [c],
      spacerAtoms: [],
      ringSubstituentAtoms: [],
      ruleTrace:
        'The –OH group attaches directly to a trigonal planar sp² carbon of a C=C double bond, making this a vinylic alcohol.',
    }
  }

  const cNeighbours = carbonNbs(c)
  const nCarbons = cNeighbours.length
  const degree: AlcoholDegree = nCarbons <= 1 ? '1°' : nCarbons === 2 ? '2°' : '3°'
  const dWord = degreeWord(degree)

  const benzylAnchor = cNeighbours.find((nb) => isAromaticRingCarbon(g, nb.atom))
  if (benzylAnchor) {
    return {
      family: 'alcohol',
      hydroxylCount: 1,
      hydroxylClass: 'Monohydric',
      etherSymmetry: null,
      carbonHybridisation: 'sp³',
      degree,
      subclassKind: 'benzylic',
      subclassLabel: `${dWord} benzylic alcohol`,
      oxygenIndices: ohIndices,
      carbonIndices: [c],
      decidingAtoms: aromaticCarbons(g),
      spacerAtoms: [],
      ringSubstituentAtoms: [],
      ruleTrace: `The sp³ C–OH carbon sits directly next to the benzene ring and bonds to ${nCarbons} carbon atom${nCarbons === 1 ? '' : 's'} total, giving a ${dWord.toLowerCase()} benzylic alcohol.`,
    }
  }

  const allylicAnchor = cNeighbours.find((nb) => carbonNbs(nb.atom).some((x) => x.order === 2))
  if (allylicAnchor) {
    const partner = carbonNbs(allylicAnchor.atom).find((x) => x.order === 2)
    return {
      family: 'alcohol',
      hydroxylCount: 1,
      hydroxylClass: 'Monohydric',
      etherSymmetry: null,
      carbonHybridisation: 'sp³',
      degree,
      subclassKind: 'allylic',
      subclassLabel: `${dWord} allylic alcohol`,
      oxygenIndices: ohIndices,
      carbonIndices: [c],
      decidingAtoms: partner ? [allylicAnchor.atom, partner.atom] : [allylicAnchor.atom],
      spacerAtoms: [],
      ringSubstituentAtoms: [],
      ruleTrace: `The sp³ C–OH carbon sits immediately adjacent to a C=C double bond and carries ${nCarbons} direct carbon neighbour${nCarbons === 1 ? '' : 's'}, giving a ${dWord.toLowerCase()} allylic alcohol.`,
    }
  }

  const spacerAtoms = spacerToAromaticRing(g, c)
  if (spacerAtoms.length > 0) {
    return {
      family: 'alcohol',
      hydroxylCount: 1,
      hydroxylClass: 'Monohydric',
      etherSymmetry: null,
      carbonHybridisation: 'sp³',
      degree,
      subclassKind: 'alkyl',
      subclassLabel: `${dWord} aliphatic alcohol`,
      oxygenIndices: ohIndices,
      carbonIndices: [c],
      decidingAtoms: aromaticCarbons(g),
      spacerAtoms,
      ringSubstituentAtoms: [],
      ruleTrace: `A –CH₂– spacer sits between the benzene ring and the sp³ C–OH carbon, breaking benzylic adjacency and leaving a ${dWord.toLowerCase()} aliphatic alcohol.`,
    }
  }

  return {
    family: 'alcohol',
    hydroxylCount: 1,
    hydroxylClass: 'Monohydric',
    etherSymmetry: null,
    carbonHybridisation: 'sp³',
    degree,
    subclassKind: 'alkyl',
    subclassLabel: `${dWord} alkyl alcohol`,
    oxygenIndices: ohIndices,
    carbonIndices: [c],
    decidingAtoms: [],
    spacerAtoms: [],
    ringSubstituentAtoms: [],
    ruleTrace:
      nCarbons === 0
        ? 'The –OH sits on an sp³ carbon with zero other carbons (grouped with primary 1° alcohols).'
        : `The sp³ C–OH carbon bonds directly to ${nCarbons} other carbon${nCarbons === 1 ? '' : 's'} with no adjacent C=C or benzene ring, giving a ${dWord.toLowerCase()} alcohol.`,
  }
}

export function classifyOxySmiles(smiles: string): OxyClassification {
  return classifyOxyGraph(parseSmiles(smiles))
}

export function oxyFormulaUnicode(smiles: string): string {
  return formulaUnicode(molecularFormula(parseSmiles(smiles)))
}

// ---------------------------------------------------------------------------------------------
// Simulation Builder & Preset Gallery for Section 7.1
// ---------------------------------------------------------------------------------------------

export type SimFamilyMode = 'alcohol-phenol' | 'ether'
export type AttachmentEnv =
  | 'aliphatic'
  | 'allylic'
  | 'benzylic'
  | 'spacer-benzene'
  | 'vinylic'
  | 'aromatic'
export type EtherGroup = 'CH3' | 'C2H5' | 'C6H5'

export interface OxyBuilderSpec {
  mode: SimFamilyMode
  env: AttachmentEnv
  degree: AlcoholDegree
  hydroxylCount: 1 | 2 | 3
  orthoMethyl: boolean
  r1: EtherGroup
  r2: EtherGroup
}

export interface OxyPreset {
  id: string
  label: string
  iupac: string
  common: string | null
  condensed: string
  smiles: string
  spec: OxyBuilderSpec
}

const byIupac = (list: readonly { iupac: string; common: string | null; commonAlt?: string }[], name: string) => {
  const row = list.find((r) => r.iupac.toLowerCase() === name.toLowerCase())
  if (!row) return null
  return row.commonAlt ? `${row.common} (${row.commonAlt})` : row.common
}

export const OXY_PRESETS: readonly OxyPreset[] = [
  {
    id: 'prop-2-en-1-ol',
    label: 'prop-2-en-1-ol',
    iupac: 'Prop-2-en-1-ol',
    common: 'Allyl alcohol',
    condensed: 'CH₂=CH–CH₂–OH',
    smiles: 'C=CCO',
    spec: { mode: 'alcohol-phenol', env: 'allylic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'ethanol',
    label: 'ethanol',
    iupac: 'Ethanol',
    common: 'Ethyl alcohol',
    condensed: 'CH₃–CH₂–OH',
    smiles: 'CCO',
    spec: { mode: 'alcohol-phenol', env: 'aliphatic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'ethane-1,2-diol',
    label: 'ethane-1,2-diol',
    iupac: 'Ethane-1,2-diol',
    common: byIupac(NCERT_TABLE_7_1, 'Ethane-1,2-diol'),
    condensed: 'HOCH₂–CH₂OH',
    smiles: 'OCCO',
    spec: { mode: 'alcohol-phenol', env: 'aliphatic', degree: '1°', hydroxylCount: 2, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'propane-1,2,3-triol',
    label: 'propane-1,2,3-triol',
    iupac: 'Propane-1,2,3-triol',
    common: byIupac(NCERT_TABLE_7_1, 'Propane-1,2,3-triol'),
    condensed: 'CH₂(OH)–CH(OH)–CH₂OH',
    smiles: 'OCC(O)CO',
    spec: { mode: 'alcohol-phenol', env: 'aliphatic', degree: '1°', hydroxylCount: 3, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'propan-2-ol',
    label: 'propan-2-ol',
    iupac: 'Propan-2-ol',
    common: byIupac(NCERT_TABLE_7_1, 'Propan-2-ol'),
    condensed: 'CH₃–CH(OH)–CH₃',
    smiles: 'CC(O)C',
    spec: { mode: 'alcohol-phenol', env: 'aliphatic', degree: '2°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: '2-methylpropan-2-ol',
    label: '2-methylpropan-2-ol',
    iupac: '2-Methylpropan-2-ol',
    common: byIupac(NCERT_TABLE_7_1, '2-Methylpropan-2-ol'),
    condensed: '(CH₃)₃C–OH',
    smiles: 'CC(C)(C)O',
    spec: { mode: 'alcohol-phenol', env: 'aliphatic', degree: '3°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'but-3-en-2-ol',
    label: 'but-3-en-2-ol',
    iupac: 'But-3-en-2-ol',
    common: null,
    condensed: 'CH₂=CH–CH(OH)–CH₃',
    smiles: 'C=CC(O)C',
    spec: { mode: 'alcohol-phenol', env: 'allylic', degree: '2°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'phenylmethanol',
    label: 'phenylmethanol',
    iupac: 'Phenylmethanol',
    common: 'Benzyl alcohol',
    condensed: 'C₆H₅–CH₂–OH',
    smiles: 'OCC1=CC=CC=C1',
    spec: { mode: 'alcohol-phenol', env: 'benzylic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: '1-phenylpropan-2-ol',
    label: '1-phenylpropan-2-ol',
    iupac: '1-Phenylpropan-2-ol',
    common: null,
    condensed: 'C₆H₅–CH₂–CH(OH)–CH₃',
    smiles: 'CC(O)CC1=CC=CC=C1',
    spec: { mode: 'alcohol-phenol', env: 'spacer-benzene', degree: '2°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'ethenol',
    label: 'ethenol',
    iupac: 'Ethenol',
    common: 'Vinyl alcohol',
    condensed: 'CH₂=CH–OH',
    smiles: 'C=CO',
    spec: { mode: 'alcohol-phenol', env: 'vinylic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'phenol',
    label: 'phenol',
    iupac: 'Phenol',
    common: byIupac(NCERT_PHENOL_NAMES, 'Phenol'),
    condensed: 'C₆H₅OH',
    smiles: 'OC1=CC=CC=C1',
    spec: { mode: 'alcohol-phenol', env: 'aromatic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: '2-methylphenol',
    label: '2-methylphenol',
    iupac: '2-Methylphenol',
    common: byIupac(NCERT_PHENOL_NAMES, '2-Methylphenol'),
    condensed: 'o-CH₃C₆H₄OH',
    smiles: 'CC1=CC=CC=C1O',
    spec: { mode: 'alcohol-phenol', env: 'aromatic', degree: '1°', hydroxylCount: 1, orthoMethyl: true, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'benzene-1,2-diol',
    label: 'benzene-1,2-diol',
    iupac: 'Benzene-1,2-diol',
    common: byIupac(NCERT_PHENOL_NAMES, 'Benzene-1,2-diol'),
    condensed: 'o-C₆H₄(OH)₂',
    smiles: 'OC1=CC=CC=C1O',
    spec: { mode: 'alcohol-phenol', env: 'aromatic', degree: '1°', hydroxylCount: 2, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'benzene-1,2,3-triol',
    label: 'benzene-1,2,3-triol',
    iupac: 'Benzene-1,2,3-triol',
    common: null,
    condensed: '1,2,3-C₆H₃(OH)₃',
    smiles: 'OC1=CC=CC(O)=C1O',
    spec: { mode: 'alcohol-phenol', env: 'aromatic', degree: '1°', hydroxylCount: 3, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'diethyl-ether',
    label: 'diethyl ether',
    iupac: 'Ethoxyethane',
    common: byIupac(NCERT_TABLE_7_2, 'Ethoxyethane'),
    condensed: 'C₂H₅–O–C₂H₅',
    smiles: 'CCOCC',
    spec: { mode: 'ether', env: 'aliphatic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C2H5' },
  },
  {
    id: 'ethyl-methyl-ether',
    label: 'ethyl methyl ether',
    iupac: 'Methoxyethane',
    common: 'Ethyl methyl ether',
    condensed: 'C₂H₅–O–CH₃',
    smiles: 'CCOC',
    spec: { mode: 'ether', env: 'aliphatic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'CH3' },
  },
  {
    id: 'ethyl-phenyl-ether',
    label: 'ethyl phenyl ether',
    iupac: 'Ethoxybenzene',
    common: byIupac(NCERT_TABLE_7_2, 'Ethoxybenzene'),
    condensed: 'C₂H₅–O–C₆H₅',
    smiles: 'CCOC1=CC=CC=C1',
    spec: { mode: 'ether', env: 'aliphatic', degree: '1°', hydroxylCount: 1, orthoMethyl: false, r1: 'C2H5', r2: 'C6H5' },
  },
] as const

export interface BuiltOxyMolecule {
  presetId: string | null
  iupac: string
  common: string | null
  condensed: string
  formula: string
  smiles: string
  classification: OxyClassification
  etherArms?: { leftLabel: string; rightLabel: string; same: boolean }
}

const ETHER_LABEL: Record<EtherGroup, string> = {
  CH3: 'CH₃',
  C2H5: 'C₂H₅',
  C6H5: 'C₆H₅',
}

function etherPairMeta(r1: EtherGroup, r2: EtherGroup): { iupac: string; common: string; condensed: string; smiles: string } {
  const pair = [r1, r2].sort().join('+')
  if (pair === 'CH3+CH3') {
    return {
      iupac: 'Methoxymethane',
      common: byIupac(NCERT_TABLE_7_2, 'Methoxymethane') ?? 'Dimethyl ether',
      condensed: 'CH₃–O–CH₃',
      smiles: 'COC',
    }
  }
  if (pair === 'C2H5+C2H5') {
    return {
      iupac: 'Ethoxyethane',
      common: byIupac(NCERT_TABLE_7_2, 'Ethoxyethane') ?? 'Diethyl ether',
      condensed: 'C₂H₅–O–C₂H₅',
      smiles: 'CCOCC',
    }
  }
  if (pair === 'C6H5+C6H5') {
    return {
      iupac: 'Phenoxybenzene',
      common: 'Diphenyl ether',
      condensed: 'C₆H₅–O–C₆H₅',
      smiles: 'C1=CC=CC=C1OC2=CC=CC=C2',
    }
  }
  if (pair === 'C2H5+CH3') {
    return {
      iupac: 'Methoxyethane',
      common: 'Ethyl methyl ether',
      condensed: `${ETHER_LABEL[r1]}–O–${ETHER_LABEL[r2]}`,
      smiles: r1 === 'C2H5' ? 'CCOC' : 'COCC',
    }
  }
  if (pair === 'C6H5+CH3') {
    return {
      iupac: 'Methoxybenzene',
      common: byIupac(NCERT_TABLE_7_2, 'Methoxybenzene') ?? 'Methyl phenyl ether (Anisole)',
      condensed: `${ETHER_LABEL[r1]}–O–${ETHER_LABEL[r2]}`,
      smiles: r1 === 'CH3' ? 'COC1=CC=CC=C1' : 'C1=CC=CC=C1OC',
    }
  }
  return {
    iupac: 'Ethoxybenzene',
    common: byIupac(NCERT_TABLE_7_2, 'Ethoxybenzene') ?? 'Ethyl phenyl ether (Phenetole)',
    condensed: `${ETHER_LABEL[r1]}–O–${ETHER_LABEL[r2]}`,
    smiles: r1 === 'C2H5' ? 'CCOC1=CC=CC=C1' : 'C1=CC=CC=C1OCC',
  }
}

/** Normalises a builder spec so invalid combinations fall back cleanly. */
export function normaliseOxySpec(spec: OxyBuilderSpec): OxyBuilderSpec {
  const supportsPoly = spec.env === 'aliphatic' || spec.env === 'aromatic'
  const hydroxylCount = supportsPoly ? spec.hydroxylCount : 1
  const orthoMethyl = spec.env === 'aromatic' && hydroxylCount === 1 ? spec.orthoMethyl : false
  return { ...spec, hydroxylCount, orthoMethyl }
}

function findPresetBySmiles(smiles: string): OxyPreset | undefined {
  const key = canonicalKey(parseSmiles(smiles))
  return OXY_PRESETS.find((p) => canonicalKey(parseSmiles(p.smiles)) === key)
}

/** Builds the active molecule and its graph-derived classification from a builder spec. */
export function buildOxyMolecule(rawSpec: OxyBuilderSpec): BuiltOxyMolecule {
  const spec = normaliseOxySpec(rawSpec)

  if (spec.mode === 'ether') {
    const meta = etherPairMeta(spec.r1, spec.r2)
    const preset = findPresetBySmiles(meta.smiles)
    return {
      presetId: preset?.id ?? null,
      iupac: meta.iupac,
      common: meta.common,
      condensed: meta.condensed,
      formula: oxyFormulaUnicode(meta.smiles),
      smiles: meta.smiles,
      classification: classifyOxySmiles(meta.smiles),
      etherArms: {
        leftLabel: ETHER_LABEL[spec.r1],
        rightLabel: ETHER_LABEL[spec.r2],
        same: spec.r1 === spec.r2,
      },
    }
  }

  let iupac: string
  let common: string | null = null
  let condensed: string
  let smiles: string

  if (spec.env === 'aliphatic') {
    if (spec.hydroxylCount === 2) {
      iupac = 'Ethane-1,2-diol'
      common = byIupac(NCERT_TABLE_7_1, 'Ethane-1,2-diol')
      condensed = 'HOCH₂–CH₂OH'
      smiles = 'OCCO'
    } else if (spec.hydroxylCount === 3) {
      iupac = 'Propane-1,2,3-triol'
      common = byIupac(NCERT_TABLE_7_1, 'Propane-1,2,3-triol')
      condensed = 'CH₂(OH)–CH(OH)–CH₂OH'
      smiles = 'OCC(O)CO'
    } else if (spec.degree === '1°') {
      iupac = 'Ethanol'
      common = 'Ethyl alcohol'
      condensed = 'CH₃–CH₂–OH'
      smiles = 'CCO'
    } else if (spec.degree === '2°') {
      iupac = 'Propan-2-ol'
      common = byIupac(NCERT_TABLE_7_1, 'Propan-2-ol')
      condensed = 'CH₃–CH(OH)–CH₃'
      smiles = 'CC(O)C'
    } else {
      iupac = '2-Methylpropan-2-ol'
      common = byIupac(NCERT_TABLE_7_1, '2-Methylpropan-2-ol')
      condensed = '(CH₃)₃C–OH'
      smiles = 'CC(C)(C)O'
    }
  } else if (spec.env === 'allylic') {
    if (spec.degree === '1°') {
      iupac = 'Prop-2-en-1-ol'
      common = 'Allyl alcohol'
      condensed = 'CH₂=CH–CH₂–OH'
      smiles = 'C=CCO'
    } else if (spec.degree === '2°') {
      iupac = 'But-3-en-2-ol'
      condensed = 'CH₂=CH–CH(OH)–CH₃'
      smiles = 'C=CC(O)C'
    } else {
      iupac = '2-Methylbut-3-en-2-ol'
      condensed = 'CH₂=CH–C(OH)(CH₃)₂'
      smiles = 'C=CC(C)(O)C'
    }
  } else if (spec.env === 'benzylic') {
    if (spec.degree === '1°') {
      iupac = 'Phenylmethanol'
      common = 'Benzyl alcohol'
      condensed = 'C₆H₅–CH₂–OH'
      smiles = 'OCC1=CC=CC=C1'
    } else if (spec.degree === '2°') {
      iupac = '1-Phenylethan-1-ol'
      condensed = 'C₆H₅–CH(OH)–CH₃'
      smiles = 'CC(O)C1=CC=CC=C1'
    } else {
      iupac = '2-Phenylpropan-2-ol'
      condensed = 'C₆H₅–C(OH)(CH₃)₂'
      smiles = 'CC(C)(O)C1=CC=CC=C1'
    }
  } else if (spec.env === 'spacer-benzene') {
    if (spec.degree === '1°') {
      iupac = '2-Phenylethan-1-ol'
      condensed = 'C₆H₅–CH₂–CH₂–OH'
      smiles = 'OCCC1=CC=CC=C1'
    } else if (spec.degree === '2°') {
      iupac = '1-Phenylpropan-2-ol'
      condensed = 'C₆H₅–CH₂–CH(OH)–CH₃'
      smiles = 'CC(O)CC1=CC=CC=C1'
    } else {
      iupac = '2-Methyl-1-phenylpropan-2-ol'
      condensed = 'C₆H₅–CH₂–C(OH)(CH₃)₂'
      smiles = 'CC(C)(O)CC1=CC=CC=C1'
    }
  } else if (spec.env === 'vinylic') {
    iupac = 'Ethenol'
    common = 'Vinyl alcohol'
    condensed = 'CH₂=CH–OH'
    smiles = 'C=CO'
  } else {
    // aromatic (phenol)
    if (spec.hydroxylCount === 2) {
      iupac = 'Benzene-1,2-diol'
      common = byIupac(NCERT_PHENOL_NAMES, 'Benzene-1,2-diol')
      condensed = 'o-C₆H₄(OH)₂'
      smiles = 'OC1=CC=CC=C1O'
    } else if (spec.hydroxylCount === 3) {
      iupac = 'Benzene-1,2,3-triol'
      condensed = '1,2,3-C₆H₃(OH)₃'
      smiles = 'OC1=CC=CC(O)=C1O'
    } else if (spec.orthoMethyl) {
      iupac = '2-Methylphenol'
      common = byIupac(NCERT_PHENOL_NAMES, '2-Methylphenol')
      condensed = 'o-CH₃C₆H₄OH'
      smiles = 'CC1=CC=CC=C1O'
    } else {
      iupac = 'Phenol'
      common = byIupac(NCERT_PHENOL_NAMES, 'Phenol')
      condensed = 'C₆H₅OH'
      smiles = 'OC1=CC=CC=C1'
    }
  }

  const preset = findPresetBySmiles(smiles)
  return {
    presetId: preset?.id ?? null,
    iupac,
    common,
    condensed,
    formula: oxyFormulaUnicode(smiles),
    smiles,
    classification: classifyOxySmiles(smiles),
  }
}

export const DEFAULT_OXY_SPEC: OxyBuilderSpec = OXY_PRESETS[0].spec
