import { describe, expect, it } from 'vitest'
import {
  A_FACTOR,
  ARRHENIUS_STEP_COUNT,
  EA,
  FRACTION_REF,
  K_HOT,
  K_WARM,
  LABELS,
  LINE,
  LN_SLOPE_PLOT,
  RATIO_RISE,
  getArrheniusStepState,
  lnKPoint,
} from './arrhenius-steps'

describe('Arrhenius Scrolly steps', () => {
  it('has five Steps and clamps the 0-based index', () => {
    expect(ARRHENIUS_STEP_COUNT).toBe(5)
    expect(getArrheniusStepState(-1).index).toBe(0)
    expect(getArrheniusStepState(9).index).toBe(4)
  })

  it('shows one main scene per Step, with the second curve only at Step 4', () => {
    const scenes = [0, 1, 2, 3, 4].map((i) => getArrheniusStepState(i))
    expect(scenes.map((s) => s.box)).toEqual([1, 0, 0, 0, 0])
    expect(scenes.map((s) => s.profile)).toEqual([0, 1, 0, 0, 0])
    expect(scenes.map((s) => s.mbFirst)).toEqual([0, 0, 1, 1, 0])
    expect(scenes.map((s) => s.mbSecond)).toEqual([0, 0, 0, 1, 0])
    expect(scenes.map((s) => s.line)).toEqual([0, 0, 0, 0, 1])
  })

  it('takes the lib values for the worked reaction', () => {
    expect(EA).toBeCloseTo(50000, 6)
    expect(A_FACTOR).toBeGreaterThan(1.7e5)
    expect(A_FACTOR).toBeLessThan(1.78e5)
    expect(K_WARM).toBeCloseTo(5.78e-4, 6)
    expect(K_HOT).toBeGreaterThan(K_WARM)
    expect(RATIO_RISE).toBeCloseTo(1.926, 2)
    expect(LABELS.ratio).toBe('1.93')
    expect(FRACTION_REF).toBeCloseTo(1.72e-9, 11)
    expect(LABELS.fractionRef).toBe('1.72 × 10⁻⁹')
  })

  it('puts the three ln k points on the line of slope −Eₐ/R', () => {
    const a = lnKPoint(298)
    const b = lnKPoint(318)
    const measured = (b.y - a.y) / (b.x - a.x)
    expect(measured).toBeCloseTo(LN_SLOPE_PLOT, 6)
    expect(LINE.slope).toBeCloseTo(-6013.9, 0)
    expect(LABELS.slope).toBe('−6.01 × 10³')
    expect(LABELS.intercept).toBe('12.07')
  })
})
