'use client'

import type { ReactNode } from 'react'
import { CoordinationGeometry } from './CoordinationGeometry'
import { VbtOrbitalDiagram, computeBoxPositions } from './VbtOrbitalDiagram'
import { VBT_STEPS, clampStep, type OrbitalSchemeSpec } from './vbt-steps'

export interface VbtHybridisationProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Skip transitions when reduced motion is requested. */
  reducedMotion: boolean
}

const W = 600
const H = 540
const METAL_COLOR = 'var(--electron)'
const LIGAND_COLOR = 'var(--orbital-pos)'

function Text({
  x,
  y,
  children,
  size = 18,
  anchor = 'start',
  weight = 400,
  muted = false,
  fill,
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  anchor?: 'start' | 'middle' | 'end'
  weight?: number
  muted?: boolean
  fill?: string
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      style={{
        fill: fill ?? (muted ? 'var(--fg-muted)' : 'var(--fg)'),
        fontFamily: 'var(--font-sans)',
        fontSize: size,
        fontWeight: weight,
      }}
    >
      {children}
    </text>
  )
}

function LegendRow({ y }: { y: number }) {
  return (
    <g>
      <line x1={28} x2={28} y1={y - 12} y2={y + 2} style={{ stroke: METAL_COLOR, strokeWidth: 2.4, strokeLinecap: 'round' }} />
      <path d={`M24,${y - 8} L28,${y - 12} L32,${y - 8}`} fill="none" style={{ stroke: METAL_COLOR, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <Text x={40} y={y} size={18} muted>
        Metal 3d electron
      </Text>

      <line x1={232} x2={232} y1={y - 12} y2={y + 2} style={{ stroke: LIGAND_COLOR, strokeWidth: 2.4, strokeLinecap: 'round' }} />
      <path d={`M228,${y - 8} L232,${y - 12} L236,${y - 8}`} fill="none" style={{ stroke: LIGAND_COLOR, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <line x1={242} x2={242} y1={y - 12} y2={y + 2} style={{ stroke: LIGAND_COLOR, strokeWidth: 2.4, strokeLinecap: 'round' }} />
      <path d={`M238,${y - 2} L242,${y + 2} L246,${y - 2}`} fill="none" style={{ stroke: LIGAND_COLOR, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <Text x={256} y={y} size={18} muted>
        Donated ligand electron pair
      </Text>
    </g>
  )
}

function FreeIonScene({ spec }: { spec: OrbitalSchemeSpec }) {
  const boxSize = 34
  const { totalWidth } = computeBoxPositions(true, boxSize)
  const startX = Math.round((W - totalWidth) / 2)

  return (
    <g>
      <VbtOrbitalDiagram boxes={spec.boxes} show4d={true} bracket={null} x={startX} y={132} boxSize={boxSize} fontSize={18} />

      {/* Highlight callout under the 4 singly occupied 3d boxes */}
      <rect
        x={24}
        y={224}
        width={W - 48}
        height={176}
        rx={12}
        style={{ fill: 'var(--surface)', stroke: 'var(--border)', strokeWidth: 1.5 }}
      />
      <Text x={44} y={260} size={20} weight={700}>
        Free Co³⁺ valence shell: [Ar] 3d⁶ 4s⁰ 4p⁰ 4d⁰
      </Text>
      <Text x={44} y={294} size={18} muted>
        Hund&apos;s rule places four electrons singly across 3d orbitals.
      </Text>
      <Text x={44} y={324} size={18} muted>
        No pair of vacant inner 3d orbitals is open yet.
      </Text>
      <Text x={44} y={362} size={18} weight={600} fill={METAL_COLOR}>
        Unpaired electrons: n = 4  |  Paramagnetic (μ = 4.90 BM)
      </Text>

      <LegendRow y={474} />
    </g>
  )
}

function SingleComplexScene({ spec }: { spec: OrbitalSchemeSpec }) {
  const boxSize = spec.show4d ? 34 : 44
  const { totalWidth } = computeBoxPositions(spec.show4d, boxSize)
  const startX = Math.round((W - totalWidth) / 2)
  const geomLabel =
    spec.geometry === 'octahedral'
      ? 'Octahedral'
      : spec.geometry === 'square-planar'
        ? 'Square planar'
        : 'Tetrahedral'

  return (
    <g>
      <VbtOrbitalDiagram
        boxes={spec.boxes}
        show4d={spec.show4d}
        bracket={spec.bracket}
        x={startX}
        y={122}
        boxSize={boxSize}
        fontSize={18}
      />

      {/* Divider */}
      <line x1={24} x2={W - 24} y1={232} y2={232} style={{ stroke: 'var(--border)', strokeWidth: 1.5 }} />

      {/* Left: Coordination geometry */}
      {spec.geometry !== 'none' && (
        <CoordinationGeometry
          geometry={spec.geometry}
          metalLabel={spec.metalLabel}
          ligandLabel={spec.ligandLabel}
          cx={134}
          cy={352}
          radius={68}
          fontSize={18}
        />
      )}

      {/* Right: Summary card */}
      <rect
        x={256}
        y={254}
        width={328}
        height={208}
        rx={12}
        style={{ fill: 'var(--surface)', stroke: 'var(--border)', strokeWidth: 1.5 }}
      />
      <Text x={274} y={290} size={21} weight={700}>
        {spec.formula}
      </Text>
      <Text x={274} y={322} size={18} weight={600} fill={LIGAND_COLOR}>
        {`${spec.hybridisation}  |  ${geomLabel}`}
      </Text>
      <Text x={274} y={356} size={18}>
        {`Unpaired electrons: n = ${spec.unpaired}`}
      </Text>
      <Text x={274} y={386} size={18}>
        {`Spin-only μ = ${spec.muText}`}
      </Text>
      <Text x={274} y={416} size={18} weight={600} fill={spec.unpaired > 0 ? METAL_COLOR : 'var(--success)'}>
        {spec.magnetism}
      </Text>
      <Text x={274} y={446} size={18} muted>
        {spec.spinLabel}
      </Text>

      <LegendRow y={506} />
    </g>
  )
}

function DualTetrahedralScene({ top, bottom }: { top: OrbitalSchemeSpec; bottom: OrbitalSchemeSpec }) {
  const boxSize = 36
  const rows: { spec: OrbitalSchemeSpec; y0: number }[] = [
    { spec: top, y0: 96 },
    { spec: bottom, y0: 304 },
  ]

  return (
    <g>
      {rows.map(({ spec, y0 }) => (
        <g key={spec.id}>
          <rect
            x={16}
            y={y0}
            width={W - 32}
            height={190}
            rx={12}
            style={{ fill: 'var(--surface)', stroke: 'var(--border)', strokeWidth: 1.5 }}
          />
          <Text x={32} y={y0 + 28} size={19} weight={700}>
            {`${spec.formula}  (${spec.metalLabel})`}
          </Text>
          <Text
            x={32}
            y={y0 + 174}
            size={18}
            weight={600}
            fill={spec.unpaired > 0 ? METAL_COLOR : 'var(--success)'}
          >
            {`${spec.magnetism}  |  ${spec.spinLabel}`}
          </Text>

          <VbtOrbitalDiagram
            boxes={spec.boxes}
            show4d={false}
            bracket={spec.bracket}
            x={32}
            y={y0 + 66}
            boxSize={boxSize}
            fontSize={18}
          />

          <CoordinationGeometry
            geometry="tetrahedral"
            metalLabel={spec.metalLabel}
            ligandLabel={spec.ligandLabel}
            cx={492}
            cy={y0 + 96}
            radius={58}
            fontSize={18}
          />
        </g>
      ))}
      <LegendRow y={522} />
    </g>
  )
}

/**
 * Scrolly Animation for Section 5.5.1-5.5.3: Valence Bond Theory hybridisation and geometry.
 */
export function VbtHybridisation({ step, reducedMotion }: VbtHybridisationProps) {
  const s = clampStep(step)
  const current = VBT_STEPS[s]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={current.ariaLabel}
      style={{ display: 'block', transition: reducedMotion ? 'none' : 'opacity 180ms ease' }}
    >
      {/* Header */}
      <Text x={24} y={36} size={22} weight={700}>
        {current.title}
      </Text>
      <Text x={24} y={64} size={18} muted>
        {current.subtitle}
      </Text>

      {s === 0 && <FreeIonScene spec={current.primary} />}
      {(s === 1 || s === 2 || s === 4) && <SingleComplexScene spec={current.primary} />}
      {s === 3 && current.secondary && <DualTetrahedralScene top={current.primary} bottom={current.secondary} />}
    </svg>
  )
}
