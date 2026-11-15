'use client'

import { forwardRef, type SVGAttributes } from 'react'

/** Drawing size in SVG units, for a vessel of 0.5 L to 2 L. */
export const PISTON_VESSEL_SIZE = { width: 200, height: 244 } as const

const LEFT = 44
const RIGHT = 156
const BASE = 220
/** Height in SVG units per litre, so the piston rises in proportion to the volume. */
const PER_LITRE = 100
const PISTON = 8
/** Most particles drawn in the vessel. Above this, each dot stands for less than one particle's share. */
const MAX_DOTS = 60
const DOT_R = 3

/** Fixed cell order, so the dots of one species never move when another species changes. */
const CELLS: Array<readonly [number, number]> = (() => {
  const cells: Array<readonly [number, number]> = []
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      // Deterministic jitter from the cell index, so the dots do not sit on a rigid grid.
      const j1 = (((row * 8 + col) * 37) % 17) / 17 - 0.5
      const j2 = (((row * 8 + col) * 53) % 19) / 19 - 0.5
      cells.push([(col + 0.5 + 0.3 * j1) / 8, (row + 0.5 + 0.3 * j2) / 8])
    }
  }
  // A fixed permutation (stride 29 is coprime with 64).
  return Array.from({ length: 64 }, (_, i) => cells[(i * 29) % 64])
})()

export interface VesselSpecies {
  id: string
  colour: string
  /** Amount in mol. Dots are drawn in proportion to it. */
  amount: number
}

export interface PistonVesselProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** Volume in litres. The piston rises and falls with it. */
  volume: number
  /** Gas species, drawn as dots. Empty for a solution. */
  species?: VesselSpecies[]
  /** A tint for the contents, such as NO₂ brown. Its strength saturates with the concentration. */
  tint?: { colour: string; concentration: number; half: number } | null
  /** A second tint on top of the first, such as the red of [Fe(SCN)]²⁺ in a solution. */
  secondTint?: { colour: string; concentration: number; half: number } | null
  /** Gas (piston drawn) or solution (fixed level, no piston). */
  medium?: 'gas' | 'solution'
  /** Caption under the vessel. */
  caption?: string
  title?: string
  x?: number
  y?: number
}

/** Dots for each species, sharing the fixed cells. Total dots are capped so the drawing stays clear. */
function dotCounts(species: VesselSpecies[], volume: number): number[] {
  const totalMol = species.reduce((sum, s) => sum + Math.max(0, s.amount) * volume, 0)
  const perMol = totalMol > 0 ? Math.min(24, MAX_DOTS / totalMol) : 0
  return species.map((s) => Math.round(Math.max(0, s.amount) * volume * perMol))
}

/**
 * A cylinder with a piston, drawn in proportion to its volume. Dots mark the gas: the same number
 * of dots in half the volume means twice the density, which is what a compression does. A tint
 * shows a coloured species, with its strength rising with concentration.
 */
export const PistonVessel = forwardRef<SVGGElement, PistonVesselProps>(function PistonVessel(
  { volume, species = [], tint = null, secondTint = null, medium = 'gas', caption, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const liquid = medium === 'solution'
  const height = liquid ? PER_LITRE : PER_LITRE * volume
  const top = BASE - height
  const width = RIGHT - LEFT
  const counts = liquid ? [] : dotCounts(species, volume)
  const tintAlpha = (t: { concentration: number; half: number }) => 0.85 * (1 - Math.exp(-t.concentration / t.half))

  let cellIndex = 0
  const dots: Array<{ key: string; cx: number; cy: number; colour: string }> = []
  species.forEach((s, si) => {
    const n = counts[si] ?? 0
    for (let i = 0; i < n && cellIndex < CELLS.length; i++, cellIndex++) {
      const [u, v] = CELLS[cellIndex]
      dots.push({ key: `${s.id}-${i}`, cx: LEFT + u * width, cy: top + v * height, colour: s.colour })
    }
  })

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Sealed vessel with a piston'} {...rest}>
      {/* Contents */}
      <rect x={LEFT} y={top} width={width} height={height} fill="var(--surface-raised)" />
      {tint && tintAlpha(tint) > 0 && <rect x={LEFT} y={top} width={width} height={height} fill={tint.colour} opacity={tintAlpha(tint)} data-testid="vessel-tint" />}
      {secondTint && tintAlpha(secondTint) > 0 && (
        <rect x={LEFT} y={top} width={width} height={height} fill={secondTint.colour} opacity={tintAlpha(secondTint)} data-testid="vessel-tint-2" />
      )}
      {dots.map((d) => (
        <circle key={d.key} cx={d.cx} cy={d.cy} r={DOT_R} fill={d.colour} stroke="var(--surface)" strokeWidth={0.6} />
      ))}

      {/* Walls and base */}
      <line x1={LEFT} y1={top - PISTON} x2={LEFT} y2={BASE} stroke="var(--fg-muted)" strokeWidth={2} />
      <line x1={RIGHT} y1={top - PISTON} x2={RIGHT} y2={BASE} stroke="var(--fg-muted)" strokeWidth={2} />
      <line x1={LEFT - 10} y1={BASE} x2={RIGHT + 10} y2={BASE} stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" />

      {/* Piston */}
      {!liquid && (
        <g data-testid="piston">
          <rect x={LEFT - 6} y={top - PISTON} width={width + 12} height={PISTON} rx={3} fill="var(--fg-subtle)" />
          <line x1={(LEFT + RIGHT) / 2} y1={top - PISTON} x2={(LEFT + RIGHT) / 2} y2={top - PISTON - 14} stroke="var(--fg-muted)" strokeWidth={2} />
        </g>
      )}

      {caption && (
        <text x={100} y={236} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
          {caption}
        </text>
      )}
    </g>
  )
})
