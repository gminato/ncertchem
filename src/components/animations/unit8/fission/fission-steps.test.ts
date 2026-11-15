import { describe, expect, it } from 'vitest'
import { CATION_FRAGMENTS, RADICAL_FRAGMENTS, fissionPoses, ladderRows } from './fission-steps'

describe('fission Scrolly poses', () => {
  const poses = fissionPoses()

  it('has six Steps: the intact molecule first, the ladder last', () => {
    expect(poses).toHaveLength(6)
    expect(poses[0].view).toBe('molecule')
    expect(poses[5].view).toBe('ladder')
  })

  it('labels the fragments of the lib cleavage: charge on the carbon, or on bromine', () => {
    expect(CATION_FRAGMENTS).toEqual({ left: '(CH₃)₂CH⁺', right: 'Br⁻' })
    expect(RADICAL_FRAGMENTS).toEqual({ left: '(CH₃)₂CH•', right: 'Br•' })
  })

  it('bond Steps are broken (progress 1), with heterolysis then homolysis', () => {
    const het = poses[1]
    const hom = poses[4]
    if (het.view !== 'bond' || hom.view !== 'bond') throw new Error('expected bond poses')
    expect(het.progress).toBe(1)
    expect(het.mode).toBe('heterolytic')
    expect(hom.mode).toBe('homolytic')
  })
})

describe('stability ladder rows', () => {
  it('orders carbocations 3° > 2° > 1° > methyl, labelled from the lib', () => {
    const rows = ladderRows('carbocation')
    expect(rows.map((r) => r.alkylGroups)).toEqual([3, 2, 1, 0])
    expect(rows.map((r) => r.label)).toEqual(['(CH₃)₃C⁺', '(CH₃)₂CH⁺', 'CH₃CH₂⁺', 'CH₃⁺'])
    expect(rows[0].degree).toMatch(/^3°/)
    expect(rows[3].degree).toBe('methyl')
  })

  it('orders radicals the same way', () => {
    const rows = ladderRows('radical')
    expect(rows.map((r) => r.alkylGroups)).toEqual([3, 2, 1, 0])
    expect(rows.map((r) => r.alphaH)).toEqual([9, 6, 3, 0])
    expect(rows.map((r) => r.label)).toEqual(['(CH₃)₃C•', '(CH₃)₂CH•', 'CH₃CH₂•', 'CH₃•'])
  })
})
