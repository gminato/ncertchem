import { describe, expect, it } from 'vitest'
import { electronConfiguration } from './quantum'
import {
  PERIODIC_TABLE,
  blockOf,
  elementByZ,
  elementBySymbol,
  groupOf,
  ionizationAnomalies,
  outerConfiguration,
  periodOf,
  slaterZeff,
  tablePosition,
  typicalValence,
  valenceElectrons,
} from './periodic-data'

describe('PERIODIC_TABLE records', () => {
  it('has 118 records with Z = 1..118 in order', () => {
    expect(PERIODIC_TABLE).toHaveLength(118)
    PERIODIC_TABLE.forEach((e, i) => expect(e.Z).toBe(i + 1))
  })

  it('has unique symbols', () => {
    const symbols = new Set(PERIODIC_TABLE.map((e) => e.symbol))
    expect(symbols.size).toBe(118)
  })

  it('takes atomic masses from PubChem (H 1.008, Na 22.99)', () => {
    expect(elementByZ(1).atomicMass).toBe(1.008)
    expect(elementByZ(11).atomicMass).toBeCloseTo(22.99, 2)
  })

  it('uses NCERT spellings for Al, S and Cs', () => {
    expect(elementByZ(13).ncertName).toBe('Aluminium')
    expect(elementByZ(16).ncertName).toBe('Sulphur')
    expect(elementByZ(55).ncertName).toBe('Caesium')
    expect(elementByZ(26).ncertName).toBeUndefined()
  })

  it('converts first ionization energy to kJ mol⁻¹ with 96.485', () => {
    const h = elementByZ(1)
    expect(h.firstIonizationEnergyEv).toBeCloseTo(13.598, 3)
    expect(h.firstIonizationEnergyKjPerMol).toBeCloseTo(13.598 * 96.485, 0)
  })

  it('looks up elements by symbol', () => {
    expect(elementBySymbol('Fe')?.Z).toBe(26)
    expect(elementBySymbol('Xx')).toBeUndefined()
  })

  it('rejects atomic numbers outside 1..118', () => {
    expect(() => elementByZ(0)).toThrow(RangeError)
    expect(() => elementByZ(119)).toThrow(RangeError)
    expect(() => elementByZ(1.5)).toThrow(RangeError)
  })
})

describe('group, period and block (NCERT sections 3.5 and 3.6)', () => {
  it('places Na in group 1, period 3, s-block', () => {
    expect([groupOf(11), periodOf(11), blockOf(11)]).toEqual([1, 3, 's'])
  })

  it('places Fe in group 8, period 4, d-block', () => {
    expect([groupOf(26), periodOf(26), blockOf(26)]).toEqual([8, 4, 'd'])
  })

  it('places H in group 1 and He in group 18, both s-block', () => {
    expect([groupOf(1), blockOf(1)]).toEqual([1, 's'])
    expect([groupOf(2), blockOf(2)]).toEqual([18, 's'])
  })

  it('places Cl in group 17, period 3, p-block and Ar in group 18', () => {
    expect([groupOf(17), periodOf(17), blockOf(17)]).toEqual([17, 3, 'p'])
    expect(groupOf(18)).toBe(18)
  })

  it('places Ce (Z = 58) to Lu (Z = 71) as the lanthanoid f-block row with no group', () => {
    for (let z = 58; z <= 71; z++) {
      expect(groupOf(z)).toBeNull()
      expect(blockOf(z)).toBe('f')
      expect(elementByZ(z).fBlockRow).toBe('lanthanoid')
    }
  })

  it('places Th (Z = 90) to Lr (Z = 103) as the actinoid f-block row', () => {
    for (let z = 90; z <= 103; z++) {
      expect(groupOf(z)).toBeNull()
      expect(elementByZ(z).fBlockRow).toBe('actinoid')
    }
  })

  it('places La and Ac in group 3 as the start of the d-block row (NCERT section 3.6.4)', () => {
    expect([groupOf(57), blockOf(57)]).toEqual([3, 'd'])
    expect([groupOf(89), blockOf(89)]).toEqual([3, 'd'])
  })

  it('matches the Aufbau block of each element for Z = 1..36 (He excepted, as NCERT notes)', () => {
    const rank = (n: number, l: number) => n + l
    const letter = 'spdf'
    for (let z = 1; z <= 36; z++) {
      const subshells = electronConfiguration(z).subshells
      const last = subshells
        .map((s) => ({ n: Number(s.label[0]), l: letter.indexOf(s.label[1]) }))
        .reduce((a, b) => {
          if (rank(b.n, b.l) !== rank(a.n, a.l)) return rank(b.n, b.l) > rank(a.n, a.l) ? b : a
          return b.n > a.n ? b : a
        })
      const expected = z === 2 ? 's' : letter[last.l]
      expect(blockOf(z), `block of Z=${z}`).toBe(expected)
    }
  })

  it('counts 2, 8, 8, 18, 18, 32, 32 elements per period in the table', () => {
    const counts = [1, 2, 3, 4, 5, 6, 7].map((p) => PERIODIC_TABLE.filter((e) => e.period === p).length)
    expect(counts).toEqual([2, 8, 8, 18, 18, 32, 32])
  })
})

describe('tablePosition (long form with detached f-block rows)', () => {
  it('puts H at row 1, column 1 and He at row 1, column 18', () => {
    expect(tablePosition(1)).toEqual({ row: 1, col: 1 })
    expect(tablePosition(2)).toEqual({ row: 1, col: 18 })
  })

  it('puts Fe at row 4, column 8', () => {
    expect(tablePosition(26)).toEqual({ row: 4, col: 8 })
  })

  it('puts Ce at row 9, column 3 and Lu at row 9, column 16', () => {
    expect(tablePosition(58)).toEqual({ row: 9, col: 3 })
    expect(tablePosition(71)).toEqual({ row: 9, col: 16 })
  })

  it('puts Th at row 10, column 3 and Lr at row 10, column 16', () => {
    expect(tablePosition(90)).toEqual({ row: 10, col: 3 })
    expect(tablePosition(103)).toEqual({ row: 10, col: 16 })
  })

  it('puts Og at row 7, column 18', () => {
    expect(tablePosition(118)).toEqual({ row: 7, col: 18 })
  })
})

describe('valence (NCERT section 3.7.2(a), Table 3.9)', () => {
  it('gives the number of valence electrons of representative elements', () => {
    expect(valenceElectrons(11)).toBe(1)
    expect(valenceElectrons(13)).toBe(3)
    expect(valenceElectrons(17)).toBe(7)
    expect(valenceElectrons(18)).toBe(8)
    expect(valenceElectrons(2)).toBe(2)
  })

  it('returns null valence electrons for d- and f-block elements', () => {
    expect(valenceElectrons(26)).toBeNull()
    expect(valenceElectrons(58)).toBeNull()
  })

  it('gives typical valences as NCERT Table 3.9 does', () => {
    expect(typicalValence(1)).toEqual([1])
    expect(typicalValence(6)).toEqual([4])
    expect(typicalValence(7)).toEqual([3, 5])
    expect(typicalValence(8)).toEqual([2, 6])
    expect(typicalValence(9)).toEqual([1, 7])
    expect(typicalValence(13)).toEqual([3])
    expect(typicalValence(18)).toEqual([0, 8])
    expect(typicalValence(2)).toEqual([0])
    expect(typicalValence(26)).toEqual([])
  })

  it('writes outer configurations for representative elements', () => {
    expect(outerConfiguration(1)).toBe('1s¹')
    expect(outerConfiguration(2)).toBe('1s²')
    expect(outerConfiguration(11)).toBe('3s¹')
    expect(outerConfiguration(17)).toBe('3s²3p⁵')
    expect(outerConfiguration(18)).toBe('3s²3p⁶')
    expect(outerConfiguration(26)).toBeNull()
  })
})

describe('slaterZeff (Slater 1930 estimate, Z <= 36)', () => {
  it('matches textbook Slater values for Na, K, Mg, Cl and C', () => {
    expect(slaterZeff(11)).toBeCloseTo(2.2, 2)
    expect(slaterZeff(19)).toBeCloseTo(2.2, 2)
    expect(slaterZeff(12)).toBeCloseTo(2.85, 2)
    expect(slaterZeff(17)).toBeCloseTo(6.1, 2)
    expect(slaterZeff(6)).toBeCloseTo(3.25, 2)
  })

  it('gives 1.70 for He', () => {
    expect(slaterZeff(2)).toBeCloseTo(1.7, 2)
  })

  it('rejects Z outside 1..36', () => {
    expect(() => slaterZeff(37)).toThrow(RangeError)
    expect(() => slaterZeff(0)).toThrow(RangeError)
  })
})

describe('ionizationAnomalies (NCERT section 3.7.1(c))', () => {
  it('finds Be to B and N to O dips in period 2 with their reasons', () => {
    expect(ionizationAnomalies(2)).toEqual([
      { from: 4, to: 5, reason: 'p-electron-shielded' },
      { from: 7, to: 8, reason: 'paired-electron-repulsion' },
    ])
  })

  it('finds Mg to Al and P to S dips in period 3 with their reasons', () => {
    expect(ionizationAnomalies(3)).toEqual([
      { from: 12, to: 13, reason: 'p-electron-shielded' },
      { from: 15, to: 16, reason: 'paired-electron-repulsion' },
    ])
  })

  it('agrees with the PubChem values IE(B) < IE(Be) and IE(O) < IE(N)', () => {
    expect(elementByZ(5).firstIonizationEnergyKjPerMol!).toBeLessThan(elementByZ(4).firstIonizationEnergyKjPerMol!)
    expect(elementByZ(8).firstIonizationEnergyKjPerMol!).toBeLessThan(elementByZ(7).firstIonizationEnergyKjPerMol!)
  })

  it('rejects periods outside 1..7', () => {
    expect(() => ionizationAnomalies(0)).toThrow(RangeError)
    expect(() => ionizationAnomalies(8)).toThrow(RangeError)
  })
})
