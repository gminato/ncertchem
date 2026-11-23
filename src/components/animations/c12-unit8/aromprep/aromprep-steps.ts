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

/** Step 3: CrO₃ in acetic anhydride, via benzylidene diacetate (formula and class name only). */
const CHROMIC_PATH: SchemePath = [
  [g('toluene')],
  { reagents: 'CrO₃', conditions: `in (CH₃CO)₂O, ${CHROMIC.reagent.match(/\d+–\d+ K/)?.[0] ?? ''}` },
  [g('benzylideneDiacetate')],
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

/** Step 6, route (c): Friedel–Crafts acylation of benzene. */
const FRIEDEL_ROUTE: SchemePath = [
  [g('benzene'), text('CH₃COCl')],
  { reagents: 'anhydrous AlCl₃' },
  [g('acetophenone')],
]

/** The six Steps in Prose order. Step 6 holds three routes, drawn one row above another. */
export const AROMPREP_STEPS: readonly (SchemePath | readonly SchemePath[])[] = [
  OVERSHOOT,
  ETARD_PATH,
  CHROMIC_PATH,
  CHLORINATION_PATH,
  GATTERMAN_PATH,
  [CADMIUM_ROUTE, NITRILE_ROUTE, FRIEDEL_ROUTE],
]

export const AROMPREP_STEP_COUNT = AROMPREP_STEPS.length

/** The name shown under the three routes of Step 6. */
export const ACETOPHENONE_NAME = unit8Name(AROMPREP_SMILES.acetophenone)

/** Width each scheme is laid out to, in viewBox units. */
export const SCHEME_WIDTH = 540

/** Step 6: each route is one row, so the scheme may use the panel's width less a 12-unit margin each side. */
export const ROUTE_WIDTH = 556

/** Step 6 scales to try, largest first: each row takes the largest that keeps its route on one line. */
export const ROUTE_SCALES = [56, 52, 48, 44, 40, 36, 32, 28, 24] as const

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

export function aromprepStepBlocks(step: number): AromprepBlock[] {
  const index = Math.min(AROMPREP_STEPS.length - 1, Math.max(0, Math.round(step)))
  const content = AROMPREP_STEPS[index]
  const routes = isRoutes(content)
  const paths = routes ? content : [content]
  const labels = routes ? ['(a) Acyl chloride with a dialkylcadmium', '(b) Nitrile with a Grignard reagent', '(c) Benzene with an acyl chloride, Friedel–Crafts'] : []
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

/** Step 6 is three routes (a list of schemes); the other Steps are one scheme (a list of groups and arrows). */
function isRoutes(content: SchemePath | readonly SchemePath[]): content is readonly SchemePath[] {
  const first = content[0] as unknown
  return Array.isArray(first) && Array.isArray(first[0])
}

