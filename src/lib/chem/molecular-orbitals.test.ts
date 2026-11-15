import { describe, expect, it } from 'vitest'
import { NCERT_FIG_4_21_MO_DATA } from './ncert-unit4-tables'
import {
  MO_ORDER_WITHOUT_MIXING,
  MO_ORDER_WITH_MIXING,
  MO_SPECIES,
  bondOrder,
  configurationText,
  fillMOs,
  isParamagnetic,
  summariseSpecies,
} from './molecular-orbitals'

describe('fillMOs (Hund and Aufbau)', () => {
  it('puts two electrons into a σ level and fills a π pair singly first', () => {
    const levels = fillMOs(4, MO_ORDER_WITH_MIXING)
    const pi = levels.find((l) => l.label === 'π2p')
    expect(pi?.electrons).toBe(0)
    const filled = fillMOs(10, MO_ORDER_WITH_MIXING)
    expect(filled.find((l) => l.label === 'π2p')).toMatchObject({ electrons: 2, unpaired: 2 })
  })

  it('places O2 π* electrons as two unpaired, one in each orbital', () => {
    const levels = fillMOs(16, MO_ORDER_WITHOUT_MIXING)
    expect(levels.find((l) => l.label === 'π*2p')).toMatchObject({ electrons: 2, unpaired: 2 })
  })

  it('rejects a count the levels cannot hold, or a non-integer', () => {
    expect(() => fillMOs(21, MO_ORDER_WITH_MIXING)).toThrow(RangeError)
    expect(() => fillMOs(-1)).toThrow(RangeError)
    expect(() => fillMOs(2.5)).toThrow(RangeError)
  })
})

describe('bond order, paramagnetism and configuration', () => {
  it('gives O2 bond order 2 and paramagnetism, as NCERT states', () => {
    const o2 = summariseSpecies('O₂')
    expect(o2.bondOrder).toBe(2)
    expect(o2.paramagnetic).toBe(true)
    expect(o2.unpaired).toBe(2)
  })

  it('gives N2 bond order 3 and diamagnetism', () => {
    const n2 = summariseSpecies('N₂')
    expect(n2.bondOrder).toBe(3)
    expect(n2.paramagnetic).toBe(false)
  })

  it('gives He2 bond order 0, so it does not exist', () => {
    expect(summariseSpecies('He₂').bondOrder).toBe(0)
  })

  it('gives B2 paramagnetism only with the mixed order (π2p below σ2p)', () => {
    const mixed = summariseSpecies('B₂')
    expect(mixed.paramagnetic).toBe(true)
    expect(mixed.bondOrder).toBe(1)
    // The unmixed order would put σ2p first and fill it, making B₂ diamagnetic.
    const unmixed = fillMOs(10, MO_ORDER_WITHOUT_MIXING)
    expect(isParamagnetic(unmixed)).toBe(false)
  })

  it('gives O2⁻ bond order 1.5', () => {
    expect(summariseSpecies('O₂⁻').bondOrder).toBe(1.5)
  })

  it('gives the bond orders of the other species in the list', () => {
    const orders = Object.fromEntries(MO_SPECIES.map((s) => [s.formula, summariseSpecies(s.formula).bondOrder]))
    expect(orders).toEqual({
      'H₂⁺': 0.5, 'H₂': 1, 'He₂⁺': 0.5, 'He₂': 0, 'Li₂': 1, 'Be₂': 0, 'B₂': 1, 'C₂': 2, 'N₂': 3,
      'O₂⁺': 2.5, 'O₂': 2, 'O₂⁻': 1.5, 'O₂²⁻': 1, 'F₂': 1, 'Ne₂': 0,
    })
  })

  it('writes the configuration as NCERT does for O2 and N2', () => {
    expect(summariseSpecies('O₂').configuration).toBe('σ1s² σ*1s² σ2s² σ*2s² σ2p² π2p⁴ π*2p²')
    expect(summariseSpecies('N₂').configuration).toBe('σ1s² σ*1s² σ2s² σ*2s² π2p⁴ σ2p²')
  })

  it('computes the bond order from the (Nb − Na)/2 definition', () => {
    const levels = fillMOs(16, MO_ORDER_WITHOUT_MIXING)
    expect(bondOrder(levels)).toBe((10 - 6) / 2)
    expect(configurationText(levels)).toContain('π*2p²')
  })
})

describe('agreement with NCERT Fig. 4.21', () => {
  it('matches the printed bond order and magnetism of B2 to F2', () => {
    for (const row of NCERT_FIG_4_21_MO_DATA.rows) {
      if (row.species === 'Ne2') continue
      const model = summariseSpecies(`${row.species.replace('2', '₂')}`)
      expect(model.bondOrder, row.species).toBe(row.bondOrder)
      expect(model.paramagnetic ? 'Paramagnetic' : 'Diamagnetic', row.species).toBe(row.magnetism)
    }
  })

  it('gives Ne2 bond order 0', () => {
    expect(summariseSpecies('Ne₂').bondOrder).toBe(NCERT_FIG_4_21_MO_DATA.rows.find((r) => r.species === 'Ne2')?.bondOrder)
  })
})
