import React, { forwardRef, useMemo } from 'react'

export interface NucleusProps extends React.SVGAttributes<SVGGElement> {
  protons: number
  neutrons: number
  x?: number
  y?: number
  scale?: number
  nucleonRadius?: number
  defsPrefix?: string
}

interface NucleonNode {
  x: number
  y: number
  z: number
  isProton: boolean
}

/**
 * Deterministically computes 3D coordinates for a tight cluster of nucleons.
 * Uses a seeded PRNG and golden-ratio spherical packing with a fixed 3D tilt.
 * Fully deterministic between server and client without using Math.random.
 */
function computeNucleusCluster(
  protons: number,
  neutrons: number,
  nucleonRadius: number
): NucleonNode[] {
  const total = protons + neutrons
  if (total <= 0) return []
  if (total === 1) {
    return [{ x: 0, y: 0, z: 0, isProton: protons === 1 }]
  }

  // Seeded deterministic interleaving of protons and neutrons
  let p = protons
  let n = neutrons
  let seed = (protons * 37 + neutrons * 101 + 42) | 0
  const seededRand = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const types: boolean[] = []
  while (p > 0 || n > 0) {
    if (p > 0 && (n === 0 || seededRand() > 0.48)) {
      types.push(true)
      p--
    } else if (n > 0) {
      types.push(false)
      n--
    } else {
      types.push(true)
      p--
    }
  }

  const clusterRadius = nucleonRadius * Math.pow(total, 0.38) * 0.72
  const phi = Math.PI * (3 - Math.sqrt(5)) // Golden angle (~2.39996 rad)
  const nodes: NucleonNode[] = []

  // Fixed 3D orientation tilt for aesthetic view
  const cosPitch = Math.cos(0.4)
  const sinPitch = Math.sin(0.4)
  const cosYaw = Math.cos(0.6)
  const sinYaw = Math.sin(0.6)

  for (let i = 0; i < total; i++) {
    const y0 = 1 - (i / (total - 1)) * 2
    const rAtY = Math.sqrt(Math.max(0, 1 - y0 * y0))
    const theta = phi * i
    const x0 = Math.cos(theta) * rAtY
    const z0 = Math.sin(theta) * rAtY

    // Rotate 3D coordinates
    const x1 = x0 * cosYaw + z0 * sinYaw
    const z1 = -x0 * sinYaw + z0 * cosYaw
    const y2 = y0 * cosPitch - z1 * sinPitch
    const z2 = y0 * sinPitch + z1 * cosPitch

    nodes.push({
      x: x1 * clusterRadius,
      y: y2 * clusterRadius,
      z: z2 * clusterRadius,
      isProton: types[i],
    })
  }

  // Sort back-to-front (ascending z) so foreground nucleons properly overlap background
  nodes.sort((a, b) => a.z - b.z)
  return nodes
}

export const Nucleus = forwardRef<SVGGElement, NucleusProps>(function Nucleus(
  {
    protons,
    neutrons,
    x = 0,
    y = 0,
    scale = 1,
    nucleonRadius = 8,
    defsPrefix = 'vocab',
    className,
    style,
    ...rest
  },
  ref
) {
  const total = protons + neutrons
  const isHeavy = total > 20

  const nucleons = useMemo(() => {
    if (isHeavy) return []
    return computeNucleusCluster(protons, neutrons, nucleonRadius)
  }, [protons, neutrons, nucleonRadius, isHeavy])

  // Halo radius scales smoothly with nucleus size
  const haloRadius = isHeavy
    ? 38
    : Math.max(nucleonRadius * 2.2, nucleonRadius * Math.pow(total, 0.4) * 1.8)

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={className}
      style={style}
      {...rest}
    >
      {/* Warm nucleus glow halo */}
      <circle
        cx={0}
        cy={0}
        r={haloRadius}
        fill={`url(#${defsPrefix}-nucleus-halo)`}
        style={{
          opacity: 'calc(0.22 + 0.78 * var(--glow-strength))',
          pointerEvents: 'none',
        }}
      />

      {isHeavy ? (
        // For counts > 20, render a single composite shaded sphere with glow
        <g>
          <circle
            cx={0}
            cy={0}
            r={22}
            fill="var(--proton)"
          />
          <circle
            cx={0}
            cy={0}
            r={22}
            fill={`url(#${defsPrefix}-sphere-shading)`}
          />
        </g>
      ) : (
        // Deterministic tight cluster of proton and neutron spheres
        nucleons.map((node, idx) => (
          <g key={idx} transform={`translate(${node.x.toFixed(2)}, ${node.y.toFixed(2)})`}>
            {/* Base colored nucleon sphere */}
            <circle
              cx={0}
              cy={0}
              r={nucleonRadius}
              fill={node.isProton ? 'var(--proton)' : 'var(--neutron)'}
              stroke="var(--bg)"
              strokeWidth={0.6}
              strokeOpacity={0.35}
            />
            {/* 3D shading overlay */}
            <circle
              cx={0}
              cy={0}
              r={nucleonRadius}
              fill={`url(#${defsPrefix}-sphere-shading)`}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))
      )}
    </g>
  )
})
