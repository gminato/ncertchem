import { describe, expect, it } from 'vitest'
import { speedScale } from '@/lib/chem/states'
import {
  BOX_ASPECT,
  GAS_MIN_GAP,
  LATTICE_COLS,
  LATTICE_ROWS,
  PARTICLE_COUNT,
  POOL,
  WALL_MARGIN,
  createParticles,
  gasSpeed,
  latticeSites,
  latticeSpacing,
  mulberry32,
  phaseFor,
  settleParticles,
  stepParticles,
  type Particle,
} from './states-particles'
import { waterPhaseFractions } from '@/lib/chem/states'

/** Advances the particles for `seconds` at a fixed temperature, in 1/60 s steps. */
function run(particles: Particle[], tC: number, seconds: number, seed = 5) {
  const random = mulberry32(seed)
  const steps = Math.round(seconds * 60)
  for (let i = 0; i < steps; i++) stepParticles(particles, tC, 1 / 60, random)
}

describe('latticeSites', () => {
  it('has exactly one site per particle, all distinct and inside the pool', () => {
    const sites = latticeSites()
    expect(sites).toHaveLength(PARTICLE_COUNT)
    expect(LATTICE_COLS * LATTICE_ROWS).toBe(PARTICLE_COUNT)
    const keys = new Set(sites.map((s) => `${s.x.toFixed(6)},${s.y.toFixed(6)}`))
    expect(keys.size).toBe(PARTICLE_COUNT)
    for (const s of sites) {
      expect(s.x).toBeGreaterThanOrEqual(POOL.left - 1e-9)
      expect(s.x).toBeLessThanOrEqual(POOL.right + 1e-9)
      expect(s.y).toBeGreaterThanOrEqual(POOL.top - 1e-9)
      expect(s.y).toBeLessThanOrEqual(POOL.bottom + 1e-9)
    }
  })

  it('keeps neighbouring sites far enough apart that molecules do not overlap at rest', () => {
    const { sx, sy } = latticeSpacing()
    const sites = latticeSites()
    let min = Number.POSITIVE_INFINITY
    for (let i = 0; i < sites.length; i++) {
      for (let j = i + 1; j < sites.length; j++) {
        const d = Math.hypot((sites[i].x - sites[j].x) / sx, (sites[i].y - sites[j].y) / sy)
        min = Math.min(min, d)
      }
    }
    // In lattice units, the nearest neighbours sit at distance 1 (horizontal or diagonal)
    expect(min).toBeCloseTo(1, 6)
  })
})

describe('phaseFor', () => {
  it('assigns the lowest ranks to solid, the next to liquid, the rest to gas', () => {
    const shares = { solid: 0.3, liquid: 0.5, gas: 0.2 }
    expect(phaseFor(0.1, shares)).toBe('solid')
    expect(phaseFor(0.5, shares)).toBe('liquid')
    expect(phaseFor(0.9, shares)).toBe('gas')
  })
})

describe('createParticles', () => {
  it('creates 120 particles on their lattice sites with ranks spread over (0, 1)', () => {
    const particles = createParticles()
    expect(particles).toHaveLength(PARTICLE_COUNT)
    const ranks = particles.map((p) => p.rank).sort((a, b) => a - b)
    expect(ranks[0]).toBeGreaterThan(0)
    expect(ranks[ranks.length - 1]).toBeLessThan(1)
    for (const p of particles) {
      expect(p.x).toBeCloseTo(p.site.x, 12)
      expect(p.y).toBeCloseTo(p.site.y, 12)
    }
  })

  it('is deterministic for a given seed', () => {
    const a = createParticles(3).map((p) => p.rank)
    const b = createParticles(3).map((p) => p.rank)
    expect(a).toEqual(b)
  })
})

describe('stepParticles phases', () => {
  it('keeps every particle on its site (within the cage or vibration) when cold', () => {
    const particles = createParticles()
    run(particles, -50, 3)
    const { sx, sy } = latticeSpacing()
    for (const p of particles) {
      expect(p.phase).toBe('solid')
      const d = Math.hypot((p.x - p.site.x) / sx, (p.y - p.site.y) / sy)
      expect(d).toBeLessThan(0.1)
    }
  })

  it('keeps particles in their liquid cage at room temperature', () => {
    const particles = createParticles()
    run(particles, 25, 4)
    for (const p of particles) {
      expect(p.phase).toBe('liquid')
      expect(Math.abs(p.ou)).toBeLessThanOrEqual(0.12 + 1e-9)
      expect(Math.abs(p.ov)).toBeLessThanOrEqual(0.12 + 1e-9)
    }
  })

  it('sends most particles into the gas, and keeps them inside the walls, at 150 °C', () => {
    const particles = createParticles()
    run(particles, 150, 6)
    const gas = particles.filter((p) => p.phase === 'gas')
    expect(gas).toHaveLength(PARTICLE_COUNT)
    for (const p of gas) {
      expect(p.x).toBeGreaterThanOrEqual(WALL_MARGIN.x - 1e-9)
      expect(p.x).toBeLessThanOrEqual(1 - WALL_MARGIN.x + 1e-9)
      expect(p.y).toBeGreaterThanOrEqual(WALL_MARGIN.y - 1e-9)
      expect(p.y).toBeLessThanOrEqual(1 - WALL_MARGIN.y + 1e-9)
    }
  })

  it('has the same phase counts as the phase shares at a band temperature', () => {
    const particles = createParticles()
    const tC = 1
    const shares = waterPhaseFractions(tC)
    run(particles, tC, 0.1)
    const solid = particles.filter((p) => p.phase === 'solid').length
    expect(solid / PARTICLE_COUNT).toBeCloseTo(shares.solid, 1)
  })
})

describe('gas speed scaling', () => {
  it('scales with the square root of the kelvin temperature', () => {
    const v1 = gasSpeed(-50, 1)
    const v2 = gasSpeed(150, 1)
    expect(v2 / v1).toBeCloseTo(Math.sqrt((150 + 273.15) / (-50 + 273.15)), 10)
  })

  it('matches speedScale at 25 °C for a unit speed factor', () => {
    expect(gasSpeed(25, 1)).toBeCloseTo(0.45 * speedScale(25), 12)
  })

  it('starts each molecule in the gas at its set speed, and collisions keep the total kinetic energy', () => {
    const particles = createParticles()
    const random = mulberry32(5)
    // A zero-length step only enters the gas: it sets the speeds and may collide.
    stepParticles(particles, 150, 0, random)
    const expected = particles.reduce((sum, p) => sum + gasSpeed(150, p.speedFactor) ** 2, 0)
    const kinetic = (ps: Particle[]) => ps.reduce((sum, p) => sum + p.vx * p.vx + p.vy * p.vy, 0)
    expect(kinetic(particles)).toBeCloseTo(expected, 9)

    for (let i = 0; i < 300; i++) stepParticles(particles, 150, 1 / 60, random)
    expect(kinetic(particles)).toBeCloseTo(expected, 9)
  })

  it('keeps gas molecules apart: no pair closer than the collision gap after a step', () => {
    const particles = createParticles()
    run(particles, 150, 4)
    const gas = particles.filter((p) => p.phase === 'gas')
    for (let i = 0; i < gas.length; i++) {
      for (let j = i + 1; j < gas.length; j++) {
        const d = Math.hypot((gas[i].x - gas[j].x) * BOX_ASPECT, gas[i].y - gas[j].y)
        expect(d).toBeGreaterThanOrEqual(GAS_MIN_GAP * 0.999)
      }
    }
  })
})

describe('settleParticles', () => {
  it('places solid and liquid particles exactly on their sites with no offset', () => {
    const particles = createParticles()
    settleParticles(particles, -20)
    for (const p of particles) {
      expect(p.phase).toBe('solid')
      expect(p.x).toBe(p.site.x)
      expect(p.y).toBe(p.site.y)
    }
    settleParticles(particles, 40)
    for (const p of particles) {
      expect(p.phase).toBe('liquid')
      expect(p.x).toBe(p.site.x)
    }
  })

  it('places gas particles inside the walls', () => {
    const particles = createParticles()
    settleParticles(particles, 130)
    for (const p of particles) {
      expect(p.phase).toBe('gas')
      expect(p.x).toBeGreaterThanOrEqual(WALL_MARGIN.x)
      expect(p.x).toBeLessThanOrEqual(1 - WALL_MARGIN.x)
    }
  })
})
