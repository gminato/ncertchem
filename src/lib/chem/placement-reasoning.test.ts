import { describe, expect, it } from 'vitest'
import { PERIODIC_TABLE, elementByZ } from './periodic-data'
import { locateElement } from './periodicity'
import { groupFromConfiguration, placementReasoning } from './placement-reasoning'

describe('placementReasoning (NCERT 3.5 and 3.6)', () => {
  it('derives the group from the configuration for every element up to Z = 36', () => {
    for (let Z = 1; Z <= 36; Z++) {
      const e = elementByZ(Z)
      expect(groupFromConfiguration(Z), `group of Z ${Z} (${e.symbol})`).toBe(e.group)
    }
  })

  it('finds the subshell of the last electron that matches the block of the data', () => {
    for (let Z = 1; Z <= 36; Z++) {
      const r = placementReasoning(Z)
      expect(r.lastSubshell?.endsWith(r.block), `Z ${Z}`).toBe(true)
    }
  })

  it('gives Cr its half-filled 3d and 4s, with the d-block reason', () => {
    const r = placementReasoning(24)
    expect(r.configuration).toBe('[Ar]3d⁵4s¹')
    expect(r.lastSubshell).toBe('3d')
    expect(r.groupReason).toContain('5 + 1 = 6')
    expect(r.valenceSubshells).toEqual(['3d', '4s'])
  })

  it('explains Ga (group 13) with the p-block count', () => {
    const r = placementReasoning(31)
    expect(r.group).toBe(13)
    expect(r.groupReason).toContain('10 + 3 = 13')
  })

  it('places helium in group 18 for its full shell', () => {
    expect(placementReasoning(2).group).toBe(18)
    expect(placementReasoning(2).groupReason).toContain('Group 18')
  })

  it('locates Z = 114 and 117 as NCERT would expect (period 7, p-block)', () => {
    const fl = placementReasoning(114)
    expect([fl.period, fl.group, fl.block]).toEqual([7, 14, 'p'])
    const ts = placementReasoning(117)
    expect([ts.period, ts.group, ts.block]).toEqual([7, 17, 'p'])
    expect(locateElement(117)).toMatchObject({ period: 7, group: 17, block: 'p' })
  })

  it('states the period reason and omits the configuration past Z = 36', () => {
    for (const e of PERIODIC_TABLE) {
      const r = placementReasoning(e.Z)
      expect(r.periodReason.length).toBeGreaterThan(20)
      if (e.Z > 36) {
        expect(r.configuration).toBeNull()
        expect(r.valenceSubshells).toEqual([])
      }
    }
  })

  it('rejects Z outside 1 to 118', () => {
    expect(() => placementReasoning(0)).toThrow(RangeError)
    expect(() => placementReasoning(119)).toThrow(RangeError)
  })
})
