import { describe, expect, it } from 'vitest'
import { classifyHalide } from '@/lib/chem/haloalkanes'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_FIG_6_3_SN2_RELATIVE_RATE } from '@/lib/chem/ncert-c12-unit6-data'
import {
  ALLYL_BROMIDE_SMILES,
  ALLYL_CATION_FORMS,
  BENZYL_CATION_FORMS,
  BENZYL_CHLORIDE_SMILES,
  FORMULAS,
  NAMES,
  SN2_SN1_BEATS,
  SN2_STRIP,
  sn2BarHeight,
} from './sn2-sn1-steps'

describe('SN2 and SN1 Scrolly Steps', () => {
  it('has the six Steps in the Prose order', () => {
    expect(SN2_SN1_BEATS).toHaveLength(6)
    expect(SN2_SN1_BEATS[0]).toBe('backside-approach')
    expect(SN2_SN1_BEATS[3]).toBe('crowding-strip')
    expect(SN2_SN1_BEATS[5]).toBe('sn1-attack-and-resonance')
  })

  it('draws the Fig. 6.3 rates from the lead data, in NCERT order', () => {
    expect(SN2_STRIP.map((r) => r.relativeRate)).toEqual([30, 1, 0.02, 0])
    expect(SN2_STRIP.map((r) => r.display)).toEqual(['30', '1', '0.02', '≈ 0'])
    expect(SN2_STRIP).toHaveLength(NCERT_FIG_6_3_SN2_RELATIVE_RATE.length)
  })

  it('scales bars so the methyl bar is the full height and tert-butyl has none', () => {
    const heights = SN2_STRIP.map((r) => sn2BarHeight(r.relativeRate, 150))
    expect(heights[0]).toBeCloseTo(150, 9)
    expect(heights[3]).toBe(0)
    expect(heights[0]).toBeGreaterThan(heights[1])
    expect(heights[1]).toBeGreaterThan(heights[2])
  })

  it('names and counts the molecules from the namer and the parser', () => {
    expect(NAMES.methylBromide).toBe('bromomethane')
    expect(NAMES.tertButylBromide).toBe('2-bromo-2-methylpropane')
    expect(NAMES.methanol).toBe('methanol')
    expect(NAMES.tertButanol).toBe('2-methylpropan-2-ol')
    expect(NAMES.allylBromide).toBe('3-bromoprop-1-ene')
    expect(FORMULAS.methylBromide).toBe('CH3Br')
    expect(FORMULAS.tertButylBromide).toBe('C4H9Br')
    expect(FORMULAS.allylBromide).toBe('C3H5Br')
    expect(FORMULAS.benzylChloride).toBe('C7H7Cl')
  })

  it('classifies the allylic and benzylic halides the Steps draw', () => {
    const allyl = parseSmiles(ALLYL_BROMIDE_SMILES)
    const benzyl = parseSmiles(BENZYL_CHLORIDE_SMILES)
    expect(classifyHalide(allyl, allyl.atoms.length - 1).kind).toBe('allylic')
    expect(classifyHalide(benzyl, 0).kind).toBe('benzylic')
  })

  it('draws each cation resonance form as C7H7 (or C3H5) with the + on its own carbon', () => {
    for (const form of BENZYL_CATION_FORMS) {
      const g = parseSmiles(form.smiles)
      expect(molecularFormula(g)).toBe('C7H7+')
      expect(g.atoms[form.cation].charge).toBe(1)
      expect(g.atoms.filter((a) => (a.charge ?? 0) !== 0)).toHaveLength(1)
    }
    for (const form of ALLYL_CATION_FORMS) {
      const g = parseSmiles(form.smiles)
      expect(molecularFormula(g)).toBe('C3H5+')
      expect(g.atoms[form.cation].charge).toBe(1)
    }
    expect(BENZYL_CATION_FORMS.map((f) => f.cation)).toEqual([0, 2, 4])
  })
})
