import React, { forwardRef, useMemo } from 'react'
import { EnergyLevel } from './EnergyLevel'
import { Label } from './Label'
import { ladderY } from './ladder'
import { ladderLabels } from './placement'

export interface EnergyLadderLevel {
  /** The text shown beside the rung, for example "n = 2 (−3.40 eV)". */
  label: React.ReactNode
  /** Energy in any consistent unit (for example eV). Higher energy is drawn higher. */
  energy: number
}

export interface EnergyLadderProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  levels: readonly EnergyLadderLevel[]
  /** Origin of the ladder group. The rungs and labels are positioned relative to it. */
  x?: number
  y?: number
  /** Y of the lowest-energy rung and of the highest-energy rung (local units). */
  bottom: number
  top: number
  /** Start and end of every rung along x (local units). */
  rungLeft: number
  rungRight: number
  /** X of the label column. Defaults to just past the rungs. */
  labelX?: number
  /** Minimum vertical gap between label centres. Labels closer than this are nudged apart. */
  minLabelGap?: number
  fontSize?: number
  /** Index of the level to highlight, such as the one an electron occupies. */
  activeIndex?: number
  /** Energy values for the ends of the scale. Default to the lowest and highest level. */
  eMin?: number
  eMax?: number
}

/**
 * A vertical energy diagram: one rung per level, positioned in proportion to its
 * energy, with a label beside each rung. Labels that would collide are nudged
 * apart and joined to their rung by a thin leader line.
 */
export const EnergyLadder = forwardRef<SVGGElement, EnergyLadderProps>(function EnergyLadder(
  {
    levels,
    x = 0,
    y = 0,
    bottom,
    top,
    rungLeft,
    rungRight,
    labelX,
    minLabelGap = 13,
    fontSize = 11,
    activeIndex,
    eMin,
    eMax,
    className,
    style,
    ...rest
  },
  ref
) {
  const scale = useMemo(() => {
    const energies = levels.map((level) => level.energy)
    return {
      eMin: eMin ?? (energies.length ? Math.min(...energies) : 0),
      eMax: eMax ?? (energies.length ? Math.max(...energies) : 1),
    }
  }, [levels, eMin, eMax])

  const rungYs = levels.map((level) =>
    ladderY(level.energy, { top, bottom, eMin: scale.eMin, eMax: scale.eMax })
  )
  const placements = ladderLabels(
    rungYs.map((rungY) => ({ y: rungY })),
    minLabelGap
  )
  const labelColumn = labelX ?? rungRight + 8
  const midX = (rungLeft + rungRight) / 2
  const width = rungRight - rungLeft

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      {levels.map((level, i) => {
        const place = placements[i]
        const isActive = activeIndex === i
        return (
          <g key={`level-${i}`} data-testid="energy-ladder-level">
            <EnergyLevel variant="ladder" width={width} x={midX} y={rungYs[i]} active={isActive} />
            {place.nudged && (
              <line
                x1={rungRight}
                y1={rungYs[i]}
                x2={labelColumn - 4}
                y2={place.labelY}
                strokeWidth={0.8}
                style={{ stroke: 'var(--fg-subtle)' }}
              />
            )}
            <Label
              x={labelColumn}
              y={place.labelY}
              textAnchor="start"
              fontSize={fontSize}
              fill={isActive ? 'var(--orbit-active)' : 'var(--fg-muted)'}
              halo
            >
              {level.label}
            </Label>
          </g>
        )
      })}
    </g>
  )
})
