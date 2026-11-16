/**
 * Pure data for the alkyne-reactions Scrolly (Section 9.4.4): the Steps, the acidity table of Step 1 and the
 * reaction schemes of Steps 2 to 5. Every product, condition and number comes from the libs.
 */

import type { SchemePath } from '@/components/organic'
import { acidTest, shortCondition, speciesFormula, toDisplay } from '@/lib/chem/alkyne-acid-test'
import { addToAlkyne, cyclicPolymerise } from '@/lib/chem/hydrocarbon-reactions'
import { condensedLabel, nameOf } from '@/lib/chem/hydrocarbon-species'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { hybridisation, parseSmiles } from '@/lib/chem/molecule-parse'
import { conditionFor } from '@/lib/chem/ncert-unit9-tables'

/** The five Steps: acidity, sodium, bromine, hydration, cyclic polymerisation. */
export const ALKYNE_STEP_COUNT = 5

export type Hybrid = 'sp3' | 'sp2' | 'sp'

/** s character of a hybrid orbital: 1 part s in (1 + number of p orbitals). sp is 1/2, sp² 1/3, sp³ 1/4. */
export function sCharacter(hybrid: Hybrid): number {
  const pOrbitals = { sp3: 3, sp2: 2, sp: 1 }[hybrid]
  return 1 / (1 + pOrbitals)
}

/**
 * Schematic distance of the bonding pair from the carbon, as a fraction of the largest: 1 at 25% s (sp³) and
 * 0.4 at 50% s (sp), linear in between. It is a drawing aid, not a measured distance.
 */
export function pairRadius(s: number): number {
  const at25 = 1
  const at50 = 0.4
  return at25 + ((s - 0.25) / 0.25) * (at50 - at25)
}

export interface AcidityRow {
  smiles: string
  name: string
  /** The condensed formula, display text (CH₃CH₃, CH₂=CH₂, CH≡CH). */
  formula: string
  hybrid: Hybrid
  sCharacter: number
  pairRadius: number
}

/** The three molecules of Step 1, least acidic first (the order NCERT gives: ethane, ethene, ethyne). */
const ACIDITY_SMILES = ['CC', 'C=C', 'C#C'] as const

/** The C–H carbon of each molecule: its hybrid and s character, from the lib's hybridisation. */
export function acidityRows(): AcidityRow[] {
  return ACIDITY_SMILES.map((smiles) => {
    const g = parseSmiles(smiles)
    const hybrid = hybridisation(g, 0) as Hybrid
    const s = sCharacter(hybrid)
    return { smiles, name: nameOf(g), formula: toDisplay(condensedLabel(g)), hybrid, sCharacter: s, pairRadius: pairRadius(s) }
  })
}

const ethyne = (): MolGraph => parseSmiles('C#C')

/** A condensed formula as display text, from the lib's own label. */
export function displayFormula(g: MolGraph): string {
  return toDisplay(condensedLabel(g))
}


/** The balanced sodium equation for ethyne, from the acid test (mhchem, with \ce{}). */
export function sodiumEquation(): string {
  const r = acidTest(ethyne(), 'Na')
  if (!r.equation) throw new RangeError('Ethyne reacts with sodium')
  return r.equation
}

/** A mhchem equation as plain display text: \ce{} is dropped, -> becomes →, # becomes ≡, digits become subscripts. */
export function plainEquation(ce: string): string {
  const inner = ce.replace(/^\\ce\{/, '').replace(/\}$/, '')
  return toDisplay(inner.replace(/->/g, '→'))
}

/** Step 2: ethyne with sodium gives the acetylide and hydrogen (the salt label comes from acidTest). */
export function sodiumScheme(): SchemePath {
  const r = acidTest(ethyne(), 'Na')
  if (!r.reacts || !r.salt || !r.byproduct || !r.conditions) throw new RangeError('Ethyne reacts with sodium')
  return [
    [{ formula: displayFormula(ethyne()) }, { formula: 'Na' }],
    { conditions: shortCondition(r.conditions) },
    [{ formula: toDisplay(r.salt.label) }, { formula: r.byproduct }],
  ]
}

/** Step 3: bromine adds twice; the lib gives the dibromoalkene and the tetrabromoalkane. */
export function brominationScheme(): SchemePath {
  const r = addToAlkyne(ethyne(), 'X2', { x: 'Br' })
  return [
    [{ formula: displayFormula(ethyne()) }, { formula: 'Br₂' }],
    { conditions: shortCondition(conditionFor('x2-addition').text) },
    [{ formula: speciesFormula(r.products[0].graph), tag: 'first addition' }],
    { reagents: 'Br₂' },
    [{ formula: speciesFormula(r.products[1].graph), tag: 'second addition' }],
  ]
}

/** Step 4: water under mercury(II) gives the enol, which isomerises to ethanal. */
export function hydrationScheme(): SchemePath {
  const r = addToAlkyne(ethyne(), 'H2O')
  return [
    [{ formula: displayFormula(ethyne()) }, { formula: 'H₂O' }],
    { conditions: shortCondition(conditionFor('alkyne-hydration').text) },
    [{ formula: speciesFormula(r.products[0].graph), tag: 'enol' }],
    { conditions: 'isomerisation' },
    [{ formula: speciesFormula(r.products[1].graph), tag: 'carbonyl' }],
  ]
}

/** Step 5: three ethyne molecules close into benzene over the hot iron. */
export function benzeneScheme(): SchemePath {
  const r = cyclicPolymerise(ethyne())
  return [
    [{ formula: displayFormula(ethyne()) }, { formula: displayFormula(ethyne()) }, { formula: displayFormula(ethyne()) }],
    { conditions: shortCondition(conditionFor('cyclic-polymerisation').text) },
    [{ formula: r.products[0].graph, tag: 'benzene' }],
  ]
}

export interface AlkyneStepCopy {
  title: string
  caption: string
}

export const ALKYNE_STEP_COPY: readonly AlkyneStepCopy[] = [
  { title: 'Acidity follows the s character', caption: 'The more s character the carbon has, the closer its bonding pair sits to it.' },
  { title: 'Sodium takes the terminal hydrogen', caption: 'Sodium removes the proton from the sp carbon, and hydrogen gas escapes.' },
  { title: 'Bromine adds one molecule at a time', caption: 'Each bromine adds across one π bond; the orange colour of bromine in CCl₄ fades.' },
  { title: 'Water adds, and the enol becomes a carbonyl', caption: 'The enol has an –OH on a C=C; it rearranges to the carbonyl compound.' },
  { title: 'Three ethynes close into a ring', caption: 'Red-hot iron turns three triple bonds into one aromatic ring.' },
]
