import { describe, expect, it } from 'vitest'
import { ELECTROLYSIS_CASES, electrolysisProducts, type ElectrolysisCaseId } from './electrolysis'
import {
  E0_PERSULFATE,
  predictElectrolysis,
  resolveCase,
  type Candidate,
  type PredictorCaseId,
} from './electrolysis-predictor'

const winner = (list: readonly Candidate[]) => list.filter((c) => c.selected)

describe('predictElectrolysis: winners', () => {
  it('molten NaCl: Na at the cathode, Cl2 at the anode, no competition', () => {
    const p = predictElectrolysis('molten-NaCl')
    expect(winner(p.cathode)[0].product).toBe('Na')
    expect(winner(p.anode)[0].product).toBe('Cl₂')
    expect(p.cathode).toHaveLength(1)
  })

  it('aqueous NaCl: H⁺ from water beats Na⁺ at the cathode (0.00 vs −2.71 V)', () => {
    const p = predictElectrolysis('aqueous-NaCl-inert')
    expect(winner(p.cathode)[0].couple).toBe('H⁺/H₂')
    expect(winner(p.cathode)[0].e0).toBe(0)
    expect(winner(p.cathode)[0].half).toBe('H₂O + e⁻ → ½H₂ + OH⁻')
    expect(p.cathode.find((c) => c.key === 'sodium')?.e0).toBe(-2.71)
  })

  it('no case lists the H₂O/H₂ couple at −0.83 V as a competitor', () => {
    for (const id of ELECTROLYSIS_CASES.map((c) => c.id) as PredictorCaseId[]) {
      const p = predictElectrolysis(id)
      for (const c of [...p.cathode, ...p.anode]) expect(c.e0).not.toBe(-0.83)
    }
  })

  it('aqueous NaCl: Cl2 wins at the anode even though O2 has the lower E°', () => {
    const p = predictElectrolysis('aqueous-NaCl-inert')
    const o2 = p.anode.find((c) => c.isOxygen)
    expect(o2?.e0).toBe(1.23)
    expect(o2?.selected).toBe(false)
    expect(winner(p.anode)[0].product).toBe('Cl₂')
    expect(p.reason).toBe('overpotential-of-O2')
  })

  it('dilute H2SO4: O2 at the anode, H2 at the cathode', () => {
    const p = predictElectrolysis('dilute-H2SO4-inert')
    expect(winner(p.anode)[0].product).toBe('O₂')
    expect(winner(p.cathode)[0].product).toBe('H₂')
    expect(p.reason).toBe('lower-E°')
  })

  it('concentrated H2SO4: persulfate at the anode (1.96 V), H2 at the cathode', () => {
    const p = predictElectrolysis('concentrated-H2SO4-inert')
    expect(winner(p.anode)[0].product).toBe('S₂O₈²⁻')
    expect(winner(p.anode)[0].e0).toBe(E0_PERSULFATE)
    expect(p.reason).toBe('concentration-favours-persulfate')
  })

  it('CuSO4 with Pt: Cu deposits, O2 evolves', () => {
    const p = predictElectrolysis('aqueous-CuSO4-Pt-electrodes')
    expect(winner(p.cathode)[0].product).toBe('Cu')
    expect(winner(p.anode)[0].product).toBe('O₂')
  })

  it('CuSO4 with Cu electrodes: the anode dissolves (0.34 V beats 1.23 V)', () => {
    const p = predictElectrolysis('aqueous-CuSO4-Cu-electrodes')
    expect(winner(p.anode)[0].dissolves).toBe(true)
    expect(p.reason).toBe('active-anode-dissolves')
  })

  it('AgNO3 with Pt: Ag deposits (0.80 V beats H⁺/H₂ at 0.00 V), O2 evolves', () => {
    const p = predictElectrolysis('aqueous-AgNO3-Pt-electrodes')
    expect(winner(p.cathode)[0].product).toBe('Ag')
    expect(winner(p.anode)[0].product).toBe('O₂')
  })

  it('AgNO3 with Ag electrodes: the anode dissolves', () => {
    const p = predictElectrolysis('aqueous-AgNO3-Ag-electrodes')
    expect(winner(p.anode)[0].dissolves).toBe(true)
    expect(p.reason).toBe('active-anode-dissolves')
  })

  it('KBr with Pt: K⁺ loses to water at the cathode; Br2 (1.09 V) beats O2 (1.23 V) at the anode', () => {
    const p = predictElectrolysis('aqueous-KBr-Pt-electrodes')
    expect(winner(p.cathode)[0].product).toBe('H₂')
    expect(winner(p.anode)[0].product).toBe('Br₂')
    expect(winner(p.anode)[0].e0).toBe(1.09)
    expect(p.reason).toBe('lower-E°')
  })
})

describe('predictElectrolysis agrees with electrolysis.ts (F1)', () => {
  const f1Ids = ELECTROLYSIS_CASES.map((c) => c.id) as PredictorCaseId[]
  it.each(f1Ids)('%s: same reason as the F1 case', (id) => {
    const p = predictElectrolysis(id)
    const f1 = electrolysisProducts(id as ElectrolysisCaseId)
    expect(p.reason).toBe(f1.reason)
  })

  it('every case has exactly one selected candidate per electrode', () => {
    for (const id of f1Ids) {
      const p = predictElectrolysis(id)
      expect(winner(p.cathode)).toHaveLength(1)
      expect(winner(p.anode)).toHaveLength(1)
    }
  })
})

describe('resolveCase', () => {
  it('maps the simulation choices to the expected cases', () => {
    expect(resolveCase('molten-nacl', 'dilute', 'inert')).toBe('molten-NaCl')
    expect(resolveCase('aqueous-nacl', 'dilute', 'inert')).toBe('aqueous-NaCl-inert')
    expect(resolveCase('h2so4', 'dilute', 'inert')).toBe('dilute-H2SO4-inert')
    expect(resolveCase('h2so4', 'concentrated', 'inert')).toBe('concentrated-H2SO4-inert')
    expect(resolveCase('cuso4', 'dilute', 'reactive')).toBe('aqueous-CuSO4-Cu-electrodes')
    expect(resolveCase('agno3', 'dilute', 'inert')).toBe('aqueous-AgNO3-Pt-electrodes')
    expect(resolveCase('kbr', 'dilute', 'inert')).toBe('aqueous-KBr-Pt-electrodes')
  })

  it('throws for an unknown case id', () => {
    expect(() => predictElectrolysis('nope' as PredictorCaseId)).toThrow(RangeError)
  })
})
