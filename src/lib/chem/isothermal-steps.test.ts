import { describe, expect, it } from 'vitest'
import { reversibleIsothermalWork } from './pv-work'
import {
  externalPressureAt,
  gasPressureBar,
  nRTBar,
  processFor,
  pvPath,
  stepPressuresBar,
  stepVolumes,
  totalWork,
  volumeAt,
  workFraction,
  workSoFar,
} from './isothermal-steps'

const EXPANSION = processFor('expansion')
const COMPRESSION = processFor('compression')
const STEP_COUNTS = [1, 2, 4, 8, 16] as const

describe('processFor', () => {
  it('runs an expansion from the small volume to the large one, and a compression back', () => {
    expect(EXPANSION).toMatchObject({ moles: 1, temperatureK: 300, startL: 6, endL: 12 })
    expect(COMPRESSION).toMatchObject({ moles: 1, temperatureK: 300, startL: 12, endL: 6 })
  })

  it('gives nRT = 24.942 L bar for the Section gas', () => {
    expect(nRTBar(EXPANSION)).toBeCloseTo(24.942, 6)
  })
})

describe('stepVolumes and step pressures', () => {
  it('places N + 1 evenly spaced boundaries with exact endpoints', () => {
    const v = stepVolumes(EXPANSION, 4)
    expect(v).toHaveLength(5)
    expect(v[0]).toBe(6)
    expect(v[4]).toBe(12)
    expect(v[2]).toBeCloseTo(9, 12)
  })

  it('sets each expansion step against a pressure below the gas pressure at its start', () => {
    const pressures = stepPressuresBar(EXPANSION, 8)
    const volumes = stepVolumes(EXPANSION, 8)
    pressures.forEach((p, j) => {
      expect(p).toBeLessThan(gasPressureBar(EXPANSION, volumes[j]))
    })
  })

  it('sets each compression step against a pressure above the gas pressure at its start', () => {
    const pressures = stepPressuresBar(COMPRESSION, 8)
    const volumes = stepVolumes(COMPRESSION, 8)
    pressures.forEach((p, j) => {
      expect(p).toBeGreaterThan(gasPressureBar(COMPRESSION, volumes[j]))
    })
  })

  it('rejects a step count that is not a positive integer', () => {
    expect(() => stepVolumes(EXPANSION, 0)).toThrow(RangeError)
    expect(() => stepVolumes(EXPANSION, 2.5)).toThrow(RangeError)
  })
})

describe('work values', () => {
  it('gives the one-step expansion as p_final × ΔV = −12.471 L bar', () => {
    const w = totalWork(EXPANSION, 1)
    expect(w.litreBar).toBeCloseTo(-(24.942 / 12) * 6, 6)
    expect(w.joule).toBeCloseTo(-1247.1, 1)
  })

  it('gives the reversible expansion as −2.303 nRT log(V_f / V_i) = −17.29 L bar', () => {
    const rev = reversibleIsothermalWork(1, 300, 6, 12)
    expect(totalWork(EXPANSION, 'reversible').litreBar).toBeCloseTo(rev.litreBar, 10)
    expect(rev.litreBar).toBeCloseTo(-17.2916, 3)
  })

  it('makes a compression positive, and the reversible compression the mirror of the expansion', () => {
    expect(totalWork(COMPRESSION, 'reversible').litreBar).toBeCloseTo(-totalWork(EXPANSION, 'reversible').litreBar, 10)
    expect(totalWork(COMPRESSION, 1).litreBar).toBeGreaterThan(0)
  })

  it('gives a one-step compression 144% of the reversible minimum (more work for fewer steps)', () => {
    expect(workFraction(COMPRESSION, 1)).toBeCloseTo(1.4424, 3)
  })

  it('gives a one-step expansion 72% of the reversible maximum', () => {
    expect(workFraction(EXPANSION, 1)).toBeCloseTo(0.7212, 3)
  })

  it('moves an expansion towards the reversible value as the steps increase', () => {
    const fractions = STEP_COUNTS.map((n) => workFraction(EXPANSION, n))
    for (let i = 1; i < fractions.length; i++) expect(fractions[i]).toBeGreaterThan(fractions[i - 1])
    expect(fractions.every((f) => f < 1)).toBe(true)
    expect(workFraction(EXPANSION, 1000)).toBeGreaterThan(0.999)
  })

  it('moves a compression towards the reversible minimum from above as the steps increase', () => {
    const fractions = STEP_COUNTS.map((n) => workFraction(COMPRESSION, n))
    for (let i = 1; i < fractions.length; i++) expect(fractions[i]).toBeLessThan(fractions[i - 1])
    expect(fractions.every((f) => f > 1)).toBe(true)
  })
})

describe('progress through a process', () => {
  it('starts at the start volume and ends at the end volume, for steps and reversible', () => {
    for (const steps of [1, 4, 'reversible'] as const) {
      expect(volumeAt(EXPANSION, steps, 0)).toBe(6)
      expect(volumeAt(EXPANSION, steps, 1)).toBe(12)
    }
  })

  it('moves through the steps in turn, holding each step at its own external pressure', () => {
    expect(volumeAt(EXPANSION, 4, 0.5)).toBeCloseTo(9, 10)
    const pressures = stepPressuresBar(EXPANSION, 4)
    expect(externalPressureAt(EXPANSION, 4, 0.1)).toBe(pressures[0])
    expect(externalPressureAt(EXPANSION, 4, 0.3)).toBe(pressures[1])
    expect(externalPressureAt(EXPANSION, 4, 1)).toBe(pressures[3])
  })

  it('sets the reversible external pressure equal to the gas pressure', () => {
    const s = 0.37
    const v = volumeAt(EXPANSION, 'reversible', s)
    expect(externalPressureAt(EXPANSION, 'reversible', s)).toBeCloseTo(gasPressureBar(EXPANSION, v), 10)
  })

  it('gives the work so far as zero at the start and the full work at the end', () => {
    for (const direction of [EXPANSION, COMPRESSION]) {
      for (const steps of STEP_COUNTS) {
        expect(workSoFar(direction, steps, 0).litreBar).toBe(0)
        expect(workSoFar(direction, steps, 1).litreBar).toBeCloseTo(totalWork(direction, steps).litreBar, 10)
      }
    }
  })

  it('grows the work monotonically in magnitude as the process proceeds', () => {
    for (const direction of [EXPANSION, COMPRESSION]) {
      let previous = 0
      for (let i = 0; i <= 40; i++) {
        const w = Math.abs(workSoFar(direction, 4, i / 40).litreBar)
        expect(w).toBeGreaterThanOrEqual(previous - 1e-12)
        previous = w
      }
    }
  })

  it('agrees with the reversible integral at intermediate progress', () => {
    const s = 0.5
    const v = volumeAt(EXPANSION, 'reversible', s)
    expect(workSoFar(EXPANSION, 'reversible', s).litreBar).toBeCloseTo(reversibleIsothermalWork(1, 300, 6, v).litreBar, 10)
  })
})

describe('the PV path', () => {
  function trapezoidWorkBar(points: Array<{ v: number; p: number }>): number {
    let integral = 0
    for (let i = 0; i < points.length - 1; i++) {
      integral += ((points[i + 1].v - points[i].v) * (points[i].p + points[i + 1].p)) / 2
    }
    return -integral
  }

  it('encloses the same work as the N-step sum, in L bar', () => {
    for (const steps of STEP_COUNTS) {
      for (const direction of [EXPANSION, COMPRESSION]) {
        const path = pvPath(direction, steps, 1)
        const expected = totalWork(direction, steps).litreBar
        expect(trapezoidWorkBar(path)).toBeCloseTo(expected, 9)
      }
    }
  })

  it('encloses the partial work at an intermediate progress', () => {
    const s = 0.4
    const path = pvPath(EXPANSION, 4, s)
    expect(trapezoidWorkBar(path)).toBeCloseTo(workSoFar(EXPANSION, 4, s).litreBar, 9)
  })

  it('starts on the isotherm at the start volume', () => {
    const path = pvPath(EXPANSION, 2, 0)
    expect(path[0].v).toBe(6)
    expect(path[0].p).toBeCloseTo(24.942 / 6, 10)
  })
})
