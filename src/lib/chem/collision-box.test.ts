import { describe, expect, it } from 'vitest'
import { mulberry32 } from './kinetics'
import {
  collisionEnergyInRT,
  createCollisionBox,
  isOriented,
  setBoxTemperature,
  stepCollisionBox,
  thermalUnit,
} from './collision-box'

function gaussianFrom(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

describe('collision energy along the line of centres', () => {
  it('flux-weighted collisions have P(E ≥ Eₐ) = e^(−Eₐ/RT) (Trautz–Lewis)', () => {
    // Pairs of Maxwell velocities (σ² = kT per component), weighted by the approach speed |vₙ|, as in real collisions.
    const T = 300
    const kT = thermalUnit(T)
    const sigma = Math.sqrt(kT)
    const rng = mulberry32(7)
    const cap = 12 * Math.sqrt(2) * sigma
    let kept = 0
    let above = 0
    const aRT = 1
    for (let i = 0; i < 400000; i++) {
      const ang = 2 * Math.PI * rng()
      const nx = Math.cos(ang)
      const ny = Math.sin(ang)
      const vn = (sigma * gaussianFrom(rng) - sigma * gaussianFrom(rng)) * nx + (sigma * gaussianFrom(rng) - sigma * gaussianFrom(rng)) * ny
      if (vn >= 0) continue
      if (rng() * cap >= -vn) continue
      kept += 1
      if (collisionEnergyInRT(vn, T) >= aRT) above += 1
    }
    expect(above / kept).toBeCloseTo(Math.exp(-aRT), 1)
  })
})

describe('isOriented', () => {
  it('a random contact direction is oriented with probability P', () => {
    const rng = mulberry32(11)
    let hits = 0
    const n = 100000
    for (let i = 0; i < n; i++) {
      if (isOriented(2 * Math.PI * rng(), 1.3, 0.25)) hits += 1
    }
    expect(hits / n).toBeCloseTo(0.25, 2)
  })

  it('P = 1 accepts every direction, and the window wraps across ±π', () => {
    expect(isOriented(3.1, -3.1, 1)).toBe(true)
    expect(isOriented(3.1, -3.1, 0.05)).toBe(true)
    expect(isOriented(0, Math.PI, 0.5)).toBe(false)
  })
})

describe('stepCollisionBox', () => {
  it('conserves kinetic energy (walls and collisions), and is deterministic for a seed', () => {
    const make = () => createCollisionBox({ seed: 42, nA: 30, nB: 30, width: 580, height: 300, radius: 7, tempK: 300 })
    const box = make()
    const energy = (b: typeof box) => b.particles.reduce((s, p) => s + p.vx * p.vx + p.vy * p.vy, 0)
    const e0 = energy(box)
    for (let i = 0; i < 2400; i++) stepCollisionBox(box, 1 / 240, 4, 0.25)
    expect(energy(box)).toBeCloseTo(e0, 6)
    expect(box.total).toBeGreaterThan(0)
    expect(box.ab).toBeGreaterThan(0)
    expect(box.effective).toBeLessThanOrEqual(box.energetic)
    expect(box.energetic).toBeLessThanOrEqual(box.ab)

    const a = make()
    const b = make()
    for (let i = 0; i < 600; i++) {
      stepCollisionBox(a, 1 / 240, 4, 0.25)
      stepCollisionBox(b, 1 / 240, 4, 0.25)
    }
    expect([a.total, a.ab, a.energetic, a.effective]).toEqual([b.total, b.ab, b.energetic, b.effective])
  })

  it('keeps every particle inside the walls', () => {
    const box = createCollisionBox({ seed: 3, nA: 20, nB: 20, width: 300, height: 200, radius: 7, tempK: 400 })
    for (let i = 0; i < 2400; i++) stepCollisionBox(box, 1 / 240, 2, 1)
    for (const p of box.particles) {
      expect(p.x).toBeGreaterThanOrEqual(7 - 1e-9)
      expect(p.x).toBeLessThanOrEqual(293 + 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(7 - 1e-9)
      expect(p.y).toBeLessThanOrEqual(193 + 1e-9)
    }
  })

  it('rescales velocities with temperature', () => {
    const box = createCollisionBox({ seed: 5, nA: 5, nB: 5, width: 300, height: 200, radius: 7, tempK: 300 })
    const before = box.particles[0].vx
    setBoxTemperature(box, 300 * 4)
    expect(box.particles[0].vx).toBeCloseTo(before * 2, 9)
    expect(box.tempK).toBe(1200)
  })
})
