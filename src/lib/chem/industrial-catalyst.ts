import { INDUSTRIAL_CATALYSTS, subscriptFormula, type IndustrialCatalyst, type StructuredEquation } from './dblock'
import { CATALYST_REPRESENTATIVE_EQUATIONS } from './dblock-series-data'

// Model for the Section 11 Simulation (industrial-catalyst-explorer). Every equation and catalyst comes from the
// d-block libs: overall equations from INDUSTRIAL_CATALYSTS (dblock.ts), and the Ziegler and fat-hydrogenation
// equations from CATALYST_REPRESENTATIVE_EQUATIONS (dblock-series-data.ts, labelled representative, ruling R19).

export type CatalystProcessId = 'contact' | 'haber' | 'ziegler' | 'wacker' | 'hydrogenation'

/** The property of the metal that makes the catalyst work (P11 spec). */
export type CatalystProperty = 'oxidation-state' | 'surface-adsorption'

/** One kind of species in the reactor drawing. `count` is how many units are drawn, not a quantity to read. */
export interface ReactorSpecies {
  readonly label: string
  readonly count: number
  /** 'chain' draws a zigzag polymer or fat chain instead of small spheres. */
  readonly shape: 'molecule' | 'chain'
}

export interface CatalystProcess {
  readonly id: CatalystProcessId
  readonly name: string
  readonly catalyst: string
  readonly property: CatalystProperty
  /** Plain-language account of the property in this process (one or two sentences). */
  readonly propertyText: string
  /** Oxidation states of the catalyst metal shown on the chips (oxidation-state processes only). */
  readonly oxidationStates: readonly [string, string] | null
  /** mhchem body for \ce{...}; balanced in atoms and charge. */
  readonly equation: string
  readonly equationKind: 'overall' | 'representative'
  readonly equationNote: string | null
  readonly feeds: readonly ReactorSpecies[]
  readonly products: readonly ReactorSpecies[]
  readonly page: number
}

function lookup(process: string): IndustrialCatalyst {
  const hit = INDUSTRIAL_CATALYSTS.find((entry) => entry.process === process)
  if (!hit) throw new Error(`no industrial catalyst entry for ${process}`)
  return hit
}

/** mhchem body (without \ce{}) for a structured equation, e.g. "2SO2 + O2 -> 2SO3". */
export function toMhchem(eq: StructuredEquation): string {
  const side = (terms: StructuredEquation['reactants']) =>
    terms.map((t) => `${t.coefficient === 1 ? '' : t.coefficient}${t.formula}`).join(' + ')
  return `${side(eq.reactants)} -> ${side(eq.products)}`
}

function overallSpecies(terms: StructuredEquation['reactants']): ReactorSpecies[] {
  return terms.map((t) => ({ label: subscriptFormula(t.formula), count: t.coefficient, shape: 'molecule' as const }))
}

function overallProcess(
  id: CatalystProcessId, process: string, property: CatalystProperty, propertyText: string,
  oxidationStates: readonly [string, string] | null,
): CatalystProcess {
  const entry = lookup(process)
  if (!entry.overall) throw new Error(`${process} has no overall equation in the lib`)
  return {
    id,
    name: entry.process,
    catalyst: entry.catalyst,
    property,
    propertyText,
    oxidationStates,
    equation: toMhchem(entry.overall),
    equationKind: 'overall',
    equationNote: null,
    feeds: overallSpecies(entry.overall.reactants),
    products: overallSpecies(entry.overall.products),
    page: entry.page,
  }
}

function representativeEquation(name: keyof typeof CATALYST_REPRESENTATIVE_EQUATIONS): {
  equation: string
  note: string
} {
  const row = CATALYST_REPRESENTATIVE_EQUATIONS[name]
  return { equation: row.mhchem, note: row.note }
}

const ziegler = representativeEquation('Ziegler catalysts (polyethylene)')
const hydrogenation = representativeEquation('Hydrogenation of fats')
const zieglerLib = lookup('Ziegler catalysts (polyethylene)')
const hydrogenationLib = lookup('Hydrogenation of fats')

/** The five processes in the order the Simulation offers them. */
export const CATALYST_PROCESSES: readonly CatalystProcess[] = [
  overallProcess(
    'contact', 'Contact process', 'oxidation-state',
    'V₂O₅ gives oxygen to SO₂ and is reduced to V(IV). Air then reoxidises it to V(V), so the vanadium changes oxidation state again and again.',
    ['V(V)', 'V(IV)'],
  ),
  overallProcess(
    'haber', 'Haber process', 'surface-adsorption',
    'The iron surface holds N₂ and H₂ molecules and weakens their bonds, so the gases react on the surface. The iron itself does not change oxidation state.',
    null,
  ),
  {
    id: 'ziegler',
    name: zieglerLib.process,
    catalyst: zieglerLib.catalyst,
    property: 'surface-adsorption',
    propertyText: 'A titanium site on the catalyst binds an ethene molecule and inserts it into a growing chain. Each step adds one more unit.',
    oxidationStates: null,
    equation: ziegler.equation,
    equationKind: 'representative',
    equationNote: ziegler.note,
    feeds: [{ label: 'C₂H₄', count: 3, shape: 'molecule' }],
    products: [{ label: 'polythene', count: 1, shape: 'chain' }],
    page: zieglerLib.page,
  },
  overallProcess(
    'wacker', 'Wacker process', 'oxidation-state',
    'Pd(II) takes electrons from ethene and is reduced to Pd(0). The palladium changes oxidation state during the reaction.',
    ['Pd(II)', 'Pd(0)'],
  ),
  {
    id: 'hydrogenation',
    name: hydrogenationLib.process,
    catalyst: hydrogenationLib.catalyst,
    property: 'surface-adsorption',
    propertyText: 'The nickel surface holds H₂ and the C=C bond of the fat. The bond weakens and hydrogen atoms add across it.',
    oxidationStates: null,
    equation: hydrogenation.equation,
    equationKind: 'representative',
    equationNote: hydrogenation.note,
    feeds: [
      { label: 'fat', count: 2, shape: 'chain' },
      { label: 'H₂', count: 2, shape: 'molecule' },
    ],
    products: [{ label: 'saturated fat', count: 2, shape: 'chain' }],
    page: hydrogenationLib.page,
  },
]

export function processById(id: CatalystProcessId): CatalystProcess {
  const hit = CATALYST_PROCESSES.find((p) => p.id === id)
  if (!hit) throw new RangeError(`unknown process ${id}`)
  return hit
}

export function propertyLabel(property: CatalystProperty): string {
  return property === 'oxidation-state' ? 'Variable oxidation state' : 'Surface adsorption'
}
