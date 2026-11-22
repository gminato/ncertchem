import React, { forwardRef } from 'react'
import { OrbitalBox, orbitalBoxWidth, type OrbitalSpin } from '../OrbitalBox'

/** Orbitals in each subshell type: s 1, p 3, d 5, f 7. */
const ORBITALS_PER_LETTER = { s: 1, p: 3, d: 5, f: 7 } as const

/** How many orbitals a subshell name such as "3d" or "4f" holds. Throws for anything else. */
export function orbitalsIn(subshell: string): number {
  const letter = subshell.slice(-1) as keyof typeof ORBITALS_PER_LETTER
  const n = ORBITALS_PER_LETTER[letter]
  if (n === undefined || !/^\d[spdf]$/.test(subshell)) throw new RangeError(`Not a subshell name: ${subshell}`)
  return n
}

/**
 * Box-and-arrow occupancy for one subshell: Hund's rule (one electron in each
 * orbital, spin up, before any pairing), then Pauli (a second electron pairs
 * with a spin-up one). Pure, so the drawing and the tests share it.
 */
export function fillSubshell(electrons: number, orbitals: number): OrbitalSpin[] {
  if (!Number.isInteger(electrons) || electrons < 0 || electrons > 2 * orbitals) {
    throw new RangeError(`Cannot place ${electrons} electrons in ${orbitals} orbitals`)
  }
  const out: OrbitalSpin[] = Array.from({ length: orbitals }, () => ({ up: false, down: false }))
  for (let i = 0; i < electrons; i++) {
    if (i < orbitals) out[i].up = true
    else out[i - orbitals].down = true
  }
  return out
}

export interface SubshellConfig {
  /** Subshell name in NCERT order, e.g. "3d" or "4s". */
  subshell: string
  /** Electrons still in the subshell. */
  electrons: number
  /** Electrons lost on ionisation. Drawn as faded arrows in their original places. */
  removed?: number
}

export interface ConfigurationBoxesProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Subshells in the order they are drawn, left to right (NCERT order: (n−1)d before ns). */
  config: readonly SubshellConfig[]
  /** A subshell to outline, optionally with some of its boxes only. */
  highlight?: { subshell: string; orbitals?: readonly number[] }
  x?: number
  y?: number
  /** Width the whole row must fit in, in SVG units. */
  width?: number
  /** Largest box side. The row shrinks boxes to fit the width. */
  maxSize?: number
  fontSize?: number
}

export interface ConfigurationRow {
  subshell: string
  x: number
  width: number
  orbitals: number
}

export interface ConfigurationLayout {
  size: number
  gap: number
  rows: ConfigurationRow[]
  width: number
  height: number
}

const GAP_IN_SUBSHELL = 6
const GAP_BETWEEN_SUBSHELLS = 22

/** Box size and positions that fit the subshells in one row, centred in the given width. */
export function configurationLayout(config: readonly SubshellConfig[], width = 560, maxSize = 36): ConfigurationLayout {
  if (config.length === 0) throw new RangeError('A configuration needs at least one subshell')
  const counts = config.map((c) => orbitalsIn(c.subshell))
  const boxes = counts.reduce((a, b) => a + b, 0)
  const withinGaps = counts.reduce((a, b) => a + Math.max(0, b - 1), 0)
  const labels = orbitalBoxWidth(1, { size: 0, gap: 0, hasLabel: true })
  const fixed = labels * config.length + GAP_BETWEEN_SUBSHELLS * (config.length - 1) + GAP_IN_SUBSHELL * withinGaps
  const size = Math.min(maxSize, Math.floor((width - fixed) / boxes))
  if (size < 16) throw new RangeError(`Configuration does not fit in ${width} units`)
  const rowWidths = counts.map((n) => orbitalBoxWidth(n, { size, gap: GAP_IN_SUBSHELL, hasLabel: true }))
  const total = rowWidths.reduce((a, b) => a + b, 0) + GAP_BETWEEN_SUBSHELLS * (config.length - 1)
  let x = (width - total) / 2
  const rows = config.map((c, i) => {
    const row = { subshell: c.subshell, x, width: rowWidths[i], orbitals: counts[i] }
    x += rowWidths[i] + GAP_BETWEEN_SUBSHELLS
    return row
  })
  return { size, gap: GAP_IN_SUBSHELL, rows, width, height: size }
}

/** The configuration boxes of one atom or ion: subshells side by side, each a row of OrbitalBox boxes. */
export const ConfigurationBoxes = forwardRef<SVGGElement, ConfigurationBoxesProps>(function ConfigurationBoxes(
  { config, highlight, x = 0, y = 0, width = 560, maxSize = 36, fontSize = 14, ...rest },
  ref
) {
  const layout = configurationLayout(config, width, maxSize)
  const { size, gap } = layout
  const labelWidth = orbitalBoxWidth(1, { size, gap, hasLabel: true }) - orbitalBoxWidth(1, { size, gap, hasLabel: false })

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden="true" data-testid="configuration-boxes" {...rest}>
      {config.map((c, i) => {
        const row = layout.rows[i]
        const displayed = fillSubshell(c.electrons, row.orbitals)
        const removed = c.removed ?? 0
        const original = fillSubshell(c.electrons + removed, row.orbitals)
        const outlined =
          highlight && highlight.subshell === c.subshell ? (highlight.orbitals ?? displayed.map((_, k) => k)) : []
        const ghosts: React.ReactNode[] = []
        if (removed > 0) {
          const originX = labelWidth
          original.forEach((o, k) => {
            const bx = originX + k * (size + gap)
            const top = size * 0.2
            const bottom = size * 0.8
            if (o.up && !displayed[k].up) {
              const gx = bx + size * 0.36
              ghosts.push(
                <path key={`g-up-${k}`} d={`M${gx} ${bottom} V${top} M${gx - 4} ${top + 6} L${gx} ${top} L${gx + 4} ${top + 6}`} data-testid="removed-electron" />
              )
            }
            if (o.down && !displayed[k].down) {
              const gx = bx + size * 0.64
              ghosts.push(
                <path key={`g-down-${k}`} d={`M${gx} ${top} V${bottom} M${gx - 4} ${bottom - 6} L${gx} ${bottom} L${gx + 4} ${bottom - 6}`} data-testid="removed-electron" />
              )
            }
          })
        }
        return (
          <g key={`${c.subshell}-${i}`} transform={`translate(${row.x}, 0)`} data-subshell={c.subshell}>
            <OrbitalBox
              orbitals={displayed}
              label={c.subshell}
              highlight={outlined}
              size={size}
              gap={gap}
              fontSize={fontSize}
            />
            {ghosts.length > 0 && (
              <g
                style={{ stroke: 'var(--electron)', fill: 'none', strokeWidth: 1.8, strokeDasharray: '3 2.5', strokeLinecap: 'round', strokeLinejoin: 'round', opacity: 0.75 }}
              >
                {ghosts}
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
})
