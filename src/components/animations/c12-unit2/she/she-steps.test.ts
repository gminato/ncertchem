import { describe, expect, it } from 'vitest'
import {
  AG_HALF,
  CU_HALF,
  LADDER_IDS,
  SHE_HALF,
  SHE_STEPS,
  ZN_HALF,
  clampSheStep,
  getSheStep,
  pairScene,
  signedVolts,
  standardRow,
} from './she-steps'

describe('she-measurement steps', () => {
  it('has six Steps in order', () => {
    expect(SHE_STEPS.map((s) => s.id)).toEqual([
      'half-cell',
      'she',
      'cu-vs-she',
      'zn-vs-she',
      'ladder',
      'pair-any-two',
    ])
    SHE_STEPS.forEach((s, i) => expect(s.index).toBe(i))
  })

  it('SHE against Cu²⁺/Cu: SHE is the anode and E°cell is +0.34 V', () => {
    const p = pairScene(SHE_HALF, CU_HALF)
    expect(p.anode.couple).toBe('H+/H2')
    expect(p.cathode.couple).toBe('Cu2+/Cu')
    expect(p.eCell).toBeCloseTo(0.34, 10)
    expect(SHE_STEPS[2].meter).toBeCloseTo(0.34, 10)
  })

  it('SHE against Zn²⁺/Zn: Zn is the anode, so E° = −0.76 V', () => {
    const p = pairScene(ZN_HALF, SHE_HALF)
    expect(p.anode.couple).toBe('Zn2+/Zn')
    expect(p.cathode.couple).toBe('H+/H2')
    expect(p.eCell).toBeCloseTo(0.76, 10)
    expect(p.eAnode).toBeCloseTo(standardRow('Zn2+/Zn').e0, 10)
    expect(standardRow('Zn2+/Zn').e0).toBe(-0.76)
  })

  it('pairing Ag⁺/Ag with Zn²⁺/Zn gives E°cell = 1.56 V, Zn anode, Ag cathode', () => {
    const p = pairScene(AG_HALF, ZN_HALF)
    expect(p.anode.couple).toBe('Zn2+/Zn')
    expect(p.cathode.couple).toBe('Ag+/Ag')
    expect(p.eCell).toBeCloseTo(1.56, 10)
    expect(SHE_STEPS[5].readout).toContain('1.56 V')
  })

  it('ladder rows are strictly descending in E°, from F₂ to Li⁺', () => {
    const e = LADDER_IDS.map((id) => standardRow(id).e0)
    for (let i = 1; i < e.length; i++) expect(e[i]).toBeLessThan(e[i - 1])
    expect(LADDER_IDS[0]).toBe('F2/F-')
    expect(LADDER_IDS[LADDER_IDS.length - 1]).toBe('Li+/Li')
  })

  it('clamps out-of-range steps and formats negatives with a real minus', () => {
    expect(clampSheStep(-3)).toBe(0)
    expect(clampSheStep(99)).toBe(SHE_STEPS.length - 1)
    expect(clampSheStep(Number.NaN)).toBe(0)
    expect(getSheStep(1).id).toBe('she')
    expect(signedVolts(-0.76)).toBe('(−0.76)')
    expect(signedVolts(0.34)).toBe('0.34')
  })
})
