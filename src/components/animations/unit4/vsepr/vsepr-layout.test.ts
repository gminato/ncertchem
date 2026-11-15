import { describe, expect, it } from 'vitest'
import { poseFromDomains, type Pose } from '@/lib/chem/vsepr-morph'
import { LONE_PAIR_PX, LONE_PAIR_STEPS, REPULSION_PX, REPULSION_STEPS, lonePairTarget } from './vsepr-steps'
import { PANEL_H, PANEL_W, arcLabelPosition, layoutPose, overlaps, pointSegmentDistance, type Layout } from './vsepr-layout'

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

  it('the widest Step fills at least 60% of the panel width', () => {
    const widths = REPULSION_STEPS.map((s) => {
      const l = drawn(poseFromDomains(s.target.domains, s.target.right, s.target.up), REPULSION_PX)
      // Atom discs count with their radii, as they do in the fitted scale.
      const xs = [l.centre.x - l.centre.r, l.centre.x + l.centre.r, ...l.ligands.flatMap((d) => [d.x - d.r, d.x + d.r])]
      return Math.max(...xs) - Math.min(...xs)
    })
    expect(Math.max(...widths)).toBeGreaterThanOrEqual(0.6 * PANEL_W)
  })

  it('every angle label sits inside the panel and clear of every bond', () => {
    // Only Steps that draw an arc have a label. Each entry carries the scale its Scrolly uses.
    const poses: [string, Pose, number][] = [
      ...REPULSION_STEPS.filter((s) => s.arcLabel !== null).map((s, i): [string, Pose, number] => [
        `repulsion arc ${i}`,
        poseFromDomains(s.target.domains, s.target.right, s.target.up),
        REPULSION_PX,
      ]),
      ...LONE_PAIR_STEPS.map((_, i): [string, Pose, number] => {
        const t = lonePairTarget(i)
        return [`lone pair ${i}`, poseFromDomains(t.domains, t.right, t.up), LONE_PAIR_PX]
      }),
    ]
    for (const [name, pose, px] of poses) {
      const at = arcLabelPosition(pose, px)
      expect(at, name).not.toBeNull()
      if (!at) continue
      expect(at.x, name).toBeGreaterThan(0)
      expect(at.x, name).toBeLessThan(PANEL_W)
      expect(at.y, name).toBeGreaterThan(0)
      expect(at.y, name).toBeLessThan(PANEL_H - 60)
      const l = drawn(pose, px)
      for (const d of l.ligands) {
        const gap = pointSegmentDistance(at.x, at.y, l.centre.x, l.centre.y, d.x, d.y)
        expect(gap, `${name} label to bond`).toBeGreaterThan(18)
      }
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
