'use client'

import {
  OCTA_EDGES,
  OCTA_MIRROR_DIAG03_VERTS,
  OCTA_MIRROR_YZ_VERTS,
  OCTA_VERTS,
  SQ_CORNERS,
  TETRA_EDGES,
  TETRA_MIRROR_PLANE_VERTS,
  TETRA_VERTS,
  chelateArcPath,
  mirrorX,
  project3D,
  type Point2,
  type Vec3,
} from './complex-geometry'

export interface LigandStyle {
  readonly label: string
  readonly fill: string
  readonly textFill?: string
}

export const TONE = {
  metal: 'var(--db-4d)',
  metalText: 'var(--surface)',
  x: 'var(--el-Cl)',
  l: 'var(--el-N)',
  a: 'var(--accent)',
  b: 'var(--orbital-pos)',
  en: 'var(--db-ln)',
  enMismatch: 'var(--spec-red)',
  red: 'var(--el-O)',
  yellow: 'var(--ox)',
  violet: 'var(--spec-violet)',
  greyGreen: 'var(--work)',
  bond: 'var(--bond)',
  guide: 'var(--border)',
  fg: 'var(--fg)',
  muted: 'var(--fg-muted)',
  surface: 'var(--surface)',
  raised: 'var(--surface-raised)',
  accent: 'var(--accent)',
  success: 'var(--success)',
  caution: 'var(--caution)',
} as const

export interface SquarePlanarProps {
  cx: number
  cy: number
  radius?: number
  metal?: string
  /** [top-left, top-right, bottom-right, bottom-left] */
  ligands: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle]
  /** Optional dashed angle highlight between two corner indices (0..3). */
  highlightPair?: readonly [number, number]
  angleLabel?: string
  showMirrorPlane?: boolean
  fontSize?: number
}

export function SquarePlanarComplex({
  cx,
  cy,
  radius = 56,
  metal = 'M',
  ligands,
  highlightPair,
  angleLabel,
  showMirrorPlane = false,
  fontSize = 16,
}: SquarePlanarProps) {
  const pts = SQ_CORNERS.map((c) => ({
    x: cx + c.dx * radius,
    y: cy + c.dy * radius,
  }))
  const ligandR = Math.max(16, radius * 0.31)
  const metalR = Math.max(18, radius * 0.35)

  return (
    <g>
      {showMirrorPlane && (
        <rect
          x={cx - radius - ligandR - 6}
          y={cy - radius - ligandR - 6}
          width={(radius + ligandR + 6) * 2}
          height={(radius + ligandR + 6) * 2}
          rx={10}
          fill={TONE.accent}
          fillOpacity={0.07}
          stroke={TONE.accent}
          strokeWidth={1.6}
          strokeDasharray="6 4"
        />
      )}

      {/* Faint square outline */}
      <polygon
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={TONE.guide}
        strokeWidth={1.2}
      />

      {/* Bonds */}
      {pts.map((p, i) => (
        <line
          key={`b-${i}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke={TONE.bond}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      ))}

      {/* Optional cis/trans dashed guide */}
      {highlightPair && (
        <g>
          <line
            x1={pts[highlightPair[0]].x}
            y1={pts[highlightPair[0]].y}
            x2={pts[highlightPair[1]].x}
            y2={pts[highlightPair[1]].y}
            stroke={TONE.x}
            strokeWidth={2.2}
            strokeDasharray="5 4"
          />
          {angleLabel && (
            <text
              x={(pts[highlightPair[0]].x + pts[highlightPair[1]].x) / 2}
              y={pts[0].y - ligandR - 6}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight={600}
              fill={TONE.fg}
            >
              {angleLabel}
            </text>
          )}
        </g>
      )}

      {/* Metal centre */}
      <circle cx={cx} cy={cy} r={metalR} fill={TONE.surface} stroke={TONE.metal} strokeWidth={2.6} />
      <text x={cx} y={cy + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill={TONE.fg}>
        {metal}
      </text>

      {/* Ligands */}
      {pts.map((p, i) => {
        const lig = ligands[i]
        return (
          <g key={`l-${i}`}>
            <circle cx={p.x} cy={p.y} r={ligandR} fill={lig.fill} stroke={TONE.surface} strokeWidth={2} />
            <text
              x={p.x}
              y={p.y + fontSize * 0.35}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight={700}
              fill={lig.textFill ?? 'var(--accent-fg)'}
            >
              {lig.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export interface TetrahedralProps {
  cx: number
  cy: number
  radius?: number
  metal?: string
  ligands: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle]
  yawDeg?: number
  pitchDeg?: number
  showAllEdges?: boolean
  showMirrorPlane?: boolean
  fontSize?: number
}

export function TetrahedralComplex({
  cx,
  cy,
  radius = 74,
  metal = 'M',
  ligands,
  yawDeg = 20,
  pitchDeg = 14,
  showAllEdges = false,
  showMirrorPlane = false,
  fontSize = 16,
}: TetrahedralProps) {
  const pts: Point2[] = TETRA_VERTS.map((v) => project3D(v, cx, cy, radius, yawDeg, pitchDeg))
  const ligandR = Math.max(16, radius * 0.24)
  const metalR = Math.max(18, radius * 0.27)

  const items: Array<{ kind: 'metal' | 'ligand'; idx: number; z: number }> = [
    { kind: 'metal' as const, idx: -1, z: 0 },
    ...pts.map((p, idx) => ({ kind: 'ligand' as const, idx, z: p.z })),
  ].sort((a, b) => a.z - b.z)

  return (
    <g>
      {showAllEdges &&
        TETRA_EDGES.map(([i, j], k) => (
          <line
            key={`te-${k}`}
            x1={pts[i].x}
            y1={pts[i].y}
            x2={pts[j].x}
            y2={pts[j].y}
            stroke={TONE.accent}
            strokeWidth={1.6}
            strokeDasharray="4 4"
            opacity={0.7}
          />
        ))}

      {showMirrorPlane && (
        <polygon
          points={TETRA_MIRROR_PLANE_VERTS.map((v) => {
            const p = project3D(v, cx, cy, radius, yawDeg, pitchDeg)
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`
          }).join(' ')}
          fill={TONE.accent}
          fillOpacity={0.12}
          stroke={TONE.accent}
          strokeWidth={1.8}
          strokeDasharray="6 4"
        />
      )}

      {/* Bonds behind metal */}
      {pts.map((p, i) =>
        p.z < 0 ? (
          <line
            key={`bb-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={TONE.bond}
            strokeWidth={2.2}
            strokeDasharray="5 3"
            opacity={0.75}
          />
        ) : null,
      )}

      {/* Depth-sorted metal + ligands */}
      {items.map((item) => {
        if (item.kind === 'metal') {
          return (
            <g key="metal">
              {/* Front bonds drawn underneath metal circle so lines never cross the metal label */}
              {pts.map((p, i) =>
                p.z >= 0 ? (
                  <line
                    key={`bf-${i}`}
                    x1={cx}
                    y1={cy}
                    x2={p.x}
                    y2={p.y}
                    stroke={TONE.bond}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                ) : null,
              )}
              <circle cx={cx} cy={cy} r={metalR} fill={TONE.surface} stroke={TONE.metal} strokeWidth={2.6} />
              <text x={cx} y={cy + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill={TONE.fg}>
                {metal}
              </text>
            </g>
          )
        }
        const p = pts[item.idx]
        const lig = ligands[item.idx]
        return (
          <g key={`tl-${item.idx}`}>
            <circle cx={p.x} cy={p.y} r={ligandR} fill={lig.fill} stroke={TONE.surface} strokeWidth={2} />
            <text
              x={p.x}
              y={p.y + fontSize * 0.35}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight={700}
              fill={lig.textFill ?? 'var(--accent-fg)'}
            >
              {lig.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export interface ChelateArcSpec {
  readonly from: number
  readonly to: number
  readonly label?: string
  readonly tone?: string
  readonly highlight?: boolean
}

export interface OctahedralProps {
  cx: number
  cy: number
  radius?: number
  metal?: string
  /** 6 vertices: [0:top, 1:bottom, 2:front-left, 3:front-right, 4:back-right, 5:back-left] */
  ligands: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle]
  chelates?: readonly ChelateArcSpec[]
  /** Mirror across the YZ plane (for drawing exact enantiomer mirror images). */
  mirrored?: boolean
  yawDeg?: number
  pitchDeg?: number
  /** Shaded triangular face (indices of 3 vertices, e.g. [0, 2, 3] for fac). */
  shadedFace?: readonly [number, number, number]
  /** Highlighted meridian circle through 3 vertices (e.g. [0, 3, 1] for mer). */
  meridianTriple?: readonly [number, number, number]
  /** Show an internal dashed symmetry mirror plane projected from 3D coordinates. */
  showMirrorPlane?: boolean
  /** Which internal 3D mirror plane to show when showMirrorPlane is true ('yz' through M+0+1, or 'diag-03' through M+0+1+3+5). */
  mirrorPlane?: 'yz' | 'diag-03'
  /** Highlight angle guide between two vertices. */
  highlightPair?: readonly [number, number]
  opacity?: number
  fontSize?: number
}

export function OctahedralComplex({
  cx,
  cy,
  radius = 68,
  metal = 'M',
  ligands,
  chelates = [],
  mirrored = false,
  yawDeg = 22,
  pitchDeg = 16,
  shadedFace,
  meridianTriple,
  showMirrorPlane = false,
  mirrorPlane = 'yz',
  highlightPair,
  opacity = 1,
  fontSize = 15,
}: OctahedralProps) {
  const verts: Vec3[] = mirrored ? OCTA_VERTS.map(mirrorX) : [...OCTA_VERTS]
  const pts: Point2[] = verts.map((v) => project3D(v, cx, cy, radius, yawDeg, pitchDeg))
  const ligandR = Math.max(13, radius * 0.22)
  const metalR = Math.max(16, radius * 0.25)

  const mirrorPlaneVerts = mirrorPlane === 'diag-03' ? OCTA_MIRROR_DIAG03_VERTS : OCTA_MIRROR_YZ_VERTS
  const projectedMirrorVerts = showMirrorPlane
    ? mirrorPlaneVerts.map((v) => project3D(mirrored ? mirrorX(v) : v, cx, cy, radius, yawDeg, pitchDeg))
    : []

  const computedChelates = chelates.map((ch) => ({
    ch,
    arc: chelateArcPath(pts[ch.from], pts[ch.to], cx, cy, 0.56),
    stroke: ch.highlight ? TONE.enMismatch : (ch.tone ?? TONE.en),
  }))

  const items: Array<{ kind: 'metal' | 'ligand'; idx: number; z: number }> = [
    { kind: 'metal' as const, idx: -1, z: 0 },
    ...pts.map((p, idx) => ({ kind: 'ligand' as const, idx, z: p.z })),
  ].sort((a, b) => a.z - b.z)

  return (
    <g opacity={opacity}>
      {/* Faint octahedron cage */}
      {OCTA_EDGES.map(([i, j], k) => (
        <line
          key={`oe-${k}`}
          x1={pts[i].x}
          y1={pts[i].y}
          x2={pts[j].x}
          y2={pts[j].y}
          stroke={TONE.guide}
          strokeWidth={1.1}
        />
      ))}

      {/* Optional shaded triangular face (fac) */}
      {shadedFace && (
        <polygon
          points={shadedFace.map((i) => `${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`).join(' ')}
          fill={TONE.x}
          fillOpacity={0.28}
          stroke={TONE.x}
          strokeWidth={2}
        />
      )}

      {/* Optional meridian highlight (mer) */}
      {meridianTriple && (
        <g>
          <ellipse
            cx={cx}
            cy={cy}
            rx={radius * 0.68}
            ry={radius * 1.02}
            fill={TONE.x}
            fillOpacity={0.12}
            stroke={TONE.x}
            strokeWidth={2.2}
            strokeDasharray="6 4"
          />
          <polyline
            points={meridianTriple.map((i) => `${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke={TONE.x}
            strokeWidth={2.8}
          />
        </g>
      )}

      {/* Optional internal symmetry mirror plane (3D-projected) */}
      {showMirrorPlane && (
        <polygon
          points={projectedMirrorVerts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill={TONE.accent}
          fillOpacity={0.12}
          stroke={TONE.accent}
          strokeWidth={1.8}
          strokeDasharray="6 4"
        />
      )}

      {/* Optional cis/trans highlight line */}
      {highlightPair && (
        <line
          x1={pts[highlightPair[0]].x}
          y1={pts[highlightPair[0]].y}
          x2={pts[highlightPair[1]].x}
          y2={pts[highlightPair[1]].y}
          stroke={TONE.x}
          strokeWidth={2.2}
          strokeDasharray="5 4"
        />
      )}

      {/* Back bonds */}
      {pts.map((p, i) =>
        p.z < -0.05 ? (
          <line
            key={`ob-${i}`}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={TONE.bond}
            strokeWidth={2}
            strokeDasharray="4 3"
            opacity={0.7}
          />
        ) : null,
      )}

      {/* Chelate arcs (en bridges) - paths drawn beneath ligand circles */}
      {computedChelates.map(({ ch, arc, stroke }, idx) => (
        <g key={`ch-${idx}`}>
          {ch.highlight && (
            <path d={arc.d} fill="none" stroke={TONE.enMismatch} strokeWidth={9} strokeLinecap="round" opacity={0.28} />
          )}
          <path d={arc.d} fill="none" stroke={stroke} strokeWidth={ch.highlight ? 4.2 : 3.2} strokeLinecap="round" />
        </g>
      ))}

      {/* Depth-sorted metal + ligands */}
      {items.map((item) => {
        if (item.kind === 'metal') {
          return (
            <g key="oct-metal">
              {/* Front & equatorial bonds */}
              {pts.map((p, i) =>
                p.z >= -0.05 ? (
                  <line
                    key={`of-${i}`}
                    x1={cx}
                    y1={cy}
                    x2={p.x}
                    y2={p.y}
                    stroke={TONE.bond}
                    strokeWidth={2.6}
                    strokeLinecap="round"
                  />
                ) : null,
              )}
              <circle cx={cx} cy={cy} r={metalR} fill={TONE.surface} stroke={TONE.metal} strokeWidth={2.4} />
              <text x={cx} y={cy + fontSize * 0.35} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill={TONE.fg}>
                {metal}
              </text>
            </g>
          )
        }
        const p = pts[item.idx]
        const lig = ligands[item.idx]
        const r =
          lig.label.length >= 3
            ? Math.max(ligandR, 19)
            : lig.label.length === 2
              ? Math.max(ligandR, 15.5)
              : ligandR
        return (
          <g key={`ol-${item.idx}`}>
            <circle cx={p.x} cy={p.y} r={r} fill={lig.fill} stroke={TONE.surface} strokeWidth={1.8} />
            <text
              x={p.x}
              y={p.y + fontSize * 0.34}
              textAnchor="middle"
              fontSize={fontSize}
              fontWeight={700}
              fill={lig.textFill ?? 'var(--accent-fg)'}
            >
              {lig.label}
            </text>
          </g>
        )
      })}

      {/* Chelate arc labels rendered in a top pass so ligand circles never occlude them */}
      {computedChelates.map(({ ch, arc, stroke }, idx) =>
        ch.label ? (
          <text
            key={`chl-${idx}`}
            x={arc.labelX}
            y={arc.labelY + 5}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight={700}
            fill={stroke}
            stroke={TONE.surface}
            strokeWidth={3.5}
            paintOrder="stroke"
          >
            {ch.label}
          </text>
        ) : null,
      )}
    </g>
  )
}
