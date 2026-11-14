import { describe, expect, it } from 'vitest'
import {
  aufbauOrder,
  angularNodes,
  electronConfiguration,
  isValidQuantumSet,
  maxElectronsInShell,
  orbitalDiagram,
  orbitalsInShell,
  orbitalsInSubshell,
  radialNodes,
  subshellLabel,
  totalNodes,
  unpairedElectrons,
  validateOrbitalDiagram,
} from './quantum'

// NCERT Table 2.6 (Electronic Configurations of the Elements), transcribed for Z = 1..36.
// Each entry lists the occupied subshells in n, l order with their electron counts.
const NCERT_TABLE_2_6: string[] = [
  '1s1', // 1 H
  '1s2', // 2 He
  '1s2 2s1', // 3 Li
  '1s2 2s2', // 4 Be
  '1s2 2s2 2p1', // 5 B
  '1s2 2s2 2p2', // 6 C
  '1s2 2s2 2p3', // 7 N
  '1s2 2s2 2p4', // 8 O
  '1s2 2s2 2p5', // 9 F
  '1s2 2s2 2p6', // 10 Ne
  '1s2 2s2 2p6 3s1', // 11 Na
  '1s2 2s2 2p6 3s2', // 12 Mg
  '1s2 2s2 2p6 3s2 3p1', // 13 Al
  '1s2 2s2 2p6 3s2 3p2', // 14 Si
  '1s2 2s2 2p6 3s2 3p3', // 15 P
  '1s2 2s2 2p6 3s2 3p4', // 16 S
  '1s2 2s2 2p6 3s2 3p5', // 17 Cl
  '1s2 2s2 2p6 3s2 3p6', // 18 Ar
  '1s2 2s2 2p6 3s2 3p6 4s1', // 19 K
  '1s2 2s2 2p6 3s2 3p6 4s2', // 20 Ca
  '1s2 2s2 2p6 3s2 3p6 3d1 4s2', // 21 Sc
  '1s2 2s2 2p6 3s2 3p6 3d2 4s2', // 22 Ti
  '1s2 2s2 2p6 3s2 3p6 3d3 4s2', // 23 V
  '1s2 2s2 2p6 3s2 3p6 3d5 4s1', // 24 Cr (exception)
  '1s2 2s2 2p6 3s2 3p6 3d5 4s2', // 25 Mn
  '1s2 2s2 2p6 3s2 3p6 3d6 4s2', // 26 Fe
  '1s2 2s2 2p6 3s2 3p6 3d7 4s2', // 27 Co
  '1s2 2s2 2p6 3s2 3p6 3d8 4s2', // 28 Ni
  '1s2 2s2 2p6 3s2 3p6 3d10 4s1', // 29 Cu (exception)
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2', // 30 Zn
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p1', // 31 Ga
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p2', // 32 Ge
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p3', // 33 As
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p4', // 34 Se
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p5', // 35 Br
  '1s2 2s2 2p6 3s2 3p6 3d10 4s2 4p6', // 36 Kr
]

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}
const sup = (n: number): string => String(n).split('').map((d) => SUPERSCRIPT[d]).join('')

describe('subshell labels and capacities', () => {
  it('labels subshells', () => {
    expect(subshellLabel(3, 2)).toBe('3d')
    expect(subshellLabel(1, 0)).toBe('1s')
    expect(subshellLabel(4, 3)).toBe('4f')
  })
  it('orbitals in a subshell are 2l + 1', () => {
    expect(orbitalsInSubshell(0)).toBe(1)
    expect(orbitalsInSubshell(1)).toBe(3)
    expect(orbitalsInSubshell(2)).toBe(5)
    expect(orbitalsInSubshell(3)).toBe(7)
  })
  it('a shell holds 2n^2 electrons in n^2 orbitals (NCERT section 2.6.4)', () => {
    expect(maxElectronsInShell(1)).toBe(2)
    expect(maxElectronsInShell(2)).toBe(8)
    expect(maxElectronsInShell(3)).toBe(18)
    expect(maxElectronsInShell(4)).toBe(32)
    expect(orbitalsInShell(3)).toBe(9)
  })
  it('counts nodes: radial n-l-1, angular l, total n-1', () => {
    expect(radialNodes(3, 1)).toBe(1)
    expect(radialNodes(4, 3)).toBe(0)
    expect(angularNodes(2)).toBe(2)
    expect(totalNodes(3)).toBe(2)
  })
  it('rejects invalid n or l', () => {
    expect(() => subshellLabel(0, 0)).toThrow(RangeError)
    expect(() => radialNodes(2, 2)).toThrow(RangeError)
    expect(() => orbitalsInSubshell(-1)).toThrow(RangeError)
  })
})

describe('isValidQuantumSet', () => {
  it('accepts valid sets', () => {
    expect(isValidQuantumSet({ n: 3, l: 2, ml: -2, ms: 0.5 })).toBe(true)
    expect(isValidQuantumSet({ n: 1, l: 0, ml: 0, ms: -0.5 })).toBe(true)
  })
  it('rejects l >= n, |ml| > l, and ms other than +/- 1/2', () => {
    expect(isValidQuantumSet({ n: 2, l: 2, ml: 0, ms: 0.5 })).toBe(false)
    expect(isValidQuantumSet({ n: 2, l: 1, ml: 2, ms: 0.5 })).toBe(false)
    expect(isValidQuantumSet({ n: 2, l: 1, ml: 0, ms: 1 })).toBe(false)
  })
  it('rejects n < 1 or non-integers', () => {
    expect(isValidQuantumSet({ n: 0, l: 0, ml: 0, ms: 0.5 })).toBe(false)
    expect(isValidQuantumSet({ n: 1.5, l: 0, ml: 0, ms: 0.5 })).toBe(false)
  })
})

// NCERT section 2.6.3 / Table 2.5: the (n + l) rule
describe('aufbauOrder (n + l rule)', () => {
  const order = aufbauOrder('7p')
  it('starts with 1s, 2s, 2p, 3s, 3p, 4s, 3d, 4p, 5s, 4d, 5p, 6s, 4f, 5d, 6p, 7s', () => {
    expect(order.slice(0, 16)).toEqual([
      '1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s',
    ])
  })
  it('places 4s before 3d', () => {
    expect(order.indexOf('4s')).toBeLessThan(order.indexOf('3d'))
  })
  it('places 5s before 4d', () => {
    expect(order.indexOf('5s')).toBeLessThan(order.indexOf('4d'))
  })
  it('places 6s before 4f before 5d', () => {
    expect(order.indexOf('6s')).toBeLessThan(order.indexOf('4f'))
    expect(order.indexOf('4f')).toBeLessThan(order.indexOf('5d'))
  })
  it('ends at 7p', () => {
    expect(order[order.length - 1]).toBe('7p')
  })
  it('rejects an unknown limit', () => {
    expect(() => aufbauOrder('9z')).toThrow(RangeError)
  })
})

describe('electronConfiguration', () => {
  it('reproduces NCERT Table 2.6 for every Z from 1 to 36', () => {
    for (let z = 1; z <= 36; z++) {
      const config = electronConfiguration(z)
      const actual = config.subshells.map((s) => `${s.label}${s.electrons}`).join(' ')
      expect(actual, `Z = ${z}`).toBe(NCERT_TABLE_2_6[z - 1])
    }
  })
  it('writes NCERT-style text with superscripts (Cr, Cu exceptions included)', () => {
    expect(electronConfiguration(24).text).toBe(
      `1s${sup(2)} 2s${sup(2)} 2p${sup(6)} 3s${sup(2)} 3p${sup(6)} 3d${sup(5)} 4s${sup(1)}`
    )
    expect(electronConfiguration(29).text).toContain(`3d${sup(10)} 4s${sup(1)}`)
  })
  it('gives the NCERT noble-gas core forms', () => {
    expect(electronConfiguration(24).nobleGasCore).toBe(`[Ar]3d${sup(5)}4s${sup(1)}`)
    expect(electronConfiguration(29).nobleGasCore).toBe(`[Ar]3d${sup(10)}4s${sup(1)}`)
    expect(electronConfiguration(26).nobleGasCore).toBe(`[Ar]3d${sup(6)}4s${sup(2)}`)
    expect(electronConfiguration(19).nobleGasCore).toBe(`[Ar]4s${sup(1)}`)
    expect(electronConfiguration(30).nobleGasCore).toBe(`[Ar]3d${sup(10)}4s${sup(2)}`)
    expect(electronConfiguration(21).nobleGasCore).toBe(`[Ar]3d${sup(1)}4s${sup(2)}`)
  })
  it('rejects Z outside 1..36', () => {
    expect(() => electronConfiguration(0)).toThrow(RangeError)
    expect(() => electronConfiguration(37)).toThrow(RangeError)
  })
})

describe('orbitalDiagram and unpairedElectrons', () => {
  it('fills 2p with parallel spins first (Hund) for carbon', () => {
    const p = orbitalDiagram(6).find((s) => s.label === '2p')
    expect(p?.orbitals).toEqual([
      { up: true, down: false },
      { up: true, down: false },
      { up: false, down: false },
    ])
  })
  it('pairs electrons only after every orbital has one (oxygen 2p4)', () => {
    const p = orbitalDiagram(8).find((s) => s.label === '2p')
    expect(p?.orbitals.filter((o) => o.up && o.down).length).toBe(1)
    expect(p?.orbitals.filter((o) => o.up || o.down).length).toBe(3)
  })
  it('counts unpaired electrons', () => {
    expect(unpairedElectrons(6)).toBe(2)
    expect(unpairedElectrons(7)).toBe(3)
    expect(unpairedElectrons(10)).toBe(0)
    expect(unpairedElectrons(24)).toBe(6) // Cr: 3d5 4s1
    expect(unpairedElectrons(29)).toBe(1) // Cu: 3d10 4s1
  })
  it('total electrons in the diagram equal Z', () => {
    for (const z of [1, 11, 24, 29, 36]) {
      const total = orbitalDiagram(z).reduce(
        (sum, s) => sum + s.orbitals.reduce((t, o) => t + Number(o.up) + Number(o.down), 0),
        0
      )
      expect(total).toBe(z)
    }
  })
})

describe('validateOrbitalDiagram', () => {
  it('accepts the ground-state diagram (Cr, with its exception)', () => {
    const diagram = orbitalDiagram(24)
    expect(validateOrbitalDiagram(diagram, 24)).toEqual({ valid: true, violations: [] })
  })
  it('flags Hund violations: pairing before every orbital is singly occupied', () => {
    // Carbon with both 2p electrons paired in the first orbital
    const diagram = orbitalDiagram(6).map((s) =>
      s.label === '2p'
        ? {
            ...s,
            orbitals: [
              { up: true, down: true },
              { up: false, down: false },
              { up: false, down: false },
            ],
          }
        : s
    )
    const r = validateOrbitalDiagram(diagram, 6)
    expect(r.valid).toBe(false)
    expect(r.violations).toContain('hund')
  })
  it('flags an Aufbau violation: 3d filled before 4s', () => {
    // Potassium with its last electron in 3d instead of 4s
    const diagram = orbitalDiagram(19)
      .filter((s) => s.label !== '4s')
      .concat([
        { label: '3d', orbitals: Array.from({ length: 5 }, (_, i) => ({ up: i === 0, down: false })) },
      ])
    const r = validateOrbitalDiagram(diagram, 19)
    expect(r.valid).toBe(false)
    expect(r.violations).toContain('aufbau')
  })
  it('flags a Pauli violation: a lone spin-down electron', () => {
    const diagram = orbitalDiagram(1).map((s) => ({
      ...s,
      orbitals: s.orbitals.map(() => ({ up: false, down: true })),
    }))
    const r = validateOrbitalDiagram(diagram, 1)
    expect(r.valid).toBe(false)
    expect(r.violations).toContain('pauli')
  })
  it('rejects a diagram whose electron count is not Z', () => {
    expect(() => validateOrbitalDiagram(orbitalDiagram(6), 7)).toThrow(RangeError)
  })
})
