import { describe, expect, it } from 'vitest'
import {
  IONIZATION_STEP_COUNT,
  clampIonizationStep,
  ionizationPairForStep,
  ionizationTargetForStep,
} from './ionization-steps'
import { TABLE_STEP_COUNT, clampTableStep, tableTargetForStep } from './table-steps'

describe('IonizationTrends steps', () => {
  it('has four Steps: period dips, Be and B, N and O, then group 1', () => {
    expect(IONIZATION_STEP_COUNT).toBe(4)
  })

  it('clamps out-of-range and non-finite Steps', () => {
    expect(clampIonizationStep(-3)).toBe(0)
    expect(clampIonizationStep(99)).toBe(IONIZATION_STEP_COUNT - 1)
    expect(clampIonizationStep(Number.NaN)).toBe(0)
  })

  it('draws the period charts with callouts in Step 0 and no orbital panel', () => {
    const t = ionizationTargetForStep(0)
    expect(t.periodDraw).toBe(1)
    expect(t.dips).toBe(1)
    expect(t.boxes).toBe(0)
    expect(t.groupAlpha).toBe(0)
  })

  it('shows the orbital panel for Be and B, then N and O, with the period charts faded', () => {
    expect(ionizationPairForStep(1)).toBe('BeB')
    expect(ionizationPairForStep(2)).toBe('NO')
    for (const step of [1, 2]) {
      const t = ionizationTargetForStep(step)
      expect(t.boxes).toBe(1)
      expect(t.dips).toBe(0)
      expect(t.periodAlpha).toBe(0)
    }
  })

  it('draws the group 1 chart in Step 3 and hides the period charts', () => {
    const t = ionizationTargetForStep(3)
    expect(t.groupDraw).toBe(1)
    expect(t.groupAlpha).toBe(1)
    expect(t.periodAlpha).toBe(0)
    expect(ionizationPairForStep(3)).toBe('none')
  })
})

describe('EnergeticsTable steps', () => {
  it('has four Steps', () => {
    expect(TABLE_STEP_COUNT).toBe(4)
  })

  it('clamps out-of-range Steps', () => {
    expect(clampTableStep(-1)).toBe(0)
    expect(clampTableStep(10)).toBe(TABLE_STEP_COUNT - 1)
  })

  it('colours by electron gain enthalpy, then picks out the halogens', () => {
    expect(tableTargetForStep(0)).toEqual({ view: 'gainEnthalpy', reveal: 1, halogensOnly: false })
    expect(tableTargetForStep(1)).toEqual({ view: 'gainEnthalpy', reveal: 1, halogensOnly: true })
  })

  it('switches to electronegativity, then to the metal and non-metal shading', () => {
    expect(tableTargetForStep(2).view).toBe('electronegativity')
    expect(tableTargetForStep(3).view).toBe('category')
  })
})
