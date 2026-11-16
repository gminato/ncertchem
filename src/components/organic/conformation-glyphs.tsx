import React from 'react'
import type { Seg } from './hydrocarbon-geometry'

/** A substituent label with a surface-coloured halo, shared by the Newman and sawhorse drawings. */
export function NewmanGlyph({ x, y, children, fill }: { x: number; y: number; children: string; fill: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={18}
      fontWeight={600}
      fontFamily="var(--font-sans)"
      fill={fill}
      stroke="var(--surface)"
      strokeWidth={5}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  )
}

/** A bond segment as a round-capped line. */
export function drawSegment(s: Seg, key: string, stroke: string, width: number) {
  return <line key={key} x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={stroke} strokeWidth={width} strokeLinecap="round" />
}
