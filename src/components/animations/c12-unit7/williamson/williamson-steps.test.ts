import { describe, expect, it } from 'vitest'
import { WILLIAMSON_DATA, WILLIAMSON_GRAPHS, WILLIAMSON_STEPS } from './williamson-steps'
import { clampStep } from '../ether-svg-helpers'

describe('williamson-sn2-vs-e2 Scrolly steps', () => {
  it('defines 4 steps matching the MDX Scrolly', () => {
    expect(WILLIAMSON_STEPS).toHaveLength(4)
    expect(WILLIAMSON_DATA.generalEquation).toContain('R–O–R′')
  })

  it('parses skeletal product graphs cleanly', () => {
    expect(WILLIAMSON_GRAPHS.tertButylMethylEther.atoms).toHaveLength(6)
    expect(WILLIAMSON_GRAPHS.isobutene.atoms).toHaveLength(4)
  })

  it('clamps step indices safely', () => {
    expect(clampStep(-2, WILLIAMSON_STEPS.length)).toBe(0)
    expect(clampStep(3, WILLIAMSON_STEPS.length)).toBe(3)
    expect(clampStep(10, WILLIAMSON_STEPS.length)).toBe(3)
  })
})
