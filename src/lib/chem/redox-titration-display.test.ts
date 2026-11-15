import { describe, expect, it } from 'vitest'
import { REDOX_TITRATIONS, type RedoxTitrationType } from './redox-titration'
import {
  TITRATION_EQUATIONS_MHCHEM,
  flaskAppearance,
  formatMolesText,
  progressToward,
} from './redox-titration-display'

const TYPES: RedoxTitrationType[] = [
  'permanganate-fe',
  'permanganate-oxalate',
  'dichromate-fe',
  'iodometric-cu-thiosulphate',
]

describe('redox-titration-display.ts', () => {
  describe('equations', () => {
    it('agrees with the foundation \\ce{} equation of each titration', () => {
      for (const type of TYPES) {
        const wrapped = REDOX_TITRATIONS[type].equation
        for (const line of TITRATION_EQUATIONS_MHCHEM[type]) {
          expect(wrapped).toContain(`\\ce{${line}}`)
        }
      }
    })

    it('never contains a \\ce wrapper or a raw "^(" exponent', () => {
      for (const type of TYPES) {
        for (const line of TITRATION_EQUATIONS_MHCHEM[type]) {
          expect(line).not.toContain('\\ce')
          expect(line).not.toContain('^(')
        }
      }
    })
  })

  describe('formatMolesText', () => {
    it('uses a two-decimal mantissa and unicode superscripts', () => {
      expect(formatMolesText(0.001)).toBe('1.00 × 10⁻³ mol')
      expect(formatMolesText(0.00125)).toBe('1.25 × 10⁻³ mol')
      expect(formatMolesText(0.0001)).toBe('1.00 × 10⁻⁴ mol')
      expect(formatMolesText(0)).toBe('0 mol')
    })
  })

  describe('flaskAppearance', () => {
    const base = { eqVolMl: 10, starchAdded: false }

    it('dichromate is nearly colourless at 0 mL, green mid-titration, violet-blue past equivalence', () => {
      expect(flaskAppearance({ ...base, type: 'dichromate-fe', addedMl: 0 })).toMatch(/Nearly colourless/)
      expect(flaskAppearance({ ...base, type: 'dichromate-fe', addedMl: 5 })).toMatch(/Green/)
      expect(flaskAppearance({ ...base, type: 'dichromate-fe', addedMl: 10 })).toMatch(/violet-blue/)
    })

    it('iodometry is brown at 0 mL and never blue-black before starch is added', () => {
      expect(flaskAppearance({ ...base, type: 'iodometric-cu-thiosulphate', addedMl: 0 })).toMatch(/Brown/)
      expect(flaskAppearance({ ...base, type: 'iodometric-cu-thiosulphate', addedMl: 8 })).toMatch(/Pale straw yellow/)
      expect(flaskAppearance({ ...base, type: 'iodometric-cu-thiosulphate', addedMl: 5 })).toMatch(/Yellow-brown/)
    })

    it('iodometry is blue-black with starch, then off-white at the end point', () => {
      expect(
        flaskAppearance({ ...base, type: 'iodometric-cu-thiosulphate', addedMl: 8, starchAdded: true }),
      ).toMatch(/blue-black/)
      expect(
        flaskAppearance({ ...base, type: 'iodometric-cu-thiosulphate', addedMl: 10, starchAdded: true }),
      ).toMatch(/Off-white/)
    })

    it('permanganate is colourless before and pink at the end point', () => {
      expect(flaskAppearance({ ...base, type: 'permanganate-fe', addedMl: 9.9 })).toBe('Colourless')
      expect(flaskAppearance({ ...base, type: 'permanganate-fe', addedMl: 10 })).toBe('First lasting faint pink')
    })
  })

  describe('progressToward', () => {
    it('is clamped to [0, 1]', () => {
      expect(progressToward(0, 10)).toBe(0)
      expect(progressToward(5, 10)).toBeCloseTo(0.5, 10)
      expect(progressToward(15, 10)).toBe(1)
    })
  })
})
