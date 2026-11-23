import { describe, expect, it } from 'vitest'
import {
  DEHYDRATION_GRAPHS,
  DEHYDRATION_STEPS,
  DEHYDRATION_TEMPS_DATA,
} from './dehydration-steps'
import { clampStep } from '../ether-svg-helpers'

describe('ether-dehydration-vs-alkene Scrolly steps', () => {
  it('defines 4 steps matching the MDX Scrolly', () => {
    expect(DEHYDRATION_STEPS).toHaveLength(4)
    expect(DEHYDRATION_TEMPS_DATA.map((d) => d.temperatureK)).toEqual([413, 443])
  })

  it('parses all skeletal graphs cleanly', () => {
    expect(DEHYDRATION_GRAPHS.ethene.atoms).toHaveLength(2)
    expect(DEHYDRATION_GRAPHS.tertButanol.atoms).toHaveLength(5)
    expect(DEHYDRATION_GRAPHS.isobutene.atoms).toHaveLength(4)
  })

  it('clamps step indices safely', () => {
    expect(clampStep(-1, DEHYDRATION_STEPS.length)).toBe(0)
    expect(clampStep(2, DEHYDRATION_STEPS.length)).toBe(2)
    expect(clampStep(99, DEHYDRATION_STEPS.length)).toBe(3)
  })
})
