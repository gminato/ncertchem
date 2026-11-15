/**
 * Pure helpers for showing balancing equations. The lib's `equationMhchem`
 * strings are split into rows and terms here so each term can be rendered
 * with KaTeX, coloured by role, and animated when it is new or its
 * coefficient changes between steps.
 *
 * Lib format: "A + 2B -> C + 3D", with composite half-reaction steps joined by
 * " | " and labelled "Oxidation: ..." or "Reduction: ...".
 */

import { skeletonRoles } from '@/lib/chem/balancer-presets'
import { parseFormula } from '@/lib/chem/formula'

export interface EquationTerm {
  /** The term as written, coefficient included, e.g. "2MnO4-". */
  raw: string
  coefficient: number
  /** Formula without coefficient, state or charge, e.g. "MnO4" or "Cr(OH)3". */
  formula: string
  isElectron: boolean
}

export interface EquationRow {
  label?: string
  reactants: EquationTerm[]
  products: EquationTerm[]
}

export type SpeciesRole = 'ox' | 'red' | null

export interface SpeciesRoles {
  /** Normalised formulas of species being oxidised (reductants). */
  ox: string[]
  /** Normalised formulas of species being reduced (oxidants). */
  red: string[]
}

/** Strips coefficient, state, charge and any trailing sign: "2CrO4^2-(aq)" -> "CrO4". */
export function normalizeFormula(raw: string): string {
  return raw
    .trim()
    .replace(/^\d+/, '')
    .replace(/\((aq|l|s|g)\)/g, '')
    .replace(/\^.*$/, '')
    .replace(/[+-]+$/, '')
}

export function parseTerm(raw: string): EquationTerm {
  const trimmed = raw.trim()
  const lead = /^\d+/.exec(trimmed)
  const coefficient = lead ? Number(lead[0]) : 1
  const formula = normalizeFormula(trimmed)
  return {
    raw: trimmed,
    coefficient,
    formula,
    isElectron: formula === 'e',
  }
}

function parseSide(side: string): EquationTerm[] {
  return side
    .split(' + ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map(parseTerm)
}

/** Parses a lib equation string into rows (one row, or two for composite half-reaction strings). */
export function parseEquation(equation: string): EquationRow[] {
  return equation.split(' | ').map((part) => {
    let body = part.trim()
    let label: string | undefined
    const labelled = /^(Oxidation|Reduction):\s*(.*)$/.exec(body)
    if (labelled) {
      label = labelled[1]
      body = labelled[2]
    }
    const sides = body.split(' -> ')
    return {
      label,
      reactants: parseSide(sides[0] ?? ''),
      products: parseSide(sides[1] ?? ''),
    }
  })
}

function formatTerm(term: EquationTerm): string {
  return term.raw
}

/** Converts rows back into a lib-style equation string. */
export function formatEquation(rows: readonly EquationRow[]): string {
  return rows
    .map((row) => {
      const body = `${row.reactants.map(formatTerm).join(' + ')} -> ${row.products.map(formatTerm).join(' + ')}`
      return row.label ? `${row.label}: ${body}` : body
    })
    .join(' | ')
}

function scaleTerm(term: EquationTerm, factor: number): EquationTerm {
  const coefficient = term.coefficient * factor
  const body = term.raw.replace(/^\d+/, '')
  const raw = `${coefficient === 1 ? '' : coefficient}${body}`
  return { ...term, raw, coefficient }
}

/** Multiplies every term of an equation by an integer factor, as in "multiply by 2". */
export function scaleEquation(equation: string, factor: number): string {
  const rows = parseEquation(equation).map((row) => ({
    label: row.label,
    reactants: row.reactants.map((t) => scaleTerm(t, factor)),
    products: row.products.map((t) => scaleTerm(t, factor)),
  }))
  return formatEquation(rows)
}

/** Coefficient of the electron term in a single half-reaction string (0 if absent). */
export function electronCount(equation: string): number {
  const rows = parseEquation(equation)
  const terms = rows.flatMap((r) => [...r.reactants, ...r.products])
  return terms.filter((t) => t.isElectron).reduce((sum, t) => sum + t.coefficient, 0)
}

/** Roles of species from the skeleton (see skeletonRoles in the lib). */
export function rolesFromSkeleton(skeleton: string): SpeciesRoles {
  return skeletonRoles(skeleton)
}

export function roleOf(formula: string, roles: SpeciesRoles | undefined): SpeciesRole {
  if (!roles) return null
  const f = normalizeFormula(formula)
  if (roles.ox.includes(f)) return 'ox'
  if (roles.red.includes(f)) return 'red'
  return null
}

export type TermChange = 'new' | 'coefficient' | 'same'

/** Compares a term with the same side of the previous row to decide how it should animate. */
export function classifyTerm(
  term: EquationTerm,
  side: 'reactants' | 'products',
  prevRow: EquationRow | undefined,
): TermChange {
  if (!prevRow) return 'same'
  const match = prevRow[side].find((t) => t.formula === term.formula)
  if (!match) return 'new'
  return match.coefficient !== term.coefficient ? 'coefficient' : 'same'
}

/** Total of a formula's coefficients across both sides of an equation string. */
export function countSpecies(equation: string, formula: string): number {
  return parseEquation(equation)
    .flatMap((r) => [...r.reactants, ...r.products])
    .filter((t) => t.formula === formula)
    .reduce((sum, t) => sum + t.coefficient, 0)
}

/** Electrons a single formula unit gains or loses for one element, e.g. MnO4 with Mn: 5. */
export function electronsPerFormula(formula: string, element: string, changePerAtom: number): number {
  const count = parseFormula(formula)[element] ?? 0
  return Math.abs(changePerAtom) * count
}
