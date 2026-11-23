'use client'

import type { GeometryKind } from './vbt-steps'

export interface CoordinationGeometryProps {
  geometry: Exclude<GeometryKind, 'none'>
  metalLabel: string
  ligandLabel: string
  cx: number
  cy: number
  /** Overall radius from centre to ligand nodes. */
  radius?: number
  fontSize?: number
}

const METAL_FILL = 'var(--electron)'
const LIGAND_FILL = 'var(--orbital-pos)'
const BOND_COLOR = 'var(--fg-muted)'
const EDGE_COLOR = 'var(--fg-subtle)'

function LigandNode({
  x,
  y,
  label,
  r,
  fontSize,
  faded = false,
}: {
  x: number
  y: number
  label: string
  r: number
  fontSize: number
  faded?: boolean
}) {
  return (
    <g opacity={faded ? 0.78 : 1}>
      <circle
        cx={x}
        cy={y}
        r={r}
        style={{
          fill: 'var(--surface)',
          stroke: LIGAND_FILL,
          strokeWidth: 2.2,
        }}
      />
      <text
        x={x}
        y={y + fontSize * 0.34}
        textAnchor="middle"
        style={{
          fill: 'var(--fg)',
          fontFamily: 'var(--font-sans)',
          fontSize,
          fontWeight: 600,
        }}
      >
        {label}
      </text>
    </g>
  )
}

function MetalNode({ x, y, label, r, fontSize }: { x: number; y: number; label: string; r: number; fontSize: number }) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r}
        style={{
          fill: METAL_FILL,
          stroke: 'var(--surface)',
          strokeWidth: 2,
        }}
      />
      <text
        x={x}
        y={y + fontSize * 0.34}
        textAnchor="middle"
        style={{
          fill: 'var(--accent-fg)',
          fontFamily: 'var(--font-sans)',
          fontSize,
          fontWeight: 700,
        }}
      >
        {label}
      </text>
    </g>
  )
}

/**
 * Clean, perspective-cued SVG coordination geometry diagram for octahedral, tetrahedral, and square planar complexes.
 */
export function CoordinationGeometry({
  geometry,
  metalLabel,
  ligandLabel,
  cx,
  cy,
  radius = 74,
  fontSize = 16,
}: CoordinationGeometryProps) {
  const metalR = Math.max(21, Math.round(radius * 0.31))
  const ligR = Math.max(18, Math.round(radius * 0.27))

  if (geometry === 'octahedral') {
    const top = { x: cx, y: cy - radius }
    const bot = { x: cx, y: cy + radius }
    const fl = { x: cx - radius * 0.82, y: cy + radius * 0.28 }
    const fr = { x: cx + radius * 0.62, y: cy + radius * 0.32 }
    const bl = { x: cx - radius * 0.62, y: cy - radius * 0.32 }
    const br = { x: cx + radius * 0.82, y: cy - radius * 0.28 }

    return (
      <g>
        {/* Equatorial plane outline */}
        <polygon
          points={`${fl.x},${fl.y} ${fr.x},${fr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
          style={{
            fill: 'var(--accent-soft)',
            stroke: EDGE_COLOR,
            strokeWidth: 1.2,
            strokeDasharray: '4 3',
          }}
        />
        {/* Back equatorial bonds (dashed) */}
        <line x1={cx} y1={cy} x2={bl.x} y2={bl.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.2, strokeDasharray: '4 3' }} />
        <line x1={cx} y1={cy} x2={br.x} y2={br.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.2, strokeDasharray: '4 3' }} />
        <LigandNode x={bl.x} y={bl.y} label={ligandLabel} r={ligR} fontSize={fontSize} faded />
        <LigandNode x={br.x} y={br.y} label={ligandLabel} r={ligR} fontSize={fontSize} faded />

        {/* Axial bonds */}
        <line x1={cx} y1={cy} x2={top.x} y2={top.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.6 }} />
        <line x1={cx} y1={cy} x2={bot.x} y2={bot.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.6 }} />

        {/* Front equatorial bonds (solid bold) */}
        <line x1={cx} y1={cy} x2={fl.x} y2={fl.y} style={{ stroke: 'var(--fg)', strokeWidth: 3.2 }} />
        <line x1={cx} y1={cy} x2={fr.x} y2={fr.y} style={{ stroke: 'var(--fg)', strokeWidth: 3.2 }} />

        <MetalNode x={cx} y={cy} label={metalLabel} r={metalR} fontSize={fontSize} />
        <LigandNode x={top.x} y={top.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
        <LigandNode x={bot.x} y={bot.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
        <LigandNode x={fl.x} y={fl.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
        <LigandNode x={fr.x} y={fr.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
      </g>
    )
  }

  if (geometry === 'tetrahedral') {
    const top = { x: cx, y: cy - radius * 0.96 }
    const left = { x: cx - radius * 0.88, y: cy + radius * 0.42 }
    const front = { x: cx + radius * 0.24, y: cy + radius * 0.78 }
    const back = { x: cx + radius * 0.86, y: cy + radius * 0.14 }

    return (
      <g>
        {/* Subtle tetrahedral outline */}
        <polygon
          points={`${top.x},${top.y} ${left.x},${left.y} ${front.x},${front.y}`}
          style={{ fill: 'var(--accent-soft)', stroke: EDGE_COLOR, strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <line x1={top.x} y1={top.y} x2={back.x} y2={back.y} style={{ stroke: EDGE_COLOR, strokeWidth: 1, strokeDasharray: '3 3' }} />
        <line x1={front.x} y1={front.y} x2={back.x} y2={back.y} style={{ stroke: EDGE_COLOR, strokeWidth: 1, strokeDasharray: '3 3' }} />

        {/* Back bond */}
        <line x1={cx} y1={cy} x2={back.x} y2={back.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.2, strokeDasharray: '4 3' }} />
        <LigandNode x={back.x} y={back.y} label={ligandLabel} r={ligR} fontSize={fontSize} faded />

        {/* In-plane and front bonds */}
        <line x1={cx} y1={cy} x2={top.x} y2={top.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.6 }} />
        <line x1={cx} y1={cy} x2={left.x} y2={left.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.6 }} />
        <line x1={cx} y1={cy} x2={front.x} y2={front.y} style={{ stroke: 'var(--fg)', strokeWidth: 3.4 }} />

        <MetalNode x={cx} y={cy} label={metalLabel} r={metalR} fontSize={fontSize} />
        <LigandNode x={top.x} y={top.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
        <LigandNode x={left.x} y={left.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
        <LigandNode x={front.x} y={front.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
      </g>
    )
  }

  // Square planar
  const fl = { x: cx - radius * 0.85, y: cy + radius * 0.42 }
  const fr = { x: cx + radius * 0.68, y: cy + radius * 0.42 }
  const bl = { x: cx - radius * 0.68, y: cy - radius * 0.42 }
  const br = { x: cx + radius * 0.85, y: cy - radius * 0.42 }

  return (
    <g>
      <polygon
        points={`${fl.x},${fl.y} ${fr.x},${fr.y} ${br.x},${br.y} ${bl.x},${bl.y}`}
        style={{
          fill: 'var(--accent-soft)',
          stroke: EDGE_COLOR,
          strokeWidth: 1.4,
          strokeDasharray: '4 3',
        }}
      />
      <line x1={cx} y1={cy} x2={bl.x} y2={bl.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.2, strokeDasharray: '4 3' }} />
      <line x1={cx} y1={cy} x2={br.x} y2={br.y} style={{ stroke: BOND_COLOR, strokeWidth: 2.2, strokeDasharray: '4 3' }} />
      <LigandNode x={bl.x} y={bl.y} label={ligandLabel} r={ligR} fontSize={fontSize} faded />
      <LigandNode x={br.x} y={br.y} label={ligandLabel} r={ligR} fontSize={fontSize} faded />

      <line x1={cx} y1={cy} x2={fl.x} y2={fl.y} style={{ stroke: 'var(--fg)', strokeWidth: 3.2 }} />
      <line x1={cx} y1={cy} x2={fr.x} y2={fr.y} style={{ stroke: 'var(--fg)', strokeWidth: 3.2 }} />

      <MetalNode x={cx} y={cy} label={metalLabel} r={metalR} fontSize={fontSize} />
      <LigandNode x={fl.x} y={fl.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
      <LigandNode x={fr.x} y={fr.y} label={ligandLabel} r={ligR} fontSize={fontSize} />
    </g>
  )
}
