import { describe, expect, it } from 'vitest'
import { BOMB_EXAMPLE } from '@/lib/chem/calorimetry-examples'
import { BOMB_STEP_COUNT, bombSnapshotForStep, clampBombStep } from './bomb-steps'

describe('bomb calorimeter Scrolly steps', () => {
  it('has five Steps: sealed, ignited, warmed, heat balance, per mole', () => {
    expect(BOMB_STEP_COUNT).toBe(5)
  })

  it('the sealed bomb is cold and dark; ignition makes it glow before any temperature rise', () => {
    expect(bombSnapshotForStep(0)).toEqual({ glow: false, tempRise: 0 })
    expect(bombSnapshotForStep(1)).toEqual({ glow: true, tempRise: 0 })
  })

  it('from Step 2 on the thermometer reads the worked example’s ΔT', () => {
    for (const step of [2, 3, 4]) {
      expect(bombSnapshotForStep(step)).toEqual({ glow: true, tempRise: BOMB_EXAMPLE.deltaTK })
    }
  })

  it('clamps out-of-range and fractional indices', () => {
    expect(clampBombStep(-3)).toBe(0)
    expect(clampBombStep(9)).toBe(BOMB_STEP_COUNT - 1)
    expect(clampBombStep(2.7)).toBe(2)
    expect(clampBombStep(Number.NaN)).toBe(0)
  })
})
