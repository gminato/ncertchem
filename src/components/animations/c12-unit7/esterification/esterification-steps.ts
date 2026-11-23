import { NCERT_7_4_4_ALCOHOL_REACTIONS } from '@/lib/chem/ncert-c12-unit7-data'

export const ESTERIFICATION_STEP_COUNT = 4

export const ESTERIFICATION_STEP_TITLES = [
  'Three acylating partners cleave the O–H bond',
  'Removing H₂O drives reversible esterification right',
  'Pyridine neutralises HCl from acid chlorides',
  'Acetylation of salicylic acid yields Aspirin',
] as const

export interface AcylRouteSummary {
  id: 'carboxylic-acid' | 'anhydride' | 'acyl-chloride'
  title: string
  reagent: string
  catalystOrBase: string
  byproduct: string
  reversible: boolean
}

export const ESTERIFICATION_ROUTES: readonly AcylRouteSummary[] = [
  {
    id: 'carboxylic-acid',
    title: 'Carboxylic acid',
    reagent: "R'–COOH",
    catalystOrBase: NCERT_7_4_4_ALCOHOL_REACTIONS[0].catalyst ?? 'Conc. H₂SO₄ (H⁺)',
    byproduct: 'H₂O',
    reversible: true,
  },
  {
    id: 'anhydride',
    title: 'Acid anhydride',
    reagent: "(R'CO)₂O",
    catalystOrBase: NCERT_7_4_4_ALCOHOL_REACTIONS[0].catalyst ?? 'Conc. H₂SO₄ (H⁺)',
    byproduct: "R'COOH",
    reversible: true,
  },
  {
    id: 'acyl-chloride',
    title: 'Acid chloride',
    reagent: "R'–COCl",
    catalystOrBase: 'Pyridine',
    byproduct: 'HCl',
    reversible: false,
  },
] as const

export const ASPIRIN_REACTION = {
  substrate: NCERT_7_4_4_ALCOHOL_REACTIONS[2].substrate,
  reagent: NCERT_7_4_4_ALCOHOL_REACTIONS[2].reagents,
  catalyst: NCERT_7_4_4_ALCOHOL_REACTIONS[2].catalyst ?? 'H⁺',
  product: NCERT_7_4_4_ALCOHOL_REACTIONS[2].majorProducts,
  byproduct: NCERT_7_4_4_ALCOHOL_REACTIONS[2].byProducts ?? 'CH₃COOH',
  properties: ['Analgesic', 'Anti-inflammatory', 'Antipyretic'] as const,
} as const
