import { describe, expect, it } from 'vitest'
import { iupacNameFromSmiles } from './iupac-organic'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  NCERT_7_4_1_ALCOHOL_PREP,
  NCERT_7_4_2_PHENOL_PREP,
  NCERT_7_4_3_BOILING_COMPARISON,
  NCERT_7_4_4_ALCOHOL_DEHYDRATION,
  NCERT_7_4_4_ALCOHOL_REACTIONS,
  NCERT_7_4_4_PHENOL_REACTIONS,
  NCERT_7_5_COMMERCIAL_ALCOHOLS,
  NCERT_7_6_1_ETHER_PREP,
  NCERT_7_6_2_BOILING_COMPARISON,
  NCERT_7_6_2_WATER_MISCIBILITY,
  NCERT_7_6_3_ANISOLE_EAS,
  NCERT_7_6_3_CLEAVAGE_CASES,
  NCERT_COMMERCIAL_ALCOHOL_BP_K,
  NCERT_CYCLIC_ALCOHOLS,
  NCERT_FIG_7_1_STRUCTURES,
  NCERT_PHENOL_NAMES,
  NCERT_TABLE_7_1,
  NCERT_TABLE_7_2,
  NCERT_TABLE_7_3,
  NCERT_UNIT7_BOILING_POINTS_K,
  NCERT_UNIT7_NOTES,
  NCERT_UNIT7_ORDERS,
  TETRAHEDRAL_ANGLE,
} from './ncert-c12-unit7-data'

describe('Table 7.1, cyclic alcohols and phenol nomenclature', () => {
  it('has exact NCERT counts and non-empty fields', () => {
    expect(NCERT_TABLE_7_1).toHaveLength(9)
    expect(NCERT_CYCLIC_ALCOHOLS).toHaveLength(2)
    expect(NCERT_PHENOL_NAMES).toHaveLength(7)

    for (const row of [...NCERT_TABLE_7_1, ...NCERT_CYCLIC_ALCOHOLS, ...NCERT_PHENOL_NAMES]) {
      expect(row.unicode.trim().length).toBeGreaterThan(0)
      expect(row.ce.trim().length).toBeGreaterThan(0)
      expect(row.smiles.trim().length).toBeGreaterThan(0)
      expect(row.iupac.trim().length).toBeGreaterThan(0)
      expect(() => parseSmiles(row.smiles)).not.toThrow()
    }
  })

  it('Table 7.1, cyclic alcohols and monohydric phenols name to NCERT IUPAC names', () => {
    for (const row of [...NCERT_TABLE_7_1, ...NCERT_CYCLIC_ALCOHOLS]) {
      expect(iupacNameFromSmiles(row.smiles)).toBe(row.iupac.toLowerCase())
    }
    for (const row of NCERT_PHENOL_NAMES.slice(0, 4)) {
      expect(iupacNameFromSmiles(row.smiles)).toBe(row.iupac.toLowerCase())
    }
    // Dihydroxybenzenes parse cleanly with formula C6H6O2
    for (const row of NCERT_PHENOL_NAMES.slice(4)) {
      expect(molecularFormula(parseSmiles(row.smiles))).toBe('C6H6O2')
    }
  })
})

describe('Table 7.2 ethers', () => {
  it('has all 10 NCERT ether rows with valid SMILES and non-empty IUPAC names', () => {
    expect(NCERT_TABLE_7_2).toHaveLength(10)
    expect(NCERT_TABLE_7_2.filter((r) => r.common === null)).toHaveLength(2)

    for (const row of NCERT_TABLE_7_2) {
      expect(row.unicode.trim().length).toBeGreaterThan(0)
      expect(row.ce.trim().length).toBeGreaterThan(0)
      expect(row.iupac.trim().length).toBeGreaterThan(0)
      expect(() => parseSmiles(row.smiles)).not.toThrow()
    }

    // 1-Phenoxyheptane uses heptane as parent in NCERT, whereas iupac-organic uses benzene parent;
    // the remaining 9 ethers match iupacNameFromSmiles directly (via iupac or iupacAlt).
    for (const row of NCERT_TABLE_7_2) {
      if (row.iupac === '1-Phenoxyheptane') {
        expect(molecularFormula(parseSmiles(row.smiles))).toBe('C13H20O')
      } else {
        const accepted = [row.iupac, row.iupacAlt].filter(Boolean).map((n) => n!.toLowerCase())
        expect(accepted).toContain(iupacNameFromSmiles(row.smiles))
      }
    }
  })
})

describe('Fig. 7.1 bond lengths and bond angles', () => {
  it('matches NCERT Fig. 7.1 exact numbers and structural ordering', () => {
    expect(NCERT_FIG_7_1_STRUCTURES).toHaveLength(3)
    const [methanol, phenol, methoxymethane] = NCERT_FIG_7_1_STRUCTURES

    expect(methanol.coBondLengthPm).toBe(142)
    expect(methanol.ohBondLengthPm).toBe(96)
    expect(methanol.bondAngleDeg).toBe(108.9)

    expect(phenol.coBondLengthPm).toBe(136)
    expect(phenol.ohBondLengthPm).toBeNull()
    expect(phenol.bondAngleDeg).toBe(109)

    expect(methoxymethane.coBondLengthPm).toBe(141)
    expect(methoxymethane.ohBondLengthPm).toBeNull()
    expect(methoxymethane.bondAngleDeg).toBe(111.7)

    // C–O bond in phenol is shortest (sp² + conjugation); methanol and methoxymethane are nearly equal
    expect(phenol.coBondLengthPm).toBeLessThan(methoxymethane.coBondLengthPm)
    expect(methoxymethane.coBondLengthPm).toBeLessThan(methanol.coBondLengthPm)

    // Alcohol/phenol C–O–H < tetrahedral (109°28′) < ether C–O–C
    expect(methanol.bondAngleDeg).toBeLessThan(TETRAHEDRAL_ANGLE.deg)
    expect(phenol.bondAngleDeg).toBeLessThan(TETRAHEDRAL_ANGLE.deg)
    expect(methoxymethane.bondAngleDeg).toBeGreaterThan(TETRAHEDRAL_ANGLE.deg)
  })
})

describe('Physical properties (7.4.3, 7.5 and 7.6.2)', () => {
  it('orders comparable-mass boiling points: alcohol >> ether > alkane in 7.4.3', () => {
    expect(NCERT_7_4_3_BOILING_COMPARISON).toHaveLength(3)
    const [ethanol, methoxymethane, propane] = NCERT_7_4_3_BOILING_COMPARISON
    expect(ethanol.bpK).toBe(351)
    expect(methoxymethane.bpK).toBe(248)
    expect(propane.bpK).toBe(231)
    expect(ethanol.bpK).toBeGreaterThan(methoxymethane.bpK)
    expect(methoxymethane.bpK).toBeGreaterThan(propane.bpK)
  })

  it('orders 7.6.2 boiling points and water miscibilities accurately', () => {
    expect(NCERT_7_6_2_BOILING_COMPARISON).toHaveLength(3)
    const [pentane, ethoxyethane, butanol] = NCERT_7_6_2_BOILING_COMPARISON
    expect(pentane.bpK).toBe(309.1)
    expect(ethoxyethane.bpK).toBe(307.6)
    expect(butanol.bpK).toBe(390)
    expect(butanol.bpK).toBeGreaterThan(pentane.bpK)
    expect(pentane.bpK).toBeGreaterThan(ethoxyethane.bpK)

    expect(NCERT_7_6_2_WATER_MISCIBILITY).toHaveLength(3)
    const [etherSol, alcSol, alkSol] = NCERT_7_6_2_WATER_MISCIBILITY
    expect(etherSol.gPer100MlWater).toBe(7.5)
    expect(alcSol.gPer100MlWater).toBe(9)
    expect(alkSol.gPer100MlWater).toBeNull()
    expect(alcSol.gPer100MlWater!).toBeGreaterThan(etherSol.gPer100MlWater!)
  })

  it('collects all 7 printed Unit 7 boiling points with valid SMILES', () => {
    expect(NCERT_UNIT7_BOILING_POINTS_K).toHaveLength(7)
    expect(NCERT_COMMERCIAL_ALCOHOL_BP_K.methanol).toBe(337)
    expect(NCERT_COMMERCIAL_ALCOHOL_BP_K.ethanol).toBe(351)
    for (const row of NCERT_UNIT7_BOILING_POINTS_K) {
      expect(row.bpK).toBeGreaterThan(0)
      expect(row.printedBp.length).toBeGreaterThan(0)
      expect(() => parseSmiles(row.smiles)).not.toThrow()
    }
  })
})

describe('Table 7.3 pKa values and acidity order', () => {
  it('has all 8 Table 7.3 entries with valid SMILES and exact pKa values', () => {
    expect(NCERT_TABLE_7_3).toHaveLength(8)
    for (const row of NCERT_TABLE_7_3) {
      expect(row.unicode.trim().length).toBeGreaterThan(0)
      expect(row.ce.trim().length).toBeGreaterThan(0)
      expect(row.printed.trim().length).toBeGreaterThan(0)
      expect(() => parseSmiles(row.smiles)).not.toThrow()
      expect(iupacNameFromSmiles(row.smiles).length).toBeGreaterThan(0)
    }
  })

  it('ranks acidity strictly by increasing pKa (p-nitrophenol strongest, ethanol weakest)', () => {
    const sortedNames = [...NCERT_TABLE_7_3]
      .sort((a, b) => a.pKa - b.pKa)
      .map((r) => `${r.name}:${r.pKa}`)

    expect(sortedNames).toEqual([
      'p-Nitrophenol:7.1',
      'o-Nitrophenol:7.2',
      'm-Nitrophenol:8.3',
      'Phenol:10',
      'm-Cresol:10.1',
      'o-Cresol:10.2',
      'p-Cresol:10.2',
      'Ethanol:15.9',
    ])

    const phenol = NCERT_TABLE_7_3.find((r) => r.name === 'Phenol')!
    const ethanol = NCERT_TABLE_7_3.find((r) => r.name === 'Ethanol')!
    expect(ethanol.pKa - phenol.pKa).toBeCloseTo(5.9, 6)
  })
})

describe('Reactions, conditions, commercial processes and notes', () => {
  it('has non-empty reaction records across 7.4.1, 7.4.2, 7.4.4, 7.6.3', () => {
    const allRecords = [
      ...NCERT_7_4_1_ALCOHOL_PREP,
      ...NCERT_7_4_2_PHENOL_PREP,
      ...NCERT_7_4_4_ALCOHOL_DEHYDRATION,
      ...NCERT_7_4_4_ALCOHOL_REACTIONS,
      ...NCERT_7_4_4_PHENOL_REACTIONS,
    ]
    expect(NCERT_7_4_1_ALCOHOL_PREP).toHaveLength(7)
    expect(NCERT_7_4_2_PHENOL_PREP).toHaveLength(4)
    expect(NCERT_7_4_4_ALCOHOL_DEHYDRATION).toHaveLength(3)
    expect(NCERT_7_4_4_ALCOHOL_REACTIONS).toHaveLength(8)
    expect(NCERT_7_4_4_PHENOL_REACTIONS).toHaveLength(8)

    for (const rec of allRecords) {
      expect(rec.id.trim().length).toBeGreaterThan(0)
      expect(rec.title.trim().length).toBeGreaterThan(0)
      expect(rec.reagents.trim().length).toBeGreaterThan(0)
      expect(rec.conditions.trim().length).toBeGreaterThan(0)
      expect(rec.majorProducts.trim().length).toBeGreaterThan(0)
    }
  })

  it('orders alcohol dehydration temperatures 1° > 2° > 3° as conditions get milder', () => {
    const temps = NCERT_7_4_4_ALCOHOL_DEHYDRATION.map((r) => r.temperatureK as number)
    expect(temps).toEqual([443, 440, 358])
    expect(temps[0]).toBeGreaterThan(temps[1])
    expect(temps[1]).toBeGreaterThan(temps[2])
  })

  it('captures commercial methanol/ethanol conditions, Williamson, ether cleavage and anisole EAS', () => {
    expect(NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.catalyst).toBe('ZnO–Cr₂O₃')
    expect(NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.pressureAtm).toEqual([200, 300])
    expect(NCERT_7_5_COMMERCIAL_ALCOHOLS.methanol.temperatureK).toEqual([573, 673])
    expect(NCERT_7_5_COMMERCIAL_ALCOHOLS.ethanol.fermentationSteps.map((s) => s.enzyme)).toEqual(['Invertase', 'Zymase'])
    expect(NCERT_7_5_COMMERCIAL_ALCOHOLS.ethanol.zymaseInhibitionPercent).toBe(14)

    expect(NCERT_7_6_1_ETHER_PREP.ethanolDehydrationBranching.map((b) => b.temperatureK)).toEqual([413, 443])
    expect(NCERT_7_6_3_CLEAVAGE_CASES).toHaveLength(4)
    expect(NCERT_7_6_3_ANISOLE_EAS).toHaveLength(4)
    expect(NCERT_7_6_3_ANISOLE_EAS[0].majorYieldPercent).toBe(90)

    expect(Object.values(NCERT_UNIT7_ORDERS).every((v) => v.length > 0)).toBe(true)
    expect(NCERT_UNIT7_NOTES.length).toBeGreaterThanOrEqual(6)
  })
})
