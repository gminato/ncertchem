import { describe, expect, it } from 'vitest'
import {
  energyLevel,
  orbitRadiusPm,
  seriesName,
  spectrumRegion,
  transitionEnergy,
  transitionWavelengthNm,
} from './bohr'
import {
  BOHR_RADIUS_PM,
  PLANCK,
  RH_JOULES,
  RYDBERG_CM,
  SPEED_OF_LIGHT,
} from './constants'

describe('Physical constants (NCERT Class 11)', () => {
  it('defines NCERT textbook constants with accurate values', () => {
    expect(RH_JOULES).toBe(2.18e-18)
    expect(RYDBERG_CM).toBe(109677)
    expect(BOHR_RADIUS_PM).toBe(52.9)
    expect(PLANCK).toBe(6.626e-34)
    expect(SPEED_OF_LIGHT).toBe(3.0e8)
  })
})

describe('Bohr model calculations', () => {
  describe('energyLevel', () => {
    it('calculates hydrogen energy levels correctly', () => {
      // E_1 = -2.18e-18 J
      expect(energyLevel(1)).toBeCloseTo(-2.18e-18, 20)
      // E_2 = -2.18e-18 / 4 = -5.45e-19 J
      expect(energyLevel(2)).toBeCloseTo(-5.45e-19, 21)
      // E_3 = -2.18e-18 / 9 ≈ -2.4222e-19 J
      expect(energyLevel(3)).toBeCloseTo(-2.18e-18 / 9, 21)
    })

    it('scales with Z^2 for hydrogen-like species', () => {
      // He⁺ (Z = 2), n = 1: E_1 = -2.18e-18 * 4 = -8.72e-18 J
      expect(energyLevel(1, 2)).toBeCloseTo(-8.72e-18, 20)
      // Li²⁺ (Z = 3), n = 1: E_1 = -2.18e-18 * 9 = -1.962e-17 J
      expect(energyLevel(1, 3)).toBeCloseTo(-1.962e-17, 19)
    })

    it('throws RangeError for invalid n inputs', () => {
      expect(() => energyLevel(0)).toThrow(RangeError)
      expect(() => energyLevel(-1)).toThrow(RangeError)
      expect(() => energyLevel(1.5)).toThrow(RangeError)
      expect(() => energyLevel(NaN)).toThrow(RangeError)
    })

    it('throws RangeError for invalid Z inputs', () => {
      expect(() => energyLevel(1, 0)).toThrow(RangeError)
      expect(() => energyLevel(1, -1)).toThrow(RangeError)
      expect(() => energyLevel(1, 1.5)).toThrow(RangeError)
    })
  })

  describe('orbitRadiusPm', () => {
    it('calculates Bohr orbit radii for hydrogen', () => {
      expect(orbitRadiusPm(1)).toBe(52.9)
      expect(orbitRadiusPm(2)).toBe(211.6)
      expect(orbitRadiusPm(3)).toBeCloseTo(476.1, 1)
    })

    it('calculates Bohr orbit radii for hydrogen-like species', () => {
      // He⁺ (Z = 2), n = 1 -> 52.9 * 1 / 2 = 26.45 pm
      expect(orbitRadiusPm(1, 2)).toBe(26.45)
      // He⁺ (Z = 2), n = 2 -> 52.9 * 4 / 2 = 105.8 pm
      expect(orbitRadiusPm(2, 2)).toBe(105.8)
    })

    it('throws RangeError for invalid n or Z inputs', () => {
      expect(() => orbitRadiusPm(0)).toThrow(RangeError)
      expect(() => orbitRadiusPm(-1)).toThrow(RangeError)
      expect(() => orbitRadiusPm(1.5)).toThrow(RangeError)
      expect(() => orbitRadiusPm(1, 0)).toThrow(RangeError)
      expect(() => orbitRadiusPm(1, -2)).toThrow(RangeError)
    })
  })

  describe('transitionEnergy', () => {
    it('returns negative energy for emission (nInitial > nFinal)', () => {
      const deltaE = transitionEnergy(3, 2)
      expect(deltaE).toBeLessThan(0)
      expect(deltaE).toBeCloseTo(energyLevel(2) - energyLevel(3), 22)
    })

    it('returns positive energy for absorption (nInitial < nFinal)', () => {
      const deltaE = transitionEnergy(2, 3)
      expect(deltaE).toBeGreaterThan(0)
      expect(deltaE).toBeCloseTo(energyLevel(3) - energyLevel(2), 22)
    })

    it('has equal and opposite values for emission and absorption between same levels', () => {
      expect(transitionEnergy(3, 2)).toBeCloseTo(-transitionEnergy(2, 3), 22)
    })

    it('throws RangeError for invalid inputs', () => {
      expect(() => transitionEnergy(0, 2)).toThrow(RangeError)
      expect(() => transitionEnergy(2, 0)).toThrow(RangeError)
      expect(() => transitionEnergy(-1, 2)).toThrow(RangeError)
      expect(() => transitionEnergy(1.5, 2)).toThrow(RangeError)
      expect(() => transitionEnergy(2, 1, 0)).toThrow(RangeError)
    })
  })

  describe('transitionWavelengthNm', () => {
    it('calculates Balmer series emission wavelengths accurately (±0.5 nm)', () => {
      // 3 -> 2 (H-alpha, red) ≈ 656.5 nm
      expect(transitionWavelengthNm(3, 2)).toBeCloseTo(656.5, 0)
      expect(Math.abs(transitionWavelengthNm(3, 2) - 656.5)).toBeLessThanOrEqual(0.5)

      // 4 -> 2 (H-beta, cyan) ≈ 486.3 nm
      expect(transitionWavelengthNm(4, 2)).toBeCloseTo(486.3, 0)
      expect(Math.abs(transitionWavelengthNm(4, 2) - 486.3)).toBeLessThanOrEqual(0.5)

      // 5 -> 2 (H-gamma, blue-violet) ≈ 434.2 nm
      expect(transitionWavelengthNm(5, 2)).toBeCloseTo(434.2, 0)
      expect(Math.abs(transitionWavelengthNm(5, 2) - 434.2)).toBeLessThanOrEqual(0.5)

      // 6 -> 2 (H-delta, violet) ≈ 410.3 nm
      expect(transitionWavelengthNm(6, 2)).toBeCloseTo(410.3, 0)
      expect(Math.abs(transitionWavelengthNm(6, 2) - 410.3)).toBeLessThanOrEqual(0.5)
    })

    it('calculates Lyman 2 -> 1 ≈ 121.6 nm (±0.5)', () => {
      const lyman21 = transitionWavelengthNm(2, 1)
      expect(lyman21).toBeCloseTo(121.6, 0)
      expect(Math.abs(lyman21 - 121.6)).toBeLessThanOrEqual(0.5)
      expect(spectrumRegion(lyman21)).toBe('ultraviolet')
    })

    it('calculates Paschen 4 -> 3 ≈ 1875 nm (±2)', () => {
      const paschen43 = transitionWavelengthNm(4, 3)
      expect(paschen43).toBeCloseTo(1875.6, 0)
      expect(Math.abs(paschen43 - 1875)).toBeLessThanOrEqual(2)
      expect(spectrumRegion(paschen43)).toBe('infrared')
    })

    it('yields the same wavelength for absorption (2->3) as emission (3->2)', () => {
      const emission = transitionWavelengthNm(3, 2)
      const absorption = transitionWavelengthNm(2, 3)
      expect(absorption).toBe(emission)
    })

    it('scales wavelength by 1/Z^2 for hydrogen-like species', () => {
      const lambdaH = transitionWavelengthNm(3, 2, 1)
      const lambdaHePlus = transitionWavelengthNm(3, 2, 2)
      expect(lambdaHePlus).toBeCloseTo(lambdaH / 4, 6)
    })

    it('throws RangeError when nInitial === nFinal', () => {
      expect(() => transitionWavelengthNm(1, 1)).toThrow(RangeError)
      expect(() => transitionWavelengthNm(2, 2)).toThrow(RangeError)
      expect(() => transitionWavelengthNm(4, 4)).toThrow(RangeError)
    })

    it('throws RangeError for invalid n or Z inputs', () => {
      expect(() => transitionWavelengthNm(0, 2)).toThrow(RangeError)
      expect(() => transitionWavelengthNm(2, 0)).toThrow(RangeError)
      expect(() => transitionWavelengthNm(-1, 2)).toThrow(RangeError)
      expect(() => transitionWavelengthNm(1.5, 2)).toThrow(RangeError)
      expect(() => transitionWavelengthNm(2, 3, 0)).toThrow(RangeError)
    })
  })

  describe('seriesName', () => {
    it('identifies spectral series by lower quantum number (1..6)', () => {
      expect(seriesName(1)).toBe('Lyman')
      expect(seriesName(2)).toBe('Balmer')
      expect(seriesName(3)).toBe('Paschen')
      expect(seriesName(4)).toBe('Brackett')
      expect(seriesName(5)).toBe('Pfund')
      expect(seriesName(6)).toBe('Humphreys')
    })

    it('returns null for n < 1 or n > 6 or non-integers', () => {
      expect(seriesName(0)).toBeNull()
      expect(seriesName(7)).toBeNull()
      expect(seriesName(8)).toBeNull()
      expect(seriesName(-1)).toBeNull()
      expect(seriesName(1.5)).toBeNull()
    })
  })

  describe('spectrumRegion', () => {
    it('classifies wavelengths below 380 nm as ultraviolet', () => {
      expect(spectrumRegion(121.6)).toBe('ultraviolet')
      expect(spectrumRegion(379.9)).toBe('ultraviolet')
      expect(spectrumRegion(10)).toBe('ultraviolet')
    })

    it('classifies wavelengths 380–750 nm inclusive as visible', () => {
      expect(spectrumRegion(380)).toBe('visible')
      expect(spectrumRegion(486.3)).toBe('visible')
      expect(spectrumRegion(656.5)).toBe('visible')
      expect(spectrumRegion(750)).toBe('visible')
    })

    it('classifies wavelengths above 750 nm as infrared', () => {
      expect(spectrumRegion(750.1)).toBe('infrared')
      expect(spectrumRegion(1875)).toBe('infrared')
      expect(spectrumRegion(5000)).toBe('infrared')
    })
  })
})
