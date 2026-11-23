'use client'

import React from 'react'
import { CurvedArrow } from '@/components/organic'

export interface ResonanceFormSpec {
  /** Ring double-bond edges (0 = C1-C2, 1 = C2-C3, 2 = C3-C4, 3 = C4-C5, 4 = C5-C6, 5 = C6-C1). */
  doubleEdges: readonly number[]
  /** Bond order from C1 (top vertex) to oxygen: 1 or 2. */
  c1OOrder: 1 | 2
  /** Number of lone pairs to draw around oxygen (1, 2, or 3). */
  oxygenLonePairs: 1 | 2 | 3
  /** Whether oxygen bears an attached H (phenol) or not (phenoxide). */
  hasH: boolean
  /** Formal charge on oxygen: +1, 0, or -1. */
  oxygenCharge: -1 | 0 | 1
  /** Ring vertex index (1 = C2, 3 = C4, 5 = C6) carrying formal negative charge, or null. */
  ringChargeAt: 1 | 3 | 5 | null
  /** Optional Roman numeral or caption tag below the ring. */
  label?: string
  /** Optional curved electron-pushing arrows from this contributor to the next. */
  arrows?: 'phenol-1' | 'phenol-2' | 'phenol-3' | 'phenol-4' | 'phenoxide-1' | 'phenoxide-2' | 'phenoxide-3' | 'phenoxide-4'
}

export const PHENOL_RESONANCE_FORMS: readonly ResonanceFormSpec[] = [
  {
    doubleEdges: [0, 2, 4],
    c1OOrder: 1,
    oxygenLonePairs: 2,
    hasH: true,
    oxygenCharge: 0,
    ringChargeAt: null,
    label: 'I',
    arrows: 'phenol-1',
  },
  {
    doubleEdges: [2, 4],
    c1OOrder: 2,
    oxygenLonePairs: 1,
    hasH: true,
    oxygenCharge: 1,
    ringChargeAt: 1,
    label: 'II',
    arrows: 'phenol-2',
  },
  {
    doubleEdges: [1, 4],
    c1OOrder: 2,
    oxygenLonePairs: 1,
    hasH: true,
    oxygenCharge: 1,
    ringChargeAt: 3,
    label: 'III',
    arrows: 'phenol-3',
  },
  {
    doubleEdges: [1, 3],
    c1OOrder: 2,
    oxygenLonePairs: 1,
    hasH: true,
    oxygenCharge: 1,
    ringChargeAt: 5,
    label: 'IV',
    arrows: 'phenol-4',
  },
  {
    doubleEdges: [1, 3, 5],
    c1OOrder: 1,
    oxygenLonePairs: 2,
    hasH: true,
    oxygenCharge: 0,
    ringChargeAt: null,
    label: 'V',
  },
] as const

export const PHENOXIDE_RESONANCE_FORMS: readonly ResonanceFormSpec[] = [
  {
    doubleEdges: [0, 2, 4],
    c1OOrder: 1,
    oxygenLonePairs: 3,
    hasH: false,
    oxygenCharge: -1,
    ringChargeAt: null,
    label: 'I',
    arrows: 'phenoxide-1',
  },
  {
    doubleEdges: [2, 4],
    c1OOrder: 2,
    oxygenLonePairs: 2,
    hasH: false,
    oxygenCharge: 0,
    ringChargeAt: 1,
    label: 'II',
    arrows: 'phenoxide-2',
  },
  {
    doubleEdges: [1, 4],
    c1OOrder: 2,
    oxygenLonePairs: 2,
    hasH: false,
    oxygenCharge: 0,
    ringChargeAt: 3,
    label: 'III',
    arrows: 'phenoxide-3',
  },
  {
    doubleEdges: [1, 3],
    c1OOrder: 2,
    oxygenLonePairs: 2,
    hasH: false,
    oxygenCharge: 0,
    ringChargeAt: 5,
    label: 'IV',
    arrows: 'phenoxide-4',
  },
  {
    doubleEdges: [1, 3, 5],
    c1OOrder: 1,
    oxygenLonePairs: 3,
    hasH: false,
    oxygenCharge: -1,
    ringChargeAt: null,
    label: 'V',
  },
] as const

const DEG = Math.PI / 180

/** Upright benzene vertex `k` (0 = C1 top, 1 = C2 ortho-R, 2 = C3 meta-R, 3 = C4 para, 4 = C5 meta-L, 5 = C6 ortho-L). */
export function ringVertex(cx: number, cy: number, r: number, k: number): { x: number; y: number } {
  const th = (-90 + 60 * k) * DEG
  return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) }
}

function innerDoubleSegment(
  p: { x: number; y: number },
  q: { x: number; y: number },
  cx: number,
  cy: number,
  offset: number
) {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len
  let ny = dx / len
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2
  if (nx * (cx - mx) + ny * (cy - my) < 0) {
    nx = -nx
    ny = -ny
  }
  const shrink = 0.16
  return {
    x1: p.x + dx * shrink + nx * offset,
    y1: p.y + dy * shrink + ny * offset,
    x2: q.x - dx * shrink + nx * offset,
    y2: q.y - dy * shrink + ny * offset,
  }
}

/** Pair of lone-pair electron dots centred at (px, py) aligned perpendicular to `angleRad`. */
export function LonePairDots({
  px,
  py,
  angleRad = 0,
  dotRadius = 2.2,
  spread = 3.2,
  fill = 'var(--fg)',
}: {
  px: number
  py: number
  angleRad?: number
  dotRadius?: number
  spread?: number
  fill?: string
}) {
  const ux = Math.cos(angleRad)
  const uy = Math.sin(angleRad)
  return (
    <g fill={fill}>
      <circle cx={px - ux * spread} cy={py - uy * spread} r={dotRadius} />
      <circle cx={px + ux * spread} cy={py + uy * spread} r={dotRadius} />
    </g>
  )
}

/** Small circular formal-charge badge (+ or −), guaranteed >= 15 viewBox font size. */
export function ChargeBadge({
  x,
  y,
  sign,
  tone,
}: {
  x: number
  y: number
  sign: '+' | '−'
  tone: string
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={9.5} fill="var(--surface)" stroke={tone} strokeWidth={1.6} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={tone}
      >
        {sign}
      </text>
    </g>
  )
}

/** Double-headed resonance arrow (↔) drawn cleanly with vector arrowheads. */
export function ResonanceArrow({ x, y, width = 28 }: { x: number; y: number; width?: number }) {
  const half = width / 2
  return (
    <g stroke="var(--fg-muted)" fill="var(--fg-muted)" strokeWidth={2} strokeLinecap="round">
      <line x1={x - half + 6} y1={y} x2={x + half - 6} y2={y} />
      <polygon points={`${x - half},${y} ${x - half + 8},${y - 5} ${x - half + 8},${y + 5}`} stroke="none" />
      <polygon points={`${x + half},${y} ${x + half - 8},${y - 5} ${x + half - 8},${y + 5}`} stroke="none" />
    </g>
  )
}

/**
 * Upright phenol or phenoxide resonance contributor with exact Kekulé bonds, oxygen lone pairs,
 * formal charges, and optional curved electron-pushing arrows.
 */
export function UprightPhenolicContributor({
  cx,
  cy,
  r = 36,
  form,
  highlightC1 = false,
  showArrows = true,
}: {
  cx: number
  cy: number
  r?: number
  form: ResonanceFormSpec
  highlightC1?: boolean
  showArrows?: boolean
}) {
  const verts = Array.from({ length: 6 }, (_, k) => ringVertex(cx, cy, r, k))
  const c1 = verts[0]
  const oxY = c1.y - r * 0.72
  const ox = { x: cx, y: oxY }
  const doubleSet = new Set(form.doubleEdges)

  // Ring carbon formal charge geometry
  const chargedVertex = form.ringChargeAt !== null ? verts[form.ringChargeAt] : null
  const outTh = form.ringChargeAt !== null ? (-90 + 60 * form.ringChargeAt) * DEG : 0
  const lpPos = chargedVertex
    ? { x: chargedVertex.x + Math.cos(outTh) * 10, y: chargedVertex.y + Math.sin(outTh) * 10 }
    : null
  const badgePos = chargedVertex
    ? { x: chargedVertex.x + Math.cos(outTh) * 23, y: chargedVertex.y + Math.sin(outTh) * 23 }
    : null

  const c1OAnchor = { x: cx, y: (c1.y + ox.y) / 2 }
  const edgeMid = (k: number) => {
    const a = verts[k]
    const b = verts[(k + 1) % 6]
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }

  return (
    <g>
      {highlightC1 && <circle cx={c1.x} cy={c1.y} r={10} fill="var(--highlight)" />}
      {chargedVertex && <circle cx={chargedVertex.x} cy={chargedVertex.y} r={10} fill="var(--highlight)" />}

      {/* Ring skeleton */}
      {verts.map((p, i) => {
        const q = verts[(i + 1) % 6]
        return (
          <line
            key={`s-${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="var(--fg)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        )
      })}
      {verts.map((p, i) => {
        if (!doubleSet.has(i)) return null
        const q = verts[(i + 1) % 6]
        const seg = innerDoubleSegment(p, q, cx, cy, 6.2)
        return (
          <line
            key={`d-${i}`}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="var(--fg)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}

      {/* C1 - O bond (single or double) */}
      {form.c1OOrder === 1 ? (
        <line x1={c1.x} y1={c1.y} x2={ox.x} y2={ox.y + 10} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      ) : (
        <>
          <line x1={c1.x - 3.2} y1={c1.y} x2={ox.x - 3.2} y2={ox.y + 10} stroke="var(--fg)" strokeWidth={2.1} strokeLinecap="round" />
          <line x1={c1.x + 3.2} y1={c1.y} x2={ox.x + 3.2} y2={ox.y + 10} stroke="var(--fg)" strokeWidth={2.1} strokeLinecap="round" />
        </>
      )}

      {/* Oxygen atom */}
      <text
        x={ox.x}
        y={ox.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--atom-o)"
      >
        O
      </text>

      {/* Attached H for phenol */}
      {form.hasH && (
        <>
          <line
            x1={ox.x + 9}
            y1={ox.y - 4}
            x2={ox.x + 21}
            y2={ox.y - 11}
            stroke="var(--fg)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <text
            x={ox.x + 29}
            y={ox.y - 13}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            H
          </text>
        </>
      )}

      {/* Lone pairs on oxygen */}
      {form.hasH ? (
        <>
          <LonePairDots px={ox.x - 13} py={ox.y} angleRad={Math.PI / 2} />
          {form.oxygenLonePairs >= 2 && <LonePairDots px={ox.x} py={ox.y - 13} angleRad={0} />}
        </>
      ) : (
        <>
          <LonePairDots px={ox.x - 13} py={ox.y} angleRad={Math.PI / 2} />
          <LonePairDots px={ox.x + 13} py={ox.y} angleRad={Math.PI / 2} />
          {form.oxygenLonePairs === 3 && <LonePairDots px={ox.x} py={ox.y - 13} angleRad={0} />}
        </>
      )}

      {/* Formal charge on oxygen */}
      {form.oxygenCharge !== 0 && (
        <ChargeBadge
          x={form.hasH ? ox.x - 21 : ox.x + 19}
          y={ox.y - 16}
          sign={form.oxygenCharge > 0 ? '+' : '−'}
          tone={form.oxygenCharge > 0 ? 'var(--delta-plus)' : 'var(--delta-minus)'}
        />
      )}

      {/* Ring lone pair + formal negative charge */}
      {lpPos && badgePos && (
        <>
          <LonePairDots px={lpPos.x} py={lpPos.y} angleRad={outTh + Math.PI / 2} fill="var(--delta-minus)" />
          <ChargeBadge x={badgePos.x} y={badgePos.y} sign="−" tone="var(--delta-minus)" />
        </>
      )}

      {/* Curved electron-pushing arrows */}
      {showArrows && (form.arrows === 'phenol-1' || form.arrows === 'phenoxide-1') && (
        <>
          <CurvedArrow from={{ x: ox.x - 14, y: ox.y + 4 }} to={{ x: c1OAnchor.x - 5, y: c1OAnchor.y }} bend={0.45} gap={1.5} headSize={8} strokeWidth={2} />
          <CurvedArrow from={edgeMid(0)} to={{ x: verts[1].x + 8, y: verts[1].y - 6 }} bend={-0.5} gap={1.5} headSize={8} strokeWidth={2} />
        </>
      )}
      {showArrows && (form.arrows === 'phenol-2' || form.arrows === 'phenoxide-2') && (
        <>
          <CurvedArrow from={{ x: verts[1].x + 11, y: verts[1].y - 3 }} to={edgeMid(1)} bend={-0.45} gap={1.5} headSize={8} strokeWidth={2} />
          <CurvedArrow from={edgeMid(2)} to={{ x: verts[3].x + 10, y: verts[3].y + 8 }} bend={-0.45} gap={1.5} headSize={8} strokeWidth={2} />
        </>
      )}
      {showArrows && (form.arrows === 'phenol-3' || form.arrows === 'phenoxide-3') && (
        <>
          <CurvedArrow from={{ x: verts[3].x - 8, y: verts[3].y + 10 }} to={edgeMid(3)} bend={-0.45} gap={1.5} headSize={8} strokeWidth={2} />
          <CurvedArrow from={edgeMid(4)} to={{ x: verts[5].x - 10, y: verts[5].y - 4 }} bend={-0.45} gap={1.5} headSize={8} strokeWidth={2} />
        </>
      )}
      {showArrows && (form.arrows === 'phenol-4' || form.arrows === 'phenoxide-4') && (
        <>
          <CurvedArrow from={{ x: verts[5].x - 10, y: verts[5].y - 4 }} to={edgeMid(5)} bend={-0.45} gap={1.5} headSize={8} strokeWidth={2} />
          <CurvedArrow from={{ x: c1OAnchor.x - 3, y: c1OAnchor.y }} to={{ x: ox.x - 11, y: ox.y - 8 }} bend={0.5} gap={1.5} headSize={8} strokeWidth={2} />
        </>
      )}

      {/* Roman numeral label */}
      {form.label && (
        <text
          x={cx}
          y={cy + r + 48}
          textAnchor="middle"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {form.label}
        </text>
      )}
    </g>
  )
}

export interface RingSubstituentDisplay {
  /** Position 2 (ortho-R), 3 (meta-R), or 4 (para). */
  position: 2 | 3 | 4
  label: string
  /** Optional colour token for substituent text, e.g. 'var(--atom-n)' or 'var(--fg)'. */
  tone?: string
  /** Show +I inductive arrow pointing into the ring or -I/-R pulling out of the ring. */
  flow?: 'into-ring' | 'out-of-ring'
}

/**
 * Upright benzene hybrid (hexagon + inscribed circle) with -O⁻ or -OH at C1, optional ortho/para δ− halos,
 * and an optional substituent at position 2, 3, or 4. Shared by Scrolly Step 5 and the Acidity Lab.
 */
export function SubstitutedPhenoxideHybrid({
  cx,
  cy,
  r = 40,
  topGroup = 'O⁻',
  showTopH = false,
  delocalisedSites = [1, 3, 5],
  substituent,
  highlightTop = false,
}: {
  cx: number
  cy: number
  r?: number
  topGroup?: string
  showTopH?: boolean
  delocalisedSites?: readonly (1 | 3 | 5)[]
  substituent?: RingSubstituentDisplay | null
  highlightTop?: boolean
}) {
  const verts = Array.from({ length: 6 }, (_, k) => ringVertex(cx, cy, r, k))
  const c1 = verts[0]
  const oxY = c1.y - r * 0.72
  const innerR = r * (Math.sqrt(3) / 2) * 0.68
  const siteSet = new Set<number>(delocalisedSites)

  // Map chemical position (2, 3, 4) to vertex index (1, 2, 3)
  const subIdx = substituent ? substituent.position - 1 : -1
  const subVert = substituent ? verts[subIdx] : null
  const subAngle = substituent ? (-90 + 60 * subIdx) * DEG : 0
  const subBondLen = r * 0.42
  const subEnd = subVert
    ? { x: subVert.x + Math.cos(subAngle) * subBondLen, y: subVert.y + Math.sin(subAngle) * subBondLen }
    : null
  const subText = subVert
    ? { x: subVert.x + Math.cos(subAngle) * (subBondLen + 9), y: subVert.y + Math.sin(subAngle) * (subBondLen + 11) }
    : null

  return (
    <g>
      {/* Negative-charge delocalisation halos at C2, C4, C6 */}
      {[1, 3, 5].map((idx) =>
        siteSet.has(idx) ? (
          <circle key={`halo-${idx}`} cx={verts[idx].x} cy={verts[idx].y} r={10} fill="var(--highlight)" />
        ) : null
      )}
      {highlightTop && <circle cx={cx} cy={oxY} r={12} fill="var(--highlight)" />}

      {/* Hexagon + aromatic circle */}
      <polygon
        points={verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={2.3}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--fg)" strokeWidth={1.8} strokeDasharray="4 3" />

      {/* C1 - O bond & label */}
      <line x1={c1.x} y1={c1.y} x2={cx} y2={oxY + 10} stroke="var(--fg)" strokeWidth={2.3} strokeLinecap="round" />
      <text
        x={cx}
        y={oxY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--atom-o)"
      >
        {showTopH ? 'OH' : topGroup}
      </text>

      {/* δ− badges on ortho/para sites; when occupied by a substituent, offset cleanly outside the bond */}
      {delocalisedSites.map((idx) => {
        const v = verts[idx]
        const th = (-90 + 60 * idx) * DEG
        const isOccupied = subIdx === idx
        const bx = isOccupied ? (idx === 3 ? v.x + 20 : v.x + 17) : v.x + Math.cos(th) * 18
        const by = isOccupied ? (idx === 3 ? v.y + 7 : v.y + 16) : v.y + Math.sin(th) * 18
        return (
          <text
            key={`delta-${idx}`}
            x={bx}
            y={by}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--delta-minus)"
          >
            δ−
          </text>
        )
      })}

      {/* Substituent bond + group + optional inductive/resonance flow indicator */}
      {substituent && subVert && subEnd && subText && (
        <g>
          <line
            x1={subVert.x}
            y1={subVert.y}
            x2={subEnd.x}
            y2={subEnd.y}
            stroke="var(--fg)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          {substituent.flow === 'out-of-ring' && (
            <polygon
              points={arrowHeadAlong(subVert, subEnd, 0.72, 7)}
              fill="var(--e-arrow)"
            />
          )}
          {substituent.flow === 'into-ring' && (
            <polygon
              points={arrowHeadAlong(subEnd, subVert, 0.72, 7)}
              fill="var(--rev)"
            />
          )}
          <text
            x={subText.x}
            y={subText.y}
            textAnchor={Math.cos(subAngle) > 0.35 ? 'start' : Math.cos(subAngle) < -0.35 ? 'end' : 'middle'}
            dominantBaseline="central"
            fontSize={16}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={substituent.tone ?? 'var(--fg)'}
          >
            {substituent.label}
          </text>
        </g>
      )}
    </g>
  )
}

function arrowHeadAlong(from: { x: number; y: number }, to: { x: number; y: number }, t: number, size: number): string {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const tip = { x: from.x + dx * t, y: from.y + dy * t }
  const back = { x: tip.x - ux * size, y: tip.y - uy * size }
  return `${tip.x.toFixed(1)},${tip.y.toFixed(1)} ${(back.x + px * size * 0.55).toFixed(1)},${(back.y + py * size * 0.55).toFixed(1)} ${(back.x - px * size * 0.55).toFixed(1)},${(back.y - py * size * 0.55).toFixed(1)}`
}

