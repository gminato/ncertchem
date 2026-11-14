import { describe, expect, it } from 'vitest'
import { elementBySymbol } from './periodic-data'
import {
  EKA_ALUMINIUM,
  EKA_SILICON,
  KNOWN_IN_1869,
  chlorideFormula,
  mean,
  nearestKnownNeighbours,
  oxideFormula,
  percentError,
} from './mendeleev'

describe('KNOWN_IN_1869', () => {
  it('resolves every symbol in the list and excludes the gaps Mendeleev left', () => {
    expect(KNOWN_IN_1869.size).toBeGreaterThan(50)
    for (const z of [30, 33, 52]) expect(KNOWN_IN_1869.has(z)).toBe(true) // Zn, As, Te
    expect(KNOWN_IN_1869.has(31)).toBe(false) // gallium
    expect(KNOWN_IN_1869.has(32)).toBe(false) // germanium
    expect(KNOWN_IN_1869.has(21)).toBe(false) // scandium
  })
})

describe('oxideFormula and chlorideFormula', () => {
  it('derives the oxide from the valence, which is group − 10', () => {
    expect(oxideFormula(13, 'E')).toBe('E2O3')
    expect(oxideFormula(14, 'E')).toBe('EO2')
  })

  it('derives the chloride from the same valence', () => {
    expect(chlorideFormula(13)).toBe('ECl3')
    expect(chlorideFormula(14)).toBe('ECl4')
  })
})

describe('mean and percentError', () => {
  it('averages values', () => {
    expect(mean([7, 39])).toBe(23)
    expect(() => mean([])).toThrow(RangeError)
  })

  it('gives the absolute percentage error', () => {
    expect(percentError(68, 70)).toBeCloseTo(2.857, 3)
    expect(percentError(72, 66)).toBeCloseTo(9.09, 2)
  })
})

describe('nearestKnownNeighbours', () => {
  it('finds the four known neighbours of eka-aluminium, skipping no gap', () => {
    const n = nearestKnownNeighbours(4, 13)
    expect(n.left?.symbol).toBe('Zn')
    expect(n.right?.symbol).toBe('As') // nearest to the right, since 32 is a gap
    expect(n.above?.symbol).toBe('Al')
    expect(n.below?.symbol).toBe('In')
  })

  it('skips the eka-aluminium gap when it looks left of eka-silicon', () => {
    const n = nearestKnownNeighbours(4, 14)
    expect(n.left?.symbol).toBe('Zn')
    expect(n.right?.symbol).toBe('As')
    expect(n.above?.symbol).toBe('Si')
    expect(n.below?.symbol).toBe('Sn')
  })
})

describe('Mendeleev predictions (NCERT Table 3.3)', () => {
  it('reads eka-aluminium predictions and gallium values as printed', () => {
    expect(EKA_ALUMINIUM.predicted.atomicMass).toBe(68)
    expect(EKA_ALUMINIUM.predicted.density).toBe(5.9)
    expect(EKA_ALUMINIUM.measured.atomicMass).toBe(70)
    expect(EKA_ALUMINIUM.measured.density).toBe(5.94)
    expect(EKA_ALUMINIUM.predicted.oxide).toBe('E2O3')
    expect(EKA_ALUMINIUM.measured.oxide).toBe('Ga2O3')
  })

  it('reads eka-silicon predictions and germanium values as printed', () => {
    expect(EKA_SILICON.predicted.atomicMass).toBe(72)
    expect(EKA_SILICON.measured.atomicMass).toBe(72.6)
    expect(EKA_SILICON.measured.density).toBe(5.36)
    expect(EKA_SILICON.predicted.chloride).toBe('ECl4')
  })

  it('places each eka-element at the gap that the found element fills', () => {
    expect(EKA_ALUMINIUM.found).toBe(elementBySymbol('Ga'))
    expect(EKA_SILICON.found).toBe(elementBySymbol('Ge'))
    expect(EKA_ALUMINIUM.found.period).toBe(EKA_ALUMINIUM.row)
    expect(EKA_ALUMINIUM.found.group).toBe(EKA_ALUMINIUM.col)
  })

  it('derives the printed oxide and chloride formulas from the group', () => {
    expect(oxideFormula(EKA_ALUMINIUM.col)).toBe(EKA_ALUMINIUM.predicted.oxide)
    expect(oxideFormula(EKA_SILICON.col)).toBe(EKA_SILICON.predicted.oxide)
    expect(chlorideFormula(EKA_SILICON.col)).toBe(EKA_SILICON.predicted.chloride)
  })
})
