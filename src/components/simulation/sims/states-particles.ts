/**
 * Particle model for the states-of-matter Simulation. Each of the 120 water
 * particles has a fixed rank. At a given temperature the rank decides the phase:
 * the lowest ranks are solid, the next are liquid, the rest are gas. Solid and
 * liquid particles keep to their lattice site, vibrating (solid) or wandering
 * within a small cage (liquid). Gas particles move freely and bounce off the walls.
 *
 * Positions are normalised to the box: x and y run from 0 to 1, origin top-left.
 * Speeds scale with √T (in kelvin) through speedScale() from src/lib/chem/states.
 */
import { speedScale, waterPhaseFractions, type PhaseFractions } from '@/lib/chem/states'

export const PARTICLE_COUNT = 120
/** Lattice columns and rows that hold the condensed phases (15 × 8 = 120). */
export const LATTICE_COLS = 15
export const LATTICE_ROWS = 8

/** Region of the box that holds the condensed phases (solid and liquid), normalised. */
export const POOL = { left: 0.1, right: 0.9, top: 0.66, bottom: 0.96 }

/** Keeps molecules fully inside the walls, normalised. */
export const WALL_MARGIN = { x: 0.035, y: 0.045 }

/**
 * Width-to-height ratio of the drawn box (540 × 320 logical pixels). Gas
 * velocities and collisions are worked in these metric units, so that a
 * particle keeps its speed when it bounces and its shape stays round.
 */
export const BOX_ASPECT = 540 / 320

/** Gas speed at 25 °C, in box heights per second. */
const GAS_SPEED = 0.45
/** Closest two gas molecules may come, in box heights (about 19 px on screen). */
export const GAS_MIN_GAP = 0.06
/** Liquid wander speed at 25 °C, in lattice units per second. */
const WANDER_SPEED = 0.5
/** Largest liquid wander from a site, in lattice units (keeps the liquid close-packed). */
const WANDER_CAP = 0.12
/** Solid vibration amplitude at 25 °C, in lattice units. */
const VIBRATION_AMPLITUDE = 0.05
/** Solid vibration angular frequency, rad/s. */
const VIBRATION_OMEGA = 2 * Math.PI * 3
/** Rate at which a particle condenses onto its site, per second. */
const CONDENSE_RATE = 2.5
/** Rate at which a molecule turns to stand upright when it is solid. */
const ALIGN_RATE = 2.5
/** Molecule orientation for a solid: the H-O-H bisector points up. */
export const SOLID_ANGLE = -Math.PI / 2

const TWO_PI = Math.PI * 2

export type Phase = 'solid' | 'liquid' | 'gas'

export interface Site {
  x: number
  y: number
}

export interface Particle {
  /** Fixed value in (0, 1). Below the solid share it is solid, and so on. */
  rank: number
  /** Lattice site this particle belongs to, normalised. */
  site: Site
  /** Current position, normalised. */
  x: number
  y: number
  /** Liquid wander offset from the site, in lattice units. */
  ou: number
  ov: number
  /** Liquid: direction of the current wander. */
  wanderAngle: number
  /** Liquid: time left before the wander direction changes, s. */
  turnTimer: number
  /** Solid: vibration phase, radians. */
  vibPhase: number
  /** Gas velocity in metric units (x in box heights, as for y), per second. */
  vx: number
  vy: number
  /** Per-particle factor on speed, between 0.7 and 1.3. */
  speedFactor: number
  /** Molecule orientation, radians (bisector of the H-O-H angle). */
  angle: number
  /** Turning direction, +1 or -1. */
  spinSign: number
  phase: Phase
  /** True while the particle is moving from the gas onto its site. */
  condensing: boolean
}

/** Small deterministic PRNG (mulberry32), so the particle layout is the same on every visit. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Horizontal and vertical spacing of the lattice, normalised. */
export function latticeSpacing(): { sx: number; sy: number } {
  return {
    sx: (POOL.right - POOL.left) / (LATTICE_COLS - 0.5),
    sy: (POOL.bottom - POOL.top) / (LATTICE_ROWS - 1),
  }
}

/**
 * The 120 lattice sites. Odd rows are offset by half a spacing, so the sites
 * form a close-packed (hexagonal-like) arrangement.
 */
export function latticeSites(): Site[] {
  const { sx, sy } = latticeSpacing()
  const sites: Site[] = []
  for (let row = 0; row < LATTICE_ROWS; row++) {
    const offset = row % 2 === 1 ? 0.5 : 0
    for (let col = 0; col < LATTICE_COLS; col++) {
      sites.push({
        x: POOL.left + (col + offset) * sx,
        y: POOL.bottom - row * sy,
      })
    }
  }
  return sites
}

/** Phase of a particle with this rank, given the phase shares. */
export function phaseFor(rank: number, shares: PhaseFractions): Phase {
  if (rank < shares.solid) return 'solid'
  if (rank < shares.solid + shares.liquid) return 'liquid'
  return 'gas'
}

/**
 * Speed, in box heights per second, that a molecule starts with when it enters
 * the gas at a temperature. Collisions then exchange speed between molecules,
 * but the total kinetic energy stays the same.
 */
export function gasSpeed(tC: number, speedFactor: number): number {
  return GAS_SPEED * speedScale(tC) * speedFactor
}

/** Nearest angle to `target` that differs from it by a whole number of turns. */
function nearestEquivalent(angle: number, target: number): number {
  return target + TWO_PI * Math.round((angle - target) / TWO_PI)
}

/**
 * Creates the 120 particles at 25 °C, all on their lattice sites. The ranks and
 * the gas starting spots come from a fixed seed.
 */
export function createParticles(seed = 7): Particle[] {
  const random = mulberry32(seed)
  const sites = latticeSites()
  const order = sites.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return sites.map((site, i) => ({
    rank: (order[i] + 0.5) / PARTICLE_COUNT,
    site,
    x: site.x,
    y: site.y,
    ou: 0,
    ov: 0,
    wanderAngle: random() * TWO_PI,
    turnTimer: 0.5 + random(),
    vibPhase: random() * TWO_PI,
    vx: 0,
    vy: 0,
    speedFactor: 0.7 + 0.6 * random(),
    angle: SOLID_ANGLE,
    spinSign: random() < 0.5 ? -1 : 1,
    phase: 'liquid',
    condensing: false,
  }))
}

/** Places each particle where it belongs at a temperature, with no motion. Used under reduced motion. */
export function settleParticles(particles: Particle[], tC: number, seed = 11): void {
  const shares = waterPhaseFractions(tC)
  const random = mulberry32(seed)
  for (const p of particles) {
    const phase = phaseFor(p.rank, shares)
    if (phase === 'gas') {
      if (p.phase !== 'gas') {
        p.x = WALL_MARGIN.x + random() * (1 - 2 * WALL_MARGIN.x)
        p.y = WALL_MARGIN.y + random() * (1 - 2 * WALL_MARGIN.y)
      }
      p.vx = 0
      p.vy = 0
    } else {
      p.x = p.site.x
      p.y = p.site.y
      p.ou = 0
      p.ov = 0
      p.angle = phase === 'solid' ? SOLID_ANGLE : nearestEquivalent(p.angle, SOLID_ANGLE)
    }
    p.phase = phase
    p.condensing = false
  }
}

/**
 * Advances every particle by dt seconds at temperature tC (°C). Gas particles
 * move in straight lines and bounce off the walls. Condensed particles stay on
 * their sites and move only within their small range. The `random` function
 * supplies directions and turns.
 */
export function stepParticles(
  particles: Particle[],
  tC: number,
  dt: number,
  random: () => number
): void {
  const shares = waterPhaseFractions(tC)
  const scale = speedScale(tC)
  const { sx, sy } = latticeSpacing()
  const mx = WALL_MARGIN.x
  const my = WALL_MARGIN.y

  for (const p of particles) {
    const next = phaseFor(p.rank, shares)

    if (next === 'gas') {
      if (p.phase !== 'gas') {
        // Entering the gas: a fresh direction, with speed set by the temperature.
        const heading = random() * TWO_PI
        const speed = gasSpeed(tC, p.speedFactor)
        p.vx = Math.cos(heading) * speed
        p.vy = Math.sin(heading) * speed
      }
      p.x += (p.vx / BOX_ASPECT) * dt
      p.y += p.vy * dt
      if (p.x < mx) {
        p.x = 2 * mx - p.x
        p.vx = Math.abs(p.vx)
      } else if (p.x > 1 - mx) {
        p.x = 2 * (1 - mx) - p.x
        p.vx = -Math.abs(p.vx)
      }
      if (p.y < my) {
        p.y = 2 * my - p.y
        p.vy = Math.abs(p.vy)
      } else if (p.y > 1 - my) {
        p.y = 2 * (1 - my) - p.y
        p.vy = -Math.abs(p.vy)
      }
      p.angle += p.spinSign * 2.2 * scale * dt
      p.condensing = false
    } else {
      if (p.phase === 'gas') p.condensing = true

      let tx: number
      let ty: number
      if (next === 'solid') {
        // Vibration about the site: amplitude and speed both grow with √T.
        p.vibPhase += VIBRATION_OMEGA * scale * dt
        const amp = VIBRATION_AMPLITUDE * scale
        p.ou = amp * Math.cos(p.vibPhase)
        p.ov = amp * Math.sin(p.vibPhase)
        p.angle = p.angle + (SOLID_ANGLE - p.angle) * (1 - Math.exp(-ALIGN_RATE * dt))
        p.angle = nearestEquivalent(p.angle, SOLID_ANGLE)
      } else {
        // Liquid: sliding within a small cage around the site.
        p.turnTimer -= dt
        if (p.turnTimer <= 0) {
          p.wanderAngle = random() * TWO_PI
          p.turnTimer = 0.6 + random() * 0.8
        }
        const step = WANDER_SPEED * scale * dt
        p.ou = clamp(p.ou + Math.cos(p.wanderAngle) * step, WANDER_CAP)
        p.ov = clamp(p.ov + Math.sin(p.wanderAngle) * step, WANDER_CAP)
        p.angle += p.spinSign * 0.9 * scale * dt
      }
      tx = p.site.x + p.ou * sx
      ty = p.site.y + p.ov * sy

      if (p.condensing) {
        const k = 1 - Math.exp(-CONDENSE_RATE * dt)
        p.x += (tx - p.x) * k
        p.y += (ty - p.y) * k
        if (Math.hypot((tx - p.x) / sx, (ty - p.y) / sy) < 0.05) p.condensing = false
      } else {
        p.x = tx
        p.y = ty
      }
    }
    p.phase = next
  }

  collideGas(particles.filter((p) => p.phase === 'gas'), mx, my)
}

/**
 * Elastic collisions between gas molecules (equal masses). Two molecules that
 * come closer than GAS_MIN_GAP exchange their velocity components along the
 * line joining them, and are pushed apart. Speeds are unchanged.
 */
function collideGas(gas: Particle[], mx: number, my: number): void {
  for (let i = 0; i < gas.length; i++) {
    const p = gas[i]
    for (let j = i + 1; j < gas.length; j++) {
      const q = gas[j]
      const dx = (p.x - q.x) * BOX_ASPECT
      const dy = p.y - q.y
      const d = Math.hypot(dx, dy)
      if (d >= GAS_MIN_GAP || d === 0) continue

      const nx = dx / d
      const ny = dy / d
      const approach = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny
      if (approach < 0) {
        p.vx -= approach * nx
        p.vy -= approach * ny
        q.vx += approach * nx
        q.vy += approach * ny
      }

      const push = (GAS_MIN_GAP - d) / 2
      p.x = clamp01(p.x + (nx * push) / BOX_ASPECT, mx)
      p.y = clamp01(p.y + ny * push, my)
      q.x = clamp01(q.x - (nx * push) / BOX_ASPECT, mx)
      q.y = clamp01(q.y - ny * push, my)
    }
  }
}

function clamp01(v: number, margin: number): number {
  return Math.min(1 - margin, Math.max(margin, v))
}

function clamp(v: number, limit: number): number {
  return Math.min(limit, Math.max(-limit, v))
}
