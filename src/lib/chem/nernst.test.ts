import { describe, expect, it } from 'vitest'
import { cellPotential, electrodePotential, hydrogenElectrodePotential, nernstLog10Slope, reactionQuotient } from './nernst'

describe('nernstLog10Slope', () => {
  it('is 0.059/n at 298 K by default and RT ln10/(nF) when T is given', () => {
    expect(nernstLog10Slope(1)).toBeCloseTo(0.059, 9)
    expect(nernstLog10Slope(2)).toBeCloseTo(0.0295, 9)
    expect(nernstLog10Slope(2, 298)).toBeCloseTo(0.05916 / 2, 4)
  })

  it('throws for a non-positive or non-integer n', () => {
    expect(() => nernstLog10Slope(0)).toThrow(RangeError)
    expect(() => nernstLog10Slope(1.5)).toThrow(RangeError)
  })
})

describe('reactionQuotient', () => {
  it('Example 2.1: Q = [Mg²⁺]/[Ag⁺]² = 0.130 / (1e-4)² = 1.3 × 10⁷', () => {
    const q = reactionQuotient([{ value: 0.13, power: 1 }], [{ value: 1e-4, power: 2 }])
    expect(q / 1.3e7).toBeCloseTo(1, 9)
  })

  it('treats empty sides as 1 and handles gas pressures', () => {
    expect(reactionQuotient([], [])).toBe(1)
    expect(reactionQuotient([{ value: 2, power: 2 }], [{ value: 4, power: 1 }])).toBeCloseTo(1, 9)
  })

  it('throws on a non-positive concentration', () => {
    expect(() => reactionQuotient([{ value: 0, power: 1 }], [])).toThrow(RangeError)
    expect(() => reactionQuotient([], [{ value: -1, power: 1 }])).toThrow(RangeError)
  })
})

describe('electrodePotential (Mⁿ⁺/M)', () => {
  it('equals E° at 1 mol L⁻¹ cation', () => {
    expect(electrodePotential(-0.76, 2, 1)).toBeCloseTo(-0.76, 9)
  })

  it('a tenfold drop in [Zn²⁺] lowers E by 0.059/2 = 0.0295 V', () => {
    expect(electrodePotential(-0.76, 2, 0.1)).toBeCloseTo(-0.7895, 6)
  })

  it('throws for a non-positive cation concentration', () => {
    expect(() => electrodePotential(0.34, 2, 0)).toThrow(RangeError)
  })
})

describe('cellPotential (E = E° − (RT/nF) ln Q)', () => {
  it('Example 2.1: Mg/Mg²⁺ (0.130 M) || Ag⁺ (1e-4 M)/Ag gives E = 2.96 V', () => {
    const q = reactionQuotient([{ value: 0.13, power: 1 }], [{ value: 1e-4, power: 2 }])
    expect(cellPotential(3.17, 2, q)).toBeCloseTo(2.96, 2)
  })

  it('at Q = 1 the cell potential equals E°', () => {
    expect(cellPotential(1.1, 2, 1)).toBe(1.1)
  })

  it('throws for Q ≤ 0', () => {
    expect(() => cellPotential(1.1, 2, 0)).toThrow(RangeError)
  })
})

describe('hydrogenElectrodePotential', () => {
  it('E = −0.059 pH at 298 K', () => {
    expect(hydrogenElectrodePotential(0)).toBeCloseTo(0, 12)
    expect(hydrogenElectrodePotential(1)).toBeCloseTo(-0.059, 9)
    expect(hydrogenElectrodePotential(7)).toBeCloseTo(-0.413, 9)
  })

  it('with T given, uses the exact RT ln10/F slope', () => {
    expect(hydrogenElectrodePotential(1, 298)).toBeCloseTo(-0.05916, 4)
  })
})
