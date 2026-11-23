import { describe, expect, it } from 'vitest'
import { NCERT_7_4_2_PHENOL_PREP } from './ncert-c12-unit7-data'
import {
  CHLOROBENZENE_EQUATION_PRESSURE_ATM,
  CHLOROBENZENE_TARGET_TEMP_K,
  DEFAULT_WORKBENCH_STATE,
  DIAZONIUM_TEMP_MAX_K,
  DIAZONIUM_TEMP_MIN_K,
  evaluateWorkbench,
  verifyParsedSpeciesFormulas,
} from './c12-u7-s5-phenol-prep'

describe('Section 7.4.2 phenol prep species & NCERT bindings', () => {
  it('parses every SMILES species to its exact molecular formula', () => {
    expect(verifyParsedSpeciesFormulas()).toEqual([])
  })

  it('matches NCERT 7.4.2 temperature and pressure constants', () => {
    expect(NCERT_7_4_2_PHENOL_PREP).toHaveLength(4)
    expect(CHLOROBENZENE_TARGET_TEMP_K).toBe(623)
    expect(CHLOROBENZENE_EQUATION_PRESSURE_ATM).toBe(300)
    expect(DIAZONIUM_TEMP_MIN_K).toBe(273)
    expect(DIAZONIUM_TEMP_MAX_K).toBe(278)
  })
})

describe('Phenol Synthesis Workbench chemistry rules', () => {
  it('completes chlorobenzene fusion at >= 623 K and >= 300 atm with HCl workup', () => {
    const out = evaluateWorkbench(DEFAULT_WORKBENCH_STATE)
    expect(out.statusKind).toBe('complete')
    expect(out.organicProductsText).toContain('C₆H₅OH')
    expect(out.byProductsText).toContain('NaCl')
  })

  it('blocks chlorobenzene below 623 K or below 300 atm', () => {
    const cold = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, chloroTempK: 500 })
    expect(cold.statusKind).toBe('blocked')
    expect(cold.explanation).toContain('No reaction: aryl C–Cl resists mild NaOH')

    const lowP = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, chloroPressureAtm: 150 })
    expect(lowP.statusKind).toBe('blocked')
    expect(lowP.explanation).toContain('No reaction: aryl C–Cl resists mild NaOH')
  })

  it('traps sodium phenoxide when HCl acidification is OFF', () => {
    const trapped = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, chloroAcidify: false })
    expect(trapped.statusKind).toBe('trapped')
    expect(trapped.activeIntermediateText).toContain('C₆H₅O⁻ Na⁺')
    expect(trapped.productNode.kind).toBe('phenoxide')
  })

  it('enforces oleum -> molten NaOH -> H+ for benzene', () => {
    const noOleum = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'benzene', benzeneStep1: 'none' })
    expect(noOleum.statusKind).toBe('blocked')

    const aqNaoh = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'benzene', benzeneStep2: 'aqueous' })
    expect(aqNaoh.statusKind).toBe('intermediate')
    expect(aqNaoh.intermediateNode.kind).toBe('benzenesulphonicAcid')

    const noAcid = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'benzene', benzeneAcidify: false })
    expect(noAcid.statusKind).toBe('trapped')

    const ok = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'benzene' })
    expect(ok.statusKind).toBe('complete')
    expect(ok.organicProductsText).toContain('C₆H₅OH')
  })

  it('enforces the 273-278 K window and warm hydrolysis for aniline', () => {
    const tooCold = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'aniline', anilineTempK: 270 })
    expect(tooCold.statusKind).toBe('blocked')

    const decomposed = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'aniline', anilineTempK: 295 })
    expect(decomposed.statusKind).toBe('decomposed')
    expect(decomposed.explanation).toContain('premature')

    const coldDiazonium = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'aniline', anilineTempK: 275, anilineStep2: 'cold' })
    expect(coldDiazonium.statusKind).toBe('intermediate')
    expect(coldDiazonium.intermediateNode.kind).toBe('diazonium')

    const ok = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'aniline', anilineTempK: 278, anilineStep2: 'warm' })
    expect(ok.statusKind).toBe('complete')
    expect(ok.byProductsText).toBe('N₂ + HCl')
    expect(ok.gasBubbles).toBe(true)
  })

  it('enforces O2 oxidation then dilute acid cleavage for cumene yielding phenol and acetone', () => {
    const noO2 = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'cumene', cumeneOxygen: false })
    expect(noO2.statusKind).toBe('blocked')

    const peroxy = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'cumene', cumeneOxygen: true, cumeneAcid: false })
    expect(peroxy.statusKind).toBe('intermediate')
    expect(peroxy.intermediateNode.kind).toBe('hydroperoxide')

    const ok = evaluateWorkbench({ ...DEFAULT_WORKBENCH_STATE, substrate: 'cumene', cumeneOxygen: true, cumeneAcid: true })
    expect(ok.statusKind).toBe('complete')
    expect(ok.organicProductsText).toContain('CH₃COCH₃')
    expect(ok.coProductFormula).toBe('CH₃COCH₃')
  })
})
