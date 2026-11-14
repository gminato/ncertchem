import { describe, expect, it } from 'vitest'
import { electronConfiguration } from '@/lib/chem/quantum'
import { countsOf, configurationText, stateAfter, totalElectrons } from '@/lib/chem/orbital-builder'
import {
  AUFBAU_STEP_COUNT,
  BUILD_ORDER,
  BUILD_PLACED_STEPS,
  EXCHANGE_STEP_COUNT,
  aufbauDescription,
  aufbauTargetForStep,
  buildDescription,
  buildTargetForStep,
  clampStep,
  exchangeDescription,
  exchangeTargetForStep,
} from './filling-steps'

describe('clampStep', () => {
  it('keeps the index in range and rounds it', () => {
    expect(clampStep(-3, 5)).toBe(0)
    expect(clampStep(9, 5)).toBe(4)
    expect(clampStep(2.4, 5)).toBe(2)
    expect(clampStep(Number.NaN, 5)).toBe(0)
  })
})

describe('aufbau steps', () => {
  it('visits Z = 0, 10, 20, 24 and 36 with the diagonal fully drawn', () => {
    const zs = Array.from({ length: AUFBAU_STEP_COUNT }, (_, i) => aufbauTargetForStep(i))
    expect(zs.map((s) => s.z)).toEqual([0, 10, 20, 24, 36])
    expect(zs.every((s) => s.draw === 1)).toBe(true)
  })

  it('describes chromium with the ground state, not the plain Aufbau guess', () => {
    const text = aufbauDescription(3)
    expect(text).toContain(electronConfiguration(24).text)
    expect(text).toContain('4s² 3d⁴')
  })
})

describe('build steps', () => {
  it('places 0, 4, 7, 8 and 24 electrons, which are N (7), O (8) and Cr (24)', () => {
    expect(BUILD_PLACED_STEPS).toEqual([0, 4, 7, 8, 24])
    expect(BUILD_ORDER).toHaveLength(24)
  })

  it('the first 7 and 8 placements give the N and O configurations', () => {
    const n = stateAfter(BUILD_ORDER, 7)
    expect(configurationText(countsOf(n))).toBe(electronConfiguration(7).text)
    const o = stateAfter(BUILD_ORDER, 8)
    expect(configurationText(countsOf(o))).toBe(electronConfiguration(8).text)
  })

  it('the full sequence ends in the Cr ground state', () => {
    const cr = stateAfter(BUILD_ORDER, 24)
    expect(totalElectrons(cr)).toBe(24)
    expect(configurationText(countsOf(cr))).toBe('1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵ 4s¹')
  })

  it('maps steps to placed counts and describes each', () => {
    expect(buildTargetForStep(2)).toEqual({ placed: 7 })
    expect(buildTargetForStep(99)).toEqual({ placed: 24 })
    for (let i = 0; i < BUILD_PLACED_STEPS.length; i++) {
      expect(buildDescription(i).length).toBeGreaterThan(20)
    }
  })
})

describe('exchange steps', () => {
  it('draws 10 pairs for d5 and 6 for d4 by the last Step', () => {
    expect(EXCHANGE_STEP_COUNT).toBe(4)
    expect(exchangeTargetForStep(0)).toEqual({ five: 0, four: 0 })
    expect(exchangeTargetForStep(1)).toEqual({ five: 10, four: 0 })
    expect(exchangeTargetForStep(3)).toEqual({ five: 10, four: 6 })
  })

  it('states the counts in its descriptions', () => {
    expect(exchangeDescription(1)).toContain('10')
    expect(exchangeDescription(3)).toContain('6')
  })
})
