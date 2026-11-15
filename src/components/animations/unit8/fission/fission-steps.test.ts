import { describe, expect, it } from 'vitest'
import { fissionPoses, ladderRows, ISOPROPYL, subFormula } from './fission-steps'

describe('fission Scrolly poses', () => {
  const poses = fissionPoses()

  it('has six Steps, the bond Steps first', () => {
    expect(poses).toHaveLength(6)
    expect(poses[0].view).toBe('bond')
    expect(poses[5].view).toBe('ladder')
  })

  it('takes the isopropyl label from the lib homolysis of 2-bromopropane', () => {
    expect(ISOPROPYL).toBe('CH₃CHCH₃')
  })

  it('bond Steps are intact at 0 and broken at 1', () => {
    const first = poses[0]
    const second = poses[1]
    if (first.view !== 'bond' || second.view !== 'bond') throw new Error('expected bond poses')
    expect(first.progress).toBe(0)
    expect(second.progress).toBe(1)
    expect(second.mode).toBe('heterolytic')
    expect(poses[4].view === 'bond' && poses[4].mode).toBe('homolytic')
  })

  it('subscripts digits only', () => {
    expect(subFormula('CH3CHCH3')).toBe('CH₃CHCH₃')
  })
})

describe('stability ladder rows', () => {
  it('orders carbocations 3° > 2° > 1° > methyl (lib rankIntermediates)', () => {
    const rows = ladderRows('carbocation')
    expect(rows.map((r) => r.alkylGroups)).toEqual([3, 2, 1, 0])
    expect(rows[0].degree).toMatch(/^3°/)
    expect(rows[3].degree).toBe('methyl')
  })

  it('orders radicals the same way', () => {
    const rows = ladderRows('radical')
    expect(rows.map((r) => r.alkylGroups)).toEqual([3, 2, 1, 0])
    expect(rows.map((r) => r.alphaH)).toEqual([9, 6, 3, 0])
  })
})
