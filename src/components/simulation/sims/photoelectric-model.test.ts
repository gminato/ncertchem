import { describe, it, expect } from 'vitest'
import { PLANCK, EV_JOULES } from '@/lib/chem/constants'
import { WORK_FUNCTIONS_EV, thresholdFrequency } from '@/lib/chem/photoelectric'
import {
  METALS,
  SLOPE_EV_PER_HZ,
  STAGE_GEOMETRY,
  beamReadout,
  createEmitterState,
  keLineEv,
  photonsPerSecond,
  seededRandom,
  stepEmitter,
  staticEmitterState,
  visualElectronSpeed,
} from './photoelectric-model'

describe('METALS', () => {
  it('lists the six metals of NCERT Table 2.2 in table order', () => {
    expect([...METALS]).toEqual(['Li', 'Na', 'K', 'Mg', 'Cu', 'Ag'])
  })
})

describe('beamReadout', () => {
  it('reports no emission from potassium at 600 nm, the case of a visible wavelength below threshold', () => {
    const r = beamReadout('K', 600)
    expect(r.emitted).toBe(false)
    expect(r.keEv).toBe(0)
    expect(r.maxSpeedMs).toBe(0)
    expect(r.photonEv).toBeCloseTo(2.068, 2)
    expect(r.photonEv).toBeLessThan(WORK_FUNCTIONS_EV.K)
  })

  it('reports emission from potassium at 400 nm with KE = hν − W₀', () => {
    const r = beamReadout('K', 400)
    expect(r.emitted).toBe(true)
    expect(r.photonEv).toBeCloseTo(3.102, 2)
    expect(r.keEv).toBeCloseTo(3.102 - 2.25, 2)
    expect(r.maxSpeedMs).toBeGreaterThan(0)
  })

  it('reports thresholds that match the Table 2.2 values', () => {
    const k = beamReadout('K', 500)
    expect(k.thresholdHz).toBeCloseTo(thresholdFrequency(2.25), -3)
    expect(k.thresholdHz / 1e14).toBeCloseTo(5.44, 2)
    expect(k.thresholdNm).toBeCloseTo(551.4, 0)
    expect(beamReadout('Cu', 300).thresholdNm).toBeCloseTo(258.5, 0)
  })

  it('is emitted exactly when the wavelength is below the threshold wavelength', () => {
    for (const metal of METALS) {
      const threshold = beamReadout(metal, 500).thresholdNm
      if (threshold > 100 && threshold < 800) {
        expect(beamReadout(metal, Math.floor(threshold) - 1).emitted).toBe(true)
        expect(beamReadout(metal, Math.ceil(threshold) + 1).emitted).toBe(false)
      }
    }
  })

  it('rejects an unknown metal and an out-of-range wavelength', () => {
    expect(() => beamReadout('Au', 400)).toThrow(RangeError)
    expect(() => beamReadout('K', 50)).toThrow(RangeError)
    expect(() => beamReadout('K', 900)).toThrow(RangeError)
  })
})

describe('keLineEv', () => {
  it('has slope h/e and starts at the threshold frequency', () => {
    expect(SLOPE_EV_PER_HZ).toBeCloseTo(PLANCK / EV_JOULES, 25)
    expect(SLOPE_EV_PER_HZ).toBeCloseTo(4.136e-15, 17)
    const nu0 = thresholdFrequency(WORK_FUNCTIONS_EV.Na)
    expect(keLineEv(nu0, WORK_FUNCTIONS_EV.Na)).toBeCloseTo(0, 9)
    const nu = nu0 + 1e14
    expect(keLineEv(nu, WORK_FUNCTIONS_EV.Na) - keLineEv(nu0 + 5e13, WORK_FUNCTIONS_EV.Na)).toBeCloseTo(
      (SLOPE_EV_PER_HZ * 5e13),
      9
    )
  })

  it('is zero below the threshold', () => {
    expect(keLineEv(3e14, WORK_FUNCTIONS_EV.Ag)).toBe(0)
  })
})

describe('visualElectronSpeed', () => {
  it('is proportional to the square root of KE', () => {
    const a = visualElectronSpeed(1)
    expect(visualElectronSpeed(4)).toBeCloseTo(2 * a, 9)
    expect(visualElectronSpeed(0)).toBe(0)
  })
})

describe('photonsPerSecond', () => {
  it('is proportional to intensity and clamps to 0–100 %', () => {
    expect(photonsPerSecond(50)).toBeCloseTo(photonsPerSecond(100) / 2, 9)
    expect(photonsPerSecond(-5)).toBe(0)
    expect(photonsPerSecond(250)).toBe(photonsPerSecond(100))
  })
})

describe('stepEmitter', () => {
  const geometry = STAGE_GEOMETRY

  it('ejects no electrons below threshold, at any intensity', () => {
    const state = createEmitterState()
    const random = seededRandom(7)
    for (let i = 0; i < 600; i++) {
      stepEmitter(state, 1 / 60, { rate: photonsPerSecond(100), emitted: false, electronSpeed: 0 }, random)
    }
    expect(state.ejectedCount).toBe(0)
    expect(state.electrons.length).toBe(0)
  })

  it('ejects electrons above threshold, and the count scales with intensity', () => {
    const count = (intensity: number) => {
      const state = createEmitterState()
      const random = seededRandom(3)
      for (let i = 0; i < 60 * 20; i++) {
        stepEmitter(
          state,
          1 / 60,
          { rate: photonsPerSecond(intensity), emitted: true, electronSpeed: 50 },
          random
        )
      }
      return state.ejectedCount
    }
    const low = count(25)
    const high = count(100)
    expect(high).toBeGreaterThan(low)
    expect(high / low).toBeGreaterThan(3.7)
    expect(high / low).toBeLessThan(4.3)
  })

  it('moves photons from the lamp to the plate and absorbs them there', () => {
    const state = createEmitterState()
    const random = seededRandom(1)
    stepEmitter(state, 0, { rate: 0, emitted: false, electronSpeed: 0 }, random)
    state.photons.push({ x: geometry.lampX })
    for (let i = 0; i < 60 * 10; i++) {
      stepEmitter(state, 1 / 60, { rate: 0, emitted: false, electronSpeed: 0 }, random)
    }
    expect(state.photons.length).toBe(0)
  })

  it('removes electrons that leave the tube', () => {
    const state = createEmitterState()
    state.electrons.push({ x: geometry.tubeLeft + 10, y: 150, vx: -200, vy: 0 })
    stepEmitter(state, 0.2, { rate: 0, emitted: true, electronSpeed: 0 }, seededRandom(1))
    expect(state.electrons.length).toBe(0)
  })
})

describe('staticEmitterState', () => {
  it('has no electrons below threshold', () => {
    const s = staticEmitterState(100, false)
    expect(s.electrons.length).toBe(0)
    expect(s.ejectedCount).toBe(0)
    expect(s.photons.length).toBeGreaterThan(0)
  })

  it('has electrons above threshold, more at higher intensity', () => {
    expect(staticEmitterState(100, true).electrons.length).toBeGreaterThan(
      staticEmitterState(20, true).electrons.length
    )
  })
})
