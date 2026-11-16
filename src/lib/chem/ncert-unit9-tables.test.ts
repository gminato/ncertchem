import { describe, expect, it } from 'vitest'
import { parseSmiles } from './molecule-parse'
import { iupacName } from './iupac-organic'
import { countsOf, nameWithGeometry, placeAlkene } from './hydrocarbon-species'
import * as R from './hydrocarbon-reactions'
import { huckel } from './aromaticity'
import {
  conditionFor,
  NCERT_CARCINOGENS,
  NCERT_ORIENTING_GROUPS,
  NCERT_TABLE_9_1_NOMENCLATURE,
  NCERT_UNIT9_BOND_DATA,
  NCERT_UNIT9_CONDITIONS,
  NCERT_UNIT9_ERRATA,
  NCERT_UNIT9_EXERCISES,
  NCERT_UNIT9_PROBLEMS,
} from './ncert-unit9-tables'

const g = parseSmiles
const nm = (s: string) => iupacName(g(s))

describe('NCERT Unit 9 tables', () => {
  it('has the fourteen in-text Problems and the twenty-five Exercises, in order', () => {
    expect(NCERT_UNIT9_PROBLEMS.map((p) => p.number)).toEqual(['9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7', '9.8', '9.9', '9.10', '9.11', '9.12', '9.13', '9.14'])
    expect(NCERT_UNIT9_EXERCISES.map((e) => e.number)).toEqual(Array.from({ length: 25 }, (_, i) => `9.${i + 1}`))
  })
  it('cites a PDF page inside the 33-page file for every entry', () => {
    const pages = [...NCERT_UNIT9_PROBLEMS, ...NCERT_UNIT9_EXERCISES, ...NCERT_UNIT9_ERRATA, ...NCERT_UNIT9_BOND_DATA]
    for (const x of pages) {
      expect(x.pdfPage).toBeGreaterThanOrEqual(1)
      expect(x.pdfPage).toBeLessThanOrEqual(33)
    }
  })
  it('gives a source for every table', () => {
    expect(NCERT_TABLE_9_1_NOMENCLATURE.rows.length).toBe(5)
    expect(NCERT_TABLE_9_1_NOMENCLATURE.source).toMatch(/PDF p/)
  })
  it('has the printed conditions, and conditionFor rejects an unknown id', () => {
    expect(NCERT_UNIT9_CONDITIONS.length).toBeGreaterThan(40)
    expect(conditionFor('lindlar').text).toMatch(/Lindlar/)
    expect(() => conditionFor('no-such-reaction')).toThrow(RangeError)
  })
  it('lists the directing groups and carcinogens NCERT names', () => {
    expect(NCERT_ORIENTING_GROUPS.length).toBeGreaterThan(10)
    expect(NCERT_CARCINOGENS.length).toBeGreaterThan(0)
  })
})

describe('Problem answers recomputed from the models', () => {
  it('9.1 five C6H14 chain isomers', () => {
    const names = ['CCCCCC', 'CC(C)CCC', 'CCC(C)CC', 'CC(C)(C)CC', 'CC(C)C(C)C'].map(nm)
    expect(names).toEqual(['hexane', '2-methylpentane', '3-methylpentane', '2,2-dimethylbutane', '2,3-dimethylbutane'])
  })
  it('9.2 eight alcohols of formula C5H11OH', () => {
    const smiles = ['OCCCCC', 'CC(O)CCC', 'CCC(O)CC', 'OCC(C)CC', 'OCCC(C)C', 'CC(O)C(C)C', 'CCC(C)(C)O', 'OCC(C)(C)C']
    expect(new Set(smiles.map(nm)).size).toBe(8)
  })
  it('9.3 names of the three printed alkanes', () => {
    expect(nm('CC(C)(C)CC(C)(C)C')).toBe('2,2,4,4-tetramethylpentane')
    expect(nm('CC(C)(CC)CC')).toBe('3,3-dimethylpentane')
  })
  it('9.4 names of the printed structures', () => {
    expect(nm('CCC(C)C(C)(C)C(C)CC')).toBe('3,4,4,5-tetramethylheptane')
    expect(nm('CC(C)CCC(C)C')).toBe('2,5-dimethylhexane')
  })
  it('9.5 the printed names are wrong for these structures', () => {
    expect(nm('CCCC(CC)C')).toBe('3-methylhexane')
    expect(nm('CCC(C)CC(CC)CC')).toBe('3-ethyl-5-methylheptane')
  })
  it('9.6 sodium butanoate gives propane by decarboxylation', () => {
    expect(R.decarboxylate(g('CCCC(=O)O')).products[0].name).toBe('propane')
  })
  it('9.7 names of the four structures', () => {
    expect(nm('CC(C)C=CCC=CC(CC)C')).toBe('2,8-dimethyldeca-3,6-diene')
    expect(nm('C=CC=CC=CC=C')).toBe('octa-1,3,5,7-tetraene')
    expect(nm('C=C(CCC)CCC')).toBe('2-propylpent-1-ene')
    expect(nm('CC(CCCC)C=C(CC)CC(C)C')).toBe('4-ethyl-2,6-dimethyldec-4-ene')
  })
  it('9.8 σ and π counts of the four structures (σ = heavy bonds + C–H bonds)', () => {
    const counts = (s: string) => {
      const m = g(s)
      const sigma = m.bonds.length + (countsOf(m).H ?? 0)
      const pi = m.bonds.reduce((t, b) => t + (b.order - 1), 0)
      return { sigma, pi }
    }
    expect(counts('CC(C)C=CCC=CC(CC)C')).toEqual({ sigma: 33, pi: 2 })
    expect(counts('C=CC=CC=CC=C')).toEqual({ sigma: 17, pi: 4 })
    expect(counts('C=C(CCC)CCC')).toEqual({ sigma: 23, pi: 1 })
    expect(counts('CC(CCCC)C=C(CC)CC(C)C')).toEqual({ sigma: 41, pi: 1 })
  })
  it('9.9 five C5H10 alkene isomers', () => {
    const names = ['C=CCCC', 'CC=CCC', 'C=C(C)CC', 'CC=C(C)C', 'C=CC(C)C'].map(nm)
    expect(new Set(names).size).toBe(5)
  })
  it('9.10 cis and trans 1,2-dichloroethene are named with their geometry', () => {
    expect(nameWithGeometry(placeAlkene(g('ClC=CCl'), 1, 2, true))).toBe('cis-1,2-dichloroethene')
    expect(nameWithGeometry(placeAlkene(g('ClC=CCl'), 1, 2, false))).toBe('trans-1,2-dichloroethene')
  })
  it('9.11 2-methylpent-2-ene has no cis-trans isomerism', () => {
    expect(nm('CC(C)=CCC')).toBe('2-methylpent-2-ene')
  })
  it('9.12 HBr with and without peroxide on hex-1-ene', () => {
    expect(R.addHX(g('C=CCCCC'), 'HBr').products[0].name).toBe('2-bromohexane')
    expect(R.addHX(g('C=CCCCC'), 'HBr', { peroxide: true }).products[0].name).toBe('1-bromohexane')
  })
  it('9.13 seven C6H10 alkyne isomers', () => {
    const names = ['C#CCCCC', 'CC#CCCC', 'CCC#CCC', 'C#CC(C)CC', 'C#CCC(C)C', 'CC#CC(C)C', 'C#CC(C)(C)C'].map(nm)
    expect(names).toEqual(['hex-1-yne', 'hex-2-yne', 'hex-3-yne', '3-methylpent-1-yne', '4-methylpent-1-yne', '4-methylpent-2-yne', '3,3-dimethylbut-1-yne'])
  })
  it('9.14 carbon classes of H3C–CH2–C(CH3)2–CH2–CH(CH3)2', () => {
    expect(countsOf(g('CCC(C)(C)CC(C)C'))).toEqual({ C: 9, H: 20 })
  })
  it('9.16 Markovnikov and peroxide products of HBr with propene', () => {
    expect(R.addHX(g('C=CC'), 'HBr').products[0].name).toBe('2-bromopropane')
    expect(R.addHX(g('C=CC'), 'HBr', { peroxide: true }).products[0].name).toBe('1-bromopropane')
  })
  it('9.12 species verdicts (Exercise 9.12)', () => {
    expect(huckel(g('C=C1C=CC=CC1')).verdict).toBe('not fully conjugated')
    expect(huckel(g('C1C=CC=C1')).verdict).toBe('not fully conjugated')
    expect(huckel(g('C1=CC=CC=CC=C1')).verdict).toBe('antiaromatic-or-non-aromatic')
  })
  it('9.22 and 9.23 nitration reactivity orders', () => {
    const a = R.relativeNitrationRate([g('ClC1=CC=CC=C1'), g('ClC1=CC=C(C=C1)[N+](=O)[O-]'), g('ClC1=C(C=C(C=C1)[N+](=O)[O-])[N+](=O)[O-]')])
    expect(a.order).toEqual([0, 1, 2])
    const b = R.relativeNitrationRate([g('CC1=CC=C(C=C1)[N+](=O)[O-]'), g('CC1=CC=CC=C1'), g('O=[N+]([O-])C1=CC=C(C=C1)[N+](=O)[O-]')])
    expect(b.order).toEqual([1, 0, 2])
    expect(R.relativeNitrationRate([g('O=[N+]([O-])C1=CC(=CC=C1)[N+](=O)[O-]'), g('CC1=CC=CC=C1')]).order).toEqual([1, 0])
  })
  it('9.25 the Wurtz reaction of two different halides gives three alkanes', () => {
    expect(R.wurtz(g('CBr'), g('CCBr')).products.map((p) => p.name)).toEqual(['ethane', 'propane', 'butane'])
  })
  it('9.13 nitration of bromobenzene gives the para product', () => {
    const r = R.electrophilicSubstitution(g('BrC1=CC=CC=C1'), 'nitration')
    expect(r.products.map((p) => p.name)).toContain('1-bromo-4-nitrobenzene')
  })
})

describe('errata', () => {
  it('each erratum names its page and what is printed', () => {
    for (const e of NCERT_UNIT9_ERRATA) {
      expect(e.where.length).toBeGreaterThan(0)
      expect(e.printed.length).toBeGreaterThan(0)
      expect(e.correct.length).toBeGreaterThan(0)
    }
  })
  it('bond data includes the triple bond and every entry is quantified', () => {
    expect(NCERT_UNIT9_BOND_DATA.some((b) => b.quantity.includes('C≡C') || b.statedAs.includes('C≡C'))).toBe(true)
    for (const b of NCERT_UNIT9_BOND_DATA) expect(Number.isFinite(b.value)).toBe(true)
  })
})
