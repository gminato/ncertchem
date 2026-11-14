import { describe, expect, it } from 'vitest'
import { BOHR_RADIUS_PM } from './constants'
import {
  orbitalName,
  psi,
  radialProbability,
  radialR,
  realSphericalHarmonic,
} from './hydrogen-orbitals'

// Numerical integration on a fixed grid (Simpson's rule) in atomic units.
function simpson(f: (r: number) => number, a: number, b: number, steps = 4000): number {
  const h = (b - a) / steps
  let sum = f(a) + f(b)
  for (let i = 1; i < steps; i++) {
    sum += (i % 2 === 1 ? 4 : 2) * f(a + i * h)
  }
  return (sum * h) / 3
}

// Sign changes of R_nl(r) over r in (0, 80 a0].
function radialSignChanges(n: number, l: number): number {
  let changes = 0
  let prev = radialR(n, l, 0.0005)
  for (let r = 0.001; r <= 80; r += 0.001) {
    const cur = radialR(n, l, r)
    if (prev !== 0 && cur !== 0 && Math.sign(prev) !== Math.sign(cur)) changes++
    prev = cur
  }
  return changes
}

describe('radialR normalisation', () => {
  const cases: Array<[number, number]> = [
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 0],
    [3, 1],
    [3, 2],
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
  ]
  for (const [n, l] of cases) {
    it(`integral of r^2 R^2 is 1 for n=${n}, l=${l}`, () => {
      const norm = simpson((r) => r * r * radialR(n, l, r) ** 2, 0, 80)
      expect(norm).toBeCloseTo(1, 4)
    })
  }
})

describe('radial nodes', () => {
  const cases: Array<[number, number]> = [
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 0],
    [3, 1],
    [3, 2],
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
  ]
  for (const [n, l] of cases) {
    it(`has n-l-1 = ${n - l - 1} radial sign changes for n=${n}, l=${l}`, () => {
      expect(radialSignChanges(n, l)).toBe(n - l - 1)
    })
  }
})

describe('radialProbability and the 1s peak', () => {
  it('equals r^2 R^2', () => {
    expect(radialProbability(2, 1, 3)).toBeCloseTo(9 * radialR(2, 1, 3) ** 2, 12)
  })
  it('peaks at r = 1 a0 (52.9 pm) for 1s', () => {
    let best = 0
    let bestP = -1
    for (let r = 0.01; r <= 6; r += 0.001) {
      const p = radialProbability(1, 0, r)
      if (p > bestP) {
        bestP = p
        best = r
      }
    }
    expect(best).toBeCloseTo(1, 2)
    expect(best * BOHR_RADIUS_PM).toBeCloseTo(52.9, 1)
  })
})

describe('real spherical harmonics', () => {
  it('are normalised over the sphere for every real orbital with l <= 3', () => {
    for (let l = 0; l <= 3; l++) {
      for (let m = -l; m <= l; m++) {
        const integral = (() => {
          const nT = 200
          const nP = 200
          let sum = 0
          for (let i = 0; i < nT; i++) {
            const theta = ((i + 0.5) * Math.PI) / nT
            for (let j = 0; j < nP; j++) {
              const phi = ((j + 0.5) * 2 * Math.PI) / nP
              const y = realSphericalHarmonic(l, m, theta, phi)
              sum += y * y * Math.sin(theta)
            }
          }
          return (sum * (Math.PI / nT) * (2 * Math.PI / nP))
        })()
        expect(integral, `l=${l}, m=${m}`).toBeCloseTo(1, 3)
      }
    }
  })
  it('p_z is positive along +z and negative along -z', () => {
    expect(realSphericalHarmonic(1, 0, 0, 0)).toBeGreaterThan(0)
    expect(realSphericalHarmonic(1, 0, Math.PI, 0)).toBeLessThan(0)
  })
  it('p_x is positive along +x', () => {
    expect(realSphericalHarmonic(1, 1, Math.PI / 2, 0)).toBeGreaterThan(0)
  })
})

describe('psi', () => {
  it('2pz vanishes on the xy-plane (z = 0)', () => {
    expect(psi(2, 1, 0, 1.3, -0.7, 0)).toBe(0)
    expect(psi(2, 1, 0, 0, 0, 0)).toBe(0)
  })
  it('2pz is non-zero off the plane and changes sign across it', () => {
    expect(psi(2, 1, 0, 0, 0, 2)).toBeGreaterThan(0)
    expect(psi(2, 1, 0, 0, 0, -2)).toBeLessThan(0)
  })
  it('1s is spherically symmetric', () => {
    const a = psi(1, 0, 0, 1, 0, 0)
    const b = psi(1, 0, 0, 0, 0.6, 0.8)
    expect(a).toBeCloseTo(b, 12)
  })
  it('returns a finite value at the origin for s and zero for p', () => {
    expect(Number.isFinite(psi(1, 0, 0, 0, 0, 0))).toBe(true)
    expect(psi(2, 1, 0, 0, 0, 0)).toBe(0)
  })
})

describe('orbitalName', () => {
  it('names the real p and d orbitals', () => {
    expect(orbitalName(2, 1, 0)).toBe('2pz')
    expect(orbitalName(2, 1, 1)).toBe('2px')
    expect(orbitalName(2, 1, -1)).toBe('2py')
    expect(orbitalName(3, 2, 0)).toBe('3dz²')
    expect(orbitalName(3, 2, -2)).toBe('3dxy')
  })
  it('names s orbitals without a lobe suffix', () => {
    expect(orbitalName(1, 0, 0)).toBe('1s')
  })
  it('rejects m outside -l..l or n <= l', () => {
    expect(() => orbitalName(2, 1, 2)).toThrow(RangeError)
    expect(() => orbitalName(1, 1, 0)).toThrow(RangeError)
  })
  it('rejects n > 4 (outside the supported range)', () => {
    expect(() => orbitalName(5, 0, 0)).toThrow(RangeError)
    expect(() => radialR(5, 0, 1)).toThrow(RangeError)
  })
})
