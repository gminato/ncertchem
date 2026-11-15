import { describe, expect, it } from 'vitest'
import {
  NCERT_TABLE_5_1_FUSION_VAPORISATION,
  NCERT_TABLE_5_2_FORMATION,
  NCERT_TABLE_5_3A_SINGLE_BONDS,
  NCERT_TABLE_5_3B_MULTIPLE_BONDS,
  NCERT_TABLE_5_4_SPONTANEITY,
  NCERT_UNIT5_NACL_BORN_HABER,
  NCERT_UNIT5_NACL_FORMATION_KJ,
  NCERT_UNIT5_PRINTED_CHECKS,
  NCERT_UNIT5_WORKED_VALUES,
} from './ncert-unit5-tables'
import { NACL_BORN_HABER } from './ionic'

function find<T>(rows: readonly T[], predicate: (row: T) => boolean): T {
  const row = rows.find(predicate)
  if (!row) throw new Error('row not found')
  return row
}

describe('NCERT Table 5.1 (fusion and vaporisation)', () => {
  it('has nine substances with their printed values', () => {
    const rows = NCERT_TABLE_5_1_FUSION_VAPORISATION.rows
    expect(rows).toHaveLength(9)
    const water = find(rows, (r) => r.substance === 'H2O')
    expect(water).toMatchObject({ meltingPointK: 273.15, fusionKJ: 6.01, boilingPointK: 373.15, vaporisationKJ: 40.79 })
    expect(find(rows, (r) => r.substance === 'NaCl').vaporisationKJ).toBe(170)
    expect(find(rows, (r) => r.substance === 'C6H6').fusionKJ).toBe(9.83)
  })

  it('cites the table and its text line', () => {
    expect(NCERT_TABLE_5_1_FUSION_VAPORISATION.source).toContain('Table 5.1')
    expect(NCERT_TABLE_5_1_FUSION_VAPORISATION.source).toContain('line 1140')
  })

  it('records the 6.01 vs 6.00 disagreement for ΔfusH(H2O) (text line 1114)', () => {
    const water = find(NCERT_TABLE_5_1_FUSION_VAPORISATION.rows, (r) => r.substance === 'H2O')
    expect(water.fusionKJ).not.toBe(6.0)
    expect(NCERT_UNIT5_PRINTED_CHECKS.some((c) => c.where.includes('line 1114'))).toBe(true)
  })
})

describe('NCERT Table 5.2 (standard enthalpies of formation)', () => {
  it('has 51 printed rows', () => {
    expect(NCERT_TABLE_5_2_FORMATION.rows).toHaveLength(51)
  })

  it('matches the values quoted in the text', () => {
    const rows = NCERT_TABLE_5_2_FORMATION.rows
    expect(find(rows, (r) => r.species === 'H2O(l)').formationKJ).toBe(-285.83)
    expect(find(rows, (r) => r.species === 'CH4(g)').formationKJ).toBe(-74.81)
    expect(find(rows, (r) => r.species === 'C2H5OH(l)').formationKJ).toBe(-277.69)
    expect(find(rows, (r) => r.species === 'CaO(s)').formationKJ).toBe(-635.09)
    expect(find(rows, (r) => r.species === 'CaCO3(s)').formationKJ).toBe(-1206.92)
    expect(find(rows, (r) => r.species === 'Fe2O3(s)').formationKJ).toBe(-824.2)
    expect(find(rows, (r) => r.species === 'HBr(g)').formationKJ).toBe(-36.4)
    expect(find(rows, (r) => r.species === 'C6H6(l)').formationKJ).toBe(49)
  })

  it('gives zero for each element in its reference state as printed', () => {
    const rows = NCERT_TABLE_5_2_FORMATION.rows
    for (const species of ['Br2(l)', 'C(graphite)', 'Cl2(g)', 'H2(g)']) {
      expect(find(rows, (r) => r.species === species).formationKJ).toBe(0)
    }
  })

  it('has no duplicate species labels', () => {
    const labels = NCERT_TABLE_5_2_FORMATION.rows.map((r) => r.species)
    expect(new Set(labels).size).toBe(labels.length)
  })
})

describe('NCERT Table 5.3(a) (single bond enthalpies, matrix read as pairs)', () => {
  it('has 59 bonds, one per printed cell', () => {
    expect(NCERT_TABLE_5_3A_SINGLE_BONDS.rows).toHaveLength(59)
  })

  it('has one value per unordered pair', () => {
    const keys = NCERT_TABLE_5_3A_SINGLE_BONDS.rows.map((r) => [r.a, r.b].sort().join('-'))
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('reads the matrix column by column, with the printed values (H–H 435.8; C–H 414; C–C 347)', () => {
    const rows = NCERT_TABLE_5_3A_SINGLE_BONDS.rows
    expect(find(rows, (r) => r.a === 'H' && r.b === 'H').kJ).toBe(435.8)
    expect(find(rows, (r) => r.a === 'C' && r.b === 'H').kJ).toBe(414)
    expect(find(rows, (r) => r.a === 'C' && r.b === 'C').kJ).toBe(347)
    expect(find(rows, (r) => r.a === 'Cl' && r.b === 'Cl').kJ).toBe(243)
    expect(find(rows, (r) => r.a === 'I' && r.b === 'I').kJ).toBe(151)
  })
})

describe('NCERT Table 5.3(b) (multiple bond enthalpies)', () => {
  it('has the nine printed bonds', () => {
    const rows = NCERT_TABLE_5_3B_MULTIPLE_BONDS.rows
    expect(rows).toHaveLength(9)
    expect(find(rows, (r) => r.a === 'O' && r.b === 'O').kJ).toBe(498)
    expect(find(rows, (r) => r.a === 'C' && r.b === 'O' && r.order === 3).kJ).toBe(1070)
  })
})

describe('NCERT Table 5.4 (effect of temperature on spontaneity)', () => {
  it('has six printed cases', () => {
    expect(NCERT_TABLE_5_4_SPONTANEITY.rows).toHaveLength(6)
  })

  it('gives ΔG signs in the printed order', () => {
    expect(NCERT_TABLE_5_4_SPONTANEITY.rows.map((r) => r.deltaG)).toEqual(['-', '-', '+', '+', '-', '+'])
  })
})

describe('Unit 5 Born–Haber cycle for NaCl (Section 5.5(d))', () => {
  it('has five steps in cycle order', () => {
    expect(NCERT_UNIT5_NACL_BORN_HABER).toHaveLength(5)
  })

  it('closes on ΔfH(NaCl) = −411.2 kJ mol⁻¹', () => {
    const sum = NCERT_UNIT5_NACL_BORN_HABER.reduce((s, step) => s + step.enthalpyKJ, 0)
    expect(sum).toBeCloseTo(NCERT_UNIT5_NACL_FORMATION_KJ, 1)
  })

  it('gives the lattice enthalpy of +788 kJ mol⁻¹ (NCERT, for the dissociation direction) from the other four steps', () => {
    const others = NCERT_UNIT5_NACL_BORN_HABER.slice(0, 4).reduce((s, step) => s + step.enthalpyKJ, 0)
    // The lattice step (formation direction) is ΔfH − others = −411.2 − 376.8 = −788.0,
    // i.e. NCERT's ΔlatticeH = 411.2 + 108.4 + 121 + 496 − 348.6 = +788.0 for the reverse.
    expect(NCERT_UNIT5_NACL_FORMATION_KJ - others).toBeCloseTo(-788, 1)
  })

  it('differs from the Unit 4 values for ionisation and electron gain, which are kept separately', () => {
    const unit4Ionisation = NACL_BORN_HABER[2].enthalpyKj
    const unit4Gain = NACL_BORN_HABER[3].enthalpyKj
    expect(NCERT_UNIT5_NACL_BORN_HABER[2].enthalpyKJ).toBe(496)
    expect(NCERT_UNIT5_NACL_BORN_HABER[3].enthalpyKJ).toBe(-348.6)
    expect(unit4Ionisation).toBe(495.8)
    expect(unit4Gain).toBe(-348.7)
  })
})

describe('worked values and printed checks', () => {
  it('records each worked value with a Problem or section and a line number', () => {
    expect(NCERT_UNIT5_WORKED_VALUES.length).toBeGreaterThan(30)
    for (const v of NCERT_UNIT5_WORKED_VALUES) {
      expect(v.where.length).toBeGreaterThan(0)
      expect(v.line).toBeGreaterThan(0)
    }
  })

  it('keeps Problem 5.14’s printed ΔrG of −763.8 kJ mol⁻¹ as printed, and marks it as a misprint', () => {
    const printed = NCERT_UNIT5_WORKED_VALUES.find((v) => v.where === 'Problem 5.14' && v.quantity === 'printed ΔrG')
    expect(printed?.value).toBe(-763.8)
    expect(NCERT_UNIT5_PRINTED_CHECKS.some((c) => c.where.includes('Problem 5.14') && c.kind === 'misprint')).toBe(true)
  })

  it('records the printed H2 + Br2 → 2HBr value and its recomputed value (2 × −36.40 = −72.8)', () => {
    const hbr = NCERT_TABLE_5_2_FORMATION.rows.find((r) => r.species === 'HBr(g)')
    expect(hbr).toBeDefined()
    expect(2 * hbr!.formationKJ).toBeCloseTo(-72.8, 9)
    expect(NCERT_UNIT5_PRINTED_CHECKS.some((c) => c.printed.includes('−178.3') && c.kind === 'misprint')).toBe(true)
  })

  it('records the O2 bond enthalpy disagreement (text 428 vs Table 5.3(b) 498)', () => {
    const o2Text = NCERT_UNIT5_WORKED_VALUES.find((v) => v.quantity.includes('bond dissociation enthalpy of O2'))
    expect(o2Text?.value).toBe(428)
    const o2Table = NCERT_TABLE_5_3B_MULTIPLE_BONDS.rows.find((r) => r.a === 'O' && r.b === 'O')
    expect(o2Table?.kJ).toBe(498)
  })
})
