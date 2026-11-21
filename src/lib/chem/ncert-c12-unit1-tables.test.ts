import { describe, expect, it } from 'vitest'
import {
  GAS_CONSTANT_L_BAR,
  NCERT_HENRY_CONSTANTS,
  NCERT_SOLUTION_TYPES,
  NCERT_SOLVENT_CONSTANTS,
  NCERT_VANT_HOFF_SALTS,
} from './ncert-c12-unit1-tables'

describe('NCERT Class 12 Unit 1 reference tables', () => {
  it('lists all 9 binary solution types covering every solute-solvent phase combination', () => {
    expect(NCERT_SOLUTION_TYPES).toHaveLength(9)
    const pairs = new Set(NCERT_SOLUTION_TYPES.map((t) => `${t.solutePhase}-${t.solventPhase}`))
    expect(pairs.size).toBe(9)
  })

  it('shows Henry constant increasing with temperature for N2 and O2 (Table 1.2)', () => {
    const n2_293 = NCERT_HENRY_CONSTANTS.find((g) => g.id === 'n2-293')!
    const n2_303 = NCERT_HENRY_CONSTANTS.find((g) => g.id === 'n2-303')!
    const o2_293 = NCERT_HENRY_CONSTANTS.find((g) => g.id === 'o2-293')!
    const o2_303 = NCERT_HENRY_CONSTANTS.find((g) => g.id === 'o2-303')!
    expect(n2_303.khKbar).toBeGreaterThan(n2_293.khKbar)
    expect(o2_303.khKbar).toBeGreaterThan(o2_293.khKbar)
    expect(NCERT_HENRY_CONSTANTS).toHaveLength(11)
  })

  it('lists all 9 solvents in Table 1.3 with positive boiling/freezing constants and b.p. > f.p.', () => {
    expect(NCERT_SOLVENT_CONSTANTS).toHaveLength(9)
    for (const s of NCERT_SOLVENT_CONSTANTS) {
      expect(s.boilingPointK).toBeGreaterThan(s.freezingPointK)
      expect(s.kb).toBeGreaterThan(0)
      expect(s.kf).toBeGreaterThan(0)
    }
    const water = NCERT_SOLVENT_CONSTANTS.find((s) => s.id === 'water')!
    expect(water.kb).toBe(0.52)
    expect(water.kf).toBe(1.86)
  })

  it('shows experimental van’t Hoff factor i approaching the complete limit on dilution (Table 1.4)', () => {
    expect(NCERT_VANT_HOFF_SALTS).toHaveLength(4)
    for (const salt of NCERT_VANT_HOFF_SALTS) {
      expect(salt.iAt01m).toBeLessThan(salt.iAt001m)
      expect(salt.iAt001m).toBeLessThan(salt.iAt0001m)
      expect(salt.iAt0001m).toBeLessThan(salt.iComplete)
    }
    expect(GAS_CONSTANT_L_BAR).toBeCloseTo(0.08314, 5)
  })
})
