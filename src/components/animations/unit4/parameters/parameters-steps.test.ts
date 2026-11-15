import { describe, expect, it } from 'vitest'
import { NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS } from '@/lib/chem/ncert-unit4-tables'
import {
  BOND_LENGTH_STEP_COUNT,
  BOND_ORDER_SPECIES,
  BOND_ORDER_STEP_COUNT,
  CARBON_BONDS,
  OZONE_AVERAGE_ORDER,
  OZONE_LENGTHS,
  RESONANCE_STEP_COUNT,
  bondLengthTarget,
  bondOrderTarget,
  resonanceTarget,
} from './parameters-steps'

const printed = (bond: string) => NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS.rows.find((r) => r.bond === bond)!.lengthPm

describe('bond length Steps (4.3.1)', () => {
  it('builds the carbon bond from two covalent radii of the matching bond order', () => {
    expect(bondLengthTarget(0)).toEqual({ bondOrder: 1, radiusPm: 77, second: 0, lengthPm: 0 })
    expect(bondLengthTarget(1)).toEqual({ bondOrder: 1, radiusPm: 77, second: 1, lengthPm: 154 })
    expect(bondLengthTarget(2).radiusPm).toBe(67)
    expect(bondLengthTarget(3).radiusPm).toBe(60)
  })

  it('gets the C–C and C≡C lengths of Table 4.2 exactly, and C=C within one pm', () => {
    expect(bondLengthTarget(1).lengthPm).toBe(printed('C–C'))
    expect(bondLengthTarget(3).lengthPm).toBe(printed('C≡C'))
    expect(Math.abs(bondLengthTarget(2).lengthPm - printed('C=C'))).toBeLessThanOrEqual(1)
  })

  it('clamps out-of-range Steps', () => {
    expect(bondLengthTarget(-3)).toEqual(bondLengthTarget(0))
    expect(bondLengthTarget(99)).toEqual(bondLengthTarget(BOND_LENGTH_STEP_COUNT - 1))
  })
})

describe('bond order Steps (4.3.4)', () => {
  it('lists the species with lengths and enthalpies from the printed tables', () => {
    const [h2, o2, n2, f2, carbon] = BOND_ORDER_SPECIES
    expect([h2.lengthPm, h2.enthalpyKj]).toEqual([74, 435.8])
    expect([o2.lengthPm, o2.enthalpyKj]).toEqual([121, 498])
    expect([n2.lengthPm, n2.enthalpyKj]).toEqual([109, 946])
    expect([f2.lengthPm, f2.enthalpyKj]).toEqual([144, 159])
    expect(carbon.enthalpyKj).toBeNull()
  })

  it('shows the carbon bond lengths falling as the bond order rises', () => {
    expect(CARBON_BONDS.map((b) => b.order)).toEqual([1, 2, 3])
    expect(CARBON_BONDS.map((b) => b.lengthPm)).toEqual([154, 133, 120])
  })

  it('shows bond enthalpy rising with bond order for N2 over O2 over H2', () => {
    const [h2, o2, n2] = BOND_ORDER_SPECIES
    expect(n2.enthalpyKj!).toBeGreaterThan(o2.enthalpyKj!)
    expect(o2.enthalpyKj!).toBeGreaterThan(h2.enthalpyKj!)
  })

  it('hides the enthalpy row on the carbon Step and clamps', () => {
    expect(bondOrderTarget(4)).toEqual({ species: -1, lengthPm: 154, enthalpyKj: 0, showEnthalpy: 0 })
    expect(bondOrderTarget(1).showEnthalpy).toBe(1)
    expect(bondOrderTarget(50)).toEqual(bondOrderTarget(BOND_ORDER_STEP_COUNT - 1))
  })
})

describe('resonance Steps (4.3.5)', () => {
  it('shows ozone as form I, form II, both with an arrow, then the hybrid', () => {
    expect(resonanceTarget(0)).toMatchObject({ formI: 1, formII: 0, arrow: 0, hybrid: 0 })
    expect(resonanceTarget(1)).toMatchObject({ formI: 0, formII: 1, arrow: 0, hybrid: 0 })
    expect(resonanceTarget(2)).toMatchObject({ formI: 1, formII: 1, arrow: 1, hybrid: 0 })
    expect(resonanceTarget(3)).toMatchObject({ formI: 0, formII: 0, arrow: 0, hybrid: 1 })
    expect(resonanceTarget(RESONANCE_STEP_COUNT - 1)).toMatchObject({ hybrid: 1, scale: 1 })
  })

  it('uses the printed bond lengths and the averaged bond order 1.5', () => {
    expect(OZONE_LENGTHS).toEqual({ single: 148, double: 121, measured: 128 })
    expect(OZONE_AVERAGE_ORDER).toBe(1.5)
    expect(OZONE_LENGTHS.measured).toBeGreaterThan(OZONE_LENGTHS.double)
    expect(OZONE_LENGTHS.measured).toBeLessThan(OZONE_LENGTHS.single)
  })
})
