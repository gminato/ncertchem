import { describe, expect, it } from 'vitest'
import {
  CE_IV_E_VOLT,
  HF_RADIUS_PM,
  LN_COLUMNS,
  RADIUS_POINTS,
  SPECIAL_STATES,
  STEP_COUNT,
  ZR_RADIUS_PM,
  hundSpins,
  lanthanoidStepVisual,
  radiusFallPerStepPm,
  radiusFallPm,
} from './lanthanoid-steps'

function column(symbol: string) {
  const col = LN_COLUMNS.find((c) => c.symbol === symbol)
  if (!col) throw new Error(`missing ${symbol}`)
  return col
}

describe('lanthanoid contraction Steps', () => {
  it('has one column per element La to Lu, in order, with f counts from Table 4.9', () => {
    expect(LN_COLUMNS.map((c) => c.Z)).toEqual(Array.from({ length: 15 }, (_, i) => 57 + i))
    expect(column('La').f).toBe(0)
    expect(column('Ce').ion).toBe('Ce³⁺')
    expect(column('Ce').f).toBe(1)
    expect(column('Gd').f).toBe(7)
    expect(column('Lu').f).toBe(14)
  })

  it('tags the atoms with a 5d electron (La, Ce, Gd, Lu) and no others', () => {
    const tagged = LN_COLUMNS.filter((c) => c.atomHas5d).map((c) => c.symbol)
    expect(tagged).toEqual(['La', 'Ce', 'Gd', 'Lu'])
  })

  it('plots Ln³⁺ radii from La (106) to Yb (86) and leaves Lu out', () => {
    expect(column('La').radiusPm).toBe(106)
    expect(column('Yb').radiusPm).toBe(86)
    expect(column('Lu').radiusPm).toBeNull()
    expect(RADIUS_POINTS).toHaveLength(14)
    expect(RADIUS_POINTS[0]).toEqual([57, 106])
    expect(RADIUS_POINTS[RADIUS_POINTS.length - 1]).toEqual([70, 86])
  })

  it('gives the 20 pm fall and about 1.54 pm per element', () => {
    expect(radiusFallPm()).toBe(20)
    expect(radiusFallPerStepPm()).toBeCloseTo(20 / 13, 9)
  })

  it('takes the Zr and Hf radii and the Ce(IV) potential from NCERT', () => {
    expect(ZR_RADIUS_PM).toBe(160)
    expect(HF_RADIUS_PM).toBe(159)
    expect(CE_IV_E_VOLT).toBe(1.74)
  })

  it('marks the four special ions with their f counts', () => {
    const found = Object.fromEntries(SPECIAL_STATES.map((s) => [s.ion, s.fCount]))
    expect(found).toEqual({ 'Ce⁴⁺': 0, 'Eu²⁺': 7, 'Tb⁴⁺': 7, 'Yb²⁺': 14 })
  })

  it('fills 4f orbitals by Hund: one arrow per orbital before any pairing', () => {
    expect(hundSpins(0).every((o) => !o.up && !o.down)).toBe(true)
    const three = hundSpins(3)
    expect(three.map((o) => o.up)).toEqual([true, true, true, false, false, false, false])
    expect(three.some((o) => o.down)).toBe(false)
    const nine = hundSpins(9)
    expect(nine.filter((o) => o.up && o.down)).toHaveLength(2)
    const full = hundSpins(14)
    expect(full.every((o) => o.up && o.down)).toBe(true)
    expect(() => hundSpins(15)).toThrow(RangeError)
    expect(() => hundSpins(-1)).toThrow(RangeError)
  })

  it('has five Steps, each with one drawing, and clamps out-of-range indices', () => {
    expect(STEP_COUNT).toBe(5)
    expect([0, 1, 2, 3, 4].map(lanthanoidStepVisual)).toEqual(['fill', 'radius', 'shield', 'twins', 'special'])
    expect(lanthanoidStepVisual(-3)).toBe('fill')
    expect(lanthanoidStepVisual(9)).toBe('special')
  })
})
