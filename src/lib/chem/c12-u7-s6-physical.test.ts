import { describe, expect, it } from 'vitest'
import { molecularFormula } from './molecule-parse'
import {
  BOILING_COMPARISON_SETS,
  BP_GAP_ETHANOL_METHOXYMETHANE_K,
  BP_GAP_ETHANOL_PROPANE_K,
  BP_GAP_METHANOL_METHOXYMETHANE_K,
  ROOM_TEMP_K,
  SOLUBILITY_COMPOUNDS,
  boilingSummary,
  getBoilingCompound,
  getBoilingSet,
  getSolubilityCompound,
  phaseAtTemperature,
  solubilitySummary,
} from './c12-u7-s6-physical'

describe('Class 12 Unit 7 Section 7.4.3 physical properties model', () => {
  it('matches all NCERT 7.4.3, 7.5 and 7.6.2 boiling points and gaps', () => {
    expect(BP_GAP_ETHANOL_METHOXYMETHANE_K).toBe(103)
    expect(BP_GAP_ETHANOL_PROPANE_K).toBe(120)
    expect(BP_GAP_METHANOL_METHOXYMETHANE_K).toBe(89)

    const compSet = getBoilingSet('comparable-mass')
    expect(compSet.compounds.map((c) => [c.name, c.molecularMassU, c.bpK])).toEqual([
      ['Propane', 44, 231],
      ['Methoxymethane', 46, 248],
      ['Ethanol', 46, 351],
    ])

    const chainSet = getBoilingSet('chain-length')
    expect(chainSet.compounds.map((c) => [c.name, c.bpK])).toEqual([
      ['Methanol', 337],
      ['Ethanol', 351],
      ['Butan-1-ol', 390],
    ])
  })

  it('keeps qualitative branching order without inventing unprinted boiling points', () => {
    const branchSet = getBoilingSet('branching')
    const [b1, b2, tb] = branchSet.compounds
    expect(b1.name).toBe('Butan-1-ol')
    expect(b1.bpK).toBe(390)
    expect(b2.name).toBe('Butan-2-ol')
    expect(b2.bpK).toBeNull()
    expect(tb.name).toBe('2-Methylpropan-2-ol')
    expect(tb.bpK).toBeNull()
    expect(b1.rankInSet).toBeGreaterThan(b2.rankInSet)
    expect(b2.rankInSet).toBeGreaterThan(tb.rankInSet)
    expect(b1.surfaceContactRating).toBeGreaterThan(b2.surfaceContactRating)
    expect(b2.surfaceContactRating).toBeGreaterThan(tb.surfaceContactRating)
  })

  it('determines liquid vs gas phase accurately relative to boiling point', () => {
    const ethanol = getBoilingCompound('comparable-mass', 'ethanol')
    const ether = getBoilingCompound('comparable-mass', 'methoxymethane')
    const propane = getBoilingCompound('comparable-mass', 'propane')

    expect(phaseAtTemperature(propane, ROOM_TEMP_K).isVapour).toBe(true)
    expect(phaseAtTemperature(ether, ROOM_TEMP_K).isVapour).toBe(true)
    expect(phaseAtTemperature(ethanol, ROOM_TEMP_K).isVapour).toBe(false)
    expect(phaseAtTemperature(ethanol, 351).isVapour).toBe(true)
    expect(phaseAtTemperature(ether, 240).isVapour).toBe(false)

    const tert = getBoilingCompound('branching', '2-methylpropan-2-ol')
    expect(phaseAtTemperature(tert, 298).state).toBe('liquid')
    expect(phaseAtTemperature(tert, 350).state).toBe('transition')
    expect(phaseAtTemperature(tert, 395).isVapour).toBe(true)
  })

  it('validates SMILES and molecular formulas for all boiling and solubility entries', () => {
    for (const set of BOILING_COMPARISON_SETS) {
      for (const item of set.compounds) {
        const mf = molecularFormula(item.graph)
        expect(mf.length).toBeGreaterThan(0)
      }
    }
    expect(molecularFormula(getSolubilityCompound('phenol').graph)).toBe('C6H6O')
    expect(molecularFormula(getSolubilityCompound('propan-1-ol').graph)).toBe('C3H8O')
    expect(molecularFormula(getSolubilityCompound('n-pentane').graph)).toBe('C5H12')
  })

  it('matches NCERT solubility facts and live aria summaries', () => {
    const butanol = getSolubilityCompound('butan-1-ol')
    expect(butanol.statusLabel).toBe('9 g per 100 mL water')
    expect(butanol.hBondsWithWater).toBe(3)

    const pentane = getSolubilityCompound('n-pentane')
    expect(pentane.statusLabel).toBe('essentially immiscible')
    expect(pentane.hBondsWithWater).toBe(0)

    expect(SOLUBILITY_COMPOUNDS).toHaveLength(6)
    expect(boilingSummary(getBoilingSet('comparable-mass'), getBoilingCompound('comparable-mass', 'ethanol'), 298)).toContain('351 K')
    expect(solubilitySummary(butanol)).toContain('9 g per 100 mL water')
  })
})
