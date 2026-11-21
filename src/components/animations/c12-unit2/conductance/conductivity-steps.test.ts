import { describe, expect, it } from 'vitest'
import {
  CELL_CONSTANT,
  CELL_CONSTANT_CM,
  CONDUCTIVITY_STEPS,
  CONDUCTIVITY_STEP_COUNT,
  UNKNOWN_KAPPA_SCM,
  UNKNOWN_KAPPA_SM,
  UNKNOWN_LAMBDA_SCM2,
  UNKNOWN_R,
  WIRE_R_BASE,
  WIRE_R_LONG,
  WIRE_R_THICK,
  clampConductivityStep,
  getConductivityStepState,
} from './conductivity-steps'

describe('conductivity measurement steps', () => {
  it('defines five ordered steps with the expected scenes', () => {
    expect(CONDUCTIVITY_STEP_COUNT).toBe(5)
    expect(CONDUCTIVITY_STEPS.map((s) => s.scene)).toEqual(['wire', 'cell', 'ac', 'bridge', 'chain'])
  })

  it('clamps out-of-range and non-finite indices', () => {
    expect(clampConductivityStep(-1)).toBe(0)
    expect(clampConductivityStep(2.8)).toBe(2)
    expect(clampConductivityStep(99)).toBe(4)
    expect(clampConductivityStep(Number.NaN)).toBe(0)
    expect(getConductivityStepState(3).id).toBe('bridge-null')
  })

  it('reproduces the wire numbers in the Prose', () => {
    expect(WIRE_R_BASE).toBeCloseTo(0.5, 9)
    expect(WIRE_R_LONG).toBeCloseTo(1.0, 9)
    expect(WIRE_R_THICK).toBeCloseTo(0.25, 9)
  })

  it('reproduces the calibration and unknown-cell chain in the Prose', () => {
    expect(CELL_CONSTANT).toBeCloseTo(141, 6)
    expect(CELL_CONSTANT_CM).toBeCloseTo(1.41, 9)
    expect(UNKNOWN_R).toBe(2400)
    expect(UNKNOWN_KAPPA_SM).toBeCloseTo(0.05875, 9)
    expect(UNKNOWN_KAPPA_SCM).toBeCloseTo(5.875e-4, 12)
    expect(UNKNOWN_LAMBDA_SCM2).toBeCloseTo(117.5, 6)
  })
})

describe('conductivity measurement step captions', () => {
  it('state the same numbers as the libs', () => {
    const [wires, , , bridge, chain] = CONDUCTIVITY_STEPS
    expect(wires.ariaLabel).toContain(`has resistance ${WIRE_R_BASE.toFixed(2)} ohm`)
    expect(wires.ariaLabel).toContain(`has resistance ${WIRE_R_LONG.toFixed(2)} ohm`)
    expect(wires.ariaLabel).toContain(`has resistance ${WIRE_R_THICK.toFixed(2)} ohm`)
    expect(bridge.ariaLabel).toContain(`R2 equals ${UNKNOWN_R} ohm`)
    expect(chain.ariaLabel).toContain(`molar conductivity is ${UNKNOWN_LAMBDA_SCM2.toFixed(1)} S cm²`)
    expect(chain.ariaLabel).toContain('cell constant of 141 per metre')
  })
})
