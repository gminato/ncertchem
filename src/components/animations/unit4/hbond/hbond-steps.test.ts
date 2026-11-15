import { describe, expect, it } from 'vitest'
import { BOILING_GROUPS, BOILING_STEP_COUNT, boilingTargetForStep, contactTargetForStep, groupSeries } from './hbond-steps'

describe('contact Steps', () => {
  it('clamps out-of-range and NaN Steps to the first and last', () => {
    expect(contactTargetForStep(-1).id).toBe('cause')
    expect(contactTargetForStep(10).id).toBe('intramolecular')
    expect(contactTargetForStep(Number.NaN).id).toBe('cause')
  })
})

describe('boiling-point Steps and series', () => {
  it('reveals water first and the other groups only after that', () => {
    expect(boilingTargetForStep(0).revealed).toEqual([])
    expect(boilingTargetForStep(1).revealed).toEqual([16])
    expect(boilingTargetForStep(BOILING_STEP_COUNT - 1).revealed).toEqual([14, 15, 16, 17])
  })

  it('finds the water anomaly as a large positive gap, and CH4 as a small negative one', () => {
    expect(groupSeries(16).anomaly.formula).toBe('H2O')
    expect(groupSeries(16).anomaly.anomalyK).toBeGreaterThan(100)
    expect(groupSeries(14).anomaly.anomalyK).toBeLessThan(0)
  })

  it('lists four periods for each group, in order', () => {
    for (const group of BOILING_GROUPS) {
      const periods = groupSeries(group).points.map((p) => p.period)
      expect(periods).toEqual([2, 3, 4, 5])
    }
  })
})
