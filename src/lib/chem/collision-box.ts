/**
 * A small 2D hard-sphere box for the collision-theory Simulation (Class 12 Unit 3, Section 3.5).
 *
 * Model. Equal-mass hard spheres, elastic collisions, reflecting walls. Each A particle carries a
 * reactive axis: a collision between A and B is "oriented" when B approaches within ±πP of that axis,
 * so a random contact direction is oriented with probability P. A collision is "energetic" when the
 * energy along the line of centres is at least Eₐ. For flux-weighted collisions in a Maxwell gas that
 * energy, in units of RT, is exponentially distributed, so the fraction of energetic A–B collisions
 * tends to e^(−Eₐ/RT), NCERT's fraction (see fractionAboveEa). The effective fraction tends to P·e^(−Eₐ/RT).
 *
 * Units. Positions are in SVG units (px). Velocities are px per second. The thermal energy scale
 * is kT(T) = KT_UNIT_PX2 · T / 300 (px² s⁻²), so the toy at 300 K has σ = 60 px s⁻¹ per component.
 * Everything is deterministic: the only randomness is mulberry32 with a caller-chosen seed.
 */
import { mulberry32 } from './kinetics'

export const KT_UNIT_PX2 = 3600
const TWO_PI = 2 * Math.PI

export interface CollisionParticle {
  x: number
  y: number
  vx: number
  vy: number
  species: 'A' | 'B'
  /** Reactive axis of an A particle, in radians (ignored for B). */
  axis: number
  /** Angular speed of the reactive axis, rad s⁻¹. */
  spin: number
}

export interface CollisionFlashEvent {
  x: number
  y: number
  /** Sim time at which the collision happened, s. */
  t: number
  effective: boolean
}

export interface CollisionBox {
  width: number
  height: number
  radius: number
  tempK: number
  particles: CollisionParticle[]
  /** Simulated time elapsed, s. */
  time: number
  /** Counters since the last reset. */
  total: number
  ab: number
  energetic: number
  effective: number
  /** Most recent collisions, newest last, capped at FLASH_CAP. */
  flashes: CollisionFlashEvent[]
  /** Counts of A–B collisions per energy bin (E/RT), for the measured energy density. */
  abBins: number[]
  rng: () => number
}

export const FLASH_CAP = 40
/** Histogram of collision energy (E/RT) over A–B collisions: bins of BIN_WIDTH from 0 to BIN_COUNT·BIN_WIDTH. */
export const BIN_WIDTH = 0.25
export const BIN_COUNT = 32

export interface CreateBoxOptions {
  seed: number
  nA: number
  nB: number
  width: number
  height: number
  radius: number
  tempK: number
}

/** Thermal energy scale kT for the toy, px² s⁻². */
export function thermalUnit(tempK: number): number {
  return (KT_UNIT_PX2 * tempK) / 300
}

/** Standard normal from two uniforms (Box–Muller), deterministic given the RNG. */
function gaussian(rng: () => number): number {
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TWO_PI * v)
}

/** Lay out nA + nB particles without overlap (seeded rejection sampling) with Maxwell velocities. */
export function createCollisionBox(opts: CreateBoxOptions): CollisionBox {
  const rng = mulberry32(opts.seed)
  const sigma = Math.sqrt(thermalUnit(opts.tempK))
  const particles: CollisionParticle[] = []
  const total = opts.nA + opts.nB
  for (let i = 0; i < total; i++) {
    let x = 0
    let y = 0
    for (let tries = 0; tries < 2000; tries++) {
      x = opts.radius + rng() * (opts.width - 2 * opts.radius)
      y = opts.radius + rng() * (opts.height - 2 * opts.radius)
      const clear = particles.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 >= (2.2 * opts.radius) ** 2)
      if (clear) break
    }
    particles.push({
      x,
      y,
      vx: sigma * gaussian(rng),
      vy: sigma * gaussian(rng),
      species: i < opts.nA ? 'A' : 'B',
      axis: rng() * TWO_PI,
      spin: (rng() - 0.5) * 2,
    })
  }
  return {
    width: opts.width,
    height: opts.height,
    radius: opts.radius,
    tempK: opts.tempK,
    particles,
    time: 0,
    total: 0,
    ab: 0,
    energetic: 0,
    effective: 0,
    flashes: [],
    abBins: new Array<number>(BIN_COUNT).fill(0),
    rng,
  }
}

/** Collision energy along the line of centres, in units of RT: ¼ vₙ² / kT (equal masses, μ = ½). */
export function collisionEnergyInRT(normalSpeed: number, tempK: number): number {
  return (0.25 * normalSpeed * normalSpeed) / thermalUnit(tempK)
}

/** True when the contact direction (A → B, radians) lies within ±πP of A's reactive axis. */
export function isOriented(contactAngle: number, axis: number, P: number): boolean {
  if (P >= 1) return true
  let d = (contactAngle - axis) % TWO_PI
  if (d > Math.PI) d -= TWO_PI
  if (d < -Math.PI) d += TWO_PI
  return Math.abs(d) <= Math.PI * P
}

/** Rescale all velocities after a temperature change, so the gas stays Maxwellian at the new T. */
export function setBoxTemperature(box: CollisionBox, tempK: number): void {
  const s = Math.sqrt(tempK / box.tempK)
  for (const p of box.particles) {
    p.vx *= s
    p.vy *= s
  }
  box.tempK = tempK
}

/**
 * Advance the box by dt seconds of simulated time. `aRT` is Eₐ/RT for the threshold and `P` the steric
 * factor. Counters and flash events update on every approaching contact.
 */
export function stepCollisionBox(box: CollisionBox, dt: number, aRT: number, P: number): void {
  const { particles: ps, radius: r } = box
  for (const p of ps) {
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.axis += p.spin * dt
    if (p.x < r) {
      p.x = 2 * r - p.x
      p.vx = Math.abs(p.vx)
    } else if (p.x > box.width - r) {
      p.x = 2 * (box.width - r) - p.x
      p.vx = -Math.abs(p.vx)
    }
    if (p.y < r) {
      p.y = 2 * r - p.y
      p.vy = Math.abs(p.vy)
    } else if (p.y > box.height - r) {
      p.y = 2 * (box.height - r) - p.y
      p.vy = -Math.abs(p.vy)
    }
  }
  box.time += dt
  const minD = 2 * r
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const a = ps[i]
      const b = ps[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const d2 = dx * dx + dy * dy
      if (d2 >= minD * minD || d2 === 0) continue
      const d = Math.sqrt(d2)
      const nx = dx / d
      const ny = dy / d
      const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
      if (vn < 0) {
        box.total += 1
        const contactAB = a.species === 'A' ? Math.atan2(ny, nx) : Math.atan2(-ny, -nx)
        let effective = false
        if (a.species !== b.species) {
          const A = a.species === 'A' ? a : b
          box.ab += 1
          const x = collisionEnergyInRT(vn, box.tempK)
          const bin = Math.floor(x / BIN_WIDTH)
          if (bin < BIN_COUNT) box.abBins[bin] += 1
          const energetic = x >= aRT
          if (energetic) {
            box.energetic += 1
            effective = isOriented(contactAB, A.axis, P)
            if (effective) box.effective += 1
          }
          box.flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: box.time, effective: energetic && effective })
          if (box.flashes.length > FLASH_CAP) box.flashes.shift()
        }
        // Equal masses: exchange the normal components (elastic).
        a.vx += vn * nx
        a.vy += vn * ny
        b.vx -= vn * nx
        b.vy -= vn * ny
      }
      const overlap = minD - d
      a.x -= (overlap / 2) * nx
      a.y -= (overlap / 2) * ny
      b.x += (overlap / 2) * nx
      b.y += (overlap / 2) * ny
    }
  }
}

/** Reset the counters and the flashes, keeping the particles and the clock. */
export function resetCounters(box: CollisionBox): void {
  box.total = 0
  box.ab = 0
  box.energetic = 0
  box.effective = 0
  box.flashes = []
  box.abBins = new Array<number>(BIN_COUNT).fill(0)
}
