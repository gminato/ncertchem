import { describe, expect, it } from 'vitest'
import {
  GAS_LAWS_STEP_COUNT,
  GAS_REACTION,
  MOLECULES_PER_UNIT,
  equationIsBalanced,
  snapshotForStep,
  volumeRatioText,
} from './gas-laws-steps'

describe('GasLaws steps', () => {
  it('has five Steps, in the order zoom, split, join', () => {
    expect(GAS_LAWS_STEP_COUNT).toBe(5)
    expect(snapshotForStep(0)).toEqual({ ratio: 0, zoom: 0, split: 0, join: 0 })
    expect(snapshotForStep(1).zoom).toBe(0)
    expect(snapshotForStep(2).zoom).toBe(1)
    expect(snapshotForStep(2).split).toBe(0)
    expect(snapshotForStep(3).split).toBe(1)
    expect(snapshotForStep(3).join).toBe(0)
    expect(snapshotForStep(4).join).toBe(1)
  })

  it('never regroups before the atoms have split', () => {
    for (let step = 0; step < GAS_LAWS_STEP_COUNT; step++) {
      const s = snapshotForStep(step)
      if (s.join > 0) expect(s.split).toBe(1)
      if (s.split > 0) expect(s.zoom).toBe(1)
    }
  })
})

describe('gas volume numbers (Gay-Lussac and Avogadro)', () => {
  it('the equation 2H2 + O2 -> 2H2O is balanced', () => {
    expect(equationIsBalanced()).toBe(true)
  })

  it('the volume ratio is 2 : 1 : 2, the coefficients of the equation', () => {
    expect(volumeRatioText()).toBe('2 : 1 : 2')
  })

  it('the close-up (4 H2 + 2 O2 -> 4 H2O) holds two molecules per unit volume, matching the 2 : 1 : 2 cylinders', () => {
    const h2 = GAS_REACTION.reactants[0].coeff
    const o2 = GAS_REACTION.reactants[1].coeff
    const h2o = GAS_REACTION.products[0].coeff
    // Two unit volumes of H2 hold 2 x MOLECULES_PER_UNIT molecules, which react with one unit of O2.
    expect(2 * MOLECULES_PER_UNIT).toBe(h2 * 2)
    expect(1 * MOLECULES_PER_UNIT).toBe(o2 * 2)
    expect(2 * MOLECULES_PER_UNIT).toBe(h2o * 2)
  })
})
