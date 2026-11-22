import { describe, expect, it } from 'vitest'
import { dBlockStripHeight } from '@/components/vocab/dblock'
import { configDisplay } from '@/lib/chem/ncert-c12-unit4-tables'
import { outerConfig, ionConfig, dElectronCount, isTransitionElement } from '@/lib/chem/dblock'
import {
  CLOSING_SYMBOLS,
  FILL_ROWS,
  fillRevealOpacity,
  boxesFor,
  getConfigStep,
  outerElectrons,
  plainOrder,
} from './dblock-configurations-steps'

describe('d-block configuration Steps', () => {
  it('gives the five Steps their views (0-based, last view held)', () => {
    expect([0, 1, 2, 3, 4, 9].map(getConfigStep)).toEqual(['table', 'series', 'fill', 'verdict', 'closed', 'closed'])
  })

  it('draws the 3d row in two lines of five, Sc to Zn in order', () => {
    expect(FILL_ROWS.map((r) => r.length)).toEqual([5, 5])
    expect(FILL_ROWS.flat()).toEqual(['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn'])
  })

  it('shows the Cr and Cu exceptions and their plain order', () => {
    expect(configDisplay({ terms: boxesFor('Cr') }, false)).toBe('3d⁵4s¹')
    expect(configDisplay({ terms: plainOrder(boxesFor('Cr')) }, false)).toBe('3d⁴4s²')
    expect(configDisplay({ terms: plainOrder(boxesFor('Cu')) }, false)).toBe('3d⁹4s²')
  })

  it('makes every closing atom sum to its group number 12', () => {
    for (const s of CLOSING_SYMBOLS) {
      expect(outerElectrons(boxesFor(s))).toBe(12)
      expect(isTransitionElement(s).verdict).toBe(false)
    }
  })

  it('takes the verdict counts from the lib (Sc transition, Zn not; Ti³⁺, Cu²⁺ count; Zn²⁺ does not)', () => {
    expect(isTransitionElement('Sc').verdict).toBe(true)
    expect(isTransitionElement('Zn').verdict).toBe(false)
    expect(dElectronCount('Ti', 3)).toBe(1)
    expect(dElectronCount('Cu', 2)).toBe(9)
    expect(dElectronCount('Zn', 2)).toBe(10)
    expect(ionConfig('Zn', 2).terms.map((t) => t.subshell)).toEqual(['3d'])
  })

  it('keeps the d-block strip inside the panel height', () => {
    expect(44 + dBlockStripHeight(true) + 30).toBeLessThanOrEqual(460)
    expect(44 + dBlockStripHeight(true) + 40 + 60).toBeLessThanOrEqual(460)
  })

  it('reads the outer configuration as NCERT prints it, (n−1)d before ns', () => {
    expect(outerConfig('Cu').config.terms.map((t) => t.subshell)).toEqual(['3d', '4s'])
  })

  it('fades the ten 3d cells in one after another, and shows all ten at the end', () => {
    expect([0, 1, 2].map((i) => fillRevealOpacity(i, 0))).toEqual([0, 0, 0])
    expect(fillRevealOpacity(0, 0.05)).toBeCloseTo(0.5)
    expect(fillRevealOpacity(1, 0.1)).toBe(0)
    expect(fillRevealOpacity(9, 1)).toBe(1)
    expect(Array.from({ length: 10 }, (_, i) => fillRevealOpacity(i, 1))).toEqual(Array(10).fill(1))
  })
})
