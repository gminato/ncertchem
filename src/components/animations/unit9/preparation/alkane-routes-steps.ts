/**
 * The steps of the alkane-routes Scrolly (NCERT 9.2.2): four routes drawn as reaction schemes with
 * the carbon count tracked under every species, then Kolbe's electrolysis drawn as a cell. Every
 * product, equation condition, name and carbon count comes from hydrocarbon-reactions.ts and the
 * planner; this file only chooses which example each step shows.
 */

import {
  decarboxylate,
  hydrogenate,
  kolbe,
  reduceAlkylHalide,
  wurtz,
  type Reaction,
  type ReactionProduct,
} from '@/lib/chem/hydrocarbon-reactions'
import { carbonCount } from '@/lib/chem/alkane-planner'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import type { SchemePath, SchemeSpecies } from '@/components/organic/hydrocarbon-geometry'

export const ROUTE_STEP_COUNT = 6

/** The examples of the Scrolly. Each is a molecule from the menu of the planner, not an NCERT example. */
const EXAMPLES = {
  propyne: 'C#CC',
  chloropropane: 'CCCCl',
  bromoethane: 'CCBr',
  bromomethane: 'CBr',
  bromobutane: 'CCCCBr',
  butanoic: 'CCCC(=O)O',
  ethanoic: 'CC(=O)O',
} as const

/** The reaction behind each route step, built with the lib. */
export function routeReactions(): Record<'hydrogenate' | 'reduce' | 'wurtz' | 'wurtzMix' | 'decarboxylate' | 'kolbe', Reaction> {
  return {
    hydrogenate: hydrogenate(parseSmiles(EXAMPLES.propyne)),
    reduce: reduceAlkylHalide(parseSmiles(EXAMPLES.chloropropane)),
    wurtz: wurtz(parseSmiles(EXAMPLES.bromoethane), parseSmiles(EXAMPLES.bromoethane)),
    wurtzMix: wurtz(parseSmiles(EXAMPLES.bromomethane), parseSmiles(EXAMPLES.bromobutane)),
    decarboxylate: decarboxylate(parseSmiles(EXAMPLES.butanoic)),
    kolbe: kolbe(parseSmiles(EXAMPLES.ethanoic)),
  }
}

/** The carbon-count tag under a product: "3 C". */
function carbonTag(p: ReactionProduct): string {
  return `${carbonCount(p.graph)} C`
}

/** A product that is drawn as a structure, tagged with its carbon count. */
function organic(p: ReactionProduct): SchemeSpecies {
  return { formula: p.graph, tag: carbonTag(p) }
}

/** An inorganic product, written as a formula with real subscripts. */
function inorganic(p: ReactionProduct): SchemeSpecies {
  return { formula: subscript(p.formula) }
}

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** Digits to subscripts, e.g. Na2CO3 becomes Na₂CO₃. */
export function subscript(formula: string): string {
  return formula.replace(/[0-9]/g, (d) => SUB[d])
}

/** The scheme of one route step, as the ReactionScheme component draws it. */
export interface RouteScheme {
  kind: 'scheme'
  sequence: SchemePath
  /** The carbon arithmetic under the scheme, from the lib's counts. */
  arithmetic: string
  /** The condition text, from the lib. */
  conditions: string
  /** Title of the step, written from the route's name. */
  title: string
  /** Names of the products, from the lib, for a step whose products are drawn as one formula. */
  names?: string
}

export interface RouteCell {
  kind: 'cell'
  title: string
  conditions: string
  product: string
  arithmetic: string
}

/**
 * Splits text into lines of at most `max` characters, at spaces. A single word longer than `max`
 * is kept whole on its own line.
 */
export function wrapText(text: string, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export type RouteStep = RouteScheme | RouteCell

/** The state of one Scrolly step (0 to ROUTE_STEP_COUNT - 1). */
export function routeStep(step: number): RouteStep {
  const index = Math.min(ROUTE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const r = routeReactions()
  switch (index) {
    case 0: {
      const sm = parseSmiles(EXAMPLES.propyne)
      const p = r.hydrogenate.products[0]
      return {
        kind: 'scheme',
        title: 'Hydrogenation',
        sequence: [
          [{ formula: sm, tag: `${carbonCount(sm)} C` }],
          { reagents: '2 H₂', conditions: 'Pt/Pd/Ni' },
          [organic(p)],
        ],
        arithmetic: `${carbonCount(sm)} carbons in, ${carbonCount(p.graph)} out`,
        conditions: r.hydrogenate.conditions,
      }
    }
    case 1: {
      const sm = parseSmiles(EXAMPLES.chloropropane)
      const p = r.reduce.products[0]
      const hx = r.reduce.products[1]
      return {
        kind: 'scheme',
        title: 'Reduction of an alkyl halide',
        sequence: [
          [{ formula: sm, tag: `${carbonCount(sm)} C` }],
          { reagents: 'H₂', conditions: 'Zn, H⁺' },
          [organic(p), { formula: subscript(hx.formula) }],
        ],
        arithmetic: `${carbonCount(sm)} carbons in, ${carbonCount(p.graph)} out: the C–Cl bond becomes C–H`,
        conditions: r.reduce.conditions,
      }
    }
    case 2: {
      const sm = parseSmiles(EXAMPLES.bromoethane)
      const p = r.wurtz.products[0]
      return {
        kind: 'scheme',
        title: 'Wurtz reaction, one halide',
        sequence: [
          [{ formula: sm, tag: `${carbonCount(sm)} C` }, { formula: sm, tag: `${carbonCount(sm)} C` }],
          { reagents: '2 Na', conditions: 'dry ether' },
          [organic(p)],
        ],
        arithmetic: `${carbonCount(sm)} + ${carbonCount(sm)} = ${carbonCount(p.graph)} carbons`,
        conditions: r.wurtz.conditions,
      }
    }
    case 3: {
      const a = parseSmiles(EXAMPLES.bromomethane)
      const b = parseSmiles(EXAMPLES.bromobutane)
      const mix = r.wurtzMix.products
      const ca = carbonCount(a)
      const cb = carbonCount(b)
      return {
        kind: 'scheme',
        title: 'Wurtz reaction, two halides',
        sequence: [
          [{ formula: `${subscript(molecularFormula(a))} + ${subscript(molecularFormula(b))}`, tag: `${ca} C and ${cb} C` }],
          { reagents: '2 Na', conditions: 'dry ether' },
          [{ formula: mix.map((p) => subscript(p.formula)).join(' + '), tag: `${mix.length} alkanes` }],
        ],
        arithmetic: `${ca} + ${ca} = ${2 * ca}, ${ca} + ${cb} = ${ca + cb} and ${cb} + ${cb} = ${2 * cb} carbons: one alkane per pair`,
        names: mix.map((p) => p.name).join(', '),
        conditions: r.wurtzMix.conditions,
      }
    }
    case 4: {
      const sm = parseSmiles(EXAMPLES.butanoic)
      const p = r.decarboxylate.products[0]
      const carbonate = r.decarboxylate.products[1]
      return {
        kind: 'scheme',
        title: 'Decarboxylation',
        sequence: [
          [{ formula: sm, tag: `${carbonCount(sm)} C` }],
          { reagents: 'NaOH, CaO', conditions: 'heat' },
          [organic(p), inorganic(carbonate)],
        ],
        arithmetic: `${carbonCount(sm)} carbons in the acid, ${carbonCount(p.graph)} in the alkane: one carbon leaves as CO₂`,
        conditions: r.decarboxylate.conditions,
      }
    }
    default: {
      const p = r.kolbe.products[0]
      return {
        kind: 'cell',
        title: "Kolbe's electrolytic method",
        conditions: r.kolbe.conditions,
        product: p.name,
        arithmetic: `2 × (${carbonCount(parseSmiles(EXAMPLES.ethanoic))} − 1) = ${carbonCount(p.graph)} carbons: each ethanoate loses CO₂, and two methyl radicals join`,
      }
    }
  }
}
