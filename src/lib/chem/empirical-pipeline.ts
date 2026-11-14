import { ELEMENTS } from './elements'
import {
  empiricalFormula,
  formatFormula,
  massPercent,
  molarMass,
  molarMassOfCounts,
  molecularFormula,
  parseFormula,
  type FormulaCounts,
} from './formula'

/** One element's row in the empirical-formula pipeline. */
export interface PipelineRow {
  symbol: string
  atomicMass: number
  /** Mass percentage, rounded to two decimal places (the value a Learner would be given). */
  percent: number
  /** Grams of the element in a 100 g sample, which equals the percentage. */
  grams: number
  /** Moles of the element: grams ÷ atomic mass. */
  moles: number
  /** Moles divided by the smallest moles value in the compound, to two decimal places. */
  ratio: number
}

/** The whole pipeline, from a compound to its empirical and molecular formulas. */
export interface EmpiricalPipeline {
  /** The compound as the Learner names it, e.g. "C6H12O6". */
  compound: string
  molarMass: number
  rows: PipelineRow[]
  /** Atom counts of the empirical formula. */
  empirical: FormulaCounts
  /** Empirical formula in Hill order (derived), e.g. "CH2O". */
  empiricalLabel: string
  /** Mass of one empirical formula unit, in g mol⁻¹. */
  empiricalMass: number
  /** n = molar mass ÷ empirical formula mass. */
  n: number
  /** Molecular formula in Hill order (derived), e.g. "C6H12O6". */
  molecularLabel: string
}

const round2 = (x: number) => Math.round(x * 100) / 100
const round3 = (x: number) => Math.round(x * 1000) / 1000

/**
 * Runs the empirical-formula pipeline on a compound. The percentages come from
 * massPercent, rounded to two decimal places as they would be in a lab report,
 * and the pipeline then works only from those rounded values.
 *
 * @throws {RangeError} On an invalid formula
 */
export function buildEmpiricalPipeline(compound: string): EmpiricalPipeline {
  const counts = parseFormula(compound)
  const symbols = Object.keys(counts)
  const exact = massPercent(compound)
  const percentBySymbol: Record<string, number> = {}
  for (const symbol of symbols) {
    percentBySymbol[symbol] = round2(exact[symbol])
  }

  const moles = symbols.map((symbol) => percentBySymbol[symbol] / ELEMENTS[symbol].atomicMass)
  const smallest = Math.min(...moles)

  const rows: PipelineRow[] = symbols.map((symbol, i) => ({
    symbol,
    atomicMass: ELEMENTS[symbol].atomicMass,
    percent: percentBySymbol[symbol],
    grams: percentBySymbol[symbol],
    moles: round3(moles[i]),
    ratio: round2(moles[i] / smallest),
  }))

  const empirical = empiricalFormula(percentBySymbol)
  const empiricalMass = molarMassOfCounts(empirical)
  const mass = molarMass(compound)
  const molecular = molecularFormula(empirical, mass)

  return {
    compound,
    molarMass: mass,
    rows,
    empirical,
    empiricalLabel: formatFormula(empirical),
    empiricalMass,
    n: Math.round(mass / empiricalMass),
    molecularLabel: formatFormula(molecular),
  }
}
