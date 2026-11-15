import { describe, expect, it } from 'vitest'
import { NCERT_TABLE_4_5_DIPOLE_MOMENTS } from './ncert-unit4-tables'
import {
  LONE_PAIR_DIPOLE,
  bondDipoleVector,
  dipoleMoleculeFromVsepr,
  electronegativityOf,
  ncertDipoleFor,
  netDipole,
} from './dipole'

describe('electronegativity and bond dipoles', () => {
  it('reads Pauling values from the periodic table', () => {
    expect(electronegativityOf('H')).toBeCloseTo(2.2, 2)
    expect(electronegativityOf('F')).toBeCloseTo(3.98, 2)
  })

  it('points a bond dipole from the less to the more electronegative atom', () => {
    // H–F: the F end is negative, so the dipole runs from the H side toward the F side.
    // Centre is H, ligand F sits along +x, so the vector is along +x.
    const v = bondDipoleVector('H', { symbol: 'F', direction: [1, 0, 0] })
    expect(v[0]).toBeGreaterThan(0)
    // Reverse the roles: centre F, ligand H along +x, the dipole runs toward F, i.e. −x.
    const w = bondDipoleVector('F', { symbol: 'H', direction: [1, 0, 0] })
    expect(w[0]).toBeLessThan(0)
  })

  it('rejects an unknown symbol', () => {
    expect(() => electronegativityOf('Xx')).toThrow(RangeError)
  })
})

describe('netDipole for symmetric molecules', () => {
  it('is zero for CO2, BF3, CH4 and CCl4', () => {
    const co2 = dipoleMoleculeFromVsepr('C', ['O', 'O'], 0)
    expect(netDipole(co2).magnitude).toBeCloseTo(0, 9)

    const bf3 = dipoleMoleculeFromVsepr('B', ['F', 'F', 'F'], 0)
    expect(netDipole(bf3).magnitude).toBeCloseTo(0, 9)

    const ch4 = dipoleMoleculeFromVsepr('C', ['H', 'H', 'H', 'H'], 0)
    expect(netDipole(ch4).magnitude).toBeCloseTo(0, 9)
    expect(netDipole(ch4).direction).toBeNull()

    const ccl4 = dipoleMoleculeFromVsepr('C', ['Cl', 'Cl', 'Cl', 'Cl'], 0)
    expect(netDipole(ccl4).magnitude).toBeCloseTo(0, 9)
  })

  it('is non-zero for CHCl3, which NCERT prints as 1.04 D', () => {
    const chcl3 = dipoleMoleculeFromVsepr('C', ['Cl', 'Cl', 'Cl', 'H'], 0)
    expect(netDipole(chcl3).magnitude).toBeGreaterThan(0.5)
    expect(ncertDipoleFor('CHCl3')).toBe(1.04)
  })
})

describe('netDipole for lone-pair molecules', () => {
  it('H2O and NH3 are non-zero, with H2O larger, as Table 4.5 prints (1.85 D > 1.47 D)', () => {
    const water = netDipole(dipoleMoleculeFromVsepr('O', ['H', 'H'], 2))
    const ammonia = netDipole(dipoleMoleculeFromVsepr('N', ['H', 'H', 'H'], 1))
    expect(water.magnitude).toBeGreaterThan(ammonia.magnitude)
    expect(ammonia.magnitude).toBeGreaterThan(0)
  })

  it('NF3 is much smaller than NH3, because the lone pair opposes the N–F bond dipoles', () => {
    const ammonia = netDipole(dipoleMoleculeFromVsepr('N', ['H', 'H', 'H'], 1))
    const trifluoride = netDipole(dipoleMoleculeFromVsepr('N', ['F', 'F', 'F'], 1))
    expect(trifluoride.magnitude).toBeGreaterThan(0)
    expect(trifluoride.magnitude).toBeLessThan(ammonia.magnitude / 5)
  })

  it('points the NH3 dipole along the lone pair and the NF3 dipole against it', () => {
    const ammonia = netDipole(dipoleMoleculeFromVsepr('N', ['H', 'H', 'H'], 1))
    const trifluoride = netDipole(dipoleMoleculeFromVsepr('N', ['F', 'F', 'F'], 1))
    const lp = dipoleMoleculeFromVsepr('N', ['H', 'H', 'H'], 1).lonePairDirections[0]
    const alignment = (d: { direction: readonly number[] | null }) =>
      d.direction ? d.direction[0] * lp[0] + d.direction[1] * lp[1] + d.direction[2] * lp[2] : 0
    expect(alignment(ammonia)).toBeGreaterThan(0.99)
    expect(alignment(trifluoride)).toBeLessThan(-0.99)
  })

  it('states the lone-pair contribution used in the model', () => {
    expect(LONE_PAIR_DIPOLE).toBeGreaterThan(0)
  })
})

describe('NCERT Table 4.5 reference values', () => {
  it('returns the printed debye value for molecules in the table and null otherwise', () => {
    expect(ncertDipoleFor('H2O')).toBe(1.85)
    expect(ncertDipoleFor('NF3')).toBe(0.23)
    expect(ncertDipoleFor('SO3')).toBeNull()
  })

  it('has the printed molecules with zero for CO2, BF3, CH4 and CCl4', () => {
    const zeros = NCERT_TABLE_4_5_DIPOLE_MOMENTS.rows.filter((r) => r.dipoleD === 0).map((r) => r.molecule)
    expect(zeros).toEqual(['H2', 'CO2', 'BF3', 'CH4', 'CCl4'])
  })
})
