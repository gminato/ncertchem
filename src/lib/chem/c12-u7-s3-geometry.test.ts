import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import { NCERT_FIG_7_1_STRUCTURES, TETRAHEDRAL_ANGLE } from './ncert-c12-unit7-data'
import {
  MOLECULE_ORDER,
  buildGeometryReadout,
  formatBondAngle,
  formatOhBondLength,
  formatSignedDeviation,
  geometryRecord,
  geometrySummary,
  methanolPhenolBondDiffPm,
  tetrahedralDeviationDeg,
} from './c12-u7-s3-geometry'

describe('NCERT Fig. 7.1 and Section 7.3 geometry data', () => {
  it('exposes all three molecules in canonical order with exact NCERT values', () => {
    expect(MOLECULE_ORDER).toEqual(['methanol', 'phenol', 'methoxymethane'])
    expect(NCERT_FIG_7_1_STRUCTURES.map((r) => r.coBondLengthPm)).toEqual([142, 136, 141])
    expect(NCERT_FIG_7_1_STRUCTURES.map((r) => r.bondAngleDeg)).toEqual([108.9, 109, 111.7])
    expect(NCERT_FIG_7_1_STRUCTURES.map((r) => r.carbonHybridisation)).toEqual(['sp³', 'sp²', 'sp³'])
  })

  it('computes methanol vs phenol C–O bond contraction as 6 pm', () => {
    expect(methanolPhenolBondDiffPm()).toBe(6)
  })

  it('computes accurate signed deviations from 109°28′ tetrahedral reference', () => {
    expect(TETRAHEDRAL_ANGLE.printed).toBe('109°28′')
    expect(formatSignedDeviation(tetrahedralDeviationDeg(108.9))).toBe('−0.57°')
    expect(formatSignedDeviation(tetrahedralDeviationDeg(109))).toBe('−0.47°')
    expect(formatSignedDeviation(tetrahedralDeviationDeg(111.7))).toBe('+2.23°')
  })

  it('handles O–H bond length reporting faithfully without inventing unprinted numbers', () => {
    expect(formatOhBondLength(geometryRecord('methanol'))).toBe('96 pm')
    expect(formatOhBondLength(geometryRecord('phenol'))).toBe('Not printed in Fig. 7.1')
    expect(formatOhBondLength(geometryRecord('methoxymethane'))).toBe('N/A')
  })

  it('formats NCERT bond angles faithfully', () => {
    expect(formatBondAngle(108.9)).toBe('108.9°')
    expect(formatBondAngle(109)).toBe('109°')
    expect(formatBondAngle(111.7)).toBe('111.7°')
  })

  it('builds complete readout and aria summary strings', () => {
    const phenol = buildGeometryReadout('phenol')
    expect(phenol.sCharacterPercent).toBe('33.3% s-character')
    expect(phenol.ohBondDisplay).toBe('Not printed in Fig. 7.1')
    expect(phenol.angleDisplay).toBe('109°')
    expect(phenol.deviationDisplay).toBe('−0.47°')
    expect(geometrySummary('methoxymethane')).toContain('111.7° (+2.23° vs 109°28′)')
  })

  it('parses the SMILES of all three molecules into their exact formulas', () => {
    expect(molecularFormula(parseSmiles(geometryRecord('methanol').smiles))).toBe('CH4O')
    expect(molecularFormula(parseSmiles(geometryRecord('phenol').smiles))).toBe('C6H6O')
    expect(molecularFormula(parseSmiles(geometryRecord('methoxymethane').smiles))).toBe('C2H6O')
  })
})
