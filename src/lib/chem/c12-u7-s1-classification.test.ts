import { describe, expect, it } from 'vitest'
import { drawingFrame } from '@/components/organic'
import { parseSmiles } from './molecule-parse'
import {
  DEFAULT_OXY_SPEC,
  OXY_PRESETS,
  buildOxyMolecule,
  classifyOxySmiles,
  type AttachmentEnv,
  type EtherGroup,
} from './c12-u7-s1-classification'

describe('Section 7.1 classification model', () => {
  it('classifies every preset accurately from its molecular graph', () => {
    expect(OXY_PRESETS.length).toBe(17)

    const expected: Record<
      string,
      {
        family: string
        hydroxylClass: string | null
        etherSymmetry: string | null
        hyb: string
        degree: string
        subclass: string
      }
    > = {
      'prop-2-en-1-ol': { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '1°', subclass: 'Primary (1°) allylic alcohol' },
      ethanol: { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '1°', subclass: 'Primary (1°) alkyl alcohol' },
      'ethane-1,2-diol': { family: 'alcohol', hydroxylClass: 'Dihydric', etherSymmetry: null, hyb: 'sp³', degree: 'N/A', subclass: 'Dihydric alcohol' },
      'propane-1,2,3-triol': { family: 'alcohol', hydroxylClass: 'Trihydric', etherSymmetry: null, hyb: 'sp³', degree: 'N/A', subclass: 'Trihydric alcohol' },
      'propan-2-ol': { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '2°', subclass: 'Secondary (2°) alkyl alcohol' },
      '2-methylpropan-2-ol': { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '3°', subclass: 'Tertiary (3°) alkyl alcohol' },
      'but-3-en-2-ol': { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '2°', subclass: 'Secondary (2°) allylic alcohol' },
      phenylmethanol: { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '1°', subclass: 'Primary (1°) benzylic alcohol' },
      '1-phenylpropan-2-ol': { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp³', degree: '2°', subclass: 'Secondary (2°) aliphatic alcohol' },
      ethenol: { family: 'alcohol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp²', degree: 'N/A', subclass: 'Vinylic alcohol' },
      phenol: { family: 'phenol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp²', degree: 'N/A', subclass: 'Monohydric phenol' },
      '2-methylphenol': { family: 'phenol', hydroxylClass: 'Monohydric', etherSymmetry: null, hyb: 'sp²', degree: 'N/A', subclass: 'Monohydric phenol' },
      'benzene-1,2-diol': { family: 'phenol', hydroxylClass: 'Dihydric', etherSymmetry: null, hyb: 'sp²', degree: 'N/A', subclass: 'Dihydric phenol' },
      'benzene-1,2,3-triol': { family: 'phenol', hydroxylClass: 'Trihydric', etherSymmetry: null, hyb: 'sp²', degree: 'N/A', subclass: 'Trihydric phenol' },
      'diethyl-ether': { family: 'ether', hydroxylClass: null, etherSymmetry: 'simple', hyb: 'sp³', degree: 'N/A', subclass: 'Simple (symmetrical) ether' },
      'ethyl-methyl-ether': { family: 'ether', hydroxylClass: null, etherSymmetry: 'mixed', hyb: 'sp³', degree: 'N/A', subclass: 'Mixed (unsymmetrical) ether' },
      'ethyl-phenyl-ether': { family: 'ether', hydroxylClass: null, etherSymmetry: 'mixed', hyb: 'sp³ & sp²', degree: 'N/A', subclass: 'Mixed (unsymmetrical) ether' },
    }

    for (const preset of OXY_PRESETS) {
      const c = classifyOxySmiles(preset.smiles)
      const exp = expected[preset.id]
      expect(c.family).toBe(exp.family)
      expect(c.hydroxylClass).toBe(exp.hydroxylClass)
      expect(c.etherSymmetry).toBe(exp.etherSymmetry)
      expect(c.carbonHybridisation).toBe(exp.hyb)
      expect(c.degree).toBe(exp.degree)
      expect(c.subclassLabel).toBe(exp.subclass)
    }
  })

  it('detects the –CH₂– spacer breaking benzylic adjacency in 1-phenylpropan-2-ol and 2-phenylethanol', () => {
    const c1 = classifyOxySmiles('CC(O)CC1=CC=CC=C1')
    expect(c1.subclassKind).toBe('alkyl')
    expect(c1.degree).toBe('2°')
    expect(c1.spacerAtoms.length).toBe(1)
    expect(c1.ruleTrace).toContain('spacer')

    const c2 = classifyOxySmiles('OCCC1=CC=CC=C1')
    expect(c2.subclassKind).toBe('alkyl')
    expect(c2.degree).toBe('1°')
    expect(c2.spacerAtoms.length).toBe(1)
    expect(c2.ruleTrace).toContain('spacer')

    const benzylic = classifyOxySmiles('OCC1=CC=CC=C1')
    expect(benzylic.subclassKind).toBe('benzylic')
    expect(benzylic.spacerAtoms.length).toBe(0)
  })

  it('defaults to prop-2-en-1-ol and covers all builder environments & ether pairs cleanly', () => {
    const def = buildOxyMolecule(DEFAULT_OXY_SPEC)
    expect(def.presetId).toBe('prop-2-en-1-ol')
    expect(def.classification.subclassLabel).toBe('Primary (1°) allylic alcohol')

    const envs: AttachmentEnv[] = ['aliphatic', 'allylic', 'benzylic', 'spacer-benzene', 'vinylic', 'aromatic']
    for (const env of envs) {
      for (const degree of ['1°', '2°', '3°'] as const) {
        const built = buildOxyMolecule({ ...DEFAULT_OXY_SPEC, mode: 'alcohol-phenol', env, degree, hydroxylCount: 1 })
        expect(built.smiles.length).toBeGreaterThan(0)
        expect(built.classification.family).toBe(env === 'aromatic' ? 'phenol' : 'alcohol')
      }
    }

    const groups: EtherGroup[] = ['CH3', 'C2H5', 'C6H5']
    for (const r1 of groups) {
      for (const r2 of groups) {
        const built = buildOxyMolecule({ ...DEFAULT_OXY_SPEC, mode: 'ether', r1, r2 })
        expect(built.classification.family).toBe('ether')
        expect(built.classification.etherSymmetry).toBe(r1 === r2 ? 'simple' : 'mixed')
      }
    }
  })

  it('lays out every preset molecule without overlapping atoms', () => {
    for (const preset of OXY_PRESETS) {
      const g = parseSmiles(preset.smiles)
      const frame = drawingFrame(g, 1)
      for (let i = 0; i < frame.points.length; i++) {
        for (let j = i + 1; j < frame.points.length; j++) {
          const d = Math.hypot(frame.points[i].x - frame.points[j].x, frame.points[i].y - frame.points[j].y)
          expect(d, `${preset.id} atoms ${i} and ${j} too close (${d})`).toBeGreaterThan(0.75)
        }
      }
    }
  })
})
