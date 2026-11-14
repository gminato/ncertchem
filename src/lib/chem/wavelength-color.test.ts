import { describe, expect, it } from 'vitest'
import { wavelengthToCss, wavelengthToRgb } from './wavelength-color'

describe('Wavelength to RGB and CSS color mapping', () => {
  describe('wavelengthToRgb', () => {
    it('maps 656 nm (Balmer alpha) to predominantly red', () => {
      const color = wavelengthToRgb(656)
      expect(color.visible).toBe(true)
      expect(color.r).toBeGreaterThan(200)
      expect(color.g).toBeLessThan(80)
      expect(color.b).toBeLessThan(80)
    })

    it('maps 486 nm (Balmer beta) to cyan/blue-ish', () => {
      const color = wavelengthToRgb(486)
      expect(color.visible).toBe(true)
      expect(color.b).toBeGreaterThan(200)
      expect(color.g).toBeGreaterThan(150)
      expect(color.r).toBeLessThan(50)
    })

    it('maps 434 nm (Balmer gamma) to violet-blue', () => {
      const color = wavelengthToRgb(434)
      expect(color.visible).toBe(true)
      expect(color.b).toBeGreaterThan(200)
    })

    it('returns visible: false with neutral UV fallback (#7B61FF) for wavelengths below 380 nm', () => {
      const uv300 = wavelengthToRgb(300)
      expect(uv300.visible).toBe(false)
      expect(uv300.r).toBe(123) // 0x7B
      expect(uv300.g).toBe(97) // 0x61
      expect(uv300.b).toBe(255) // 0xFF

      const uv379 = wavelengthToRgb(379.9)
      expect(uv379.visible).toBe(false)
      expect(uv379.r).toBe(123)
      expect(uv379.g).toBe(97)
      expect(uv379.b).toBe(255)
    })

    it('returns visible: false with neutral IR fallback (#8B2E2E) for wavelengths above 750 nm', () => {
      const ir1000 = wavelengthToRgb(1000)
      expect(ir1000.visible).toBe(false)
      expect(ir1000.r).toBe(139) // 0x8B
      expect(ir1000.g).toBe(46) // 0x2E
      expect(ir1000.b).toBe(46) // 0x2E

      const ir751 = wavelengthToRgb(750.1)
      expect(ir751.visible).toBe(false)
      expect(ir751.r).toBe(139)
      expect(ir751.g).toBe(46)
      expect(ir751.b).toBe(46)
    })

    it('treats 380 nm and 750 nm as visible boundaries inclusive', () => {
      const at380 = wavelengthToRgb(380)
      expect(at380.visible).toBe(true)

      const at750 = wavelengthToRgb(750)
      expect(at750.visible).toBe(true)
    })

    it('exhibits intensity falloff near 380–420 and 700–750 nm', () => {
      const edgeViolet = wavelengthToRgb(380)
      const fullViolet = wavelengthToRgb(420)
      // At 380, intensity factor is 0.3 vs 1.0 at 420
      expect(edgeViolet.b).toBeLessThan(fullViolet.b)

      const fullRed = wavelengthToRgb(700)
      const edgeRed = wavelengthToRgb(750)
      // At 750, intensity factor is 0.3 vs 1.0 at 700
      expect(edgeRed.r).toBeLessThan(fullRed.r)
    })

    it('maps 500 nm to green-cyan', () => {
      const color = wavelengthToRgb(500)
      expect(color.visible).toBe(true)
      expect(color.g).toBe(255)
      expect(color.b).toBeGreaterThan(0)
    })

    it('ensures all channels are integers in the range 0..255', () => {
      const sampleWavelengths = [300, 380, 400, 434, 486, 500, 520, 589, 656, 700, 750, 800, 1875]
      for (const nm of sampleWavelengths) {
        const { r, g, b } = wavelengthToRgb(nm)
        expect(Number.isInteger(r)).toBe(true)
        expect(Number.isInteger(g)).toBe(true)
        expect(Number.isInteger(b)).toBe(true)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThanOrEqual(255)
        expect(g).toBeGreaterThanOrEqual(0)
        expect(g).toBeLessThanOrEqual(255)
        expect(b).toBeGreaterThanOrEqual(0)
        expect(b).toBeLessThanOrEqual(255)
      }
    })
  })

  describe('wavelengthToCss', () => {
    it('returns an rgb(...) CSS color string for visible wavelengths', () => {
      expect(wavelengthToCss(656)).toBe('rgb(255, 0, 0)')
      const css486 = wavelengthToCss(486)
      expect(css486).toMatch(/^rgb\(\d+,\s*\d+,\s*\d+\)$/)
    })

    it('returns rgb fallback strings for non-visible wavelengths', () => {
      expect(wavelengthToCss(300)).toBe('rgb(123, 97, 255)')
      expect(wavelengthToCss(1000)).toBe('rgb(139, 46, 46)')
    })
  })
})
