import { describe, expect, it } from 'vitest'
import { electronConfiguration, orbitalsInSubshell } from './quantum'
import {
  addElectron,
  builderLabels,
  configurationText,
  countsOf,
  elementBySymbol,
  elementInfo,
  emptyBuilderState,
  exchangePairs,
  placementOrder,
  stateAfter,
  targetCounts,
  totalElectrons,
  unpairedCount,
  validateBuilder,
  violatedLabels,
  type BuilderState,
  type OrbitalSpins,
  type Spin,
} from './orbital-builder'

/**
 * Builds a diagram from a map of subshell label to orbital contents. Subshells
 * not named stay empty.
 */
function diagram(filled: Record<string, OrbitalSpins[]>): BuilderState {
  return emptyBuilderState().map((subshell) => {
    const given = filled[subshell.label]
    if (!given) return subshell
    const orbitals = subshell.orbitals.map((_, i) => given[i] ?? [])
    return { ...subshell, orbitals }
  })
}

const ground = (Z: number): BuilderState => stateAfter(placementOrder(Z), Number.MAX_SAFE_INTEGER)

/** Electron counts for the ground-state orbital diagram of element Z, as a plain object, for assertions. */
function countsObject(state: BuilderState): Record<string, number> {
  return Object.fromEntries(countsOf(state))
}

describe('builderLabels', () => {
  it('lists 1s to 4p in Aufbau order', () => {
    expect(builderLabels()).toEqual(['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'])
  })
})

describe('emptyBuilderState', () => {
  it('has one orbital per box, so 18 orbitals and 36 electron places', () => {
    const state = emptyBuilderState()
    const orbitals = state.reduce((sum, s) => sum + s.orbitals.length, 0)
    expect(orbitals).toBe(18)
    expect(totalElectrons(state)).toBe(0)
    const expected: Record<string, number> = { s: 1, p: 3, d: 5 }
    for (const subshell of state) {
      expect(subshell.orbitals.length).toBe(orbitalsInSubshell(0) * 0 + expected[subshell.label[1]])
    }
  })
})

describe('addElectron', () => {
  it('auto mode goes up, then down, then clears', () => {
    let state = emptyBuilderState()
    state = addElectron(state, '1s', 0, 'auto').state
    expect(state[0].orbitals[0]).toEqual(['up'])
    state = addElectron(state, '1s', 0, 'auto').state
    expect(state[0].orbitals[0]).toEqual(['up', 'down'])
    state = addElectron(state, '1s', 0, 'auto').state
    expect(state[0].orbitals[0]).toEqual([])
  })

  it('refuses a third electron in one orbital with a Pauli message and leaves the state unchanged', () => {
    const full = addElectron(addElectron(emptyBuilderState(), '2p', 1, 'up').state, '2p', 1, 'down').state
    const edit = addElectron(full, '2p', 1, 'up')
    expect(edit.state).toBe(full)
    expect(edit.rejected?.rule).toBe('pauli')
    expect(edit.rejected?.message).toMatch(/at most two/)
  })

  it('allows two electrons with the same spin, so that Check can name the violation', () => {
    const edit = addElectron(addElectron(emptyBuilderState(), '1s', 0, 'up').state, '1s', 0, 'up')
    expect(edit.rejected).toBeNull()
    expect(edit.state[0].orbitals[0]).toEqual(['up', 'up'])
  })

  it('does not mutate the input state', () => {
    const before = emptyBuilderState()
    addElectron(before, '2s', 0, 'auto')
    expect(totalElectrons(before)).toBe(0)
  })

  it('throws for a subshell or orbital that does not exist', () => {
    expect(() => addElectron(emptyBuilderState(), '5s', 0, 'auto')).toThrow(RangeError)
    expect(() => addElectron(emptyBuilderState(), '2p', 3, 'auto')).toThrow(RangeError)
  })
})

describe('targetCounts and ground states', () => {
  it('takes the Cr and Cu exceptions from electronConfiguration', () => {
    expect(targetCounts(24).get('3d')).toBe(5)
    expect(targetCounts(24).get('4s')).toBe(1)
    expect(targetCounts(29).get('3d')).toBe(10)
    expect(targetCounts(29).get('4s')).toBe(1)
  })

  it('places 4s before 3d in the build order, and ends in the ground state for Z = 24', () => {
    const order = placementOrder(24)
    expect(order.length).toBe(24)
    const labelsInOrder = [...new Set(order.map((p) => p.label))]
    expect(labelsInOrder.indexOf('4s')).toBeLessThan(labelsInOrder.indexOf('3d'))
    expect(countsObject(stateAfter(order, 24))).toMatchObject({ '3d': 5, '4s': 1 })
  })

  it('places Hund-style: spin up in each orbital before any pairing', () => {
    const oxygen = placementOrder(8)
    const twoP = oxygen.filter((p) => p.label === '2p')
    expect(twoP.slice(0, 3).every((p) => p.spin === 'up')).toBe(true)
    expect(twoP[3]).toEqual({ label: '2p', orbital: 0, spin: 'down' })
  })

  it('builds every element from Z = 1 to 36 to its configuration text', () => {
    for (let Z = 1; Z <= 36; Z++) {
      const built = stateAfter(placementOrder(Z), Number.MAX_SAFE_INTEGER)
      expect(totalElectrons(built)).toBe(Z)
      expect(configurationText(countsOf(built))).toBe(electronConfiguration(Z).text)
      expect(validateBuilder(built, Z).valid).toBe(true)
    }
  })
})

describe('validateBuilder: accepted diagrams', () => {
  it('accepts nitrogen with 2p holding one electron in each orbital, all spin up', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up'], ['up'], ['up']],
    })
    expect(validateBuilder(state, 7)).toEqual({ valid: true, violations: [] })
  })

  it('accepts oxygen with the first 2p orbital paired', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up', 'down'], ['up'], ['up']],
    })
    expect(validateBuilder(state, 8).valid).toBe(true)
  })

  it('accepts chromium in its 3d5 4s1 exception, and copper in 3d10 4s1', () => {
    expect(validateBuilder(ground(24), 24).valid).toBe(true)
    expect(validateBuilder(ground(29), 29).valid).toBe(true)
  })

  it('accepts iron, whichever orbital takes the first paired electron', () => {
    const fe = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up', 'down'], ['up', 'down'], ['up', 'down']],
      '3s': [['up', 'down']],
      '3p': [['up', 'down'], ['up', 'down'], ['up', 'down']],
      '4s': [['up', 'down']],
      '3d': [['down', 'up'], ['up'], ['up'], ['up'], ['up']],
    })
    expect(validateBuilder(fe, 26).valid).toBe(true)
  })
})

describe('validateBuilder: Pauli', () => {
  it('names two electrons with the same spin in one orbital', () => {
    const state = diagram({ '1s': [['up', 'up']] })
    const check = validateBuilder(state, 2)
    expect(check.valid).toBe(false)
    expect(check.violations[0].rule).toBe('pauli')
    expect(check.violations[0].label).toBe('1s')
    expect(check.violations[0].message).toMatch(/Pauli exclusion principle broken in 1s/)
    expect(violatedLabels(check)).toEqual(['1s'])
  })

  it('names more than two electrons in one orbital', () => {
    const state = diagram({ '2s': [['up', 'down', 'up']] })
    const check = validateBuilder(state, 3)
    expect(check.violations[0].rule).toBe('pauli')
    expect(check.violations[0].message).toMatch(/holds 3 electrons/)
  })

  it('lists Pauli before Aufbau and Hund', () => {
    const state = diagram({ '2p': [['up', 'up'], [], []] })
    const check = validateBuilder(state, 7)
    expect(check.violations[0].rule).toBe('pauli')
  })
})

describe('validateBuilder: Aufbau', () => {
  it('flags 3s filled while 2p is not yet full', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up'], ['up']],
      '3s': [['up']],
    })
    const check = validateBuilder(state, 7)
    expect(check.violations[0].rule).toBe('aufbau')
    expect(check.violations[0].label).toBe('3s')
    expect(check.violations[0].message).toMatch(/3s holds electrons before 2p is full/)
  })

  it('flags Cr written with the Aufbau guess 4s2 3d4, and mentions the exception', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up', 'down'], ['up', 'down'], ['up', 'down']],
      '3s': [['up', 'down']],
      '3p': [['up', 'down'], ['up', 'down'], ['up', 'down']],
      '4s': [['up', 'down']],
      '3d': [['up'], ['up'], ['up'], ['up']],
    })
    const check = validateBuilder(state, 24)
    expect(check.valid).toBe(false)
    expect(check.violations[0].rule).toBe('aufbau')
    expect(check.violations[0].message).toMatch(/one of the exceptions/)
    expect(check.violations[0].message).toMatch(/3d⁵ 4s¹|1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵ 4s¹/)
  })

  it('flags a wrong electron count for a non-exception element', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up', 'down'], ['up'], ['up']],
    })
    const check = validateBuilder(state, 7)
    expect(check.violations[0].rule).toBe('aufbau')
    expect(check.violations[0].label).toBe('2p')
    expect(check.violations[0].message).toMatch(/should hold 3 electrons.*not 4/)
  })
})

describe('validateBuilder: Hund', () => {
  it('flags an electron paired in 2p while another 2p orbital is still empty', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up', 'down'], [], ['up']],
    })
    const check = validateBuilder(state, 7)
    const hund = check.violations.find((v) => v.rule === 'hund')
    expect(hund?.label).toBe('2p')
    expect(hund?.message).toMatch(/Hund's rule broken in 2p/)
  })

  it('flags unpaired electrons of mixed spin in one subshell', () => {
    const state = diagram({
      '1s': [['up', 'down']],
      '2s': [['up', 'down']],
      '2p': [['up'], ['down'], ['up']],
    })
    const check = validateBuilder(state, 7)
    expect(check.valid).toBe(false)
    expect(check.violations.some((v) => v.rule === 'hund' && v.label === '2p')).toBe(true)
  })
})

describe('configurationText and unpairedCount', () => {
  it('writes superscripts in n-then-l order', () => {
    expect(configurationText(new Map([['3d', 6], ['4s', 2], ['1s', 2]]))).toBe('1s² 3d⁶ 4s²')
  })

  it('counts unpaired electrons in the ground state', () => {
    expect(unpairedCount(ground(7))).toBe(3)
    expect(unpairedCount(ground(8))).toBe(2)
    expect(unpairedCount(ground(24))).toBe(6)
    expect(unpairedCount(ground(26))).toBe(4)
    expect(unpairedCount(ground(29))).toBe(1)
  })
})

describe('elements', () => {
  it('maps symbols and Z for Z = 1 to 36', () => {
    expect(elementInfo(7)).toEqual({ Z: 7, symbol: 'N', name: 'Nitrogen' })
    expect(elementBySymbol('Fe')?.Z).toBe(26)
    expect(elementBySymbol('Kr')?.Z).toBe(36)
    expect(elementBySymbol('Xx')).toBeUndefined()
    expect(() => elementInfo(37)).toThrow(RangeError)
  })
})

describe('exchangePairs', () => {
  it('gives 10 pairs for five parallel electrons (d5) and 6 for four (d4)', () => {
    expect(exchangePairs(5)).toBe(10)
    expect(exchangePairs(4)).toBe(6)
    expect(exchangePairs(0)).toBe(0)
    expect(exchangePairs(1)).toBe(0)
  })

  it('rejects a negative or fractional count', () => {
    expect(() => exchangePairs(-1)).toThrow(RangeError)
    expect(() => exchangePairs(2.5)).toThrow(RangeError)
  })
})
