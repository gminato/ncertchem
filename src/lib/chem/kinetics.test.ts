import { describe, expect, it } from 'vitest'
import {
  GAS_CONSTANT_J,
  activationEnergyFromTwo,
  averageRate,
  backwardBarrier,
  catalystRateEnhancement,
  collisionRate,
  deduceOrders,
  erfc,
  fractionAboveEa,
  fractionRemainingAfterHalfLives,
  firstOrderConc,
  firstOrderHalfLife,
  firstOrderK,
  firstOrderKFromPressure,
  firstOrderRate,
  firstOrderTangentSlope,
  formatSci,
  formatSig,
  kAtT2,
  arrheniusK,
  lnKLine,
  log10Ratio,
  lnConc,
  mbCurve,
  mbEnergyDensity,
  mbFractionAbove,
  mbMostProbableEnergy,
  mulberry32,
  orderFromTwoRuns,
  orderFromUnits,
  overallOrder,
  partialPressureA,
  preExponentialFrom,
  rateConstantFromRun,
  rateConstantUnits,
  rateFromLaw,
  rateRatioForRise,
  reactionRateToSpeciesRate,
  secantSlope,
  speciesRateToReactionRate,
  tangentSlope,
  timeToFraction,
  twoStepSeries,
  zeroOrderConc,
  zeroOrderHalfLife,
  zeroOrderK,
  zeroOrderTangentSlope,
  zeroOrderTimeToZero,
  jPerMolToKJPerMol,
  kJPerMolToJPerMol,
} from './kinetics'
import { NCERT_BUTYL_CHLORIDE, NCERT_NO_O2_INITIAL_RATES } from './ncert-c12-unit3-tables'

describe('constants', () => {
  it('uses NCERT gas constant', () => {
    expect(GAS_CONSTANT_J).toBe(8.314)
  })
})

describe('rates', () => {
  it('averageRate uses the chord between two points, positive for a falling reactant', () => {
    // Table 3.1 interval 0 to 50 s: (0.100 - 0.0905) / 50 = 1.9e-4
    expect(averageRate(0.1, 0.0905, 0, 50)).toBeCloseTo(1.9e-4, 12)
    expect(averageRate(0.0905, 0.1, 0, 50, 'product')).toBeCloseTo(1.9e-4, 12)
  })

  it('averageRate throws when the sign is wrong or the time is not increasing', () => {
    expect(() => averageRate(0.1, 0.2, 0, 50)).toThrow(RangeError)
    expect(() => averageRate(0.1, 0.2, 50, 0)).toThrow(RangeError)
    expect(() => averageRate(-0.1, 0.2, 0, 50)).toThrow(RangeError)
  })

  it('converts species rates to reaction rates with stoichiometry', () => {
    // A → 3B with d[B]/dt = 0.6: rate = 0.6/3 = 0.2, and d[A]/dt = -0.2
    expect(speciesRateToReactionRate(0.6, 3, 'product')).toBeCloseTo(0.2, 12)
    expect(speciesRateToReactionRate(-0.2, 1, 'reactant')).toBeCloseTo(0.2, 12)
    expect(reactionRateToSpeciesRate(0.2, 2, 'reactant')).toBeCloseTo(-0.4, 12)
    expect(reactionRateToSpeciesRate(0.2, 3, 'product')).toBeCloseTo(0.6, 12)
    expect(() => speciesRateToReactionRate(0.1, 0)).toThrow(RangeError)
  })

  it('secant and tangent slopes agree with a known curve', () => {
    const f = (t: number) => t * t
    expect(secantSlope(f, 1, 3)).toBeCloseTo(4, 12)
    expect(tangentSlope(f, 2)).toBeCloseTo(4, 6)
    expect(() => secantSlope(f, 1, 1)).toThrow(RangeError)
  })

  it('exact tangent slopes for zero and first order curves', () => {
    expect(zeroOrderTangentSlope(0.25)).toBe(-0.25)
    const R0 = 0.8
    const k = 0.05
    const t = 12
    const exact = -k * firstOrderConc(R0, k, t)
    expect(firstOrderTangentSlope(R0, k, t)).toBeCloseTo(exact, 15)
    expect(tangentSlope((x) => firstOrderConc(R0, k, x), t)).toBeCloseTo(exact, 6)
    expect(firstOrderRate(R0, k, t)).toBeCloseTo(k * firstOrderConc(R0, k, t), 15)
  })
})

describe('rate laws', () => {
  it('rateFromLaw multiplies powers and handles zero concentrations', () => {
    expect(rateFromLaw(2, { A: 3, B: 4 }, { A: 2, B: 1 })).toBeCloseTo(72, 12)
    expect(rateFromLaw(2, { A: 0, B: 4 }, { A: 0, B: 1 })).toBeCloseTo(8, 12)
    expect(rateFromLaw(2, { A: 0, B: 4 }, { A: 1, B: 1 })).toBe(0)
    expect(() => rateFromLaw(2, { A: 0, B: 4 }, { A: -1, B: 1 })).toThrow(RangeError)
    expect(() => rateFromLaw(2, { B: 4 }, { A: 1 })).toThrow(RangeError)
    expect(() => rateFromLaw(-1, { A: 1 }, { A: 1 })).toThrow(RangeError)
  })

  it('overallOrder sums exponents including fractions and negatives', () => {
    expect(overallOrder({ A: 0.5, B: 1.5 })).toBe(2)
    expect(overallOrder({ A: 1.5, B: -1 })).toBeCloseTo(0.5, 12)
    expect(overallOrder({ H2O: 0 })).toBe(0)
  })

  it('orderFromTwoRuns gives exact orders from doubled concentrations', () => {
    expect(orderFromTwoRuns(1, 1, 2, 4)).toBeCloseTo(2, 12)
    expect(orderFromTwoRuns(1, 1, 2, Math.sqrt(2))).toBeCloseTo(0.5, 12)
    expect(() => orderFromTwoRuns(1, 1, 1, 2)).toThrow(RangeError)
    expect(() => orderFromTwoRuns(0, 1, 2, 2)).toThrow(RangeError)
  })

  it('deduceOrders recovers {NO: 2, O2: 1} from Table 3.2', () => {
    const experiments = NCERT_NO_O2_INITIAL_RATES.map((row) => ({
      concs: { NO: row.noMolPerL, O2: row.o2MolPerL },
      rate: row.initialRate,
    }))
    const orders = deduceOrders(experiments)
    expect(orders.NO.rounded).toBe(2)
    expect(orders.O2.rounded).toBe(1)
    expect(orders.NO.raw).toBeCloseTo(2, 9)
    expect(orders.O2.raw).toBeCloseTo(1, 9)
  })

  it('deduceOrders rounds raw orders to the nearest half', () => {
    const experiments = [
      { concs: { A: 1, B: 1 }, rate: 1 },
      { concs: { A: 2, B: 1 }, rate: Math.pow(2, 0.5) },
      { concs: { A: 1, B: 2 }, rate: Math.pow(2, 1.7) },
    ]
    const orders = deduceOrders(experiments)
    expect(orders.A.rounded).toBe(0.5)
    expect(orders.B.rounded).toBe(1.5)
    expect(() => deduceOrders([{ concs: { A: 1, B: 1 }, rate: 1 }])).toThrow(RangeError)
  })

  it('rateConstantFromRun divides the rate by the concentration product', () => {
    const k = rateConstantFromRun(0.384, { NO: 0.6, O2: 0.3 }, { NO: 2, O2: 1 })
    expect(k).toBeCloseTo(3.5556, 3)
  })
})

describe('units of k', () => {
  it('gives the units for orders 0, 1, 2 and ½', () => {
    expect(rateConstantUnits(0).text).toBe('mol L⁻¹ s⁻¹')
    expect(rateConstantUnits(1).text).toBe('s⁻¹')
    expect(rateConstantUnits(2).text).toBe('mol⁻¹ L s⁻¹')
    expect(rateConstantUnits(3).text).toBe('mol⁻² L² s⁻¹')
    expect(rateConstantUnits(0.5).text).toBe('mol^(1/2) L^(−1/2) s⁻¹')
  })

  it('returns structured parts with rational exponents', () => {
    const parts = rateConstantUnits(0.5).parts
    expect(parts).toEqual([
      { symbol: 'mol', exponent: { numerator: 1, denominator: 2 } },
      { symbol: 'L', exponent: { numerator: -1, denominator: 2 } },
      { symbol: 's', exponent: { numerator: -1, denominator: 1 } },
    ])
  })

  it('orderFromUnits inverts rateConstantUnits and rejects other units', () => {
    for (const n of [0, 0.5, 1, 1.5, 2, 3]) {
      expect(orderFromUnits(rateConstantUnits(n).parts)).toBeCloseTo(n, 12)
    }
    expect(() =>
      orderFromUnits([{ symbol: 'mol', exponent: { numerator: 1, denominator: 1 } }]),
    ).toThrow(RangeError)
  })

  it('rateConstantUnits throws for an order with no small denominator', () => {
    expect(() => rateConstantUnits(0.123456)).toThrow(RangeError)
  })
})

describe('zero order', () => {
  it('concentration falls linearly and never goes below zero', () => {
    expect(zeroOrderConc(0.1, 0.01, 0)).toBeCloseTo(0.1, 12)
    expect(zeroOrderConc(0.1, 0.01, 5)).toBeCloseTo(0.05, 12)
    expect(zeroOrderConc(0.1, 0.01, 100)).toBe(0)
    expect(zeroOrderConc(0.1, 0, 100)).toBeCloseTo(0.1, 12)
    expect(() => zeroOrderConc(-0.1, 0.01, 5)).toThrow(RangeError)
  })

  it('k from two points and half-life identities', () => {
    expect(zeroOrderK(0.1, 0.05, 5)).toBeCloseTo(0.01, 12)
    expect(zeroOrderHalfLife(0.1, 0.01)).toBeCloseTo(5, 12)
    expect(zeroOrderTimeToZero(0.1, 0.01)).toBeCloseTo(10, 12)
    expect(() => zeroOrderK(0.1, 0.05, 0)).toThrow(RangeError)
    expect(() => zeroOrderHalfLife(0.1, 0)).toThrow(RangeError)
  })

  it('zero order half-life doubles when [R]0 doubles', () => {
    const k = 0.02
    expect(zeroOrderHalfLife(0.2, k)).toBeCloseTo(2 * zeroOrderHalfLife(0.1, k), 12)
  })
})

describe('first order', () => {
  it('concentration at the half-life is half the start', () => {
    const k = 0.07
    const tHalf = firstOrderHalfLife(k)
    expect(firstOrderConc(0.9, k, tHalf)).toBeCloseTo(0.45, 12)
    expect(firstOrderConc(0.9, k, 0)).toBeCloseTo(0.9, 12)
  })

  it('first order half-life does not depend on [R]0', () => {
    const k = 0.07
    const tHalf = firstOrderHalfLife(k)
    expect(firstOrderConc(5, k, tHalf) / 5).toBeCloseTo(0.5, 12)
    expect(firstOrderConc(0.01, k, tHalf) / 0.01).toBeCloseTo(0.5, 12)
  })

  it('k from two concentrations inverts firstOrderConc', () => {
    const k = 0.03
    const R0 = 0.4
    const R = firstOrderConc(R0, k, 25)
    expect(firstOrderK(R0, R, 25)).toBeCloseTo(k, 12)
    expect(() => firstOrderK(R0, R, 0)).toThrow(RangeError)
    expect(() => firstOrderK(R0, 0, 5)).toThrow(RangeError)
  })

  it('logs and fraction helpers', () => {
    expect(lnConc(Math.E)).toBeCloseTo(1, 12)
    expect(log10Ratio(100, 10)).toBeCloseTo(1, 12)
    expect(timeToFraction(0.5, 1)).toBe(0)
    expect(timeToFraction(0.5, 0.25)).toBeCloseTo(2 * Math.LN2 / 0.5, 12)
    expect(fractionRemainingAfterHalfLives(3)).toBeCloseTo(0.125, 12)
    expect(() => timeToFraction(0.5, 1.5)).toThrow(RangeError)
  })

  it('gas phase pressure helpers, p_A = 2pi − pt', () => {
    expect(partialPressureA(0.5, 0.5)).toBeCloseTo(0.5, 12)
    expect(partialPressureA(0.5, 0.75)).toBeCloseTo(0.25, 12)
    expect(() => partialPressureA(0.5, 1.2)).toThrow(RangeError)
    const k = 0.004
    const pi = 0.5
    const t = 80
    const pA = pi * Math.exp(-k * t)
    const pt = 2 * pi - pA
    expect(firstOrderKFromPressure(pi, pt, t)).toBeCloseTo(k, 12)
  })
})

describe('Arrhenius', () => {
  it('arrheniusK and lnKLine', () => {
    const A = 1e12
    const Ea = 50000
    const T = 300
    const k = arrheniusK(A, Ea, T)
    const line = lnKLine(A, Ea)
    expect(line.slope).toBeCloseTo(-Ea / GAS_CONSTANT_J, 9)
    expect(line.slope * (1 / T) + line.intercept).toBeCloseTo(Math.log(k), 9)
    expect(() => arrheniusK(0, Ea, T)).toThrow(RangeError)
    expect(() => arrheniusK(A, -1, T)).toThrow(RangeError)
  })

  it('activationEnergyFromTwo inverts kAtT2', () => {
    const k1 = 0.02
    const T1 = 500
    const T2 = 700
    const Ea = 150000
    const k2 = kAtT2(k1, T1, T2, Ea)
    expect(activationEnergyFromTwo(k1, T1, k2, T2)).toBeCloseTo(Ea, 4)
  })

  it('activationEnergyFromTwo rejects a falling rate constant', () => {
    expect(() => activationEnergyFromTwo(0.07, 500, 0.02, 700)).toThrow(RangeError)
    expect(() => activationEnergyFromTwo(0.02, 500, 0.07, 500)).toThrow(RangeError)
  })

  it('pre-exponential factor is consistent with arrheniusK', () => {
    const Ea = 60000
    const T = 350
    const k = 0.5
    const A = preExponentialFrom(k, Ea, T)
    expect(arrheniusK(A, Ea, T)).toBeCloseTo(k, 9)
  })

  it('fraction above Ea and the ratio for a 10 K rise', () => {
    const Ea = 50000
    expect(fractionAboveEa(Ea, 300)).toBeCloseTo(Math.exp(-Ea / (GAS_CONSTANT_J * 300)), 15)
    const ratio = rateRatioForRise(Ea, 300)
    expect(ratio).toBeCloseTo(arrheniusK(1, Ea, 310) / arrheniusK(1, Ea, 300), 12)
    expect(ratio).toBeGreaterThan(1)
  })

  it('kJ conversions', () => {
    expect(kJPerMolToJPerMol(209)).toBe(209000)
    expect(jPerMolToKJPerMol(209000)).toBe(209)
  })
})

describe('Maxwell–Boltzmann', () => {
  it('erfc matches known values', () => {
    expect(erfc(0)).toBeCloseTo(1, 6)
    expect(erfc(1)).toBeCloseTo(0.1572992, 6)
    expect(erfc(2)).toBeCloseTo(0.0046777, 6)
    expect(erfc(-1)).toBeCloseTo(2 - 0.1572992, 6)
  })

  it('energy density integrates to approximately 1', () => {
    const T = 300
    const curve = mbCurve(T, 30 * GAS_CONSTANT_J * T, 60001)
    let area = 0
    for (let i = 1; i < curve.length; i++) {
      area += ((curve[i].f + curve[i - 1].f) / 2) * (curve[i].E - curve[i - 1].E)
    }
    expect(area).toBeCloseTo(1, 3)
  })

  it('peak is at RT/2 and the curve broadens with temperature', () => {
    const T = 300
    expect(mbMostProbableEnergy(T)).toBeCloseTo((GAS_CONSTANT_J * T) / 2, 9)
    const E = mbMostProbableEnergy(T)
    expect(mbEnergyDensity(E, T)).toBeGreaterThan(mbEnergyDensity(E * 0.9, T))
    expect(mbEnergyDensity(E, T)).toBeGreaterThan(mbEnergyDensity(E * 1.1, T))
  })

  it('fraction above E is 1 at E = 0 and rises with temperature', () => {
    const Ea = 50000
    expect(mbFractionAbove(0, 300)).toBeCloseTo(1, 6)
    const low = mbFractionAbove(Ea, 300)
    const high = mbFractionAbove(Ea, 310)
    expect(low).toBeGreaterThan(0)
    expect(high).toBeGreaterThan(low)
  })

  it('mbCurve rejects bad samples', () => {
    expect(() => mbCurve(300, 1000, 1)).toThrow(RangeError)
    expect(() => mbCurve(0, 1000, 10)).toThrow(RangeError)
  })
})

describe('catalysts and collision theory', () => {
  it('catalyst enhancement and the backward barrier', () => {
    const enhancement = catalystRateEnhancement(100000, 50000, 300)
    expect(enhancement).toBeCloseTo(Math.exp(50000 / (GAS_CONSTANT_J * 300)), 9)
    expect(catalystRateEnhancement(50000, 50000, 300)).toBeCloseTo(1, 12)
    expect(backwardBarrier(80000, -20000)).toBe(100000)
    expect(() => backwardBarrier(10000, 20000)).toThrow(RangeError)
  })

  it('collisionRate is P Z e^(−Ea/RT)', () => {
    expect(collisionRate(0.5, 1e30, 0, 300)).toBeCloseTo(0.5e30, 0)
    expect(collisionRate(1, 1, 50000, 300)).toBeCloseTo(fractionAboveEa(50000, 300), 12)
    expect(() => collisionRate(-1, 1, 0, 300)).toThrow(RangeError)
  })
})

describe('two-step mechanism', () => {
  it('conserves A + I + P = A0 at all times', () => {
    for (const t of [0, 0.5, 2, 10]) {
      const { A, I, P } = twoStepSeries(1, 0.8, 0.2, t)
      expect(A + I + P).toBeCloseTo(1, 12)
    }
  })

  it('starts with all A and no I or P', () => {
    const { A, I, P } = twoStepSeries(2, 0.5, 0.1, 0)
    expect(A).toBeCloseTo(2, 12)
    expect(I).toBeCloseTo(0, 12)
    expect(P).toBeCloseTo(0, 12)
  })

  it('handles k1 equal to k2', () => {
    const { A, I, P } = twoStepSeries(1, 0.3, 0.3, 4)
    expect(A + I + P).toBeCloseTo(1, 12)
    expect(I).toBeGreaterThan(0)
  })

  it('rejects non-positive rate constants', () => {
    expect(() => twoStepSeries(1, 0, 0.2, 1)).toThrow(RangeError)
  })
})

describe('deterministic RNG and formatting', () => {
  it('mulberry32 is repeatable for a seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('formatSig rounds half-up at 4 s.f. and uses a Unicode minus', () => {
    expect(formatSig(31.775, 4)).toBe('31.78')
    expect(formatSig(-2.5, 2)).toBe('−2.5')
  })

  it('formatSci uses × and superscripts', () => {
    expect(formatSci(0.000123, 3)).toBe('1.23 × 10⁻⁴')
    expect(formatSci(45600, 3)).toBe('4.56 × 10⁴')
  })

  it('half-life identity for the t-based first order check', () => {
    // A first order reaction leaves 1/1024 after ten half-lives
    expect(fractionRemainingAfterHalfLives(10)).toBeCloseTo(1 / 1024, 12)
  })
})

describe('Table data run through the libraries', () => {
  it('Table 3.1 interval averages are positive and fall with time', () => {
    const rates: number[] = []
    for (let i = 1; i < NCERT_BUTYL_CHLORIDE.length; i++) {
      const a = NCERT_BUTYL_CHLORIDE[i - 1]
      const b = NCERT_BUTYL_CHLORIDE[i]
      rates.push(averageRate(a.concMolPerL, b.concMolPerL, a.tS, b.tS))
    }
    expect(rates.every((r) => r > 0)).toBe(true)
    expect(rates[0]).toBeGreaterThan(rates[rates.length - 1])
    expect(rates[0]).toBeCloseTo(1.9e-4, 12)
  })
})

describe('shared identities', () => {
  it('zero order and first order half-life formulas match the table', () => {
    expect(zeroOrderHalfLife(0.2, 0.05)).toBeCloseTo(2, 12)
    expect(firstOrderRate(0.5, 0.1, 0)).toBeCloseTo(0.05, 12)
  })

  it('secant and first order chord agree for the exact curve', () => {
    const k = 0.1
    const R0 = 1
    const chord = averageRate(firstOrderConc(R0, k, 0), firstOrderConc(R0, k, 5), 0, 5)
    expect(chord).toBeCloseTo((R0 - R0 * Math.exp(-k * 5)) / 5, 12)
  })
})
