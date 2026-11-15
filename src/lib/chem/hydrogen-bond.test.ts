import { describe, expect, it } from 'vitest'
import {
  HYDRIDE_BOILING_POINTS,
  NCERT_HYDROGEN_BOND_EXAMPLES,
  hydrideAnomaly,
  hydrogenBondType,
  qualifiesForHydrogenBond,
} from './hydrogen-bond'

describe('qualifiesForHydrogenBond', () => {
  it('accepts X–H···Y with X and Y each F, O or N', () => {
    for (const x of ['F', 'O', 'N']) {
      for (const y of ['F', 'O', 'N']) {
        expect(qualifiesForHydrogenBond(x, y), `${x}–H···${y}`).toBe(true)
      }
    }
  })

  it('rejects a pair where either atom is not F, O or N', () => {
    expect(qualifiesForHydrogenBond('Cl', 'O')).toBe(false)
    expect(qualifiesForHydrogenBond('O', 'S')).toBe(false)
    expect(qualifiesForHydrogenBond('C', 'H')).toBe(false)
  })
})

describe('hydrogenBondType', () => {
  it('calls HF chains and water intermolecular', () => {
    expect(hydrogenBondType({ donor: 'F', acceptor: 'F', sameMolecule: false })).toBe('intermolecular')
    expect(hydrogenBondType({ donor: 'O', acceptor: 'O', sameMolecule: false })).toBe('intermolecular')
  })

  it('calls the o-nitrophenol contact intramolecular', () => {
    expect(hydrogenBondType({ donor: 'O', acceptor: 'O', sameMolecule: true })).toBe('intramolecular')
  })

  it('throws RangeError for a contact that cannot be a hydrogen bond', () => {
    expect(() => hydrogenBondType({ donor: 'Cl', acceptor: 'O', sameMolecule: false })).toThrow(RangeError)
  })
})

describe('NCERT Section 4.9 examples', () => {
  it('includes the HF chain, water, ethanol and o-nitrophenol', () => {
    expect(NCERT_HYDROGEN_BOND_EXAMPLES.map((e) => e.name)).toEqual([
      'Hydrogen fluoride chain', 'Water', 'Ethanol', 'o-Nitrophenol',
    ])
  })

  it('marks o-nitrophenol as the only intramolecular example', () => {
    const intra = NCERT_HYDROGEN_BOND_EXAMPLES.filter((e) => e.type === 'intramolecular')
    expect(intra.map((e) => e.name)).toEqual(['o-Nitrophenol'])
  })
})

describe('hydride boiling points (not NCERT; CRC)', () => {
  it('has four hydrides for each of groups 14 to 17', () => {
    for (const group of [14, 15, 16, 17] as const) {
      expect(HYDRIDE_BOILING_POINTS.filter((h) => h.group === group)).toHaveLength(4)
    }
  })

  it('shows water far above the trend of H2S, H2Se and H2Te', () => {
    const water = hydrideAnomaly(16)
    expect(water.formula).toBe('H2O')
    expect(water.anomalyK).toBeGreaterThan(150)
  })

  it('shows NH3 and HF above their group trends', () => {
    expect(hydrideAnomaly(15).anomalyK).toBeGreaterThan(50)
    expect(hydrideAnomaly(17).anomalyK).toBeGreaterThan(100)
  })

  it('shows CH4 close to the group 14 trend (no hydrogen bonding)', () => {
    expect(Math.abs(hydrideAnomaly(14).anomalyK)).toBeLessThan(30)
  })
})
