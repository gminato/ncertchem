import { describe, expect, it } from 'vitest'
import {
  NCERT_FIG_4_21_MO_DATA,
  NCERT_NACL_LATTICE_ENTHALPY_KJ,
  NCERT_NACL_STEPS,
  NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS,
  NCERT_TABLE_4_3_MOLECULE_BOND_LENGTHS,
  NCERT_TABLE_4_4_COVALENT_RADII,
  NCERT_TABLE_4_5_DIPOLE_MOMENTS,
  NCERT_TABLE_4_6_NO_LONE_PAIR,
  NCERT_TABLE_4_7_LONE_PAIR_SHAPES,
  NCERT_TABLE_4_8_REASONS,
  NCERT_TEXT_ENTHALPIES,
  NCERT_VS_STANDARD_NOTES,
} from './ncert-unit4-tables'

describe('NCERT Table 4.2 (average bond lengths)', () => {
  it('has twelve printed bonds with the printed lengths', () => {
    const rows = NCERT_TABLE_4_2_AVERAGE_BOND_LENGTHS.rows
    expect(rows).toHaveLength(12)
    expect(rows.find((r) => r.bond === 'C≡C')?.lengthPm).toBe(120)
    expect(rows.find((r) => r.bond === 'C–C')?.lengthPm).toBe(154)
    expect(rows.find((r) => r.bond === 'N=O')?.lengthPm).toBe(122)
  })
})

describe('NCERT Table 4.3 (bond lengths in common molecules)', () => {
  it('has eleven molecules, with the printed values', () => {
    const rows = NCERT_TABLE_4_3_MOLECULE_BOND_LENGTHS.rows
    expect(rows).toHaveLength(11)
    expect(rows.find((r) => r.molecule === 'N2')?.lengthPm).toBe(109)
    expect(rows.find((r) => r.molecule === 'F2')?.lengthPm).toBe(144)
    expect(rows.find((r) => r.molecule === 'HI')?.lengthPm).toBe(160)
  })
})

describe('NCERT Table 4.4 (covalent radii)', () => {
  it('encodes multiple-bond radii for C, N, O and S', () => {
    const rows = NCERT_TABLE_4_4_COVALENT_RADII.rows
    const carbon = rows.filter((r) => r.symbol === 'C').map((r) => [r.bondOrder, r.radiusPm])
    expect(carbon).toEqual([[1, 77], [2, 67], [3, 60]])
    const sulphur = rows.filter((r) => r.symbol === 'S').map((r) => [r.bondOrder, r.radiusPm])
    expect(sulphur).toEqual([[1, 104], [2, 95]])
  })

  it('has one single-bond radius for each of the other printed elements', () => {
    const singles = NCERT_TABLE_4_4_COVALENT_RADII.rows.filter((r) => r.bondOrder === 1)
    expect(singles.map((r) => r.symbol)).toEqual([
      'H', 'C', 'N', 'O', 'F', 'Cl', 'Br', 'I', 'P', 'S', 'As', 'Se', 'Te', 'Sb',
    ])
  })
})

describe('NCERT Table 4.5 (dipole moments)', () => {
  it('has fourteen molecules, with H2 and CO2 at zero', () => {
    const rows = NCERT_TABLE_4_5_DIPOLE_MOMENTS.rows
    expect(rows).toHaveLength(14)
    expect(rows.find((r) => r.molecule === 'H2')?.dipoleD).toBe(0)
    expect(rows.find((r) => r.molecule === 'CO2')?.dipoleD).toBe(0)
    expect(rows.find((r) => r.molecule === 'H2O')?.dipoleD).toBe(1.85)
  })
})

describe('NCERT Tables 4.6 to 4.8 (VSEPR)', () => {
  it('Table 4.6 has the five no-lone-pair rows, 2 to 6 pairs', () => {
    expect(NCERT_TABLE_4_6_NO_LONE_PAIR.rows.map((r) => r.electronPairs)).toEqual([2, 3, 4, 5, 6])
    expect(NCERT_TABLE_4_6_NO_LONE_PAIR.rows[2].anglesDeg).toEqual([109.5])
  })

  it('Table 4.7 has the seven lone-pair rows in printed order', () => {
    const rows = NCERT_TABLE_4_7_LONE_PAIR_SHAPES.rows
    expect(rows.map((r) => r.moleculeType)).toEqual(['AB2E', 'AB3E', 'AB2E2', 'AB4E', 'AB3E2', 'AB5E', 'AB4E2'])
    expect(rows.map((r) => r.examples[0])).toEqual(['SO2', 'NH3', 'H2O', 'SF4', 'ClF3', 'BrF5', 'XeF4'])
  })

  it('Table 4.8 gives the reduced angles NCERT states', () => {
    const angles = NCERT_TABLE_4_8_REASONS.rows.map((r) => r.reasonAngleDeg)
    expect(angles).toEqual([119.5, 107, 104.5, null])
  })
})

describe('NCERT text enthalpies', () => {
  it('quotes the printed bond enthalpies', () => {
    const find = (prefix: string) => NCERT_TEXT_ENTHALPIES.find((q) => q.label.startsWith(prefix))?.value
    expect(find('H–H')).toBe(435.8)
    expect(find('O=O')).toBe(498)
    expect(find('N≡N')).toBe(946)
    expect(find('H–Cl')).toBe(431)
  })

  it('averages the two water O–H steps to 464.5 kJ mol⁻¹, as NCERT does', () => {
    const avg = NCERT_TEXT_ENTHALPIES.find((q) => q.label.startsWith('Average O–H'))?.value
    expect(avg).toBe((502 + 427) / 2)
  })

  it('quotes the NaCl steps and the NaCl lattice enthalpy', () => {
    const ionisation = NCERT_NACL_STEPS[0].value
    const gain = NCERT_NACL_STEPS[1].value
    expect(ionisation + gain).toBeCloseTo(NCERT_NACL_STEPS[2].value, 6)
    expect(NCERT_NACL_LATTICE_ENTHALPY_KJ).toBe(788)
  })
})

describe('NCERT Fig. 4.21 (MO data for B2 to Ne2)', () => {
  it('has six species, B2 through Ne2 in order', () => {
    expect(NCERT_FIG_4_21_MO_DATA.rows.map((r) => r.species)).toEqual(['B2', 'C2', 'N2', 'O2', 'F2', 'Ne2'])
  })

  it('marks the mixed-order species B2, C2 and N2', () => {
    expect(NCERT_FIG_4_21_MO_DATA.rows.filter((r) => r.withMixing).map((r) => r.species)).toEqual(['B2', 'C2', 'N2'])
  })

  it('has no bar and no magnetism for Ne2', () => {
    const ne2 = NCERT_FIG_4_21_MO_DATA.rows.find((r) => r.species === 'Ne2')
    expect(ne2?.bondEnergyKj).toBeNull()
    expect(ne2?.magnetism).toBeNull()
    expect(ne2?.bondOrder).toBe(0)
  })
})

describe('NCERT vs standard notes', () => {
  it('records the N2 bond enthalpy inconsistency and the standard-data disagreements', () => {
    expect(NCERT_VS_STANDARD_NOTES.some((n) => n.includes('945'))).toBe(true)
    expect(NCERT_VS_STANDARD_NOTES.length).toBeGreaterThanOrEqual(5)
  })
})
