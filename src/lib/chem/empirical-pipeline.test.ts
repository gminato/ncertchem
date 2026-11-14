import { describe, expect, it } from 'vitest'
import { buildEmpiricalPipeline } from './empirical-pipeline'

describe('buildEmpiricalPipeline', () => {
  const glucose = buildEmpiricalPipeline('C6H12O6')

  it('gives the mass percentages of glucose to two decimal places', () => {
    const percent = Object.fromEntries(glucose.rows.map((row) => [row.symbol, row.percent]))
    expect(percent).toEqual({ C: 40, H: 6.71, O: 53.29 })
  })

  it('finds the empirical formula CH2O and the molecular formula C6H12O6', () => {
    expect(glucose.empiricalLabel).toBe('CH2O')
    expect(glucose.empiricalMass).toBeCloseTo(30.027, 3)
    expect(glucose.n).toBe(6)
    expect(glucose.molecularLabel).toBe('C6H12O6')
  })

  it('gives whole-number ratios on the smallest-moles scale', () => {
    const ratio = Object.fromEntries(glucose.rows.map((row) => [row.symbol, row.ratio]))
    expect(ratio).toEqual({ C: 1, H: 2, O: 1 })
  })

  it('moles are grams divided by atomic mass', () => {
    const carbon = glucose.rows.find((row) => row.symbol === 'C')
    expect(carbon?.moles).toBeCloseTo(40 / 12.011, 2)
  })
})
