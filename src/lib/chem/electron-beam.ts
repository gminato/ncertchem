import { ELECTRON_CHARGE_TO_MASS } from './constants'

/**
 * Thomson's cathode-ray experiment, modelled in SI units (NCERT Class 11,
 * Unit 2, section 2.1.2). The beam travels along +x. The electric field
 * points down (from the positive plate to the negative plate). The magnetic
 * field points into the page (-z). The electron has charge -e.
 *
 * Force on the electron: F = -e (E + v x B). For v along +x, E along -y and
 * B along -z this gives an upward electric force and a downward magnetic
 * force, so the two can balance.
 */

export interface BeamGeometry {
  /** Length of the region that the fields act on, along the beam (m). */
  fieldLength: number
  /** Distance from the exit of the field region to the screen (m). */
  screenDistance: number
}

export interface BeamSetup extends BeamGeometry {
  /** Electric field magnitude (V m⁻¹). */
  electricField: number
  /** Magnetic flux density magnitude (T). */
  magneticField: number
  /** Beam speed along x (m s⁻¹), set by the accelerating voltage. */
  speed: number
}

export interface BeamPoint {
  /** Distance along the tube from the cathode (m). */
  x: number
  /** Height above the undeflected path (m). Positive is up, towards the positive plate. */
  y: number
}

/**
 * The illustrative fields used on the site. The fields are chosen so that
 * the crossed fields balance when v = E / B, and the magnetic radius r is
 * then about 4 cm. Every value is derived from ELECTRON_CHARGE_TO_MASS.
 */
export function thomsonScenario(): {
  electricField: number
  magneticField: number
  speed: number
  radius: number
  chargeToMass: number
} {
  const magneticField = 1.0e-3
  const electricField = 7.0e3
  const speed = electricField / magneticField
  const radius = speed / (ELECTRON_CHARGE_TO_MASS * magneticField)
  return { electricField, magneticField, speed, radius, chargeToMass: ELECTRON_CHARGE_TO_MASS }
}

/**
 * Thomson's ratio e/m from a balanced measurement: with v = E/B and radius
 * r = mv/(eB) in the magnetic field alone, e/m = E / (B² r).
 */
export function chargeToMassFromBalance(electricField: number, magneticField: number, radius: number): number {
  if (!(electricField > 0 && magneticField > 0 && radius > 0)) {
    throw new RangeError('E, B and r must be positive')
  }
  return electricField / (magneticField * magneticField * radius)
}

/** Radius of the circular path in a magnetic field alone: r = m v / (e B). */
export function magneticRadius(speed: number, magneticField: number): number {
  return speed / (ELECTRON_CHARGE_TO_MASS * magneticField)
}

/** Transverse acceleration components (m s⁻²) at a velocity, with the fields scaled by fieldE and fieldB. */
function accelerations(
  vx: number,
  vy: number,
  setup: BeamSetup,
  fieldE: number,
  fieldB: number
): { ax: number; ay: number } {
  const k = ELECTRON_CHARGE_TO_MASS
  return {
    ax: k * vy * setup.magneticField * fieldB,
    ay: k * (setup.electricField * fieldE - vx * setup.magneticField * fieldB),
  }
}

interface State {
  x: number
  y: number
  vx: number
  vy: number
}

/**
 * Traces the electron's path from the cathode to the screen. Inside the field
 * region the path is found by RK4 integration of the Lorentz force. Outside
 * it, the path is a straight line that continues the exit direction.
 *
 * `fieldE` and `fieldB` scale the two fields between 0 (off) and 1 (full), so
 * the path can be drawn while the fields are being switched on.
 *
 * @param pointsInRegion Approximate number of samples inside the field region
 */
export function beamPath(setup: BeamSetup, fieldE: number, fieldB: number, pointsInRegion = 60): BeamPoint[] {
  const { fieldLength, speed, screenDistance } = setup
  if (!(fieldLength > 0 && speed > 0 && screenDistance >= 0)) {
    throw new RangeError('Beam geometry and speed must be positive')
  }

  const steps = 400
  const dt = fieldLength / speed / steps
  const every = Math.max(1, Math.floor(steps / pointsInRegion))
  const derivative = (s: State) => {
    const { ax, ay } = accelerations(s.vx, s.vy, setup, fieldE, fieldB)
    return { dx: s.vx, dy: s.vy, dvx: ax, dvy: ay }
  }
  const advance = (s: State, k: { dx: number; dy: number; dvx: number; dvy: number }, h: number): State => ({
    x: s.x + h * k.dx,
    y: s.y + h * k.dy,
    vx: s.vx + h * k.dvx,
    vy: s.vy + h * k.dvy,
  })

  let s: State = { x: 0, y: 0, vx: speed, vy: 0 }
  const points: BeamPoint[] = [{ x: 0, y: 0 }]

  for (let i = 1; i <= steps; i++) {
    const k1 = derivative(s)
    const k2 = derivative(advance(s, k1, dt / 2))
    const k3 = derivative(advance(s, k2, dt / 2))
    const k4 = derivative(advance(s, k3, dt))
    s = {
      x: s.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
      y: s.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
      vx: s.vx + (dt / 6) * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx),
      vy: s.vy + (dt / 6) * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy),
    }
    if (i % every === 0 || i === steps) points.push({ x: s.x, y: s.y })
  }

  // Straight line after the field region, to the screen.
  const slope = s.vy / s.vx
  const afterSamples = 12
  for (let j = 1; j <= afterSamples; j++) {
    const dxAfter = (screenDistance * j) / afterSamples
    points.push({ x: s.x + dxAfter, y: s.y + slope * dxAfter })
  }
  return points
}

/** The last sample inside the field region (x at the field exit). */
export function fieldExitPoint(path: BeamPoint[], fieldLength: number): BeamPoint {
  let best = path[0]
  for (const p of path) {
    if (p.x <= fieldLength + 1e-9 && p.x >= best.x) best = p
  }
  return best
}

/** Height on the screen (m) of the beam for the given setup and field strengths. */
export function screenDeflection(setup: BeamSetup, fieldE: number, fieldB: number): number {
  const path = beamPath(setup, fieldE, fieldB)
  return path[path.length - 1].y
}
