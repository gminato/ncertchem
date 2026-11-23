import { layoutReactionScheme, type SchemeArrow, type SchemePath, type SchemeSpecies } from '@/components/organic/hydrocarbon-geometry'
import { parseSmiles } from '@/lib/chem/molecule-parse'

/**
 * Molecules drawn in the acid-routes Scrolly. Every drawn species names one of these keys, so the
 * unit test can assert its molecular formula from its SMILES. Condensed text labels (CH₃COOH,
 * NH₃, ions) are drawn as text; the formula still comes from the SMILES.
 */
export const ACID_ROUTE_MOLECULES = {
  hexan1ol: { smiles: 'CCCCCCO', formula: 'C6H14O' },
  hexanoic: { smiles: 'CCCCCC(O)=O', formula: 'C6H12O2' },
  hexylbenzene: { smiles: 'CCCCCCC1=CC=CC=C1', formula: 'C12H18' },
  benzoic: { smiles: 'OC(=O)C1=CC=CC=C1', formula: 'C7H6O2' },
  nitrile: { smiles: 'N#CCCC1=CC=CC=C1', formula: 'C9H9N' },
  amide: { smiles: 'NC(=O)CCC1=CC=CC=C1', formula: 'C9H11NO' },
  phenylpropanoic: { smiles: 'OC(=O)CCC1=CC=CC=C1', formula: 'C9H10O2' },
  bromobutane: { smiles: 'CCCCBr', formula: 'C4H9Br' },
  butylMgBr: { smiles: 'CCCC[Mg]Br', formula: 'C4H9BrMg' },
  co2: { smiles: 'O=C=O', formula: 'CO2' },
  pentanoic: { smiles: 'CCCCC(O)=O', formula: 'C5H10O2' },
  acetylChloride: { smiles: 'CC(=O)Cl', formula: 'C2H3ClO' },
  ethanoicAcid: { smiles: 'CC(O)=O', formula: 'C2H4O2' },
  anhydride: { smiles: 'CC(=O)OC(C)=O', formula: 'C4H6O3' },
  acetateIon: { smiles: 'CC(=O)[O-]', formula: 'C2H3O2' },
  hydroxideIon: { smiles: '[OH-]', formula: 'HO' },
  chlorideIon: { smiles: '[Cl-]', formula: 'Cl' },
  water: { smiles: 'O', formula: 'H2O' },
  hydrogenChloride: { smiles: 'Cl', formula: 'HCl' },
  ammonia: { smiles: 'N', formula: 'NH3' },
  ethylButanoate: { smiles: 'CCCC(=O)OCC', formula: 'C6H12O2' },
  butanoic: { smiles: 'CCCC(O)=O', formula: 'C4H8O2' },
  butanoateIon: { smiles: '[O-]C(=O)CCC', formula: 'C4H7O2' },
  ethanol: { smiles: 'CCO', formula: 'C2H6O' },
} as const

export type MoleculeKey = keyof typeof ACID_ROUTE_MOLECULES

/** One species in a group: drawn skeletal from its SMILES, or as condensed text when `text` is given. */
export interface SpeciesSpec {
  mol: MoleculeKey
  text?: string
  /** Atom indices (SMILES order) washed in the highlight colour. Skeletal species only. */
  highlight?: readonly number[]
  /** Small caption under the species. */
  tag?: string
}

/** A reaction arrow with its reagents above and its conditions below. */
export interface ArrowSpec {
  reagents?: string
  conditions?: string
}

/** A group of species joined by '+', or an arrow. A row alternates groups and arrows. */
export type Piece = readonly SpeciesSpec[] | ArrowSpec

export interface AcidRouteStep {
  /** Accessible label for the drawing. */
  label: string
  /** Each row is one reaction path, drawn one above the other. */
  rows: readonly (readonly Piece[])[]
}

/** Width of every scheme row, inside a 560-unit panel with a 16-unit margin. */
export const ACID_ROUTE_SCHEME_WIDTH = 528
/** Bond-length scale for the skeletal structures: 38 keeps every 0.36 em label at 13 px or more on a 540 px panel. */
export const ACID_ROUTE_SCALES = [38] as const
const ROW_GAP = 24
const MARGIN = 12

export function isGroup(piece: Piece): piece is readonly SpeciesSpec[] {
  return Array.isArray(piece)
}

function toSpecies(s: SpeciesSpec): SchemeSpecies {
  if (s.text !== undefined) return { formula: s.text, tag: s.tag }
  return { formula: parseSmiles(ACID_ROUTE_MOLECULES[s.mol].smiles), tag: s.tag, highlightAtoms: s.highlight }
}

/** One row as a scheme path: groups become species lists, arrows stay arrows. */
export function toSchemePath(row: readonly Piece[]): SchemePath {
  return row.map((piece): readonly SchemeSpecies[] | SchemeArrow => (isGroup(piece) ? piece.map(toSpecies) : { ...piece }))
}

/** Height in units of one row laid out to the scheme width. */
export function rowHeight(path: SchemePath): number {
  return Math.ceil(layoutReactionScheme(path, ACID_ROUTE_SCHEME_WIDTH, ACID_ROUTE_SCALES).height)
}

/** Height of a Step's rows with the gaps between them. */
export function stepContentHeight(step: AcidRouteStep): number {
  const heights = step.rows.map((row) => rowHeight(toSchemePath(row)))
  return heights.reduce((sum, h) => sum + h, 0) + ROW_GAP * (heights.length - 1)
}

export const ACID_ROUTE_STEPS: readonly AcidRouteStep[] = [
  {
    label: 'Hexan-1-ol is oxidised to hexanoic acid by alkaline KMnO₄, then H₃O⁺',
    rows: [
      [
        [{ mol: 'hexan1ol', highlight: [5, 6] }],
        { reagents: 'alkaline KMnO₄', conditions: 'then H₃O⁺' },
        [{ mol: 'hexanoic', highlight: [5] }],
      ],
    ],
  },
  {
    label: 'Hexylbenzene: the whole side chain becomes one COOH, giving benzoic acid',
    rows: [
      [
        [{ mol: 'hexylbenzene', highlight: [0, 1, 2, 3, 4, 5] }],
        { reagents: 'hot alkaline KMnO₄', conditions: 'then H₃O⁺' },
        [{ mol: 'benzoic', highlight: [1] }],
      ],
    ],
  },
  {
    label: '3-Phenylpropanenitrile through the amide to 3-phenylpropanoic acid',
    rows: [
      [
        [{ mol: 'nitrile', highlight: [1] }],
        { reagents: 'H₂O, H⁺/OH⁻' },
        [{ mol: 'amide', highlight: [1] }],
      ],
      [
        [{ mol: 'amide', highlight: [1] }],
        { reagents: 'H₂O, H⁺/OH⁻', conditions: 'heat' },
        [{ mol: 'phenylpropanoic', highlight: [1] }, { mol: 'ammonia', text: 'NH₃' }],
      ],
    ],
  },
  {
    label: '1-Bromobutane through the Grignard reagent, then CO₂, to pentanoic acid',
    rows: [
      [
        [{ mol: 'bromobutane', tag: 'four carbons' }],
        { reagents: 'Mg, dry ether' },
        [{ mol: 'butylMgBr', text: 'C₄H₉MgBr' }],
      ],
      [
        [{ mol: 'butylMgBr', text: 'C₄H₉MgBr' }, { mol: 'co2', text: 'CO₂' }],
        { reagents: 'dry ether', conditions: 'then H₃O⁺' },
        [{ mol: 'pentanoic', highlight: [4], tag: 'five carbons' }],
      ],
    ],
  },
  {
    label: 'Ethanoyl chloride and ethanoic anhydride with water; the base route gives the carboxylate',
    rows: [
      [
        [{ mol: 'acetylChloride', text: 'CH₃COCl' }],
        { reagents: 'H₂O' },
        [{ mol: 'ethanoicAcid', text: 'CH₃COOH' }, { mol: 'hydrogenChloride', text: 'HCl' }],
      ],
      [
        [{ mol: 'anhydride', text: '(CH₃CO)₂O' }],
        { reagents: 'H₂O' },
        [{ mol: 'ethanoicAcid', text: 'CH₃COOH' }, { mol: 'ethanoicAcid', text: 'CH₃COOH' }],
      ],
      [
        [{ mol: 'acetylChloride', text: 'CH₃COCl' }],
        { reagents: '2 OH⁻' },
        [{ mol: 'acetateIon', text: 'CH₃COO⁻' }, { mol: 'chlorideIon', text: 'Cl⁻' }, { mol: 'water', text: 'H₂O' }],
      ],
    ],
  },
  {
    label: 'Ethyl butanoate in acid gives butanoic acid and ethanol; in base it gives the carboxylate',
    rows: [
      [
        [{ mol: 'ethylButanoate', text: 'CH₃CH₂CH₂COOCH₂CH₃' }],
        { reagents: 'H⁺, H₂O' },
        [{ mol: 'butanoic', text: 'CH₃CH₂CH₂COOH' }, { mol: 'ethanol', text: 'CH₃CH₂OH' }],
      ],
      [
        [{ mol: 'ethylButanoate', text: 'CH₃CH₂CH₂COOCH₂CH₃' }],
        { reagents: 'OH⁻, H₂O' },
        [{ mol: 'butanoateIon', text: 'CH₃CH₂CH₂COO⁻' }, { mol: 'ethanol', text: 'CH₃CH₂OH' }],
        { reagents: 'H₃O⁺' },
        [{ mol: 'butanoic', text: 'CH₃CH₂CH₂COOH' }],
      ],
    ],
  },
]

/** One panel height for every Step, so the visual keeps its shape between Steps. */
export const ACID_ROUTE_VIEW_HEIGHT = 700
export const ACID_ROUTE_VIEW_WIDTH = 560
export const ACID_ROUTE_MARGIN = MARGIN
export const ACID_ROUTE_ROW_GAP = ROW_GAP
