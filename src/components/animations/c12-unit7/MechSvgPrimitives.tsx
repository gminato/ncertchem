'use client'

import type { ReactNode } from 'react'

export const SCROLLY_W = 560
export const SCROLLY_H = 472

export type BadgeTone = 'accent' | 'success' | 'caution'

const TONE_FILL: Record<BadgeTone, string> = {
  accent: 'var(--accent-soft)',
  success: 'var(--success-soft)',
  caution: 'var(--caution-soft)',
}

const TONE_TEXT: Record<BadgeTone, string> = {
  accent: 'var(--accent)',
  success: 'var(--success)',
  caution: 'var(--caution)',
}

export function PathwayHeader({
  badge,
  tone = 'accent',
  stepIndex,
  stepCount,
  title,
}: {
  badge: string
  tone?: BadgeTone
  stepIndex: number
  stepCount: number
  title: string
}) {
  const badgeWidth = Math.max(150, badge.length * 8.4 + 28)
  return (
    <g>
      <rect
        x={18}
        y={14}
        width={badgeWidth}
        height={30}
        rx={15}
        fill={TONE_FILL[tone]}
        stroke={TONE_TEXT[tone]}
        strokeWidth={1.2}
      />
      <text
        x={18 + badgeWidth / 2}
        y={29}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={TONE_TEXT[tone]}
      >
        {badge}
      </text>
      <text
        x={SCROLLY_W - 18}
        y={29}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={500}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        {`Step ${stepIndex + 1} of ${stepCount}`}
      </text>
      <text
        x={SCROLLY_W / 2}
        y={72}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {title}
      </text>
    </g>
  )
}

export function StepCard({
  x = 22,
  y,
  width = SCROLLY_W - 44,
  height,
  highlight = false,
  tone = 'accent',
  dashed = false,
  children,
}: {
  x?: number
  y: number
  width?: number
  height: number
  highlight?: boolean
  tone?: BadgeTone
  dashed?: boolean
  children?: ReactNode
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill="var(--surface-raised)"
        stroke={highlight ? TONE_TEXT[tone] : 'var(--border)'}
        strokeWidth={highlight ? 1.8 : 1.2}
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      {children}
    </g>
  )
}

export function ChargeBadge({ x, y, sign }: { x: number; y: number; sign: '+' | '−' }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.3} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {sign}
      </text>
    </g>
  )
}

export function LonePairDots({
  cx,
  cy,
  angleDeg,
  spread = 5,
  color = 'var(--lone-pair)',
}: {
  cx: number
  cy: number
  angleDeg: number
  spread?: number
  color?: string
}) {
  const perp = ((angleDeg + 90) * Math.PI) / 180
  const dx = Math.cos(perp) * spread
  const dy = Math.sin(perp) * spread
  return (
    <g fill={color}>
      <circle cx={cx + dx} cy={cy + dy} r={2.8} />
      <circle cx={cx - dx} cy={cy - dy} r={2.8} />
    </g>
  )
}

export function DownReactionArrow({
  x = SCROLLY_W / 2,
  y1,
  y2,
  equilibrium = false,
  labelRight,
  labelLeft,
}: {
  x?: number
  y1: number
  y2: number
  equilibrium?: boolean
  labelRight?: string
  labelLeft?: string
}) {
  const mid = (y1 + y2) / 2
  return (
    <g>
      {equilibrium ? (
        <>
          <line x1={x - 5} y1={y1} x2={x - 5} y2={y2 - 2} stroke="var(--bond)" strokeWidth={2} />
          <path d={`M ${x - 5} ${y2} L ${x - 11} ${y2 - 10} L ${x - 5} ${y2 - 8} Z`} fill="var(--bond)" />
          <line x1={x + 5} y1={y2} x2={x + 5} y2={y1 + 2} stroke="var(--bond)" strokeWidth={2} />
          <path d={`M ${x + 5} ${y1} L ${x + 11} ${y1 + 10} L ${x + 5} ${y1 + 8} Z`} fill="var(--bond)" />
        </>
      ) : (
        <>
          <line x1={x} y1={y1} x2={x} y2={y2 - 8} stroke="var(--bond)" strokeWidth={2.2} />
          <polygon points={`${x},${y2} ${x - 6},${y2 - 11} ${x + 6},${y2 - 11}`} fill="var(--bond)" />
        </>
      )}
      {labelRight ? (
        <text
          x={x + 16}
          y={mid}
          textAnchor="start"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {labelRight}
        </text>
      ) : null}
      {labelLeft ? (
        <text
          x={x - 16}
          y={mid}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {labelLeft}
        </text>
      ) : null}
    </g>
  )
}

export function RightReactionArrow({
  x1,
  x2,
  y,
  above,
  below,
}: {
  x1: number
  x2: number
  y: number
  above?: string
  below?: string
}) {
  const mid = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 10} y2={y} stroke="var(--bond)" strokeWidth={2.2} strokeLinecap="round" />
      <polygon points={`${x2},${y} ${x2 - 11},${y - 6} ${x2 - 11},${y + 6}`} fill="var(--bond)" />
      {above ? (
        <text
          x={mid}
          y={y - 16}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {above}
        </text>
      ) : null}
      {below ? (
        <text
          x={mid}
          y={y + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {below}
        </text>
      ) : null}
    </g>
  )
}

export function PillLabel({
  cx,
  cy,
  text,
  tone = 'accent',
}: {
  cx: number
  cy: number
  text: string
  tone?: BadgeTone
}) {
  const width = Math.max(88, text.length * 8.2 + 24)
  return (
    <g>
      <rect
        x={cx - width / 2}
        y={cy - 14}
        width={width}
        height={28}
        rx={14}
        fill={TONE_FILL[tone]}
        stroke={TONE_TEXT[tone]}
        strokeWidth={1.1}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={TONE_TEXT[tone]}
      >
        {text}
      </text>
    </g>
  )
}

function wrapCaption(line: string, maxChars = 60): string[] {
  if (line.length <= maxChars) return [line]
  const splitAt = line.lastIndexOf(' ', maxChars)
  if (splitAt <= 0) return [line]
  return [line.slice(0, splitAt), line.slice(splitAt + 1)]
}

export function StepCaption({ line }: { line: string }) {
  const lines = wrapCaption(line)
  return (
    <g>
      {lines.map((part, idx) => (
        <text
          key={idx}
          x={SCROLLY_W / 2}
          y={lines.length === 1 ? SCROLLY_H - 22 : SCROLLY_H - 32 + idx * 20}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {part}
        </text>
      ))}
    </g>
  )
}
