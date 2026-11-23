import { describe, expect, it } from 'vitest'
import {
  PHENOL_EAS_STEP_COUNT,
  PHENOL_NAMED_REDOX_STEP_COUNT,
  PHENOL_PATHWAYS,
  clampStep,
  findNcertPhenolRecord,
  getPathway,
  nitrophenolPkaData,
} from './c12-u7-s9-phenols'
import { NCERT_7_4_4_PHENOL_REACTIONS } from './ncert-c12-unit7-data'

describe('Section 7.4.4 Reactions of Phenols data model', () => {
  it('covers all 9 NCERT Section 7.4.4(c) pathways mapped to shared Unit 7 records', () => {
    expect(PHENOL_PATHWAYS).toHaveLength(9)
    const ids = new Set(PHENOL_PATHWAYS.map((p) => p.id))
    expect(ids.size).toBe(9)

    const coveredRecords = new Set(PHENOL_PATHWAYS.map((p) => p.ncertRecordId))
    for (const rec of NCERT_7_4_4_PHENOL_REACTIONS) {
      expect(coveredRecords.has(rec.id)).toBe(true)
      expect(findNcertPhenolRecord(rec.id).id).toBe(rec.id)
    }
  })

  it('matches NCERT temperatures and reagents accurately', () => {
    const dilute = getPathway('nitration-dilute')
    expect(dilute.temperatureText).toBe('298 K')
    expect(dilute.reagents).toBe('Dilute HNO₃')
    expect(dilute.hasHBondComparison).toBe(true)

    const monoBr = getPathway('bromination-cs2')
    expect(monoBr.temperatureText).toBe('273 K')
    expect(monoBr.solvent).toContain('CS₂')
    expect(monoBr.catalystNote).toContain('No FeBr₃')
    expect(monoBr.hasBr2PolarisationComparison).toBe(true)

    const brWater = getPathway('bromination-water')
    expect(brWater.reagents).toContain('3 Br₂')
    expect(brWater.minorOrByProducts).toContain('3 HBr')
    expect(brWater.isPrecipitate).toBe(true)
  })

  it('flags direct conc. HNO₃ as poor yield and modern route as two-step via disulphonic acid', () => {
    const conc = getPathway('nitration-conc')
    expect(conc.isPoorYield).toBe(true)
    expect(conc.observationNote.toLowerCase()).toContain('poor yield')

    const modern = getPathway('nitration-modern')
    expect(modern.multiSteps).toHaveLength(2)
    expect(modern.multiSteps?.[0].intermediateOrProduct.name).toBe('Phenol-2,4-disulphonic acid')
    expect(modern.multiSteps?.[1].intermediateOrProduct.name).toBe('2,4,6-Trinitrophenol')
  })

  it('models Kolbe and Reimer-Tiemann multi-step intermediates accurately', () => {
    const kolbe = getPathway('kolbe')
    expect(kolbe.multiSteps).toHaveLength(2)
    expect(kolbe.multiSteps?.[0].intermediateOrProduct.name).toBe('Sodium phenoxide')
    expect(kolbe.multiSteps?.[1].intermediateOrProduct.name).toBe('2-Hydroxybenzoic acid')

    const rt = getPathway('reimer-tiemann')
    expect(rt.multiSteps).toHaveLength(3)
    expect(rt.multiSteps?.[0].intermediateOrProduct.bracketed).toBe(true)
    expect(rt.multiSteps?.[0].intermediateOrProduct.name).toBe('Substituted benzal chloride')
    expect(rt.multiSteps?.[1].intermediateOrProduct.name).toBe('o-Formyl phenoxide')
    expect(rt.multiSteps?.[2].intermediateOrProduct.name).toBe('Salicylaldehyde')
  })

  it('includes NCERT Table 7.3 pKa values and redox pathways', () => {
    const pkas = nitrophenolPkaData()
    expect(pkas.phenol.printed).toBe('10.0')
    expect(pkas.oNitrophenol.printed).toBe('7.2')
    expect(pkas.pNitrophenol.printed).toBe('7.1')

    const zn = getPathway('zinc-dust')
    expect(zn.majorProduct).toContain('Benzene')
    expect(zn.minorOrByProducts).toContain('ZnO')

    const ox = getPathway('chromic-oxidation')
    expect(ox.majorProduct).toContain('Benzoquinone')
    expect(ox.observationNote.toLowerCase()).toContain('air')
  })

  it('clamps scrolly step indices safely', () => {
    expect(PHENOL_EAS_STEP_COUNT).toBe(5)
    expect(PHENOL_NAMED_REDOX_STEP_COUNT).toBe(5)
    expect(clampStep(-2, 5)).toBe(0)
    expect(clampStep(9, 5)).toBe(4)
    expect(clampStep(2.4, 5)).toBe(2)
  })
})
