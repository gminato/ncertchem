'use client'

import type { ReactNode } from 'react'

/** Clamp a Scrolly step index safely to [0, count - 1]. */
export function clampStep(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.max(0, Math.min(count - 1, Math.round(step)))
}

export type BadgeTone = 'success' | 'caution' | 'accent' | 'neutral'

const TONE_STYLES: Readonly<Record<BadgeTone, { fill: string; stroke: string; text: string }>> = {
  success: {
    fill: 'var(--success-soft)',
    stroke: 'var(--success)',
    text: 'var(--success)',
  },
  caution: {
    fill: 'var(--caution-soft)',
    stroke: 'var(--caution)',
    text: 'var(--caution)',
  },
  accent: {
    fill: 'var(--accent-soft)',
    stroke: 'var(--accent)',
    text: 'var(--accent)',
  },
  neutral: {
    fill: 'var(--surface-raised)',
    stroke: 'var(--border)',
    text: 'var(--fg)',
  },
}

/** Draw a pair of lone-pair dots around an atom centre at angle `deg` (SVG degrees, y down). */
export function LonePairDots({
  cx,
  cy,
  radius = 18,
  angleDeg,
  spreadPx = 4.5,
  dotR = 2.6,
}: {
  cx: number
  cy: number
  radius?: number
  angleDeg: number
  spreadPx?: number
  dotR?: number
}) {
  const rad = (angleDeg * Math.PI) / 180
  const px = cx + Math.cos(rad) * radius
  const py = cy + Math.sin(rad) * radius
  const perp = rad + Math.PI / 2
  const dx = Math.cos(perp) * spreadPx
  const dy = Math.sin(perp) * spreadPx
  return (
    <g aria-hidden="true">
      <circle cx={px - dx} cy={py - dy} r={dotR} fill="var(--lone-pair-edge)" />
      <circle cx={px + dx} cy={py + dy} r={dotR} fill="var(--lone-pair-edge)" />
    </g>
  )
}

/** Horizontal reaction arrow with optional reagent above and condition below. */
export function ChemArrow({
  x1,
  x2,
  y,
  topLabel,
  bottomLabel,
  tone = 'var(--fg-muted)',
}: {
  x1: number
  x2: number
  y: number
  topLabel?: string
  bottomLabel?: string
  tone?: string
}) {
  const dir = x2 >= x1 ? 1 : -1
  const tip = x2
  const barb = tip - dir * 10
  const midX = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - dir * 2} y2={y} stroke={tone} strokeWidth={2.4} strokeLinecap="round" />
      <polygon
        points={`${tip},${y} ${barb},${y - 5.5} ${barb},${y + 5.5}`}
        fill={tone}
      />
      {topLabel ? (
        <text
          x={midX}
          y={y - 14}
          textAnchor="middle"
          fontSize={15}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {topLabel}
        </text>
      ) : null}
      {bottomLabel ? (
        <text
          x={midX}
          y={y + 22}
          textAnchor="middle"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {bottomLabel}
        </text>
      ) : null}
    </g>
  )
}

/** Pill-shaped status or pathway badge centred at (cx, cy). */
export function StatusPill({
  cx,
  cy,
  width,
  height = 34,
  tone = 'neutral',
  children,
}: {
  cx: number
  cy: number
  width: number
  height?: number
  tone?: BadgeTone
  children: ReactNode
}) {
  const palette = TONE_STYLES[tone]
  return (
    <g>
      <rect
        x={cx - width / 2}
        y={cy - height / 2}
        width={width}
        height={height}
        rx={height / 2}
        fill={palette.fill}
        stroke={palette.stroke}
        strokeWidth={1.6}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={palette.text}
      >
        {children}
      </text>
    </g>
  )
}

/** Title and optional subtitle centred inside an SVG panel. */
export function SvgHeader({
  width,
  title,
  subtitle,
}: {
  width: number
  title: string
  subtitle?: string
}) {
  return (
    <g>
      <text
        x={width / 2}
        y={32}
        textAnchor="middle"
        fontSize={19}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {title}
      </text>
      {subtitle ? (
        <text
          x={width / 2}
          y={58}
          textAnchor="middle"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {subtitle}
        </text>
      ) : null}
    </g>
  )
}

/** Rounded surface card inside an SVG scene. */
export function SvgCard({
  x,
  y,
  width,
  height,
  tone = 'neutral',
}: {
  x: number
  y: number
  width: number
  height: number
  tone?: BadgeTone
}) {
  const stroke =
    tone === 'neutral'
      ? 'var(--border)'
      : tone === 'success'
        ? 'var(--success)'
        : tone === 'caution'
          ? 'var(--caution)'
          : 'var(--accent)'
  const fill =
    tone === 'neutral'
      ? 'var(--surface-raised)'
      : tone === 'success'
        ? 'var(--success-soft)'
        : tone === 'caution'
          ? 'var(--caution-soft)'
          : 'var(--accent-soft)'
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={12}
      fill={fill}
      fillOpacity={tone === 'neutral' ? 0.55 : 0.4}
      stroke={stroke}
      strokeWidth={1.5}
    />
  )
}
