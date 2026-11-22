/** Pure geometry for the organic6 drawings. No React here, so the tests can check the numbers directly. */

export interface Pt {
  x: number
  y: number
}

export interface Vec3 {
  /** Along the reaction axis (before mirroring). */
  x: number
  /** Screen down is positive. */
  y: number
  /** Towards the viewer is positive: wedge. Away is negative: dash. */
  z: number
}

/** Umbrella groups sit at 0°, 120° and 240° around the axis, measured from straight up. */
export const UMBRELLA_ANGLES_DEG = [0, 120, 240] as const

/** How far a depth step shifts a group sideways, so the three groups read in perspective. */
export const DEPTH_SHEAR = 0.32

export function clamp01(t: number): number {
  return Math.min(1, Math.max(0, t))
}

/**
 * The x component of each umbrella group along the axis. invert 0 gives -1/3 (the umbrella opens
 * away from the right-hand group, the tetrahedral angle), 0.5 gives 0 (the three groups flat),
 * 1 gives +1/3 (flipped). Linear in `invert`, so a slider moves smoothly.
 */
export function umbrellaAxial(invert: number): number {
  return -1 / 3 + (2 / 3) * clamp01(invert)
}

/** Unit-length direction of each umbrella group for a given inversion. */
export function umbrellaVectors(invert: number): Vec3[] {
  const a = umbrellaAxial(invert)
  const r = Math.sqrt(1 - a * a)
  return UMBRELLA_ANGLES_DEG.map((deg) => {
    const th = (deg * Math.PI) / 180
    return { x: a, y: -r * Math.cos(th), z: r * Math.sin(th) }
  })
}

export interface StereoLayoutOptions {
  invert: number
  mirror: boolean
  cx: number
  cy: number
  /** Bond length in pixels. */
  length: number
}

export interface StereoLayout {
  centre: Pt
  umbrella: { tip: Pt; z: number }[]
  /** The group on the left and on the right of the axis, after mirroring. */
  left: Pt
  right: Pt
}

/**
 * Screen positions of the carbon, its three umbrella tips and the two axis groups.
 * `mirror` reflects the whole arrangement left to right, which is the mirror image.
 */
export function stereoLayout(o: StereoLayoutOptions): StereoLayout {
  const s = o.mirror ? -1 : 1
  const umbrella = umbrellaVectors(o.invert).map((v) => ({
    // The depth shear is mirrored too, so the mirror image is an exact left-right reflection of the drawing.
    tip: { x: o.cx + s * (v.x + v.z * DEPTH_SHEAR) * o.length, y: o.cy + v.y * o.length },
    z: v.z,
  }))
  return {
    centre: { x: o.cx, y: o.cy },
    umbrella,
    right: { x: o.cx + s * o.length, y: o.cy },
    left: { x: o.cx - s * o.length, y: o.cy },
  }
}

/** Drawn bond length in units for a bond of `lengthPm` picometres at `unitsPerPm` units per pm. */
export function bondLengthUnits(lengthPm: number, unitsPerPm: number): number {
  return lengthPm * unitsPerPm
}
