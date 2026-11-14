import { describe, expect, it } from 'vitest'
import { AVOGADRO } from '@/lib/chem/constants'
import { molesToParticles } from '@/lib/chem/mole'
import {
  MOLE_SCALE_STEP_COUNT,
  ONE_MOLE_SUBSTANCES,
  clampMoleScaleStep,
  logScaleFraction,
  massOfOneMole,
  targetsForMoleScaleStep,
} from './mole-scale-steps'

describe('MoleScale step targets', () => {
  it('has five Steps and clamps out-of-range values', () => {
    expect(MOLE_SCALE_STEP_COUNT).toBe(5)
    expect(clampMoleScaleStep(-3)).toBe(0)
    expect(clampMoleScaleStep(9)).toBe(4)
    expect(clampMoleScaleStep(Number.NaN)).toBe(0)
  })

  it('shows one picture per Step in order: dozen, ream, scale, vessels, counts', () => {
    expect(targetsForMoleScaleStep(0)).toEqual({ dozen: 1, ream: 0, scale: 0, vessels: 0, counts: 0 })
    expect(targetsForMoleScaleStep(1).ream).toBe(1)
    expect(targetsForMoleScaleStep(2).scale).toBe(1)
    expect(targetsForMoleScaleStep(3).vessels).toBe(1)
    expect(targetsForMoleScaleStep(4)).toMatchObject({ vessels: 1, counts: 1 })
  })
})

describe('one mole of different substances', () => {
  it('quotes the masses of water, sodium chloride and carbon as the NCERT text does', () => {
    const masses = ONE_MOLE_SUBSTANCES.map(massOfOneMole)
    expect(masses).toEqual(['18.02', '58.5', '12.011'])
  })

  it('gives every substance the same number of particles, the Avogadro number', () => {
    for (const substance of ONE_MOLE_SUBSTANCES) {
      expect(molesToParticles(1)).toBe(AVOGADRO)
      expect(substance.formula.length).toBeGreaterThan(0)
    }
  })
})

describe('logScaleFraction', () => {
  it('places a dozen, a ream and a mole on a 24-decade scale', () => {
    expect(logScaleFraction(1)).toBe(0)
    expect(logScaleFraction(12)).toBeCloseTo(Math.log10(12) / 24, 10)
    expect(logScaleFraction(AVOGADRO)).toBeCloseTo(Math.log10(6.022e23) / 24, 6)
    expect(logScaleFraction(AVOGADRO)).toBeLessThan(1)
  })
})
