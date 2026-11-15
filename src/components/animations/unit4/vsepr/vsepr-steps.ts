/**
 * The arrangement each Step of the two VSEPR Scrolly Animations shows. Every Step is a fixed
 * target (no randomness), so the pictures are the same on every visit and in every screenshot.
 */

import { vseprClass, vseprPositions, type Vec3 } from '@/lib/chem/vsepr'
import {
  axNotation,
  bondAngleDeg,
  domainsFor,
  subscriptFormula,
  type Domain,
  type V3,
  type VseprConfig,
} from '@/lib/chem/vsepr-morph'
import type { PoseTarget } from './usePoseTween'

const norm = (v: readonly number[]): V3 => {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}

const toV3 = (v: Vec3): V3 => [v[0], v[1], v[2]]

/** Formats an angle for a label: 120 becomes "120°", 109.5 becomes "109.5°". */
export function formatAngle(deg: number): string {
  return `${Number(deg.toFixed(1))}°`
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

function idealTarget(bondPairs: number, right: V3, up: V3): PoseTarget {
  const bonds = vseprPositions(bondPairs, 0).bonds.map(toV3)
  return { domains: bonds.map((dir) => ({ dir, kind: 'bond' as const })), right, up }
}

function shapeCaption(bondPairs: number): string {
  const cls = vseprClass(bondPairs, 0)
  return `${axNotation(bondPairs, 0)} · ${cls.electronGeometry.toLowerCase()} · ${cls.idealAngles.map(formatAngle).join(' and ')}`
}

/**
 * Five Steps: four pairs bunched, then the five base arrangements of Table 4.6. Each view is
 * chosen so the arrangement reads clearly in 2D.
 */
export const REPULSION_STEPS: RepulsionStep[] = [
  {
    target: { domains: BUNCHED.map((dir): Domain => ({ dir, kind: 'bond' })), right: [1, 0, 0], up: [0, 1, 0] },
    centre: 'C',
    caption: 'Four pairs, bunched together',
    arcLabel: null,
  },
  {
    target: idealTarget(4, [1, 0, 0], [0, 1, 0]),
    centre: 'C',
    caption: shapeCaption(4),
    arcLabel: formatAngle(109.5),
  },
  {
    target: idealTarget(2, [0, 0, 1], [0, 1, 0]),
    centre: 'Be',
    caption: shapeCaption(2),
    arcLabel: null,
  },
  {
    target: idealTarget(3, [1, 0, 0], [0, 1, 0]),
    centre: 'B',
    caption: shapeCaption(3),
    arcLabel: formatAngle(120),
  },
  {
    target: idealTarget(5, [0.966, 0.259, 0], [0, 0, 1]),
    centre: 'P',
    caption: shapeCaption(5),
    arcLabel: null,
  },
  {
    target: idealTarget(6, [1, 0.4, 0.25], [-0.35, 1, 0.3]),
    centre: 'S',
    caption: shapeCaption(6),
    arcLabel: null,
  },
]

export function repulsionStep(step: number): RepulsionStep {
  const index = Math.min(REPULSION_STEPS.length - 1, Math.max(0, Math.round(step)))
  return REPULSION_STEPS[index]
}

// ---------------------------------------------------------------------------
// Scrolly 2: lone pairs take positions and squeeze the bond angle
// ---------------------------------------------------------------------------

export interface LonePairStep {
  config: VseprConfig
  centre: string
  molecule: string
}

export const LONE_PAIR_STEPS: LonePairStep[] = [
  { config: { bondPairs: 4, lonePairs: 0, squeeze: 0 }, centre: 'C', molecule: 'CH₄' },
  { config: { bondPairs: 3, lonePairs: 1, squeeze: 0 }, centre: 'N', molecule: 'NH₃' },
  { config: { bondPairs: 3, lonePairs: 1, squeeze: 1 }, centre: 'N', molecule: 'NH₃' },
  { config: { bondPairs: 2, lonePairs: 2, squeeze: 1 }, centre: 'O', molecule: 'H₂O' },
]

/**
 * The view for a lone-pair Step. The first two bonds lie in the picture plane, so the bond angle
 * between them is seen at its true size.
 */
export function lonePairTarget(step: number): PoseTarget {
  const index = Math.min(LONE_PAIR_STEPS.length - 1, Math.max(0, Math.round(step)))
  const { config } = LONE_PAIR_STEPS[index]
  const domains = domainsFor(config)
  const bonds = domains.filter((d) => d.kind === 'bond')
  return { domains, right: bonds[0].dir, up: bonds[1].dir }
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
