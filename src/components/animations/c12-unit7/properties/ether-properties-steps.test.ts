import { describe, expect, it } from 'vitest'
import {
  ETHER_GEOMETRY,
  ETHER_PROPERTIES_STEPS,
  PROPERTIES_RECORDS,
} from './ether-properties-steps'
import { clampStep } from '../ether-svg-helpers'

describe('ether-hbond-boiling-miscibility Scrolly steps', () => {
  it('defines 3 steps matching the MDX Scrolly', () => {
    expect(ETHER_PROPERTIES_STEPS).toHaveLength(3)
  })

  it('uses exact NCERT Section 7.6.2 values', () => {
    expect(ETHER_GEOMETRY.angleDeg).toBe(111.7)
    expect(ETHER_GEOMETRY.coLengthPm).toBe(141)
    expect(ETHER_GEOMETRY.alcoholEtherBpGapK).toBe(82.4)
    expect(PROPERTIES_RECORDS.map((r) => [r.name, r.bpK, r.miscibilityGPer100Ml])).toEqual([
      ['n-Pentane', 309.1, null],
      ['Ethoxyethane', 307.6, 7.5],
      ['Butan-1-ol', 390, 9],
    ])
  })

  it('clamps step indices safely', () => {
    expect(clampStep(-1, ETHER_PROPERTIES_STEPS.length)).toBe(0)
    expect(clampStep(1, ETHER_PROPERTIES_STEPS.length)).toBe(1)
    expect(clampStep(8, ETHER_PROPERTIES_STEPS.length)).toBe(2)
  })
})
