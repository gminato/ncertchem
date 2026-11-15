import { describe, expect, it } from 'vitest'
import { STATE_FUNCTION_DEMO_PATHS, deltaU, pathsGiveSameDeltaU } from '@/lib/chem/thermo-first-law'
import {
  CAMP_A,
  CAMP_B,
  ROUTE_1,
  ROUTE_2,
  STATE_FUNCTION_STEP_COUNT,
  gaugeY,
  pointAlong,
  routeSoFar,
  stateFunctionSnapshotForStep,
} from './state-function-steps'

describe('state-function Scrolly (Section 5.1.3 and 5.1.4)', () => {
  it('has four Steps', () => {
    expect(STATE_FUNCTION_STEP_COUNT).toBe(4)
  })

  it('the gauge gap between the camps is the same ΔU for both routes', () => {
    expect(pathsGiveSameDeltaU(STATE_FUNCTION_DEMO_PATHS[0], STATE_FUNCTION_DEMO_PATHS[1])).toBe(true)
    const dU = deltaU(STATE_FUNCTION_DEMO_PATHS[0].q, STATE_FUNCTION_DEMO_PATHS[0].w)
    expect(CAMP_A.y - CAMP_B.y).toBeCloseTo(dU * 0.2, 9)
    expect(gaugeY(dU)).toBeCloseTo(CAMP_B.y, 9)
  })

  it('both routes start at camp A and finish on camp B', () => {
    for (const route of [ROUTE_1, ROUTE_2]) {
      expect(route[0]).toEqual(CAMP_A)
      expect(route[route.length - 1]).toEqual(CAMP_B)
    }
  })

  it('the walker reaches the ends of a route at t = 0 and t = 1', () => {
    expect(pointAlong(ROUTE_2, 0)).toEqual(CAMP_A)
    const end = pointAlong(ROUTE_2, 1)
    expect(end.x).toBeCloseTo(CAMP_B.x, 9)
    expect(end.y).toBeCloseTo(CAMP_B.y, 9)
  })

  it('the route drawn so far grows from A to B', () => {
    const half = routeSoFar(ROUTE_1, 0.5)
    expect(half[0]).toEqual(CAMP_A)
    expect(half.length).toBeGreaterThanOrEqual(2)
    const full = routeSoFar(ROUTE_1, 1)
    expect(full[full.length - 1]).toEqual(CAMP_B)
  })

  it('Step 3 shows both routes and lights the ΔU bracket', () => {
    expect(stateFunctionSnapshotForStep(3)).toEqual({ progress1: 1, progress2: 1, alpha1: 1, alpha2: 1, bracket: 1 })
    expect(stateFunctionSnapshotForStep(0).bracket).toBe(0)
  })
})
