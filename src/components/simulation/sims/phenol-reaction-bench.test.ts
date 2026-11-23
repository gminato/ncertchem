import { describe, expect, it } from 'vitest'
import {
  PHENOL_GROUP_LABELS,
  PHENOL_PATHWAYS,
  getPathway,
  type PhenolPathwayId,
} from '@/lib/chem/c12-u7-s9-phenols'

describe('phenol-reaction-bench simulation logic', () => {
  it('provides exactly the 9 NCERT 7.4.4(c) pathways across 4 groups', () => {
    const expectedIds: PhenolPathwayId[] = [
      'nitration-dilute',
      'nitration-conc',
      'nitration-modern',
      'bromination-cs2',
      'bromination-water',
      'kolbe',
      'reimer-tiemann',
      'zinc-dust',
      'chromic-oxidation',
    ]
    expect(PHENOL_PATHWAYS.map((p) => p.id)).toEqual(expectedIds)
    expect(Object.keys(PHENOL_GROUP_LABELS)).toEqual([
      'nitration',
      'bromination',
      'named',
      'redox',
    ])
  })

  it('activates multi-step intermediates exclusively for two- and three-step pathways', () => {
    const multi = PHENOL_PATHWAYS.filter((p) => Boolean(p.multiSteps)).map((p) => p.id)
    expect(multi).toEqual(['nitration-modern', 'kolbe', 'reimer-tiemann'])

    expect(getPathway('nitration-modern').multiSteps?.map((s) => s.label)).toEqual([
      'Step 1',
      'Final Product',
    ])
    expect(getPathway('kolbe').multiSteps?.map((s) => s.label)).toEqual([
      'Step 1',
      'Final Product',
    ])
    expect(getPathway('reimer-tiemann').multiSteps?.map((s) => s.label)).toEqual([
      'Step 1',
      'Step 2',
      'Final Product',
    ])
  })

  it('enables H-bonding comparison for dilute nitration and Br2 polarisation for bromination', () => {
    expect(getPathway('nitration-dilute').hasHBondComparison).toBe(true)
    expect(getPathway('bromination-cs2').hasBr2PolarisationComparison).toBe(true)
    expect(getPathway('bromination-water').hasBr2PolarisationComparison).toBe(true)
  })
})
