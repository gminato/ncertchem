/**
 * Pure geometry for the VSEPR animations and the VSEPR Builder simulation (NCERT Class 11
 * Unit 4, Section 4.4). It turns a bonding-pair and lone-pair count into domain directions,
 * applies the lone-pair squeeze that reduces the bond angle (Table 4.8), and morphs one
 * arrangement into another slot by slot so that a transition can be drawn as a tween.
 *
 * A Pose is a fixed list of slots. Each slot is one electron domain: a bond, a lone pair, or
 * nothing ('none'), and it keeps its index while the pose morphs. A bond slot moves in and
 * out of the centre by `scale`, so a new bond grows out of the atom and a removed bond
 * retracts into it. Lone-pair lobes cannot scale, so they switch on and off at a switch point.
 */

import { vseprClass, vseprPositions } from './vsepr'

/** A 3D vector as a mutable tuple. */
export type V3 = [number, number, number]

export type SlotKind = 'bond' | 'lone' | 'none'

export interface Slot {
  /** Unit direction from the central atom. */
  dir: V3
  kind: SlotKind
  /** 0 (at the centre) to 1 (one bond length out). Used for bonds only. */
  scale: number
}

/** Orthonormal screen axes for a 2D view. The view looks along `forward = up × right`. */
export interface Basis {
  right: V3
  up: V3
}

export interface Pose {
  slots: Slot[]
  basis: Basis
}

/** A domain with a settled direction: what `domainsFor` returns. */
export interface Domain {
  dir: V3
  kind: 'bond' | 'lone'
}

/**
 * The state the Learner sets. `squeeze` runs from 0 (ideal geometry) to 1 (the bond angle
 * NCERT reports), and is used only where NCERT reports an angle.
 */
export interface VseprConfig {
  bondPairs: number
  lonePairs: number
  squeeze: number
}

const DEG = Math.PI / 180
const NONE_DIR: V3 = [0, 0, 1]

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
const norm = (a: V3): V3 => {
  const l = len(a)
  return l > 0 ? scale(a, 1 / l) : [0, 0, 0]
}
const lerpV = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const toV3 = (a: readonly number[]): V3 => [a[0], a[1], a[2]]

/** Angle between two vectors in degrees. */
export function angleBetweenDeg(a: readonly number[], b: readonly number[]): number {
  const la = Math.hypot(a[0], a[1], a[2])
  const lb = Math.hypot(b[0], b[1], b[2])
  if (la === 0 || lb === 0) return 0
  return Math.acos(Math.max(-1, Math.min(1, dot(a, b) / (la * lb)))) / DEG
}

/** True when (bondPairs, lonePairs) is one of the combinations NCERT Tables 4.6 to 4.8 name. */
export function isNcertClass(bondPairs: number, lonePairs: number): boolean {
  try {
    vseprClass(bondPairs, lonePairs)
    return true
  } catch {
    return false
  }
}

/** True when NCERT prints a bond angle for the class, so the lone-pair squeeze applies. */
export function supportsSqueeze(bondPairs: number, lonePairs: number): boolean {
  return isNcertClass(bondPairs, lonePairs) && vseprClass(bondPairs, lonePairs).reportedAngle !== null
}

/**
 * The bond angle shown for a config, in degrees: the ideal angle, moved towards the angle NCERT
 * reports by the squeeze. Classes without a reported angle return the ideal angle.
 */
export function bondAngleDeg(config: VseprConfig): number {
  const cls = vseprClass(config.bondPairs, config.lonePairs)
  const ideal = cls.idealAngles[0]
  if (cls.reportedAngle === null) return ideal
  return ideal + (cls.reportedAngle - ideal) * clamp01(config.squeeze)
}

/**
 * Moves the bonds of a lone-pair arrangement closer together, so that the bond angle becomes
 * `reportedDeg` at s = 1. Each bond keeps its azimuth around the axis that points away from the
 * lone pairs and only its polar angle changes. For two bonds the angle is 2φ. For three bonds,
 * cos θ = cos²φ − ½ sin²φ, so cos²φ = (cos θ + ½) / (3/2), because the bonds sit 120° apart.
 */
function squeezeBonds(bonds: readonly V3[], lonePairs: readonly V3[], reportedDeg: number, s: number): V3[] {
  const lpSum = lonePairs.reduce<V3>((acc, lp) => add(acc, lp), [0, 0, 0])
  const axis = scale(norm(lpSum), -1)
  const n = bonds.length
  const phiIdeal = Math.acos(Math.max(-1, Math.min(1, dot(bonds[0], axis))))
  const phiTarget =
    n === 2
      ? (reportedDeg * DEG) / 2
      : Math.acos(Math.sqrt(Math.max(0, (Math.cos(reportedDeg * DEG) + 0.5) / 1.5)))
  const phi = phiIdeal + (phiTarget - phiIdeal) * s

  // Basis in the plane perpendicular to the axis, with e1 along the first bond.
  const first = bonds[0]
  const e1 = norm(add(first, scale(axis, -dot(first, axis))))
  const e2 = cross(axis, e1)

  return bonds.map((d) => {
    const psi = Math.atan2(dot(d, e2), dot(d, e1))
    const radial = add(scale(e1, Math.cos(psi)), scale(e2, Math.sin(psi)))
    return add(scale(axis, Math.cos(phi)), scale(radial, Math.sin(phi)))
  })
}

/**
 * The domains of a config: bonds first, then lone pairs, each as a unit direction. Bonds are
 * squeezed when `squeeze` is above 0 and NCERT reports an angle for the class.
 *
 * @throws {RangeError} If the combination is not in NCERT Tables 4.6 to 4.8
 */
export function domainsFor(config: VseprConfig): Domain[] {
  const { bondPairs, lonePairs, squeeze } = config
  const ideal = vseprPositions(bondPairs, lonePairs)
  const lone = ideal.lonePairs.map(toV3)
  let bonds = ideal.bonds.map(toV3)
  const s = clamp01(squeeze)
  if (s > 0 && lone.length > 0 && supportsSqueeze(bondPairs, lonePairs)) {
    const reported = vseprClass(bondPairs, lonePairs).reportedAngle as number
    bonds = squeezeBonds(bonds, lone, reported, s)
  }
  return [
    ...bonds.map((dir) => ({ dir, kind: 'bond' as const })),
    ...lone.map((dir) => ({ dir, kind: 'lone' as const })),
  ]
}

/** Orthonormal right and up axes from two hints. `right` is kept; `up` is made perpendicular to it. */
export function basisFromHints(rightHint: readonly number[], upHint: readonly number[]): Basis {
  const right = norm(toV3(rightHint))
  let up = add(toV3(upHint), scale(right, -dot(upHint, right)))
  if (len(up) < 1e-9) up = cross(right, [0, 0, 1])
  if (len(up) < 1e-9) up = cross(right, [0, 1, 0])
  return { right, up: norm(up) }
}

/** Forward direction of a basis: the direction the view looks in, into the screen. */
export function forwardOf(basis: Basis): V3 {
  return cross(basis.up, basis.right)
}

/** A pose with every domain present at full length, and the given view. */
export function poseFromDomains(domains: readonly Domain[], rightHint: V3, upHint: V3): Pose {
  return {
    slots: domains.map((d) => ({ dir: d.dir, kind: d.kind, scale: 1 })),
    basis: basisFromHints(rightHint, upHint),
  }
}

/**
 * Assignment of target domains to slots: the permutation with the least total change, found by
 * exhaustive search (at most six domains). Ties keep the earlier slot order.
 */
function bestAssignment(current: readonly (Slot | null)[], target: readonly (Domain | null)[]): number[] {
  const n = Math.max(current.length, target.length)
  const cost = (i: number, j: number): number => {
    const a = current[i] ?? null
    const b = target[j] ?? null
    if (a && b) return 1 - dot(a.dir, b.dir) + (a.kind !== b.kind ? 0.5 : 0)
    if (!a && !b) return 0
    return 0.8
  }
  let best: number[] = Array.from({ length: n }, (_, i) => i)
  let bestCost = Infinity
  const used = new Array<boolean>(n).fill(false)
  const chosen: number[] = []

  const search = (i: number, acc: number) => {
    if (acc >= bestCost) return
    if (i === n) {
      bestCost = acc
      best = [...chosen]
      return
    }
    for (let j = 0; j < n; j++) {
      if (used[j]) continue
      used[j] = true
      chosen.push(j)
      search(i + 1, acc + cost(i, j))
      chosen.pop()
      used[j] = false
    }
  }
  search(0, 0)
  return best
}

/**
 * The pose that morphs `from` into the arrangement of `domains`. Slots are matched so that the
 * total change in direction is least, and bonds that are added or removed grow out of or retract
 * into the centre. The view moves to the one given by the hints.
 */
export function poseTo(from: Pose, domains: readonly Domain[], rightHint: V3, upHint: V3): Pose {
  const current: (Slot | null)[] = from.slots.map((s) => (s.kind === 'none' ? null : s))
  const perm = bestAssignment(current, domains)
  const slots: Slot[] = perm.map((j, i) => {
    const target = domains[j]
    if (target) return { dir: target.dir, kind: target.kind, scale: 1 }
    const here = current[i]
    return { dir: here ? here.dir : NONE_DIR, kind: 'none', scale: 0 }
  })
  return { slots, basis: basisFromHints(rightHint, upHint) }
}

/**
 * The tween point at which a slot changes kind. A new lone pair appears after the midpoint, a
 * departing lone pair goes before it, a new bond appears at once, and a departing bond stays
 * until it has retracted.
 */
export function switchPoint(from: SlotKind, to: SlotKind): number {
  if (from === to) return 0
  if (from === 'none') return to === 'lone' ? 0.5 : 0
  if (to === 'none') return from === 'lone' ? 0.5 : 1
  return 0.5
}

const EMPTY: Slot = { dir: NONE_DIR, kind: 'none', scale: 0 }

/** The pose at progress t (0 to 1) between two poses. Slots are interpolated by index. */
export function interpolatePose(a: Pose, b: Pose, tRaw: number): Pose {
  const t = clamp01(tRaw)
  const n = Math.max(a.slots.length, b.slots.length)
  const slots: Slot[] = []
  for (let i = 0; i < n; i++) {
    const sa = a.slots[i] ?? EMPTY
    const sb = b.slots[i] ?? EMPTY
    const dirA = sa.kind === 'none' ? sb.dir : sa.dir
    const dirB = sb.kind === 'none' ? sa.dir : sb.dir
    const dir = norm(lerpV(dirA, dirB, t))
    const kind = t < switchPoint(sa.kind, sb.kind) ? sa.kind : sb.kind
    slots.push({ dir, kind, scale: sa.scale + (sb.scale - sa.scale) * t })
  }
  const right = norm(lerpV(a.basis.right, b.basis.right, t))
  const upMix = lerpV(a.basis.up, b.basis.up, t)
  return {
    slots,
    basis: basisFromHints(right, upMix),
  }
}

/** The bond slots that are fully out: the bonds to draw as settled. */
export function settledBonds(pose: Pose): { index: number; dir: V3 }[] {
  return pose.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.kind === 'bond' && slot.scale > 0.999)
    .map(({ slot, index }) => ({ index, dir: slot.dir }))
}

/** Subscript digits in a formula, e.g. "H2O" becomes "H₂O". Other characters are kept. */
export function subscriptFormula(formula: string): string {
  const map: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
  return formula.replace(/[0-9]/g, (d) => map[d])
}

/** AXₙEₘ notation for a class, with subscripts, e.g. AX₂E₂. The E is dropped when there is no lone pair. */
export function axNotation(bondPairs: number, lonePairs: number): string {
  const sub = (n: number) => (n === 1 ? '' : subscriptFormula(String(n)))
  const x = `AX${sub(bondPairs)}`
  return lonePairs === 0 ? x : `${x}E${sub(lonePairs)}`
}

/** Which of the four Learner moves lead to an NCERT class from this config. */
export function availableMoves(config: Pick<VseprConfig, 'bondPairs' | 'lonePairs'>) {
  const { bondPairs: b, lonePairs: e } = config
  return {
    addBond: isNcertClass(b + 1, e),
    removeBond: isNcertClass(b - 1, e),
    addLonePair: isNcertClass(b, e + 1),
    removeLonePair: isNcertClass(b, e - 1),
  }
}
