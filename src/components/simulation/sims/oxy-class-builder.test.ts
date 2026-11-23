import { describe, expect, it } from 'vitest'
import {
  DEFAULT_OXY_SPEC,
  OXY_PRESETS,
  buildOxyMolecule,
} from '@/lib/chem/c12-u7-s1-classification'

describe('oxy-class-builder model integration', () => {
  it('loads prop-2-en-1-ol as the default preset', () => {
    const def = buildOxyMolecule(DEFAULT_OXY_SPEC)
    expect(def.iupac).toBe('Prop-2-en-1-ol')
    expect(def.classification.family).toBe('alcohol')
    expect(def.classification.carbonHybridisation).toBe('sp³')
    expect(def.classification.degree).toBe('1°')
    expect(def.classification.subclassLabel).toBe('Primary (1°) allylic alcohol')
  })

  it('transitions smoothly between every preset and builder control state', () => {
    for (const p of OXY_PRESETS) {
      const m = buildOxyMolecule(p.spec)
      expect(m.presetId).toBe(p.id)
      expect(m.smiles).toBe(p.smiles)
    }

    const cresol = buildOxyMolecule({
      ...DEFAULT_OXY_SPEC,
      mode: 'alcohol-phenol',
      env: 'aromatic',
      hydroxylCount: 1,
      orthoMethyl: true,
    })
    expect(cresol.iupac).toBe('2-Methylphenol')
    expect(cresol.classification.hydroxylClass).toBe('Monohydric')
    expect(cresol.classification.ruleTrace).toContain('only 1 –OH counts')

    const mixedEther = buildOxyMolecule({
      ...DEFAULT_OXY_SPEC,
      mode: 'ether',
      r1: 'C2H5',
      r2: 'C6H5',
    })
    expect(mixedEther.classification.etherSymmetry).toBe('mixed')
    expect(mixedEther.classification.carbonHybridisation).toBe('sp³ & sp²')
  })
})
