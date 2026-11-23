import { describe, expect, it } from 'vitest'
import {
  CFT_DD_COLOUR_STEP_COUNT,
  SEVEN_SPECTRAL_BANDS,
  cftDdStepState,
  clampCftDdStep,
} from './cft-dd-colour-steps'

describe('cft-d-d-colour step logic', () => {
  it('clamps out-of-range and NaN step indices', () => {
    expect(clampCftDdStep(-2)).toBe(0)
    expect(clampCftDdStep(Number.NaN)).toBe(0)
    expect(clampCftDdStep(99)).toBe(CFT_DD_COLOUR_STEP_COUNT - 1)
  })

  it('orders the seven spectral bands from red on the left to violet on the right', () => {
    expect(SEVEN_SPECTRAL_BANDS).toHaveLength(7)
    expect(SEVEN_SPECTRAL_BANDS[0].id).toBe('red')
    expect(SEVEN_SPECTRAL_BANDS[6].id).toBe('violet')
  })

  it('advances from unabsorbed white light to promotion, complementary violet, and ligand removal', () => {
    const s0 = cftDdStepState(0)
    expect(s0.absorbedBandId).toBeNull()
    expect(s0.showEnergyDiagram).toBe(false)

    const s1 = cftDdStepState(1)
    expect(s1.showEnergyDiagram).toBe(true)
    expect(s1.electronPromoted).toBe(false)

    const s2 = cftDdStepState(2)
    expect(s2.showPhoton).toBe(true)
    expect(s2.electronPromoted).toBe(true)
    expect(s2.absorbedBandId).toBe('blue-green')
    expect(s2.wavelengthNm).toBe(498)
    expect(s2.photonEnergy1e19J).toBeCloseTo(3.99, 2)

    const s3 = cftDdStepState(3)
    expect(s3.showWheel).toBe(true)
    expect(s3.showExitBeam).toBe(true)

    const s4 = cftDdStepState(4)
    expect(s4.ligandsPresent).toBe(false)
    expect(s4.absorbedBandId).toBeNull()
    expect(s4.beakerTint).toBe('var(--ion-colourless)')
  })
})
