import React, { forwardRef } from 'react'
import { SERIES_TONE } from './tones'

/** Centre-to-centre spacing of the lattice sites, in SVG units. */
export const LATTICE_SPACING = 40
const METAL_R = 12
const SMALL_R = 9

export interface LatticeSite {
  row: number
  col: number
  x: number
  y: number
}

/** Metal sites of a square-grid layer, origin at the top-left corner of the first site's cell. */
export function latticeSites(rows: number, cols: number, spacing = LATTICE_SPACING): LatticeSite[] {
  const out: LatticeSite[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ row: r, col: c, x: (c + 0.5) * spacing, y: (r + 0.5) * spacing })
    }
  }
  return out
}

/** Holes at the centres of alternate squares (a checkerboard), where a small atom can sit between four metals. */
export function interstitialSites(rows: number, cols: number, spacing = LATTICE_SPACING): LatticeSite[] {
  const out: LatticeSite[] = []
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      if ((r + c) % 2 === 0) out.push({ row: r, col: c, x: (c + 1) * spacing, y: (r + 1) * spacing })
    }
  }
  return out
}

/** Sites taken by a second metal in an alloy: one site in four, in a regular pattern. */
export function substitutionSites(rows: number, cols: number): LatticeSite[] {
  return latticeSites(rows, cols).filter((s) => s.row % 2 === 0 && s.col % 2 === 0)
}

export interface MetalLatticeProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  rows?: number
  cols?: number
  x?: number
  y?: number
  /** Fill of the host metal. Use a series tone (SERIES_TONE) so the same metal looks the same everywhere. */
  tone?: string
  /** Small atom (H, C or N) in the holes between metal atoms. */
  interstitial?: 'H' | 'C' | 'N'
  /** A second metal replacing some host sites, for an alloy. */
  alloy?: { symbol: string; tone: string }
}

/** A square-grid layer of metal atoms, with optional interstitial atoms in the holes or substitutional atoms in the sites. */
export const MetalLattice = forwardRef<SVGGElement, MetalLatticeProps>(function MetalLattice(
  { rows = 4, cols = 6, x = 0, y = 0, tone = SERIES_TONE['3d'], interstitial, alloy, ...rest },
  ref
) {
  const subs = alloy ? substitutionSites(rows, cols) : []
  const subKeys = new Set(subs.map((s) => `${s.row},${s.col}`))
  const sites = latticeSites(rows, cols)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden="true" data-lattice="metal" {...rest}>
      {sites.map((s) => {
        const isAlloy = subKeys.has(`${s.row},${s.col}`)
        const fill = isAlloy && alloy ? alloy.tone : tone
        return (
          <g key={`${s.row},${s.col}`}>
            <circle cx={s.x} cy={s.y} r={METAL_R} style={{ fill, stroke: 'var(--glass-wall)', strokeWidth: 1 }} />
            {isAlloy && alloy && (
              <text
                x={s.x}
                y={s.y + 5}
                textAnchor="middle"
                fontSize={14}
                style={{ fill: 'var(--surface)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
              >
                {alloy.symbol}
              </text>
            )}
          </g>
        )
      })}
      {interstitial &&
        interstitialSites(rows, cols).map((s) => (
          <g key={`i${s.row},${s.col}`}>
            <circle cx={s.x} cy={s.y} r={SMALL_R} style={{ fill: 'var(--ion-anion)', stroke: 'var(--glass-wall)', strokeWidth: 1 }} />
            <text
              x={s.x}
              y={s.y + 5}
              textAnchor="middle"
              fontSize={14}
              style={{ fill: 'var(--surface)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
            >
              {interstitial}
            </text>
          </g>
        ))}
    </g>
  )
})

/** Width and height of a lattice drawing, for layouts. */
export function latticeSize(rows = 4, cols = 6, spacing = LATTICE_SPACING): { width: number; height: number } {
  return { width: cols * spacing, height: rows * spacing }
}
