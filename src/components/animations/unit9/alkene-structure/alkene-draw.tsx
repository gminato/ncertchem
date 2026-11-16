import type { Point, PlacedGroup } from '@/lib/chem/alkene-geometry'
import { GROUP_LABEL } from '@/lib/chem/alkene-geometry'

/** Pixels per bond for the C4H8 skeletal drawings. */
export const ISOMER_SCALE = 62
/** Pixels between the two alkene carbons in the planar but-2-ene drawings. */
export const BUTENE_SCALE = 84
/** NCERT's stated dipole moment of cis-but-2-ene, in debye (Section 9.3.3, PDF p. 15). */
export const NCERT_CIS_DIPOLE_D = 0.33

const SUBSCRIPT: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** Digits of a formula written as subscripts, e.g. 'C4H8' gives 'C₄H₈'. */
export function subscriptDigits(formula: string): string {
  return formula.replace(/\d/g, (d) => SUBSCRIPT[d])
}

/**
 * Where a group's label sits: just beyond the group's bond end, pushed away from the carbon. The
 * anchor is 'middle' for a label above or below the bond and 'start' or 'end' for one to the side.
 */
export function groupAnchor(from: Point, to: Point): { x: number; y: number; textAnchor: 'start' | 'middle' | 'end' } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const reach = 16
  const textAnchor = Math.abs(ux) < 0.3 ? 'middle' : ux > 0 ? 'start' : 'end'
  return { x: to.x + ux * reach, y: to.y + uy * reach, textAnchor }
}

/**
 * A net-dipole arrow centred on `centre`. The arrow points from δ+ to δ−, in screen coordinates
 * (the drawing's y axis is flipped). Nothing is drawn when the dipole cancels.
 */
export function dipoleArrow(dipole: Point, centre: Point, tipId: string, polar: boolean) {
  if (!polar) return null
  const len = Math.hypot(dipole.x, dipole.y) || 1
  const ux = dipole.x / len
  const uy = -dipole.y / len
  const half = 24
  const start = { x: centre.x - ux * half, y: centre.y - uy * half }
  const end = { x: centre.x + ux * half, y: centre.y + uy * half }
  return (
    <g>
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="var(--dipole)" strokeWidth={4} strokeLinecap="round" markerEnd={`url(#${tipId})`} />
      <text x={start.x + 16} y={start.y} textAnchor="start" dominantBaseline="central" fontSize={15} fill="var(--delta-plus)" fontFamily="var(--font-sans)">
        δ+
      </text>
      <text x={end.x + 16} y={end.y} textAnchor="start" dominantBaseline="central" fontSize={15} fill="var(--delta-minus)" fontFamily="var(--font-sans)">
        δ−
      </text>
    </g>
  )
}

export interface IsomerDrawingProps {
  /** Where each group sits in the drawing's units (C=C from (0, 0) to (1, 0), groups at ±0.87 up and down). */
  placed: readonly PlacedGroup[]
  dipole: Point
  polar: boolean
  /** The name shown under the drawing. */
  title: string
  /** A line under the title: the dipole note. */
  note: string
  /** Centre of the drawing. */
  cx: number
  cy: number
  /** The id of the arrowhead marker in the parent SVG. */
  tipId: string
  /** Pixels between the two alkene carbons. */
  scale?: number
}

/** A planar drawing of an alkene with its group labels, its net dipole arrow and a title. */
export function IsomerDrawing({ placed, dipole, polar, title, note, cx, cy, tipId, scale = BUTENE_SCALE }: IsomerDrawingProps) {
  const S = scale
  const c1 = { x: cx - S / 2, y: cy }
  const c2 = { x: cx + S / 2, y: cy }
  return (
    <g>
      <line x1={c1.x} y1={c1.y - 4} x2={c2.x} y2={c2.y - 4} stroke="var(--sigma-bond)" strokeWidth={4} strokeLinecap="round" />
      <line x1={c1.x} y1={c1.y + 4} x2={c2.x} y2={c2.y + 4} stroke="var(--sigma-bond)" strokeWidth={4} strokeLinecap="round" />
      {placed.map((p, k) => {
        const from = p.carbon === 'left' ? c1 : c2
        const to = { x: from.x + (p.at.x - (p.carbon === 'left' ? 0 : 1)) * S, y: cy - p.at.y * S }
        const anchor = groupAnchor(from, to)
        return (
          <g key={k}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="var(--sigma-bond)" strokeWidth={3} strokeLinecap="round" />
            <text
              x={anchor.x}
              y={anchor.y}
              textAnchor={anchor.textAnchor}
              dominantBaseline="central"
              fontSize={18}
              fontWeight={600}
              fill={p.group === 'H' ? 'var(--fg-muted)' : 'var(--fg)'}
              fontFamily="var(--font-sans)"
            >
              {GROUP_LABEL[p.group]}
            </text>
          </g>
        )
      })}
      {dipoleArrow(dipole, { x: cx, y: cy + 98 }, tipId, polar)}
      <text x={cx} y={cy + 150} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        {title}
      </text>
      <text x={cx} y={cy + 172} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {note}
      </text>
    </g>
  )
}
