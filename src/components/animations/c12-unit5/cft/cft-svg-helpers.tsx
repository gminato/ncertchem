import React from 'react'

/**
 * Shared SVG primitives for Crystal Field Theory (Unit 5, Section 5.5.4) animations
 * and the Crystal Field Splitting Lab simulation.
 * All colours come from tokens.css so light and dark themes stay legible.
 */

export const CFT_COLOR = {
  fg: 'var(--fg)',
  muted: 'var(--fg-muted)',
  subtle: 'var(--fg-subtle)',
  surface: 'var(--surface)',
  raised: 'var(--surface-raised)',
  border: 'var(--border)',
  accent: 'var(--accent)',
  accentSoft: 'var(--accent-soft)',
  electron: 'var(--electron)',
  highRepulsion: 'var(--orbital-pos)',
  lowRepulsion: 'var(--orbital-neg)',
  metal: 'var(--el-Fe)',
  ligand: 'var(--ion-anion)',
  success: 'var(--success)',
  caution: 'var(--caution)',
  pairing: 'var(--field-b)',
} as const

/** Fill orbital slots (each slot has up/down booleans) according to Hund's rule. */
export function fillSubshellSlots(count: number, totalSlots: number): Array<{ up: boolean; down: boolean }> {
  const slots = Array.from({ length: totalSlots }, () => ({ up: false, down: false }))
  const clamped = Math.max(0, Math.min(totalSlots * 2, Math.trunc(count)))
  for (let i = 0; i < Math.min(clamped, totalSlots); i++) {
    slots[i].up = true
  }
  for (let i = totalSlots; i < clamped; i++) {
    slots[i - totalSlots].down = true
  }
  return slots
}

/** Single crisp electron spin arrow centered vertically around `cy`. */
export function ElectronSpinArrow({
  x,
  cy,
  height = 28,
  direction,
  color = CFT_COLOR.electron,
  opacity = 1,
  dashed = false,
}: {
  x: number
  cy: number
  height?: number
  direction: 'up' | 'down'
  color?: string
  opacity?: number
  dashed?: boolean
}) {
  const half = height / 2
  const topY = cy - half
  const bottomY = cy + half
  const tipY = direction === 'up' ? topY : bottomY
  const tailY = direction === 'up' ? bottomY : topY
  const headY = direction === 'up' ? topY + 6.5 : bottomY - 6.5
  const hw = 4.5
  return (
    <g opacity={opacity} data-spin={direction === 'up' ? '+1/2' : '-1/2'}>
      <line
        x1={x}
        y1={tailY}
        x2={x}
        y2={tipY}
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeDasharray={dashed ? '3 2.5' : undefined}
      />
      <path
        d={`M ${x - hw} ${headY} L ${x} ${tipY} L ${x + hw} ${headY}`}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

/**
 * Horizontal orbital energy level group (2 slots for eg/e, 3 slots for t2g/t2, 5 for degenerate d).
 * Draws horizontal level dashes and optional electron spin arrows centered on each dash.
 */
export function OrbitalLevelSet({
  cx,
  y,
  slots,
  slotWidth = 34,
  slotGap = 10,
  stroke = CFT_COLOR.fg,
  electrons,
  arrowHeight = 28,
  transitionStyle,
}: {
  cx: number
  y: number
  slots: number
  slotWidth?: number
  slotGap?: number
  stroke?: string
  electrons?: Array<{ up: boolean; down: boolean }>
  arrowHeight?: number
  transitionStyle?: React.CSSProperties
}) {
  const totalW = slots * slotWidth + Math.max(0, slots - 1) * slotGap
  const startX = cx - totalW / 2
  return (
    <g transform={`translate(0, ${y})`} style={transitionStyle}>
      {Array.from({ length: slots }, (_, i) => {
        const x0 = startX + i * (slotWidth + slotGap)
        const midX = x0 + slotWidth / 2
        const occ = electrons?.[i]
        return (
          <g key={i}>
            <line
              x1={x0}
              y1={0}
              x2={x0 + slotWidth}
              y2={0}
              stroke={stroke}
              strokeWidth={3}
              strokeLinecap="round"
            />
            {occ?.up && (
              <ElectronSpinArrow
                x={occ.down ? midX - 6 : midX}
                cy={-2}
                height={arrowHeight}
                direction="up"
              />
            )}
            {occ?.down && (
              <ElectronSpinArrow
                x={midX + 6}
                cy={-2}
                height={arrowHeight}
                direction="down"
              />
            )}
          </g>
        )
      })}
    </g>
  )
}

/** Vertical double-headed arrow for Δo or Δt between yTop and yBottom. */
export function SplitDoubleArrow({
  x,
  yTop,
  yBottom,
  color = CFT_COLOR.fg,
  transitionStyle,
}: {
  x: number
  yTop: number
  yBottom: number
  color?: string
  transitionStyle?: React.CSSProperties
}) {
  const safeTop = Math.min(yTop, yBottom) + 3
  const safeBot = Math.max(yTop, yBottom) - 3
  if (safeBot - safeTop < 10) return null
  const hw = 4.5
  const hh = 6.5
  return (
    <g style={transitionStyle}>
      <line x1={x} y1={safeTop} x2={x} y2={safeBot} stroke={color} strokeWidth={1.8} />
      <path
        d={`M ${x - hw} ${safeTop + hh} L ${x} ${safeTop} L ${x + hw} ${safeTop + hh}`}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`M ${x - hw} ${safeBot - hh} L ${x} ${safeBot} L ${x + hw} ${safeBot - hh}`}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

/** Small four-lobe cloverleaf icon for a d orbital (rotated 0 deg for axial, 45 deg for interaxial). */
export function DOrbitalIcon({
  cx,
  cy,
  r = 16,
  angleDeg = 0,
  color,
  variant = 'clover',
}: {
  cx: number
  cy: number
  r?: number
  angleDeg?: number
  color: string
  variant?: 'clover' | 'dz2'
}) {
  if (variant === 'dz2') {
    const lobeH = r * 0.85
    const lobeW = r * 0.38
    return (
      <g transform={`translate(${cx}, ${cy})`}>
        <ellipse cx={0} cy={-lobeH * 0.55} rx={lobeW} ry={lobeH * 0.52} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />
        <ellipse cx={0} cy={lobeH * 0.55} rx={lobeW} ry={lobeH * 0.52} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />
        <ellipse cx={0} cy={0} rx={r * 0.58} ry={r * 0.22} fill="none" stroke={color} strokeWidth={1.6} />
      </g>
    )
  }
  const rx = r * 0.5
  const ry = r * 0.27
  const offset = r * 0.48
  return (
    <g transform={`translate(${cx}, ${cy}) rotate(${angleDeg})`}>
      <ellipse cx={offset} cy={0} rx={rx} ry={ry} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />
      <ellipse cx={-offset} cy={0} rx={rx} ry={ry} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />
      <ellipse cx={0} cy={offset} rx={ry} ry={rx} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />
      <ellipse cx={0} cy={-offset} rx={ry} ry={rx} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={1.5} />
    </g>
  )
}

/** Vertical Energy axis arrow on the left of a splitting diagram. */
export function EnergyAxis({ x, yTop, yBottom }: { x: number; yTop: number; yBottom: number }) {
  return (
    <g>
      <line x1={x} y1={yBottom} x2={x} y2={yTop} stroke={CFT_COLOR.muted} strokeWidth={1.8} />
      <path
        d={`M ${x - 5} ${yTop + 8} L ${x} ${yTop} L ${x + 5} ${yTop + 8}`}
        fill="none"
        stroke={CFT_COLOR.muted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={x - 10}
        y={(yTop + yBottom) / 2}
        textAnchor="middle"
        fontSize={16}
        fill={CFT_COLOR.muted}
        transform={`rotate(-90, ${x - 10}, ${(yTop + yBottom) / 2})`}
      >
        Energy
      </text>
    </g>
  )
}

/** Format an integer 0..6 as Unicode superscript digits. */
const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

export function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((ch) => SUPERSCRIPTS[ch] ?? ch)
    .join('')
}

export function formatOctahedralConfig(t2g: number, eg: number): string {
  return `t₂g${toSuperscript(t2g)} eg${toSuperscript(eg)}`
}

export function formatTetrahedralConfig(e: number, t2: number): string {
  return `e${toSuperscript(e)} t₂${toSuperscript(t2)}`
}
