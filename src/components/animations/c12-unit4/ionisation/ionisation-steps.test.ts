import { describe, expect, it } from 'vitest'
import { configurationLayout } from '@/components/vocab/dblock'
import {
  IONISATION_STEP_COUNT,
  SERIES_VALUES,
  SYMBOLS,
  gapOf,
  getIonisationStepState,
  ieValues,
  pairsFor,
  removalSubshells,
  rowFor,
} from './ionisation-steps'

describe('ionisation Steps', () => {
  it('has five Steps and clamps the index', () => {
    expect(IONISATION_STEP_COUNT).toBe(5)
    expect(getIonisationStepState(-3).step).toBe(0)
    expect(getIonisationStepState(99).step).toBe(4)
  })

  it('reads Table 4.2 for the ends of the row and the named elements', () => {
    expect(ieValues('Sc')).toMatchObject({ 1: 631, 2: 1235, 3: 2393 })
    expect(ieValues('Zn')).toMatchObject({ 1: 906, 2: 1734, 3: 3837 })
    expect(ieValues('Mn')[1]).toBeGreaterThan(ieValues('Cr')[1])
    expect(ieValues('Zn')[1]).toBeGreaterThan(ieValues('Cu')[1])
    expect(SERIES_VALUES).toHaveLength(SYMBOLS.length)
  })

  it('matches the Prose: the IE₂ and IE₃ rises and the gaps', () => {
    expect(ieValues('Zn')[2] - ieValues('Sc')[2]).toBe(499)
    expect(ieValues('Zn')[3] - ieValues('Sc')[3]).toBe(1444)
    expect(ieValues('Zn')[1] - ieValues('Sc')[1]).toBe(275)
    expect(gapOf('Mn', 'Fe', 3)).toBe(298)
    expect(gapOf('Cr', 'V', 2)).toBe(178)
    expect(gapOf('Cu', 'Ni', 2)).toBe(206)
    expect(gapOf('Zn', 'Cu', 2)).toBe(-224)
  })

  it('counts parallel-spin pairs with the Prose numbers', () => {
    expect(pairsFor('Mn', 2)).toBe(10)
    expect(pairsFor('Mn', 3)).toBe(6)
    expect(pairsFor('Fe', 2)).toBe(10)
    expect(pairsFor('Fe', 3)).toBe(10)
    expect(pairsFor('Cu', 1)).toBe(20)
    expect(pairsFor('Cu', 2)).toBe(16)
    expect(pairsFor('Zn', 2)).toBe(20)
    expect(pairsFor('Zn', 3)).toBe(16)
  })

  it('takes the 4s electron first and marks the one that left', () => {
    const zn = removalSubshells('Zn', 1)
    expect(zn.left).toEqual([
      { subshell: '3d', electrons: 10 },
      { subshell: '4s', electrons: 1 },
    ])
    expect(zn.right).toContainEqual({ subshell: '4s', electrons: 0, removed: 1 })
    const mn = removalSubshells('Mn', 2)
    expect(mn.right).toContainEqual({ subshell: '3d', electrons: 4, removed: 1 })
  })

  it('builds the configuration rows named in the Steps', () => {
    const v = rowFor('V', 2)
    expect(v.captionLeft).toBe('V⁺')
    expect(v.captionRight).toBe('V²⁺')
    expect(v.value).toBe(1414)
    expect(v.left).toEqual([
      { subshell: '3d', electrons: 3 },
      { subshell: '4s', electrons: 1 },
    ])
    const cr = rowFor('Cr', 2)
    expect(cr.left).toEqual([{ subshell: '3d', electrons: 5 }])
    expect(cr.right).toEqual([{ subshell: '3d', electrons: 4, removed: 1 }])
    expect(cr.value).toBe(1592)
    expect(rowFor('Zn', 3).value).toBe(3837)
  })

  it('keeps every Step inside the rows the panel can hold', () => {
    for (let s = 0; s < IONISATION_STEP_COUNT; s++) {
      const state = getIonisationStepState(s)
      for (const row of state.rows) {
        for (const config of [row.left, row.right]) {
          const layout = configurationLayout(config, 216, 26)
          expect(layout.height).toBeLessThanOrEqual(40)
        }
      }
      expect(state.rows.length * 100).toBeLessThanOrEqual(300)
    }
    expect(getIonisationStepState(4).rows.map((r) => r.element + r.level)).toEqual(['Cu2', 'Zn2', 'Zn3'])
  })
})
