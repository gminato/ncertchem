import { describe, expect, it } from 'vitest'
import {
  COMMERCIAL_BPS,
  FERMENTATION_LIMITS,
  METHANOL_WINDOW,
  evaluateDenaturationAndProperties,
  evaluateFermentation,
  evaluateMethanolReactor,
} from './c12-u7-s10-alcohols'

describe('Commercial alcohols constants (NCERT Section 7.5)', () => {
  it('matches NCERT boiling points and 14 K difference', () => {
    expect(COMMERCIAL_BPS.methanolK).toBe(337)
    expect(COMMERCIAL_BPS.ethanolK).toBe(351)
    expect(COMMERCIAL_BPS.deltaK).toBe(14)
  })

  it('matches NCERT optimal methanol window and 14% zymase limit', () => {
    expect(METHANOL_WINDOW.optimalPressureMinAtm).toBe(200)
    expect(METHANOL_WINDOW.optimalPressureMaxAtm).toBe(300)
    expect(METHANOL_WINDOW.optimalTemperatureMinK).toBe(573)
    expect(METHANOL_WINDOW.optimalTemperatureMaxK).toBe(673)
    expect(FERMENTATION_LIMITS.zymaseInhibitionPercent).toBe(14)
  })
})

describe('evaluateMethanolReactor', () => {
  it('gives 0% conversion when catalyst is none', () => {
    const res = evaluateMethanolReactor({
      catalyst: 'none',
      pressureAtm: 250,
      temperatureK: 620,
    })
    expect(res.conversionPercent).toBe(0)
    expect(res.isOptimal).toBe(false)
  })

  it('gives high conversion (90-95%) inside 200-300 atm and 573-673 K over ZnO-Cr2O3', () => {
    const mid = evaluateMethanolReactor({
      catalyst: 'zno-cr2o3',
      pressureAtm: 250,
      temperatureK: 620,
    })
    expect(mid.isOptimal).toBe(true)
    expect(mid.conversionPercent).toBeGreaterThanOrEqual(90)
    expect(mid.conversionPercent).toBeLessThanOrEqual(95)

    const edge = evaluateMethanolReactor({
      catalyst: 'zno-cr2o3',
      pressureAtm: 200,
      temperatureK: 573,
    })
    expect(edge.isOptimal).toBe(true)
    expect(edge.conversionPercent).toBeGreaterThanOrEqual(90)
  })

  it('drops conversion steeply at low pressure or low temperature', () => {
    const lowP = evaluateMethanolReactor({
      catalyst: 'zno-cr2o3',
      pressureAtm: 60,
      temperatureK: 620,
    })
    const lowT = evaluateMethanolReactor({
      catalyst: 'zno-cr2o3',
      pressureAtm: 250,
      temperatureK: 380,
    })
    expect(lowP.conversionPercent).toBeLessThan(40)
    expect(lowT.conversionPercent).toBeLessThan(20)
  })
})

describe('evaluateFermentation', () => {
  it('yields 0% ethanol when feedstock is sucrose and invertase is absent', () => {
    const res = evaluateFermentation({
      feedstock: 'sucrose',
      invertasePresent: false,
      seal: 'anaerobic',
      batchProgress: 80,
    })
    expect(res.hexosesReady).toBe(false)
    expect(res.ethanolPercent).toBe(0)
    expect(res.co2Rate).toBe(0)
  })

  it('ferments grape juice directly even if invertase toggle is off', () => {
    const res = evaluateFermentation({
      feedstock: 'grape-juice',
      invertasePresent: false,
      seal: 'anaerobic',
      batchProgress: 50,
    })
    expect(res.hexosesReady).toBe(true)
    expect(res.ethanolPercent).toBe(9)
    expect(res.zymaseInhibited).toBe(false)
  })

  it('caps anaerobic fermentation at 14% and inhibits zymase beyond 14%', () => {
    const res = evaluateFermentation({
      feedstock: 'sucrose',
      invertasePresent: true,
      seal: 'anaerobic',
      batchProgress: 100,
    })
    expect(res.ethanolPercent).toBe(14)
    expect(res.zymaseInhibited).toBe(true)
    expect(res.co2Rate).toBe(0)
    expect(res.zymaseStatus).toContain('14%')
  })

  it('oxidises ethanol to ethanoic acid and spoils taste on air leak', () => {
    const res = evaluateFermentation({
      feedstock: 'sucrose',
      invertasePresent: true,
      seal: 'air-leak',
      batchProgress: 60,
    })
    expect(res.ethanoicAcidPercent).toBeGreaterThan(0)
    expect(res.ethanolPercent).toBeLessThan(10.8)
    expect(res.tasteStatus).toContain('Sour / Spoiled')
  })
})

describe('evaluateDenaturationAndProperties', () => {
  it('returns 337 K and blindness/death warning for methanol', () => {
    const res = evaluateDenaturationAndProperties({
      alcohol: 'methanol',
      ethanolRoute: 'fermentation',
      hasCopperSulphate: true,
      hasPyridine: true,
    })
    expect(res.bpK).toBe(337)
    expect(res.safetyBadge).toContain('Poisonous')
    expect(res.liquidTint).toBe('clear')
  })

  it('marks ethanol as denatured when copper sulphate and pyridine are added', () => {
    const res = evaluateDenaturationAndProperties({
      alcohol: 'ethanol',
      ethanolRoute: 'ethene-hydration',
      hasCopperSulphate: true,
      hasPyridine: true,
    })
    expect(res.bpK).toBe(351)
    expect(res.isFullyDenatured).toBe(true)
    expect(res.liquidTint).toBe('blue')
    expect(res.hasOdourVapour).toBe(true)
    expect(res.equation).toContain('CH₂=CH₂')
  })
})
