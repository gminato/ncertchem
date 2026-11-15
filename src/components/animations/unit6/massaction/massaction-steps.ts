/**
 * Data and step targets for the mass-action Scrolly (Section 6.3). The six experiments are read from
 * NCERT Table 6.2 through the tables library; every trial expression and constant is computed here
 * with the equilibrium library, never typed in.
 */

import {
  NCERT_TABLE_6_2_H2_I2_HI,
  type HydrogenIodineRow,
} from '@/lib/chem/ncert-unit6-tables'
import { H2_I2_REACTION, meanKcFromTable62 } from '@/lib/chem/approach-to-equilibrium'
import {
  kcExpression,
  kcFromConcentrations,
  transformK,
  type ExpressionFactor,
} from '@/lib/chem/equilibrium'

/** Table 6.2 entries are printed in units of 10⁻² mol L⁻¹. */
const UNIT = 1e-2

export interface Experiment {
  experiment: number
  /** Which side the experiment started from. */
  start: 'H2 + I2' | 'HI'
  /** Initial amounts in mol L⁻¹. */
  initial: { H2: number; I2: number; HI: number }
  /** Equilibrium amounts in mol L⁻¹. */
  equilibrium: { H2: number; I2: number; HI: number }
  /** [HI]eq / ([H2]eq [I2]eq), mol L⁻¹ units: the first trial expression. */
  firstTrial: number
  /** [HI]eq² / ([H2]eq [I2]eq): Kc. */
  kc: number
}

function fromRow(row: HydrogenIodineRow): Experiment {
  const initial = { H2: row.initial.h2 * UNIT, I2: row.initial.i2 * UNIT, HI: row.initial.hi * UNIT }
  const equilibrium = { H2: row.equilibrium.h2 * UNIT, I2: row.equilibrium.i2 * UNIT, HI: row.equilibrium.hi * UNIT }
  const firstTrial = equilibrium.HI / (equilibrium.H2 * equilibrium.I2)
  const kc = kcFromConcentrations(H2_I2_REACTION, equilibrium)
  return {
    experiment: row.experiment,
    start: row.initial.h2 > 0 || row.initial.i2 > 0 ? 'H2 + I2' : 'HI',
    initial,
    equilibrium,
    firstTrial,
    kc,
  }
}

/** The six experiments of Table 6.2, with the two trial expressions computed for each. */
export function experiments(): Experiment[] {
  return NCERT_TABLE_6_2_H2_I2_HI.rows.map(fromRow)
}

/** Mean Kc of the six experiments, the constant used throughout Section 6.3. */
export function meanKc(): number {
  return meanKcFromTable62()
}

/** Lowest and highest value in a list. */
export function range(values: readonly number[]): { min: number; max: number } {
  if (values.length === 0) throw new RangeError('range needs at least one value')
  return { min: Math.min(...values), max: Math.max(...values) }
}

/** Expression factors of Kc for the H2 + I2 reaction, as the library builds them: products over reactants. */
export function h2I2Expression(): { numerator: ExpressionFactor[]; denominator: ExpressionFactor[] } {
  return kcExpression(H2_I2_REACTION)
}

/** One row of the Table 6.4 relations, applied to the mean Kc of the H2 + I2 reaction. */
export interface RelatedConstant {
  equation: string
  value: number
  rule: 'reverse' | 'multiply' | 'divide'
}

/** K for the reversed reaction, the doubled one and the halved one, all from the same mean Kc. */
export function relatedConstants(k: number): RelatedConstant[] {
  return [
    { equation: '2HI ⇌ H₂ + I₂', value: transformK(k, 'reverse'), rule: 'reverse' },
    { equation: '2H₂ + 2I₂ ⇌ 4HI', value: transformK(k, { multiplyBy: 2 }), rule: 'multiply' },
    { equation: '½H₂ + ½I₂ ⇌ HI', value: transformK(k, { divideBy: 2 }), rule: 'divide' },
  ]
}
