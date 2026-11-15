import { describe, expect, it } from 'vitest'
import { poseFromDomains, type Pose } from '@/lib/chem/vsepr-morph'
import { LONE_PAIR_PX, LONE_PAIR_STEPS, REPULSION_PX, REPULSION_STEPS, lonePairTarget } from './vsepr-steps'
import { PANEL_W, layoutPose, overlaps, type Layout } from './vsepr-layout'

const drawn = (pose: Pose, px: number): Layout => layoutPose(pose, px)

describe('Scrolly projections', () => {
  it('no two drawn parts overlap, for every repulsion Step at the fitted scale', () => {
    for (const step of REPULSION_STEPS) {
      const pose = poseFromDomains(step.target.domains, step.target.right, step.target.up)
      expect(overlaps(drawn(pose, REPULSION_PX)), step.caption).toEqual([])
    }
  })

  it('no two drawn parts overlap, for every lone-pair Step at the fitted scale', () => {
    for (let i = 0; i < LONE_PAIR_STEPS.length; i++) {
      const t = lonePairTarget(i)
      const pose = poseFromDomains(t.domains, t.right, t.up)
      expect(overlaps(drawn(pose, LONE_PAIR_PX)), `step ${i}`).toEqual([])
    }
  })

  it('every Step fills at most about 65% of the panel width', () => {
    const poses: Pose[] = [
      ...REPULSION_STEPS.map((s) => poseFromDomains(s.target.domains, s.target.right, s.target.up)),
    ]
    for (const pose of poses) {
      const l = drawn(pose, REPULSION_PX)
      const xs = [l.centre.x, ...l.ligands.map((d) => d.x), ...l.lobes.flatMap((b) => [b.x0, b.x1])]
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(0.66 * PANEL_W)
    }
  })

  it('the overlap test reports a pair of bonds squashed onto one spot', () => {
    const pose: Pose = {
      slots: [
        { dir: [1, 0, 0], kind: 'bond', scale: 1 },
        { dir: [1, 0.01, 0], kind: 'bond', scale: 1 },
      ],
      basis: { right: [1, 0, 0], up: [0, 1, 0] },
    }
    expect(overlaps(drawn(pose, 200)).length).toBeGreaterThan(0)
  })
})
