import { type SchemePath, layoutReactionScheme } from '@/components/organic'
import { CARBONYL_PREPARATIONS, unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { parseSmiles } from '@/lib/chem/molecule-parse'

/** Kekulé SMILES for every molecule the Scrolly draws (benzene written as C1=CC=CC=C1). */
export const AROMPREP_SMILES = {
  toluene: 'CC1=CC=CC=C1',
  benzene: 'C1=CC=CC=C1',
  benzaldehyde: 'O=CC1=CC=CC=C1',
  benzoicAcid: 'OC(=O)C1=CC=CC=C1',
  benzylideneDiacetate: 'CC(=O)OC(OC(C)=O)C1=CC=CC=C1',
  benzalChloride: 'ClC(Cl)C1=CC=CC=C1',
  benzoylChloride: 'ClC(=O)C1=CC=CC=C1',
  benzonitrile: 'N#CC1=CC=CC=C1',
  acetophenone: 'CC(=O)C1=CC=CC=C1',
  ethanoylChloride: 'CC(Cl)=O',
} as const

/** Molecular formula per SMILES, asserted in the unit test. */
export const AROMPREP_FORMULAS: Record<keyof typeof AROMPREP_SMILES, string> = {
  toluene: 'C7H8',
  benzene: 'C6H6',
  benzaldehyde: 'C7H6O',
  benzoicAcid: 'C7H6O2',
  benzylideneDiacetate: 'C11H12O4',
  benzalChloride: 'C7H6Cl2',
  benzoylChloride: 'C7H5ClO',
  benzonitrile: 'C7H5N',
  acetophenone: 'C8H8O',
  ethanoylChloride: 'C2H3ClO',
}

const g = (key: keyof typeof AROMPREP_SMILES) => ({ formula: parseSmiles(AROMPREP_SMILES[key]) })
const tagged = (key: keyof typeof AROMPREP_SMILES, tag: string) => ({ formula: parseSmiles(AROMPREP_SMILES[key]), tag })
const text = (formula: string) => ({ formula })

const ETARD = CARBONYL_PREPARATIONS.etard
const CHROMIC = CARBONYL_PREPARATIONS.chromicOxide
const CHLORINATION = CARBONYL_PREPARATIONS.sideChainChlorination
const GATTERMAN = CARBONYL_PREPARATIONS.gattermanKoch

/** Step 1: the strong oxidant carries toluene past benzaldehyde to benzoic acid. */
const OVERSHOOT: SchemePath = [
  [g('toluene')],
  { reagents: 'strong oxidant' },
  [tagged('benzaldehyde', 'passing intermediate')],
  { reagents: 'strong oxidant' },
  [g('benzoicAcid')],
]

/** Step 2: Etard reaction; the chromium complex is unnamed and no formula is given. */
const ETARD_PATH: SchemePath = [
  [g('toluene')],
  { reagents: 'CrO₂Cl₂', conditions: 'in CS₂' },
  [text('[chromium complex]')],
  { reagents: 'H₃O⁺' },
  [g('benzaldehyde')],
]

/** Step 3: CrO₃ in acetic anhydride to benzylidene diacetate, then H₃O⁺ to benzaldehyde. The intermediate is condensed text, one row at scale 40. */
const CHROMIC_PATH: SchemePath = [
  [g('toluene')],
  { reagents: 'CrO₃, (CH₃CO)₂O', conditions: CHROMIC.reagent.match(/\d+–\d+ K/)?.[0] ?? '' },
  [text('C₆H₅CH(OCOCH₃)₂')],
  { reagents: 'H₃O⁺', conditions: 'aqueous' },
  [g('benzaldehyde')],
]

/** Step 4: side-chain chlorination, then hydrolysis of benzal chloride (commercial method). */
const CHLORINATION_PATH: SchemePath = [
  [g('toluene')],
  { reagents: 'Cl₂', conditions: 'hν' },
  [g('benzalChloride')],
  { reagents: 'H₂O', conditions: CHLORINATION.reagent.match(/\d+ K/)?.[0] ?? '' },
  [g('benzaldehyde'), text('2 HCl')],
]

/** Step 5: Gatterman–Koch formylation of benzene. */
const GATTERMAN_PATH: SchemePath = [
  [g('benzene'), text('CO'), text('HCl')],
  { reagents: 'anhydrous AlCl₃ or CuCl' },
  [g('benzaldehyde')],
]

/** Step 6, route (a): acyl chloride with a dialkylcadmium. */
const CADMIUM_ROUTE: SchemePath = [
  [g('benzoylChloride')],
  { reagents: '(CH₃)₂Cd' },
  [tagged('acetophenone', 'CdCl₂ also formed')],
]

/** Step 6, route (b): nitrile with a Grignard reagent, then hydrolysis. */
const NITRILE_ROUTE: SchemePath = [
  [g('benzonitrile')],
  { reagents: 'CH₃MgBr', conditions: 'then H₃O⁺' },
  [g('acetophenone')],
]

/** Step 7, route (c): Friedel–Crafts acylation of benzene. */
const FRIEDEL_ROUTE: SchemePath = [
  [g('benzene')],
  { reagents: 'CH₃COCl', conditions: 'anhydrous AlCl₃' },
  [tagged('acetophenone', 'HCl also formed')],
]

/** The seven Steps in Prose order. Steps 6 and 7 hold routes, one row each. */
export const AROMPREP_STEPS: readonly (SchemePath | readonly SchemePath[])[] = [
  OVERSHOOT,
  ETARD_PATH,
  [CHROMIC_PATH],
  CHLORINATION_PATH,
  GATTERMAN_PATH,
  [CADMIUM_ROUTE, NITRILE_ROUTE],
  [FRIEDEL_ROUTE],
]

export const AROMPREP_STEP_COUNT = AROMPREP_STEPS.length

/** The name shown under the three routes of Steps 6 and 7. */
export const ACETOPHENONE_NAME = unit8Name(AROMPREP_SMILES.acetophenone)

/** Width each single scheme is laid out to, in viewBox units (12-unit margins in the 580 viewBox). */
export const SCHEME_WIDTH = 556

/** Route rows: the scheme may use the panel's width less a 12-unit margin each side. */
export const ROUTE_WIDTH = 556

/** Gaps between rows, in viewBox units: labelled route rows (Steps 6 and 7); any other stacked rows; a single scheme. */
export const BLOCK_GAP = 12
export const STACK_GAP = 16
export const ROUTE_GAP = 28

/** Route steps scale to try, largest first: each row takes the largest that keeps its route on one line. */
/** 40 keeps atom labels at 13 px or more on a 540 px panel (0.36 × 40 × 540 / 580 = 13.4). */
export const ROUTE_SCALES = [40] as const

/** Caption above each route row of a route Step, in Step order. */
const ROUTE_LABELS: Readonly<Record<number, readonly string[]>> = {
  5: ['(a) Acyl chloride with a dialkylcadmium', '(b) Nitrile with a Grignard reagent'],
  6: ['(c) Benzene with an acyl chloride, Friedel–Crafts'],
}

/** Blocks of one Step, top to bottom, with each scheme's own height. Used for drawing and for the layout test. */
export interface AromprepBlock {
  label?: string
  path: SchemePath
  /** Width the scheme is laid out to. */
  width: number
  /** Bond-length scales to try, or undefined for the layout's default list. */
  scales?: readonly number[]
  height: number
}

/** Gap between the blocks of a Step: routes with captions get the widest gap, plain stacked rows a smaller one. */
export function blockGap(blocks: readonly AromprepBlock[]): number {
  if (blocks.length < 2) return BLOCK_GAP
  return blocks.some((b) => b.label !== undefined) ? ROUTE_GAP : STACK_GAP
}

export function aromprepStepBlocks(step: number): AromprepBlock[] {
  const index = Math.min(AROMPREP_STEPS.length - 1, Math.max(0, Math.round(step)))
  const content = AROMPREP_STEPS[index]
  const routes = isRoutes(content)
  const paths = routes ? content : [content]
  const labels = routes ? (ROUTE_LABELS[index] ?? []) : []
  return paths.map((path, i) => {
    const width = routes ? ROUTE_WIDTH : SCHEME_WIDTH
    const scales = routes ? ROUTE_SCALES : undefined
    return {
      label: labels[i],
      path,
      width,
      scales,
      height: Math.ceil(layoutReactionScheme(path, width, scales ? [...scales] : undefined).height),
    }
  })
}

/** Steps 3, 6 and 7 are lists of rows (routes); the other Steps are one scheme (a list of groups and arrows). */
function isRoutes(content: SchemePath | readonly SchemePath[]): content is readonly SchemePath[] {
  const first = content[0] as unknown
  return Array.isArray(first) && Array.isArray(first[0])
}
