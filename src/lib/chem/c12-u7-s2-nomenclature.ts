import {
  NCERT_CYCLIC_ALCOHOLS,
  NCERT_PHENOL_NAMES,
  NCERT_TABLE_7_1,
  NCERT_TABLE_7_2,
  type NcertCompoundName,
} from './ncert-c12-unit7-data'
import { molecularFormula, parseSmiles } from './molecule-parse'

export type AtomRole = 'parent' | 'functional' | 'branch'

export interface AtomNode {
  id: string
  x: number
  y: number
  /** Displayed atom/group label (e.g. 'OH', 'HO', 'O', 'CH₃', 'H₃C', 'OC₂H₅'), or null for a skeletal C vertex. */
  label: string | null
  role: AtomRole
  /** Locant number on the parent skeleton when numbering is shown. */
  locant?: number
  /** Angle in degrees (SVG coords, y down, 0 = right, 90 = down, -90 = up) for locant badge placement. */
  locantAngle?: number
  /** Optional explicit text anchor override. */
  anchor?: 'start' | 'middle' | 'end'
}

export interface BondEdge {
  from: string
  to: string
  order: 1 | 2
  role: AtomRole
  /** For double bonds inside an aromatic ring, the ring center so the inner line sits inside. */
  ringCenter?: { x: number; y: number }
}

export interface StructureSpec {
  atoms: AtomNode[]
  bonds: BondEdge[]
  /** Optional center of an inscribed circle (unused for Kekule, reserved if needed). */
  ringCenter?: { x: number; y: number }
}

export interface IupacToken {
  text: string
  kind: 'locant' | 'substituent' | 'parent' | 'suffix' | 'punctuation'
}

export interface NomenclatureEntry {
  id: string
  family: 'alcohols' | 'phenols' | 'ethers'
  smiles: string
  /** Condensed or textbook structural formula (Unicode). */
  condensedFormula: string
  /** Hill molecular formula formatted with Unicode subscripts, computed from SMILES. */
  molecularFormula: string
  commonName: string | null
  commonAlt?: string
  iupacName: string
  iupacAlt?: string
  iupacTokens: IupacToken[]
  parentRuleBadge: string
  steps: [string, string, string]
  structure: StructureSpec
}

const SUBSCRIPT_DIGITS = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

export function toUnicodeSubscripts(formula: string): string {
  return formula.replace(/\d+/g, (digits) =>
    digits
      .split('')
      .map((d) => SUBSCRIPT_DIGITS[Number(d)] ?? d)
      .join('')
  )
}

export function hillFormulaFromSmiles(smiles: string): string {
  return toUnicodeSubscripts(molecularFormula(parseSmiles(smiles)))
}

function findNcertRow(list: readonly NcertCompoundName[], iupac: string): NcertCompoundName {
  const row = list.find((r) => r.iupac === iupac)
  if (!row) {
    throw new Error(`NCERT data missing entry for ${iupac}`)
  }
  return row
}

// -----------------------------------------------------------------------------
// Geometry builders (exact bond-length units, y pointing down)
// -----------------------------------------------------------------------------

const COS30 = Math.sqrt(3) / 2
const SIN30 = 0.5

/** Regular polygon centered at `(cx, cy)` with vertex 0 at `startDeg` (default -90 = top), running clockwise. */
function polygonVertices(sides: number, cx: number, cy: number, radius = 1, startDeg = -90): { x: number; y: number }[] {
  return Array.from({ length: sides }, (_, k) => {
    const rad = ((startDeg + (k * 360) / sides) * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  })
}

function benzeneSpec(
  cx: number,
  cy: number,
  startDeg: number,
  role: AtomRole,
  locantStart?: number,
  numberedVertices: readonly number[] = [0, 1, 2, 3, 4, 5],
  idPrefix = 'r'
): { atoms: AtomNode[]; bonds: BondEdge[]; verts: { x: number; y: number }[] } {
  const verts = polygonVertices(6, cx, cy, 1, startDeg)
  const ringCenter = { x: cx, y: cy }
  const atoms: AtomNode[] = verts.map((v, k) => {
    const deg = startDeg + (k * 360) / 6
    const locIdx = numberedVertices.indexOf(k)
    return {
      id: `${idPrefix}${k}`,
      x: v.x,
      y: v.y,
      label: null,
      role,
      locant: locantStart !== undefined && locIdx >= 0 ? locantStart + locIdx : undefined,
      locantAngle: deg,
    }
  })
  const bonds: BondEdge[] = verts.map((_, k) => ({
    from: `${idPrefix}${k}`,
    to: `${idPrefix}${(k + 1) % 6}`,
    order: k % 2 === 0 ? 2 : 1,
    role,
    ringCenter,
  }))
  return { atoms, bonds, verts }
}

function chainZigZag(
  count: number,
  startX: number,
  startY: number,
  dir: 1 | -1,
  firstDown: boolean,
  role: AtomRole,
  idPrefix = 'c'
): AtomNode[] {
  const nodes: AtomNode[] = []
  let x = startX
  let y = startY
  for (let i = 0; i < count; i++) {
    nodes.push({
      id: `${idPrefix}${i}`,
      x,
      y,
      label: null,
      role,
    })
    const goDown = i % 2 === 0 ? firstDown : !firstDown
    x += dir * COS30
    y += goDown ? SIN30 : -SIN30
  }
  return nodes
}

// -----------------------------------------------------------------------------
// Alcohols (11 NCERT skeletons)
// -----------------------------------------------------------------------------

export type AlcoholPresetId =
  | 'methanol'
  | 'propan-1-ol'
  | 'propan-2-ol'
  | 'butan-1-ol'
  | 'butan-2-ol'
  | '2-methylpropan-1-ol'
  | '2-methylpropan-2-ol'
  | 'ethane-1,2-diol'
  | 'propane-1,2,3-triol'
  | 'cyclohexanol'
  | '2-methylcyclopentanol'

export const ALCOHOL_PRESETS: readonly { id: AlcoholPresetId; label: string }[] = [
  { id: 'methanol', label: 'Methanol' },
  { id: 'propan-1-ol', label: 'Propan-1-ol' },
  { id: 'propan-2-ol', label: 'Propan-2-ol' },
  { id: 'butan-1-ol', label: 'Butan-1-ol' },
  { id: 'butan-2-ol', label: 'Butan-2-ol' },
  { id: '2-methylpropan-1-ol', label: '2-Methylpropan-1-ol' },
  { id: '2-methylpropan-2-ol', label: '2-Methylpropan-2-ol' },
  { id: 'ethane-1,2-diol', label: 'Ethane-1,2-diol' },
  { id: 'propane-1,2,3-triol', label: 'Propane-1,2,3-triol' },
  { id: 'cyclohexanol', label: 'Cyclohexanol' },
  { id: '2-methylcyclopentanol', label: '2-Methylcyclopentanol' },
] as const

export function getAlcoholNomenclature(id: AlcoholPresetId): NomenclatureEntry {
  switch (id) {
    case 'methanol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Methanol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Methan', kind: 'parent' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '1 C alkane (methane) -> drop -e, add -ol',
        steps: [
          'Parent: 1-carbon alkane bearing -OH is methane.',
          'Numbering: single carbon needs no locant.',
          'Assembly: replace trailing -e of methane with -ol -> Methanol.',
        ],
        structure: {
          atoms: [
            { id: 'c1', x: -0.65, y: 0, label: 'CH₃', role: 'parent', locant: 1, locantAngle: -90 },
            { id: 'o1', x: 0.65, y: 0, label: 'OH', role: 'functional' },
          ],
          bonds: [{ from: 'c1', to: 'o1', order: 1, role: 'functional' }],
        },
      }
    }
    case 'propan-1-ol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Propan-1-ol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Propan', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '1', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '3 C chain numbered from -OH end -> C-1',
        steps: [
          'Parent: longest continuous chain carrying -OH has 3 carbons (propane).',
          'Numbering: start from the right end nearest -OH so the -OH carbon is C-1.',
          'Assembly: drop -e and insert locant 1 before -ol -> Propan-1-ol.',
        ],
        structure: {
          atoms: [
            { id: 'c3', x: -1.3, y: 0.25, label: null, role: 'parent', locant: 3, locantAngle: 120 },
            { id: 'c2', x: -0.433, y: -0.25, label: null, role: 'parent', locant: 2, locantAngle: -90 },
            { id: 'c1', x: 0.433, y: 0.25, label: null, role: 'parent', locant: 1, locantAngle: 90 },
            { id: 'o1', x: 1.3, y: -0.25, label: 'OH', role: 'functional' },
          ],
          bonds: [
            { from: 'c3', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c1', order: 1, role: 'parent' },
            { from: 'c1', to: 'o1', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case 'propan-2-ol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Propan-2-ol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Propan', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '3 C chain with -OH on central C-2',
        steps: [
          'Parent: longest continuous chain carrying -OH has 3 carbons (propane).',
          'Numbering: either end puts the -OH group on C-2.',
          'Assembly: drop -e and place locant 2 before -ol -> Propan-2-ol.',
        ],
        structure: {
          atoms: [
            { id: 'c1', x: -0.866, y: 0.4, label: null, role: 'parent', locant: 1, locantAngle: 120 },
            { id: 'c2', x: 0, y: -0.1, label: null, role: 'parent', locant: 2, locantAngle: 90 },
            { id: 'c3', x: 0.866, y: 0.4, label: null, role: 'parent', locant: 3, locantAngle: 60 },
            { id: 'o1', x: 0, y: -1.1, label: 'OH', role: 'functional' },
          ],
          bonds: [
            { from: 'c1', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c3', order: 1, role: 'parent' },
            { from: 'c2', to: 'o1', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case 'butan-1-ol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Butan-1-ol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Butan', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '1', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '4 C chain numbered from -OH end -> C-1',
        steps: [
          'Parent: 4-carbon unbranched chain bearing -OH is butane.',
          'Numbering: start at the -OH carbon so -OH gets locant 1 (not 4).',
          'Assembly: drop -e and add -1-ol -> Butan-1-ol.',
        ],
        structure: {
          atoms: [
            { id: 'c4', x: -1.732, y: -0.25, label: null, role: 'parent', locant: 4, locantAngle: -120 },
            { id: 'c3', x: -0.866, y: 0.25, label: null, role: 'parent', locant: 3, locantAngle: 90 },
            { id: 'c2', x: 0, y: -0.25, label: null, role: 'parent', locant: 2, locantAngle: -90 },
            { id: 'c1', x: 0.866, y: 0.25, label: null, role: 'parent', locant: 1, locantAngle: 90 },
            { id: 'o1', x: 1.732, y: -0.25, label: 'OH', role: 'functional' },
          ],
          bonds: [
            { from: 'c4', to: 'c3', order: 1, role: 'parent' },
            { from: 'c3', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c1', order: 1, role: 'parent' },
            { from: 'c1', to: 'o1', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case 'butan-2-ol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Butan-2-ol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Butan', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '4 C chain; lowest -OH locant is 2 (not 3)',
        steps: [
          'Parent: 4-carbon chain carrying -OH is butane.',
          'Numbering: count from the end closer to -OH -> locant 2 beats 3.',
          'Assembly: drop -e and add -2-ol -> Butan-2-ol.',
        ],
        structure: {
          atoms: [
            { id: 'c1', x: -1.3, y: 0.4, label: null, role: 'parent', locant: 1, locantAngle: 120 },
            { id: 'c2', x: -0.433, y: -0.1, label: null, role: 'parent', locant: 2, locantAngle: 90 },
            { id: 'c3', x: 0.433, y: 0.4, label: null, role: 'parent', locant: 3, locantAngle: 90 },
            { id: 'c4', x: 1.3, y: -0.1, label: null, role: 'parent', locant: 4, locantAngle: -60 },
            { id: 'o1', x: -0.433, y: -1.1, label: 'OH', role: 'functional' },
          ],
          bonds: [
            { from: 'c1', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c3', order: 1, role: 'parent' },
            { from: 'c3', to: 'c4', order: 1, role: 'parent' },
            { from: 'c2', to: 'o1', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case '2-methylpropan-1-ol': {
      const row = findNcertRow(NCERT_TABLE_7_1, '2-Methylpropan-1-ol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: '2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'Methyl', kind: 'substituent' },
          { text: 'propan', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '1', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '3 C parent carrying -OH + methyl branch at C-2',
        steps: [
          'Parent: longest chain containing the -OH carbon has 3 carbons (propane), not 4.',
          'Numbering: start at the -OH carbon (C-1), placing the methyl branch on C-2.',
          'Assembly: prefix 2-methyl before propan-1-ol -> 2-Methylpropan-1-ol.',
        ],
        structure: {
          atoms: [
            { id: 'c3', x: -0.866, y: 0.45, label: null, role: 'parent', locant: 3, locantAngle: 120 },
            { id: 'c2', x: 0, y: -0.05, label: null, role: 'parent', locant: 2, locantAngle: 90 },
            { id: 'c1', x: 0.866, y: 0.45, label: null, role: 'parent', locant: 1, locantAngle: 90 },
            { id: 'o1', x: 1.732, y: -0.05, label: 'OH', role: 'functional' },
            { id: 'me', x: 0, y: -1.05, label: 'CH₃', role: 'branch' },
          ],
          bonds: [
            { from: 'c3', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c1', order: 1, role: 'parent' },
            { from: 'c1', to: 'o1', order: 1, role: 'functional' },
            { from: 'c2', to: 'me', order: 1, role: 'branch' },
          ],
        },
      }
    }
    case '2-methylpropan-2-ol': {
      const row = findNcertRow(NCERT_TABLE_7_1, '2-Methylpropan-2-ol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: '2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'Methyl', kind: 'substituent' },
          { text: 'propan', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '3 C parent; both -OH and methyl branch sit on C-2',
        steps: [
          'Parent: longest continuous chain through the central tertiary carbon is 3 carbons (propane).',
          'Numbering: either chain end puts both -OH and the methyl branch on C-2.',
          'Assembly: 2-methyl + propan-2-ol -> 2-Methylpropan-2-ol.',
        ],
        structure: {
          atoms: [
            { id: 'c1', x: -0.9, y: 0.2, label: null, role: 'parent', locant: 1, locantAngle: 145 },
            { id: 'c2', x: 0, y: -0.2, label: null, role: 'parent', locant: 2, locantAngle: -45 },
            { id: 'c3', x: 0.9, y: 0.2, label: null, role: 'parent', locant: 3, locantAngle: 35 },
            { id: 'o1', x: 0, y: -1.15, label: 'OH', role: 'functional' },
            { id: 'me', x: 0, y: 0.85, label: 'CH₃', role: 'branch' },
          ],
          bonds: [
            { from: 'c1', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c3', order: 1, role: 'parent' },
            { from: 'c2', to: 'o1', order: 1, role: 'functional' },
            { from: 'c2', to: 'me', order: 1, role: 'branch' },
          ],
        },
      }
    }
    case 'ethane-1,2-diol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Ethane-1,2-diol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Ethane', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '1,2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'diol', kind: 'suffix' },
        ],
        parentRuleBadge: '2 -OH groups -> keep final -e of ethane before -diol',
        steps: [
          'Parent: 2-carbon chain carrying both -OH groups is ethane.',
          'Numbering: one -OH sits on C-1 and the other on C-2 (symmetric).',
          'Assembly: retain -e before the consonant d in -diol -> Ethane-1,2-diol.',
        ],
        structure: {
          atoms: [
            { id: 'o1', x: -1.3, y: 0.25, label: 'HO', role: 'functional' },
            { id: 'c1', x: -0.433, y: -0.25, label: null, role: 'parent', locant: 1, locantAngle: -90 },
            { id: 'c2', x: 0.433, y: 0.25, label: null, role: 'parent', locant: 2, locantAngle: 90 },
            { id: 'o2', x: 1.3, y: -0.25, label: 'OH', role: 'functional' },
          ],
          bonds: [
            { from: 'o1', to: 'c1', order: 1, role: 'functional' },
            { from: 'c1', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'o2', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case 'propane-1,2,3-triol': {
      const row = findNcertRow(NCERT_TABLE_7_1, 'Propane-1,2,3-triol')
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Propane', kind: 'parent' },
          { text: '-', kind: 'punctuation' },
          { text: '1,2,3', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'triol', kind: 'suffix' },
        ],
        parentRuleBadge: '3 -OH groups -> keep final -e of propane before -triol',
        steps: [
          'Parent: 3-carbon chain carrying all three -OH groups is propane.',
          'Numbering: -OH groups occupy C-1, C-2, and C-3.',
          'Assembly: keep trailing -e before consonant t in -triol -> Propane-1,2,3-triol.',
        ],
        structure: {
          atoms: [
            { id: 'o1', x: -1.732, y: -0.1, label: 'HO', role: 'functional' },
            { id: 'c1', x: -0.866, y: 0.4, label: null, role: 'parent', locant: 1, locantAngle: 90 },
            { id: 'c2', x: 0, y: -0.1, label: null, role: 'parent', locant: 2, locantAngle: 90 },
            { id: 'c3', x: 0.866, y: 0.4, label: null, role: 'parent', locant: 3, locantAngle: 90 },
            { id: 'o2', x: 0, y: -1.1, label: 'OH', role: 'functional' },
            { id: 'o3', x: 1.732, y: -0.1, label: 'OH', role: 'functional' },
          ],
          bonds: [
            { from: 'o1', to: 'c1', order: 1, role: 'functional' },
            { from: 'c1', to: 'c2', order: 1, role: 'parent' },
            { from: 'c2', to: 'c3', order: 1, role: 'parent' },
            { from: 'c2', to: 'o2', order: 1, role: 'functional' },
            { from: 'c3', to: 'o3', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case 'cyclohexanol': {
      const row = findNcertRow(NCERT_CYCLIC_ALCOHOLS, 'Cyclohexanol')
      const verts = polygonVertices(6, 0, 0.15, 1, -90)
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: 'Cyclo', kind: 'substituent' },
          { text: 'hexan', kind: 'parent' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '6 C saturated ring; -OH carbon is fixed at C-1',
        steps: [
          'Parent: 6-membered saturated ring takes prefix cyclo- -> cyclohexane.',
          'Numbering: the carbon attached to -OH is fixed as C-1 (locant omitted for single -OH).',
          'Assembly: replace -e of cyclohexane with -ol -> Cyclohexanol.',
        ],
        structure: {
          atoms: [
            ...verts.map((v, k) => ({
              id: `c${k + 1}`,
              x: v.x,
              y: v.y,
              label: null,
              role: 'parent' as const,
              locant: k + 1,
              locantAngle: k === 0 ? 90 : -90 + k * 60,
            })),
            { id: 'o1', x: 0, y: -1.75, label: 'OH', role: 'functional' as const },
          ],
          bonds: [
            ...verts.map((_, k) => ({
              from: `c${k + 1}`,
              to: `c${((k + 1) % 6) + 1}`,
              order: 1 as const,
              role: 'parent' as const,
            })),
            { from: 'c1', to: 'o1', order: 1, role: 'functional' },
          ],
        },
      }
    }
    case '2-methylcyclopentanol': {
      const row = findNcertRow(NCERT_CYCLIC_ALCOHOLS, '2-Methylcyclopentanol')
      const verts = polygonVertices(5, 0, 0.15, 1, -90)
      const c2Dir = (-18 * Math.PI) / 180
      return {
        id,
        family: 'alcohols',
        smiles: row.smiles,
        condensedFormula: row.unicode,
        molecularFormula: hillFormulaFromSmiles(row.smiles),
        commonName: row.common,
        iupacName: row.iupac,
        iupacTokens: [
          { text: '2', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: 'Methyl', kind: 'substituent' },
          { text: 'cyclopentan', kind: 'parent' },
          { text: 'ol', kind: 'suffix' },
        ],
        parentRuleBadge: '5 C ring with -OH at C-1; methyl gets locant 2 (not 5)',
        steps: [
          'Parent: 5-membered ring carrying -OH gives cyclopentanol.',
          'Numbering: C-1 is fixed at -OH; numbering clockwise puts methyl at C-2 (2 < 5).',
          'Assembly: prefix 2-methyl before cyclopentanol -> 2-Methylcyclopentanol.',
        ],
        structure: {
          atoms: [
            ...verts.map((v, k) => ({
              id: `c${k + 1}`,
              x: v.x,
              y: v.y,
              label: null,
              role: 'parent' as const,
              locant: k + 1,
              locantAngle: k === 0 ? 90 : k === 1 ? 162 : -90 + k * 72,
            })),
            { id: 'o1', x: 0, y: -1.75, label: 'OH', role: 'functional' as const },
            {
              id: 'me',
              x: verts[1].x + 0.9 * Math.cos(c2Dir),
              y: verts[1].y + 0.9 * Math.sin(c2Dir),
              label: 'CH₃',
              role: 'branch' as const,
            },
          ],
          bonds: [
            ...verts.map((_, k) => ({
              from: `c${k + 1}`,
              to: `c${((k + 1) % 5) + 1}`,
              order: 1 as const,
              role: 'parent' as const,
            })),
            { from: 'c1', to: 'o1', order: 1, role: 'functional' },
            { from: 'c2', to: 'me', order: 1, role: 'branch' },
          ],
        },
      }
    }
  }
}

// -----------------------------------------------------------------------------
// Phenols (Phenol + Cresols + Benzenediols)
// -----------------------------------------------------------------------------

export type PhenolSubstituent = 'none' | 'methyl' | 'hydroxyl'
export type RingPosition = 'ortho' | 'meta' | 'para'

const POSITION_INDEX: Record<RingPosition, { vertex: number; locant: number; label: string }> = {
  ortho: { vertex: 1, locant: 2, label: '1,2 (ortho)' },
  meta: { vertex: 2, locant: 3, label: '1,3 (meta)' },
  para: { vertex: 3, locant: 4, label: '1,4 (para)' },
}

export function getPhenolNomenclature(substituent: PhenolSubstituent, position: RingPosition): NomenclatureEntry {
  const ring = benzeneSpec(0, 0.1, -90, 'parent', 1, [0, 1, 2, 3, 4, 5], 'c')
  const vTop = ring.verts[0]

  if (substituent === 'none') {
    const row = findNcertRow(NCERT_PHENOL_NAMES, 'Phenol')
    ring.atoms[0].locantAngle = -145
    return {
      id: 'phenol',
      family: 'phenols',
      smiles: row.smiles,
      condensedFormula: row.unicode,
      molecularFormula: hillFormulaFromSmiles(row.smiles),
      commonName: row.common,
      iupacName: row.iupac,
      iupacTokens: [{ text: 'Phenol', kind: 'parent' }],
      parentRuleBadge: 'Accepted common and IUPAC name for C₆H₅OH',
      steps: [
        'Parent: benzene ring bearing one -OH group is named phenol.',
        'Numbering: -OH carbon is C-1 (no second substituent present).',
        'Assembly: Phenol is used identically in common and IUPAC systems.',
      ],
      structure: {
        atoms: [
          ...ring.atoms,
          { id: 'oh1', x: vTop.x, y: vTop.y - 0.9, label: 'OH', role: 'functional' },
        ],
        bonds: [...ring.bonds, { from: 'c0', to: 'oh1', order: 1, role: 'functional' }],
      },
    }
  }

  const pos = POSITION_INDEX[position]
  const vSub = ring.verts[pos.vertex]
  const subDeg = -90 + pos.vertex * 60
  const subRad = (subDeg * Math.PI) / 180
  // Keep locant badge neatly clear of the substituent bond at vertex 0 and pos.vertex
  ring.atoms[0].locantAngle = -145
  ring.atoms[pos.vertex].locantAngle = subDeg + 60

  if (substituent === 'methyl') {
    const targetIupac = `${pos.locant}-Methylphenol`
    const row = findNcertRow(NCERT_PHENOL_NAMES, targetIupac)
    return {
      id: `cresol-${position}`,
      family: 'phenols',
      smiles: row.smiles,
      condensedFormula: row.unicode,
      molecularFormula: hillFormulaFromSmiles(row.smiles),
      commonName: row.common,
      iupacName: row.iupac,
      iupacTokens: [
        { text: String(pos.locant), kind: 'locant' },
        { text: '-', kind: 'punctuation' },
        { text: 'Methyl', kind: 'substituent' },
        { text: 'phenol', kind: 'parent' },
      ],
      parentRuleBadge: `C-1 at -OH; ${position} maps to locant ${pos.locant}`,
      steps: [
        'Parent: hydroxybenzene is phenol (C-1 is fixed at the -OH carbon).',
        `Numbering: the ${pos.label} methyl substituent sits on C-${pos.locant}.`,
        `Assembly: combine locant and substituent before phenol -> ${row.iupac}.`,
      ],
      structure: {
        atoms: [
          ...ring.atoms,
          { id: 'oh1', x: vTop.x, y: vTop.y - 0.9, label: 'OH', role: 'functional' },
          {
            id: 'me',
            x: vSub.x + 0.9 * Math.cos(subRad),
            y: vSub.y + 0.9 * Math.sin(subRad),
            label: 'CH₃',
            role: 'branch',
          },
        ],
        bonds: [
          ...ring.bonds,
          { from: 'c0', to: 'oh1', order: 1, role: 'functional' },
          { from: `c${pos.vertex}`, to: 'me', order: 1, role: 'branch' },
        ],
      },
    }
  }

  // substituent === 'hydroxyl'
  const targetIupac = `Benzene-1,${pos.locant}-diol`
  const row = findNcertRow(NCERT_PHENOL_NAMES, targetIupac)
  return {
    id: `benzenediol-${position}`,
    family: 'phenols',
    smiles: row.smiles,
    condensedFormula: row.unicode,
    molecularFormula: hillFormulaFromSmiles(row.smiles),
    commonName: row.common,
    commonAlt: row.commonAlt,
    iupacName: row.iupac,
    iupacTokens: [
      { text: 'Benzene', kind: 'parent' },
      { text: '-', kind: 'punctuation' },
      { text: `1,${pos.locant}`, kind: 'locant' },
      { text: '-', kind: 'punctuation' },
      { text: 'diol', kind: 'suffix' },
    ],
    parentRuleBadge: `2 -OH groups on ring -> keep final -e of benzene`,
    steps: [
      'Parent: two -OH groups on the aromatic ring use parent benzene.',
      `Numbering: the two -OH groups sit at C-1 and C-${pos.locant} (${position}).`,
      `Assembly: retain -e in benzene before -diol -> ${row.iupac}.`,
    ],
    structure: {
      atoms: [
        ...ring.atoms,
        { id: 'oh1', x: vTop.x, y: vTop.y - 0.9, label: 'OH', role: 'functional' },
        {
          id: 'oh2',
          x: vSub.x + 0.9 * Math.cos(subRad),
          y: vSub.y + 0.9 * Math.sin(subRad),
          label: 'OH',
          role: 'functional',
        },
      ],
      bonds: [
        ...ring.bonds,
        { from: 'c0', to: 'oh1', order: 1, role: 'functional' },
        { from: `c${pos.vertex}`, to: 'oh2', order: 1, role: 'functional' },
      ],
    },
  }
}

// -----------------------------------------------------------------------------
// Ethers (R1-O-R2 builder + 2 special Table 7.2 presets)
// -----------------------------------------------------------------------------

export type EtherLeftGroup = 'methyl' | 'ethyl' | 'isopropyl' | 'phenyl'
export type EtherRightGroup = 'methyl' | 'ethyl' | 'propyl' | 'isopentyl' | 'heptyl' | 'phenyl'
export type EtherSpecialPreset = '1,2-dimethoxyethane' | '2-ethoxy-1,1-dimethylcyclohexane'

interface GroupMeta {
  id: EtherLeftGroup | EtherRightGroup
  label: string
  carbons: number
  commonFragment: string
  commonSortKey: string
  condensed: string
  smilesFragmentRight: string
  alkoxyPrefix: string
}

export const ETHER_GROUPS: Record<EtherLeftGroup | EtherRightGroup, GroupMeta> = {
  methyl: {
    id: 'methyl',
    label: 'Methyl',
    carbons: 1,
    commonFragment: 'methyl',
    commonSortKey: 'methyl',
    condensed: 'CH₃',
    smilesFragmentRight: 'C',
    alkoxyPrefix: 'methoxy',
  },
  ethyl: {
    id: 'ethyl',
    label: 'Ethyl',
    carbons: 2,
    commonFragment: 'ethyl',
    commonSortKey: 'ethyl',
    condensed: 'C₂H₅',
    smilesFragmentRight: 'CC',
    alkoxyPrefix: 'ethoxy',
  },
  isopropyl: {
    id: 'isopropyl',
    label: 'Isopropyl',
    carbons: 3,
    commonFragment: 'isopropyl',
    commonSortKey: 'isopropyl',
    condensed: 'CH(CH₃)₂',
    smilesFragmentRight: 'C(C)C',
    alkoxyPrefix: 'isopropoxy',
  },
  propyl: {
    id: 'propyl',
    label: 'n-Propyl',
    carbons: 3,
    commonFragment: 'n-propyl',
    commonSortKey: 'propyl',
    condensed: 'CH₂CH₂CH₃',
    smilesFragmentRight: 'CCC',
    alkoxyPrefix: 'propoxy',
  },
  isopentyl: {
    id: 'isopentyl',
    label: 'Isopentyl',
    carbons: 5,
    commonFragment: 'isopentyl',
    commonSortKey: 'isopentyl',
    condensed: 'CH₂CH₂CH(CH₃)₂',
    smilesFragmentRight: 'CCC(C)C',
    alkoxyPrefix: '3-methylbutoxy',
  },
  heptyl: {
    id: 'heptyl',
    label: 'Heptyl',
    carbons: 7,
    commonFragment: 'heptyl',
    commonSortKey: 'heptyl',
    condensed: '(CH₂)₆CH₃',
    smilesFragmentRight: 'CCCCCCC',
    alkoxyPrefix: 'heptyloxy',
  },
  phenyl: {
    id: 'phenyl',
    label: 'Phenyl',
    carbons: 6,
    commonFragment: 'phenyl',
    commonSortKey: 'phenyl',
    condensed: 'C₆H₅',
    smilesFragmentRight: 'C1=CC=CC=C1',
    alkoxyPrefix: 'phenoxy',
  },
}

function capitalize(word: string): string {
  return word.replace(/[a-zA-Z]/, (ch) => ch.toUpperCase())
}

function buildEtherSmiles(r1: EtherLeftGroup, r2: EtherRightGroup): string {
  const left =
    r1 === 'phenyl'
      ? 'C1=CC=CC=C1'
      : r1 === 'isopropyl'
        ? 'CC(C)'
        : r1 === 'ethyl'
          ? 'CC'
          : 'C'
  const right = ETHER_GROUPS[r2].smilesFragmentRight
  return `${left}O${right}`
}

function buildEtherCommonName(r1: EtherLeftGroup, r2: EtherRightGroup): { common: string; alt?: string } {
  const pair = new Set([r1, r2])
  // Exact NCERT Table 7.2 printed names where NCERT differs from strict alphabetical tie-breakers
  if (r1 === r2) {
    return { common: `Di${ETHER_GROUPS[r1].commonFragment} ether` }
  }
  if (pair.has('methyl') && pair.has('ethyl')) {
    return { common: 'Ethylmethyl ether' }
  }
  if (pair.has('methyl') && pair.has('propyl')) {
    return { common: 'Methyl n-propyl ether' }
  }
  if (pair.has('methyl') && pair.has('isopropyl')) {
    return { common: 'Methyl isopropyl ether' }
  }
  if (pair.has('methyl') && pair.has('phenyl')) {
    return { common: 'Methyl phenyl ether', alt: 'Anisole' }
  }
  if (pair.has('ethyl') && pair.has('phenyl')) {
    return { common: 'Ethyl phenyl ether', alt: 'Phenetole' }
  }
  if (pair.has('phenyl') && pair.has('isopentyl')) {
    return { common: 'Phenyl isopentyl ether' }
  }
  if (pair.has('phenyl') && pair.has('heptyl')) {
    return { common: 'Heptyl phenyl ether' }
  }
  const g1 = ETHER_GROUPS[r1]
  const g2 = ETHER_GROUPS[r2]
  const sorted = [g1, g2].sort((a, b) => a.commonSortKey.localeCompare(b.commonSortKey))
  return { common: `${capitalize(sorted[0].commonFragment)} ${sorted[1].commonFragment} ether` }
}

/** Build 2D coordinates for one side of the ether oxygen at `(0, -0.35)`. */
function buildEtherArm(
  group: EtherLeftGroup | EtherRightGroup,
  side: 'left' | 'right',
  role: AtomRole,
  numbered: boolean
): { atoms: AtomNode[]; bonds: BondEdge[]; attachId: string } {
  const dir: 1 | -1 = side === 'right' ? 1 : -1
  const prefix = side === 'left' ? 'L' : 'R'
  const ax = dir * COS30
  const ay = 0.15

  if (group === 'methyl') {
    const id = `${prefix}c0`
    return {
      attachId: id,
      atoms: [{ id, x: ax, y: ay, label: 'CH₃', role, locant: numbered ? 1 : undefined, locantAngle: 90 }],
      bonds: [],
    }
  }

  if (group === 'ethyl') {
    const nodes = chainZigZag(2, ax, ay, dir, false, role, `${prefix}c`)
    if (numbered) {
      nodes[0].locant = 1
      nodes[0].locantAngle = 90
      nodes[1].locant = 2
      nodes[1].locantAngle = -90
    }
    return {
      attachId: nodes[0].id,
      atoms: nodes,
      bonds: [{ from: nodes[0].id, to: nodes[1].id, order: 1, role }],
    }
  }

  if (group === 'propyl') {
    const nodes = chainZigZag(3, ax, ay, dir, false, role, `${prefix}c`)
    if (numbered) {
      nodes[0].locant = 1
      nodes[0].locantAngle = 90
      nodes[1].locant = 2
      nodes[1].locantAngle = -90
      nodes[2].locant = 3
      nodes[2].locantAngle = 90
    }
    return {
      attachId: nodes[0].id,
      atoms: nodes,
      bonds: [
        { from: nodes[0].id, to: nodes[1].id, order: 1, role },
        { from: nodes[1].id, to: nodes[2].id, order: 1, role },
      ],
    }
  }

  if (group === 'isopropyl') {
    // Central C attaches to O; two methyl arms extend outward at -30/+90 (right) or -150/+90 (left)
    const cMid: AtomNode = {
      id: `${prefix}c2`,
      x: ax,
      y: ay,
      label: null,
      role,
      locant: numbered ? 2 : undefined,
      locantAngle: side === 'left' ? 30 : 150,
    }
    const cEnd1: AtomNode = {
      id: `${prefix}c1`,
      x: ax + dir * COS30,
      y: ay - SIN30,
      label: numbered ? null : 'CH₃',
      role,
      locant: numbered ? 1 : undefined,
      locantAngle: -90,
    }
    const cEnd3: AtomNode = {
      id: `${prefix}c3`,
      x: ax,
      y: ay + 1,
      label: numbered ? null : 'CH₃',
      role,
      locant: numbered ? 3 : undefined,
      locantAngle: 90,
    }
    return {
      attachId: cMid.id,
      atoms: [cEnd1, cMid, cEnd3],
      bonds: [
        { from: cMid.id, to: cEnd1.id, order: 1, role },
        { from: cMid.id, to: cEnd3.id, order: 1, role },
      ],
    }
  }

  if (group === 'isopentyl') {
    // 4-carbon chain C1-C2-C3-C4 with methyl branch down at C3
    const nodes = chainZigZag(4, ax, ay, dir, false, role, `${prefix}c`)
    const branch: AtomNode = {
      id: `${prefix}me`,
      x: nodes[2].x,
      y: nodes[2].y + 1.0,
      label: 'CH₃',
      role: 'branch',
    }
    if (numbered) {
      nodes[0].locant = 1
      nodes[0].locantAngle = 90
      nodes[1].locant = 2
      nodes[1].locantAngle = -90
      nodes[2].locant = 3
      nodes[2].locantAngle = -90
      nodes[3].locant = 4
      nodes[3].locantAngle = -90
    }
    return {
      attachId: nodes[0].id,
      atoms: [...nodes, branch],
      bonds: [
        { from: nodes[0].id, to: nodes[1].id, order: 1, role },
        { from: nodes[1].id, to: nodes[2].id, order: 1, role },
        { from: nodes[2].id, to: nodes[3].id, order: 1, role },
        { from: nodes[2].id, to: branch.id, order: 1, role: 'branch' },
      ],
    }
  }

  if (group === 'heptyl') {
    const nodes = chainZigZag(7, ax, ay, dir, false, role, `${prefix}c`)
    if (numbered) {
      nodes.forEach((n, idx) => {
        n.locant = idx + 1
        n.locantAngle = idx % 2 === 0 ? 90 : -90
      })
    }
    const bonds: BondEdge[] = []
    for (let i = 0; i < 6; i++) {
      bonds.push({ from: nodes[i].id, to: nodes[i + 1].id, order: 1, role })
    }
    return { attachId: nodes[0].id, atoms: nodes, bonds }
  }

  // phenyl
  const cx = side === 'left' ? ax - 1.0 : ax + 1.0
  const startDeg = side === 'left' ? 0 : 180
  const ring = benzeneSpec(cx, ay, startDeg, role, numbered ? 1 : undefined, [0, 1, 2, 3, 4, 5], `${prefix}r`)
  if (numbered) {
    ring.atoms[0].locantAngle = side === 'left' ? 45 : 135
  }
  return { attachId: ring.atoms[0].id, atoms: ring.atoms, bonds: ring.bonds }
}

export function getEtherPairNomenclature(r1: EtherLeftGroup, r2: EtherRightGroup): NomenclatureEntry {
  const left = ETHER_GROUPS[r1]
  const right = ETHER_GROUPS[r2]
  if (r1 === 'phenyl' && r2 === 'phenyl') {
    throw new Error('Diphenyl ether is outside the alkyl/aryl pair scope')
  }

  // Determine parent side: strictly larger carbon count wins; on tie (e.g. isopropyl vs n-propyl), unbranched chain wins
  const parentSide: 'left' | 'right' =
    left.carbons > right.carbons
      ? 'left'
      : right.carbons > left.carbons
        ? 'right'
        : r1 === 'isopropyl' && r2 === 'propyl'
          ? 'right'
          : 'right'

  const parentGroup = parentSide === 'left' ? left : right
  const subGroup = parentSide === 'left' ? right : left
  const smiles = buildEtherSmiles(r1, r2)
  const { common, alt: commonAlt } = buildEtherCommonName(r1, r2)
  const condensedFormula =
    r1 === 'phenyl' && r2 === 'heptyl'
      ? 'C₆H₅O(CH₂)₆CH₃'
      : r1 === 'phenyl' && r2 === 'isopentyl'
        ? 'C₆H₅OCH₂CH₂CH(CH₃)₂'
        : `${left.condensed}O${right.condensed}`

  let iupacName: string
  let iupacAlt: string | undefined
  let iupacTokens: IupacToken[]
  let steps: [string, string, string]

  if (parentGroup.id === 'phenyl') {
    // Benzene is parent -> alkoxybenzene
    const alkoxy = subGroup.alkoxyPrefix
    const capAlkoxy = capitalize(alkoxy)
    iupacName = `${capAlkoxy}benzene`
    if (subGroup.id === 'methyl') {
      iupacAlt = 'Anisole'
    } else if (subGroup.id === 'isopentyl') {
      iupacAlt = '(3-Methylbutoxy)benzene'
    }
    iupacTokens = [
      { text: capAlkoxy, kind: 'substituent' },
      { text: 'benzene', kind: 'parent' },
    ]
    steps = [
      `Parent: benzene ring (${parentGroup.carbons} C) > ${subGroup.label.toLowerCase()} (${subGroup.carbons} C), so benzene is the parent.`,
      `Substituent: -O${subGroup.condensed} becomes the ${alkoxy} group at C-1 (locant omitted for monosubstituted benzene).`,
      `Assembly: prefix ${alkoxy} before benzene -> ${iupacName}.`,
    ]
  } else if (parentGroup.id === 'isopentyl') {
    // 5 C isopentyl > 1/2/3 C -> 1-alkoxy-3-methylbutane (4-C butane chain, alkoxy at C-1, methyl at C-3)
    const alkoxy = subGroup.alkoxyPrefix
    const capAlkoxy = capitalize(alkoxy)
    iupacName = `1-${capAlkoxy}-3-methylbutane`
    iupacTokens = [
      { text: '1', kind: 'locant' },
      { text: '-', kind: 'punctuation' },
      { text: capAlkoxy, kind: 'substituent' },
      { text: '-', kind: 'punctuation' },
      { text: '3', kind: 'locant' },
      { text: '-', kind: 'punctuation' },
      { text: 'methyl', kind: 'substituent' },
      { text: 'butane', kind: 'parent' },
    ]
    steps = [
      `Parent: isopentyl (${parentGroup.carbons} C) > ${subGroup.label.toLowerCase()} (${subGroup.carbons} C); its longest continuous chain is 4 C (butane).`,
      `Numbering: start at the oxygen-attached carbon so substituents take {1, 3} instead of {2, 4}.`,
      `Assembly: list ${alkoxy} (1) and methyl (3) before butane -> ${iupacName}.`,
    ]
  } else if (parentGroup.id === 'isopropyl') {
    // 3 C isopropyl > 1 C methyl or 2 C ethyl -> 2-alkoxypropane
    const alkoxy = subGroup.alkoxyPrefix
    iupacName = `2-${capitalize(alkoxy)}propane`
    iupacTokens = [
      { text: '2', kind: 'locant' },
      { text: '-', kind: 'punctuation' },
      { text: capitalize(alkoxy), kind: 'substituent' },
      { text: 'propane', kind: 'parent' },
    ]
    steps = [
      `Parent: isopropyl (${parentGroup.carbons} C) > ${subGroup.label.toLowerCase()} (${subGroup.carbons} C), so the 3 C propane chain is the parent.`,
      `Numbering: the -O${subGroup.condensed} group sits on the middle carbon -> locant 2.`,
      `Assembly: 2-${alkoxy} + propane -> ${iupacName}.`,
    ]
  } else {
    // Straight-chain parent: methyl (1 C), ethyl (2 C), propyl (3 C), heptyl (7 C)
    const alkoxy = subGroup.alkoxyPrefix
    const capAlkoxy = capitalize(alkoxy)
    const alkaneName =
      parentGroup.id === 'methyl'
        ? 'methane'
        : parentGroup.id === 'ethyl'
          ? 'ethane'
          : parentGroup.id === 'propyl'
            ? 'propane'
            : 'heptane'
    const needsLocant = parentGroup.carbons >= 3
    iupacName = needsLocant ? `1-${capAlkoxy}${alkaneName}` : `${capAlkoxy}${alkaneName}`
    iupacTokens = needsLocant
      ? [
          { text: '1', kind: 'locant' },
          { text: '-', kind: 'punctuation' },
          { text: capAlkoxy, kind: 'substituent' },
          { text: alkaneName, kind: 'parent' },
        ]
      : [
          { text: capAlkoxy, kind: 'substituent' },
          { text: alkaneName, kind: 'parent' },
        ]
    steps = [
      left.carbons === right.carbons
        ? `Parent: both groups have ${parentGroup.carbons} C; ${alkaneName} serves as the parent hydrocarbon.`
        : `Parent: ${parentGroup.label.toLowerCase()} (${parentGroup.carbons} C) > ${subGroup.label.toLowerCase()} (${subGroup.carbons} C), so ${alkaneName} is the parent.`,
      needsLocant
        ? `Numbering: number from the oxygen-attached end so the ${alkoxy} group sits at C-1.`
        : `Numbering: ${alkaneName} has only one unique position, so locant 1 is omitted.`,
      `Assembly: attach ${alkoxy} prefix to ${alkaneName} -> ${iupacName}.`,
    ]
  }

  const parentRuleBadge =
    left.carbons === right.carbons
      ? `${left.label} (${left.carbons} C) = ${right.label} (${right.carbons} C)`
      : `${parentGroup.label} (${parentGroup.carbons} C) > ${subGroup.label} (${subGroup.carbons} C)`

  const leftArm = buildEtherArm(r1, 'left', parentSide === 'left' ? 'parent' : 'branch', parentSide === 'left')
  const rightArm = buildEtherArm(r2, 'right', parentSide === 'right' ? 'parent' : 'branch', parentSide === 'right')
  const oNode: AtomNode = { id: 'o', x: 0, y: -0.35, label: 'O', role: 'functional' }

  return {
    id: `ether-${r1}-${r2}`,
    family: 'ethers',
    smiles,
    condensedFormula,
    molecularFormula: hillFormulaFromSmiles(smiles),
    commonName: common,
    commonAlt,
    iupacName,
    iupacAlt,
    iupacTokens,
    parentRuleBadge,
    steps,
    structure: {
      atoms: [...leftArm.atoms, oNode, ...rightArm.atoms],
      bonds: [
        ...leftArm.bonds,
        { from: leftArm.attachId, to: 'o', order: 1, role: parentSide === 'left' ? 'functional' : 'functional' },
        { from: 'o', to: rightArm.attachId, order: 1, role: 'functional' },
        ...rightArm.bonds,
      ],
    },
  }
}

export function getSpecialEtherNomenclature(preset: EtherSpecialPreset): NomenclatureEntry {
  if (preset === '1,2-dimethoxyethane') {
    const row = findNcertRow(NCERT_TABLE_7_2, '1,2-Dimethoxyethane')
    return {
      id: preset,
      family: 'ethers',
      smiles: row.smiles,
      condensedFormula: row.unicode,
      molecularFormula: hillFormulaFromSmiles(row.smiles),
      commonName: row.common,
      iupacName: row.iupac,
      iupacTokens: [
        { text: '1,2', kind: 'locant' },
        { text: '-', kind: 'punctuation' },
        { text: 'Di', kind: 'substituent' },
        { text: 'methoxy', kind: 'substituent' },
        { text: 'ethane', kind: 'parent' },
      ],
      parentRuleBadge: '2 C ethane parent with two -OCH₃ groups',
      steps: [
        'Parent: the central 2-carbon chain between the two oxygens is ethane.',
        'Numbering: the two methoxy (-OCH₃) substituents sit on carbons 1 and 2.',
        'Assembly: multiplicative prefix di- gives 1,2-Dimethoxyethane.',
      ],
      structure: {
        atoms: [
          { id: 'me1', x: -2.165, y: -0.25, label: 'CH₃', role: 'branch' },
          { id: 'o1', x: -1.3, y: 0.25, label: 'O', role: 'functional' },
          { id: 'c1', x: -0.433, y: -0.25, label: null, role: 'parent', locant: 1, locantAngle: -90 },
          { id: 'c2', x: 0.433, y: 0.25, label: null, role: 'parent', locant: 2, locantAngle: 90 },
          { id: 'o2', x: 1.3, y: -0.25, label: 'O', role: 'functional' },
          { id: 'me2', x: 2.165, y: 0.25, label: 'CH₃', role: 'branch' },
        ],
        bonds: [
          { from: 'me1', to: 'o1', order: 1, role: 'functional' },
          { from: 'o1', to: 'c1', order: 1, role: 'functional' },
          { from: 'c1', to: 'c2', order: 1, role: 'parent' },
          { from: 'c2', to: 'o2', order: 1, role: 'functional' },
          { from: 'o2', to: 'me2', order: 1, role: 'functional' },
        ],
      },
    }
  }

  const row = findNcertRow(NCERT_TABLE_7_2, '2-Ethoxy-1,1-dimethylcyclohexane')
  const verts = polygonVertices(6, 0, 0.25, 1, -90)
  return {
    id: preset,
    family: 'ethers',
    smiles: row.smiles,
    condensedFormula: row.unicode,
    molecularFormula: hillFormulaFromSmiles(row.smiles),
    commonName: row.common,
    iupacName: row.iupac,
    iupacTokens: [
      { text: '2', kind: 'locant' },
      { text: '-', kind: 'punctuation' },
      { text: 'Ethoxy', kind: 'substituent' },
      { text: '-', kind: 'punctuation' },
      { text: '1,1', kind: 'locant' },
      { text: '-', kind: 'punctuation' },
      { text: 'dimethyl', kind: 'substituent' },
      { text: 'cyclohexane', kind: 'parent' },
    ],
    parentRuleBadge: 'Lowest locant set {1, 1, 2} beats {1, 2, 2}',
    steps: [
      'Parent: 6-membered saturated ring (cyclohexane) > ethyl (2 C) and methyl (1 C).',
      'Numbering: starting at the gem-dimethyl carbon gives {1, 1, 2}, lower than {1, 2, 2}.',
      'Assembly: list ethoxy (e) alphabetically before dimethyl (m) -> 2-Ethoxy-1,1-dimethylcyclohexane.',
    ],
    structure: {
      atoms: [
        ...verts.map((v, k) => ({
          id: `c${k + 1}`,
          x: v.x,
          y: v.y,
          label: null,
          role: 'parent' as const,
          locant: k + 1,
          locantAngle: k === 0 ? 90 : k === 1 ? 30 : -90 + k * 60,
        })),
        { id: 'me1', x: -0.62, y: -1.5, label: 'H₃C', role: 'branch' },
        { id: 'me2', x: 0.62, y: -1.5, label: 'CH₃', role: 'branch' },
        { id: 'oet', x: verts[1].x + 0.95 * COS30, y: verts[1].y - 0.95 * SIN30, label: 'OC₂H₅', role: 'functional' },
      ],
      bonds: [
        ...verts.map((_, k) => ({
          from: `c${k + 1}`,
          to: `c${((k + 1) % 6) + 1}`,
          order: 1 as const,
          role: 'parent' as const,
        })),
        { from: 'c1', to: 'me1', order: 1, role: 'branch' },
        { from: 'c1', to: 'me2', order: 1, role: 'branch' },
        { from: 'c2', to: 'oet', order: 1, role: 'functional' },
      ],
    },
  }
}
