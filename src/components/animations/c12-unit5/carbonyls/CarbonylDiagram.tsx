'use client'

import {
  PI_TONE,
  SIGMA_TONE,
  carbonylLayout,
  metalTone,
  type BridgingLigand,
  type MetalNode,
  type TerminalLigand,
} from './carbonyl-geometry'

export interface CarbonylDiagramProps {
  formula: string
  /** Centre x in parent SVG coordinates. */
  cx: number
  /** Centre y in parent SVG coordinates. */
  cy: number
  /** Scale factor applied to bond lengths (text size stays legible >= 15px in parent viewBox). */
  scale?: number
  /** Highlight the M-M bond line (used in Step 2 of carbonyl-structures). */
  highlightMetalBond?: boolean
  /** Mute terminal CO labels (used in Step 2 of carbonyl-structures). */
  muteTerminalCO?: boolean
  /** Highlight bridging CO groups (used in Step 3 of carbonyl-structures). */
  highlightBridges?: boolean
  /** Overlay sigma donation arrows (C -> M, ligand tone). */
  showSigma?: boolean
  /** Overlay pi back donation arrows (M -> C, metal tone). */
  showPi?: boolean
  /** Show subtle 3D geometry guide polygons. */
  showGuides?: boolean
  /** Base font size in parent SVG coordinates. */
  fontSize?: number
  /** Unique prefix for SVG markers so multiple diagrams on the same page do not collide. */
  markerPrefix?: string
}

/** Compute shortened segment endpoints so lines stop cleanly outside atom circles and text labels. */
function trimSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  trimStart: number,
  trimEnd: number
): { x1: number; y1: number; x2: number; y2: number; ux: number; uy: number; len: number } {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return {
    x1: x1 + ux * trimStart,
    y1: y1 + uy * trimStart,
    x2: x2 - ux * trimEnd,
    y2: y2 - uy * trimEnd,
    ux,
    uy,
    len,
  }
}

/** Draws a parallel offset arrow along a bond between (ax, ay) and (bx, by). */
function BondArrow({
  ax,
  ay,
  bx,
  by,
  offset,
  color,
  markerId,
}: {
  ax: number
  ay: number
  bx: number
  by: number
  offset: number
  color: string
  markerId: string
}) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  // Slightly pull back arrow ends so arrowhead is crisp and doesn't touch atoms
  const pad = Math.min(len * 0.14, 7)
  const ux = dx / len
  const uy = dy / len
  const sx = ax + ux * pad + nx * offset
  const sy = ay + uy * pad + ny * offset
  const ex = bx - ux * pad + nx * offset
  const ey = by - uy * pad + ny * offset
  return (
    <line
      x1={sx}
      y1={sy}
      x2={ex}
      y2={ey}
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
    />
  )
}

export function CarbonylDiagram({
  formula,
  cx,
  cy,
  scale = 1,
  highlightMetalBond = false,
  muteTerminalCO = false,
  highlightBridges = false,
  showSigma = false,
  showPi = false,
  showGuides = true,
  fontSize = 16,
  markerPrefix = 'carb',
}: CarbonylDiagramProps) {
  const layout = carbonylLayout(formula)
  const metalById = new Map<string, MetalNode>(layout.metals.map((m) => [m.id, m]))
  const metalR = Math.max(18, 22 * scale)
  const ligandTrim = Math.max(19, 22 * scale)
  const synergic = showSigma && showPi
  const bondWidth = synergic ? 3.8 : 2.3
  const sigmaMarker = `${markerPrefix}-sigma`
  const piMarker = `${markerPrefix}-pi`

  const px = (x: number) => cx + x * scale
  const py = (y: number) => cy + y * scale

  const renderTerminal = (lig: TerminalLigand) => {
    const m = metalById.get(lig.metalId)
    if (!m) return null
    const mx = px(m.x)
    const my = py(m.y)
    const lx = px(lig.x)
    const ly = py(lig.y)
    const seg = trimSegment(mx, my, lx, ly, metalR + 2, ligandTrim)
    const opacity = muteTerminalCO ? 0.36 : 1
    const isBack = lig.depth === 'back'

    return (
      <g key={lig.id} opacity={opacity}>
        <line
          x1={seg.x1}
          y1={seg.y1}
          x2={seg.x2}
          y2={seg.y2}
          stroke={synergic ? 'var(--fg)' : 'var(--bond)'}
          strokeWidth={bondWidth}
          strokeLinecap="round"
          strokeDasharray={isBack && !synergic ? '5 3' : undefined}
        />
        {showSigma && (
          <BondArrow
            ax={seg.x2}
            ay={seg.y2}
            bx={seg.x1}
            by={seg.y1}
            offset={showPi ? 6.5 : 5.5}
            color={SIGMA_TONE}
            markerId={sigmaMarker}
          />
        )}
        {showPi && (
          <BondArrow
            ax={seg.x1}
            ay={seg.y1}
            bx={seg.x2}
            by={seg.y2}
            offset={showSigma ? 6.5 : 5.5}
            color={PI_TONE}
            markerId={piMarker}
          />
        )}
        <text
          x={lx}
          y={ly + fontSize * 0.36}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={600}
          fill={muteTerminalCO ? 'var(--fg-muted)' : 'var(--fg)'}
        >
          {lig.label}
        </text>
      </g>
    )
  }

  const renderBridge = (br: BridgingLigand) => {
    const m1 = metalById.get(br.metalIds[0])
    const m2 = metalById.get(br.metalIds[1])
    if (!m1 || !m2) return null

    const bx = px(br.cx)
    const by = py(br.cy)
    const ox = px(br.ox)
    const oy = py(br.oy)

    const seg1 = trimSegment(px(m1.x), py(m1.y), bx, by, metalR + 2, 14)
    const seg2 = trimSegment(px(m2.x), py(m2.y), bx, by, metalR + 2, 14)

    // Double bond C=O pointing away from the M-M axis
    const coDirY = oy < by ? -1 : 1
    const cEndY = by + coDirY * 13
    const oEndY = oy - coDirY * 13

    return (
      <g key={br.id}>
        {highlightBridges && (
          <ellipse
            cx={bx}
            cy={(by + oy) / 2}
            rx={28}
            ry={Math.abs(oy - by) / 2 + 16}
            fill="var(--highlight)"
            stroke="var(--db-3d)"
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
        )}
        <line
          x1={seg1.x1}
          y1={seg1.y1}
          x2={seg1.x2}
          y2={seg1.y2}
          stroke={synergic ? 'var(--fg)' : highlightBridges ? 'var(--db-3d)' : 'var(--bond)'}
          strokeWidth={highlightBridges ? 3 : bondWidth}
          strokeLinecap="round"
        />
        <line
          x1={seg2.x1}
          y1={seg2.y1}
          x2={seg2.x2}
          y2={seg2.y2}
          stroke={synergic ? 'var(--fg)' : highlightBridges ? 'var(--db-3d)' : 'var(--bond)'}
          strokeWidth={highlightBridges ? 3 : bondWidth}
          strokeLinecap="round"
        />
        {showSigma && (
          <>
            <BondArrow
              ax={seg1.x2}
              ay={seg1.y2}
              bx={seg1.x1}
              by={seg1.y1}
              offset={showPi ? 6 : 5}
              color={SIGMA_TONE}
              markerId={sigmaMarker}
            />
            <BondArrow
              ax={seg2.x2}
              ay={seg2.y2}
              bx={seg2.x1}
              by={seg2.y1}
              offset={showPi ? -6 : -5}
              color={SIGMA_TONE}
              markerId={sigmaMarker}
            />
          </>
        )}
        {showPi && (
          <>
            <BondArrow
              ax={seg1.x1}
              ay={seg1.y1}
              bx={seg1.x2}
              by={seg1.y2}
              offset={showSigma ? 6 : 5}
              color={PI_TONE}
              markerId={piMarker}
            />
            <BondArrow
              ax={seg2.x1}
              ay={seg2.y1}
              bx={seg2.x2}
              by={seg2.y2}
              offset={showSigma ? -6 : -5}
              color={PI_TONE}
              markerId={piMarker}
            />
          </>
        )}
        {/* C=O double bond */}
        <line x1={bx - 3} y1={cEndY} x2={bx - 3} y2={oEndY} stroke="var(--bond)" strokeWidth={2} />
        <line x1={bx + 3} y1={cEndY} x2={bx + 3} y2={oEndY} stroke="var(--bond)" strokeWidth={2} />
        <text x={bx} y={by + fontSize * 0.36} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill="var(--fg)">
          C
        </text>
        <text x={ox} y={oy + fontSize * 0.36} textAnchor="middle" fontSize={fontSize} fontWeight={700} fill="var(--el-O)">
          O
        </text>
      </g>
    )
  }

  return (
    <g data-carbonyl={formula}>
      {(showSigma || showPi) && (
        <defs>
          <marker id={sigmaMarker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill={SIGMA_TONE} />
          </marker>
          <marker id={piMarker} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 10 5 L 0 9 z" fill={PI_TONE} />
          </marker>
        </defs>
      )}

      {/* Subtle geometry guides (equatorial triangle / square / tetrahedral base) */}
      {showGuides &&
        layout.guides?.map((g, i) => (
          <polygon
            key={i}
            points={g.points.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join(' ')}
            fill="var(--accent-soft)"
            fillOpacity={0.35}
            stroke="var(--border)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        ))}

      {/* Metal-metal bond */}
      {layout.metalBond &&
        (() => {
          const from = metalById.get(layout.metalBond.fromId)
          const to = metalById.get(layout.metalBond.toId)
          if (!from || !to) return null
          const seg = trimSegment(px(from.x), py(from.y), px(to.x), py(to.y), metalR + 2, metalR + 2)
          const midX = (seg.x1 + seg.x2) / 2
          const midY = (seg.y1 + seg.y2) / 2
          return (
            <g>
              {highlightMetalBond && (
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke="var(--db-3d)"
                  strokeOpacity={0.28}
                  strokeWidth={14}
                  strokeLinecap="round"
                />
              )}
              <line
                x1={seg.x1}
                y1={seg.y1}
                x2={seg.x2}
                y2={seg.y2}
                stroke={highlightMetalBond ? 'var(--db-3d)' : 'var(--fg)'}
                strokeWidth={highlightMetalBond ? 5.5 : 3.2}
                strokeLinecap="round"
              />
              <text
                x={midX}
                y={midY - 12}
                textAnchor="middle"
                fontSize={Math.max(15, fontSize - 1)}
                fontWeight={highlightMetalBond ? 700 : 600}
                fill={highlightMetalBond ? 'var(--db-3d)' : 'var(--fg-muted)'}
              >
                {layout.metalBond.label}
              </text>
            </g>
          )
        })()}

      {/* Terminal ligands */}
      {layout.terminals.map(renderTerminal)}

      {/* Bridging ligands */}
      {layout.bridges.map(renderBridge)}

      {/* Metal centres */}
      {layout.metals.map((m) => {
        const tone = metalTone(m.symbol)
        const mx = px(m.x)
        const my = py(m.y)
        return (
          <g key={m.id}>
            <circle cx={mx} cy={my} r={metalR} fill="var(--surface)" />
            <circle cx={mx} cy={my} r={metalR} fill={tone} fillOpacity={0.22} stroke={tone} strokeWidth={2.5} />
            <text
              x={mx}
              y={my + (fontSize + 1) * 0.35}
              textAnchor="middle"
              fontSize={fontSize + 1}
              fontWeight={700}
              fill="var(--fg)"
            >
              {m.symbol}
            </text>
          </g>
        )
      })}
    </g>
  )
}
