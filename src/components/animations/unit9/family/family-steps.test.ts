import { describe, expect, it } from 'vitest'
import { FAMILY_STEPS, FAMILY_STEP_COUNT, familyView } from './family-steps'
import { carbonRows } from '@/lib/chem/carbon-counter'
import { degreeOfUnsaturation } from '@/lib/chem/molecule-parse'

function carbons(i: number): number {
  return familyView(i).graph.atoms.filter((a) => a.element === 'C').length
}

describe('hydrocarbon-family steps', () => {
  it('has five steps: methane, ethane, ethene, ethyne, benzene', () => {
    expect(FAMILY_STEP_COUNT).toBe(5)
    expect(FAMILY_STEPS.map((_, i) => familyView(i).formula)).toEqual(['CH4', 'C2H6', 'C2H4', 'C2H2', 'C6H6'])
  })

  it('names each molecule with the lib', () => {
    expect(familyView(0).name).toBe('methane')
    expect(familyView(1).name).toBe('ethane')
    expect(familyView(2).name).toBe('ethene')
    expect(familyView(3).name).toBe('ethyne')
    expect(familyView(4).name).toBe('benzene')
  })

  it('gives sp3 with 109.5 degrees for the alkanes, sp2 with 120 for the alkene and arene, sp with 180 for the alkyne', () => {
    expect([0, 1].map((i) => [familyView(i).hybrid, familyView(i).angle])).toEqual([['sp3', 109.5], ['sp3', 109.5]])
    expect([familyView(2).hybrid, familyView(2).angle]).toEqual(['sp2', 120])
    expect([familyView(3).hybrid, familyView(3).angle]).toEqual(['sp', 180])
    expect([familyView(4).hybrid, familyView(4).angle]).toEqual(['sp2', 120])
  })

  it('obeys the general formula of each family', () => {
    // Alkane CnH2n+2 (two H more than 2n), alkene CnH2n (one ring or double bond), alkyne CnH2n-2 (two more unsaturations).
    const alkane = familyView(1)
    expect(alkane.graph.atoms.reduce((s, a) => s + (a.hCount ?? 0), 0)).toBe(2 * carbons(1) + 2)
    expect(degreeOfUnsaturation(familyView(2).graph)).toBe(1)
    expect(degreeOfUnsaturation(familyView(3).graph)).toBe(2)
    expect(familyView(4).graph.atoms.filter((a) => a.element === 'C')).toHaveLength(6)
  })

  it('reports six π electrons and an aromatic verdict for benzene', () => {
    expect(familyView(4).piElectrons).toBe(6)
    expect(familyView(4).verdict).toBe('aromatic')
  })

  it('gives both carbons of ethane the primary class', () => {
    expect(carbonRows(familyView(1).graph).every((r) => r.degree === '1°')).toBe(true)
  })
})
