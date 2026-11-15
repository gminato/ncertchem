/**
 * Step data for the kp-kc Scrolly (Section 6.4.1): one gas box, then three reactions with Δn = 0,
 * −2 and +1, then a summary. Every number comes from src/lib/chem (equilibrium.ts and kp-kc.ts).
 */

import { kcFromConcentrations, R_BAR_L_PER_MOL_K, type Reaction } from '@/lib/chem/equilibrium'
import { convertEquilibriumConstant, inspectEquation, parseEquation } from '@/lib/chem/kp-kc'
import { formatSci } from '@/components/equilibrium/geometry'

/** Temperature used for every example in this Scrolly, K. */
export const KPKC_T = 400

/** Concentration of the single gas in the box at step 0, mol L⁻¹. */
export const BOX_CONCENTRATION = 0.1

/** One species in an example: its formula and the equilibrium concentration (mol L⁻¹). */
export interface ExampleSpecies {
  formula: string
  concentration: number
}

/** A worked example: a balanced equation and its equilibrium concentrations. */
export interface KpKcExample {
  id: 'h2-i2' | 'n2-h2' | 'nocl'
  equation: string
  reaction: Reaction
  species: ExampleSpecies[]
  kc: number
  kp: number
  deltaN: number
  factor: number
  gasReactants: number
  gasProducts: number
  /** Unit of Kc: 'mol L⁻¹', 'L² mol⁻²' or 'none'. */
  kcUnit: string
  /** Unit of Kp: 'bar', 'bar⁻²' or 'none'. */
  kpUnit: string
}

interface ExampleSpec {
  id: KpKcExample['id']
  equation: string
  species: ExampleSpecies[]
}

const EXAMPLE_SPECS: ExampleSpec[] = [
  {
    id: 'h2-i2',
    equation: 'H2(g) + I2(g) <=> 2HI(g)',
    species: [
      { formula: 'H2', concentration: 0.1 },
      { formula: 'I2', concentration: 0.1 },
      { formula: 'HI', concentration: 0.8 },
    ],
  },
  {
    id: 'n2-h2',
    equation: 'N2(g) + 3H2(g) <=> 2NH3(g)',
    species: [
      { formula: 'N2', concentration: 0.2 },
      { formula: 'H2', concentration: 0.3 },
      { formula: 'NH3', concentration: 0.1 },
    ],
  },
  {
    id: 'nocl',
    equation: '2NOCl(g) <=> 2NO(g) + Cl2(g)',
    species: [
      { formula: 'NOCl', concentration: 0.4 },
      { formula: 'NO', concentration: 0.2 },
      { formula: 'Cl2', concentration: 0.1 },
    ],
  },
]

function unitsFor(deltaN: number): { kc: string; kp: string } {
  // Kc has units mol L⁻¹ raised to Δn; Kp has units bar raised to Δn.
  if (deltaN === 0) return { kc: 'none', kp: 'none' }
  const kcUnit = deltaN === 1 ? 'mol L⁻¹' : deltaN === -2 ? 'L² mol⁻²' : deltaN > 0 ? `(mol L⁻¹)^${deltaN}` : `(L mol⁻¹)^${-deltaN}`
  const kpUnit = deltaN === 1 ? 'bar' : deltaN === -2 ? 'bar⁻²' : deltaN > 0 ? `bar^${deltaN}` : `bar⁻${-deltaN}`
  return { kc: kcUnit, kp: kpUnit }
}

/** Builds one example: Kc from the concentrations, then Kp from the lib. */
export function buildExample(spec: ExampleSpec, temperatureK = KPKC_T): KpKcExample {
  const reaction = parseEquation(spec.equation)
  const concentrations = Object.fromEntries(spec.species.map((s) => [s.formula, s.concentration]))
  const kc = kcFromConcentrations(reaction, concentrations)
  const conversion = convertEquilibriumConstant(reaction, kc, 'Kc', temperatureK)
  const inspection = inspectEquation(reaction)
  const units = unitsFor(inspection.deltaN)
  return {
    id: spec.id,
    equation: spec.equation,
    reaction,
    species: spec.species,
    kc,
    kp: conversion.output,
    deltaN: inspection.deltaN,
    factor: conversion.factor,
    gasReactants: inspection.gasReactants,
    gasProducts: inspection.gasProducts,
    kcUnit: units.kc,
    kpUnit: units.kp,
  }
}

export const KPKC_EXAMPLES: KpKcExample[] = EXAMPLE_SPECS.map((spec) => buildExample(spec))

/** Pressure of the gas in the box at step 0, bar: p = [gas] RT. */
export const BOX_PRESSURE = BOX_CONCENTRATION * R_BAR_L_PER_MOL_K * KPKC_T

/** RT at KPKC_T, in L bar mol⁻¹: the factor that Δn raises. */
export const KPKC_RT = R_BAR_L_PER_MOL_K * KPKC_T

export type KpKcStep =
  | { kind: 'box'; title: string; concentration: number; temperatureK: number; pressureBar: number }
  | { kind: 'example'; title: string; example: KpKcExample }
  | { kind: 'summary'; title: string; examples: KpKcExample[] }

export function kpKcSteps(): KpKcStep[] {
  return [
    {
      kind: 'box',
      title: 'One gas, one box',
      concentration: BOX_CONCENTRATION,
      temperatureK: KPKC_T,
      pressureBar: BOX_PRESSURE,
    },
    { kind: 'example', title: 'Δn = 0', example: KPKC_EXAMPLES[0] },
    { kind: 'example', title: 'Δn = −2', example: KPKC_EXAMPLES[1] },
    { kind: 'example', title: 'Δn = +1', example: KPKC_EXAMPLES[2] },
    { kind: 'summary', title: 'Units and Δn', examples: KPKC_EXAMPLES },
  ]
}

/** Formats a constant for display: three significant figures, or scientific notation at the ends. */
export function formatConstant(value: number): string {
  if (value === 0) return '0'
  const magnitude = Math.abs(value)
  if (magnitude < 0.01 || magnitude >= 1000) return formatSci(value, 2)
  return value.toPrecision(3)
}

/** Subscripts the digits of a formula for SVG text: "Cl2" becomes "Cl₂". */
export function subscripted(formula: string): string {
  const digits = '₀₁₂₃₄₅₆₇₈₉'
  return formula.replace(/\d/g, (d) => digits[Number(d)])
}

/** Signed integer with the U+2212 minus: +1, −2, 0. */
export function signedInt(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`
}

/** Equation in plain Unicode for SVG text: "2NOCl(g) ⇌ 2NO(g) + Cl₂(g)". */
export function equationText(reaction: Reaction): string {
  const side = (terms: Reaction['reactants']) =>
    terms
      .map((t) => `${t.coefficient > 1 ? t.coefficient : ''}${subscripted(t.species)}(${t.phase})`)
      .join(' + ')
  return `${side(reaction.reactants)} ⇌ ${side(reaction.products)}`
}

/** Equation without phases, for the narrow summary cards: "2NOCl ⇌ 2NO + Cl₂". */
export function equationBare(reaction: Reaction): string {
  const side = (terms: Reaction['reactants']) =>
    terms.map((t) => `${t.coefficient > 1 ? t.coefficient : ''}${subscripted(t.species)}`).join(' + ')
  return `${side(reaction.reactants)} ⇌ ${side(reaction.products)}`
}
