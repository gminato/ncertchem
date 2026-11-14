import { describe, expect, it } from 'vitest'
import { elementBySymbol, elementByZ } from './periodic-data'
import {
  NCERT_ANOMALOUS_PROPERTIES_RADII,
  NCERT_IONIC_RADII_IN_TEXT,
  NCERT_PROBLEM_3_6_AL_PREDICTED_KJ_PER_MOL,
  NCERT_PROBLEM_3_6_IONIZATION_ENTHALPIES,
  NCERT_TABLE_3_1_TRIADS,
  NCERT_TABLE_3_2_OCTAVES,
  NCERT_TABLE_3_3_MENDELEEV,
  NCERT_TABLE_3_4_ROOTS,
  NCERT_TABLE_3_5_Z101_118,
  NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS,
  NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY,
  NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY,
  NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS,
  NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY,
  NCERT_TABLE_3_9_VALENCE_TRENDS,
  triadMean,
} from './ncert-unit3-tables'

describe('NCERT Table 3.1 (Döbereiner triads)', () => {
  it('has three triads with the printed middle weights', () => {
    expect(NCERT_TABLE_3_1_TRIADS.rows).toHaveLength(3)
    expect(NCERT_TABLE_3_1_TRIADS.rows.map((r) => r.middle.symbol)).toEqual(['Na', 'Sr', 'Br'])
  })

  it('computes the mean of the outer two weights, which Döbereiner compared with the middle one', () => {
    const [lithium, calcium, chlorine] = NCERT_TABLE_3_1_TRIADS.rows
    expect(triadMean(lithium)).toBe(23)
    expect(triadMean(calcium)).toBe(88.5)
    expect(triadMean(chlorine)).toBe(81.25)
  })
})

describe('NCERT Table 3.2 (Newlands octaves)', () => {
  it('has the three printed rows of 7, 7 and 2 elements', () => {
    expect(NCERT_TABLE_3_2_OCTAVES.rows.map((row) => row.length)).toEqual([7, 7, 2])
  })
})

describe('NCERT Table 3.3 (Mendeleev predictions)', () => {
  it('has five property rows', () => {
    expect(NCERT_TABLE_3_3_MENDELEEV.rows).toHaveLength(5)
  })
})

describe('NCERT Table 3.4 (IUPAC roots)', () => {
  it('has the roots for digits 0 to 9 in order', () => {
    expect(NCERT_TABLE_3_4_ROOTS.rows.map((r) => r.digit)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    expect(NCERT_TABLE_3_4_ROOTS.rows.map((r) => r.root)).toEqual([
      'nil', 'un', 'bi', 'tri', 'quad', 'pent', 'hex', 'sept', 'oct', 'enn',
    ])
  })
})

describe('NCERT Table 3.5 (Z = 101 to 118)', () => {
  it('has 18 rows, Z = 101 to 118', () => {
    expect(NCERT_TABLE_3_5_Z101_118.rows).toHaveLength(18)
    expect(NCERT_TABLE_3_5_Z101_118.rows.map((r) => r.Z)).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 101),
    )
  })

  it('gives official symbols that match the PubChem element with the same Z', () => {
    for (const row of NCERT_TABLE_3_5_Z101_118.rows) {
      expect(elementByZ(row.Z).symbol, `symbol of Z=${row.Z}`).toBe(row.officialSymbol)
    }
  })

  it('gives official names that match PubChem, except the printed spelling of Z = 111', () => {
    for (const row of NCERT_TABLE_3_5_Z101_118.rows) {
      if (row.Z === 111) {
        // NCERT prints "Rontgenium"; PubChem spells it "Roentgenium".
        expect(elementByZ(row.Z).name).toBe('Roentgenium')
        continue
      }
      expect(elementByZ(row.Z).name, `name of Z=${row.Z}`).toBe(row.officialName)
    }
  })
})

describe('NCERT Table 3.6(a) and 3.6(b) (atomic radii, pm)', () => {
  it('has 14 entries across periods 2 and 3, and 10 down groups 1 and 17', () => {
    expect(NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS.rows).toHaveLength(14)
    expect(NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY.rows).toHaveLength(10)
  })

  it('prints Li and Na with the same radius in both tables (152 and 186 pm)', () => {
    const a = NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS.rows
    const b = NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY.rows
    expect(a.find((r) => r.symbol === 'Li')?.value).toBe(152)
    expect(b.find((r) => r.symbol === 'Li')?.value).toBe(152)
    expect(a.find((r) => r.symbol === 'Na')?.value).toBe(186)
    expect(b.find((r) => r.symbol === 'Na')?.value).toBe(186)
  })
})

describe('NCERT anomalous-properties radii and text radii', () => {
  it('has four metallic/ionic rows and two ionic radii from the text', () => {
    expect(NCERT_ANOMALOUS_PROPERTIES_RADII.rows).toHaveLength(4)
    expect(NCERT_IONIC_RADII_IN_TEXT.rows.map((r) => r.radiusPm)).toEqual([136, 95])
  })
})

describe('NCERT Table 3.7 (electron gain enthalpy, kJ mol⁻¹)', () => {
  it('has 22 rows across groups 1, 16, 17 and 18', () => {
    expect(NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY.rows).toHaveLength(22)
  })

  it('prints the most negative value for Cl (-349) and a positive one for He (+48)', () => {
    const rows = NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY.rows
    expect(rows.find((r) => r.symbol === 'Cl')?.value).toBe(-349)
    expect(rows.find((r) => r.symbol === 'He')?.value).toBe(48)
  })
})

describe('NCERT Table 3.8(a) and 3.8(b) (electronegativity, Pauling)', () => {
  it('has 14 entries across periods 2 and 3, and 10 down groups 1 and 17', () => {
    expect(NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS.rows).toHaveLength(14)
    expect(NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY.rows).toHaveLength(10)
  })
})

describe('NCERT Table 3.9 (valence trends)', () => {
  it('has seven group columns, 1, 2, 13 to 17', () => {
    expect(NCERT_TABLE_3_9_VALENCE_TRENDS.rows.map((r) => r.group)).toEqual([1, 2, 13, 14, 15, 16, 17])
  })
})

describe('NCERT Problem 3.6 (ionization enthalpies)', () => {
  it('prints 496, 737 and 786 kJ mol⁻¹ and the predicted Al value 575', () => {
    expect(NCERT_PROBLEM_3_6_IONIZATION_ENTHALPIES.rows.map((r) => r.value)).toEqual([496, 737, 786])
    expect(NCERT_PROBLEM_3_6_AL_PREDICTED_KJ_PER_MOL).toBe(575)
  })
})

describe('every symbol in the NCERT tables resolves to a PubChem element', () => {
  const symbolLists: string[][] = [
    NCERT_TABLE_3_6A_RADII_ACROSS_PERIODS.rows.map((r) => r.symbol),
    NCERT_TABLE_3_6B_RADII_DOWN_A_FAMILY.rows.map((r) => r.symbol),
    NCERT_TABLE_3_7_ELECTRON_GAIN_ENTHALPY.rows.map((r) => r.symbol),
    NCERT_TABLE_3_8A_ELECTRONEGATIVITY_ACROSS_PERIODS.rows.map((r) => r.symbol),
    NCERT_TABLE_3_8B_ELECTRONEGATIVITY_DOWN_A_FAMILY.rows.map((r) => r.symbol),
    NCERT_ANOMALOUS_PROPERTIES_RADII.rows.map((r) => r.symbol),
    NCERT_IONIC_RADII_IN_TEXT.rows.map((r) => r.symbol),
    NCERT_PROBLEM_3_6_IONIZATION_ENTHALPIES.rows.map((r) => r.symbol),
  ]
  it.each(symbolLists.flat().map((s) => [s]))('resolves %s', (symbol) => {
    expect(elementBySymbol(symbol)).toBeDefined()
  })
})
