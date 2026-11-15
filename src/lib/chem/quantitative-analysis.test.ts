import { describe, expect, it } from 'vitest'
import {
  percentCarbon,
  percentHalogen,
  percentHydrogen,
  percentNitrogenDumas,
  percentNitrogenDumasAtSTP,
  percentNitrogenKjeldahl,
  percentOxygenByDifference,
  percentOxygenFromCO2,
  percentPhosphorusAmmoniumMolybdate,
  percentPhosphorusMgPyrophosphate,
  percentSulphur,
} from './quantitative-analysis'

describe('Liebig method for C and H (NCERT 8.10.1)', () => {
  it('Problem 8.20: 0.246 g gives 0.198 g CO2 and 0.1014 g H2O', () => {
    expect(percentCarbon(0.198, 0.246)).toBeCloseTo(21.95, 1)
    expect(percentHydrogen(0.1014, 0.246)).toBeCloseTo(4.58, 2)
  })
})

describe('Dumas method for N (NCERT 8.10.2)', () => {
  it('nitrogen at STP: %N = 28 V 100 / (22400 m)', () => {
    expect(percentNitrogenDumasAtSTP(41.9, 0.3)).toBeCloseTo(17.46, 1)
  })

  it('Problem 8.21: 50 mL at 300 K and 715 mmHg with aqueous tension 15 mmHg gives 17.46% for 0.3 g', () => {
    const pct = percentNitrogenDumas({
      volumeMl: 50,
      temperatureK: 300,
      pressureMmHg: 715,
      aqueousTensionMmHg: 15,
      sampleMass: 0.3,
    })
    expect(pct).toBeCloseTo(17.46, 1)
  })

  it('rejects a pressure that is not above the aqueous tension', () => {
    expect(() =>
      percentNitrogenDumas({ volumeMl: 50, temperatureK: 300, pressureMmHg: 10, aqueousTensionMmHg: 15, sampleMass: 0.3 }),
    ).toThrow(RangeError)
  })
})

describe('Kjeldahl method for N (NCERT 8.10.2 (ii))', () => {
  it('Problem 8.22: 10 mL of 1 M H2SO4 neutralised by NH3 from 0.5 g gives 56.0%', () => {
    expect(percentNitrogenKjeldahl({ molarity: 1, volumeAcid: 10, volumeAlkali: 0, sampleMass: 0.5 })).toBeCloseTo(56, 6)
  })

  it('equals the moles-of-NH3 route: N = 14 x moles of NH3 absorbed', () => {
    const molarity = 0.5
    const volumeAcid = 50
    const volumeAlkali = 12
    const sample = 0.4
    const molesNH3 = (2 * (volumeAcid - volumeAlkali / 2) * molarity) / 1000
    const viaMoles = (14 * molesNH3 * 100) / sample
    expect(percentNitrogenKjeldahl({ molarity, volumeAcid, volumeAlkali, sampleMass: sample })).toBeCloseTo(viaMoles, 8)
  })
})

describe('Carius method for halogens (NCERT 8.10.3)', () => {
  it('Problem 8.23: 0.15 g gives 0.12 g AgBr, so 34.04% bromine', () => {
    expect(percentHalogen({ massAgX: 0.12, atomicMassX: 80, sampleMass: 0.15 })).toBeCloseTo(34.04, 2)
  })
})

describe('sulphur and phosphorus (NCERT 8.10.4 and 8.10.5)', () => {
  it('Problem 8.24: 0.157 g gives 0.4813 g BaSO4, so 42.10% sulphur', () => {
    expect(percentSulphur(0.4813, 0.157)).toBeCloseTo(42.1, 1)
  })

  it('phosphorus as ammonium phosphomolybdate uses 31 / 1877', () => {
    expect(percentPhosphorusAmmoniumMolybdate(1, 1)).toBeCloseTo((31 * 100) / 1877, 8)
  })

  it('phosphorus as Mg2P2O7 uses 62 / 222', () => {
    expect(percentPhosphorusMgPyrophosphate(1, 1)).toBeCloseTo((62 * 100) / 222, 8)
  })
})

describe('oxygen (NCERT 8.10.6)', () => {
  it('oxygen by difference: 100 minus the other elements', () => {
    expect(percentOxygenByDifference({ C: 21.95, H: 4.58 })).toBeCloseTo(73.47, 2)
  })

  it('oxygen from CO2 mass: 32 m1 100 / (88 m)', () => {
    expect(percentOxygenFromCO2(0.44, 1)).toBeCloseTo((32 * 0.44 * 100) / (88 * 1), 8)
  })

  it('rejects a non-positive sample mass', () => {
    expect(() => percentCarbon(0.198, 0)).toThrow(RangeError)
  })
})
