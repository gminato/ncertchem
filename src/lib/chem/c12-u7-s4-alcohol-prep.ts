/**
 * Chemistry domain model for Class 12 Unit 7, Section 7.4.1 ("Preparation of Alcohols")
 * and the flagship Alcohol Synthesis Workbench (`alcohol-prep-lab`).
 *
 * Cross-references `NCERT_7_4_1_ALCOHOL_PREP` in `./ncert-c12-unit7-data` and derives
 * IUPAC names and molecular formulas directly from `parseSmiles` / `iupacNameFromSmiles`.
 */

import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, neighbours, parseSmiles } from './molecule-parse'
import type { MolGraph } from './molecule-graph'
import { NCERT_7_4_1_ALCOHOL_PREP } from './ncert-c12-unit7-data'

export type SubstrateFamilyId = 'alkenes' | 'carbonyls' | 'grignard'

export type SubstrateId =
  | 'propene'
  | '2-methylpropene'
  | 'but-1-ene'
  | 'propanal'
  | 'butanone'
  | 'butanoic-acid'
  | 'methanal'
  | 'ethanal'
  | 'propanone'

export type AlkeneReagentId = 'acid-hydration' | 'hydroboration-oxidation'
export type CarbonylReagentId = 'h2-pd' | 'nabh4' | 'lialh4' | 'ester-h2'
export type GrignardStepId = 'adduct' | 'hydrolysis'
export type WorkbenchReagentId = AlkeneReagentId | CarbonylReagentId | GrignardStepId

export type GrignardAlkylId = 'ch3mgbr' | 'c2h5mgbr'

export type AlcoholDegree = '1°' | '2°' | '3°' | 'Adduct (yields 1°)' | 'Adduct (yields 2°)' | 'Adduct (yields 3°)' | 'No reaction'

export interface FamilySpec {
  id: SubstrateFamilyId
  label: string
}

export interface SubstrateSpec {
  id: SubstrateId
  family: SubstrateFamilyId
  label: string
  shortName: string
  formulaUnicode: string
  smiles: string
  carbonCount: number
}

export interface ReagentSpec {
  id: WorkbenchReagentId
  family: SubstrateFamilyId
  label: string
  shortLabel: string
  arrowAbove: string
  arrowBelow?: string
}

export interface GrignardOption {
  id: GrignardAlkylId
  formulaUnicode: string
  name: string
  addedCarbons: 1 | 2
  alkylLabel: string
}

export interface IntermediateView {
  kind: 'carbocation' | 'trialkylborane' | 'hydride-adduct' | 'ester' | 'mg-adduct' | 'surface-h2' | 'none'
  title: string
  formulaUnicode: string
  smiles?: string
  chargeAtom?: number
  highlightAtoms?: readonly number[]
  note: string
}

export interface WorkbenchOutcome {
  status: 'reaction' | 'intermediate-only' | 'no-reaction'
  ncertRecordId: string | null
  substrate: SubstrateSpec
  reagent: ReagentSpec
  grignard: GrignardOption | null
  intermediate: IntermediateView
  product: {
    iupacName: string
    formulaUnicode: string
    smiles: string
    highlightAtoms: readonly number[]
    highlightBonds: readonly number[]
    newBondLabel: string
  } | null
  degree: AlcoholDegree
  byProducts: string
  deltaC: number
  mechanismNote: string
  regioselectivityTag: string
  summaryText: string
}

export const FAMILIES: readonly FamilySpec[] = [
  { id: 'alkenes', label: 'Alkenes' },
  { id: 'carbonyls', label: 'Carbonyls & Acids' },
  { id: 'grignard', label: 'Grignard Pairings' },
]

export const SUBSTRATES: readonly SubstrateSpec[] = [
  {
    id: 'propene',
    family: 'alkenes',
    label: 'Propene (CH₃CH=CH₂)',
    shortName: 'Propene',
    formulaUnicode: 'CH₃CH=CH₂',
    smiles: 'CC=C',
    carbonCount: 3,
  },
  {
    id: '2-methylpropene',
    family: 'alkenes',
    label: '2-Methylpropene ((CH₃)₂C=CH₂)',
    shortName: '2-Methylpropene',
    formulaUnicode: '(CH₃)₂C=CH₂',
    smiles: 'CC(C)=C',
    carbonCount: 4,
  },
  {
    id: 'but-1-ene',
    family: 'alkenes',
    label: 'But-1-ene (CH₃CH₂CH=CH₂)',
    shortName: 'But-1-ene',
    formulaUnicode: 'CH₃CH₂CH=CH₂',
    smiles: 'CCC=C',
    carbonCount: 4,
  },
  {
    id: 'propanal',
    family: 'carbonyls',
    label: 'Propanal (CH₃CH₂CHO)',
    shortName: 'Propanal',
    formulaUnicode: 'CH₃CH₂CHO',
    smiles: 'CCC=O',
    carbonCount: 3,
  },
  {
    id: 'butanone',
    family: 'carbonyls',
    label: 'Butanone (CH₃COCH₂CH₃)',
    shortName: 'Butanone',
    formulaUnicode: 'CH₃COCH₂CH₃',
    smiles: 'CCC(=O)C',
    carbonCount: 4,
  },
  {
    id: 'butanoic-acid',
    family: 'carbonyls',
    label: 'Butanoic acid (CH₃CH₂CH₂COOH)',
    shortName: 'Butanoic acid',
    formulaUnicode: 'CH₃CH₂CH₂COOH',
    smiles: 'CCCC(=O)O',
    carbonCount: 4,
  },
  {
    id: 'methanal',
    family: 'grignard',
    label: 'Methanal (HCHO)',
    shortName: 'Methanal',
    formulaUnicode: 'HCHO',
    smiles: 'C=O',
    carbonCount: 1,
  },
  {
    id: 'ethanal',
    family: 'grignard',
    label: 'Ethanal (CH₃CHO)',
    shortName: 'Ethanal',
    formulaUnicode: 'CH₃CHO',
    smiles: 'CC=O',
    carbonCount: 2,
  },
  {
    id: 'propanone',
    family: 'grignard',
    label: 'Propanone (CH₃COCH₃)',
    shortName: 'Propanone',
    formulaUnicode: 'CH₃COCH₃',
    smiles: 'CC(=O)C',
    carbonCount: 3,
  },
]

export const REAGENTS: readonly ReagentSpec[] = [
  {
    id: 'acid-hydration',
    family: 'alkenes',
    label: 'H₂O / H⁺ (acid hydration)',
    shortLabel: 'H₂O / H⁺',
    arrowAbove: 'H₂O',
    arrowBelow: 'H⁺ (dil. acid)',
  },
  {
    id: 'hydroboration-oxidation',
    family: 'alkenes',
    label: '(i) (BH₃)₂, (ii) H₂O₂ / OH⁻ (hydroboration-oxidation)',
    shortLabel: '(BH₃)₂ → H₂O₂/OH⁻',
    arrowAbove: '(i) (BH₃)₂',
    arrowBelow: '(ii) H₂O₂ / OH⁻',
  },
  {
    id: 'h2-pd',
    family: 'carbonyls',
    label: 'H₂ / Pd',
    shortLabel: 'H₂ / Pd',
    arrowAbove: 'H₂',
    arrowBelow: 'Pd catalyst',
  },
  {
    id: 'nabh4',
    family: 'carbonyls',
    label: 'NaBH₄',
    shortLabel: 'NaBH₄',
    arrowAbove: 'NaBH₄',
    arrowBelow: 'mild hydride',
  },
  {
    id: 'lialh4',
    family: 'carbonyls',
    label: '(i) LiAlH₄, (ii) H₂O',
    shortLabel: 'LiAlH₄ / H₂O',
    arrowAbove: '(i) LiAlH₄',
    arrowBelow: '(ii) H₂O',
  },
  {
    id: 'ester-h2',
    family: 'carbonyls',
    label: "(i) R'OH / H⁺, (ii) H₂ / Catalyst",
    shortLabel: "R'OH/H⁺ → H₂/Cat.",
    arrowAbove: "(i) R'OH / H⁺",
    arrowBelow: '(ii) H₂ / Catalyst',
  },
  {
    id: 'adduct',
    family: 'grignard',
    label: 'Step (i): Adduct formation',
    shortLabel: 'Step (i): Adduct',
    arrowAbove: 'RMgBr',
    arrowBelow: 'dry ether',
  },
  {
    id: 'hydrolysis',
    family: 'grignard',
    label: 'Step (ii): H₂O hydrolysis',
    shortLabel: 'Step (ii): H₂O hydrolysis',
    arrowAbove: '(i) RMgBr',
    arrowBelow: '(ii) H₂O',
  },
]

export const GRIGNARD_OPTIONS: readonly GrignardOption[] = [
  {
    id: 'ch3mgbr',
    formulaUnicode: 'CH₃MgBr',
    name: 'Methylmagnesium bromide',
    addedCarbons: 1,
    alkylLabel: 'CH₃',
  },
  {
    id: 'c2h5mgbr',
    formulaUnicode: 'C₂H₅MgBr',
    name: 'Ethylmagnesium bromide',
    addedCarbons: 2,
    alkylLabel: 'C₂H₅',
  },
]

const SUB_MAP = '₀₁₂₃₄₅₆₇₈₉'

/** Converts an ASCII Hill formula like `C3H8O` into `C₃H₈O`. */
export function unicodeFormula(ascii: string): string {
  return ascii.replace(/\d+/g, (digits) =>
    digits
      .split('')
      .map((d) => SUB_MAP[Number(d)] ?? d)
      .join('')
  )
}

/** Capitalises the first letter of an IUPAC name for display badges. */
export function displayIupac(smiles: string): string {
  const raw = iupacNameFromSmiles(smiles)
  const idx = raw.search(/[a-zA-Z]/)
  if (idx < 0) return raw
  return `${raw.slice(0, idx)}${raw[idx].toUpperCase()}${raw.slice(idx + 1)}`
}

/** Finds the C-O bond index and atom indices in a saturated alcohol graph. */
export function findAlcoholCOBond(graph: MolGraph): { carbon: number; oxygen: number; bond: number } {
  const oxygen = graph.atoms.findIndex((a) => a.element === 'O')
  if (oxygen < 0) throw new Error('Expected oxygen atom in alcohol graph')
  const bond = graph.bonds.findIndex((b) => b.a === oxygen || b.b === oxygen)
  if (bond < 0) throw new Error('Expected C-O bond in alcohol graph')
  const b = graph.bonds[bond]
  const carbon = b.a === oxygen ? b.b : b.a
  return { carbon, oxygen, bond }
}

/** Finds the newly formed C-C bond in a Grignard product (carbinol carbon to incoming alkyl carbon). */
export function findGrignardNewCCBond(
  graph: MolGraph,
  addedCarbons: 1 | 2
): { cCarbinol: number; cAdded: number; bond: number } {
  const { carbon: cCarbinol } = findAlcoholCOBond(graph)
  const carbonNeighbours = neighbours(graph, cCarbinol).filter((n) => graph.atoms[n.atom].element === 'C')
  // When ethyl (C2) adds to methanal/ethanal/propanone, the incoming carbon is a CH2 attached to an ethyl CH3.
  let cAdded = carbonNeighbours[0]?.atom ?? cCarbinol
  if (addedCarbons === 2) {
    const ethylAlpha = carbonNeighbours.find((n) => (graph.atoms[n.atom].hCount ?? 0) === 2)
    if (ethylAlpha) cAdded = ethylAlpha.atom
  }
  const bond = graph.bonds.findIndex(
    (b) => (b.a === cCarbinol && b.b === cAdded) || (b.a === cAdded && b.b === cCarbinol)
  )
  return { cCarbinol, cAdded, bond }
}

export function substratesForFamily(family: SubstrateFamilyId): readonly SubstrateSpec[] {
  return SUBSTRATES.filter((s) => s.family === family)
}

export function reagentsForFamily(family: SubstrateFamilyId): readonly ReagentSpec[] {
  return REAGENTS.filter((r) => r.family === family)
}

function assertNcertId(id: string): string {
  const hit = NCERT_7_4_1_ALCOHOL_PREP.find((r) => r.id === id)
  if (!hit) throw new Error(`Missing NCERT 7.4.1 record: ${id}`)
  return hit.id
}

function buildAlcoholProduct(
  smiles: string,
  newBondKind: 'C-O' | 'C=O-reduced' | 'C-C',
  addedCarbons: 1 | 2 = 1
): NonNullable<WorkbenchOutcome['product']> {
  const graph = parseSmiles(smiles)
  const formulaUnicode = unicodeFormula(molecularFormula(graph))
  const iupacName = displayIupac(smiles)
  const co = findAlcoholCOBond(graph)
  if (newBondKind === 'C-O' || newBondKind === 'C=O-reduced') {
    return {
      iupacName,
      formulaUnicode,
      smiles,
      highlightAtoms: [co.carbon, co.oxygen],
      highlightBonds: [co.bond],
      newBondLabel: newBondKind === 'C-O' ? 'New C-O bond' : 'New C-H & O-H bonds',
    }
  }
  const cc = findGrignardNewCCBond(graph, addedCarbons)
  return {
    iupacName,
    formulaUnicode,
    smiles,
    highlightAtoms: [cc.cCarbinol, cc.cAdded],
    highlightBonds: cc.bond >= 0 ? [cc.bond] : [co.bond],
    newBondLabel: 'New C-C bond',
  }
}

export function computeWorkbenchOutcome(
  substrateId: SubstrateId,
  reagentId: WorkbenchReagentId,
  grignardId: GrignardAlkylId = 'ch3mgbr'
): WorkbenchOutcome {
  const substrate = SUBSTRATES.find((s) => s.id === substrateId) ?? SUBSTRATES[0]
  const validReagents = reagentsForFamily(substrate.family)
  const reagent = validReagents.find((r) => r.id === reagentId) ?? validReagents[0]
  const grignard =
    substrate.family === 'grignard'
      ? GRIGNARD_OPTIONS.find((g) => g.id === grignardId) ?? GRIGNARD_OPTIONS[0]
      : null

  if (substrate.family === 'alkenes') {
    return resolveAlkeneOutcome(substrate, reagent)
  }
  if (substrate.family === 'carbonyls') {
    return resolveCarbonylOutcome(substrate, reagent)
  }
  return resolveGrignardOutcome(substrate, reagent, grignard ?? GRIGNARD_OPTIONS[0])
}

function resolveAlkeneOutcome(substrate: SubstrateSpec, reagent: ReagentSpec): WorkbenchOutcome {
  const isAcid = reagent.id === 'acid-hydration'
  const ncertRecordId = assertNcertId(isAcid ? 'alkene-acid-hydration' : 'hydroboration-oxidation')

  if (substrate.id === 'propene') {
    if (isAcid) {
      return {
        status: 'reaction',
        ncertRecordId,
        substrate,
        reagent,
        grignard: null,
        intermediate: {
          kind: 'carbocation',
          title: '2° Carbocation',
          formulaUnicode: 'CH₃–C⁺H–CH₃',
          smiles: 'C[CH+]C',
          chargeAtom: 1,
          highlightAtoms: [1],
          note: 'Protonation at C-1 forms the more stable secondary carbocation at C-2.',
        },
        product: buildAlcoholProduct('CC(O)C', 'C-O'),
        degree: '2°',
        byProducts: 'H₃O⁺ regenerated (catalytic)',
        deltaC: 0,
        mechanismNote: 'Markovnikov acid-catalysed hydration via 2° carbocation and oxonium ion.',
        regioselectivityTag: 'Markovnikov (-OH at C-2)',
        summaryText:
          'Propene with H₂O / H⁺ proceeds via the secondary carbocation CH₃-C⁺H-CH₃ to yield propan-2-ol (2° alcohol, Markovnikov).',
      }
    }
    return {
      status: 'reaction',
      ncertRecordId,
      substrate,
      reagent,
      grignard: null,
      intermediate: {
        kind: 'trialkylborane',
        title: 'Tripropylborane',
        formulaUnicode: '(CH₃CH₂CH₂)₃B',
        note: 'Boron attaches to the less substituted terminal sp² carbon (C-1).',
      },
      product: buildAlcoholProduct('CCCO', 'C-O'),
      degree: '1°',
      byProducts: 'B(OH)₃ (boric acid)',
      deltaC: 0,
      mechanismNote: 'Anti-Markovnikov syn-hydroboration followed by H₂O₂ / OH⁻ oxidation of all three C-B bonds.',
      regioselectivityTag: 'Anti-Markovnikov (-OH at C-1)',
      summaryText:
        'Propene with (i) (BH₃)₂ and (ii) H₂O₂ / OH⁻ forms tripropylborane and oxidises to propan-1-ol (1° alcohol) plus B(OH)₃.',
    }
  }

  if (substrate.id === '2-methylpropene') {
    if (isAcid) {
      return {
        status: 'reaction',
        ncertRecordId,
        substrate,
        reagent,
        grignard: null,
        intermediate: {
          kind: 'carbocation',
          title: '3° Carbocation',
          formulaUnicode: '(CH₃)₃C⁺',
          smiles: 'C[C+](C)C',
          chargeAtom: 1,
          highlightAtoms: [1],
          note: 'Protonation at CH₂ gives the stable tertiary carbocation at C-2.',
        },
        product: buildAlcoholProduct('CC(C)(C)O', 'C-O'),
        degree: '3°',
        byProducts: 'H₃O⁺ regenerated (catalytic)',
        deltaC: 0,
        mechanismNote: 'Markovnikov hydration through a 3° carbocation installs -OH at C-2.',
        regioselectivityTag: 'Markovnikov (-OH at C-2)',
        summaryText:
          '2-Methylpropene with H₂O / H⁺ proceeds via the tertiary carbocation (CH₃)₃C⁺ to yield 2-methylpropan-2-ol (3° alcohol).',
      }
    }
    return {
      status: 'reaction',
      ncertRecordId,
      substrate,
      reagent,
      grignard: null,
      intermediate: {
        kind: 'trialkylborane',
        title: 'Triisobutylborane',
        formulaUnicode: '((CH₃)₂CHCH₂)₃B',
        note: 'Boron selectively attaches to the terminal CH₂ carbon (C-1).',
      },
      product: buildAlcoholProduct('CC(C)CO', 'C-O'),
      degree: '1°',
      byProducts: 'B(OH)₃ (boric acid)',
      deltaC: 0,
      mechanismNote: 'Anti-Markovnikov hydroboration-oxidation converts C-1 into a primary alcohol.',
      regioselectivityTag: 'Anti-Markovnikov (-OH at C-1)',
      summaryText:
        '2-Methylpropene with (i) (BH₃)₂ and (ii) H₂O₂ / OH⁻ yields 2-methylpropan-1-ol (1° alcohol) plus B(OH)₃.',
    }
  }

  // but-1-ene
  if (isAcid) {
    return {
      status: 'reaction',
      ncertRecordId,
      substrate,
      reagent,
      grignard: null,
      intermediate: {
        kind: 'carbocation',
        title: '2° Carbocation',
        formulaUnicode: 'CH₃CH₂C⁺HCH₃',
        smiles: 'CC[CH+]C',
        chargeAtom: 2,
        highlightAtoms: [2],
        note: 'Protonation at C-1 generates the 2° carbocation at C-2.',
      },
      product: buildAlcoholProduct('CCC(O)C', 'C-O'),
      degree: '2°',
      byProducts: 'H₃O⁺ regenerated (catalytic)',
      deltaC: 0,
      mechanismNote: 'Markovnikov hydration adds H at C-1 and -OH at C-2.',
      regioselectivityTag: 'Markovnikov (-OH at C-2)',
      summaryText:
        'But-1-ene with H₂O / H⁺ proceeds via a secondary carbocation to yield butan-2-ol (2° alcohol).',
    }
  }
  return {
    status: 'reaction',
    ncertRecordId,
    substrate,
    reagent,
    grignard: null,
    intermediate: {
      kind: 'trialkylborane',
      title: 'Tributylborane',
      formulaUnicode: '(CH₃CH₂CH₂CH₂)₃B',
      note: 'Boron bonds to C-1, which bears more hydrogen atoms.',
    },
    product: buildAlcoholProduct('CCCCO', 'C-O'),
    degree: '1°',
    byProducts: 'B(OH)₃ (boric acid)',
    deltaC: 0,
    mechanismNote: 'Anti-Markovnikov hydroboration-oxidation installs -OH at C-1.',
    regioselectivityTag: 'Anti-Markovnikov (-OH at C-1)',
    summaryText:
      'But-1-ene with (i) (BH₃)₂ and (ii) H₂O₂ / OH⁻ yields butan-1-ol (1° alcohol) plus B(OH)₃.',
  }
}

function resolveCarbonylOutcome(substrate: SubstrateSpec, reagent: ReagentSpec): WorkbenchOutcome {
  if (substrate.id === 'butanoic-acid') {
    if (reagent.id === 'nabh4') {
      return {
        status: 'no-reaction',
        ncertRecordId: null,
        substrate,
        reagent,
        grignard: null,
        intermediate: {
          kind: 'none',
          title: 'No reaction',
          formulaUnicode: 'No hydride transfer',
          note: 'Carboxylic acids are far less electrophilic than aldehydes and ketones.',
        },
        product: null,
        degree: 'No reaction',
        byProducts: 'None',
        deltaC: 0,
        mechanismNote: 'No reaction (NaBH₄ is too mild for carboxylic acids). Use LiAlH₄ or the ester route.',
        regioselectivityTag: 'Chemoselectivity barrier',
        summaryText:
          'Butanoic acid with NaBH₄ gives no reaction because NaBH₄ is too mild to reduce carboxylic acids.',
      }
    }
    if (reagent.id === 'h2-pd') {
      return {
        status: 'no-reaction',
        ncertRecordId: null,
        substrate,
        reagent,
        grignard: null,
        intermediate: {
          kind: 'none',
          title: 'No direct reaction',
          formulaUnicode: 'Requires esterification first',
          note: 'Standard aldehyde/ketone H₂/Pd conditions do not directly reduce free -COOH.',
        },
        product: null,
        degree: 'No reaction',
        byProducts: 'None',
        deltaC: 0,
        mechanismNote: 'Convert RCOOH to an ester (RCOOR\') first for commercial hydrogenation, or use LiAlH₄.',
        regioselectivityTag: 'Route mismatch',
        summaryText:
          'Butanoic acid does not reduce cleanly under standard aldehyde/ketone H₂/Pd conditions; esterify first or use LiAlH₄.',
      }
    }
    if (reagent.id === 'lialh4') {
      return {
        status: 'reaction',
        ncertRecordId: assertNcertId('carboxylic-acid-lialh4'),
        substrate,
        reagent,
        grignard: null,
        intermediate: {
          kind: 'hydride-adduct',
          title: 'Aluminium alkoxide (step i)',
          formulaUnicode: '[CH₃CH₂CH₂CH₂O]₄AlLi',
          note: 'Water is withheld until step (i) with LiAlH₄ is complete.',
        },
        product: buildAlcoholProduct('CCCCO', 'C=O-reduced'),
        degree: '1°',
        byProducts: 'LiOH + Al(OH)₃ (after H₂O quench)',
        deltaC: 0,
        mechanismNote: 'Strong hydride reduction (lab route) gives 1° alcohol in excellent yield, though LiAlH₄ is expensive.',
        regioselectivityTag: 'Lab hydride route (1° alcohol)',
        summaryText:
          'Butanoic acid with (i) LiAlH₄ and (ii) H₂O yields butan-1-ol (1° alcohol) via the laboratory hydride route.',
      }
    }
    // ester-h2
    return {
      status: 'reaction',
      ncertRecordId: assertNcertId('carboxylic-acid-commercial-ester-route'),
      substrate,
      reagent,
      grignard: null,
      intermediate: {
        kind: 'ester',
        title: 'Alkyl butanoate ester',
        formulaUnicode: "CH₃CH₂CH₂COOR'",
        note: "Step (i) esterification with R'OH/H⁺ activates the acid for hydrogenation.",
      },
      product: buildAlcoholProduct('CCCCO', 'C=O-reduced'),
      degree: '1°',
      byProducts: "R'OH (recovered alcohol)",
      deltaC: 0,
      mechanismNote: "Commercial two-step route: esterification followed by catalytic H₂ reduction recovers R'OH.",
      regioselectivityTag: 'Commercial ester route',
      summaryText:
        "Butanoic acid via (i) R'OH / H⁺ forms the ester CH₃CH₂CH₂COOR', which hydrogenates in step (ii) to butan-1-ol and recovers R'OH.",
    }
  }

  // Propanal or Butanone
  if (reagent.id === 'ester-h2') {
    return {
      status: 'no-reaction',
      ncertRecordId: null,
      substrate,
      reagent,
      grignard: null,
      intermediate: {
        kind: 'none',
        title: 'Not applicable',
        formulaUnicode: 'No -COOH group present',
        note: 'Esterification + hydrogenation is the commercial route for carboxylic acids, not aldehydes or ketones.',
      },
      product: null,
      degree: 'No reaction',
      byProducts: 'None',
      deltaC: 0,
      mechanismNote: 'Aldehydes and ketones reduce directly with H₂/Pd, NaBH₄, or LiAlH₄ without esterification.',
      regioselectivityTag: 'Route for -COOH only',
      summaryText: `${substrate.shortName} has no carboxylic acid group for esterification; reduce directly with H₂/Pd, NaBH₄, or LiAlH₄.`,
    }
  }

  const isCatalytic = reagent.id === 'h2-pd'
  const ncertRecordId = assertNcertId(isCatalytic ? 'carbonyl-catalytic-hydrogenation' : 'carbonyl-hydride-reduction')
  const isAldehyde = substrate.id === 'propanal'
  const productSmiles = isAldehyde ? 'CCCO' : 'CCC(O)C'
  const degree: AlcoholDegree = isAldehyde ? '1°' : '2°'
  const intermediate: IntermediateView = isCatalytic
    ? {
        kind: 'surface-h2',
        title: 'Surface-bound H₂ addition',
        formulaUnicode: 'H₂ adsorbed on Pd',
        note: 'Finely divided Pd delivers H atoms across the C=O double bond.',
      }
    : {
        kind: 'hydride-adduct',
        title: reagent.id === 'nabh4' ? 'Alkoxide / borate species' : 'Lithium aluminium alkoxide',
        formulaUnicode: isAldehyde ? 'CH₃CH₂CH₂O⁻' : 'CH₃CH(O⁻)CH₂CH₃',
        note: 'Hydride (H⁻) attacks the electrophilic carbonyl carbon before protonation.',
      }

  return {
    status: 'reaction',
    ncertRecordId,
    substrate,
    reagent,
    grignard: null,
    intermediate,
    product: buildAlcoholProduct(productSmiles, 'C=O-reduced'),
    degree,
    byProducts: isCatalytic ? 'None' : reagent.id === 'nabh4' ? 'Borate salts (after workup)' : 'LiOH + Al(OH)₃ (after step ii)',
    deltaC: 0,
    mechanismNote: `${substrate.shortName} reduces across C=O with ${reagent.shortLabel} to give a ${degree} alcohol (same carbon count).`,
    regioselectivityTag: `${isAldehyde ? 'Aldehyde → 1° alcohol' : 'Ketone → 2° alcohol'}`,
    summaryText: `${substrate.shortName} with ${reagent.shortLabel} gives ${displayIupac(productSmiles).toLowerCase()} (${degree} alcohol, carbon count unchanged).`,
  }
}

function resolveGrignardOutcome(
  substrate: SubstrateSpec,
  reagent: ReagentSpec,
  grignard: GrignardOption
): WorkbenchOutcome {
  const ncertRecordId = assertNcertId('grignard-carbonyl')
  const stepOneOnly = reagent.id === 'adduct'
  const isMe = grignard.id === 'ch3mgbr'

  let adductFormula: string
  let productSmiles: string
  let targetDegree: '1°' | '2°' | '3°'

  if (substrate.id === 'methanal') {
    targetDegree = '1°'
    adductFormula = isMe ? '[CH₃–CH₂–O⁻ Mg⁺Br]' : '[CH₃CH₂–CH₂–O⁻ Mg⁺Br]'
    productSmiles = isMe ? 'CCO' : 'CCCO'
  } else if (substrate.id === 'ethanal') {
    targetDegree = '2°'
    adductFormula = isMe ? '[CH₃–CH(CH₃)–O⁻ Mg⁺Br]' : '[CH₃–CH(C₂H₅)–O⁻ Mg⁺Br]'
    productSmiles = isMe ? 'CC(O)C' : 'CCC(O)C'
  } else {
    // propanone
    targetDegree = '3°'
    adductFormula = isMe ? '[(CH₃)₃C–O⁻ Mg⁺Br]' : '[(CH₃)₂C(C₂H₅)–O⁻ Mg⁺Br]'
    productSmiles = isMe ? 'CC(C)(C)O' : 'CCC(C)(C)O'
  }

  const intermediate: IntermediateView = {
    kind: 'mg-adduct',
    title: 'Magnesium alkoxide adduct',
    formulaUnicode: adductFormula,
    note: `Step (i): nucleophilic ${grignard.alkylLabel}(δ⁻) attacks carbonyl C(δ⁺), forming a new C-C bond.`,
  }

  if (stepOneOnly) {
    return {
      status: 'intermediate-only',
      ncertRecordId,
      substrate,
      reagent,
      grignard,
      intermediate,
      product: null,
      degree: `Adduct (yields ${targetDegree})`,
      byProducts: 'Add H₂O in Step (ii) to release Mg(OH)Br',
      deltaC: grignard.addedCarbons,
      mechanismNote: `Step (i) pauses at the alkoxide adduct ${adductFormula}; select Step (ii): H₂O hydrolysis to form the ${targetDegree} alcohol.`,
      regioselectivityTag: `Step (i) C-C bond formed (+${grignard.addedCarbons} C)`,
      summaryText: `${substrate.shortName} + ${grignard.formulaUnicode} in Step (i) forms the magnesium alkoxide adduct ${adductFormula} (+${grignard.addedCarbons} C); hydrolysis in Step (ii) will give a ${targetDegree} alcohol.`,
    }
  }

  const product = buildAlcoholProduct(productSmiles, 'C-C', grignard.addedCarbons)
  return {
    status: 'reaction',
    ncertRecordId,
    substrate,
    reagent,
    grignard,
    intermediate,
    product,
    degree: targetDegree,
    byProducts: 'Mg(OH)Br',
    deltaC: grignard.addedCarbons,
    mechanismNote: `Step (i) adds ${grignard.alkylLabel} to C=O; Step (ii) hydrolyses the adduct with H₂O to yield a ${targetDegree} alcohol + Mg(OH)Br.`,
    regioselectivityTag: `${substrate.shortName} → ${targetDegree} alcohol (+${grignard.addedCarbons} C)`,
    summaryText: `${substrate.shortName} + ${grignard.formulaUnicode} followed by H₂O hydrolysis gives ${product.iupacName.toLowerCase()} (${targetDegree} alcohol, ΔC = +${grignard.addedCarbons}) and Mg(OH)Br.`,
  }
}
