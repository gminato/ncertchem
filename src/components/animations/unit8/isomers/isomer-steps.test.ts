import { describe, expect, it } from 'vitest'
import { chainHighlight, isomerSteps } from './isomer-steps'
import { isomerFamily } from '@/lib/chem/isomer-families'

describe('isomerSteps', () => {
  const steps = isomerSteps()

  it('has six Steps in the order chain, position, functional, metamer, cis, trans', () => {
    expect(steps.map((s) => (s.kind === 'geometry' ? s.config : s.kind === 'pair' ? s.relation : 'chain'))).toEqual([
      'chain',
      'position',
      'functional',
      'metamerism',
      'cis',
      'trans',
    ])
  })

  it('lists the three pentane isomers, longest chain first', () => {
    const first = steps[0]
    if (first.kind !== 'chain') throw new Error('expected a chain Step')
    expect(first.rows.map((r) => r.member.name)).toEqual(['pentane', '2-methylbutane', '2,2-dimethylpropane'])
    expect(first.rows.map((r) => r.chainLength)).toEqual([5, 4, 3])
  })

  it('highlights a parent chain whose bonds all join highlighted atoms', () => {
    const member = isomerFamily('C5H12').members.find((m) => m.name === '2-methylbutane')!
    const { atoms, bonds } = chainHighlight(member)
    expect(atoms).toHaveLength(4)
    expect(bonds).toHaveLength(3)
    for (const i of bonds) {
      const b = member.graph.bonds[i]
      expect(atoms).toContain(b.a)
      expect(atoms).toContain(b.b)
    }
  })

  it('takes its pair Steps from the family, with the relation the lib gives', () => {
    const pairs = steps.filter((s) => s.kind === 'pair')
    expect(pairs).toHaveLength(3)
    for (const p of pairs) {
      if (p.kind !== 'pair') continue
      expect(p.phrase.length).toBeGreaterThan(10)
      expect(p.left.name).not.toBe(p.right.name)
    }
  })

  it('gives the 3D Steps the cis and trans names of but-2-ene', () => {
    const geo = steps.filter((s) => s.kind === 'geometry')
    expect(geo.map((s) => (s.kind === 'geometry' ? s.name : ''))).toEqual(['cis-but-2-ene', 'trans-but-2-ene'])
  })
})
