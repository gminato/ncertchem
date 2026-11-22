import { describe, expect, it } from 'vitest'
import {
  F_SERIES_POSITIONS,
  actinoidSymbols,
  firstActinoidAhead,
  fBlockPosition,
  isNamedLanthanoidState,
  lanthanoidSymbols,
  namedLanthanoidStates,
} from './f-block-compare'

describe('f-block compare positions', () => {
  it('pairs Ce to Lu with Th to Lr at positions 1 to 14', () => {
    expect(lanthanoidSymbols()).toHaveLength(F_SERIES_POSITIONS)
    expect(actinoidSymbols()).toHaveLength(F_SERIES_POSITIONS)
    expect(lanthanoidSymbols()[0]).toBe('Ce')
    expect(lanthanoidSymbols()[13]).toBe('Lu')
    expect(actinoidSymbols()[0]).toBe('Th')
    expect(actinoidSymbols()[13]).toBe('Lr')
  })

  it('rejects positions outside 1 to 14', () => {
    expect(() => fBlockPosition(0)).toThrow(RangeError)
    expect(() => fBlockPosition(15)).toThrow(RangeError)
  })

  it('draws only the lanthanoid states NCERT names: Nd at +3 and +4, Pm at +3 alone', () => {
    const nd = fBlockPosition(3).lanthanoid
    expect(nd.symbol).toBe('Nd')
    expect(nd.states).toEqual([3, 4])
    expect(nd.maxState).toBe(4)
    expect(fBlockPosition(4).lanthanoid.symbol).toBe('Pm')
    expect(fBlockPosition(4).lanthanoid.states).toEqual([3])
  })

  it('names Ln²⁺ only for Sm, Eu and Yb, and Ln⁴⁺ only for Ce, Pr, Nd, Tb and Dy', () => {
    expect(isNamedLanthanoidState('Sm', 2)).toBe(true)
    expect(isNamedLanthanoidState('Eu', 2)).toBe(true)
    expect(isNamedLanthanoidState('Yb', 2)).toBe(true)
    expect(isNamedLanthanoidState('Ce', 2)).toBe(false)
    expect(isNamedLanthanoidState('Lu', 2)).toBe(false)
    expect(isNamedLanthanoidState('Ce', 4)).toBe(true)
    expect(isNamedLanthanoidState('Lu', 4)).toBe(false)
    expect(namedLanthanoidStates('Lu')).toEqual([3])
    expect(namedLanthanoidStates('La')).toEqual([3])
    expect(() => namedLanthanoidStates('Th')).toThrow(RangeError)
  })

  it('gives the top state from the named set: Ce +4, Lu +3', () => {
    expect(fBlockPosition(1).lanthanoid.maxState).toBe(4)
    expect(fBlockPosition(14).lanthanoid.maxState).toBe(3)
    expect(fBlockPosition(14).lanthanoid.states).toEqual([3])
  })

  it('shows Table 4.11 maxima: Np and Pu both +7', () => {
    expect(fBlockPosition(4).actinoid.symbol).toBe('Np')
    expect(fBlockPosition(4).actinoid.maxState).toBe(7)
    expect(fBlockPosition(5).actinoid.maxState).toBe(7)
  })

  it('marks missing M3+ radii as null', () => {
    expect(fBlockPosition(1).actinoid.radiusM3PlusPm).toBeNull()
    expect(fBlockPosition(14).lanthanoid.radiusM3PlusPm).toBeNull()
    expect(fBlockPosition(3).actinoid.radiusM3PlusPm).toBe(103)
  })

  it('counts f electrons in the M3+ ions', () => {
    expect(fBlockPosition(1).lanthanoid.f3Count).toBe(1)
    expect(fBlockPosition(14).actinoid.f3Count).toBe(14)
    expect(fBlockPosition(1).actinoid.f3Count).toBe(1)
  })

  it('finds the first position where the actinoid top state is higher', () => {
    expect(firstActinoidAhead()).toBe(2)
    expect(fBlockPosition(2).actinoidAhead).toBe(true)
    expect(fBlockPosition(2).summary).toContain('Pa')
  })
})
