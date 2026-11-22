import { describe, expect, it } from 'vitest'
import { NCERT_MNBR4, NCERT_VBT_COMPLEXES } from '@/lib/chem/ncert-c12-unit5-s5-tables'
import { VBT_PRESETS, computeVbtState } from './vbt-orbital-lab-model'

describe('vbt-orbital-lab-model', () => {
  it('includes all 10 NCERT_VBT_COMPLEXES plus [MnBr4]2-', () => {
    expect(VBT_PRESETS).toHaveLength(11)
    for (let i = 0; i < NCERT_VBT_COMPLEXES.length; i++) {
      const ncert = NCERT_VBT_COMPLEXES[i]
      const preset = VBT_PRESETS[i]
      const state = computeVbtState({ d: preset.d, cn: preset.cn, spin: preset.spin, preset })
      expect(state.formula).toBe(ncert.formula)
      expect(state.hybridisation).toBe(ncert.hybridisation)
      expect(state.geometryLabel).toBe(ncert.shape)
      expect(state.unpaired).toBe(ncert.unpaired)
    }

    const mnbr4Preset = VBT_PRESETS[10]
    const mnbr4State = computeVbtState({ d: mnbr4Preset.d, cn: mnbr4Preset.cn, spin: mnbr4Preset.spin, preset: mnbr4Preset })
    expect(mnbr4State.formula).toBe(NCERT_MNBR4.formula)
    expect(mnbr4State.geometryLabel).toBe(NCERT_MNBR4.shape)
    expect(mnbr4State.unpaired).toBe(NCERT_MNBR4.unpaired)
    expect(Number(mnbr4State.mu.toFixed(1))).toBe(NCERT_MNBR4.moment)
  })

  it('locks octahedral d1-d3 to inner orbital d2sp3 without pairing', () => {
    for (const d of [1, 2, 3]) {
      const state = computeVbtState({ d, cn: 6, spin: 'high' })
      expect(state.spinLocked).toBe(true)
      expect(state.hybridisation).toBe('d²sp³')
      expect(state.unpaired).toBe(d)
    }
  })

  it('allows both inner and outer octahedral paths for d4, d5, d6', () => {
    expect(computeVbtState({ d: 4, cn: 6, spin: 'low' })).toMatchObject({ hybridisation: 'd²sp³', unpaired: 2, spinLocked: false })
    expect(computeVbtState({ d: 4, cn: 6, spin: 'high' })).toMatchObject({ hybridisation: 'sp³d²', unpaired: 4, spinLocked: false })
    expect(computeVbtState({ d: 5, cn: 6, spin: 'low' })).toMatchObject({ hybridisation: 'd²sp³', unpaired: 1, spinLocked: false })
    expect(computeVbtState({ d: 5, cn: 6, spin: 'high' })).toMatchObject({ hybridisation: 'sp³d²', unpaired: 5, spinLocked: false })
    expect(computeVbtState({ d: 6, cn: 6, spin: 'low' })).toMatchObject({ hybridisation: 'd²sp³', unpaired: 0, spinLocked: false })
    expect(computeVbtState({ d: 6, cn: 6, spin: 'high' })).toMatchObject({ hybridisation: 'sp³d²', unpaired: 4, spinLocked: false })
  })

  it('locks octahedral d7-d10 to outer orbital sp3d2 and CN4 d9-d10 to tetrahedral sp3', () => {
    expect(computeVbtState({ d: 8, cn: 6, spin: 'low' })).toMatchObject({ hybridisation: 'sp³d²', unpaired: 2, spinLocked: true })
    const cn4d10 = computeVbtState({ d: 10, cn: 4, spin: 'low' })
    expect(cn4d10).toMatchObject({ hybridisation: 'sp³', unpaired: 0, spinLocked: true, magnetism: 'Diamagnetic' })
    expect(cn4d10.orbitalTypeLabel.toLowerCase()).not.toContain('high spin')
    expect(cn4d10.orbitalTypeLabel).toContain('3d¹⁰')

    const cn6d10 = computeVbtState({ d: 10, cn: 6, spin: 'low' })
    expect(cn6d10).toMatchObject({ hybridisation: 'sp³d²', unpaired: 0, spinLocked: true, magnetism: 'Diamagnetic' })
    expect(cn6d10.orbitalTypeLabel.toLowerCase()).not.toContain('high spin')
    expect(cn6d10.orbitalTypeLabel).toContain('3d¹⁰')

    const cn4d9 = computeVbtState({ d: 9, cn: 4, spin: 'low' })
    expect(cn4d9).toMatchObject({ hybridisation: 'sp³', unpaired: 1, spinLocked: true })
    expect(cn4d9.orbitalTypeLabel.toLowerCase()).not.toContain('high spin')
  })

  it('models CN4 d8 tetrahedral (sp3, 2 unpaired) vs square planar (dsp2, 0 unpaired)', () => {
    const tet = computeVbtState({ d: 8, cn: 4, spin: 'high' })
    expect(tet).toMatchObject({ hybridisation: 'sp³', geometry: 'tetrahedral', unpaired: 2, magnetism: 'Paramagnetic' })

    const sq = computeVbtState({ d: 8, cn: 4, spin: 'low' })
    expect(sq).toMatchObject({ hybridisation: 'dsp²', geometry: 'square-planar', unpaired: 0, magnetism: 'Diamagnetic' })
    expect(sq.balancePull).toBeLessThan(0)
  })
})
