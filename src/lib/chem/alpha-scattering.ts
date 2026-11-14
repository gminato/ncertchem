/**
 * Alpha-particle scattering from a point nucleus (NCERT Class 11, Unit 2,
 * section 2.2.2), in dimensionless units.
 *
 * An alpha particle is repelled by the positive nucleus with force
 * F = κ / r², where κ = k Z₁ Z₂ e². Write b₀ = κ / (m v²), where v is the
 * speed at infinity. Then the scattering angle θ for an impact parameter b
 * is given exactly by the Rutherford result:
 *
 *     tan(θ / 2) = b₀ / b
 *
 * This module works in units where v = 1 and κ/m = b₀. Lengths are then in
 * units of b₀, so the same numbers draw the scene at any scale. The
 * integrator below is an independent check on the closed form.
 */

export interface ScatterPoint {
  x: number
  y: number
}

export interface AlphaTrajectory {
  /** Positions from the far incoming side to the far outgoing side. */
  points: ScatterPoint[]
  /** Signed scattering angle (rad). Positive when the particle is pushed towards +y. */
  angle: number
}

/** Rutherford's closed-form scattering angle |θ| = 2 atan(b₀ / |b|), in radians. */
export function rutherfordAngle(b: number, b0 = 1): number {
  if (b === 0) return Math.PI
  return 2 * Math.atan(Math.abs(b0 / b))
}

/**
 * Integrates one alpha particle's path past a nucleus at the origin, with
 * velocity Verlet and a step proportional to the distance from the nucleus.
 * The particle starts at (-startDistance, b) and moves in +x at speed 1 at
 * infinity.
 *
 * @param b Impact parameter, in units of b₀ (positive: the particle passes above the nucleus)
 * @param b0 The scale b₀ (default 1)
 * @param startDistance How far out the particle starts (default 60 b₀)
 */
export function integrateAlpha(b: number, b0 = 1, startDistance = 60 * b0): AlphaTrajectory {
  if (!Number.isFinite(b) || b === 0) throw new RangeError('The impact parameter must be finite and non-zero')
  if (!(b0 > 0 && startDistance > 0)) throw new RangeError('b0 and the start distance must be positive')

  const X0 = startDistance
  const eta = 0.01
  const accel = (x: number, y: number) => {
    const r2 = x * x + y * y
    const r = Math.sqrt(r2)
    const f = b0 / (r2 * r)
    return { ax: f * x, ay: f * y }
  }

  // Start with asymptotic energy (v² = 1 - 2 b0 / r) and angular momentum
  // magnitude b, so the path matches the requested impact parameter.
  let vx = Math.sqrt(1 - (2 * b0) / X0)
  let vy = 0
  for (let i = 0; i < 6; i++) {
    vy = (b * (1 - vx)) / X0
    vx = Math.sqrt(Math.max(0, 1 - (2 * b0) / X0 - vy * vy))
  }

  let x = -X0
  let y = b
  const points: ScatterPoint[] = [{ x, y }]
  let { ax, ay } = accel(x, y)

  // Stop once the particle is outside the start distance and moving away.
  for (let guard = 0; guard < 2_000_000; guard++) {
    const r = Math.hypot(x, y)
    if (r >= X0 && x * vx + y * vy > 0) break
    const dt = eta * r
    x += vx * dt + 0.5 * ax * dt * dt
    y += vy * dt + 0.5 * ay * dt * dt
    const next = accel(x, y)
    vx += 0.5 * (ax + next.ax) * dt
    vy += 0.5 * (ay + next.ay) * dt
    ax = next.ax
    ay = next.ay
    points.push({ x, y })
  }

  return { points, angle: Math.atan2(vy, vx) }
}

/**
 * The path of an alpha particle with impact parameter b, extended in a
 * straight line from the last computed point until it reaches a circle of
 * radius `radius` about the origin. Use this to draw the path to a detector.
 */
export function pathToCircle(trajectory: AlphaTrajectory, radius: number): ScatterPoint[] {
  const last = trajectory.points[trajectory.points.length - 1]
  const dx = Math.cos(trajectory.angle)
  const dy = Math.sin(trajectory.angle)
  // Solve |last + t d| = radius for the positive root t.
  const bq = 2 * (last.x * dx + last.y * dy)
  const cq = last.x * last.x + last.y * last.y - radius * radius
  const t = (-bq + Math.sqrt(Math.max(0, bq * bq - 4 * cq))) / 2
  return [...trajectory.points, { x: last.x + t * dx, y: last.y + t * dy }]
}

/** Classes used by the scene: straight through, deflected, and bounced back. */
export type ScatterClass = 'straight' | 'deflected' | 'bounced'

/** Classifies a scattering angle (rad). Straight is under 5°; bounced is over 90°. */
export function scatterClass(angleRad: number): ScatterClass {
  const deg = (Math.abs(angleRad) * 180) / Math.PI
  if (deg < 5) return 'straight'
  if (deg > 90) return 'bounced'
  return 'deflected'
}
