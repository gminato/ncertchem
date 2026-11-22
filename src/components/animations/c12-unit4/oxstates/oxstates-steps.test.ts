import { describe, expect, it } from 'vitest'
import { dElectronCount, oxidationStateCount } from '@/lib/chem/dblock'
import {
  METALS,
  STEP_COUNT,
  endNotes,
  getOxStateStep,
  group6Cells,
  mnRemovedTokens,
  mnRungs,
  stateCounts,
} from './oxstates-steps'

describe('oxidation-state Steps', () => {
  it('has six Steps with the right layers switched on', () => {
    expect(STEP_COUNT).toBe(6)
    expect(getOxStateStep(0).fill).toBe(false)
    expect(getOxStateStep(1).counts).toBe(true)
    expect(getOxStateStep(2).ends).toBe(true)
    expect(getOxStateStep(3).mnLadder).toBe(true)
    expect(getOxStateStep(4).tinLadder).toBe(true)
    expect(getOxStateStep(5).group6).toBe(true)
    expect(getOxStateStep(-3).fill).toBe(false)
    expect(getOxStateStep(99).group6).toBe(true)
  })

  it('counts the states per metal (Table 4.3) and peaks at Mn', () => {
    expect(stateCounts()).toEqual([1, 3, 4, 5, 6, 4, 3, 3, 2, 1])
    expect(METALS[stateCounts().indexOf(Math.max(...stateCounts()))]).toBe('Mn')
    expect(oxidationStateCount('Zn')).toBe(1)
  })

  it('gives the Sc and Zn notes from Table 4.1 and the one state each shows', () => {
    const notes = endNotes()
    expect(notes.map((n) => n.symbol)).toEqual(['Sc', 'Zn'])
    expect(notes[0]).toMatchObject({ state: 3 })
    expect(notes[1]).toMatchObject({ state: 2 })
    expect(notes[0]!.config).toBe('3d¹4s²')
    expect(notes[1]!.config).toBe('3d¹⁰4s²')
  })

  it('draws Mn rungs with d electrons left: 5, 4, 3, 2, 1, 0', () => {
    const rungs = mnRungs()
    expect(rungs.map((r) => r.state)).toEqual([2, 3, 4, 5, 6, 7])
    expect(rungs.map((r) => r.dCount)).toEqual([5, 4, 3, 2, 1, 0])
    expect(rungs.map((r) => dElectronCount('Mn', r.state))).toEqual([5, 4, 3, 2, 1, 0])
    expect(rungs[5]!.label).toBe('Mn⁷⁺')
  })

  it('removes the 4s pair first, then one 3d token per rung', () => {
    expect([2, 3, 4, 5, 6, 7].map(mnRemovedTokens)).toEqual([2, 3, 4, 5, 6, 7])
  })

  it('draws group 6 with only the +6 state, Cr as a strong oxidant only', () => {
    const cells = group6Cells()
    expect(cells.map((c) => c.symbol)).toEqual(['Cr', 'Mo', 'W'])
    expect(cells.map((c) => c.strongOxidant)).toEqual([true, false, false])
    expect(cells[0]!.strength).toBeLessThan(cells[1]!.strength)
  })
})
