import type { ReactNode, SVGAttributes } from 'react'
import { stereoPath } from '@/components/organic/frame'
import { stereoLayout, type Pt } from './geometry'

/** Drawing box for a stereocentre. Labels sit inside it at 16 units or larger. */
export const STEREO_SIZE = { width: 560, height: 340 } as const

const CX = STEREO_SIZE.width / 2
const CY = STEREO_SIZE.height / 2
const LENGTH = 112
const TIP_R = 11
const WEDGE_HALF = 6
const BRACKET_OFFSET = 92
const BRACKET_HALF_HEIGHT = 140

export interface StereoGroup {
  label: ReactNode
  /** Any CSS colour, usually a token from tones.ts. Colours the group's tip and bond. */
  tone?: string
  /** 0 to 1. Below 1 the bond is dashed and the group fades; 0 shows the group with no bond yet. Default 1. */
  bondOrder?: number
}

export interface StereoCentreProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** The three umbrella groups, drawn wedge, plain or dash. */
  umbrella: readonly [StereoGroup, StereoGroup, StereoGroup]
  /** The fourth group, on the right of the axis. Ignored when `leaving` is given. */
  axial?: StereoGroup
  /** A group on the left of the axis: the nucleophile coming in. */
  incoming?: StereoGroup
  /** A group on the right of the axis: the leaving group. Replaces `axial` on the right. */
  leaving?: StereoGroup
  /** 0 = umbrella opening left (reactant), 0.5 = three groups flat (transition state), 1 = flipped (product). Default 0. */
  invert?: number
  /** Reflect left to right: the mirror image. Default false. */
  mirror?: boolean
  /** Square brackets with a double dagger around the whole drawing. Default false. */
  bracketTS?: boolean
  x?: number
  y?: number
}

/** -1 when the group sits left of the carbon, +1 when right (after mirroring). */
function sideOf(tip: Pt): number {
  return tip.x < CX ? -1 : 1
}

function AxisBond({ group, tip }: { group: StereoGroup; tip: Pt }) {
  const b = group.bondOrder ?? 1
  if (b <= 0.001) return null
  const sd = sideOf(tip)
  return (
    <line
      x1={CX + sd * 6}
      y1={CY}
      x2={tip.x - sd * TIP_R}
      y2={CY}
      stroke="var(--fg)"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeDasharray={b >= 0.999 ? undefined : '6 5'}
    />
  )
}

function AxisGroupMark({ group, tip }: { group: StereoGroup; tip: Pt }) {
  const b = group.bondOrder ?? 1
  const opacity = b >= 0.999 ? 1 : 0.5 + 0.5 * Math.max(0, b)
  const sd = sideOf(tip)
  return (
    <g opacity={opacity}>
      <Tip at={tip} tone={group.tone ?? 'var(--bond)'} />
      <GroupLabel at={{ x: tip.x + sd * (TIP_R + 6), y: CY }} anchor={sd < 0 ? 'end' : 'start'}>
        {group.label}
      </GroupLabel>
    </g>
  )
}

function Tip({ at, tone, opacity = 1 }: { at: Pt; tone: string; opacity?: number }) {
  return <circle cx={at.x} cy={at.y} r={TIP_R} fill={tone} opacity={opacity} />
}

function GroupLabel({ at, anchor, dy = 0, opacity = 1, children }: { at: Pt; anchor: 'start' | 'middle' | 'end'; dy?: number; opacity?: number; children: ReactNode }) {
  return (
    <text
      x={at.x}
      y={at.y + dy}
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={17}
      fontWeight={600}
      fontFamily="var(--font-sans)"
      fill="var(--fg)"
      opacity={opacity}
    >
      {children}
    </text>
  )
}

/** Where a label goes for a tip: outward from the carbon, on whichever side the tip lies. */
function outward(tip: Pt): { at: Pt; anchor: 'start' | 'middle' | 'end'; dy: number } {
  const dx = tip.x - CX
  const dy = tip.y - CY
  const len = Math.hypot(dx, dy) || 1
  const reach = TIP_R + 14
  const at = { x: tip.x + (dx / len) * reach, y: tip.y + (dy / len) * reach }
  if (Math.abs(dx) < 8) return { at, anchor: 'middle', dy: dy < 0 ? -4 : 4 }
  return { at, anchor: dx < 0 ? 'end' : 'start', dy: 0 }
}

/**
 * A tetrahedral carbon with three umbrella groups and one axial group, drawn wedge / dash.
 * It draws an SN2 reactant (leaving), its transition state (incoming + leaving, invert 0.5),
 * its inverted product (incoming, invert 1) and a chiral carbon with its mirror image (mirror).
 */
export function StereoCentre({
  umbrella,
  axial,
  incoming,
  leaving,
  invert = 0,
  mirror = false,
  bracketTS = false,
  x = 0,
  y = 0,
  ...rest
}: StereoCentreProps) {
  const layout = stereoLayout({ invert, mirror, cx: CX, cy: CY, length: LENGTH })
  const right = leaving ?? axial
  const rightGroup = right && { tip: layout.right, group: right }
  const leftGroup = incoming && { tip: layout.left, group: incoming }
  const centre = layout.centre
  const toneOf = (g: StereoGroup) => g.tone ?? 'var(--bond)'

  return (
    <g transform={`translate(${x} ${y})`} {...rest}>
      {bracketTS && (
        <g stroke="var(--fg)" strokeWidth={2} fill="none" strokeLinecap="square">
          <path d={`M${CX - LENGTH - BRACKET_OFFSET + 8} ${CY - BRACKET_HALF_HEIGHT} H${CX - LENGTH - BRACKET_OFFSET} V${CY + BRACKET_HALF_HEIGHT} H${CX - LENGTH - BRACKET_OFFSET + 8}`} />
          <path d={`M${CX + LENGTH + BRACKET_OFFSET - 8} ${CY - BRACKET_HALF_HEIGHT} H${CX + LENGTH + BRACKET_OFFSET} V${CY + BRACKET_HALF_HEIGHT} H${CX + LENGTH + BRACKET_OFFSET - 8}`} />
          <text x={CX + LENGTH + BRACKET_OFFSET + 4} y={CY - BRACKET_HALF_HEIGHT + 2} dominantBaseline="hanging" fontSize={20} fontFamily="var(--font-sans)" fill="var(--fg)" stroke="none">
            ‡
          </text>
        </g>
      )}

      {/* Axis bonds first, so the wedges and groups sit on top of them. */}
      {leftGroup && <AxisBond group={leftGroup.group} tip={leftGroup.tip} />}
      {rightGroup && <AxisBond group={rightGroup.group} tip={rightGroup.tip} />}

      {/* Umbrella bonds: wedge (towards the viewer), dash (away) or plain. */}
      {layout.umbrella.map((u, i) => {
        const g = umbrella[i]
        const tipEdge = { x: u.tip.x, y: u.tip.y }
        if (u.z > 0.05) {
          return <path key={`u${i}`} d={stereoPath(centre, tipEdge, 'wedge', WEDGE_HALF)} fill="var(--fg)" />
        }
        if (u.z < -0.05) {
          return <path key={`u${i}`} d={stereoPath(centre, tipEdge, 'dash', WEDGE_HALF)} fill="none" stroke="var(--fg)" strokeWidth={1.8} />
        }
        return <line key={`u${i}`} x1={centre.x} y1={centre.y} x2={tipEdge.x} y2={tipEdge.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
      })}

      <circle cx={centre.x} cy={centre.y} r={3} fill="var(--fg)" />

      {umbrella.map((g, i) => {
        const tip = layout.umbrella[i].tip
        const lab = outward(tip)
        return (
          <g key={`ug${i}`}>
            <Tip at={tip} tone={toneOf(g)} />
            <GroupLabel at={lab.at} anchor={lab.anchor} dy={lab.dy}>
              {g.label}
            </GroupLabel>
          </g>
        )
      })}

      {leftGroup && <AxisGroupMark group={leftGroup.group} tip={leftGroup.tip} />}
      {rightGroup && <AxisGroupMark group={rightGroup.group} tip={rightGroup.tip} />}
    </g>
  )
}
