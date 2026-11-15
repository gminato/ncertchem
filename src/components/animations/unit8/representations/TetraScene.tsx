'use client'

import { Html } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'
import { useStagePortal } from '@/components/stage3d/Stage3D'
import type { Molecule3DData } from '@/components/molecule/molecule-data'

/**
 * Element colours of the tetrahedral panel. The sketch and the 3D model use the same colours and
 * the same symbols, so a learner can match the two views. Br is dark red, Cl green, F pale green,
 * H white.
 */
export const TETRA_COLOUR: Record<string, string> = {
  C: '#3d3d44',
  H: '#f4f4f2',
  F: '#c3eda6',
  Cl: '#2e9a4a',
  Br: '#8a1c1c',
}

const RADIUS: Record<string, number> = { C: 0.42, H: 0.3, F: 0.36, Cl: 0.46, Br: 0.5 }
const STICK = 0.09

/** A tetrahedral carbon in 3D: spheres in the element colours with their symbols, and sticks for the bonds. */
export function TetraScene({ data }: { data: Molecule3DData }) {
  const portal = useStagePortal() ?? undefined
  const at = new Map(data.atoms.map((a) => [a.id, a]))
  return (
    <group>
      {data.bonds.map((b, i) => {
        const p = at.get(b.a)!.position
        const q = at.get(b.b)!.position
        const d: [number, number, number] = [q[0] - p[0], q[1] - p[1], q[2] - p[2]]
        const len = Math.hypot(...d)
        const unit = new Vector3(d[0] / len, d[1] / len, d[2] / len)
        const mid: [number, number, number] = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2]
        const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), unit)
        return (
          <mesh key={`stick-${i}`} position={mid} quaternion={quaternion}>
            <cylinderGeometry args={[STICK, STICK, len, 16]} />
            <meshStandardMaterial color="#9a9aa0" roughness={0.4} metalness={0} />
          </mesh>
        )
      })}
      {data.atoms.map((a) => {
        const r = RADIUS[a.element] ?? 0.4
        return (
          <group key={a.id} position={a.position}>
            <mesh>
              <sphereGeometry args={[r, 32, 24]} />
              <meshStandardMaterial color={TETRA_COLOUR[a.element] ?? '#888888'} roughness={0.34} metalness={0} />
            </mesh>
            <Html position={[0, 0, 0]} center pointerEvents="none" portal={portal}>
              <span style={{ color: 'var(--fg)', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-sans)', textShadow: '0 0 3px var(--surface), 0 0 1px var(--surface)', pointerEvents: 'none' }}>
                {a.element}
              </span>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

/** The same model as a flat drawing, for a browser without WebGL. */
export function TetraFallback({ data, label }: { data: Molecule3DData; label: string }) {
  const SCALE = 110
  const at = new Map(data.atoms.map((a) => [a.id, a]))
  return (
    <svg viewBox="-200 -170 400 340" role="img" aria-label={label} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {data.bonds.map((b, i) => {
        const p = at.get(b.a)!.position
        const q = at.get(b.b)!.position
        return <line key={`fb-${i}`} x1={p[0] * SCALE} y1={-p[1] * SCALE} x2={q[0] * SCALE} y2={-q[1] * SCALE} stroke="#9a9aa0" strokeWidth={5} />
      })}
      {data.atoms.map((a) => {
        const r = (RADIUS[a.element] ?? 0.4) * SCALE * 0.9
        const cx = a.position[0] * SCALE
        const cy = -a.position[1] * SCALE
        return (
          <g key={`fa-${a.id}`}>
            <circle cx={cx} cy={cy} r={r} fill={TETRA_COLOUR[a.element] ?? '#888888'} />
            <text x={cx} y={cy - r - 10} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
              {a.element}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
