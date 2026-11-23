'use client'

import { useEffect, useState } from 'react'
import {
  CUBE_WIREFRAME,
  OCTAHEDRON_MESH,
  SQUARE_PLANAR_MESH,
  SQUARE_PYRAMIDAL_MESH,
  TETRAHEDRON_MESH,
  TRIGONAL_BIPYRAMIDAL_MESH,
  polyhedraStepInfo,
  project3D,
  type PolyhedronMesh,
  type Vec3,
} from './polyhedra-steps'

export interface CoordinationPolyhedraGalleryProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const ACCENT = 'var(--accent)'
const METAL = 'var(--db-3d)'
const LIGAND = 'var(--el-N)'
const BOND = 'var(--bond)'
const SURFACE = 'var(--surface)'

const BASE_YAW = 0.52
const BASE_PITCH = 0.36

interface PolyhedronSceneProps {
  mesh: PolyhedronMesh
  cx: number
  cy: number
  scale: number
  yaw: number
  pitch: number
  centerOffset?: Vec3
  showCube?: boolean
  ghostTetra?: boolean
  vertexRadius?: number
  metalRadius?: number
}

function PolyhedronView({
  mesh,
  cx,
  cy,
  scale,
  yaw,
  pitch,
  centerOffset = { x: 0, y: 0, z: 0 },
  showCube = false,
  ghostTetra = false,
  vertexRadius = 15,
  metalRadius = 21,
}: PolyhedronSceneProps) {
  const pts = mesh.vertices.map((v) => project3D(v, yaw, pitch, cx, cy, scale))
  const origin = project3D(centerOffset, yaw, pitch, cx, cy, scale)

  // Sort faces back-to-front by average z
  const sortedFaces = mesh.faces
    .map((face, i) => {
      const avgZ = face.reduce((s, idx) => s + pts[idx].z, 0) / face.length
      return { face, avgZ, i }
    })
    .sort((a, b) => a.avgZ - b.avgZ)

  // Build depth-sorted nodes (M + L atoms)
  const nodes: Array<{ kind: 'M' | 'L'; x: number; y: number; z: number; key: string }> = [
    { kind: 'M' as const, x: origin.x, y: origin.y, z: origin.z, key: 'M' },
    ...pts.map((p, i) => ({ kind: 'L' as const, x: p.x, y: p.y, z: p.z, key: `L-${i}` })),
  ].sort((a, b) => a.z - b.z)

  return (
    <g>
      {/* Optional inscribing cube wireframe (for tetrahedral step) */}
      {showCube && (() => {
        const cPts = CUBE_WIREFRAME.vertices.map((v) => project3D(v, yaw, pitch, cx, cy, scale))
        return (
          <g opacity={0.28}>
            {CUBE_WIREFRAME.edges.map(([a, b], i) => (
              <line
                key={`cube-${i}`}
                x1={cPts[a].x}
                y1={cPts[a].y}
                x2={cPts[b].x}
                y2={cPts[b].y}
                stroke={MUTED}
                strokeWidth={1.3}
                strokeDasharray="4 4"
              />
            ))}
          </g>
        )
      })()}

      {/* Optional ghosted tetrahedron behind square planar for CN = 4 comparison */}
      {ghostTetra && (() => {
        const tPts = TETRAHEDRON_MESH.vertices.map((v) => project3D(v, yaw + 0.25, pitch, cx, cy, scale * 0.96))
        return (
          <g opacity={0.26}>
            {TETRAHEDRON_MESH.edges.map(([a, b], i) => (
              <line
                key={`gt-${i}`}
                x1={tPts[a].x}
                y1={tPts[a].y}
                x2={tPts[b].x}
                y2={tPts[b].y}
                stroke={MUTED}
                strokeWidth={1.6}
                strokeDasharray="5 4"
              />
            ))}
            {tPts.map((p, i) => (
              <circle key={`gtv-${i}`} cx={p.x} cy={p.y} r={7} fill={MUTED} fillOpacity={0.35} />
            ))}
          </g>
        )
      })()}

      {/* Translucent polyhedron faces */}
      {sortedFaces.map(({ face, avgZ, i }) => {
        const d = face.map((idx) => `${pts[idx].x.toFixed(1)},${pts[idx].y.toFixed(1)}`).join(' ')
        const fillOp = avgZ > 0 ? 0.14 : 0.06
        return <polygon key={`f-${i}`} points={d} fill={ACCENT} fillOpacity={fillOp} stroke="none" />
      })}

      {/* Polyhedron edges */}
      {mesh.edges.map(([a, b], i) => {
        const avgZ = (pts[a].z + pts[b].z) / 2
        return (
          <line
            key={`e-${i}`}
            x1={pts[a].x}
            y1={pts[a].y}
            x2={pts[b].x}
            y2={pts[b].y}
            stroke={ACCENT}
            strokeOpacity={avgZ > 0 ? 0.58 : 0.24}
            strokeWidth={avgZ > 0 ? 1.8 : 1.3}
            strokeDasharray={avgZ > 0 ? undefined : '5 4'}
          />
        )
      })}

      {/* M-L coordination bonds */}
      {pts.map((p, i) => (
        <line
          key={`b-${i}`}
          x1={origin.x}
          y1={origin.y}
          x2={p.x}
          y2={p.y}
          stroke={BOND}
          strokeWidth={p.z > 0 ? 3.2 : 2.2}
          strokeOpacity={p.z > 0 ? 0.92 : 0.55}
          strokeLinecap="round"
        />
      ))}

      {/* Depth-sorted M and L spheres */}
      {nodes.map((n) => {
        const isM = n.kind === 'M'
        const r = isM ? metalRadius : vertexRadius
        const depthFade = isM ? 1 : n.z > -0.2 ? 1 : 0.72
        return (
          <g key={n.key} opacity={depthFade}>
            <circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={SURFACE}
              stroke={isM ? METAL : LIGAND}
              strokeWidth={isM ? 2.6 : 2.2}
            />
            <circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={isM ? METAL : LIGAND}
              fillOpacity={isM ? 0.24 : 0.2}
            />
            <text
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fontSize={isM ? 16 : 15}
              fontWeight={700}
              fill={FG}
            >
              {n.kind}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function CoordinationPolyhedraGallery({ step, reducedMotion }: CoordinationPolyhedraGalleryProps) {
  const [angle, setAngle] = useState(0)
  const info = polyhedraStepInfo(step)

  useEffect(() => {
    if (reducedMotion) return
    let rafId = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      setAngle((prev) => (prev + dt * 0.42) % (Math.PI * 2))
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [reducedMotion])

  const yaw = BASE_YAW + (reducedMotion ? 0 : angle)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Coordination polyhedron: ${info.title}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      {/* Top-right CN pill */}
      <rect x={422} y={16} width={102} height={34} rx={17} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={473} y={39} textAnchor="middle" fontSize={15} fontWeight={700} fill={ACCENT}>
        {info.cnLabel}
      </text>

      {info.visual === 'octahedral' && (
        <PolyhedronView
          mesh={OCTAHEDRON_MESH}
          cx={270}
          cy={196}
          scale={124}
          yaw={yaw}
          pitch={BASE_PITCH}
        />
      )}

      {info.visual === 'tetrahedral' && (
        <PolyhedronView
          mesh={TETRAHEDRON_MESH}
          cx={270}
          cy={196}
          scale={128}
          yaw={yaw}
          pitch={BASE_PITCH}
          showCube
        />
      )}

      {info.visual === 'square-planar' && (
        <g>
          <PolyhedronView
            mesh={SQUARE_PLANAR_MESH}
            cx={270}
            cy={196}
            scale={128}
            yaw={yaw}
            pitch={0.52}
            ghostTetra
          />
          <text x={270} y={348} textAnchor="middle" fontSize={14} fill={MUTED}>
            all 4 L atoms lie in one plane (tetrahedron ghosted behind)
          </text>
        </g>
      )}

      {info.visual === 'five-coordinate' && (
        <g>
          <PolyhedronView
            mesh={TRIGONAL_BIPYRAMIDAL_MESH}
            cx={142}
            cy={194}
            scale={92}
            yaw={yaw}
            pitch={0.32}
            vertexRadius={13}
            metalRadius={18}
          />
          <text x={142} y={336} textAnchor="middle" fontSize={15} fontWeight={700} fill={FG}>
            trigonal bipyramidal
          </text>
          <text x={142} y={358} textAnchor="middle" fontSize={14} fill={MUTED}>
            3 equatorial + 2 axial · CN = 5
          </text>

          <line x1={270} y1={72} x2={270} y2={366} stroke="var(--border)" strokeWidth={1.2} />

          <PolyhedronView
            mesh={SQUARE_PYRAMIDAL_MESH}
            cx={398}
            cy={194}
            scale={88}
            yaw={yaw}
            pitch={0.34}
            centerOffset={{ x: 0, y: 0.25, z: 0 }}
            vertexRadius={13}
            metalRadius={18}
          />
          <text x={398} y={336} textAnchor="middle" fontSize={15} fontWeight={700} fill={FG}>
            square pyramidal
          </text>
          <text x={398} y={358} textAnchor="middle" fontSize={14} fill={MUTED}>
            4 basal + 1 axial · CN = 5
          </text>
        </g>
      )}

      {/* Bottom caption */}
      <text x={W / 2} y={404} textAnchor="middle" fontSize={18} fontWeight={700} fill={FG}>
        {info.title}
      </text>
      {info.example ? (
        <text x={W / 2} y={432} textAnchor="middle" fontSize={16} fill={MUTED}>
          {`Example: ${info.example}`}
        </text>
      ) : (
        <text x={W / 2} y={432} textAnchor="middle" fontSize={15} fill={MUTED}>
          NCERT Fig. 5.1: M = central atom/ion, L = unidentate ligand
        </text>
      )}
    </svg>
  )
}
