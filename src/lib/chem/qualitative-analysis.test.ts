import { describe, expect, it } from 'vitest'
import { molecularFormula, parseSmiles } from './molecule-parse'
import {
  evidenceFor,
  fuse,
  runTest,
  scoreAnswer,
  testedElements,
  unknownCompounds,
  type QualitativeElement,
  type TestOutcome,
} from './qualitative-analysis'

const set = (...els: QualitativeElement[]) => new Set(els)

describe('testedElements', () => {
  it('reads the elements from the parsed molecule, with H from hydrogens', () => {
    expect(testedElements(parseSmiles('CCO'))).toEqual(set('C', 'H'))
    expect(testedElements(parseSmiles('ClC(Cl)(Cl)Cl'))).toEqual(set('C', 'Cl'))
    expect(testedElements(parseSmiles('NC(N)=S'))).toEqual(set('C', 'H', 'N', 'S'))
    expect(testedElements(parseSmiles('CP(C)C'))).toEqual(set('C', 'H', 'P'))
  })

  it('ignores oxygen, which this section does not test for', () => {
    expect(testedElements(parseSmiles('CC(N)=O'))).toEqual(set('C', 'H', 'N'))
  })
})

describe('unknownCompounds', () => {
  const list = unknownCompounds()

  it('has at least 12 compounds, each with one halogen kind at most', () => {
    expect(list.length).toBeGreaterThanOrEqual(12)
    for (const c of list) {
      const halogens = c.elements.filter((e) => e === 'Cl' || e === 'Br' || e === 'I')
      expect(halogens.length).toBeLessThanOrEqual(1)
    }
  })

  it('gives the formula from the parser (paracetamol check: C8H9NO2)', () => {
    expect(molecularFormula(parseSmiles('CC(=O)NC1=CC=C(O)C=C1'))).toBe('C8H9NO2')
    expect(list.find((c) => c.id === 'aniline')?.formula).toBe('C6H7N')
    expect(list.find((c) => c.id === 'thiourea')?.formula).toBe('CH4N2S')
    expect(list.find((c) => c.id === 'carbon-tetrachloride')?.elements).toEqual(['C', 'Cl'])
  })
})

describe('fuse', () => {
  it('standard fusion of N and S gives thiocyanate and no free cyanide or sulphide', () => {
    expect(fuse(set('C', 'H', 'N', 'S'), 'standard')).toEqual({ cyanide: false, thiocyanate: true, sulphide: false, halide: null })
  })

  it('excess sodium frees cyanide and sulphide from thiocyanate (NaSCN + 2Na → NaCN + Na2S)', () => {
    expect(fuse(set('C', 'H', 'N', 'S'), 'excess')).toEqual({ cyanide: true, thiocyanate: false, sulphide: true, halide: null })
  })

  it('N alone gives cyanide, S alone gives sulphide, and a halogen gives the halide', () => {
    expect(fuse(set('C', 'H', 'N'), 'standard').cyanide).toBe(true)
    expect(fuse(set('C', 'H', 'S'), 'standard').sulphide).toBe(true)
    expect(fuse(set('C', 'Br'), 'standard').halide).toBe('Br')
  })
})

describe('runTest', () => {
  const noExtract = fuse(set('C'), 'standard')

  it('dry tests read carbon from lime water and hydrogen from copper sulphate', () => {
    expect(runTest('lime-water', set('C', 'Cl'), noExtract, false).positive).toBe(true)
    expect(runTest('copper-sulphate', set('C', 'Cl'), noExtract, false).positive).toBe(false)
    expect(runTest('copper-sulphate', set('C', 'H'), noExtract, false).positive).toBe(true)
  })

  it('blood red needs both N and S; Prussian blue is then negative', () => {
    const el = set('C', 'H', 'N', 'S')
    const ex = fuse(el, 'standard')
    expect(runTest('blood-red', el, ex, false).positive).toBe(true)
    expect(runTest('prussian-blue', el, ex, false).positive).toBe(false)
    expect(runTest('lead-acetate', el, ex, false).positive).toBe(false)
  })

  it('an unboiled silver nitrate test is masked when cyanide or sulphide is present', () => {
    const el = set('C', 'H', 'N', 'Br')
    const ex = fuse(el, 'standard')
    const outcome = runTest('silver-nitrate', el, ex, false)
    expect(outcome.masked).toBe(true)
    expect(outcome.positive).toBe(false)
  })

  it('boiling with nitric acid first shows the halide colour', () => {
    const el = set('C', 'H', 'N', 'Br')
    const ex = fuse(el, 'standard')
    const outcome: TestOutcome = runTest('silver-nitrate', el, ex, true)
    expect(outcome).toEqual({ positive: true, masked: false, halide: 'Br' })
  })

  it('silver nitrate shows no precipitate for a compound with no halogen and no N or S', () => {
    const el = set('C', 'H')
    expect(runTest('silver-nitrate', el, fuse(el, 'standard'), false).positive).toBe(false)
  })
})

describe('evidenceFor and scoreAnswer', () => {
  it('N is evidenced by Prussian blue or by blood red; S by sulphide tests or blood red', () => {
    expect(evidenceFor({ 'blood-red': { positive: true, masked: false, halide: null } })).toEqual(set('N', 'S'))
    expect(evidenceFor({ 'prussian-blue': { positive: true, masked: false, halide: null } })).toEqual(set('N'))
  })

  it('scores one point per element, correct when ticked matches present', () => {
    const truth = set('C', 'H', 'N')
    expect(scoreAnswer(truth, set('C', 'H', 'N'))).toEqual({ correct: 8, total: 8, wrong: [] })
    expect(scoreAnswer(truth, set('C', 'H'))).toEqual({ correct: 7, total: 8, wrong: ['N'] })
  })
})
