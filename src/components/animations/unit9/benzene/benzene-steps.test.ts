import { describe, expect, it } from 'vitest'
import { BENZENE_STEP_KINDS, barLength, benzeneBondPm, benzeneLadder } from './benzene-steps'

describe('benzene-structure Scrolly data', () => {
  it('has five Steps in the order of Section 9.5.2', () => {
    expect(BENZENE_STEP_KINDS).toEqual(['kekule-slide', 'ortho-pair', 'hybrid-circle', 'pi-doughnuts', 'bond-ladder'])
  })

  it('takes the bond lengths from NCERT: 154 pm, 139 pm and 134 pm, longest first', () => {
    const ladder = benzeneLadder()
    expect(ladder.map((r) => r.lengthPm)).toEqual([154, 139, 134])
    expect(ladder.map((r) => r.label)).toEqual(['C–C', 'benzene', 'C=C'])
  })

  it('the benzene bond is 139 pm, between the single and double bonds', () => {
    expect(benzeneBondPm()).toBe(139)
    const [single, benzene, double] = benzeneLadder().map((r) => r.lengthPm)
    expect(benzene).toBeLessThan(single)
    expect(benzene).toBeGreaterThan(double)
  })

  it('bars are drawn to one scale', () => {
    expect(barLength(154)).toBe(308)
    expect(barLength(139, 2)).toBe(278)
    expect(barLength(134, 1.5)).toBe(201)
  })
})
