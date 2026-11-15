import { describe, expect, it } from 'vitest'
import {
  bombCalorimeterMolarDeltaU,
  coffeeCupMolarDeltaH,
  molarReactionEnergy,
  reactionHeatFromTemperatureRise,
  totalHeatCapacityKJPerK,
} from './calorimetry'

describe('reaction heat from a temperature rise (Problem 5.6)', () => {
  it('gives q_reaction = −C ΔT = −20.7 kJ for a 1 K rise in 20.7 kJ K⁻¹', () => {
    expect(reactionHeatFromTemperatureRise(20.7, 1)).toBeCloseTo(-20.7, 10)
  })

  it('is positive for an endothermic reaction that cools the calorimeter', () => {
    expect(reactionHeatFromTemperatureRise(10, -0.5)).toBeCloseTo(5, 10)
  })

  it('rejects a zero or negative heat capacity', () => {
    expect(() => reactionHeatFromTemperatureRise(0, 1)).toThrow(RangeError)
    expect(() => reactionHeatFromTemperatureRise(-20.7, 1)).toThrow(RangeError)
  })
})

describe('bomb calorimeter, ΔU per mole (Problem 5.6, Section 5.3(a))', () => {
  // 1 g of graphite, molar mass 12.0 g mol⁻¹, burnt in a bomb of 20.7 kJ K⁻¹ with a 1 K rise.
  const molesGraphite = 1 / 12.0

  it('gives ΔU = −2.48 × 10² kJ mol⁻¹ for the combustion of graphite, as NCERT prints', () => {
    const dU = bombCalorimeterMolarDeltaU(20.7, 1, molesGraphite)
    expect(dU).toBeCloseTo(-248.4, 6)
    expect(dU.toPrecision(3)).toBe('-248')
  })

  it('scales inversely with the amount reacted', () => {
    const one = bombCalorimeterMolarDeltaU(20.7, 1, molesGraphite)
    const two = bombCalorimeterMolarDeltaU(20.7, 1, 2 * molesGraphite)
    expect(two).toBeCloseTo(one / 2, 10)
  })

  it('reports the per-mole value through the general molar scaling', () => {
    expect(molarReactionEnergy(20.7, 1, molesGraphite)).toBeCloseTo(-248.4, 6)
  })

  it('rejects zero moles reacted', () => {
    expect(() => bombCalorimeterMolarDeltaU(20.7, 1, 0)).toThrow(RangeError)
  })
})

describe('coffee-cup calorimeter, ΔH per mole (Section 5.3(b))', () => {
  it('gives a negative ΔH for an exothermic run that warms the cup', () => {
    // 0.5 mol reacted, 2.0 kJ K⁻¹ cup, 3.0 K rise → −6.0 kJ total → −12.0 kJ mol⁻¹.
    expect(coffeeCupMolarDeltaH(2.0, 3.0, 0.5)).toBeCloseTo(-12, 10)
  })

  it('gives the same number as the bomb calorimeter for the same run (the difference is in the physics, not the arithmetic)', () => {
    expect(coffeeCupMolarDeltaH(20.7, 1, 1 / 12)).toBeCloseTo(bombCalorimeterMolarDeltaU(20.7, 1, 1 / 12), 12)
  })
})

describe('total heat capacity of a cup and its water', () => {
  it('adds the water heat capacity (m c) to the apparatus heat capacity, in kJ K⁻¹', () => {
    // 100 g of water with c = 4.184 J g⁻¹ K⁻¹ is 0.4184 kJ K⁻¹.
    expect(totalHeatCapacityKJPerK(0.05, 100, 4.184)).toBeCloseTo(0.4684, 10)
  })

  it('rejects a non-positive water mass', () => {
    expect(() => totalHeatCapacityKJPerK(0.05, 0, 4.184)).toThrow(RangeError)
  })
})
