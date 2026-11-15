import { describe, expect, it } from 'vitest'
import { BENZENE_ANTOINE, TOLUENE_ANTOINE, fractionalDistillation } from './purification'
import {
  batchDistillation,
  dewPointC,
  fenskeTopComposition,
  plateCount,
  relativeVolatility,
  vapourPressureMmHg,
} from './distillation-column'

describe('vapourPressureMmHg (Antoine)', () => {
  it('gives 760 mmHg at the normal boiling point of benzene (about 80.1 °C)', () => {
    const tb = fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 1).boilingPointC
    expect(vapourPressureMmHg(BENZENE_ANTOINE, tb)).toBeCloseTo(760, 0)
  })
})

describe('relativeVolatility', () => {
  it('is P_benzene / P_toluene at the boiling point: above 1 and about 2.4 near x = 0.5', () => {
    const alpha = relativeVolatility(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5)
    expect(alpha).toBeGreaterThan(2.2)
    expect(alpha).toBeLessThan(2.6)
  })

  it('rejects a mole fraction at 0 or 1', () => {
    expect(() => relativeVolatility(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0)).toThrow(RangeError)
    expect(() => relativeVolatility(BENZENE_ANTOINE, TOLUENE_ANTOINE, 1)).toThrow(RangeError)
  })
})

describe('fenskeTopComposition', () => {
  it('with one plate reproduces the single-stage Raoult vapour composition', () => {
    const x = 0.5
    const alpha = relativeVolatility(BENZENE_ANTOINE, TOLUENE_ANTOINE, x)
    const y = fenskeTopComposition(alpha, 1, x)
    expect(y).toBeCloseTo(fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, x).vapourFractionA, 9)
  })

  it('more plates give a purer top product', () => {
    const alpha = 2.4
    expect(fenskeTopComposition(alpha, 8, 0.5)).toBeGreaterThan(fenskeTopComposition(alpha, 2, 0.5))
    expect(fenskeTopComposition(alpha, 8, 0.5)).toBeLessThanOrEqual(1)
  })

  it('validates its inputs', () => {
    expect(() => fenskeTopComposition(2, 0, 0.5)).toThrow(RangeError)
    expect(() => fenskeTopComposition(2, 2.5, 0.5)).toThrow(RangeError)
    expect(() => fenskeTopComposition(0, 2, 0.5)).toThrow(RangeError)
  })
})

describe('plateCount', () => {
  it('divides the column length by the height equivalent to a plate, with at least one plate', () => {
    expect(plateCount(60, 5)).toBe(12)
    expect(plateCount(2, 5)).toBe(1)
  })
})

describe('batchDistillation', () => {
  it('starts at the single-stage vapour composition when there is one plate', () => {
    const points = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, 1)
    expect(points[0].collected).toBe(0)
    expect(points[0].distillateX).toBeCloseTo(fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5).vapourFractionA, 9)
  })

  it('conserves benzene: the charge equals the still plus the distillate', () => {
    for (const plates of [1, 6]) {
      const points = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, plates)
      const last = points[points.length - 1]
      const balance = (1 - last.collected) * last.stillX + last.collected * last.distillateX
      expect(Math.abs(balance - 0.5)).toBeLessThan(0.005)
    }
  })

  it('a column gives a purer distillate than simple distillation at the same collected volume', () => {
    const simple = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, 1)
    const column = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, 8)
    const at = (pts: typeof simple, f: number) => pts.find((p) => p.collected >= f)!
    expect(at(column, 0.4).distillateX).toBeGreaterThan(at(simple, 0.4).distillateX)
  })

  it('the still gets richer in toluene and boils hotter as benzene leaves', () => {
    const points = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, 4)
    expect(points[points.length - 1].stillX).toBeLessThan(0.5)
    expect(points[points.length - 1].boilingPointC).toBeGreaterThan(points[0].boilingPointC)
  })
})

describe('head temperature (dew point of the column-top vapour)', () => {
  it('equals the boiling point of the still for ideal Raoult mixtures (dew point of y = bubble point of x)', () => {
    const y = fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5).vapourFractionA
    expect(dewPointC(BENZENE_ANTOINE, TOLUENE_ANTOINE, y)).toBeCloseTo(
      fractionalDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5).boilingPointC,
      2,
    )
  })

  it('a 12-plate column holds the head near the benzene boiling point while benzene distils', () => {
    const points = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, 12)
    const early = points.find((p) => p.collected >= 0.2)!
    expect(early.headC).toBeGreaterThan(80.1)
    expect(early.headC).toBeLessThan(80.3)
  })

  it('the head temperature jumps towards toluene once benzene has run out of the still', () => {
    const points = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, 0.5, 12)
    const late = points.find((p) => p.collected >= 0.6)!
    expect(late.headC).toBeGreaterThan(105)
    expect(points[points.length - 1].headC).toBeGreaterThan(105)
  })
})
