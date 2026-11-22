import { describe, expect, it } from 'vitest'
import { evaluateWernerComplex, WERNER_PRESETS } from './werner-precipitation'

describe('evaluateWernerComplex', () => {
  it('matches all four Table 5.1 presets accurately', () => {
    const expected = [
      { id: 'yellow', agcl: 3, charge: 3, electrolyte: '1:3', formula: '[Co(NH₃)₆]Cl₃' },
      { id: 'purple', agcl: 2, charge: 2, electrolyte: '1:2', formula: '[CoCl(NH₃)₅]Cl₂' },
      { id: 'green', agcl: 1, charge: 1, electrolyte: '1:1', formula: '[CoCl₂(NH₃)₄]Cl' },
      { id: 'violet', agcl: 1, charge: 1, electrolyte: '1:1', formula: '[CoCl₂(NH₃)₄]Cl' },
    ] as const

    WERNER_PRESETS.forEach((preset, idx) => {
      const res = evaluateWernerComplex(preset.ammonia, preset.boundCl, preset.arrangement)
      expect(res.matchedPreset).toBe(expected[idx].id)
      expect(res.agclMoles).toBe(expected[idx].agcl)
      expect(res.entityCharge).toBe(expected[idx].charge)
      expect(res.electrolyte).toBe(expected[idx].electrolyte)
      expect(res.fullFormula).toBe(expected[idx].formula)
      expect(res.verdict).toBe('secondary valence 6 satisfied')
      expect(res.status).toBe('satisfied')
    })
  })

  it('distinguishes green (opposite) and violet (neighbouring) isomers with isomerNote', () => {
    const green = evaluateWernerComplex(4, 2, 'trans')
    const violet = evaluateWernerComplex(4, 2, 'cis')

    expect(green.fullFormula).toBe(violet.fullFormula)
    expect(green.sites[0]).toBe('Cl')
    expect(green.sites[3]).toBe('Cl')
    expect(violet.sites[0]).toBe('Cl')
    expect(violet.sites[1]).toBe('Cl')
    expect(green.isomerNote).toContain('Green isomer')
    expect(violet.isomerNote).toContain('Violet isomer')
  })

  it('handles neutral complex [CoCl3(NH3)3] with zero counter ions', () => {
    const neutral = evaluateWernerComplex(3, 3)
    expect(neutral.counterIons).toBe(0)
    expect(neutral.agclMoles).toBe(0)
    expect(neutral.entityCharge).toBe(0)
    expect(neutral.electrolyte).toBe('none (neutral)')
    expect(neutral.fullFormula).toBe('[CoCl₃(NH₃)₃]')
    expect(neutral.verdict).toBe('secondary valence 6 satisfied')
  })

  it('flags positions empty when fewer than 6 groups are attached', () => {
    const under = evaluateWernerComplex(3, 1)
    expect(under.totalAttached).toBe(4)
    expect(under.status).toBe('empty')
    expect(under.verdict).toBe('positions empty')
    expect(under.emptyPositions).toBe(2)
    expect(under.sites.filter((s) => s === 'empty')).toHaveLength(2)
  })

  it('flags too many groups when more than 6 groups are attached', () => {
    const over = evaluateWernerComplex(6, 2)
    expect(over.totalAttached).toBe(8)
    expect(over.status).toBe('overflow')
    expect(over.verdict).toBe('too many groups')
    expect(over.overflowGroups).toBe(2)
  })
})
