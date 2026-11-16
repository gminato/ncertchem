import React, { forwardRef } from 'react'
import { AreniumIon, ARENIUM_CENTRE_X, areniumAnchors } from './AreniumIon'
import { revealFraction, stageOpacity } from './hydrocarbon-geometry'

/** Size of the nitration mechanism strip, for a parent viewBox. */
export const EAS_MECHANISM_SIZE = { width: 900, height: 290 } as const

type Pt = { x: number; y: number }
const deg = (d: number) => (d * Math.PI) / 180
/** Bond length of every structure in the strip: 40 units. */
const R = 40

const INK = 'var(--fg)'
const SIGMA = 'var(--sigma-bond)'
const PI = 'var(--pi-lobe)'
const STAGES = 3

/** Centre of stage 1 (benzene), stage 2 (σ-complex) and stage 3 (nitrobenzene); the σ-complex box is centred on its x. */
const CX1 = 96
const CY = 128
const CX2 = 440
const CX3 = 672

function ring(cx: number, cy: number) {
  const v = [0, 1, 2, 3, 4, 5].map((k) => ({ x: cx + R * Math.cos(deg(60 * k)), y: cy + R * Math.sin(deg(60 * k)) }))
  return v
}

function Ring({ cx, cy }: { cx: number; cy: number }) {
  const v = ring(cx, cy)
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

  // Stage 2 geometry, in the parent frame (the σ-complex box is centred on CX2).
  const ringX2 = CX2 - ARENIUM_CENTRE_X
  const anchors = areniumAnchors('NO2')
  const C0 = { x: ringX2 + anchors.C0.x, y: CY + anchors.C0.y }
  const H = { x: ringX2 + anchors.H.x, y: CY + anchors.H.y }
  const B = { x: 650, y: 66 }

  // Stage 1 arrow: from the π bond at ring vertex 0-5 to the nitrogen of the nitronium ion.
  const v5 = { x: CX1 + R * Math.cos(deg(300)), y: CY + R * Math.sin(deg(300)) }
  const v0 = { x: CX1 + R, y: CY }
  const mid = { x: (v0.x + v5.x) / 2, y: (v0.y + v5.y) / 2 }
  const outward = { x: mid.x - CX1, y: mid.y - CY }
  const ol = Math.hypot(outward.x, outward.y)
  const piStart = { x: mid.x + (outward.x / ol) * 14, y: mid.y + (outward.y / ol) * 14 }

  const stage = (i: number) => stageOpacity(p, STAGES, i)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Stage 1: benzene and the nitronium ion O=N⁺=O */}
      <g opacity={stage(0)}>
        <Ring cx={CX1} cy={CY} />
        <Label x={CX1} y={CY + 80} size={16} weight={600} fill={INK}>{'1  π cloud attacks NO₂⁺'}</Label>
        <g stroke={INK} strokeWidth={2.2} strokeLinecap="round">
          <line x1={190} x2={216} y1={CY - 3} y2={CY - 3} />
          <line x1={190} x2={216} y1={CY + 3} y2={CY + 3} />
          <line x1={244} x2={270} y1={CY - 3} y2={CY - 3} />
          <line x1={244} x2={270} y1={CY + 3} y2={CY + 3} />
        </g>
        <Label x={184} y={CY}>O</Label>
        <Label x={230} y={CY}>N⁺</Label>
        <Label x={276} y={CY}>O</Label>
        <g opacity={a1}>
          <CurvedPath p0={piStart} c={{ x: 176, y: CY - 52 }} p1={{ x: 214, y: CY - 14 }} opacity={1} />
        </g>
      </g>

      {/* Stage 2: the σ-complex and the base B: removing H⁺ */}
      <g opacity={stage(1)}>
        <AreniumIon electrophile="NO2" x={CX2} y={CY} />
        <Label x={CX2} y={CY + 118} size={16} weight={600}>{'2  σ-complex: aromaticity lost'}</Label>
        <g opacity={a2}>
          {/* Lone pair on the base B: to the H of the sp³ carbon */}
          <circle cx={B.x - 14} cy={B.y - 8} r={2.4} fill={INK} />
          <circle cx={B.x - 14} cy={B.y + 6} r={2.4} fill={INK} />
          <Label x={B.x} y={B.y} size={20} weight={700}>B:</Label>
          <CurvedPath p0={{ x: B.x - 16, y: B.y - 2 }} c={{ x: 582, y: 40 }} p1={{ x: H.x + 4, y: H.y - 12 }} opacity={1} />
          {/* The C–H bond electrons move into the ring */}
          <CurvedPath
            p0={{ x: (C0.x + H.x) / 2 + 6, y: (C0.y + H.y) / 2 + 4 }}
            c={{ x: C0.x + 30, y: C0.y - 26 }}
            p1={{ x: C0.x + 2, y: C0.y - 24 }}
            opacity={1}
          />
        </g>
      </g>

      {/* Stage 3: nitrobenzene, and H–B⁺ leaving */}
      <g opacity={stage(2)}>
        <Ring cx={CX3} cy={CY} />
        <line x1={CX3 + R} y1={CY} x2={CX3 + R + 38} y2={CY} stroke={SIGMA} strokeWidth={4} strokeLinecap="round" />
        <Label x={CX3 + R + 44} y={CY} anchor="start">NO₂</Label>
        <Label x={CX3 + R + 118} y={CY}>+</Label>
        <Label x={CX3 + R + 176} y={CY} anchor="middle">H–B⁺</Label>
        <Label x={CX3} y={CY + 80} size={16} weight={600}>{'3  H⁺ removed: ring restored'}</Label>
      </g>

      {/* Reaction arrow between stages 2 and 3 */}
      <g opacity={a3}>
        <line x1={590} x2={622} y1={CY} y2={CY} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
        <path d={`M614,${CY - 6} L622,${CY} L614,${CY + 6}`} fill="none" stroke={INK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  )
})
