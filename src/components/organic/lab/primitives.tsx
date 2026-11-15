import React from 'react'

/** Shared text attributes for every label in the laboratory drawings. Sizes are ≥ 13 px at 1:1. */
export const LAB_TEXT = {
  fontFamily: 'var(--font-sans)',
  fill: 'var(--fg-muted)',
  style: { userSelect: 'none' as const },
}

/**
 * A glass tube as line art: an outer wall stroke with a lighter inner bore, so it reads as
 * hollow glass rather than a flat stripe. `d` is an open SVG path.
 */
export function GlassTube({ d, width = 12, fill = 'none' }: { d: string; width?: number; fill?: string }) {
  return (
    <g>
      <path d={d} fill="none" stroke="var(--glass)" strokeWidth={width + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--surface)" strokeWidth={Math.max(1, width - 2)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="var(--glass-fill)" strokeWidth={Math.max(1, width - 2)} strokeLinecap="round" strokeLinejoin="round" />
      {fill !== 'none' && <path d={d} fill={fill} stroke="none" />}
    </g>
  )
}

/** A flame: a teardrop with a pale core. `x`, `y` is the base centre; `s` scales it. */
export function Flame({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      <path d="M0,0 C-7,-5 -6,-12 0,-18 C6,-12 7,-5 0,0 Z" fill="var(--flame)" />
      <path d="M0,-2 C-3,-5 -2.5,-8 0,-11 C2.5,-8 3,-5 0,-2 Z" fill="var(--surface)" opacity={0.55} />
    </g>
  )
}

/** A row of flames under a heat source, spread across `width` centred on `cx`. */
export function FlameRow({ cx, y, width, count = 3 }: { cx: number; y: number; width: number; count?: number }) {
  const step = count > 1 ? width / (count - 1) : 0
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <Flame key={i} x={cx - width / 2 + i * step} y={y} s={i === 1 ? 1.1 : 0.85} />
      ))}
    </g>
  )
}

/** A gas burner or heating block: a squat rounded base. */
export function Burner({ x, y, width, height = 12 }: { x: number; y: number; width: number; height?: number }) {
  return <rect x={x} y={y} width={width} height={height} rx={height / 2} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
}

/** A stopper (rubber bung) on a tube or neck. */
export function Stopper({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
  return <rect x={x} y={y} width={width} height={height} rx={3} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
}

/** A dot used for particles, drops and crystals in the apparatus. */
export function Dot({ x, y, r = 3, fill }: { x: number; y: number; r?: number; fill: string }) {
  return <circle cx={x} cy={y} r={r} fill={fill} stroke="var(--surface)" strokeWidth={0.8} />
}

/** An SVG text label with the laboratory defaults applied. */
export function Caption({
  x,
  y,
  children,
  anchor = 'middle',
  size = 14,
  fill,
}: {
  x: number
  y: number
  children: React.ReactNode
  anchor?: 'start' | 'middle' | 'end'
  size?: number
  fill?: string
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={size} fontFamily={LAB_TEXT.fontFamily} fill={fill ?? LAB_TEXT.fill} style={LAB_TEXT.style}>
      {children}
    </text>
  )
}
