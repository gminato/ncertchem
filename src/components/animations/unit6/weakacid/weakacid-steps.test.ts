import { describe, expect, it } from 'vitest'
import { weakAcid } from '@/lib/chem/acid-base'
import { weakAcidReport } from '@/lib/chem/weak-acid-lab'
import { BENZOIC_KA, WEAK_ACID_STEP_COUNT, concText, percentText, sciText, weakAcidSteps } from './weakacid-steps'

describe('weakAcidSteps', () => {
  const steps = weakAcidSteps()

  it('has one state per Step', () => {
    expect(steps).toHaveLength(WEAK_ACID_STEP_COUNT)
  })

  it('takes every α and [H₃O⁺] from the library quadratic', () => {
    for (const step of steps) {
      const exact = weakAcid(step.c, BENZOIC_KA)
      expect(step.report.alpha).toBeCloseTo(exact.alpha, 12)
      expect(step.report.hConc).toBeCloseTo(exact.hConc, 15)
    }
  })

  it('keeps the first Step unsolved, with an empty beaker and only the I row', () => {
    expect(steps[0].beakerFraction).toBe(0)
    expect(steps[0].revealStep).toBe(1)
  })

  it('shows the three concentrations in the order 0.200, 0.0200, 0.00200 mol L⁻¹', () => {
    expect(steps.map((s) => s.c)).toEqual([0.2, 0.2, 0.02, 0.002, 0.002])
  })

  it('makes α rise on dilution, with the same Ka throughout', () => {
    const solved = [steps[1], steps[2], steps[3]].map((s) => s.report.alpha)
    expect(solved[0]).toBeLessThan(solved[1])
    expect(solved[1]).toBeLessThan(solved[2])
    expect(steps.every((s) => s.report.ka === BENZOIC_KA)).toBe(true)
  })

  it('shows the approximation holding at 0.200 M and failing at 0.0200 M', () => {
    expect(steps[1].report.approximationHolds).toBe(true)
    expect(steps[2].report.approximationHolds).toBe(false)
  })

  it('places the pH readout on the last Step only', () => {
    expect(steps.filter((s) => s.showPH).map((s) => s.c)).toEqual([0.002])
  })

  it('writes the ICE rows from the report, with the change row as −x, +x and +x', () => {
    const r = weakAcidReport(0.2, BENZOIC_KA)
    expect(steps[1].report.ice.equilibrium.HA).toBeCloseTo(0.2 - r.hConc, 12)
    expect(steps[1].report.ice.change.H3O).toBeCloseTo(r.hConc, 12)
  })
})

describe('text helpers', () => {
  it('formats scientific notation with a true minus and superscripts', () => {
    expect(sciText(3.5732e-3)).toBe('3.57 × 10⁻³')
    expect(sciText(9.996e-5)).toBe('1.00 × 10⁻⁴')
    expect(sciText(0)).toBe('0')
  })

  it('writes concentrations at or above 0.01 as plain decimals and smaller ones in scientific form', () => {
    expect(concText(0.19643)).toBe('0.196')
    expect(concText(0.01889)).toBe('0.0189')
    expect(concText(0.00357)).toBe('3.57 × 10⁻³')
  })

  it('formats α as a percentage with two figures below 10 %', () => {
    expect(percentText(0.01787)).toBe('1.79 %')
    expect(percentText(0.16476)).toBe('16.5 %')
  })
})
