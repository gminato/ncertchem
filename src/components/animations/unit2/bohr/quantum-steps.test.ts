import { describe, expect, it } from 'vitest'
import { waveClosesOnItself } from '@/lib/chem/wave-orbit'
import {
  ELECTRON_WAVELENGTH_M,
  ORBIT_STEP_COUNT,
  orbitTargets,
  scaleRatio,
  scaleTargets,
  microscopeTargets,
  shortLightKickRatio,
  longLightKickRatio,
} from './quantum-steps'

describe('scaleTargets', () => {
  it('adds the ball, then the electron, then the Bohr radius and the ratio', () => {
    expect(scaleTargets(0)).toEqual({ ball: 0, electron: 0, bohr: 0, ratio: 0 })
    expect(scaleTargets(1).ball).toBe(1)
    expect(scaleTargets(2).electron).toBe(1)
    expect(scaleTargets(3).ratio).toBe(1)
  })
})

describe('the de Broglie scale numbers', () => {
  it('puts the electron about 7 × 10²⁴ times longer than the ball', () => {
    expect(scaleRatio() / 7.0e24).toBeCloseTo(1, 1)
  })
  it('gives 7.3 × 10⁻¹⁰ m for the electron at 10⁶ m/s', () => {
    expect(ELECTRON_WAVELENGTH_M / 1e-10).toBeCloseTo(7.27, 2)
  })
})

describe('orbitTargets', () => {
  it('closes the wave for n = 1 to 4 and breaks it at 3.5 wavelengths', () => {
    for (let s = 0; s < 4; s++) {
      const t = orbitTargets(s)
      expect(waveClosesOnItself(t.waves)).toBe(true)
      expect(t.seam).toBe(0)
    }
    const broken = orbitTargets(ORBIT_STEP_COUNT - 1)
    expect(broken.waves).toBe(3.5)
    expect(waveClosesOnItself(broken.waves)).toBe(false)
    expect(broken.seam).toBe(1)
  })

  it('grows the orbit radius as n squared (11, 44, 99, 176)', () => {
    expect([0, 1, 2, 3].map((s) => orbitTargets(s).radius)).toEqual([11, 44, 99, 176])
  })
})

describe('microscopeTargets', () => {
  it('blurs the position with long light and sharpens it with short light', () => {
    expect(microscopeTargets(1).cloud).toBeGreaterThan(microscopeTargets(2).cloud)
    expect(microscopeTargets(1).kick).toBe(0)
    expect(microscopeTargets(2).kick).toBeGreaterThan(0)
  })
})

describe('recoil ratios', () => {
  it('gives about 0.1 % for red light and about 7 times for 0.1 nm light', () => {
    expect(longLightKickRatio()).toBeCloseTo(1.04e-3, 4)
    expect(shortLightKickRatio()).toBeCloseTo(7.27, 1)
  })
})
