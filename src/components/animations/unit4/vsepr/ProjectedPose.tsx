'use client'

import { Atom, Label, VocabDefs } from '@/components/vocab'
import { forwardOf, settledBonds, type Pose, type V3 } from '@/lib/chem/vsepr-morph'

/** SVG units per bond length. The bond is the unit of the drawing. */
const PX = 118
const VIEW_W = 560
const VIEW_H = 350
const CX = VIEW_W / 2
const CY = 160
/** Lone-pair lobes sit this far out along their direction, in bond lengths. */
const LOBE_CENTRE = 0.62
const LOBE_RADIUS = 0.24
const LIGAND_R = 13
const CENTRE_R = 20
const ARC_R = 0.42

interface Projected {
  x: number
  y: number
  depth: number
}

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

function project(p: V3, pose: Pose): Projected {
  const { right, up } = pose.basis
  const forward = forwardOf(pose.basis)
  return {
    x: CX + dot(p, right) * PX,
    y: CY - dot(p, up) * PX,
    depth: dot(p, forward),
  }
}

/** Points on the arc from u to v (unit vectors) at radius ARC_R, sampled for the drawing. */
function arcPoints(u: V3, v: V3, segments = 28): V3[] {
  const cos = Math.max(-1, Math.min(1, dot(u, v)))
  const theta = Math.acos(cos)
  const sin = Math.sin(theta)
  const out: V3[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const a = sin > 1e-9 ? Math.sin((1 - t) * theta) / sin : 1 - t
    const b = sin > 1e-9 ? Math.sin(t * theta) / sin : t
    out.push([
      (u[0] * a + v[0] * b) * ARC_R,
      (u[1] * a + v[1] * b) * ARC_R,
      (u[2] * a + v[2] * b) * ARC_R,
    ])
  }
  return out
}

export interface ProjectedPoseProps {
  pose: Pose
  /** Element of the central atom, e.g. "C", "N" or "O". */
  centre: string
  /** Element of the bonded atoms. */
  ligand: string
  /** Label of the angle drawn between the first two bonds, e.g. "109.5°". Null for no arc. */
  arcLabel: string | null
  /** Accessible description of the drawing. */
  label: string
  /** A short caption under the drawing, e.g. "NH₃ · AX₃E · 107°". */
  caption: string
  testId: string
  step: number
  defsPrefix: string
}

/**
 * A pose drawn in 2D: bonds as sticks, lone pairs as soft lobes, atoms shaded and sorted by depth,
 * with an optional angle arc. Deterministic for a given pose, so the screenshots are stable.
 */
export function ProjectedPose({ pose, centre, ligand, arcLabel, label, caption, testId, step, defsPrefix }: ProjectedPoseProps) {
  const origin = project([0, 0, 0], pose)
  const bonds = pose.slots
    .map((slot, index) => ({ slot, index }))
    .filter(({ slot }) => slot.kind === 'bond' && slot.scale > 0.001)
  const lobes = pose.slots.filter((slot) => slot.kind === 'lone')

  type Item =
    | { kind: 'atom'; key: string; p: Projected; r: number; element: string }
    | { kind: 'lobe'; key: string; p: Projected; r: number }
  const items: Item[] = [
    { kind: 'atom', key: 'centre', p: origin, r: CENTRE_R, element: centre },
    ...bonds.map(({ slot, index }) => ({
      kind: 'atom' as const,
      key: `ligand-${index}`,
      p: project(
        [slot.dir[0] * slot.scale, slot.dir[1] * slot.scale, slot.dir[2] * slot.scale],
        pose
      ),
      r: LIGAND_R,
      element: ligand,
    })),
    ...lobes.map((slot, index) => ({
      kind: 'lobe' as const,
      key: `lobe-${index}`,
      p: project(
        [slot.dir[0] * LOBE_CENTRE, slot.dir[1] * LOBE_CENTRE, slot.dir[2] * LOBE_CENTRE],
        pose
      ),
      r: LOBE_RADIUS * PX,
    })),
  ]
  items.sort((a, b) => b.p.depth - a.p.depth)

  const arc = arcLabel ? settledBonds(pose).slice(0, 2) : []
  const arcPath =
    arc.length === 2
      ? arcPoints(arc[0].dir, arc[1].dir)
          .map((q, k) => {
            const p = project(q, pose)
            return `${k === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
          })
          .join(' ')
      : null
  const arcLabelAt = (() => {
    if (arc.length !== 2) return null
    const u = arc[0].dir
    const v = arc[1].dir
    const bis: V3 = [u[0] + v[0], u[1] + v[1], u[2] + v[2]]
    const l = Math.hypot(...bis)
    if (l < 1e-9) return null
    const q: V3 = [(bis[0] / l) * (ARC_R + 0.36), (bis[1] / l) * (ARC_R + 0.36), (bis[2] / l) * (ARC_R + 0.36)]
    return project(q, pose)
  })()

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={label}
      data-testid={testId}
      data-step={step}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <VocabDefs idPrefix={defsPrefix} />

      {bonds.map(({ slot, index }) => {
        const end = project(
          [slot.dir[0] * slot.scale, slot.dir[1] * slot.scale, slot.dir[2] * slot.scale],
          pose
        )
        return (
          <line
            key={`stick-${index}`}
            x1={origin.x}
            y1={origin.y}
            x2={end.x}
            y2={end.y}
            strokeWidth={5}
            strokeLinecap="round"
            style={{ stroke: 'var(--bond)' }}
          />
        )
      })}

      {arcPath && (
        <path d={arcPath} fill="none" strokeWidth={1.4} style={{ stroke: 'var(--fg-muted)' }} data-testid="vsepr-arc" />
      )}

      {items.map((item) => {
        if (item.kind === 'lobe') {
          return (
            <circle
              key={item.key}
              cx={item.p.x}
              cy={item.p.y}
              r={item.r}
              strokeWidth={1}
              style={{ fill: 'var(--lone-pair)', fillOpacity: 0.26, stroke: 'var(--lone-pair)', strokeOpacity: 0.55 }}
            />
          )
        }
        return <Atom key={item.key} element={item.element} x={item.p.x} y={item.p.y} r={item.r} defsPrefix={defsPrefix} />
      })}

      {arcLabel && arcLabelAt && (
        <Label x={arcLabelAt.x} y={arcLabelAt.y} fontSize={16} halo fill="var(--fg)">
          {arcLabel}
        </Label>
      )}

      <Label x={CX} y={VIEW_H - 22} fontSize={16} fill="var(--fg-muted)">
        {caption}
      </Label>
    </svg>
  )
}
