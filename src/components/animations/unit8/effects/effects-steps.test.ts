import { describe, expect, it } from 'vitest'
import { EFFECT_STEP_KINDS, cationLabel, cationLadder, inductiveNodes } from './effects-steps'

describe('electron-effects Scrolly steps', () => {
  it('has seven Steps in the order of the Section', () => {
    expect(EFFECT_STEP_KINDS).toEqual([
      'inductive',
      'carboxylate',
      'benzene',
      'donation',
      'withdrawal',
      'electromeric',
      'hyperconjugation',
    ])
  })

  it('the inductive chain of 1-chloropentane has six nodes, Cl first, and fades to none after three bonds', () => {
    const nodes = inductiveNodes()
    expect(nodes.map((n) => n.label)).toEqual(['Cl', 'CH₂', 'CH₂', 'CH₂', 'CH₂', 'CH₃'])
    expect(nodes.map((n) => n.charge)).toEqual([undefined, 'δ+', 'δδ+', 'δδδ+', undefined, undefined])
    expect(nodes[1].chargeOpacity).toBe(1)
    expect(nodes[3].chargeOpacity).toBe(0.3)
  })

  it('the carbocation ladder runs from tertiary to methyl, with the lib counts of alpha-hydrogens', () => {
    const ladder = cationLadder()
    expect(ladder.map((r) => r.alphaH)).toEqual([9, 6, 3, 0])
    expect(ladder.map((r) => r.alkylGroups)).toEqual([3, 2, 1, 0])
    expect(ladder.map((r) => r.rank)).toEqual([0, 1, 2, 3])
    expect(ladder[0].smiles).toBe('C[C+](C)C')
  })
})

describe('written cation labels', () => {
  it('writes the charge after the carbon that carries it', () => {
    expect(cationLadder().map((r) => r.label)).toEqual(['(CH₃)₃C⁺', '(CH₃)₂CH⁺', 'CH₃CH₂⁺', 'CH₃⁺'])
    expect(cationLabel(0)).toBe('CH₃⁺')
  })
})
