/**
 * A model for building acyclic alkanes from a backbone and linear side chains, for the naming
 * simulation (NCERT Class 11 Unit 8, Section 8.5.2). A design is turned into SMILES, parsed, and
 * named by iupacName, so every name the simulation shows comes from the lib.
 *
 * Presets are SMILES strings of alkanes whose side chains are linear, so each one can be rebuilt
 * with the builder. The names are not stored: they are read from iupacName.
 */

import type { MolGraph } from './molecule-graph'
import { parseSmiles } from './molecule-parse'

export const MIN_BACKBONE = 2
export const MAX_BACKBONE = 9
export const MAX_BRANCHES = 3
export const MAX_BRANCH_LENGTH = 4

/** A linear side chain of `length` carbons on backbone carbon `position` (1-based). */
export interface AlkaneBranch {
  position: number
  length: number
}

/** A backbone of `backbone` carbons with side chains. */
export interface AlkaneDesign {
  backbone: number
  branches: AlkaneBranch[]
}

/** Checks a design: backbone size, branch positions and lengths, and the number of branches. */
export function isValidDesign(d: AlkaneDesign): boolean {
  if (!Number.isInteger(d.backbone) || d.backbone < MIN_BACKBONE || d.backbone > MAX_BACKBONE) return false
  if (d.branches.length > MAX_BRANCHES) return false
  return d.branches.every(
    (b) =>
      Number.isInteger(b.position) &&
      b.position >= 1 &&
      b.position <= d.backbone &&
      Number.isInteger(b.length) &&
      b.length >= 1 &&
      b.length <= MAX_BRANCH_LENGTH
  )
}

/**
 * SMILES of a design: the backbone is written left to right, and each side chain is a bracketed
 * run of carbons on its backbone carbon.
 *
 * @throws {RangeError} If the design is not valid
 */
export function designSmiles(d: AlkaneDesign): string {
  if (!isValidDesign(d)) throw new RangeError('Invalid alkane design')
  let text = ''
  for (let i = 1; i <= d.backbone; i++) {
    text += 'C'
    for (const b of d.branches) {
      if (b.position === i) text += `(${'C'.repeat(b.length)})`
    }
  }
  return text
}

/** The molecule of a design. */
export function designGraph(d: AlkaneDesign): MolGraph {
  return parseSmiles(designSmiles(d))
}

/** Total carbons in a design. */
export function designCarbons(d: AlkaneDesign): number {
  return d.backbone + d.branches.reduce((total, b) => total + b.length, 0)
}

/** Molecules for the presets and the quiz, each as a design, so the builder can rebuild it. */
const pb = (position: number, length = 1): AlkaneBranch => ({ position, length })
export const ALKANE_PRESETS: readonly { id: string; design: AlkaneDesign }[] = [
  { id: 'isopentane', design: { backbone: 4, branches: [pb(2)] } },
  { id: 'isobutane', design: { backbone: 3, branches: [pb(2)] } },
  { id: 'neopentane', design: { backbone: 3, branches: [pb(2), pb(2)] } },
  { id: 'dimethylpentane-23', design: { backbone: 5, branches: [pb(2), pb(3)] } },
  { id: 'dimethylpentane-24', design: { backbone: 5, branches: [pb(2), pb(4)] } },
  { id: 'isooctane', design: { backbone: 5, branches: [pb(2), pb(2), pb(4)] } },
  { id: 'trimethylhexane-235', design: { backbone: 6, branches: [pb(2), pb(3), pb(5)] } },
  { id: 'trimethylheptane-246', design: { backbone: 7, branches: [pb(2), pb(4), pb(6)] } },
  { id: 'ethylmethylheptane', design: { backbone: 7, branches: [pb(2), pb(3, 2)] } },
  { id: 'ethylmethylhexane', design: { backbone: 6, branches: [pb(2), pb(4, 2)] } },
  { id: 'diethylpentane', design: { backbone: 5, branches: [pb(3, 2), pb(3, 2)] } },
  { id: 'ethylmethylheptane-b', design: { backbone: 7, branches: [pb(3, 2), pb(4)] } },
  { id: 'dimethylhexane-34', design: { backbone: 6, branches: [pb(3), pb(4)] } },
  { id: 'dimethylheptane-26', design: { backbone: 7, branches: [pb(2), pb(6)] } },
  { id: 'methyloctane-3', design: { backbone: 8, branches: [pb(3)] } },
  { id: 'dimethylheptane-35', design: { backbone: 7, branches: [pb(3), pb(5)] } },
]

/** Canonical comparison for typed names: case, spaces and the spacing of locants are ignored. */
export function normaliseName(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '').replace(/–/g, '-').replace(/−/g, '-')
}

/** True when the typed name matches the canonical name, ignoring case and spaces. */
export function isSameName(typed: string, canonical: string): boolean {
  return normaliseName(typed) === normaliseName(canonical)
}
