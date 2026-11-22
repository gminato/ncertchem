import { describe, expect, it } from 'vitest'
import {
  CONFIG_ROW_SYMBOLS,
  actinoidLadder,
  actinoidPmPerStep,
  actinoidRadiusPoints,
  actinoidSubshells,
  lanthanoidLadder,
  lanthanoidPmPerStep,
  lanthanoidRadiusPoints,
  maxActinoidState,
} from './actinoid-steps'

describe('actinoid Scrolly data (Section 10)', () => {
  it('draws Th with no 5f box and the 7s pair last in every configuration row', () => {
    const th = actinoidSubshells('Th')
    expect(th.map((t) => t.subshell)).toEqual(['6d', '7s'])
    for (const symbol of CONFIG_ROW_SYMBOLS) {
      const terms = actinoidSubshells(symbol)
      expect(terms[terms.length - 1]).toEqual({ subshell: '7s', electrons: 2 })
    }
  })

  it('reads Am and Lr from Table 4.10 as printed', () => {
    expect(actinoidSubshells('Am')).toEqual([
      { subshell: '5f', electrons: 7 },
      { subshell: '7s', electrons: 2 },
    ])
    expect(actinoidSubshells('Lr')).toEqual([
      { subshell: '5f', electrons: 14 },
      { subshell: '6d', electrons: 1 },
      { subshell: '7s', electrons: 2 },
    ])
  })

  it('leaves Th and Pa radii as gaps and Lu as a gap', () => {
    const an = actinoidRadiusPoints()
    expect(an.find((p) => p.symbol === 'Th')?.pm).toBeNull()
    expect(an.find((p) => p.symbol === 'Pa')?.pm).toBeNull()
    expect(an.find((p) => p.symbol === 'Cf')?.pm).toBe(98)
    expect(lanthanoidRadiusPoints().find((p) => p.symbol === 'Lu')?.pm).toBeNull()
  })

  it('computes the per-step falls from the printed radii', () => {
    // Ce 103 -> Yb 86 over 12 steps; U 103 -> Cf 98 over 6 steps.
    expect(lanthanoidPmPerStep()).toBeCloseTo(17 / 12, 6)
    expect(actinoidPmPerStep()).toBeCloseTo(5 / 6, 6)
  })

  it('shows +7 for Np and Pu and nothing above +3 from Cf on (Table 4.11)', () => {
    expect(maxActinoidState('Np')).toBe(7)
    expect(maxActinoidState('Pu')).toBe(7)
    expect(maxActinoidState('Am')).toBe(6)
    expect(maxActinoidState('Cf')).toBe(3)
    const cells = actinoidLadder()
    expect(cells.filter((c) => c.symbol === 'Cf').map((c) => c.state)).toEqual([3])
    expect(cells.filter((c) => c.symbol === 'Th').map((c) => c.state)).toEqual([4])
  })

  it('shows +4 only for the five lanthanoids printed with a Ln4+ configuration, and no hollow La', () => {
    const cells = lanthanoidLadder()
    const fourth = cells.filter((c) => c.state === 4).map((c) => c.symbol)
    expect(fourth).toEqual(['Ce', 'Pr', 'Nd', 'Tb', 'Dy'])
    expect(cells.some((c) => c.symbol === 'La' && c.hollow)).toBe(false)
    expect(cells.filter((c) => c.state === 3)).toHaveLength(15)
  })
})
