import { describe, expect, it } from 'vitest'
import {
  LIGAND_SET_CASES,
  NCERT_CHIRAL_CASES,
  NCERT_GEOMETRIC_CASES,
  NCERT_ISOMER_PAIRS,
  casesForGeometry,
  getLigandSetCase,
  getPairExplanations,
} from './isomer-lab'

describe('isomer-lab domain logic', () => {
  it('matches all 6 NCERT_GEOMETRIC_CASES counts and labels', () => {
    const mapIds: Record<string, string> = {
      MX2L2: 'sq-mx2l2',
      MABXL: 'sq-mabxl',
      MX2L4: 'oct-mx2l4',
      'MX2(L-L)2': 'oct-mx2ll2',
      Ma3b3: 'oct-ma3b3',
      'tetrahedral with two kinds of unidentate ligand': 'tet-mx2l2',
    }
    for (const nc of NCERT_GEOMETRIC_CASES) {
      const labCase = LIGAND_SET_CASES.find((c) => c.id === mapIds[nc.formula])
      expect(labCase).toBeDefined()
      expect(labCase!.geometry).toBe(nc.geometry)
      expect(labCase!.geometricIsomerCount).toBe(nc.isomers)
      expect(labCase!.isomers).toHaveLength(nc.isomers)
      if (nc.labels.length > 0) {
        expect(labCase!.isomers.map((i) => i.label)).toEqual(nc.labels)
      }
    }
  })

  it('matches NCERT_CHIRAL_CASES for tris-chelate and cis/trans MX2(L-L)2', () => {
    const tris = getLigandSetCase('oct-mll3')
    expect(tris.isomers[0].chiral).toBe(NCERT_CHIRAL_CASES[0].chiral)

    const mx2ll2 = getLigandSetCase('oct-mx2ll2')
    const cis = mx2ll2.isomers.find((i) => i.id === 'cis')
    const trans = mx2ll2.isomers.find((i) => i.id === 'trans')
    expect(cis?.chiral).toBe(NCERT_CHIRAL_CASES[1].chiral)
    expect(trans?.chiral).toBe(NCERT_CHIRAL_CASES[2].chiral)
  })

  it('provides geometry filtering and explanations for all 10 NCERT_ISOMER_PAIRS', () => {
    expect(casesForGeometry('square planar').length).toBeGreaterThanOrEqual(2)
    expect(casesForGeometry('octahedral').length).toBeGreaterThanOrEqual(3)
    expect(casesForGeometry('tetrahedral')).toHaveLength(1)

    const pairs = getPairExplanations()
    expect(pairs).toHaveLength(NCERT_ISOMER_PAIRS.length)
    for (const p of pairs) {
      expect(p.whatChanged.length).toBeGreaterThan(10)
      expect(p.kindInfo.id).toBe(p.pair.kind)
    }
    expect(pairs[6].colourHint).toBeDefined()
    expect(pairs[9].colourHint).toBeDefined()
  })
})
