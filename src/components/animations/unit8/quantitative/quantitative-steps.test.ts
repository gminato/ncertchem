import { describe, expect, it } from 'vitest'
import { analysisReadouts, analysisStepTargets, dumasPressure, EXAMPLE, EXAMPLE_READINGS, examplePercentages } from './quantitative-steps'

describe('the worked sample (Section 8.10 Scrolly)', () => {
  it('is 4-chloroaniline, named by the lib, weighed as 0.2500 g', () => {
    expect(EXAMPLE.name).toBe('4-chloroaniline')
    expect(EXAMPLE.formula).toBe('C6H6ClN')
  })

  it('the lib gives the percentages the Scrolly prints', () => {
    expect(examplePercentages()).toEqual({ C: '56.47', H: '4.74', NDumas: '10.98', NKjeldahl: '10.98', Cl: '27.82' })
  })

  it('the readings are the masses and volumes the Scrolly prints', () => {
    expect(EXAMPLE_READINGS.combustion.massCO2).toBe(0.5176)
    expect(EXAMPLE_READINGS.combustion.massH2O).toBe(0.1066)
    expect(EXAMPLE_READINGS.dumas.volumeMl).toBe(25)
    expect(EXAMPLE_READINGS.kjeldahl.alkaliMl).toBe(20.4)
    expect(EXAMPLE_READINGS.carius.mass).toBe(0.2811)
    expect(dumasPressure()).toBe('733.3')
  })
})

describe('Scrolly Step targets', () => {
  it('has four Steps, each a complete target state in [0, 1] or a volume inside the 30 mL scale', () => {
    const targets = analysisStepTargets()
    expect(targets).toHaveLength(4)
    for (const t of targets) {
      expect(t.progress).toBeGreaterThanOrEqual(0)
      expect(t.progress).toBeLessThanOrEqual(1)
      expect(t.volumeFraction).toBeGreaterThanOrEqual(0)
      expect(t.volumeFraction).toBeLessThanOrEqual(1)
    }
    expect(targets[1].volumeFraction).toBeCloseTo(25 / 30, 6)
    expect(targets[2].titrantMl).toBe(20.4)
    expect(targets[2].endPoint).toBe(true)
  })

  it('each Step has readout lines drawn from the lib numbers', () => {
    const lines = analysisReadouts()
    expect(lines).toHaveLength(4)
    expect(lines[0][2]).toContain('= 56.47')
    expect(lines[1][2]).toContain('= 10.98')
    expect(lines[2][1]).toContain('= 10.98')
    expect(lines[3]).toHaveLength(4)
    expect(lines[3][3]).toBe('= 27.82')
  })
})
