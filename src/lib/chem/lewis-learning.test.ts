import { describe, expect, it } from 'vitest'
import {
  LEWIS_STRUCTURES,
  checkStructure,
  formalChargesOf,
  lewisStructure,
  octetReport,
  totalValenceElectrons,
} from './lewis'
import {
  LEWIS_BUILDER_SPECIES,
  MAX_LONE_PAIRS,
  SECTION_EXTRA_STRUCTURES,
  adjustLonePairs,
  applyFit,
  compareWithTarget,
  cycleBond,
  emptyLearner,
  fitLayout,
  learnerElectronsPlaced,
  learnerElectronsRemaining,
  learnerFormalCharges,
  learnerStage,
  learnerTotalElectrons,
  sectionStructure,
  setBondOrder,
  setCounted,
  shellPopulations,
  stageMessage,
  toggleUnpaired,
} from './lewis-learning'

describe('curated Lewis structures', () => {
  it('every library structure uses each valence electron once and its formal charges sum to the charge', () => {
    for (const [key, structure] of Object.entries(LEWIS_STRUCTURES)) {
      const check = checkStructure(structure)
      expect(check.electronsConserved, `${key} electron count`).toBe(true)
      expect(check.chargeConserved, `${key} charge`).toBe(true)
    }
  })

  it('every Section extra structure conserves electrons and charge', () => {
    for (const [key, structure] of Object.entries(SECTION_EXTRA_STRUCTURES)) {
      const check = checkStructure(structure)
      expect(check.electronsConserved, `${key} electron count`).toBe(true)
      expect(check.chargeConserved, `${key} charge`).toBe(true)
    }
  })

  it('the builder offers every library species and the Section extras resolve by key', () => {
    expect(LEWIS_BUILDER_SPECIES).toEqual(Object.keys(LEWIS_STRUCTURES))
    expect(sectionStructure('BeCl2').name).toBe('BeCl2')
    expect(() => sectionStructure('XeF9')).toThrow(RangeError)
  })

  it('counts 16 valence electrons for CO2 and 24 for the carbonate ion', () => {
    expect(totalValenceElectrons(['C', 'O', 'O'])).toBe(16)
    expect(totalValenceElectrons(['C', 'O', 'O', 'O'], -2)).toBe(24)
  })
})

describe('learner bookkeeping', () => {
  const co2 = lewisStructure('CO2')

  it('starts with nothing placed and every electron still to place', () => {
    const state = emptyLearner(co2)
    expect(learnerTotalElectrons(state)).toBe(16)
    expect(learnerElectronsPlaced(state)).toBe(0)
    expect(learnerElectronsRemaining(state)).toBe(16)
  })

  it('builds CO2 to the curated structure, with every electron used and the same drawing', () => {
    let state = emptyLearner(co2)
    state = setCounted(state, 16)
    state = setBondOrder(state, 0, 1, 2)
    state = setBondOrder(state, 1, 2, 2)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 2, 1)
    state = adjustLonePairs(state, 2, 1)
    expect(learnerElectronsRemaining(state)).toBe(0)
    expect(compareWithTarget(state, co2)).toEqual({ identical: true, resonanceEquivalent: true })
    expect(learnerStage(state, co2)).toBe('done')
    expect(learnerFormalCharges(state, co2)).toEqual([0, 0, 0])
  })

  it('accepts a second resonance form of nitrite as the same species, but not as the identical drawing', () => {
    const target = lewisStructure('NO2⁻')
    let state = emptyLearner(target)
    state = setCounted(state, 18)
    state = setBondOrder(state, 0, 1, 1)
    state = setBondOrder(state, 1, 2, 2)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 1, 1)
    state = adjustLonePairs(state, 2, 1)
    state = adjustLonePairs(state, 2, 1)
    expect(learnerElectronsRemaining(state)).toBe(0)
    expect(compareWithTarget(state, target)).toEqual({ identical: false, resonanceEquivalent: true })
    expect(learnerFormalCharges(state, target)).toEqual([-1, 0, 0])
  })

  it('reports too many electrons as the over stage, with a singular message for one electron', () => {
    let state = emptyLearner(co2)
    state = setCounted(state, 16)
    state = setBondOrder(state, 0, 1, 2)
    state = setBondOrder(state, 1, 2, 2)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 0, 1)
    state = adjustLonePairs(state, 2, 1)
    state = adjustLonePairs(state, 2, 1)
    state = adjustLonePairs(state, 2, 1)
    expect(learnerElectronsRemaining(state)).toBe(-2)
    expect(learnerStage(state, co2)).toBe('over')
    expect(stageMessage('place', 1)).toBe('1 electron left to place. Give the bonded atoms lone pairs first, then use what remains for multiple bonds.')
    expect(stageMessage('over', -1)).toBe('You have placed 1 electron too many. Remove a lone pair or a bond.')
  })

  it('walks the stages in order: count, skeleton, place, then done', () => {
    let state = emptyLearner(co2)
    expect(learnerStage(state, co2)).toBe('count')
    state = setCounted(state, 16)
    expect(learnerStage(state, co2)).toBe('skeleton')
    state = setBondOrder(state, 0, 1, 2)
    expect(learnerStage(state, co2)).toBe('place')
  })

  it('reports the octets stage when every electron is placed but an octet is incomplete', () => {
    const bf3 = lewisStructure('BF3')
    let state = emptyLearner(bf3)
    state = setCounted(state, 24)
    for (const f of [1, 2, 3]) state = setBondOrder(state, 0, f, 1)
    for (const f of [1, 2, 3]) {
      for (let k = 0; k < 3; k++) state = adjustLonePairs(state, f, 1)
    }
    expect(learnerElectronsRemaining(state)).toBe(0)
    expect(learnerStage(state, bf3)).toBe('octets')
    expect(compareWithTarget(state, bf3).identical).toBe(true)
  })

  it('cycles a bond through none, single, double and triple, then back to none', () => {
    let state = emptyLearner(co2)
    const seen: number[] = []
    for (let k = 0; k < 5; k++) {
      state = cycleBond(state, 0, 1)
      seen.push(state.orders[0][1])
    }
    expect(seen).toEqual([1, 2, 3, 0, 1])
  })

  it('keeps lone pairs within 0 and the maximum, and toggles the unpaired electron', () => {
    let state = emptyLearner(co2)
    for (let k = 0; k < MAX_LONE_PAIRS + 3; k++) state = adjustLonePairs(state, 0, 1)
    expect(state.atoms[0].lonePairs).toBe(MAX_LONE_PAIRS)
    for (let k = 0; k < MAX_LONE_PAIRS + 3; k++) state = adjustLonePairs(state, 0, -1)
    expect(state.atoms[0].lonePairs).toBe(0)
    state = toggleUnpaired(state, 1)
    expect(state.atoms[1].unpaired).toBe(1)
    state = toggleUnpaired(state, 1)
    expect(state.atoms[1].unpaired).toBe(0)
  })

  it('rejects a self-bond and an out-of-range bond order', () => {
    const state = emptyLearner(co2)
    expect(() => setBondOrder(state, 0, 0, 1)).toThrow(RangeError)
    expect(() => setBondOrder(state, 0, 1, 4)).toThrow(RangeError)
  })
})

describe('octet exceptions from the curated structures', () => {
  it('flags the incomplete, odd-electron and expanded octets of the Section examples', () => {
    const statusOf = (key: string, element: string) =>
      octetReport(sectionStructure(key)).find((o) => o.element === element)?.status
    expect(statusOf('BeCl2', 'Be')).toBe('incomplete')
    expect(statusOf('BCl3', 'B')).toBe('incomplete')
    expect(statusOf('NO', 'N')).toBe('odd-electron')
    expect(statusOf('PCl5', 'P')).toBe('expanded')
    expect(statusOf('SF6', 'S')).toBe('expanded')
  })

  it('matches the Section 4.1 Check statements: BF3 is incomplete, carbon in CH4 is complete', () => {
    expect(octetReport(lewisStructure('BF3'))[0]).toMatchObject({ electrons: 6, status: 'incomplete' })
    expect(octetReport(lewisStructure('CH4'))[0]).toMatchObject({ electrons: 8, status: 'complete' })
  })

  it('gives the singly bonded oxygens of CO3²⁻ a formal charge of −1 and the double-bonded one 0', () => {
    expect(formalChargesOf(lewisStructure('CO3²⁻'))).toEqual([0, 0, -1, -1])
  })
})

describe('fitLayout', () => {
  it('caps the scale and centres the points in the box', () => {
    const fit = fitLayout([{ x: 0, y: 0 }, { x: 1, y: 0 }], 560, 300, 20, 90)
    expect(fit.scale).toBe(90)
    const left = applyFit(fit, { x: 0, y: 0 })
    const right = applyFit(fit, { x: 1, y: 0 })
    expect((left.x + right.x) / 2).toBeCloseTo(280, 6)
    expect((left.y + right.y) / 2).toBeCloseTo(150, 6)
  })

  it('shrinks to fit a wide structure', () => {
    const fit = fitLayout([{ x: -2, y: 0 }, { x: 2, y: 0 }], 200, 200, 10, 90)
    expect(fit.scale).toBeCloseTo(180 / 4, 6)
  })

  it('rejects a box smaller than its padding', () => {
    expect(() => fitLayout([{ x: 0, y: 0 }], 10, 10, 6, 50)).toThrow(RangeError)
  })
})

describe('shellPopulations (Kössel)', () => {
  it('gives the shells of sodium, chlorine, neon and argon', () => {
    expect(shellPopulations(11)).toEqual([2, 8, 1])
    expect(shellPopulations(17)).toEqual([2, 8, 7])
    expect(shellPopulations(10)).toEqual([2, 8])
    expect(shellPopulations(18)).toEqual([2, 8, 8])
    expect(shellPopulations(1)).toEqual([1])
  })
})

describe('formal charge helper', () => {
  it('matches the curated formal charges of the ozone molecule', () => {
    expect(formalChargesOf(lewisStructure('O3'))).toEqual([0, 1, -1])
  })
})
