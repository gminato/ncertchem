'use client'

import { DoubleSide } from 'three'
import { useStageColors } from './stage-colors'
import { StageAxes } from './StageAxes'

/**
 * Placeholder 3D specimen: a p-type lobe pair. The two translucent ellipsoids
 * take the orbital phase colours (--orbital-pos and --orbital-neg), and a faint
 * disc marks the nodal plane between them. The real orbital meshes come later.
 */
export function OrbitalLobes3D() {
  const colors = useStageColors()

  return (
    <group>
      <mesh position={[0, 0, 0.9]} scale={[0.6, 0.6, 0.96]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial
          color={colors.orbitalPos}
          emissive={colors.orbitalPos}
          emissiveIntensity={0.12}
          transparent
          opacity={0.7}
          roughness={0.38}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, -0.9]} scale={[0.6, 0.6, 0.96]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshPhysicalMaterial
          color={colors.orbitalNeg}
          emissive={colors.orbitalNeg}
          emissiveIntensity={0.12}
          transparent
          opacity={0.7}
          roughness={0.38}
          clearcoat={0.5}
          clearcoatRoughness={0.2}
          depthWrite={false}
        />
      </mesh>

      <mesh>
        <circleGeometry args={[1.3, 72]} />
        <meshBasicMaterial
          color={colors.fgSubtle}
          transparent
          opacity={0.08}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>

      <StageAxes />
    </group>
  )
}
