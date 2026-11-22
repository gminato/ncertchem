import { describe, expect, it } from 'vitest'
import { STEREO_MOLECULES, outcomeFor, stereoModel, superpositionVerdict } from './stereo-outcomes'
import { iupacNameFromSmiles } from './iupac-organic'
import { parseSmiles, molecularFormula } from './molecule-parse'

describe('stereo outcomes model', () => {
  it.each(STEREO_MOLECULES.map((m) => [m.id]))('%s: the label equals the namer output', (id) => {
    const m = STEREO_MOLECULES.find((x) => x.id === id)!
    expect(m.label).toBe(iupacNameFromSmiles(m.smiles))
  })

  it.each(STEREO_MOLECULES.map((m) => [m.id]))('%s: the picked halide has the drawn formula (halogen on the carbon)', (id) => {
    const m = STEREO_MOLECULES.find((x) => x.id === id)!
    const f = molecularFormula(parseSmiles(m.smiles))
    expect(f).toMatch(new RegExp(`${m.halogen}`))
    expect(stereoModel(id).formula).toBe(f)
  })

  it('flags the chiral halides and not the achiral one, from the lib', () => {
    expect(stereoModel('chloropentane').chiral).toBe(true)
    expect(stereoModel('bromobutane').chiral).toBe(true)
    expect(stereoModel('benzylic').chiral).toBe(true)
    expect(stereoModel('achiral').chiral).toBe(false)
    expect(stereoModel('achiral').stereoAtoms).toEqual([])
  })

  it('gives three arms plus the halogen, so the arms are the four different groups of a stereocentre', () => {
    for (const m of STEREO_MOLECULES.filter((x) => x.mechanisms.length > 0)) {
      expect(m.arms).toHaveLength(3)
    }
    // The achiral halide has two identical ethyl arms, so its arms repeat.
    const achiral = STEREO_MOLECULES.find((x) => x.id === 'achiral')!
    expect(new Set(achiral.arms).size).toBeLessThan(3)
  })

  it('names the SN2 and SN1 products from the lib, and their formulas', () => {
    expect(stereoModel('chloropentane').product.name).toBe('pentan-2-ol')
    expect(stereoModel('chloropentane').product.formula).toBe('C5H12O')
    expect(stereoModel('bromobutane').product.name).toBe('butan-2-ol')
    expect(stereoModel('benzylic').product.name).toBe(iupacNameFromSmiles(stereoModel('benzylic').product.smiles))
    expect(stereoModel('benzylic').product.name).toBe('1-phenylethanol')
  })

  it('SN2 gives one inverted product; SN1 gives an equal racemic pair with zero rotation', () => {
    const sn2 = outcomeFor('chloropentane', 'SN2')
    expect(sn2.products).toHaveLength(1)
    expect(sn2.split).toBe('100 % inverted')
    expect(sn2.polarimeter).toBe('rotates')
    const sn1 = outcomeFor('bromobutane', 'SN1')
    expect(sn1.products.map((p) => p.mirror)).toEqual([false, true])
    expect(sn1.split).toBe('50 : 50')
    expect(sn1.polarimeter).toBe('zero')
  })

  it('refuses outcomes the simulation does not offer', () => {
    expect(() => outcomeFor('benzylic', 'SN2')).toThrow()
    expect(() => outcomeFor('achiral', 'SN1')).toThrow()
  })

  it('gives a verdict that follows the stereocentre test', () => {
    expect(superpositionVerdict('achiral')).toContain('lays on the original')
    expect(superpositionVerdict('chloropentane')).toContain('chiral')
  })
})
