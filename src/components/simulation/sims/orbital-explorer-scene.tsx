'use client'

import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, FrontSide, NormalBlending } from 'three'
import { StageAxes } from '@/components/stage3d'
import { useStageColors } from '@/components/stage3d/stage-colors'
import type { TriangleMesh } from './orbital-explorer-mesh'
import type { OrbitalGeometry } from './orbital-explorer-model'

/** Half-length of each drawn axis in scene units. Sized so the x, y and z letters stay in the stage. */
export const AXIS_LENGTH = 1.75

export type OrbitalView = 'surface' | 'cloud'

export interface OrbitalSceneProps {
  geometry: OrbitalGeometry
  view: OrbitalView
  showNodes: boolean
}

/** True when a #rrggbb colour is dark, so the cloud should glow additively. */
export function isDarkColor(hex: string): boolean {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim())
  if (!match) return false
  const value = parseInt(match[1], 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128
}

/** Splits the cloud into the points with ψ > 0 and those with ψ < 0, each as x, y, z triples. */
export function splitCloud(cloud: { positions: Float32Array; signs: Int8Array }): {
  positive: Float32Array
  negative: Float32Array
} {
  let positiveCount = 0
  for (const s of cloud.signs) if (s > 0) positiveCount++
  const positive = new Float32Array(positiveCount * 3)
  const negative = new Float32Array((cloud.signs.length - positiveCount) * 3)
  let p = 0
  let q = 0
  for (let i = 0; i < cloud.signs.length; i++) {
    const target = cloud.signs[i] > 0 ? positive : negative
    const at = cloud.signs[i] > 0 ? p++ : q++
    target[at * 3] = cloud.positions[i * 3]
    target[at * 3 + 1] = cloud.positions[i * 3 + 1]
    target[at * 3 + 2] = cloud.positions[i * 3 + 2]
  }
  return { positive, negative }
}

/** A BufferGeometry for a triangle mesh. It is disposed when the mesh changes or the view unmounts. */
function useMeshGeometry(mesh: TriangleMesh): BufferGeometry {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(mesh.positions, 3))
    g.setAttribute('normal', new BufferAttribute(mesh.normals, 3))
    g.setIndex(new BufferAttribute(mesh.indices, 1))
    return g
  }, [mesh])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

/** A BufferGeometry holding only positions, for point clouds. */
function usePointGeometry(positions: Float32Array): BufferGeometry {
  const geometry = useMemo(() => {
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(positions, 3))
    return g
  }, [positions])
  useEffect(() => () => geometry.dispose(), [geometry])
  return geometry
}

/** One translucent, softly lit lobe: a single phase sign of the boundary surface. */
function LobeMesh({ mesh, color }: { mesh: TriangleMesh; color: string }) {
  const geometry = useMeshGeometry(mesh)
  if (mesh.indices.length === 0) return null
  return (
    <mesh geometry={geometry}>
      <meshPhysicalMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.1}
        roughness={0.42}
        clearcoat={0.35}
        clearcoatRoughness={0.3}
        transparent
        opacity={0.6}
        depthWrite={false}
        side={FrontSide}
      />
    </mesh>
  )
}

/** The nodal surface, ψ = 0, drawn as a faint translucent sheet. */
function NodalSurface({ mesh, color }: { mesh: TriangleMesh; color: string }) {
  const geometry = useMeshGeometry(mesh)
  if (mesh.indices.length === 0) return null
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} side={DoubleSide} />
    </mesh>
  )
}

/** Probability cloud points for one phase sign. Dark themes add the points, so they glow. */
function CloudPoints({ positions, color, dark }: { positions: Float32Array; color: string; dark: boolean }) {
  const geometry = usePointGeometry(positions)
  return (
    <points geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.034}
        sizeAttenuation
        transparent
        opacity={dark ? 0.85 : 0.7}
        depthWrite={false}
        blending={dark ? AdditiveBlending : NormalBlending}
      />
    </points>
  )
}

/**
 * The 3D content of the orbital explorer, for use inside Stage3D: the boundary lobes or the
 * probability cloud, the optional nodal surface, and the x, y and z axes. Colours come from
 * the stage tokens, so the phases are --orbital-pos and --orbital-neg in both themes.
 */
export function OrbitalScene({ geometry, view, showNodes }: OrbitalSceneProps) {
  const colors = useStageColors()
  const dark = isDarkColor(colors.surface)
  const cloud = useMemo(() => splitCloud(geometry.cloud), [geometry.cloud])

  return (
    <group>
      {view === 'surface' ? (
        <>
          <LobeMesh mesh={geometry.positive} color={colors.orbitalPos} />
          <LobeMesh mesh={geometry.negative} color={colors.orbitalNeg} />
        </>
      ) : (
        <>
          <CloudPoints positions={cloud.positive} color={colors.orbitalPos} dark={dark} />
          <CloudPoints positions={cloud.negative} color={colors.orbitalNeg} dark={dark} />
        </>
      )}
      {showNodes && <NodalSurface mesh={geometry.nodes} color={colors.fg} />}
      <StageAxes length={AXIS_LENGTH} />
    </group>
  )
}
