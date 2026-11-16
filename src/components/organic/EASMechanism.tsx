import React, { forwardRef } from 'react'
import { AreniumIon, areniumAnchors } from './AreniumIon'
import { revealFraction, stageOpacity } from './hydrocarbon-geometry'

/** Size of the nitration mechanism strip, for a parent viewBox. */
export const EAS_MECHANISM_SIZE = { width: 900, height: 290 } as const

type Pt = { x: number; y: number }
const deg = (d: number) => (d * Math.PI) / 180
/** Bond length of every ring in the strip: 40 units. */
const R = 40

const INK = 'var(--fg)'
const SIGMA = 'var(--sigma-bond)'
const PI = 'var(--pi-lobe)'
const STAGES = 3

/** Each stage has its own column, with its caption under it. Centres of the columns. */
const COL1 = 130
const COL2 = 450
const COL3 = 770
/** Height of the structures' centre line. */
const CY = 120
/** The σ-complex is drawn at this scale so that its dashed horseshoe and labels fit the column. */
const SIGMA_SCALE = 0.85
/** Caption line under every column. */
const CAPTION_Y = 250

/** A point in the σ-complex's own frame (origin at the ring centre, as AreniumIon draws it) mapped to the strip. */
function onSigma(u: number, v: number): Pt {
  return { x: COL2 + SIGMA_SCALE * (u - 30), y: CY + SIGMA_SCALE * v }
}

function ringVertices(cx: number, cy: number) {
  return [0, 1, 2, 3, 4, 5].map((k) => ({ x: cx + R * Math.cos(deg(60 * k)), y: cy + R * Math.sin(deg(60 * k)) }))
}

/** Benzene drawn with its inscribed circle. */
function Ring({ cx, cy }: { cx: number; cy: number }) {
  const v = ringVertices(cx, cy)
  return (
    <g>
      <circle cx={cx} cy={cy} r={R * 0.58} fill="none" stroke={PI} strokeWidth={2} strokeOpacity={0.6} />
      {v.map((p, k) => {
        const q = v[(k + 1) % 6]
        return <line key={k} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={SIGMA} strokeWidth={4} strokeLinecap="round" />
      })}
    </g>
  )
}

/** A label on a white halo, so bonds pass behind it cleanly. */
function Label({ x, y, anchor = 'middle', size = 18, weight = 600, children, fill = INK }: { x: number; y: number; anchor?: 'start' | 'middle' | 'end'; size?: number; weight?: number; children: string; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={size} fontWeight={weight} fontFamily="var(--font-sans)" fill={fill} stroke="var(--surface)" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  )
}

/** Caption under a column. */
function Caption({ x, children }: { x: number; children: string }) {
  return (
    <text x={x} y={CAPTION_Y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={INK}>
      {children}
    </text>
  )
}

/** A quadratic curve with a filled head at the end, pointing along the last control leg. */
function CurvedPath({ p0, c, p1, opacity }: { p0: Pt; c: Pt; p1: Pt; opacity: number }) {
  const dx = p1.x - c.x
  const dy = p1.y - c.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const head = 9
  const back = { x: p1.x - ux * head, y: p1.y - uy * head }
  const l = { x: back.x - uy * 5, y: back.y + ux * 5 }
  const r = { x: back.x + uy * 5, y: back.y - ux * 5 }
  return (
    <g opacity={opacity} stroke={INK} fill={INK}>
      <path d={`M${p0.x},${p0.y} Q${c.x},${c.y} ${back.x},${back.y}`} fill="none" strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M${p1.x},${p1.y} L${l.x},${l.y} L${r.x},${r.y} Z`} strokeWidth={0.6} />
    </g>
  )
}

/** Nitration of benzene in three stages: π attack, σ-complex with base removal, and the restored ring. */
export interface EASMechanismProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1 through the three stages. */
  progress?: number
  x?: number
  y?: number
}

export const EASMechanism = forwardRef<SVGGElement, EASMechanismProps>(function EASMechanism({ progress = 1, x = 0, y = 0, ...rest }, ref) {
  const p = Math.min(1, Math.max(0, progress))
  const a1 = revealFraction(p, 0, 1 / STAGES)
  const a2 = revealFraction(p, 1 / STAGES, 2 / STAGES)
  const a3 = revealFraction(p, 2 / STAGES, 1)
  const stage = (i: number) => stageOpacity(p, STAGES, i)

  // Stage 1: benzene's π bond on the right-hand edge (vertices 0 and 5) and the N of NO₂⁺, O=N⁺=O.
  const ring1 = { cx: COL1 - 40, cy: CY }
  const v0 = { x: ring1.cx + R, y: CY }
  const v5 = { x: ring1.cx + R * Math.cos(deg(300)), y: CY + R * Math.sin(deg(300)) }
  const edgeMid = { x: (v0.x + v5.x) / 2, y: (v0.y + v5.y) / 2 }
  const out = { x: edgeMid.x - ring1.cx, y: edgeMid.y - CY }
  const outLen = Math.hypot(out.x, out.y)
  const piStart = { x: edgeMid.x + (out.x / outLen) * 8, y: edgeMid.y + (out.y / outLen) * 8 }
  const nitrogen = { x: COL1 + 56, y: CY }
  const nitroTip = { x: nitrogen.x - 6, y: nitrogen.y - 14 }

  // Stage 2: the σ-complex. The sp³ carbon is vertex 0 of the ring; its H is at the upper right.
  const anchors = areniumAnchors('NO2')
  const C0 = onSigma(anchors.C0.x, anchors.C0.y)
  const H = onSigma(anchors.H.x, anchors.H.y)
  const B = onSigma(118, -92)
  // C–H electrons move into the ring, to the bond beside the sp³ carbon.
  const ringBondTip = onSigma(58.8, -33.9)
  const chMid = { x: (C0.x + H.x) / 2, y: (C0.y + H.y) / 2 }

  // Stage 3: nitrobenzene, with the ring centre left of the column so NO₂ fits to its right.
  const ring3 = { cx: COL3 - 50, cy: CY }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Stage 1 */}
      <g opacity={stage(0)}>
        <Ring cx={ring1.cx} cy={ring1.cy} />
        <Label x={COL1 + 62} y={CY} size={22} weight={600}>{'O=N⁺=O'}</Label>
        <g opacity={a1}>
          <CurvedPath p0={piStart} c={{ x: COL1 + 18, y: CY - 66 }} p1={nitroTip} opacity={1} />
        </g>
        <Caption x={COL1}>{'1  π cloud attacks NO₂⁺'}</Caption>
      </g>

      {/* Stage 2: the σ-complex, and the base B: removing H⁺ */}
      <g opacity={stage(1)}>
        <g transform={`translate(${COL2}, ${CY}) scale(${SIGMA_SCALE})`}>
          <AreniumIon electrophile="NO2" x={0} y={0} />
        </g>
        <g opacity={a2}>
          {/* Lone pair on the base, then the arrow from it to the H of the sp³ carbon */}
          <Label x={B.x} y={B.y} size={20} weight={700}>{'B:'}</Label>
          <CurvedPath p0={{ x: B.x - 8, y: B.y + 12 }} c={{ x: B.x - 6, y: B.y + 30 }} p1={{ x: H.x - 4, y: H.y - 12 }} opacity={1} />
          {/* The C–H bond electrons move into the ring */}
          <CurvedPath p0={{ x: chMid.x + 4, y: chMid.y - 4 }} c={{ x: chMid.x + 2, y: chMid.y - 26 }} p1={ringBondTip} opacity={1} />
        </g>
        <Caption x={COL2}>{'2  σ-complex: aromaticity lost'}</Caption>
      </g>

      {/* Stage 3: nitrobenzene, with H–B⁺ leaving */}
      <g opacity={stage(2)}>
        <Ring cx={ring3.cx} cy={ring3.cy} />
        <line x1={ring3.cx + R} y1={CY} x2={ring3.cx + R + 36} y2={CY} stroke={SIGMA} strokeWidth={4} strokeLinecap="round" />
        <Label x={ring3.cx + R + 42} y={CY} anchor="start">{'NO₂'}</Label>
        <Caption x={COL3}>{'3  H⁺ lost: ring restored'}</Caption>
      </g>

      {/* Reaction arrows between the columns, in the gaps */}
      <g opacity={a1} stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none">
        <line x1={248} x2={316} y1={CY} y2={CY} />
        <path d={`M${316 - 9},${CY - 6} L316,${CY} L${316 - 9},${CY + 6}`} />
      </g>
      <g opacity={a3} stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none">
        <line x1={586} x2={664} y1={CY} y2={CY} />
        <path d={`M${664 - 9},${CY - 6} L664,${CY} L${664 - 9},${CY + 6}`} />
      </g>
    </g>
  )
})
