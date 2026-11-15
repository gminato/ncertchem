import React, { forwardRef, useId } from 'react'
import {
  clamp01,
  electronArcPath,
  staggeredElectronPoints,
  formatTrueMinus,
  type Point,
} from './geometry'

export const ELECTRON_TRANSFER_SIZE = { width: 340, height: 180 } as const

export interface TransferSpecies {
  symbol: string
  initialCharge?: string
  finalCharge?: string
  radius?: number
}

export interface ElectronTransferProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  donor?: TransferSpecies
  acceptor?: TransferSpecies
  electrons?: number
  /** Progress from 0 (pre-transfer) to 1 (transfer complete). */
  progress?: number
  donorCaption?: React.ReactNode
  acceptorCaption?: React.ReactNode
  showFlightArc?: boolean
  x?: number
  y?: number
  particleDistance?: number
}

export const ElectronTransfer = forwardRef<SVGGElement, ElectronTransferProps>(function ElectronTransfer(
  {
    donor = { symbol: 'Na', initialCharge: '', finalCharge: '+' },
    acceptor = { symbol: 'Cl', initialCharge: '', finalCharge: '−' },
    electrons = 1,
    progress = 0,
    donorCaption,
    acceptorCaption,
    showFlightArc = true,
    x = 0,
    y = 0,
    particleDistance = 180,
    className,
    ...rest
  },
  ref
) {
  const p = clamp01(progress)
  const markerId = `et-arrow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const halfD = particleDistance / 2
  const donorCenter: Point = { x: -halfD, y: 0 }
  const acceptorCenter: Point = { x: halfD, y: 0 }
  const arcHeight = 55

  const donorRadius = donor.radius ?? 26
  const acceptorRadius = acceptor.radius ?? 28

  // Donor loses electrons -> turns --ox (amber) and shows positive charge
  const donorStroke = p > 0.1 ? 'var(--ox)' : 'var(--border)'
  const donorCharge =
    p >= 0.2 ? donor.finalCharge ?? '+' : donor.initialCharge ?? ''

  // Acceptor gains electrons -> turns --red (indigo) and shows negative charge
  const acceptorStroke = p >= 0.7 ? 'var(--red)' : 'var(--border)'
  const acceptorCharge =
    p >= 0.8 ? acceptor.finalCharge ?? '−' : acceptor.initialCharge ?? ''

  // Flight arc path
  const arcD = electronArcPath(donorCenter, acceptorCenter, arcHeight)

  // Electrons along arc
  const electronPoints = staggeredElectronPoints(
    donorCenter,
    acceptorCenter,
    arcHeight,
    electrons,
    p,
    0.1
  )

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      {...rest}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--electron)" />
        </marker>
      </defs>

      {/* Flight arc trajectory */}
      {showFlightArc && (
        <path
          d={arcD}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />
      )}

      {/* Direction indicator on the arc peak */}
      <line
        x1={-10}
        y1={-arcHeight + 14}
        x2={10}
        y2={-arcHeight + 14}
        stroke="var(--electron)"
        strokeWidth={1.6}
        markerEnd={`url(#${markerId})`}
      />
      <text
        x={0}
        y={-arcHeight}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fill="var(--electron)"
        fontFamily="var(--font-sans)"
        fontWeight={600}
        style={{ userSelect: 'none' }}
      >
        {electrons > 1 ? `${electrons} ` : ''}
        <tspan className="sym">e</tspan>
        <tspan dy="-0.4em" fontSize="0.75em">
          −
        </tspan>
      </text>

      {/* Traveling Electrons */}
      {p > 0 &&
        p < 1 &&
        electronPoints.map((pt, i) => (
          <g key={i} transform={`translate(${pt.x}, ${pt.y})`}>
            {/* Soft glow halo */}
            <circle
              cx={0}
              cy={0}
              r={11}
              fill="var(--electron)"
              opacity={0.22}
              style={{ pointerEvents: 'none' }}
            />
            {/* Core electron */}
            <circle cx={0} cy={0} r={4.5} fill="var(--electron)" />
          </g>
        ))}

      {/* Donor Atom / Ion (Left) */}
      <g transform={`translate(${donorCenter.x}, ${donorCenter.y})`}>
        {p > 0.1 && (
          <circle
            cx={0}
            cy={0}
            r={donorRadius + 5}
            fill="none"
            stroke="var(--ox)"
            strokeWidth={1}
            opacity={0.3 * p}
          />
        )}
        <circle
          cx={0}
          cy={0}
          r={donorRadius}
          fill="var(--surface)"
          stroke={donorStroke}
          strokeWidth={2.4}
        />
        <text
          x={0}
          y={1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
          style={{ userSelect: 'none' }}
        >
          {donor.symbol}
        </text>

        {/* Charge badge */}
        {donorCharge && (
          <g transform={`translate(${donorRadius * 0.75}, ${-donorRadius * 0.75})`}>
            <circle cx={0} cy={0} r={9.5} fill="var(--surface-raised)" stroke="var(--ox)" strokeWidth={1.5} />
            <text
              x={0}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--ox)"
              style={{ userSelect: 'none' }}
            >
              {formatTrueMinus(donorCharge)}
            </text>
          </g>
        )}
      </g>

      {/* Acceptor Atom / Ion (Right) */}
      <g transform={`translate(${acceptorCenter.x}, ${acceptorCenter.y})`}>
        {p >= 0.7 && (
          <circle
            cx={0}
            cy={0}
            r={acceptorRadius + 5}
            fill="none"
            stroke="var(--red)"
            strokeWidth={1}
            opacity={0.35}
          />
        )}
        <circle
          cx={0}
          cy={0}
          r={acceptorRadius}
          fill="var(--surface)"
          stroke={acceptorStroke}
          strokeWidth={2.4}
        />
        <text
          x={0}
          y={1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
          style={{ userSelect: 'none' }}
        >
          {acceptor.symbol}
        </text>

        {/* Charge badge */}
        {acceptorCharge && (
          <g transform={`translate(${acceptorRadius * 0.75}, ${-acceptorRadius * 0.75})`}>
            <circle cx={0} cy={0} r={9.5} fill="var(--surface-raised)" stroke="var(--red)" strokeWidth={1.5} />
            <text
              x={0}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--red)"
              style={{ userSelect: 'none' }}
            >
              {formatTrueMinus(acceptorCharge)}
            </text>
          </g>
        )}
      </g>

      {/* Half-reaction captions under each particle */}
      {donorCaption && (
        <g transform={`translate(${donorCenter.x}, ${donorRadius + 22})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontFamily="var(--font-sans)"
            fill="var(--ox)"
            fontWeight={500}
          >
            {donorCaption}
          </text>
        </g>
      )}

      {acceptorCaption && (
        <g transform={`translate(${acceptorCenter.x}, ${acceptorRadius + 22})`}>
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontFamily="var(--font-sans)"
            fill="var(--red)"
            fontWeight={500}
          >
            {acceptorCaption}
          </text>
        </g>
      )}
    </g>
  )
})
