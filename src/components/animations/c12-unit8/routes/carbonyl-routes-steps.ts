import type { SchemePath } from '@/components/organic/hydrocarbon-geometry'
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
            { reagents: 'DIBAL-H' },
            [{ smiles: 'CCCCC=N', text: 'CH₃(CH₂)₃CH=NH', formula: 'C5H11N' }],
            { reagents: 'H₂O' },
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
