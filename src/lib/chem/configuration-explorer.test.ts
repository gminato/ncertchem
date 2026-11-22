import { describe, expect, it } from 'vitest'
import { EXPLORER_CHARGES, EXPLORER_SERIES, explorerState, seriesOfSymbol } from './configuration-explorer'
import { D_BLOCK_SERIES } from './dblock'
import { NCERT_OUTER_CONFIGURATIONS } from './ncert-c12-unit4-tables'

const sub = (state: ReturnType<typeof explorerState>) => state.subshells.map((s) => `${s.subshell}:${s.electrons}/${s.removed}`)

describe('explorerState: configurations from Table 4.1 with the ns-first ion rule', () => {
  it('draws the atom Cr as 3d5 4s1 with nothing removed', () => {
    const cr = explorerState('Cr', 0)
    expect(cr.display).toBe('[Ar] 3d⁵4s¹')
    expect(sub(cr)).toEqual(['3d:5/0', '4s:1/0'])
    expect(cr.label).toBe('Cr')
  })

  it('removes 4s before 3d for Fe²⁺ and Fe³⁺', () => {
    expect(sub(explorerState('Fe', 2))).toEqual(['3d:6/0', '4s:0/2'])
    expect(explorerState('Fe', 2).display).toBe('[Ar] 3d⁶')
    expect(sub(explorerState('Fe', 3))).toEqual(['3d:5/1', '4s:0/2'])
  })

  it('shows Ti³⁺ as 3d1 and Cu²⁺ as 3d9', () => {
    const ti = explorerState('Ti', 3)
    expect(ti.label).toBe('Ti³⁺')
    expect(ti.display).toBe('[Ar] 3d¹')
    expect(sub(ti)).toEqual(['3d:1/1', '4s:0/2'])
    expect(sub(explorerState('Cu', 2))).toEqual(['3d:9/1', '4s:0/1'])
  })

  it('keeps the empty 5s of the Pd exception as a zero-electron box', () => {
    const pd = explorerState('Pd', 0)
    expect(sub(pd)).toEqual(['4d:10/0', '5s:0/0'])
    expect(pd.display).toBe('[Kr] 4d¹⁰')
    expect(explorerState('Pt', 0).display).toBe('[Xe] 4f¹⁴ 5d⁹6s¹')
    expect(explorerState('La', 0).display).toBe('[Xe] 5d¹6s²')
    expect(explorerState('Rf', 0).display).toBe('[Rn] 5f¹⁴ 6d²7s²')
  })

  it('draws 5d and 6d rows with the same rule (Pt, Hf³⁺)', () => {
    expect(sub(explorerState('Pt', 0))).toEqual(['5d:9/0', '6s:1/0'])
    expect(sub(explorerState('Hf', 3))).toEqual(['5d:1/1', '6s:0/2'])
  })

  it('removes every electron that was printed, so removed plus left equals the atom total', () => {
    for (const row of NCERT_OUTER_CONFIGURATIONS) {
      const total = row.config.terms.reduce((sum, t) => sum + t.electrons, 0)
      for (const charge of EXPLORER_CHARGES) {
        const state = explorerState(row.symbol, charge)
        const left = state.subshells.reduce((sum, s) => sum + s.electrons, 0)
        const removed = state.subshells.reduce((sum, s) => sum + s.removed, 0)
        expect(left + removed).toBe(total)
        expect(removed).toBe(charge)
      }
    }
  })
})

describe('explorerState: verdicts', () => {
  it('calls Sc a transition element (3d1) and Zn not one', () => {
    expect(explorerState('Sc', 0).verdict).toBe(true)
    expect(explorerState('Zn', 0).verdict).toBe(false)
    expect(explorerState('Zn', 0).verdictText).toContain('not a transition element')
  })

  it('judges ions on their own d subshell', () => {
    expect(explorerState('Zn', 2).verdict).toBe(false)
    expect(explorerState('Zn', 2).verdictText).toContain('Zn²⁺ is not a transition ion')
    expect(explorerState('Cu', 2).verdict).toBe(true)
    expect(explorerState('Cu', 2).verdictText).toContain('Cu²⁺ is a transition ion')
    expect(explorerState('Sc', 3).verdict).toBe(false)
  })

  it('marks Pd a transition element through Pd²⁺ (d8), not through its atom', () => {
    const pd = explorerState('Pd', 0)
    expect(pd.atom.verdict).toBe(true)
    expect(explorerState('Pd', 2).verdict).toBe(true)
  })

  it('marks Cd and Hg as not transition elements, like Zn', () => {
    expect(explorerState('Cd', 0).verdict).toBe(false)
    expect(explorerState('Hg', 0).verdict).toBe(false)
  })
})

describe('explorerState: group sum for the atom', () => {
  it('adds d and s electrons to the group number', () => {
    expect(explorerState('Cr', 0).groupSum).toEqual({ d: 5, s: 1, group: 6 })
    expect(explorerState('Cu', 0).groupSum).toEqual({ d: 10, s: 1, group: 11 })
    expect(explorerState('Zn', 0).groupSum).toEqual({ d: 10, s: 2, group: 12 })
    expect(explorerState('Pt', 0).groupSum).toEqual({ d: 9, s: 1, group: 10 })
    expect(explorerState('Pd', 0).groupSum).toEqual({ d: 10, s: 0, group: 10 })
  })
})

describe('series helpers', () => {
  it('maps each d-block symbol to its series and offers four tabs', () => {
    expect(EXPLORER_SERIES).toEqual(['3d', '4d', '5d', '6d'])
    expect(seriesOfSymbol('Pt')).toBe('5d')
    expect(seriesOfSymbol('Cr')).toBe('3d')
    expect(seriesOfSymbol('Fe')).toBe('3d')
    expect(seriesOfSymbol('Na')).toBeNull()
    expect(D_BLOCK_SERIES['4d'][0]).toBe('Y')
  })

  it('main line shows the outer configuration; the core is in display only (Pt)', () => {
    expect(explorerState('Pt', 0).outer).toBe('5d⁹6s¹')
    expect(explorerState('Cr', 0).outer).toBe('3d⁵4s¹')
    expect(explorerState('Ti', 3).outer).toBe('3d¹')
  })

  it('an ion verdict names only the ion, not the atom reason', () => {
    expect(explorerState('Cu', 2).verdictText).not.toContain('is a transition element')
    expect(explorerState('Cu', 0).verdictText).toContain('is a transition element')
  })

  it('summary text names the species and its verdict', () => {
    expect(explorerState('Ti', 3).summary.startsWith('Ti³⁺: [Ar] 3d¹.')).toBe(true)
  })
})
