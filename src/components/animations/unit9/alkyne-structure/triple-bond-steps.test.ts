import { describe, expect, it } from 'vitest'
import { TRIPLE_BOND_STEP_KINDS, bondLadder } from './triple-bond-steps'

describe('triple-bond Scrolly steps', () => {
  it('has four Steps: separate π lobes, merged cylinder, bond ladder, carbide generator', () => {
    expect([...TRIPLE_BOND_STEP_KINDS]).toEqual(['pi-separate', 'pi-cylinder', 'bond-ladder', 'carbide'])
  })

  it('the ladder runs C–C, C=C, C≡C with NCERT lengths falling and enthalpies rising', () => {
    const ladder = bondLadder()
    expect(ladder.map((r) => r.label)).toEqual(['C–C', 'C=C', 'C≡C'])
    expect(ladder.map((r) => r.lengthPm)).toEqual([154, 134, 120])
    expect(ladder.map((r) => r.enthalpyKJ)).toEqual([348, 681, 823])
  })
})
