/**
 * The arrangement each Step of the two VSEPR Scrolly Animations shows, and the oblique view it is
 * drawn from. Every Step is a fixed target (no randomness), so the pictures are the same on every
 * visit and in every screenshot.
 */

import { vseprClass, vseprPositions, type Vec3 } from '@/lib/chem/vsepr'
import {
  axNotation,
  bondAngleDeg,
  domainsFor,
  poseFromDomains,
  subscriptFormula,
  type Domain,
  type V3,
  type VseprConfig,
} from '@/lib/chem/vsepr-morph'
import type { PoseTarget } from './usePoseTween'
import { fitScale, viewHints } from './vsepr-layout'

const norm = (v: readonly number[]): V3 => {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}

const toV3 = (v: Vec3): V3 => [v[0], v[1], v[2]]
const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** Formats an angle for a label: 120 becomes "120°", 109.5 becomes "109.5°". */
export function formatAngle(deg: number): string {
  return `${Number(deg.toFixed(1))}°`
}

/** The target for a set of domains seen from camera position `view`. */
function targetFor(domains: Domain[], view: V3): PoseTarget {
  const hints = viewHints(view)
  return { domains, right: hints.right, up: hints.up }
}

// ---------------------------------------------------------------------------
// Scrolly 1: electron pairs repel to the maximum separation
// ---------------------------------------------------------------------------

export interface RepulsionStep {
  target: PoseTarget
  /** Element of the central atom drawn in this Step. */
  centre: string
  caption: string
  arcLabel: string | null
}

/** Four pairs bunched on one side, before they spread out. An illustration of repulsion, not an NCERT arrangement. */
const BUNCHED: V3[] = [
  norm([0.35, 0.25, 0.9]),
  norm([-0.3, 0.3, 0.9]),
  norm([0.05, -0.35, 0.93]),
  norm([-0.1, -0.05, 1]),
]

function idealDomains(bondPairs: number): Domain[] {
  return vseprPositions(bondPairs, 0).bonds.map((d) => ({ dir: toV3(d), kind: 'bond' as const }))
}

function shapeCaption(bondPairs: number): string {
  const cls = vseprClass(bondPairs, 0)
  return `${axNotation(bondPairs, 0)} · ${cls.electronGeometry.toLowerCase()} · ${cls.idealAngles.map(formatAngle).join(' and ')}`
}

/**
 * The oblique view for a set of domains: the camera direction that keeps the drawn parts furthest
 * apart. It scores each view by its smallest projected separation (every domain tip from the
 * centre, and every pair of tips from each other), so no bond foreshortens onto the atom or onto
 * another bond. Deterministic: the grid is fixed and the first best view wins ties.
 */
/** Views this close to a coordinate axis are not used (cos 20°): on an axis, the shapes read flat. */
const AXIS_LIMIT = Math.cos((20 * Math.PI) / 180)

export function bestView(domains: readonly Domain[]): V3 {
  let best: V3 = [1, 0.5, 0.8]
  let bestScore = -Infinity
  for (let i = 1; i < 48; i++) {
    const theta = (i / 48) * Math.PI
    if (theta < 0.25 || theta > Math.PI - 0.25) continue
    for (let j = 0; j < 36; j++) {
      const phi = (j / 36) * 2 * Math.PI
      const view: V3 = [Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi)]
      // Looking down a coordinate axis stacks the pairs into an X or a cross, so such views are skipped.
      if (Math.max(Math.abs(view[0]), Math.abs(view[1]), Math.abs(view[2])) > AXIS_LIMIT) continue
      const { right, up } = viewHints(view)
      const pts = domains.map((d) => [dot(d.dir, right), dot(d.dir, up)] as const)
      let score = Infinity
      for (const [x, y] of pts) score = Math.min(score, Math.hypot(x, y))
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) {
          score = Math.min(score, Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]))
        }
      }
      if (score > bestScore + 1e-9) {
        bestScore = score
        best = view
      }
    }
  }
  return best
}

/**
 * Six Steps: four pairs bunched, then the tetrahedral, linear, trigonal planar, trigonal
 * bipyramidal and octahedral arrangements of Table 4.6.
 */
export const REPULSION_STEPS: RepulsionStep[] = [
  {
    target: targetFor(BUNCHED.map((dir): Domain => ({ dir, kind: 'bond' })), bestView(BUNCHED.map((dir): Domain => ({ dir, kind: 'bond' })))),
    centre: 'C',
    caption: 'Four pairs, bunched together',
    arcLabel: null,
  },
  {
    target: targetFor(idealDomains(4), bestView(idealDomains(4))),
    centre: 'C',
    caption: shapeCaption(4),
    arcLabel: formatAngle(109.5),
  },
  {
    target: targetFor(idealDomains(2), bestView(idealDomains(2))),
    centre: 'Be',
    caption: shapeCaption(2),
    arcLabel: null,
  },
  {
    target: targetFor(idealDomains(3), bestView(idealDomains(3))),
    centre: 'B',
    caption: shapeCaption(3),
    arcLabel: formatAngle(120),
  },
  {
    target: targetFor(idealDomains(5), bestView(idealDomains(5))),
    centre: 'P',
    caption: shapeCaption(5),
    arcLabel: null,
  },
  {
    target: targetFor(idealDomains(6), bestView(idealDomains(6))),
    centre: 'S',
    caption: shapeCaption(6),
    arcLabel: null,
  },
]

export function repulsionStep(step: number): RepulsionStep {
  const index = Math.min(REPULSION_STEPS.length - 1, Math.max(0, Math.round(step)))
  return REPULSION_STEPS[index]
}

/** One bond length in px, the same for every repulsion Step. */
export const REPULSION_PX = fitScale(
  REPULSION_STEPS.map((s) => poseFromDomains(s.target.domains, s.target.right, s.target.up))
)

// ---------------------------------------------------------------------------
// Scrolly 2: lone pairs take positions and squeeze the bond angle
// ---------------------------------------------------------------------------

export interface LonePairStep {
  config: VseprConfig
  centre: string
  molecule: string
  ligand: string
  /** Camera position: an oblique view that keeps every domain apart. */
  view: V3
}

export const LONE_PAIR_STEPS: LonePairStep[] = [
  { config: { bondPairs: 4, lonePairs: 0, squeeze: 0 }, centre: 'C', molecule: 'CH₄', ligand: 'H', view: bestView(domainsFor({ bondPairs: 4, lonePairs: 0, squeeze: 0 })) },
  { config: { bondPairs: 3, lonePairs: 1, squeeze: 0 }, centre: 'N', molecule: 'NH₃', ligand: 'H', view: bestView(domainsFor({ bondPairs: 3, lonePairs: 1, squeeze: 0 })) },
  { config: { bondPairs: 3, lonePairs: 1, squeeze: 1 }, centre: 'N', molecule: 'NH₃', ligand: 'H', view: bestView(domainsFor({ bondPairs: 3, lonePairs: 1, squeeze: 1 })) },
  { config: { bondPairs: 2, lonePairs: 2, squeeze: 1 }, centre: 'O', molecule: 'H₂O', ligand: 'H', view: bestView(domainsFor({ bondPairs: 2, lonePairs: 2, squeeze: 1 })) },
]

/** The target for a lone-pair Step. The view is the one the Step names. */
export function lonePairTarget(step: number): PoseTarget {
  const index = Math.min(LONE_PAIR_STEPS.length - 1, Math.max(0, Math.round(step)))
  const item = LONE_PAIR_STEPS[index]
  return targetFor(domainsFor(item.config), item.view)
}

export function lonePairStep(step: number): LonePairStep & { caption: string; arcLabel: string } {
  const index = Math.min(LONE_PAIR_STEPS.length - 1, Math.max(0, Math.round(step)))
  const item = LONE_PAIR_STEPS[index]
  const angle = formatAngle(bondAngleDeg(item.config))
  const notation = axNotation(item.config.bondPairs, item.config.lonePairs)
  return {
    ...item,
    arcLabel: angle,
    caption: `${subscriptFormula(item.molecule)} · ${notation} · ${angle}`,
  }
}

/** One bond length in px, the same for every lone-pair Step. */
export const LONE_PAIR_PX = fitScale(
  LONE_PAIR_STEPS.map((s) => {
    const t = targetFor(domainsFor(s.config), s.view)
    return poseFromDomains(t.domains, t.right, t.up)
  })
)
