import { describe, expect, it } from 'vitest'
import { angularRootsCosTheta, nodalPlaneAngles, orbitalValueFn } from './orbital-density'

/**
 * The analytic nodes drawn by the orbital explorer are exact only if ψ really vanishes on them.
 * This checks every cone (cos θ = root) and every nodal plane (azimuth φ) for all real orbitals
 * from 2p to 4f, against the fast evaluator that the density grids use.
 */
describe('analytic nodes are exact zeros of ψ', () => {
  it('ψ vanishes on every cone and nodal plane for all real orbitals from 2p to 4f', () => {
    for (let l = 1; l <= 3; l++) {
      for (let m = -l; m <= l; m++) {
        const n = l + 1
        const value = orbitalValueFn(n, l, m)
        // Scale: the largest |ψ| at a few generic points, so the tolerance is relative.
        const scale = Math.max(
          1e-12,
          ...[0.5, 1, 1.5, 2].map((r) => Math.abs(value(r * 0.3, r * 0.2, r * 0.9)))
        )
        for (const c of angularRootsCosTheta(l, m)) {
          const sinT = Math.sqrt(1 - c * c)
          for (const phi of [0.1, 1.3, 2.7, 4.4]) {
            for (const r of [0.7, 1.9, 3.1]) {
              const v = value(r * sinT * Math.cos(phi), r * sinT * Math.sin(phi), r * c)
              expect(Math.abs(v) / scale).toBeLessThan(1e-7)
            }
          }
        }
        for (const phi of nodalPlaneAngles(m)) {
          for (const z of [-1.2, 0.4, 2.2]) {
            for (const rho of [0.6, 1.7]) {
              const v = value(rho * Math.cos(phi), rho * Math.sin(phi), z)
              expect(Math.abs(v) / scale).toBeLessThan(1e-7)
            }
          }
        }
      }
    }
  })
})
