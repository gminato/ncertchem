import { describe, expect, it } from 'vitest'
import { psi } from './hydrogen-orbitals'
import {
  boundaryThreshold,
  enclosedRadius,
  gridCoordinate,
  mulberry32,
  angularRootsCosTheta,
  nodalPlaneAngles,
  orbitalValueFn,
  radialExtent,
  radialNodeRadii,
  sampleOrbitalGrid,
  sampleProbabilityCloud,
} from './orbital-density'

/** All real orbitals with n ≤ 4, as [n, l, m]. */
function allOrbitals(): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let n = 1; n <= 4; n++) {
    for (let l = 0; l <= n - 1; l++) {
      for (let m = -l; m <= l; m++) out.push([n, l, m])
    }
  }
  return out
}

describe('orbitalValueFn', () => {
  it('agrees with the reference psi at random points for every orbital up to n = 4', () => {
    const random = mulberry32(7)
    for (const [n, l, m] of allOrbitals()) {
      const fast = orbitalValueFn(n, l, m)
      for (let t = 0; t < 40; t++) {
        const x = (random() * 2 - 1) * 12
        const y = (random() * 2 - 1) * 12
        const z = (random() * 2 - 1) * 12
        const reference = psi(n, l, m, x, y, z)
        expect(Math.abs(fast(x, y, z) - reference)).toBeLessThan(2e-4)
      }
    }
  })

  it('keeps p_z exactly zero on the xy-plane, so the nodal plane is exact', () => {
    const pz = orbitalValueFn(2, 1, 0)
    expect(pz(1.3, -0.7, 0)).toBe(0)
  })

  it('rejects invalid quantum numbers using the reference rules', () => {
    expect(() => orbitalValueFn(2, 2, 0)).toThrow(RangeError)
    expect(() => orbitalValueFn(3, 1, 2)).toThrow(RangeError)
  })

  it('puts the d_z² lobes on the z-axis positive and the ring in the xy-plane negative', () => {
    const dz2 = orbitalValueFn(3, 2, 0)
    expect(dz2(0, 0, 4)).toBeGreaterThan(0)
    expect(dz2(4, 0, 0)).toBeLessThan(0)
  })

  it('puts the d_x²−y² lobes on the axes and the d_xy lobes between them', () => {
    const dx2y2 = orbitalValueFn(3, 2, 2)
    expect(dx2y2(4, 0, 0)).toBeGreaterThan(0)
    expect(dx2y2(0, 4, 0)).toBeLessThan(0)
    const dxy = orbitalValueFn(3, 2, -2)
    expect(dxy(3, 3, 0)).toBeGreaterThan(0)
    expect(dxy(3, -3, 0)).toBeLessThan(0)
    expect(dxy(4, 0, 0)).toBe(0)
  })
})

describe('radialExtent', () => {
  it('bounds the 1s orbital well inside 10 a₀ and the 4f orbital well beyond 30 a₀', () => {
    expect(radialExtent(1, 0)).toBeGreaterThan(4)
    expect(radialExtent(1, 0)).toBeLessThan(10)
    expect(radialExtent(4, 3)).toBeGreaterThan(30)
  })
})

describe('sampleOrbitalGrid and boundaryThreshold', () => {
  it('places grid points off the axes (no coordinate equals 0)', () => {
    const grid = sampleOrbitalGrid(2, 1, 0, 8, 6)
    for (let i = 0; i < grid.size; i++) {
      expect(gridCoordinate(grid, i)).not.toBe(0)
    }
  })

  it('encloses about 90% of the probability inside the threshold surface', () => {
    const grid = sampleOrbitalGrid(2, 1, 0, 48, 14)
    const threshold = boundaryThreshold(grid, 0.9)
    const dV = grid.step ** 3
    let total = 0
    let inside = 0
    for (const v of grid.psi) {
      total += v * v * dV
      if (v * v >= threshold) inside += v * v * dV
    }
    expect(inside / total).toBeGreaterThan(0.89)
    expect(inside / total).toBeLessThan(0.93)
  })

  it('keeps the 90% boundary of every n ≤ 3 orbital inside its box', () => {
    for (const [n, l, m] of allOrbitals().filter(([nn]) => nn <= 3)) {
      const half = radialExtent(n, l) * 1.1
      const grid = sampleOrbitalGrid(n, l, m, 40, half)
      const threshold = boundaryThreshold(grid, 0.9)
      expect(enclosedRadius(grid, threshold)).toBeLessThan(half * 0.95)
    }
  })

  it('rejects a bad fraction or grid size', () => {
    const grid = sampleOrbitalGrid(1, 0, 0, 8, 4)
    expect(() => boundaryThreshold(grid, 1)).toThrow(RangeError)
    expect(() => sampleOrbitalGrid(1, 0, 0, 2, 4)).toThrow(RangeError)
  })
})

describe('sampleProbabilityCloud', () => {
  it('is deterministic for a given seed', () => {
    const grid = sampleOrbitalGrid(2, 0, 0, 32, 12)
    const a = sampleProbabilityCloud(grid, 500, 3)
    const b = sampleProbabilityCloud(grid, 500, 3)
    expect(Array.from(a.positions)).toEqual(Array.from(b.positions))
  })

  it('leaves the radial node of 2s empty: almost no points within 0.1 a₀ of r = 2', () => {
    const grid = sampleOrbitalGrid(2, 0, 0, 64, 16)
    const cloud = sampleProbabilityCloud(grid, 40000, 11)
    let atNode = 0
    let beside = 0
    for (let p = 0; p < cloud.signs.length; p++) {
      const r = Math.hypot(cloud.positions[p * 3], cloud.positions[p * 3 + 1], cloud.positions[p * 3 + 2])
      if (Math.abs(r - 2) < 0.1) atNode++
      if (Math.abs(r - 3) < 0.1) beside++
    }
    // Probability per unit radius is about 0.056 at r = 3 a₀ and zero at r = 2 a₀.
    expect(beside).toBeGreaterThan(200)
    expect(atNode / beside).toBeLessThan(0.08)
  })

  it('colours 2p points by the sign of ψ, and both signs appear', () => {
    const grid = sampleOrbitalGrid(2, 1, 0, 40, 12)
    const cloud = sampleProbabilityCloud(grid, 2000, 5)
    const pos = Array.from(cloud.signs).filter((s) => s > 0).length
    const neg = cloud.signs.length - pos
    expect(pos).toBeGreaterThan(0)
    expect(neg).toBeGreaterThan(0)
  })
})

describe('analytic nodes', () => {
  it('gives the cos θ roots of the angular part: none for s, cos θ = 0 for p_z, ±1/√3 for d_z²', () => {
    expect(angularRootsCosTheta(0, 0)).toEqual([])
    const pz = angularRootsCosTheta(1, 0)
    expect(pz).toHaveLength(1)
    expect(Math.abs(pz[0])).toBeLessThan(1e-9)
    const dz2 = angularRootsCosTheta(2, 0).sort((a, b) => a - b)
    expect(dz2).toHaveLength(2)
    expect(dz2[0]).toBeCloseTo(-1 / Math.sqrt(3), 8)
    expect(dz2[1]).toBeCloseTo(1 / Math.sqrt(3), 8)
  })

  it('has l nodal cones in total for each subshell (no real m is missing one)', () => {
    for (let l = 0; l <= 3; l++) {
      for (let m = -l; m <= l; m++) {
        const total = angularRootsCosTheta(l, m).length + nodalPlaneAngles(m).length
        // Angular nodes are the cones plus the planes. The count must match ℓ for every real orbital.
        expect(total).toBe(l)
      }
    }
  })

  it('puts nodal planes at the right azimuths: cos φ for m > 0, sin φ for m < 0', () => {
    // d_x²−y² (m = +2) has planes at φ = π/4 and 3π/4, i.e. the planes x = ±y.
    const plusTwo = nodalPlaneAngles(2).map((p) => Math.round((p / Math.PI) * 4) / 4)
    expect(plusTwo).toEqual([0.25, 0.75])
    // d_xy (m = −2) has planes at φ = 0 and π/2, the xz- and yz-planes.
    expect(nodalPlaneAngles(-2)).toEqual([0, Math.PI / 2])
    expect(nodalPlaneAngles(0)).toEqual([])
  })

  it('finds n − ℓ − 1 radial nodes, at the closed-form radii for 3s', () => {
    expect(radialNodeRadii(1, 0)).toHaveLength(0)
    expect(radialNodeRadii(2, 0)).toHaveLength(1)
    expect(radialNodeRadii(3, 1)).toHaveLength(1)
    const threes = radialNodeRadii(3, 0)
    expect(threes).toHaveLength(2)
    expect(threes[0]).toBeCloseTo((9 - 3 * Math.sqrt(3)) / 2, 3)
    expect(threes[1]).toBeCloseTo((9 + 3 * Math.sqrt(3)) / 2, 3)
  })
})
