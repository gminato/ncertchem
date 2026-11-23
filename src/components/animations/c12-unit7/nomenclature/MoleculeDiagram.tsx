'use client'

import React from 'react'
import type { AtomNode, AtomRole, BondEdge, StructureSpec } from '@/lib/chem/c12-u7-s2-nomenclature'

export interface MoleculeDiagramProps {
  structure: StructureSpec
  /** Center X in parent SVG coordinates. */
  cx: number
  /** Center Y in parent SVG coordinates. */
  cy: number
  /** Maximum available width in parent SVG coordinates. */
  maxWidth: number
  /** Maximum available height in parent SVG coordinates. */
  maxHeight: number
  /** Upper limit on bond length in SVG px. */
  maxScale?: number
  /** Show numbered locant badges on parent carbons. */
  showNumbering?: boolean
  /** Highlight parent skeleton and functional groups softly under the drawing. */
  showHighlights?: boolean
  /** Minimum atom label font size in SVG px. */
  minFontSize?: number
}

function ellipseShrink(label: string | null, fontSize: number, ux: number, uy: number): number {
  if (!label) return 0
  // Unicode subscripts render slightly narrower than full-width caps
  const effLen = [...label].reduce((sum, ch) => sum + ('₀₁₂₃₄₅₆₇₈₉'.includes(ch) ? 0.65 : 1), 0)
  const rx = effLen * fontSize * 0.34 + 6
  const ry = fontSize * 0.58 + 4
  return 1 / Math.hypot(ux / rx, uy / ry)
}

function roleLabelColor(role: AtomRole, label: string): string {
  if (role === 'functional' || label.startsWith('O') || label === 'HO') return 'var(--atom-o)'
  if (role === 'branch') return 'var(--fwd)'
  return 'var(--fg)'
}

function roleBandStroke(role: AtomRole): string | null {
  if (role === 'parent') return 'var(--accent)'
  if (role === 'functional') return 'var(--atom-o)'
  if (role === 'branch') return 'var(--fwd)'
  return null
}

/**
 * Clean 2D organic structure renderer for Section 7.2 (Alcohols, Phenols and Ethers).
 * Renders Kekule rings, zig-zag chains, shortened bonds around atom/group labels,
 * role-colored highlights (parent skeleton vs functional group vs branches), and locant badges.
 */
export function MoleculeDiagram({
  structure,
  cx,
  cy,
  maxWidth,
  maxHeight,
  maxScale = 64,
  showNumbering = true,
  showHighlights = true,
  minFontSize = 16,
}: MoleculeDiagramProps) {
  const { atoms, bonds } = structure
  if (atoms.length === 0) return null

  // Compute bounding box in bond units including generous label & locant room
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  for (const a of atoms) {
    const padX = a.label ? 0.82 : showNumbering && a.locant !== undefined ? 0.78 : 0.35
    const padY = a.label ? 0.68 : showNumbering && a.locant !== undefined ? 0.78 : 0.35
    minX = Math.min(minX, a.x - padX)
    maxX = Math.max(maxX, a.x + padX)
    minY = Math.min(minY, a.y - padY)
    maxY = Math.max(maxY, a.y + padY)
  }

  const spanX = Math.max(1.4, maxX - minX)
  const spanY = Math.max(1.1, maxY - minY)
  const scale = Math.max(16, Math.min(maxScale, maxWidth / spanX, maxHeight / spanY))
  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2

  const toPx = (x: number, y: number) => ({
    x: cx + (x - midX) * scale,
    y: cy + (y - midY) * scale,
  })

  const atomById = new Map<string, { node: AtomNode; px: { x: number; y: number } }>()
  for (const a of atoms) {
    atomById.set(a.id, { node: a, px: toPx(a.x, a.y) })
  }

  const labelFs = Math.max(minFontSize, Math.min(22, Math.round(scale * 0.36)))
  const bondStroke = Math.max(2.0, Math.min(3.0, scale * 0.048))
  const doubleSpacing = Math.max(6, scale * 0.14)

  const renderBond = (b: BondEdge, idx: number) => {
    const from = atomById.get(b.from)
    const to = atomById.get(b.to)
    if (!from || !to) return null

    const dx = to.px.x - from.px.x
    const dy = to.px.y - from.px.y
    const len = Math.hypot(dx, dy) || 1
    const ux = dx / len
    const uy = dy / len
    const shrinkA = ellipseShrink(from.node.label, labelFs, ux, uy)
    const shrinkB = ellipseShrink(to.node.label, labelFs, ux, uy)

    const x1 = from.px.x + ux * shrinkA
    const y1 = from.px.y + uy * shrinkA
    const x2 = to.px.x - ux * shrinkB
    const y2 = to.px.y - uy * shrinkB

    if (b.order === 1) {
      return (
        <line
          key={`bond-${idx}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--fg)"
          strokeWidth={bondStroke}
          strokeLinecap="round"
        />
      )
    }

    // Double bond: if ringCenter is present, offset second line inward toward ringCenter
    const nx = -uy
    const ny = ux
    let sign = 1
    if (b.ringCenter) {
      const rc = toPx(b.ringCenter.x, b.ringCenter.y)
      const mx = (from.px.x + to.px.x) / 2
      const my = (from.px.y + to.px.y) / 2
      if ((rc.x - mx) * nx + (rc.y - my) * ny < 0) sign = -1
    }
    const inset = 0.16 * len
    const ix1 = from.px.x + ux * (shrinkA + inset) + nx * sign * doubleSpacing
    const iy1 = from.px.y + uy * (shrinkA + inset) + ny * sign * doubleSpacing
    const ix2 = to.px.x - ux * (shrinkB + inset) + nx * sign * doubleSpacing
    const iy2 = to.px.y - uy * (shrinkB + inset) + ny * sign * doubleSpacing

    return (
      <g key={`bond-${idx}`}>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="var(--fg)"
          strokeWidth={bondStroke}
          strokeLinecap="round"
        />
        <line
          x1={ix1}
          y1={iy1}
          x2={ix2}
          y2={iy2}
          stroke="var(--fg)"
          strokeWidth={Math.max(1.8, bondStroke * 0.85)}
          strokeLinecap="round"
        />
      </g>
    )
  }

  return (
    <g>
      {/* Layer 1: Soft highlight washes behind parent skeleton and functional substituent */}
      {showHighlights &&
        bonds.map((b, idx) => {
          const from = atomById.get(b.from)
          const to = atomById.get(b.to)
          const stroke = roleBandStroke(b.role)
          if (!from || !to || !stroke) return null
          return (
            <line
              key={`hi-b-${idx}`}
              x1={from.px.x}
              y1={from.px.y}
              x2={to.px.x}
              y2={to.px.y}
              stroke={stroke}
              strokeOpacity={b.role === 'parent' ? 0.17 : 0.14}
              strokeWidth={Math.max(14, Math.min(24, scale * 0.36))}
              strokeLinecap="round"
            />
          )
        })}

      {showHighlights &&
        atoms.map((a) => {
          const item = atomById.get(a.id)
          const stroke = roleBandStroke(a.role)
          if (!item || !stroke) return null
          if (!a.label && a.role === 'parent') return null
          const rx = a.label ? Math.max(14, a.label.length * labelFs * 0.38) : Math.max(11, scale * 0.24)
          return (
            <ellipse
              key={`hi-a-${a.id}`}
              cx={item.px.x}
              cy={item.px.y}
              rx={rx}
              ry={Math.max(13, labelFs * 0.78)}
              fill={stroke}
              fillOpacity={a.role === 'functional' ? 0.16 : 0.13}
            />
          )
        })}

      {/* Layer 2: Covalent bonds */}
      {bonds.map(renderBond)}

      {/* Layer 3: Atom / substituent text labels */}
      {atoms.map((a) => {
        if (!a.label) return null
        const item = atomById.get(a.id)
        if (!item) return null
        return (
          <text
            key={`lbl-${a.id}`}
            x={item.px.x}
            y={item.px.y}
            textAnchor={a.anchor ?? 'middle'}
            dominantBaseline="central"
            fontSize={labelFs}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={roleLabelColor(a.role, a.label)}
            style={{ userSelect: 'none' }}
          >
            {a.label}
          </text>
        )
      })}

      {/* Layer 4: Numbered locant badges */}
      {showNumbering &&
        atoms.map((a) => {
          if (a.locant === undefined) return null
          const item = atomById.get(a.id)
          if (!item) return null
          const angleRad = ((a.locantAngle ?? -90) * Math.PI) / 180
          const offset = a.label ? Math.max(24, scale * 0.52) : Math.max(20, scale * 0.42)
          const bx = item.px.x + offset * Math.cos(angleRad)
          const by = item.px.y + offset * Math.sin(angleRad)
          return (
            <g key={`loc-${a.id}`}>
              <circle
                cx={bx}
                cy={by}
                r={11.5}
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth={1.6}
              />
              <text
                x={bx}
                y={by}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={15}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--accent)"
                style={{ userSelect: 'none' }}
              >
                {a.locant}
              </text>
            </g>
          )
        })}
    </g>
  )
}
