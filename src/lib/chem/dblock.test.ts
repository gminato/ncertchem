import { describe, expect, it } from 'vitest'
import * as T from './ncert-c12-unit4-tables'
import {
  COLOUR_WHEEL,
  D_BLOCK_SERIES,
  INDUSTRIAL_CATALYSTS,
  ION_COLOUR_KEYS,
  OXIDANT_HALF_EQUATIONS,
  actinoidOxidationStates,
  actinoidRadii,
  aquaIonColour,
  balanceCheck,
  complementaryColour,
  dBlockPhysical,
  dBlockSeries,
  dElectronCount,
  electrodeCycle,
  eStandardM2,
  eStandardM3M2,
  electronsTransferred,
  exampleSpecies,
  exchangePairs,
  formatKj,
  formatMoment,
  formatPm,
  formatVolt,
  fCount,
  ionConfig,
  isColourlessByConfig,
  isTransitionElement,
  lanthanoidRadii,
  liberatesH2FromDiluteAcid,
  oxidationStateCount,
  oxidationStates,
  outerConfig,
  parseEquation,
  specialLanthanoidStates,
  spinOnlyMoment,
  titrationMoles,
  titrationRatio,
  unknownFe2Molarity,
  unpairedElectrons,
  halideKeyText,
} from './dblock'

describe('series and transition-element verdicts', () => {
  it('lists each d-block series from Table 4.1', () => {
    expect(D_BLOCK_SERIES['3d']).toEqual(['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'])
    expect(dBlockSeries('4d')[0]).toBe('Y')
    const total = (['3d', '4d', '5d', '6d'] as const).reduce((n, s) => n + dBlockSeries(s).length, 0)
    expect(total).toBe(T.NCERT_OUTER_CONFIGURATIONS.length)
  })

  it('applies the IUPAC definition to atoms and common ions', () => {
    expect(isTransitionElement('Sc').verdict).toBe(true)
    expect(isTransitionElement('Cu').verdict).toBe(true)
    expect(isTransitionElement('Pd').verdict).toBe(true)
    expect(isTransitionElement('Zn')).toMatchObject({ verdict: false })
    expect(isTransitionElement('Zn').reason).toMatch(/full or empty d subshell/)
    expect(isTransitionElement('Ca').verdict).toBe(false)
    expect(isTransitionElement('La').verdict).toBe(true)
  })

  it('throws for an unknown symbol', () => {
    expect(() => isTransitionElement('Xx')).toThrow(RangeError)
  })
})

describe('configurations', () => {
  it('gives the Table 4.1 display with superscripts', () => {
    expect(outerConfig('Cr').display).toBe('3d⁵4s¹')
    expect(outerConfig('Pd').display).toBe('4d¹⁰')
  })

  it('removes ns electrons before (n−1)d for ions', () => {
    expect(ionConfig('Fe', 2).display).toBe('[Ar] 3d⁶')
    expect(ionConfig('Cr', 3).display).toBe('[Ar] 3d³')
    expect(ionConfig('Mn', 2).display).toBe('[Ar] 3d⁵')
    expect(ionConfig('Mn', 7).display).toBe('[Ar]')
    expect(ionConfig('Pd', 2).display).toBe('[Kr] 4d⁸')
    expect(ionConfig('Cr', 0).display).toBe('[Ar] 3d⁵4s¹')
  })

  it('counts d electrons in atoms and ions', () => {
    expect(dElectronCount('Cr')).toBe(5)
    expect(dElectronCount('Ti', 3)).toBe(1)
    expect(dElectronCount('Cu', 2)).toBe(9)
    expect(dElectronCount('Zn', 2)).toBe(10)
    expect(dElectronCount('Pd', 2)).toBe(8)
  })

  it('agrees with the printed Table 4.2 ion configurations for the 3d series', () => {
    for (const row of T.NCERT_FIRST_SERIES_PROPERTIES) {
      if (row.configM2Plus !== null) {
        expect(dElectronCount(row.symbol, 2)).toBe(row.configM2Plus.terms.find((t) => t.subshell === '3d')!.electrons)
      }
    }
  })

  it('rejects charges larger than the electrons available', () => {
    expect(() => ionConfig('Sc', 4)).toThrow(RangeError)
  })
})

describe('spin and moments', () => {
  it('counts unpaired electrons in the high-spin octahedral case', () => {
    expect(unpairedElectrons(6)).toBe(4)
    expect(unpairedElectrons(5)).toBe(5)
    expect(unpairedElectrons(8)).toBe(2)
    expect(unpairedElectrons(0)).toBe(0)
    expect(unpairedElectrons(5, 'low')).toBe(1)
    expect(unpairedElectrons(6, 'low')).toBe(0)
  })

  it('matches Table 4.7 unpaired counts and computed moments (2.83, not 2.84)', () => {
    for (const row of T.NCERT_MAGNETIC_MOMENTS) {
      expect(unpairedElectrons(row.dCount)).toBe(row.unpaired)
      expect(Math.abs(spinOnlyMoment(row.unpaired) - row.calculatedBm)).toBeLessThan(0.02)
    }
    expect(formatMoment(spinOnlyMoment(2))).toBe('2.83')
    expect(formatMoment(spinOnlyMoment(3))).toBe('3.87')
  })

  it('counts exchange pairs', () => {
    expect(exchangePairs(0)).toBe(0)
    expect(exchangePairs(4)).toBe(6)
  })
})

describe('oxidation states and species', () => {
  it('reads Table 4.3 with common states flagged', () => {
    expect(oxidationStateCount('Mn')).toBe(6)
    expect(oxidationStates('Mn').find((s) => s.state === 7)?.common).toBe(true)
    expect(oxidationStates('Mn').find((s) => s.state === 3)?.common).toBe(false)
    expect(() => oxidationStates('Ce')).toThrow(RangeError)
  })

  it('gives example species that NCERT prints', () => {
    const mn7 = exampleSpecies('Mn', 7)
    expect(mn7.oxides.map((o) => o.formula)).toContain('Mn₂O₇')
    const ti4 = exampleSpecies('Ti', 4)
    expect(ti4.oxides.map((o) => o.formula)).toContain('TiO₂')
    expect(ti4.halides.map((h) => h.formula)).toContain('TiX₄')
    expect(halideKeyText('XIII')).toBe('Cl, I')
  })
})

describe('E° energy cycle and potentials', () => {
  it('uses Table 4.4 for the cycle', () => {
    const ti = electrodeCycle('Ti')
    expect(ti).toMatchObject({ atomisation: 469, ie1PlusIe2: 1965, hydration: -1866, sum: 568, eStandard: -1.63 })
    expect(electrodeCycle('Zn').sum).toBe(130 + 906 + 1734 - 2059)
    expect(() => electrodeCycle('Sc')).toThrow(RangeError)
  })

  it('reads Table 4.2 potentials and the H₂ rule', () => {
    expect(eStandardM2('Cu')).toBe(0.34)
    expect(eStandardM3M2('Mn')).toBe(1.57)
    expect(liberatesH2FromDiluteAcid('Ti')).toBe(true)
    expect(liberatesH2FromDiluteAcid('Cu')).toBe(false)
    expect(liberatesH2FromDiluteAcid('Sc')).toBeNull()
  })
})

describe('colours', () => {
  it('maps aqua ions to vocab keys', () => {
    expect(aquaIonColour('Ti³⁺')).toEqual({ ion: 'Ti³⁺', colour: 'purple', printed: 'purple', key: 'ti3' })
    expect(aquaIonColour('Cu2+')?.key).toBe('cu2')
    expect(aquaIonColour('Zn²⁺')?.key).toBe('colourless')
    expect(aquaIonColour('Ti⁵⁺')).toBeNull()
  })

  it('uses blue for Co³⁺ and pink for Co²⁺ (R7), keeping the printed text', () => {
    expect(aquaIonColour('Co³⁺')).toMatchObject({ colour: 'blue', printed: 'bluepink', key: 'co3' })
    expect(aquaIonColour('Co²⁺')).toMatchObject({ colour: 'pink', printed: 'bluepink', key: 'co2' })
  })

  it('pins the vocab key list', () => {
    expect([...ION_COLOUR_KEYS]).toEqual([
      'ti3', 'v4', 'v3', 'v2', 'cr3', 'cr2', 'mn3', 'mn2', 'fe3', 'fe2', 'co3', 'co2', 'ni2', 'cu2',
      'colourless', 'cro4', 'cr2o7', 'mno4', 'mno4-2', 'mno2',
    ])
  })

  it('takes complements on the six-sector wheel', () => {
    expect([...COLOUR_WHEEL]).toEqual(['red', 'orange', 'yellow', 'green', 'blue', 'violet'])
    expect(complementaryColour('red')).toBe('green')
    expect(complementaryColour('orange')).toBe('blue')
    expect(complementaryColour('yellow')).toBe('violet')
    expect(complementaryColour('violet')).toBe('yellow')
  })

  it('flags colourless d⁰ and d¹⁰ ions', () => {
    expect(isColourlessByConfig(0)).toBe(true)
    expect(isColourlessByConfig(10)).toBe(true)
    expect(isColourlessByConfig(5)).toBe(false)
  })
})

describe('redox and titration', () => {
  it('balances every printed equation in atoms and charge', () => {
    for (const eq of [...T.NCERT_OXIDANT_EQUATIONS, ...T.NCERT_CATALYSIS_EQUATIONS]) {
      const report = balanceCheck(eq.equation)
      expect(report.balanced, eq.id).toBe(true)
    }
  })

  it('catches atom and charge errors', () => {
    expect(balanceCheck('H₂ + O₂ → H₂O').atomsBalanced).toBe(false)
    expect(balanceCheck('Cr₂O₇²⁻ + 14H⁺ + 5e⁻ → 2Cr³⁺ + 7H₂O').chargeBalanced).toBe(false)
  })

  it('reads electrons transferred from the half-equations', () => {
    expect(OXIDANT_HALF_EQUATIONS.dichromateAcid.electrons).toBe(6)
    expect(OXIDANT_HALF_EQUATIONS.permanganateAcid.electrons).toBe(5)
    expect(OXIDANT_HALF_EQUATIONS.dichromateAcid.eVolt).toBe(1.33)
    expect(electronsTransferred('MnO₄⁻ + e⁻ → MnO₄²⁻')).toBe(1)
  })

  it('reads the Fe²⁺ : oxidant ratio (5 and 6) and computes concentrations', () => {
    expect(titrationRatio('MnO4-').fe2PerOxidant).toBe(5)
    expect(titrationRatio('Cr2O7 2-').fe2PerOxidant).toBe(6)
    expect(titrationMoles({ oxidant: 'MnO4-', oxidantMolarity: 0.02, oxidantVolumeMl: 10 }).fe2Mol).toBeCloseTo(0.001)
    expect(unknownFe2Molarity({ oxidant: 'MnO4-', oxidantMolarity: 0.02, oxidantVolumeMl: 10, fe2VolumeMl: 25 })).toBeCloseTo(0.04)
    expect(unknownFe2Molarity({ oxidant: 'Cr2O7 2-', oxidantMolarity: 0.01, oxidantVolumeMl: 10, fe2VolumeMl: 20 })).toBeCloseTo(0.03)
  })

  it('parses a printed equation into structured terms', () => {
    const eq = parseEquation('Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O')
    expect(eq.reactants[0]).toEqual({ coefficient: 1, formula: 'Cr2O7', charge: -2 })
    expect(eq.products[0]).toEqual({ coefficient: 2, formula: 'Cr', charge: 3 })
  })
})

describe('lanthanoids and actinoids', () => {
  it('lists Ln³⁺ radii and actinoid radii where printed', () => {
    expect(lanthanoidRadii().length).toBe(T.NCERT_LANTHANOIDS.filter((r) => r.radiusLn3PlusPm !== null).length)
    expect(actinoidRadii().length).toBeGreaterThan(0)
  })

  it('gives f counts equal to Z − 57 for Ln³⁺', () => {
    for (const row of T.NCERT_LANTHANOIDS) {
      if (row.ln3Plus !== null) expect(fCount(row.symbol, 3)).toBe(row.Z - 57)
    }
    expect(fCount('Ce', 4)).toBe(0)
    expect(fCount('Eu', 2)).toBe(7)
  })

  it('lists the four special Ln states', () => {
    const states = specialLanthanoidStates()
    expect(states.map((s) => s.ion)).toEqual(['Ce⁴⁺', 'Eu²⁺', 'Yb²⁺', 'Tb⁴⁺'])
    expect(states.map((s) => s.fCount)).toEqual([0, 7, 14, 7])
  })

  it('returns actinoid oxidation states from Table 4.11', () => {
    expect([...actinoidOxidationStates('U')]).toEqual([3, 4, 5, 6])
    expect(() => actinoidOxidationStates('Xx')).toThrow(RangeError)
  })
})

describe('industrial catalysts', () => {
  it('gives balanced overall equations and the ETHENE Wacker entry', () => {
    for (const c of INDUSTRIAL_CATALYSTS) {
      if (c.overall !== null) expect(balanceCheck(c.overall).balanced, c.process).toBe(true)
    }
    const wacker = INDUSTRIAL_CATALYSTS.find((c) => c.process === 'Wacker process')!
    expect(wacker.overallText).toContain('C₂H₄')
    expect(wacker.overallText).not.toContain('C₂H₂')
  })
})

describe('physical data', () => {
  it('uses NCERT Table 4.2 density where printed and PubChem otherwise', () => {
    expect(dBlockPhysical('Sc').density).toEqual({ value: 3.43, source: 'NCERT Table 4.2' })
    expect(dBlockPhysical('Fe').density.source).toBe('NCERT Table 4.2')
    const fe = dBlockPhysical('Zr')
    expect(fe.density.source).toBe('PubChem')
    expect(dBlockPhysical('Fe').meltingPointK).toEqual({ value: 1811, source: 'PubChem' })
    expect(fe.meltingPointK.source).toBe('PubChem')
    expect(dBlockPhysical('Fe').boilingPointK).toEqual({ value: 3134, source: 'PubChem' })
  })

  it('formats pm, kJ mol⁻¹ and volts with true minus signs', () => {
    expect(formatPm(160)).toBe('160 pm')
    expect(formatKj(-1866)).toBe('−1866 kJ mol⁻¹')
    expect(formatVolt(-0.44)).toBe('−0.44 V')
    expect(formatVolt(0.34)).toBe('+0.34 V')
  })
})
