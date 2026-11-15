import { describe, expect, it } from 'vitest'
import { BUILDER_SPECIES, builderSpecies, builderState, formatOrder, highestOccupiedLevel, levelOfElectron, stabilityVerdict } from './mo-builder'
import { MO_SPECIES } from './molecular-orbitals'

const ORDER_OF = (formula: string, mixing: boolean) => builderState(builderSpecies(formula).electrons, builderSpecies(formula).electrons, mixing)

describe('BUILDER_SPECIES', () => {
  it('covers H₂ to Ne₂ and the five named ions', () => {
    for (const formula of ['H₂', 'He₂', 'Li₂', 'Be₂', 'B₂', 'C₂', 'N₂', 'O₂', 'F₂', 'Ne₂', 'O₂⁺', 'O₂⁻', 'O₂²⁻', 'N₂⁺', 'He₂⁺']) {
      expect(BUILDER_SPECIES.map((s) => s.formula), formula).toContain(formula)
    }
  })

  it('agrees with the electron counts and energy orders of MO_SPECIES', () => {
    for (const s of MO_SPECIES.filter((m) => m.formula !== 'H₂⁺')) {
      const found = BUILDER_SPECIES.find((b) => b.formula === s.formula)
      expect(found, s.formula).toBeDefined()
      expect(found?.electrons, s.formula).toBe(s.electrons)
      expect(found?.ncertMixing, s.formula).toBe(s.mixing)
    }
  })

  it('counts N₂⁺ as 13 electrons and He₂⁺ as 3', () => {
    expect(builderSpecies('N₂⁺').electrons).toBe(13)
    expect(builderSpecies('He₂⁺').electrons).toBe(3)
  })

  it('throws for a species it does not offer', () => {
    expect(() => builderSpecies('CO')).toThrow(RangeError)
  })
})

describe('builderState: bond order, magnetism and configuration at completion', () => {
  it.each([
    ['H₂', 1, false],
    ['He₂', 0, false],
    ['Li₂', 1, false],
    ['Be₂', 0, false],
    ['B₂', 1, true],
    ['C₂', 2, false],
    ['N₂', 3, false],
    ['O₂', 2, true],
    ['O₂⁺', 2.5, true],
    ['O₂⁻', 1.5, true],
    ['O₂²⁻', 1, false],
    ['F₂', 1, false],
    ['Ne₂', 0, false],
    ['N₂⁺', 2.5, true],
    ['He₂⁺', 0.5, true],
  ])('%s has bond order %s (paramagnetic: %s) with its NCERT order', (formula, order, para) => {
    const s = builderSpecies(formula)
    const state = builderState(s.electrons, s.electrons, s.ncertMixing)
    expect(state.bondOrder).toBe(order)
    expect(state.paramagnetic).toBe(para)
  })

  it('gives B₂ the wrong magnetism with the unmixed order (σ2p filled before π2p)', () => {
    const wrong = ORDER_OF('B₂', false)
    expect(wrong.paramagnetic).toBe(false)
    expect(wrong.bondOrder).toBe(1)
    expect(ORDER_OF('B₂', true).paramagnetic).toBe(true)
  })

  it('gives C₂ the wrong magnetism with the unmixed order (two π2p electrons, unpaired)', () => {
    expect(ORDER_OF('C₂', false).paramagnetic).toBe(true)
    expect(ORDER_OF('C₂', true).paramagnetic).toBe(false)
  })

  it('keeps the bond order the same for every species in either order', () => {
    for (const s of BUILDER_SPECIES) {
      for (let n = 0; n <= s.electrons; n++) {
        expect(builderState(s.electrons, n, true).bondOrder, `${s.formula} n=${n}`).toBe(builderState(s.electrons, n, false).bondOrder)
      }
    }
  })
})

describe('levelOfElectron and highestOccupiedLevel', () => {
  it('points at the level that holds the last placed electron', () => {
    const state = builderState(16, 16, false)
    expect(levelOfElectron(state.levels, 16)).toBe('π*2p')
    expect(levelOfElectron(state.levels, 1)).toBe('σ1s')
    expect(levelOfElectron(state.levels, 0)).toBeNull()
    expect(levelOfElectron(state.levels, 17)).toBeNull()
  })

  it('returns the highest occupied level', () => {
    expect(highestOccupiedLevel(builderState(10, 10, true).levels)).toBe('π2p')
    expect(highestOccupiedLevel(builderState(0, 0, true).levels)).toBeNull()
  })
})

describe('stabilityVerdict and formatOrder', () => {
  it('calls a positive bond order stable and zero unstable', () => {
    expect(stabilityVerdict(1).stable).toBe(true)
    expect(stabilityVerdict(0).stable).toBe(false)
  })

  it('writes halves with one decimal place', () => {
    expect(formatOrder(2.5)).toBe('2.5')
    expect(formatOrder(3)).toBe('3')
  })
})
