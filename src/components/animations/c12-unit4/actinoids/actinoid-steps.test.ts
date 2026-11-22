import { describe, expect, it } from 'vitest'
import {
  CONFIG_ROW_SYMBOLS,
  actinoidLadder,
  actinoidRadiusPoints,
  actinoidSubshells,
  lanthanoidLadder,
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

  it('keeps the printed radii for the plot and no per-step figure', () => {
    expect(actinoidRadiusPoints().find((p) => p.symbol === 'U')?.pm).toBe(103)
    expect(lanthanoidRadiusPoints().find((p) => p.symbol === 'Ce')?.pm).toBe(103)
    expect(lanthanoidRadiusPoints().find((p) => p.symbol === 'Yb')?.pm).toBe(86)
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

  it('draws +4 only for Ce, Pr, Nd, Tb and Dy, +2 only for Sm, Eu and Yb, and +3 for all fifteen', () => {
    const cells = lanthanoidLadder()
    expect(cells.filter((c) => c.state === 4).map((c) => c.symbol)).toEqual(['Ce', 'Pr', 'Nd', 'Tb', 'Dy'])
    expect(cells.filter((c) => c.state === 2).map((c) => c.symbol)).toEqual(['Sm', 'Eu', 'Yb'])
    expect(cells.filter((c) => c.state === 3)).toHaveLength(15)
    expect(cells.some((c) => c.symbol === 'Ce' && c.state === 2)).toBe(false)
    expect(cells.some((c) => c.symbol === 'Lu' && c.state !== 3)).toBe(false)
  })
})
