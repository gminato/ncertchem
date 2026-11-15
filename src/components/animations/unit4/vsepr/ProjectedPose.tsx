'use client'

import { Atom, Label, VocabDefs } from '@/components/vocab'
import { settledBonds, type Pose, type V3 } from '@/lib/chem/vsepr-morph'
import { ARC_R, PANEL_H, PANEL_W, arcLabelPosition, layoutPose, projector, type Disc, type Lobe } from './vsepr-layout'

const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

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
    out.push([(u[0] * a + v[0] * b) * ARC_R, (u[1] * a + v[1] * b) * ARC_R, (u[2] * a + v[2] * b) * ARC_R])
  }
  return out
}

/** SVG path for a lone-pair teardrop: narrow at the atom, rounder towards its tip. */
export function lobePath(lobe: Lobe): string {
  const { x0, y0, x1, y1, halfWidth: w } = lobe
  const dx = x1 - x0
  const dy = y1 - y0
  const len = Math.hypot(dx, dy) || 1
  const ax = dx / len
  const ay = dy / len
  // Unit normal to the lobe axis.
  const nx = -ay
  const ny = ax
  const bulge = 0.55 * len
  const f = (v: number) => v.toFixed(2)
  // Out along one side to the tip, back along the other.
  const p1 = [x0 + nx * w * 0.35, y0 + ny * w * 0.35]
  const c1 = [x0 + ax * bulge + nx * w * 1.5, y0 + ay * bulge + ny * w * 1.5]
  const c2 = [x1 - ax * 0.05 * len + nx * w, y1 - ay * 0.05 * len + ny * w]
  const c3 = [x1 - ax * 0.05 * len - nx * w, y1 - ay * 0.05 * len - ny * w]
  const c4 = [x0 + ax * bulge - nx * w * 1.5, y0 + ay * bulge - ny * w * 1.5]
  const p2 = [x0 - nx * w * 0.35, y0 - ny * w * 0.35]
  return `M${f(p1[0])},${f(p1[1])} C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(x1)},${f(y1)} C${f(c3[0])},${f(c3[1])} ${f(c4[0])},${f(c4[1])} ${f(p2[0])},${f(p2[1])} Z`
}

export interface ProjectedPoseProps {
  pose: Pose
  /** Pixels per bond length, from the fitted scale of the whole Scrolly, so Steps keep one size. */
  px: number
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
 * A pose drawn in 2D from an oblique view: bonds as sticks, lone pairs as translucent teardrops
 * from the centre, atoms sorted by depth. Back atoms and bonds are smaller and paler. Deterministic
 * for a given pose, so the screenshots are stable.
 */
export function ProjectedPose({ pose, px, centre, ligand, arcLabel, label, caption, testId, step, defsPrefix }: ProjectedPoseProps) {
  const layout = layoutPose(pose, px)
  const project = projector(pose, px)

  const arc = arcLabel ? settledBonds(pose).slice(0, 2) : []
  const arcPath =
    arc.length === 2
      ? arcPoints(arc[0].dir, arc[1].dir)
          .map((q, k) => {
            const p = project(q)
            return `${k === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`
          })
          .join(' ')
      : null
  const arcLabelAt = arcLabel ? arcLabelPosition(pose, px) : null

  // Atoms, back to front. Farther discs are drawn first; the centre is always the last one drawn at its depth.
  const atoms: { key: string; d: Disc; element: string }[] = [
    { key: 'centre', d: layout.centre, element: centre },
    ...layout.ligands.map((d, i) => ({ key: `ligand-${i}`, d, element: ligand })),
  ]
  atoms.sort((a, b) => b.d.farness - a.d.farness)

  // Bond sticks from the centre to each ligand. Back bonds are thinner.
  const bondEnds = layout.ligands.map((d, i) => ({ d, width: 5 - 2.4 * layout.bondFarness[i] }))

  return (
    <svg
      viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
      role="img"
      aria-label={label}
      data-testid={testId}
      data-step={step}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <VocabDefs idPrefix={defsPrefix} />

      {bondEnds.map(({ d, width }, i) => (
        <line
          key={`stick-${i}`}
          x1={layout.centre.x}
          y1={layout.centre.y}
          x2={d.x}
          y2={d.y}
          strokeWidth={width}
          strokeLinecap="round"
          opacity={d.shade}
          style={{ stroke: 'var(--bond)' }}
        />
      ))}

      {layout.lobes.map((lobe, i) => (
        <path
          key={`lobe-${i}`}
          d={lobePath(lobe)}
          opacity={lobe.shade}
          style={{ fill: 'var(--lone-pair)', fillOpacity: 0.28, stroke: 'var(--lone-pair)', strokeOpacity: 0.5, strokeWidth: 1 }}
        />
      ))}

      {arcPath && (
        <path d={arcPath} fill="none" strokeWidth={1.4} style={{ stroke: 'var(--fg-muted)' }} data-testid="vsepr-arc" />
      )}

      {atoms.map(({ key, d, element }) => (
        <g key={key} opacity={d.shade}>
          <Atom element={element} x={d.x} y={d.y} r={d.r} defsPrefix={defsPrefix} />
        </g>
      ))}

      {arcLabel && arcLabelAt && (
        <Label x={arcLabelAt.x} y={arcLabelAt.y} fontSize={16} halo fill="var(--fg)">
          {arcLabel}
        </Label>
      )}

      <Label x={PANEL_W / 2} y={PANEL_H - 22} fontSize={16} fill="var(--fg-muted)">
        {caption}
      </Label>
    </svg>
  )
}
