'use client'

import type { ElectronOrigin, HybridBracket, VbtBox } from './vbt-steps'

export interface VbtOrbitalDiagramProps {
  /** 14 valence boxes: 0..4 (3d), 5 (4s), 6..8 (4p), 9..13 (4d). */
  boxes: readonly VbtBox[]
  /** Whether to draw the 4d subshell boxes (true for CN 6 / octahedral, false for compact CN 4). */
  show4d: boolean
  bracket: HybridBracket | null
  x?: number
  y?: number
  /** Side length of each square orbital box. */
  boxSize?: number
  /** Font size for subshell and bracket labels (keep >= 16 so rendered text stays >= 14px). */
  fontSize?: number
}

const METAL_COLOR = 'var(--electron)'
const LIGAND_COLOR = 'var(--orbital-pos)'

interface BoxRect {
  x: number
  y: number
  subshell: '3d' | '4s' | '4p' | '4d'
}

/** Computes horizontal positions for the valence boxes with clear gaps between subshells. */
export function computeBoxPositions(show4d: boolean, boxSize: number): {
  rects: BoxRect[]
  totalWidth: number
  subshellSpans: { label: string; cx: number }[]
} {
  const innerGap = 3
  const subshellGap = Math.max(10, Math.round(boxSize * 0.42))
  const groups: { label: '3d' | '4s' | '4p' | '4d'; count: number }[] = show4d
    ? [
        { label: '3d', count: 5 },
        { label: '4s', count: 1 },
        { label: '4p', count: 3 },
        { label: '4d', count: 5 },
      ]
    : [
        { label: '3d', count: 5 },
        { label: '4s', count: 1 },
        { label: '4p', count: 3 },
      ]

  const rects: BoxRect[] = []
  const subshellSpans: { label: string; cx: number }[] = []
  let cursor = 0

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g]
    const startX = cursor
    for (let i = 0; i < group.count; i++) {
      rects.push({ x: cursor, y: 0, subshell: group.label })
      cursor += boxSize + (i < group.count - 1 ? innerGap : 0)
    }
    subshellSpans.push({ label: group.label, cx: (startX + cursor) / 2 })
    if (g < groups.length - 1) {
      cursor += subshellGap
    }
  }

  return { rects, totalWidth: cursor, subshellSpans }
}

function SpinArrow({
  x,
  y,
  size,
  direction,
  origin,
}: {
  x: number
  y: number
  size: number
  direction: 'up' | 'down'
  origin: ElectronOrigin
}) {
  const top = y + size * 0.18
  const bottom = y + size * 0.82
  const tipY = direction === 'up' ? top : bottom
  const tailY = direction === 'up' ? bottom : top
  const headY = direction === 'up' ? top + size * 0.22 : bottom - size * 0.22
  const hw = Math.max(3.2, size * 0.12)
  const color = origin === 'metal' ? METAL_COLOR : LIGAND_COLOR
  return (
    <g data-origin={origin} data-spin={direction === 'up' ? '+1/2' : '-1/2'}>
      <path
        d={`M${x.toFixed(1)},${tailY.toFixed(1)} L${x.toFixed(1)},${tipY.toFixed(1)}`}
        fill="none"
        strokeWidth={2.2}
        strokeLinecap="round"
        style={{ stroke: color }}
      />
      <path
        d={`M${(x - hw).toFixed(1)},${headY.toFixed(1)} L${x.toFixed(1)},${tipY.toFixed(1)} L${(x + hw).toFixed(1)},${headY.toFixed(1)}`}
        fill="none"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: color }}
      />
    </g>
  )
}

/**
 * Renders the 3d / 4s / 4p (/ 4d) orbital box diagram with colour-coded metal vs ligand electrons
 * and an optional hybridisation bracket below the boxes.
 */
export function VbtOrbitalDiagram({
  boxes,
  show4d,
  bracket,
  x = 0,
  y = 0,
  boxSize = 34,
  fontSize = 17,
}: VbtOrbitalDiagramProps) {
  const { rects, subshellSpans } = computeBoxPositions(show4d, boxSize)
  const labelY = -10
  const bracketTop = boxSize + 8
  const bracketBottom = boxSize + 18
  const bracketLabelY = boxSize + 40

  const hasBracket = bracket !== null && bracket.endIndex < rects.length
  const bLeft = hasBracket ? rects[bracket.startIndex].x + 2 : 0
  const bRight = hasBracket ? rects[bracket.endIndex].x + boxSize - 2 : 0
  const bMid = (bLeft + bRight) / 2

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Subshell labels above each group */}
      {subshellSpans.map((span) => (
        <text
          key={span.label}
          x={span.cx}
          y={labelY}
          textAnchor="middle"
          style={{
            fill: 'var(--fg-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize,
            fontWeight: 600,
          }}
        >
          {span.label}
        </text>
      ))}

      {/* Hybridisation soft backdrop highlight */}
      {hasBracket && (
        <rect
          x={bLeft - 4}
          y={-4}
          width={bRight - bLeft + 8}
          height={boxSize + 8}
          rx={6}
          style={{
            fill: 'var(--orbital-pos)',
            fillOpacity: 0.1,
            stroke: LIGAND_COLOR,
            strokeWidth: 1.4,
            strokeDasharray: '4 3',
          }}
        />
      )}

      {/* Orbital boxes and spin arrows */}
      {rects.map((rect, idx) => {
        const box = boxes[idx] ?? {}
        const inBracket = hasBracket && idx >= bracket.startIndex && idx <= bracket.endIndex
        const strokeColor = box.highlight
          ? METAL_COLOR
          : inBracket
            ? LIGAND_COLOR
            : 'var(--fg-subtle)'
        const fillColor = box.highlight ? 'var(--accent-soft)' : 'var(--surface)'
        return (
          <g key={`orb-${idx}`}>
            <rect
              x={rect.x}
              y={rect.y}
              width={boxSize}
              height={boxSize}
              rx={4}
              style={{
                fill: fillColor,
                stroke: strokeColor,
                strokeWidth: box.highlight || inBracket ? 1.8 : 1.3,
              }}
            />
            {box.up && (
              <SpinArrow
                x={rect.x + boxSize * 0.34}
                y={rect.y}
                size={boxSize}
                direction="up"
                origin={box.up}
              />
            )}
            {box.down && (
              <SpinArrow
                x={rect.x + boxSize * 0.66}
                y={rect.y}
                size={boxSize}
                direction="down"
                origin={box.down}
              />
            )}
          </g>
        )
      })}

      {/* Hybridisation bracket underneath */}
      {hasBracket && (
        <g>
          <path
            d={`M${bLeft.toFixed(1)},${bracketTop} L${bLeft.toFixed(1)},${bracketBottom} L${bRight.toFixed(1)},${bracketBottom} L${bRight.toFixed(1)},${bracketTop}`}
            fill="none"
            style={{ stroke: LIGAND_COLOR, strokeWidth: 2, strokeLinejoin: 'round' }}
          />
          <line
            x1={bMid}
            x2={bMid}
            y1={bracketBottom}
            y2={bracketBottom + 5}
            style={{ stroke: LIGAND_COLOR, strokeWidth: 2 }}
          />
          <text
            x={bMid}
            y={bracketLabelY}
            textAnchor="middle"
            style={{
              fill: LIGAND_COLOR,
              fontFamily: 'var(--font-sans)',
              fontSize,
              fontWeight: 700,
            }}
          >
            {bracket.label}
          </text>
        </g>
      )}
    </g>
  )
}
