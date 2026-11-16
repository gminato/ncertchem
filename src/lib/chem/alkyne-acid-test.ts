/**
 * The sodium and sodamide test for terminal alkynes (NCERT 9.4.4 A). Only a C≡C–H hydrogen is acidic enough to
 * be removed by sodium or sodamide; ethene and ethane do not react. This wraps the acetylide model of
 * hydrocarbon-reactions.ts and writes the salt from the molecule itself: the lib's own label drops the last
 * character of a longer chain (CH3C≡CH would read CHC≡CNa), so the salt here is labelled from a graph with the
 * sodium atom bonded to the acidic carbon.
 */

import type { MolGraph } from './molecule-graph'
import { acetylide, alkyneAcidity } from './hydrocarbon-reactions'
import {
  balancedEquation,
  condensedLabel,
  countsOf,
  inorganic,
  nameOf,
  rebuild,
  speciesOf,
  H2,
  type Species,
  type Term,
} from './hydrocarbon-species'
import { conditionFor } from './ncert-unit9-tables'

export type AcidBase = 'Na' | 'NaNH2'

/** The result of treating one hydrocarbon with a base. */
export interface AcidTest {
  /** True when the base removes the terminal hydrogen and an acetylide forms. */
  reacts: boolean
  /** Why it reacts or does not (one sentence). */
  reason: string
  /** Only when it reacts: the mhchem equation, the salt and its graph (with the Na atom), and the conditions. */
  equation?: string
  salt?: { label: string; name: string; formula: string; graph: MolGraph }
  byproduct?: 'H₂' | 'NH₃'
  conditions?: string
}

/** The hydrocarbons offered by the acid-test simulation, as SMILES (names come from nameOf). */
export const ACID_TEST_SMILES: readonly string[] = ['CC', 'C=C', 'C#C', 'CC#C', 'CCC#C', 'CC#CC']

/** A copy of the graph with a sodium atom bonded to atom `c` (the acidic carbon loses its hydrogen). */
export function withSodium(g: MolGraph, c: number): MolGraph {
  const atoms = [...g.atoms.map((a) => ({ ...a })), { element: 'Na', hCount: 0 }]
  const bonds = [...g.bonds.map((b) => ({ ...b })), { a: c, b: atoms.length - 1, order: 1 as const }]
  return rebuild(atoms, bonds)
}

/**
 * Treats a hydrocarbon with sodium or sodamide. Alkenes and alkanes (no C≡C) and internal alkynes do not react.
 *
 * @throws {RangeError} If the molecule has an element other than carbon and hydrogen
 */
export function acidTest(g: MolGraph, base: AcidBase): AcidTest {
  if (g.atoms.some((a) => a.element !== 'C' && a.element !== 'H')) {
    throw new RangeError('The acid test takes a hydrocarbon (carbon and hydrogen only)')
  }
  if (!g.bonds.some((b) => b.order === 3)) {
    return {
      reacts: false,
      reason:
        'Sodium and sodamide do not react with ethene or ethane: their C–H bonds are not acidic enough. The test tells alkynes apart from alkenes and alkanes.',
    }
  }
  const acid = alkyneAcidity(g)
  if (!acid.acidic) return { reacts: false, reason: acid.reason }

  const c = acid.acidicCarbons[0]
  const saltGraph = withSodium(g, c)
  const alkyne: Species = speciesOf(g)
  const salt: Species = { label: condensedLabel(saltGraph), counts: countsOf(saltGraph), name: `sodium ${nameOf(g).replace(/yne$/, 'ynide')}` }
  const saltFormula = Object.entries(salt.counts)
    .sort(([a], [b]) => (a === 'C' ? -1 : b === 'C' ? 1 : a.localeCompare(b)))
    .map(([el, n]) => (n > 1 ? `${el}${n}` : el))
    .join('')
  const conditions = conditionFor('acetylide-sodium').text

  if (base === 'Na') {
    const equation = balancedEquation(
      [term(2, alkyne), term(2, inorganic('Na', { Na: 1 }, 'sodium'))],
      [term(2, salt), term(1, H2)],
    )
    return {
      reacts: true,
      reason: 'The terminal C–H is acidic (sp carbon, 50% s character), so sodium removes the proton and H₂ escapes.',
      equation,
      salt: { label: salt.label, name: salt.name, formula: saltFormula, graph: saltGraph },
      byproduct: 'H₂',
      conditions,
    }
  }
  const sodamide = inorganic('NaNH2', { Na: 1, N: 1, H: 2 }, 'sodamide')
  const ammonia = inorganic('NH3', { N: 1, H: 3 }, 'ammonia')
  const equation = balancedEquation([term(1, alkyne), term(1, sodamide)], [term(1, salt), term(1, ammonia)])
  return {
    reacts: true,
    reason: 'The terminal C–H is acidic (sp carbon, 50% s character), so sodamide removes the proton and NH₃ escapes.',
    equation,
    salt: { label: salt.label, name: salt.name, formula: saltFormula, graph: saltGraph },
    byproduct: 'NH₃',
    conditions,
  }
}

function term(coef: number, species: Species): Term {
  return { coef, species }
}

/** Plain-text display of a lib string: # becomes ≡, digits after a letter become subscripts, Hg2+ and H+ get superscripts. */
export function toDisplay(text: string): string {
  const sub = (d: string) => d.replace(/\d/g, (x) => '₀₁₂₃₄₅₆₇₈₉'[Number(x)])
  return text
    .replace(/Hg2\+/g, 'Hg²⁺')
    .replace(/H\+/g, 'H⁺')
    .replace(/#/g, '≡')
    .replace(/([A-Za-z)])(\d+)/g, (_, c: string, d: string) => `${c}${sub(d)}`)
}

/**
 * A lib condition shortened for an arrow: the text before its bracketed note, e.g. 'CCl₄ solvent' from
 * 'CCl4 solvent (bromine solution decolourised)'. The full text is in the lib and the caption.
 */
export function shortCondition(text: string): string {
  return toDisplay(text.replace(/\s*\(.*?\)/, ''))
}

/**
 * A species as a drawing input: a condensed formula for a molecule of one or two carbons (so its hydrogens show,
 * as CH₃CHO and CH₂=CHOH do), and the skeletal graph for anything larger.
 */
export function speciesFormula(g: MolGraph): string | MolGraph {
  const carbons = g.atoms.filter((a) => a.element === 'C').length
  return carbons <= 2 ? toDisplay(condensedLabel(g)) : g
}
