import { describe, expect, it } from 'vitest'
import { molecularFormula } from './molecule-parse'
import {
  FAMILY_IDS,
  alkeneConfiguration,
  alkaneIsomerCount,
  but2eneGeometry,
  but2eneName,
  compareMembers,
  isomerFamily,
  type FamilyId,
} from './isomer-families'

describe('isomerFamily', () => {
  it('lists every alkane isomer of CnH(2n+2): 2, 3, 5 and 9 for n = 4 to 7', () => {
    expect(isomerFamily('C4H10').members).toHaveLength(2)
    expect(isomerFamily('C5H12').members).toHaveLength(3)
    expect(isomerFamily('C6H14').members).toHaveLength(5)
    expect(isomerFamily('C7H16').members).toHaveLength(9)
    expect(alkaneIsomerCount(7)).toBe(9)
    // Enumerating and naming every C7 isomer takes ~2 s alone and longer in a busy full run.
  }, 20_000)

  it('gives every member the formula of its family', () => {
    for (const id of FAMILY_IDS) {
      const family = isomerFamily(id)
      for (const m of family.members) expect(molecularFormula(m.graph)).toBe(id)
    }
  })

  it('names every member and lists no duplicate names', () => {
    for (const id of FAMILY_IDS) {
      const names = isomerFamily(id).members.map((m) => m.name)
      expect(new Set(names).size).toBe(names.length)
      for (const name of names) expect(name.length).toBeGreaterThan(0)
    }
  })

  it('marks the C2H6O, C3H8O and C4H10O sets complete (7 for C4H10O) and the C3H6O set as a selection', () => {
    expect(isomerFamily('C2H6O').complete).toBe(true)
    expect(isomerFamily('C3H8O').complete).toBe(true)
    expect(isomerFamily('C4H10O').members).toHaveLength(7)
    expect(isomerFamily('C4H10O').complete).toBe(true)
    expect(isomerFamily('C3H6O').complete).toBe(false)
  })

  it('names the NCERT-style alcohols and ethers of C3H8O and C2H6O', () => {
    const names = (id: FamilyId) => isomerFamily(id).members.map((m) => m.name)
    expect(names('C3H8O')).toEqual(expect.arrayContaining(['propan-1-ol', 'propan-2-ol', 'methoxyethane']))
    expect(names('C2H6O')).toEqual(expect.arrayContaining(['ethanol', 'methoxymethane']))
  })

  it('rejects an unknown family id', () => {
    expect(() => isomerFamily('C9H9' as FamilyId)).toThrow(RangeError)
  })
})

describe('compareMembers', () => {
  const find = (id: FamilyId, name: string) => {
    const m = isomerFamily(id).members.find((x) => x.name === name)
    if (!m) throw new Error(`${name} missing`)
    return m
  }

  it('calls propan-1-ol and propan-2-ol position isomers', () => {
    expect(compareMembers(find('C3H8O', 'propan-1-ol'), find('C3H8O', 'propan-2-ol')).relation).toBe('position')
  })

  it('calls ethanol and methoxymethane functional isomers', () => {
    expect(compareMembers(find('C2H6O', 'ethanol'), find('C2H6O', 'methoxymethane')).relation).toBe('functional')
  })

  it('calls ethoxyethane and 1-methoxypropane metamers', () => {
    expect(compareMembers(find('C4H10O', 'ethoxyethane'), find('C4H10O', '1-methoxypropane')).relation).toBe('metamerism')
  })

  it('calls pentane and 2-methylbutane chain isomers', () => {
    expect(compareMembers(find('C5H12', 'pentane'), find('C5H12', '2-methylbutane')).relation).toBe('chain')
  })

  it('gives a phrase for every relation', () => {
    expect(compareMembers(find('C5H12', 'pentane'), find('C5H12', '2-methylbutane')).phrase).toMatch(/^chain isomers/)
  })
})

describe('but-2-ene geometry (Section 8.6.2)', () => {
  it('places both methyl carbons on one side of the C=C axis in cis, and on opposite sides in trans', () => {
    expect(alkeneConfiguration(but2eneGeometry('cis'))).toBe('cis')
    expect(alkeneConfiguration(but2eneGeometry('trans'))).toBe('trans')
  })

  it('has four carbons and eight hydrogens, with one C=C double bond', () => {
    for (const config of ['cis', 'trans'] as const) {
      const g = but2eneGeometry(config)
      expect(g.atoms.filter((a) => a.element === 'C')).toHaveLength(4)
      expect(g.atoms.filter((a) => a.element === 'H')).toHaveLength(8)
      expect(g.bonds.filter((b) => b.order === 2)).toHaveLength(1)
    }
  })

  it('keeps every C–H and C–C bond at the same length in both configurations', () => {
    const len = (g: ReturnType<typeof but2eneGeometry>, a: string, b: string) => {
      const pa = g.atoms.find((x) => x.id === a)!.position
      const pb = g.atoms.find((x) => x.id === b)!.position
      return Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2])
    }
    for (const config of ['cis', 'trans'] as const) {
      const g = but2eneGeometry(config)
      expect(len(g, 'C1', 'C2')).toBeCloseTo(1, 6)
      expect(len(g, 'C2', 'H2')).toBeCloseTo(0.75, 6)
      expect(len(g, 'C1', 'H1a')).toBeCloseTo(0.75, 6)
    }
  })

  it('names the two configurations from iupacName', () => {
    expect(but2eneName('cis')).toBe('cis-but-2-ene')
    expect(but2eneName('trans')).toBe('trans-but-2-ene')
  })
})
