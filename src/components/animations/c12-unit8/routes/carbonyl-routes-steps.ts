import { formulaTextWidth, type SchemePath } from '@/components/organic/hydrocarbon-geometry'
import { skeletalBounds } from '@/components/organic/SkeletalFormula'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { CONDENSED_TEXT } from '@/lib/chem/carbonyl-routes'

/**
 * A compound in a route drawing. `smiles` is drawn as a molecule, named by unit8Name and tested
 * against `formula`. `text` replaces the drawing for a species with no molecule to draw (H₂, HCl, the imine).
 */
export interface RouteSpecies {
  smiles?: string
  text?: string
  /** Hill formula, asserted by the unit test for every species that has a smiles. */
  formula: string
}

export interface RouteArrow {
  /** Written above the arrow. */
  reagents?: string
  /** Written below the arrow. */
  conditions?: string
}

/** Lists of species (joined with '+') alternate with arrows; a sequence starts and ends with a list. */
export type RouteSequence = ReadonlyArray<readonly RouteSpecies[] | RouteArrow>

export interface RouteBlock {
  /** Written above the scheme. */
  label: string
  sequence: RouteSequence
}

export interface RouteStep {
  /** Side-by-side columns; blocks stack down each column. */
  columns: readonly (readonly RouteBlock[])[]
}

/** The six Scrolly Steps (0-based), in the order the Prose describes them. */
export const ROUTE_STEPS: readonly RouteStep[] = [
  {
    columns: [
      [
        {
          label: 'Primary alcohol gives an aldehyde',
          sequence: [[{ smiles: 'CCCCO', formula: 'C4H10O' }], { reagents: '[O]' }, [{ smiles: 'CCCC=O', formula: 'C4H8O' }]],
        },
      ],
      [
        {
          label: 'Secondary alcohol gives a ketone',
          sequence: [[{ smiles: 'CCC(O)CC', formula: 'C5H12O' }], { reagents: '[O]' }, [{ smiles: 'CCC(=O)CC', formula: 'C5H10O' }]],
        },
      ],
    ],
  },
  {
    columns: [
      [
        {
          label: 'Dehydrogenation of a volatile alcohol',
          sequence: [
            [{ smiles: 'CO', formula: 'CH4O' }],
            { reagents: 'over Ag or Cu' },
            [{ smiles: 'C=O', formula: 'CH2O' }, { text: 'H₂', formula: 'H2' }],
          ],
        },
      ],
    ],
  },
  {
    columns: [
      [
        {
          label: 'Ozonolysis of an alkene',
          sequence: [
            [{ smiles: 'CC(C)=CC', formula: 'C5H10' }],
            { reagents: 'O₃', conditions: 'then Zn, H₂O' },
            [{ smiles: 'CC(C)=O', formula: 'C3H6O' }, { smiles: 'CC=O', formula: 'C2H4O' }],
          ],
        },
      ],
    ],
  },
  {
    columns: [
      [
        {
          label: 'Hydration of ethyne gives an aldehyde',
          sequence: [
            [{ smiles: 'C#C', formula: 'C2H2' }],
            { reagents: 'H₂O', conditions: 'H₂SO₄, HgSO₄' },
            [{ smiles: 'CC=O', formula: 'C2H4O' }],
          ],
        },
        {
          label: 'Hydration of but-2-yne gives a ketone',
          sequence: [
            [{ smiles: 'CC#CC', formula: 'C4H6' }],
            { reagents: 'H₂O', conditions: 'H₂SO₄, HgSO₄' },
            [{ smiles: 'CCC(C)=O', formula: 'C4H8O' }],
          ],
        },
      ],
    ],
  },
  {
    columns: [
      [
        {
          label: 'Rosenmund reduction of an acyl chloride',
          sequence: [
            [{ smiles: 'CCCC(=O)Cl', formula: 'C4H7ClO' }],
            { reagents: 'H₂', conditions: 'Pd–BaSO₄' },
            [{ smiles: 'CCCC=O', formula: 'C4H8O' }, { text: 'HCl', formula: 'HCl' }],
          ],
        },
      ],
    ],
  },
  {
    columns: [
      [
        {
          label: 'Route A: Stephen reaction',
          sequence: [
            [{ smiles: 'CCCCC#N', formula: 'C5H9N' }],
            { reagents: 'SnCl₂ + HCl' },
            [{ smiles: 'CCCCC=N', text: 'CH₃(CH₂)₃CH=NH', formula: 'C5H11N' }],
            { reagents: 'H₃O⁺' },
            [{ smiles: 'CCCCC=O', formula: 'C5H10O' }],
          ],
        },
        {
          label: 'Route B: DIBAL-H',
          sequence: [
            [{ smiles: 'CCCCC#N', formula: 'C5H9N' }],
            { reagents: '1. DIBAL-H', conditions: '2. H₂O' },
            [{ smiles: 'CCCCC=O', formula: 'C5H10O' }],
          ],
        },
      ],
    ],
  },
]

const isList = (item: RouteSequence[number]): item is readonly RouteSpecies[] => Array.isArray(item)

/** The SchemePath that ReactionScheme draws: molecules from SMILES, named by the Unit 8 namer. */
export function routeScheme(sequence: RouteSequence): SchemePath {
  return sequence.map((item) => {
    if (!isList(item)) return item
    return item.map((sp) => {
      const condensed = sp.smiles === undefined ? undefined : CONDENSED_TEXT[sp.smiles]
      const formula =
        condensed ?? (sp.smiles !== undefined && sp.text === undefined ? parseSmiles(sp.smiles) : (sp.text ?? sp.formula))
      const tag = sp.smiles !== undefined && sp.text === undefined ? unit8Name(sp.smiles) : undefined
      return tag === undefined ? { formula } : { formula, tag }
    })
  })
}

/** Step 6 rows fit ROUTE_WIDTH: the viewBox less a 12-unit margin on each side. */
export const ROUTE_WIDTH = 556
/** Height of a caption line; its text sits 12 units below the caption's top edge. */
export const CAPTION_H = 20
/** Gap between a Step 6 caption and the row or drop under it. */
export const CAPTION_GAP = 4
/** Gap between Route A's last row and Route B's caption. */
export const ROW_GAP = 12
/** Length of the arrow that drops from the imine to pentanal. */
export const DROP_LEN = 56
/** A name's baseline sits 26 below the bottom of its molecule: 14 clear of the lowest atom label, plus a 12-unit ascent. */
export const NAME_BASELINE = 26
/** Length of every Step 6 row arrow: wide enough for 'SnCl₂ + HCl' and '1. DIBAL-H' at 16 units. */
export const ROW_ARROW = 108
/** Space between neighbouring items in a Step 6 row. */
const ITEM_GAP = 10
/** Space from a Step 6 row's top to its centre line: room for the reagent above the arrow. */
const ROW_TOP_ROOM = 40
/** Largest bond-length scales to try, largest first. Font is round(0.36 × scale): 14 from scale 38, so labels are 13 px or more at a 540 px panel. */
const STEP6_SCALES = [56, 54, 52, 50, 48, 46, 44, 42, 40, 39, 38]

export interface RowItem {
  kind: 'mol' | 'text' | 'arrow'
  x: number
  width: number
  /** Height of the drawing (0 for an arrow), and the top of its bounds relative to its centre. */
  height: number
  by: number
  smiles?: string
  text?: string
  tag?: string
  reagents?: string
  conditions?: string
}

function speciesItem(sp: RouteSpecies, scale: number): Omit<RowItem, 'x'> {
  if (sp.smiles !== undefined && sp.text === undefined) {
    const b = skeletalBounds(parseSmiles(sp.smiles), scale)
    return { kind: 'mol', width: b.width, height: b.height, by: b.y, smiles: sp.smiles, tag: unit8Name(sp.smiles) }
  }
  const text = sp.text ?? sp.formula
  return { kind: 'text', width: formulaTextWidth(text), height: 30, by: -15, text }
}

/**
 * A Step 6 row, laid out in one line: molecules and formulas with arrows between them. The row's
 * width is the sum of its items and gaps, so it can be checked against ROUTE_WIDTH before drawing.
 */
export function layoutRow(seq: RouteSequence, scale: number) {
  const parts: Omit<RowItem, 'x'>[] = []
  for (const el of seq) {
    if (Array.isArray(el)) {
      for (const sp of el as readonly RouteSpecies[]) parts.push(speciesItem(sp, scale))
    } else {
      const arrow = el as RouteArrow
      parts.push({ kind: 'arrow', width: ROW_ARROW, height: 0, by: 0, reagents: arrow.reagents, conditions: arrow.conditions })
    }
  }
  let x = 0
  const items: RowItem[] = parts.map((p, i) => {
    const item = { ...p, x }
    x += p.width + (i < parts.length - 1 ? ITEM_GAP : 0)
    return item
  })
  const hMax = Math.max(0, ...parts.map((p) => p.height))
  return { items, width: x, hMax, centre: ROW_TOP_ROOM + hMax / 2, height: ROW_TOP_ROOM + hMax + NAME_BASELINE + 4 }
}

/** The Step 6 pieces: Route A's first row (nitrile, reagent, imine), its drop to pentanal, and Route B. */
export function step6Parts() {
  const blocks = ROUTE_STEPS[ROUTE_STEPS.length - 1].columns[0]
  const routeA = blocks[0].sequence
  const routeB = blocks[1].sequence
  return {
    a1: routeA.slice(0, 3) as RouteSequence,
    hydrolysisArrow: routeA[3] as RouteArrow,
    product: (routeA[4] as readonly RouteSpecies[])[0],
    b: routeB,
  }
}

/** The largest scale at which both Step 6 rows fit ROUTE_WIDTH. One scale serves every structure in Step 6. */
export function step6Scale(): number {
  const { a1, b } = step6Parts()
  for (const s of STEP6_SCALES) {
    if ([a1, b].every((seq) => layoutRow(seq, s).width <= ROUTE_WIDTH)) return s
  }
  return STEP6_SCALES[STEP6_SCALES.length - 1]
}

/** Heights of the Step 6 pieces at a scale, and the total from the top of Route A's caption to the foot of Route B. */
export function step6Heights(scale: number) {
  const { a1, product, b } = step6Parts()
  const bounds = skeletalBounds(parseSmiles(product.smiles ?? ''), scale)
  const a1Height = layoutRow(a1, scale).height
  const bHeight = layoutRow(b, scale).height
  const hydrolysisHeight = CAPTION_GAP + DROP_LEN + 8 + bounds.height + NAME_BASELINE + 4
  const total = 2 * CAPTION_H + 2 * CAPTION_GAP + ROW_GAP + a1Height + hydrolysisHeight + bHeight
  return { a1: a1Height, hydrolysis: hydrolysisHeight, b: bHeight, total }
}
