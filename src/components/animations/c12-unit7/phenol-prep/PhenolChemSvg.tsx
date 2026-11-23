'use client'

import type { ReactNode } from 'react'
import { benzeneVertices } from '@/components/organic'

export interface TopSubstituentSpec {
  label: string
  color?: string
  bondHighlight?: boolean
  haloColor?: string
}

export interface AromaticRingProps {
  x: number
  y: number
  r?: number
  variant?: 'hexagon' | 'kekule'
  kekulePhase?: 0 | 1
  highlightRing?: boolean
  ringFill?: string
  stroke?: string
  opacity?: number
  topSubstituent?: TopSubstituentSpec
  caption?: string
  subcaption?: string
  captionColor?: string
  children?: ReactNode
}

/**
 * Pointy-top NCERT-style benzene ring with optional top substituent (Cl, OH, O⁻ Na⁺, SO₃H, NH₂, N₂⁺ Cl⁻),
 * aromatic circle or Kekulé double bonds, and clean captions. Uses tokens.css variables only.
 */
export function AromaticRing({
  x,
  y,
  r = 40,
  variant = 'hexagon',
  kekulePhase = 0,
  highlightRing = false,
  ringFill,
  stroke = 'var(--fg)',
  opacity = 1,
  topSubstituent,
  caption,
  subcaption,
  captionColor = 'var(--fg)',
  children,
}: AromaticRingProps) {
  const verts = benzeneVertices(r)
  const pts = verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')
  const innerR = (r * Math.sqrt(3)) / 2 * 0.68
  const bondLen = Math.round(r * 0.48)
  const labelY = -r - bondLen - 14

  const innerDoubleBond = (idx: number) => {
    const p = verts[idx]
    const q = verts[(idx + 1) % 6]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy) || 1
    let nx = -dy / len
    let ny = dx / len
    const mx = (p.x + q.x) / 2
    const my = (p.y + q.y) / 2
    if (nx * mx + ny * my > 0) {
      nx = -nx
      ny = -ny
    }
    const off = r * 0.17
    const shrink = 0.16
    return {
      x1: p.x + dx * shrink + nx * off,
      y1: p.y + dy * shrink + ny * off,
      x2: q.x - dx * shrink + nx * off,
      y2: q.y - dy * shrink + ny * off,
    }
  }

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      {highlightRing && (
        <polygon points={pts} fill={ringFill ?? 'var(--highlight)'} stroke="none" />
      )}
      {variant === 'hexagon' ? (
        <>
          <polygon
            points={pts}
            fill="var(--surface)"
            fillOpacity={highlightRing ? 0 : 0.72}
            stroke={stroke}
            strokeWidth={2.6}
            strokeLinejoin="round"
          />
          <circle r={innerR} fill="none" stroke={stroke} strokeWidth={2} />
        </>
      ) : (
        <>
          <polygon
            points={pts}
            fill="var(--surface)"
            fillOpacity={highlightRing ? 0 : 0.72}
            stroke={stroke}
            strokeWidth={2.6}
            strokeLinejoin="round"
          />
          {[0, 1, 2, 3, 4, 5]
            .filter((i) => i % 2 === kekulePhase)
            .map((i) => {
              const seg = innerDoubleBond(i)
              return (
                <line
                  key={`k-${i}`}
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={stroke}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )
            })}
        </>
      )}

      {topSubstituent && (
        <g>
          {topSubstituent.bondHighlight && (
            <line
              x1={0}
              y1={-r}
              x2={0}
              y2={-r - bondLen}
              stroke={topSubstituent.haloColor ?? 'var(--highlight)'}
              strokeWidth={12}
              strokeLinecap="round"
            />
          )}
          <line
            x1={0}
            y1={-r}
            x2={0}
            y2={-r - bondLen}
            stroke={stroke}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
          <text
            x={0}
            y={labelY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={topSubstituent.color ?? 'var(--fg)'}
          >
            {topSubstituent.label}
          </text>
        </g>
      )}

      {children}

      {caption && (
        <text
          x={0}
          y={r + 24}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={17}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill={captionColor}
        >
          {caption}
        </text>
      )}
      {subcaption && (
        <text
          x={0}
          y={r + 47}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={17}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {subcaption}
        </text>
      )}
    </g>
  )
}

export interface StraightArrowProps {
  x1: number
  y1: number
  x2: number
  y2: number
  above?: readonly string[]
  below?: readonly string[]
  color?: string
  aboveColor?: string
  belowColor?: string
  dashed?: boolean
  blocked?: boolean
  opacity?: number
  labelDx?: number
  labelDy?: number
}

/** Straight reaction arrow supporting multi-line reagent/condition labels and blocked state. */
export function StraightArrow({
  x1,
  y1,
  x2,
  y2,
  above = [],
  below = [],
  color = 'var(--fg-muted)',
  aboveColor = 'var(--fg)',
  belowColor = 'var(--fg-muted)',
  dashed = false,
  blocked = false,
  opacity = 1,
  labelDx = 0,
  labelDy = 0,
}: StraightArrowProps) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const head = 11
  const shaftEndX = x2 - ux * (head * 0.8)
  const shaftEndY = y2 - uy * (head * 0.8)
  const bx = x2 - ux * head
  const by = y2 - uy * head
  const px = -uy * 6.5
  const py = ux * 6.5
  const midX = (x1 + x2) / 2 + labelDx
  const midY = (y1 + y2) / 2 + labelDy
  const strokeColor = blocked ? 'var(--caution)' : color

  return (
    <g opacity={opacity}>
      <line
        x1={x1}
        y1={y1}
        x2={shaftEndX}
        y2={shaftEndY}
        stroke={strokeColor}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={dashed || blocked ? '6 5' : undefined}
      />
      <polygon
        points={`${x2},${y2} ${bx + px},${by + py} ${bx - px},${by - py}`}
        fill={strokeColor}
      />
      {blocked && (
        <g stroke="var(--proton)" strokeWidth={3.2} strokeLinecap="round">
          <line x1={midX - 11} y1={midY - 11} x2={midX + 11} y2={midY + 11} />
          <line x1={midX + 11} y1={midY - 11} x2={midX - 11} y2={midY + 11} />
        </g>
      )}
      {above.map((line, i) => {
        const lineY = midY - 18 - (above.length - 1 - i) * 21
        return (
          <text
            key={`ab-${i}`}
            x={midX}
            y={lineY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={17}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill={aboveColor}
          >
            {line}
          </text>
        )
      })}
      {below.map((line, i) => {
        const lineY = midY + 21 + i * 21
        return (
          <text
            key={`bl-${i}`}
            x={midX}
            y={lineY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={17}
            fontFamily="var(--font-sans)"
            fill={belowColor}
          >
            {line}
          </text>
        )
      })}
    </g>
  )
}

export interface TagPillProps {
  x: number
  y: number
  text: string
  width?: number
  height?: number
  fill?: string
  stroke?: string
  textColor?: string
  fontSize?: number
}

/** Rounded badge pill for gases (N₂ ↑), co-products, or temperature/pressure highlights. */
export function TagPill({
  x,
  y,
  text,
  width,
  height = 30,
  fill = 'var(--surface-raised)',
  stroke = 'var(--border)',
  textColor = 'var(--fg)',
  fontSize = 17,
}: TagPillProps) {
  const w = width ?? Math.max(72, text.length * 10.2 + 24)
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x={-w / 2}
        y={-height / 2}
        width={w}
        height={height}
        rx={height / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
      />
      <text
        x={0}
        y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={textColor}
      >
        {text}
      </text>
    </g>
  )
}
