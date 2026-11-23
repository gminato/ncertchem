import { describe, expect, it } from 'vitest'
import {
  COMPLEX_EFFECTS,
  EXPLORER_USES,
  explorerUseById,
  practiceOptionsFor,
  usesForEffect,
} from './complex-application-explorer'

describe('Complex Application Explorer model', () => {
  it('provides all 11 specified uses with unique ids', () => {
    expect(EXPLORER_USES).toHaveLength(11)
    expect(new Set(EXPLORER_USES.map((u) => u.id)).size).toBe(11)
  })

  it('covers all four complex-formation effects', () => {
    expect(COMPLEX_EFFECTS).toHaveLength(4)
    for (const eff of COMPLEX_EFFECTS) {
      expect(usesForEffect(eff.id).length).toBeGreaterThan(0)
    }
  })

  it('preserves NCERT oxidation states and coordination numbers from the table', () => {
    const gold = explorerUseById('gold')
    expect(gold.app.entityTex).toBe('[Au(CN)2]-')
    expect(gold.app.oxidationState).toBe(1)
    expect(gold.app.coordinationNumber).toBe(2)

    const nickel = explorerUseById('nickel')
    expect(nickel.app.oxidationState).toBe(0)
    expect(nickel.app.coordinationNumber).toBe(4)

    const hypo = explorerUseById('hypo')
    expect(hypo.app.entityTex).toBe('[Ag(S2O3)2]^3-')
    expect(hypo.app.oxidationState).toBe(1)
    expect(hypo.app.coordinationNumber).toBe(2)
  })

  it('generates 4 distinct practice options with exactly one correct answer for every use', () => {
    for (const u of EXPLORER_USES) {
      const opts = practiceOptionsFor(u.id)
      expect(opts).toHaveLength(4)
      expect(opts.filter((o) => o.correct)).toHaveLength(1)
      expect(new Set(opts.map((o) => o.label)).size).toBe(4)
    }
  })

  it('keeps SVG entity labels concise without mid-word truncation while preserving full display names', () => {
    for (const u of EXPLORER_USES) {
      const svgLabel = u.svgEntityLabel ?? u.entityDisplay
      expect(svgLabel.length).toBeLessThanOrEqual(20)
      expect(svgLabel).not.toContain('...')
    }
    const b12 = explorerUseById('b12')
    expect(b12.entityDisplay).toBe('Vitamin B₁₂ (cyanocobalamine)')
    expect(b12.svgEntityLabel).toBe('Vitamin B₁₂')
  })

  it('contains no em or en dashes', () => {
    expect(JSON.stringify(EXPLORER_USES)).not.toMatch(/[\u2013\u2014]/)
    expect(JSON.stringify(COMPLEX_EFFECTS)).not.toMatch(/[\u2013\u2014]/)
  })
})
