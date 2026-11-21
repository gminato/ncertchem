import { describe, it, expect } from 'vitest'
import {
  AG_MOLAR_MASS,
  CU_MOLAR_MASS,
  FARADAY_STEPS,
  clampFaradayStep,
  countingNumbers,
  firstLawMass,
  getFaradayStepState,
  roundTo,
  seriesMasses,
  SERIES_CHARGE_C,
} from './faraday-steps'

describe('faraday electrolysis Scrolly steps', () => {
  it('has five Steps in the order the Prose describes them', () => {
    expect(FARADAY_STEPS.map((s) => s.id)).toEqual([
      'electrolytic-cell',
      'ions-carry-current',
      'first-law',
      'second-law',
      'counting',
    ])
    expect(FARADAY_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
  })

  it('keeps the first Step still and starts ions and electrons only from Step 2', () => {
    expect(getFaradayStepState(0).ionsOn).toBe(false)
    expect(getFaradayStepState(0).electronsOn).toBe(false)
    expect(getFaradayStepState(1).ionsOn).toBe(true)
    expect(getFaradayStepState(1).electronsOn).toBe(true)
  })

  it('uses the series scene only for the second law and the bars only for the first law', () => {
    expect(getFaradayStepState(3).scene).toBe('series')
    expect(getFaradayStepState(2).barsOn).toBe(true)
    expect(FARADAY_STEPS.filter((s) => s.barsOn).map((s) => s.index)).toEqual([2])
  })

  it('keeps every deposit and erosion fraction on the 0 to 1 scale', () => {
    for (const step of FARADAY_STEPS) {
      for (const cell of step.cells) {
        expect(cell.deposit).toBeGreaterThanOrEqual(0)
        expect(cell.deposit).toBeLessThanOrEqual(1)
        expect(cell.erosion).toBeGreaterThanOrEqual(0)
        expect(cell.erosion).toBeLessThanOrEqual(1)
      }
    }
  })

  it('clamps out-of-range steps', () => {
    expect(clampFaradayStep(-3)).toBe(0)
    expect(clampFaradayStep(99)).toBe(4)
    expect(clampFaradayStep(Number.NaN)).toBe(0)
  })
})

describe('faraday electrolysis numbers (from the libs)', () => {
  it('doubles the copper mass when the time doubles (first law)', () => {
    expect(firstLawMass(1000).toFixed(3)).toBe('0.329')
    expect(firstLawMass(2000).toFixed(3)).toBe('0.659')
    expect(firstLawMass(2000)).toBeCloseTo(2 * firstLawMass(1000), 10)
  })

  it('deposits 4.02 g Ag and 1.19 g Cu from 3600 C (second law)', () => {
    expect(SERIES_CHARGE_C).toBe(3600)
    const m = seriesMasses()
    expect(m.silver.toFixed(2)).toBe('4.02')
    expect(m.copper.toFixed(2)).toBe('1.19')
  })

  it('gives M/n of 107.87 for silver and 31.78 for copper', () => {
    expect(roundTo(AG_MOLAR_MASS / 1, 2).toFixed(2)).toBe('107.87')
    expect(roundTo(CU_MOLAR_MASS / 2, 2).toFixed(2)).toBe('31.78')
  })

  it('counts 0.0373 mol of electrons and 0.0187 mol of Cu²⁺', () => {
    const c = countingNumbers()
    expect(c.moles.toFixed(4)).toBe('0.0373')
    expect((c.moles / 2).toFixed(4)).toBe('0.0187')
    expect(c.faraday).toBe(96487)
  })

  it('makes the copper deposit thinner than the silver deposit in series', () => {
    const [ag, cu] = getFaradayStepState(3).cells
    expect(cu.deposit).toBeLessThan(ag.deposit)
    expect(cu.deposit / ag.deposit).toBeCloseTo(seriesMasses().copper / seriesMasses().silver, 10)
  })
})
