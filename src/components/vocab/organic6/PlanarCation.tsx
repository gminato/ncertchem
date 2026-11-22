import type { ReactNode, SVGAttributes } from 'react'

/** Drawing box for a planar sp² carbocation. */
export const PLANAR_CATION_SIZE = { width: 560, height: 360 } as const

const CX = PLANAR_CATION_SIZE.width / 2
const CY = PLANAR_CATION_SIZE.height / 2
const R = 112
/** The trigonal plane is seen slightly from above: the in-plane y offsets are scaled by this. */
const TILT = 0.32
const LOBE_OFFSET = 46
const LOBE_RX = 12
const LOBE_RY = 24

export interface PlanarCationProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** The three groups on carbon. Default three CH₃ (the tert-butyl cation). */
  groups?: readonly [ReactNode, ReactNode, ReactNode]
  /** Nucleophile attacking the empty p orbital from above. Default false. */
  attackTop?: boolean
  /** Nucleophile attacking the empty p orbital from below. Default false. */
  attackBottom?: boolean
  /** Label of the attacking nucleophile. Default Nu⁻. */
  nucleophile?: ReactNode
  x?: number
  y?: number
}

/** Projected screen position of a group at angle `deg` in the plane (0 = right, screen down positive). */
function groupAt(deg: number): { x: number; y: number } {
  const th = (deg * Math.PI) / 180
  return { x: CX + R * Math.cos(th), y: CY + TILT * R * Math.sin(th) }
}

const GROUP_ANGLES = [0, 120, 240] as const

function Arrow({ from, to }: { from: { x: number; y: number }; to: { x: number; y: number } }) {
  const ang = Math.atan2(to.y - from.y, to.x - from.x)
  const h = 9
  const left = { x: to.x - h * Math.cos(ang - 0.45), y: to.y - h * Math.sin(ang - 0.45) }
  const right = { x: to.x - h * Math.cos(ang + 0.45), y: to.y - h * Math.sin(ang + 0.45) }
  return (
    <g stroke="var(--e-arrow)" strokeWidth={2.6} strokeLinecap="round" fill="var(--e-arrow)">
      <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
      <path d={`M${to.x} ${to.y} L${left.x.toFixed(2)} ${left.y.toFixed(2)} L${right.x.toFixed(2)} ${right.y.toFixed(2)} Z`} stroke="none" />
    </g>
  )
}

/**
 * A planar sp² carbocation: three groups in the trigonal plane, drawn in perspective, with the empty
 * p orbital as two lobes (opposite phases) above and below. Attack from the top or bottom face is
 * shown with an electron-pair arrow.
 */
export function PlanarCation({
  groups = ['CH₃', 'CH₃', 'CH₃'],
  attackTop = false,
  attackBottom = false,
  nucleophile = 'Nu⁻',
  x = 0,
  y = 0,
  ...rest
}: PlanarCationProps) {
  const tips = GROUP_ANGLES.map(groupAt)
  return (
    <g transform={`translate(${x} ${y})`} {...rest}>
      <ellipse cx={CX} cy={CY} rx={R + 10} ry={(R + 10) * TILT} fill="var(--accent-soft)" stroke="var(--border)" strokeDasharray="4 4" />

      <ellipse cx={CX} cy={CY - LOBE_OFFSET} rx={LOBE_RX} ry={LOBE_RY} fill="var(--orbital-pos)" fillOpacity={0.18} stroke="var(--orbital-pos)" strokeWidth={1.8} strokeDasharray="4 4" />
      <ellipse cx={CX} cy={CY + LOBE_OFFSET} rx={LOBE_RX} ry={LOBE_RY} fill="var(--orbital-neg)" fillOpacity={0.18} stroke="var(--orbital-neg)" strokeWidth={1.8} strokeDasharray="4 4" />

      {tips.map((t, i) => {
        const dx = t.x - CX
        const len = Math.hypot(dx, t.y - CY)
        const ux = dx / len
        const uy = (t.y - CY) / len
        return (
          <line key={`b${i}`} x1={CX + ux * 16} y1={CY + uy * 16} x2={t.x - ux * 2} y2={t.y - uy * 2} stroke="var(--bond)" strokeWidth={2.8} strokeLinecap="round" />
        )
      })}

      {tips.map((t, i) => {
        const dx = t.x - CX
        const anchor = Math.abs(dx) < 4 ? 'middle' : dx > 0 ? 'start' : 'end'
        const lx = anchor === 'start' ? t.x + 10 : anchor === 'end' ? t.x - 10 : t.x
        const ly = t.y + (t.y < CY ? -12 : 14)
        return (
          <text key={`g${i}`} x={lx} y={ly} textAnchor={anchor} dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {groups[i]}
          </text>
        )
      })}

      <circle cx={CX} cy={CY} r={12} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.4} />
      <text x={CX - 1} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      <text x={CX + 8} y={CY - 12} textAnchor="start" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        +
      </text>

      {attackTop && (
        <g>
          <text x={CX} y={CY - 124} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--lone-pair)">
            {nucleophile}
          </text>
          <Arrow from={{ x: CX, y: CY - 106 }} to={{ x: CX, y: CY - LOBE_OFFSET - LOBE_RY - 2 }} />
        </g>
      )}
      {attackBottom && (
        <g>
          <text x={CX} y={CY + 124} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--lone-pair)">
            {nucleophile}
          </text>
          <Arrow from={{ x: CX, y: CY + 106 }} to={{ x: CX, y: CY + LOBE_OFFSET + LOBE_RY + 2 }} />
        </g>
      )}
    </g>
  )
}
