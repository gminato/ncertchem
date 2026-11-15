import { describe, expect, it } from 'vitest'
import { NCERT_HYBRIDISATION_EXAMPLES, hybridDirections, hybridisationFor, hybridisedOrbitals, sCharacter, stericNumber, type Hybridisation } from './hybridisation'
import { type Vec3 } from './vsepr'

function angle(a: Vec3, b: Vec3): number {
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  return (Math.acos(Math.max(-1, Math.min(1, dot))) * 180) / Math.PI
}

describe('steric number and hybridisation', () => {
  it('adds bonded atoms and lone pairs', () => {
    expect(stericNumber(3, 1)).toBe(4)
    expect(stericNumber(2, 2)).toBe(4)
  })

  it('maps steric numbers 2 to 6 onto sp, sp², sp³, sp³d and sp³d²', () => {
    const got = [2, 3, 4, 5, 6].map((sn) => hybridisationFor(sn))
    expect(got).toEqual(['sp', 'sp2', 'sp3', 'sp3d', 'sp3d2'])
  })

  it('rejects a steric number outside 2 to 6', () => {
    expect(() => hybridisationFor(1)).toThrow(RangeError)
    expect(() => hybridisationFor(7)).toThrow(RangeError)
    expect(() => stericNumber(-1, 0)).toThrow(RangeError)
  })
})

describe('hybrid orbitals', () => {
  it('lists the mixing orbitals and gives the s fraction 1/2, 1/3, 1/4, 1/5, 1/6', () => {
    const hybrids: Hybridisation[] = ['sp', 'sp2', 'sp3', 'sp3d', 'sp3d2']
    expect(hybrids.map((h) => hybridisedOrbitals(h).length)).toEqual([2, 3, 4, 5, 6])
    expect(hybrids.map((h) => sCharacter(h))).toEqual([1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6])
  })

  it('points the sp hybrids linearly, the sp² trigonally, and the sp³ tetrahedrally', () => {
    expect(hybridDirections('sp')).toHaveLength(2)
    expect(angle(hybridDirections('sp')[0], hybridDirections('sp')[1])).toBeCloseTo(180, 6)
    expect(hybridDirections('sp2')).toHaveLength(3)
    expect(angle(hybridDirections('sp2')[0], hybridDirections('sp2')[1])).toBeCloseTo(120, 6)
    expect(angle(hybridDirections('sp3')[0], hybridDirections('sp3')[1])).toBeCloseTo(109.47, 1)
  })

  it('points sp³d and sp³d² hybrids in trigonal bipyramidal and octahedral sets', () => {
    expect(hybridDirections('sp3d')).toHaveLength(5)
    expect(hybridDirections('sp3d2')).toHaveLength(6)
  })
})

describe('NCERT Section 4.6 examples', () => {
  it('gives the hybridisation NCERT names for each example', () => {
    const byMolecule = Object.fromEntries(NCERT_HYBRIDISATION_EXAMPLES.map((e) => [e.molecule, e.hybridisation]))
    expect(byMolecule).toEqual({
      BeCl2: 'sp',
      BCl3: 'sp2',
      CH4: 'sp3',
      NH3: 'sp3',
      H2O: 'sp3',
      C2H6: 'sp3',
      C2H4: 'sp2',
      C2H2: 'sp',
      PCl5: 'sp3d',
      SF6: 'sp3d2',
    })
  })

  it('derives each example hybridisation from its steric number', () => {
    for (const ex of NCERT_HYBRIDISATION_EXAMPLES) {
      expect(hybridisationFor(stericNumber(ex.bondedAtoms, ex.lonePairs)), ex.molecule).toBe(ex.hybridisation)
    }
  })

  it('counts σ and π bonds in ethene and ethyne as NCERT does', () => {
    const ethene = NCERT_HYBRIDISATION_EXAMPLES.find((e) => e.molecule === 'C2H4')
    const ethyne = NCERT_HYBRIDISATION_EXAMPLES.find((e) => e.molecule === 'C2H2')
    expect([ethene?.sigmaBonds, ethene?.piBonds]).toEqual([5, 1])
    expect([ethyne?.sigmaBonds, ethyne?.piBonds]).toEqual([3, 2])
  })
})
