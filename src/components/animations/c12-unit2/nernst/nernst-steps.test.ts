import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  E0_DANIELL,
  NERNST_CAPTION_VALUES,
  E0_NI_AG,
  NERNST_STEPS,
  NERNST_STEP_COUNT,
  clampNernstStep,
  cuElectrodePotential,
  daniellPotential,
  getNernstStepState,
  hydrogenPotential,
  niAgPotential,
  niAgReactionQuotient,
  placeIons,
} from './nernst-steps'

describe('Nernst animation steps', () => {
  it('defines five ordered steps with unique ids', () => {
    expect(NERNST_STEP_COUNT).toBe(5)
    expect(NERNST_STEPS.map((s) => s.index)).toEqual([0, 1, 2, 3, 4])
    expect(new Set(NERNST_STEPS.map((s) => s.id)).size).toBe(5)
  })

  it('takes standard potentials from Table 2.1', () => {
    expect(E0_DANIELL).toBeCloseTo(1.1, 6)
    expect(E0_NI_AG).toBeCloseTo(1.05, 6)
  })

  it('moves the copper electrode by 0.0295 V per tenfold change (n = 2)', () => {
    expect(cuElectrodePotential(0)).toBeCloseTo(0.34, 6)
    expect(cuElectrodePotential(-1) - cuElectrodePotential(0)).toBeCloseTo(-0.0295, 6)
    expect(cuElectrodePotential(-4)).toBeCloseTo(0.222, 6)
  })

  it('gives the Daniell EMF for [Zn²⁺]/[Cu²⁺] = 0.010', () => {
    expect(daniellPotential(0, 0)).toBeCloseTo(1.1, 6)
    expect(daniellPotential(-2, 0)).toBeCloseTo(1.159, 6)
  })

  it('computes Q = [Ni²⁺]/[Ag⁺]² and the Ni | Ag EMF', () => {
    expect(niAgReactionQuotient(-1, -2)).toBeCloseTo(1000, 6)
    expect(niAgPotential(-1, -2)).toBeCloseTo(1.05 - 0.0295 * 3, 6)
  })

  it('gives the hydrogen electrode in acid rain (pH 5.6) as −0.330 V', () => {
    expect(hydrogenPotential(5.6)).toBeCloseTo(-0.3304, 6)
    expect(hydrogenPotential(0) - hydrogenPotential(14)).toBeCloseTo(0.826, 6)
  })

  it('computes every caption number from the libs', () => {
    const v = NERNST_CAPTION_VALUES
    expect(v.cuStandard).toBe('0.340')
    expect(v.cuDilute).toBe('0.222')
    expect(v.decadeShift).toBe('0.0295')
    expect(v.daniellStandard).toBe('1.10')
    expect(v.daniellQ).toBe('0.010')
    expect(v.daniellPotentialAtQ).toBe('1.16')
    expect(v.niAgStandard).toBe('1.05')
    expect(v.niAgQ).toBe('1000')
    expect(v.niAgShift).toBe('0.0885')
    expect(v.niAgPotential).toBe('0.96')
    expect(v.hydrogenAcidRain).toBe('\u2212' + (0.059 * 5.6).toFixed(3))
    expect(v.hydrogenSwing).toBe('0.83')
  })

  it('writes each caption with the lib-computed number', () => {
    const [one, slide, daniell, general, hydrogen] = NERNST_STEPS.map((s) => s.ariaLabel)
    expect(one).toContain(`reads ${NERNST_CAPTION_VALUES.cuStandard} volts`)
    expect(slide).toContain(`lowers the copper electrode potential by ${NERNST_CAPTION_VALUES.decadeShift} volts`)
    expect(slide).toContain(`from ${NERNST_CAPTION_VALUES.cuStandard} V to ${NERNST_CAPTION_VALUES.cuDilute} V`)
    expect(daniell).toContain(`to about ${NERNST_CAPTION_VALUES.daniellPotentialAtQ} volts`)
    expect(general).toContain(`about ${NERNST_CAPTION_VALUES.niAgPotential} volts`)
    expect(general).toContain(`Q of ${NERNST_CAPTION_VALUES.niAgQ}`)
    expect(hydrogen).toContain(`${NERNST_CAPTION_VALUES.hydrogenAcidRain} volts`)
    expect(hydrogen).not.toMatch(/standard hydrogen/i)
  })

  it('keeps the MDX worked numbers in step with the libs', () => {
    const mdx = readFileSync(
      resolve(__dirname, '../../../../../content/class-12/unit-2/12-2-3-nernst-equation.mdx'),
      'utf8',
    ).replace(/\u2212/g, '-')
    const v = NERNST_CAPTION_VALUES
    for (const value of [v.cuStandard, v.cuDilute, v.decadeShift, v.daniellPotentialAtQ, v.niAgPotential, v.niAgShift, v.hydrogenSwing]) {
      expect(mdx).toContain(value)
    }
    expect(mdx).toContain(`${NERNST_CAPTION_VALUES.hydrogenAcidRain.replace('\u2212', '-')}`)
    expect(mdx).not.toContain('pH 10')
  })

  it('clamps out-of-range step indices', () => {
    expect(clampNernstStep(-3)).toBe(0)
    expect(clampNernstStep(99)).toBe(4)
    expect(clampNernstStep(Number.NaN)).toBe(0)
    expect(getNernstStepState(2).id).toBe('daniell-ratio')
  })
})

describe('placeIons', () => {
  // The one-electrode beaker's liquid (250 × 270 px beaker, level 0.72) beside its copper rod.
  const region = { x: 44, y: 154, width: 234, height: 164 }
  const rod = { x: 148, y: 22, width: 26, height: 254 }
  const pill = (x: number, y: number) => ({ x: x - 23, y: y - 13, width: 46, height: 26 })
  const touch = (a: ReturnType<typeof pill>, b: { x: number; y: number; width: number; height: number }) =>
    a.x < b.x + b.width + 4 && a.x + a.width + 4 > b.x && a.y < b.y + b.height + 4 && a.y + a.height + 4 > b.y

  it('places the same ions every time and keeps a smaller count as a prefix', () => {
    expect(placeIons(region, 10, rod)).toEqual(placeIons(region, 10, rod))
    expect(placeIons(region, 5, rod)).toEqual(placeIons(region, 10, rod).slice(0, 5))
  })

  it('keeps every pill clear of the rod and of the other pills, inside the region', () => {
    const pts = placeIons(region, 10, rod)
    expect(pts).toHaveLength(10)
    pts.forEach(([x, y], i) => {
      const box = pill(x, y)
      expect(touch(box, rod)).toBe(false)
      expect(box.x).toBeGreaterThanOrEqual(region.x)
      expect(box.x + box.width).toBeLessThanOrEqual(region.x + region.width)
      pts.slice(i + 1).forEach(([qx, qy]) => expect(touch(box, pill(qx, qy))).toBe(false))
    })
  })
})
