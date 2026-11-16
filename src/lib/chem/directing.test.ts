import { describe, expect, it } from 'vitest'
import { parseSmiles, molecularFormula } from './molecule-parse'
import { NCERT_ORIENTING_GROUPS } from './ncert-unit9-tables'
import { areniumIon, attackOutcome, atomsAt, densitySign, DIRECTING_SMILES, positionOf, ringOf, substrateOf } from './directing'

describe('directing substrates (NCERT 9.5.6)', () => {
  it('has a substrate for every NCERT orienting group, with the NCERT label', () => {
    for (const { group } of NCERT_ORIENTING_GROUPS) {
      expect(() => substrateOf(group), group).not.toThrow()
    }
    expect(Object.keys(DIRECTING_SMILES)).toHaveLength(NCERT_ORIENTING_GROUPS.length - 1)
  })

  it('takes the sulphonic acid from the lib, with the formula C6H6O3S for benzenesulfonic acid', () => {
    expect(molecularFormula(substrateOf('-SO3H'))).toBe('C6H6O3S')
  })

  it('throws for a group NCERT does not list', () => {
    expect(() => substrateOf('-NH3+')).toThrow(RangeError)
  })
})

describe('ring positions', () => {
  it('names the ring carbons relative to the ipso carbon', () => {
    const g = parseSmiles('OC1=CC=CC=C1')
    const { ring, ipso } = ringOf(g)
    expect(ring).toHaveLength(6)
    expect(positionOf(g, ipso)).toBe('ipso')
    expect(atomsAt(g, 'ortho')).toHaveLength(2)
    expect(atomsAt(g, 'meta')).toHaveLength(2)
    expect(atomsAt(g, 'para')).toHaveLength(1)
    const para = atomsAt(g, 'para')[0]
    expect(ring.indexOf(para)).toBe((ring.indexOf(ipso) + 3) % 6)
  })

  it('gives δ− at ortho and para for the ortho-para directors and δ+ for the meta directors', () => {
    expect(densitySign('-OH')).toBe('δ−')
    expect(densitySign('-Cl')).toBe('δ−')
    expect(densitySign('-NO2')).toBe('δ+')
    expect(densitySign('-COOH')).toBe('δ+')
  })
})

describe('attack outcome (lib-backed)', () => {
  it('phenol nitration: ortho and para are reachable, meta is not', () => {
    const g = substrateOf('-OH')
    const ortho = atomsAt(g, 'ortho')[0]
    const meta = atomsAt(g, 'meta')[0]
    const para = atomsAt(g, 'para')[0]
    expect(attackOutcome('-OH', 'nitration', ortho)).toMatchObject({ position: 'ortho', reachable: true, activating: true, directs: 'ortho-para' })
    expect(attackOutcome('-OH', 'nitration', ortho).product?.name).toBe('2-nitrophenol')
    expect(attackOutcome('-OH', 'nitration', para).product?.name).toBe('4-nitrophenol')
    expect(attackOutcome('-OH', 'nitration', meta)).toMatchObject({ position: 'meta', reachable: false })
  })

  it('nitrobenzene nitration: only meta is reachable', () => {
    const g = substrateOf('-NO2')
    const meta = atomsAt(g, 'meta')[0]
    const ortho = atomsAt(g, 'ortho')[0]
    expect(attackOutcome('-NO2', 'nitration', meta)).toMatchObject({ reachable: true, directs: 'meta', activating: false })
    expect(attackOutcome('-NO2', 'nitration', ortho).reachable).toBe(false)
  })

  it('a chloro group is deactivating but directs to ortho and para', () => {
    const g = substrateOf('-Cl')
    expect(attackOutcome('-Cl', 'bromination', atomsAt(g, 'para')[0])).toMatchObject({ reachable: true, activating: false, directs: 'ortho-para' })
  })

  it('refuses a click that is not on the ring', () => {
    const g = substrateOf('-OH')
    const oxygen = 0
    expect(() => attackOutcome('-OH', 'nitration', oxygen)).toThrow(RangeError)
  })
})

describe('arenium ions', () => {
  it('keeps the formula of the substrate plus the electrophile (C7H8 + NO2+ gives C7H8NO2+)', () => {
    const g = substrateOf('-CH3')
    const attack = atomsAt(g, 'ortho')[0]
    const charge = ringOf(g).ipso // ortho to the attack
    expect(molecularFormula(areniumIon(g, attack, charge))).toBe('C7H8NO2+')
  })

  it('puts the + on the ring carbon that is ortho or para to the attack', () => {
    const g = substrateOf('-OH')
    for (const attack of atomsAt(g, 'ortho')) {
      const ion = areniumIon(g, attack, atomsAt(g, 'ipso')[0], true)
      const plus = ion.atoms.map((a, i) => ({ a, i })).filter(({ a }) => (a.charge ?? 0) === 1)
      expect(plus).toHaveLength(2) // the oxonium O and the NO2 nitrogen
      expect(plus.map(({ a }) => a.element).sort()).toEqual(['N', 'O'])
    }
  })

  it('draws the oxonium contributor only for an ipso charge', () => {
    const g = substrateOf('-OH')
    const attack = atomsAt(g, 'meta')[0]
    const other = atomsAt(g, 'ortho').find((a) => a !== attack) ?? atomsAt(g, 'ortho')[0]
    expect(() => areniumIon(g, attack, other, true)).toThrow(RangeError)
  })

  it('refuses a charge that is not ortho or para to the attack', () => {
    const g = substrateOf('-CH3')
    const { ring } = ringOf(g)
    const attack = ring[0]
    // two steps round the ring from the attack is a meta carbon of the attack: not ortho or para
    expect(() => areniumIon(g, attack, ring[2])).toThrow(RangeError)
  })

  it('gives the oxonium contributor a C=O⁺H group on the ipso carbon', () => {
    const g = substrateOf('-OH')
    const ipso = ringOf(g).ipso
    const attack = atomsAt(g, 'para')[0]
    const ion = areniumIon(g, attack, ipso, true)
    const donor = ion.bonds.find((b) => (b.a === ipso && ion.atoms[b.b].element === 'O') || (b.b === ipso && ion.atoms[b.a].element === 'O'))
    expect(donor?.order).toBe(2)
    const oxygen = donor!.a === ipso ? donor!.b : donor!.a
    expect(ion.atoms[oxygen]).toMatchObject({ element: 'O', charge: 1, hCount: 1 })
  })
})

describe('every NCERT group in the predictor', () => {
  it('gives a lib outcome for an ortho, meta and para click, for nitration, bromination and chlorination', async () => {
    const { NCERT_ORIENTING_GROUPS } = await import('./ncert-unit9-tables')
    const { PREDICTOR_GROUPS } = await import('./directing')
    expect(PREDICTOR_GROUPS).toHaveLength(NCERT_ORIENTING_GROUPS.length - 1)
    for (const group of PREDICTOR_GROUPS) {
      const g = substrateOf(group)
      for (const kind of ['nitration', 'bromination', 'chlorination'] as const) {
        for (const pos of ['ortho', 'meta', 'para'] as const) {
          const atom = atomsAt(g, pos)[0]
          expect(() => attackOutcome(group, kind, atom), `${group} ${kind} ${pos}`).not.toThrow()
        }
      }
    }
  })
})
