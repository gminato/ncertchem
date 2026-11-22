import type { ReactNode, SVGAttributes } from 'react'

/** Drawing box for a polarimeter. */
export const POLARIMETER_SIZE = { width: 560, height: 300 } as const

const BEAM_Y = 180
const DIAL_Y = 76

export interface PolarimeterProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** Rotation of the analyser and the plane after the tube, in degrees. + is clockwise as seen by the observer. Default 0. */
  angle?: number
  /** Fill of the sample tube. Default 'liquid'. */
  fillTone?: 'liquid' | 'highlight' | 'accent'
  /** Label on the sample tube. Default 'sample tube'. */
  sampleLabel?: ReactNode
  x?: number
  y?: number
}

const FILL: Record<NonNullable<PolarimeterProps['fillTone']>, string> = {
  liquid: 'var(--liquid)',
  highlight: 'var(--highlight)',
  accent: 'var(--accent-soft)',
}

/** Arc from straight up, swept through `deg` degrees (positive is clockwise on screen). */
function arcPath(cx: number, cy: number, R: number, deg: number): string {
  const a0 = -Math.PI / 2
  const a1 = a0 + (deg * Math.PI) / 180
  const p0 = { x: cx + R * Math.cos(a0), y: cy + R * Math.sin(a0) }
  const p1 = { x: cx + R * Math.cos(a1), y: cy + R * Math.sin(a1) }
  const large = Math.abs(deg) > 180 ? 1 : 0
  const sweep = deg >= 0 ? 1 : 0
  return `M${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A${R} ${R} 0 ${large} ${sweep} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

function signed(deg: number): string {
  const sign = deg > 0 ? '+' : deg < 0 ? '−' : ''
  return `${sign}${Math.abs(deg)}°`
}

/** Lamp, polariser, sample tube, analyser and observer on one beam, with the plane of polarisation shown before and after the tube. */
export function Polarimeter({ angle = 0, fillTone = 'liquid', sampleLabel = 'sample tube', x = 0, y = 0, ...rest }: PolarimeterProps) {
  return (
    <g transform={`translate(${x} ${y})`} {...rest}>
      <line x1={70} y1={BEAM_Y} x2={505} y2={BEAM_Y} stroke="var(--ox)" strokeWidth={3} strokeLinecap="round" opacity={0.6} />

      <circle cx={50} cy={BEAM_Y} r={20} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={2} />
      <text x={50} y={BEAM_Y + 42} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        lamp
      </text>

      <rect x={140} y={BEAM_Y - 54} width={12} height={108} rx={2} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.6} />
      <line x1={146} y1={BEAM_Y - 44} x2={146} y2={BEAM_Y + 44} stroke="var(--accent)" strokeWidth={2} />
      <text x={146} y={BEAM_Y + 72} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        polariser
      </text>

      <rect x={230} y={BEAM_Y - 22} width={160} height={44} rx={8} fill={FILL[fillTone]} stroke="var(--glass-wall)" strokeWidth={1.6} />
      <text x={310} y={BEAM_Y + 44} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        {sampleLabel}
      </text>

      <rect x={420} y={BEAM_Y - 54} width={12} height={108} rx={2} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.6} />
      <line x1={426} y1={BEAM_Y - 44} x2={426} y2={BEAM_Y + 44} stroke="var(--accent)" strokeWidth={2} transform={`rotate(${angle} 426 ${BEAM_Y})`} />
      <text x={426} y={BEAM_Y + 72} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        analyser
      </text>

      <ellipse cx={520} cy={BEAM_Y} rx={20} ry={12} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.6} />
      <circle cx={520} cy={BEAM_Y} r={5} fill="var(--fg)" />
      <text x={520} y={BEAM_Y + 42} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        observer
      </text>

      {/* Plane of the light before the tube (vertical), and after it (turned by angle). */}
      <g fill="none" stroke="var(--fg-subtle)" strokeWidth={1.4}>
        <circle cx={146} cy={DIAL_Y} r={24} />
        <circle cx={426} cy={DIAL_Y} r={24} />
      </g>
      <line x1={146} y1={DIAL_Y - 20} x2={146} y2={DIAL_Y + 20} stroke="var(--e-arrow)" strokeWidth={2.6} strokeLinecap="round" />
      <line x1={426} y1={DIAL_Y - 20} x2={426} y2={DIAL_Y + 20} stroke="var(--e-arrow)" strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${angle} 426 ${DIAL_Y})`} />
      {angle !== 0 && <path d={arcPath(426, DIAL_Y, 36, angle)} fill="none" stroke="var(--dipole)" strokeWidth={2} />}

      <text x={146} y={28} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        before
      </text>
      <text x={426} y={28} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        after: α = {signed(angle)}
      </text>
    </g>
  )
}
