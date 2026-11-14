'use client'

import { useEffect, useMemo } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, FrontSide, NormalBlending } from 'three'
import { StageAxes } from '@/components/stage3d'
import { useStageColors } from '@/components/stage3d/stage-colors'
import type { TriangleMesh } from './orbital-explorer-mesh'
import type { OrbitalGeometry } from './orbital-explorer-model'

/** Half-length of each drawn axis in scene units. Sized so the x, y and z letters stay in the stage. */
export const AXIS_LENGTH = 1.75

/**
 * Turns the chemistry frame (z vertical) into the scene frame, where +y is up. A rotation of
 * −90° about x sends the orbital's z to scene +y, so dz² lobes point up and down, and the
 * orbital's x and y lie in the horizontal plane.
 */
const CHEMISTRY_TO_SCENE: [number, number, number] = [-Math.PI / 2, 0, 0]

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

/** A BufferGeometry for an indexed triangle mesh. It is disposed when the mesh changes or the view unmounts. */
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

/** A BufferGeometry holding only positions: point clouds and line segments. */
function usePositionGeometry(positions: Float32Array): BufferGeometry {
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

/**
 * The analytic nodes: nodal planes, cones and radial spheres as faint neutral fills, each
 * sheet outlined by a rim. Fills and rims are neutral, so they read in either theme without
 * competing with the phase colours.
 */
function NodalSurface({ nodes, fill, rim }: { nodes: OrbitalGeometry['nodes']; fill: string; rim: string }) {
  const sheetGeometry = useMeshGeometry(nodes.sheets)
  const sphereGeometry = useMeshGeometry(nodes.spheres)
  const rimGeometry = usePositionGeometry(nodes.rims)
  return (
    <group>
      {nodes.sheets.indices.length > 0 && (
        <mesh geometry={sheetGeometry}>
          <meshBasicMaterial color={fill} transparent opacity={0.1} depthWrite={false} side={DoubleSide} />
        </mesh>
      )}
      {nodes.spheres.indices.length > 0 && (
        <mesh geometry={sphereGeometry}>
          <meshBasicMaterial color={fill} transparent opacity={0.12} depthWrite={false} side={DoubleSide} />
        </mesh>
      )}
      {nodes.rims.length > 0 && (
        <lineSegments geometry={rimGeometry}>
          <lineBasicMaterial color={rim} transparent opacity={0.5} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  )
}

/** Probability cloud points for one phase sign. Dark themes add the points, so they glow. */
function CloudPoints({ positions, color, dark }: { positions: Float32Array; color: string; dark: boolean }) {
  const geometry = usePositionGeometry(positions)
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
 * probability cloud, the optional analytic nodes, and the x, y and z axes. The orbital and its
 * axes share one rotated group, so the axis letters are the orbital's own x, y and z, with z up.
 * Colours come from the stage tokens, so the phases are --orbital-pos and --orbital-neg in both themes.
 */
export function OrbitalScene({ geometry, view, showNodes }: OrbitalSceneProps) {
  const colors = useStageColors()
  const dark = isDarkColor(colors.surface)
  const cloud = useMemo(() => splitCloud(geometry.cloud), [geometry.cloud])

  return (
    <group rotation={CHEMISTRY_TO_SCENE}>
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
      {showNodes && <NodalSurface nodes={geometry.nodes} fill={colors.fg} rim={colors.fgMuted} />}
      <StageAxes length={AXIS_LENGTH} />
    </group>
  )
}
