/**
 * Qualitative inductive effect on the strength of a carboxylic acid (Unit 8, Sections 8.7.5 and
 * 8.7.9). The inductive effect of the groups on the α carbon (the carbon next to the COOH group) is
 * counted: each halogen withdraws electron density (-I) and each alkyl group donates it (+I). A
 * higher balance of -I over +I means the carboxylate ion is better stabilised, so the acid is
 * stronger. The order is qualitative: no pKa or Ka value is implied.
 */

import type { MolGraph } from './molecule-graph'
import { neighbours } from './molecule-parse'

const HALOGENS = ['F', 'Cl', 'Br', 'I']

/** The carboxyl carbon: a carbon with a double bond to O and a single bond to an OH oxygen. */
export function carboxylCarbon(g: MolGraph): number {
  const found = g.atoms.findIndex((a, i) => {
    if (a.element !== 'C') return false
    const ns = neighbours(g, i)
    const doubleO = ns.some((n) => n.order === 2 && g.atoms[n.atom].element === 'O')
    const hydroxylO = ns.some((n) => n.order === 1 && g.atoms[n.atom].element === 'O' && (g.atoms[n.atom].hCount ?? 0) === 1)
    return doubleO && hydroxylO
  })
  if (found < 0) throw new RangeError('The molecule has no carboxyl group')
  return found
}

/** The α carbon: the carbon bonded to the carboxyl carbon. */
export function alphaCarbon(g: MolGraph): number {
  const carboxyl = carboxylCarbon(g)
  const alpha = neighbours(g, carboxyl).find((n) => g.atoms[n.atom].element === 'C')
  if (!alpha) throw new RangeError('The carboxyl group has no α carbon')
  return alpha.atom
}

/** The inductive count on the α carbon: halogens (-I) and carbon groups (+I) bonded to it. */
export interface AlphaInductive {
  withdrawing: number
  donating: number
  /** withdrawing − donating. Larger means a stronger acid, qualitatively. */
  balance: number
}

/** Counts the -I halogens and +I alkyl groups on the α carbon of a carboxylic acid. */
export function alphaInductive(g: MolGraph): AlphaInductive {
  const alpha = alphaCarbon(g)
  const carboxyl = carboxylCarbon(g)
  const others = neighbours(g, alpha).filter((n) => n.atom !== carboxyl)
  const withdrawing = others.filter((n) => HALOGENS.includes(g.atoms[n.atom].element)).length
  const donating = others.filter((n) => g.atoms[n.atom].element === 'C').length
  return { withdrawing, donating, balance: withdrawing - donating }
}

/**
 * Indices of the acids ordered from the strongest to the weakest, by alpha-inductive balance.
 * Acids with equal balance keep their input order.
 */
export function acidStrengthOrder(acids: readonly MolGraph[]): number[] {
  return acids
    .map((g, index) => ({ index, b: alphaInductive(g).balance }))
    .sort((x, y) => y.b - x.b || x.index - y.index)
    .map((x) => x.index)
}

/** Subscript digits in a formula fragment. */
const SUB: Record<string, string> = { '2': '₂', '3': '₃' }

/**
 * The condensed formula of an acid of this family, built from the α-carbon counts: for example
 * CH₃COOH, ClCH₂COOH, Cl₂CHCOOH, Cl₃CCOOH, CH₃CH₂COOH.
 */
export function acidFormula(g: MolGraph): string {
  const { withdrawing, donating } = alphaInductive(g)
  let alpha: string
  if (withdrawing === 0) {
    alpha = donating > 0 ? 'CH₃CH₂' : 'CH₃'
  } else {
    const n = withdrawing
    const cl = n === 1 ? 'Cl' : n === 2 ? 'Cl₂' : 'Cl₃'
    alpha = n === 1 ? `Cl${'CH' + SUB['2']}` : n === 2 ? `${cl}CH` : `${cl}C`
  }
  return `${alpha}COOH`
}

/** The α-carbon groups in plain words, for the readout. */
export function alphaWords(g: MolGraph): string {
  const { withdrawing, donating } = alphaInductive(g)
  if (withdrawing > 0) {
    const halogens = withdrawing === 1 ? '1 Cl' : `${withdrawing} Cl`
    return `${halogens} on the α carbon (−I)`
  }
  if (donating > 0) return `${donating === 1 ? 'one CH₃' : `${donating} alkyl groups`} on the α carbon (+I)`
  return 'no group on the α carbon'
}
