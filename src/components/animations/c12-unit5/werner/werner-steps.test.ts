import { describe, expect, it } from 'vitest'
import { WERNER_STEP_COUNT, wernerStepState } from './werner-steps'

describe('wernerStepState', () => {
  it('returns yellow, purple, and green complex states for steps 0 to 2', () => {
    const s0 = wernerStepState(0)
    expect(s0.kind).toBe('complex')
    if (s0.kind === 'complex') {
      expect(s0.row.colour).toBe('Yellow')
      expect(s0.row.agclMoles).toBe(3)
      expect(s0.sites.filter((l) => l === 'NH3')).toHaveLength(6)
      expect(s0.sites.filter((l) => l === 'Cl')).toHaveLength(0)
    }

    const s1 = wernerStepState(1)
    expect(s1.kind).toBe('complex')
    if (s1.kind === 'complex') {
      expect(s1.row.colour).toBe('Purple')
      expect(s1.row.agclMoles).toBe(2)
      expect(s1.sites.filter((l) => l === 'NH3')).toHaveLength(5)
      expect(s1.sites.filter((l) => l === 'Cl')).toHaveLength(1)
    }

    const s2 = wernerStepState(2)
    expect(s2.kind).toBe('complex')
    if (s2.kind === 'complex') {
      expect(s2.row.colour).toBe('Green')
      expect(s2.row.agclMoles).toBe(1)
      expect(s2.sites[0]).toBe('Cl')
      expect(s2.sites[3]).toBe('Cl')
      expect(s2.sites.filter((l) => l === 'NH3')).toHaveLength(4)
    }
  })

  it('shows green (opposite) beside violet (neighbouring) isomers at step 3', () => {
    const s3 = wernerStepState(3)
    expect(s3.kind).toBe('isomers')
    if (s3.kind === 'isomers') {
      expect(s3.greenSites[0]).toBe('Cl')
      expect(s3.greenSites[3]).toBe('Cl')
      expect(s3.violetSites[0]).toBe('Cl')
      expect(s3.violetSites[1]).toBe('Cl')
      expect(s3.green.agclMoles).toBe(1)
      expect(s3.violet.agclMoles).toBe(1)
    }
  })

  it('produces conductivity ion bars matching 4, 3, 2, 2 at step 4', () => {
    const s4 = wernerStepState(4)
    expect(s4.kind).toBe('conductivity')
    if (s4.kind === 'conductivity') {
      expect(s4.bars.map((b) => b.totalIons)).toEqual([4, 3, 2, 2])
      expect(s4.bars.map((b) => b.electrolyte)).toEqual(['1:3', '1:2', '1:1', '1:1'])
      expect(s4.bars.map((b) => b.counterIons)).toEqual([3, 2, 1, 1])
    }
  })

  it('clamps out-of-range steps safely', () => {
    expect(wernerStepState(-3).stepIndex).toBe(0)
    expect(wernerStepState(99).stepIndex).toBe(WERNER_STEP_COUNT - 1)
  })
})
