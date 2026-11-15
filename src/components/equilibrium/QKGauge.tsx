import React, { forwardRef, useId } from 'react'
import { formatSci, logToPixel, netDirection, powerOfTen } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const QK_GAUGE_SIZE = { width: 560, height: 180 } as const

const AXIS = { x0: 40, x1: 520, y: 100 }

export interface QKGaugeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Equilibrium constant K (positive). */
  K: number
  /** Reaction quotient Q at the current moment (positive). */
  Q: number
  /** Exponent range of the log axis. Defaults to 10⁻¹⁰ … 10¹⁰. */
  domain?: readonly [number, number]
  /** Label for K. Defaults to an italic K. */
  kLabel?: React.ReactNode
  /** Label for Q. Defaults to an italic Q. */
  qLabel?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

/** Text anchor that keeps a label inside the drawing near its ends. */
function anchorFor(px: number): 'start' | 'middle' | 'end' {
  if (px < AXIS.x0 + 70) return 'start'
  if (px > AXIS.x1 - 70) return 'end'
  return 'middle'
}

/**
 * Q and K on a log scale, with an arrow from Q towards K that names the direction the
 * reaction proceeds. Shaded zones mark where products (K > 10³) or reactants (K < 10⁻³)
 * predominate, and where both are significant in between.
 */
export const QKGauge = forwardRef<SVGGElement, QKGaugeProps>(function QKGauge(
  {
    K,
    Q,
    domain = [-10, 10],
    kLabel = <tspan className="sym">K</tspan>,
    qLabel = <tspan className="sym">Q</tspan>,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const arrowId = `qk-arrow-${uid}`
  const xOf = (v: number) => logToPixel(v, domain, [AXIS.x0, AXIS.x1])
  const xK = xOf(K)
  const xQ = xOf(Q)
  const direction = netDirection(Q, K)
  const zoneLo = xOf(10 ** -3)
  const zoneHi = xOf(10 ** 3)
  const mid = (xK + xQ) / 2
  const tone = direction === 'net forward' ? 'var(--fwd)' : direction === 'net reverse' ? 'var(--rev)' : 'var(--fg)'

  const tickExponents: number[] = []
  for (let e = domain[0]; e <= domain[1]; e += 5) tickExponents.push(e)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? `Q and K on a log scale: K ${formatSci(K)}, Q ${formatSci(Q)}`} {...rest}>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 Z" fill={tone} />
        </marker>
      </defs>

      {/* Zones */}
      <rect x={AXIS.x0} y={34} width={zoneLo - AXIS.x0} height={68} rx={6} fill="var(--surface-raised)" />
      <rect x={zoneHi} y={34} width={AXIS.x1 - zoneHi} height={68} rx={6} fill="var(--fwd)" opacity={0.13} />
      <line x1={zoneLo} x2={zoneLo} y1={34} y2={102} stroke="var(--fg-muted)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />
      <line x1={zoneHi} x2={zoneHi} y1={34} y2={102} stroke="var(--fg-muted)" strokeWidth={1} strokeDasharray="3 3" opacity={0.7} />

      <text x={(AXIS.x0 + zoneLo) / 2} y={22} textAnchor="middle" fontSize={13} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        reactants predominate
      </text>
      <text x={(zoneLo + zoneHi) / 2} y={22} textAnchor="middle" fontSize={13} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        both significant
      </text>
      <text x={(zoneHi + AXIS.x1) / 2} y={22} textAnchor="middle" fontSize={13} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fwd)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        products predominate
      </text>

      {/* Log axis */}
      <line x1={AXIS.x0} x2={AXIS.x1} y1={AXIS.y} y2={AXIS.y} stroke="var(--fg-muted)" strokeWidth={1.6} />
      {tickExponents.map((e) => (
        <g key={e}>
          <line x1={xOf(10 ** e)} x2={xOf(10 ** e)} y1={AXIS.y} y2={AXIS.y + 5} stroke="var(--fg-muted)" strokeWidth={1.2} />
          <text x={xOf(10 ** e)} y={AXIS.y + 19} textAnchor="middle" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
            {powerOfTen(e)}
          </text>
        </g>
      ))}

      {/* K and Q markers on the axis */}
      <circle cx={xK} cy={AXIS.y} r={8} fill="var(--fwd)" stroke="var(--surface)" strokeWidth={2} />
      <circle cx={xQ} cy={AXIS.y} r={8} fill="var(--rev)" stroke="var(--surface)" strokeWidth={2} />

      <text x={xK} y={52} textAnchor={anchorFor(xK)} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fwd)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        {kLabel} = {formatSci(K)}
      </text>
      <text x={xQ} y={142} textAnchor={anchorFor(xQ)} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--rev)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        {qLabel} = {formatSci(Q)}
      </text>

      {/* Arrow from Q towards K */}
      {direction !== 'at equilibrium' && Math.abs(xK - xQ) > 12 && (
        <line
          x1={xQ + (xK > xQ ? 12 : -12)}
          x2={xK + (xK > xQ ? -14 : 14)}
          y1={74}
          y2={74}
          stroke={tone}
          strokeWidth={2.4}
          markerEnd={`url(#${arrowId})`}
        />
      )}

      {/* Direction pill */}
      <g transform={`translate(${mid}, 166)`}>
        <rect x={-72} y={-12} width={144} height={24} rx={12} fill="var(--surface)" stroke={tone} strokeWidth={1.4} />
        <text x={0} y={0.5} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill={tone} style={{ userSelect: 'none' }}>
          {direction}
        </text>
      </g>
    </g>
  )
})
