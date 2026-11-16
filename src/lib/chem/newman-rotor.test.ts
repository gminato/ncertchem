import { describe, expect, it } from 'vitest'
import { dihedralFromPointer, rotorReadout, snapToNearestSixty, staggeredPercent, wrapTurn, ROTOR_BARRIER_KJ } from './newman-rotor'
import { boltzmannStaggeredFraction } from './conformations'

describe('wrapTurn', () => {
  it('wraps into [0, 360)', () => {
    expect(wrapTurn(-30)).toBe(330)
    expect(wrapTurn(370)).toBe(10)
    expect(wrapTurn(360)).toBe(0)
    expect(wrapTurn(0)).toBe(0)
  })
  it('rejects a non-finite angle', () => {
    expect(() => wrapTurn(Number.NaN)).toThrow(RangeError)
  })
})

describe('dihedralFromPointer', () => {
  it('is 0 when the pointer is over the top front bond (the eclipsed position)', () => {
    expect(dihedralFromPointer(-90)).toBe(0)
  })
  it('is 60 when the pointer is 60° clockwise of the top bond', () => {
    expect(dihedralFromPointer(-30)).toBe(60)
  })
  it('rounds to whole degrees and stays in [0, 360)', () => {
    expect(dihedralFromPointer(-90 + 0.4)).toBe(0)
    expect(dihedralFromPointer(-90 - 10)).toBe(350)
    expect(dihedralFromPointer(-90 + 720 + 7)).toBe(7)
  })
})

describe('snapToNearestSixty', () => {
  it('snaps to the nearest multiple of 60 and wraps at 360', () => {
    expect(snapToNearestSixty(29)).toBe(0)
    expect(snapToNearestSixty(31)).toBe(60)
    expect(snapToNearestSixty(355)).toBe(0)
  })
})

describe('rotorReadout', () => {
  it('names the lib conformers and gives the lib energy', () => {
    expect(rotorReadout(0)).toEqual({ dihedral: 0, name: 'eclipsed', energy: 12.5 })
    expect(rotorReadout(60)).toEqual({ dihedral: 60, name: 'staggered', energy: 0 })
    expect(rotorReadout(30).name).toBe('skew')
    expect(rotorReadout(30).energy).toBeCloseTo(6.25, 9)
  })
  it('rounds the input to whole degrees', () => {
    expect(rotorReadout(59.6).dihedral).toBe(60)
  })
  it('uses the NCERT barrier', () => {
    expect(ROTOR_BARRIER_KJ).toBe(12.5)
  })
})

describe('staggeredPercent', () => {
  it('is the lib two-level fraction, to one decimal place', () => {
    expect(staggeredPercent(298.15)).toBeCloseTo(Math.round(boltzmannStaggeredFraction(298.15) * 1000) / 10, 9)
  })
  it('is near 100 per cent at low temperature and near 50 at very high temperature', () => {
    expect(staggeredPercent(100)).toBe(100)
    expect(staggeredPercent(1e7)).toBe(50)
  })
  it('rejects a temperature of zero', () => {
    expect(() => staggeredPercent(0)).toThrow(RangeError)
  })
})
