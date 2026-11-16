import React, { forwardRef, useMemo } from 'react'
import {
  ethaneTorsionalEnergy,
  plotX,
  plotY,
  sampleCurve,
  torsionalExtremes,
  type PlotBox,
} from './hydrocarbon-geometry'

const BOX: PlotBox = { left: 66, top: 34, width: 380, height: 232, eMin: -0.8, eMax: 3.6 }
/** Size of the plot, for a parent viewBox. The right margin holds the barrier bracket. */
export const TORSIONAL_PLOT_SIZE = { width: 580, height: 330 } as const

export interface TorsionalEnergyPlotProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Dihedral of the marker, in degrees (0 to 360). */
  dihedral?: number
  /** Energy in kcal/mol above the staggered form, as a function of dihedral in degrees. Defaults to ethane. */
  energy?: (dihedral: number) => number
  x?: number
  y?: number
}

function Text({ x, y, children, anchor = 'middle', size = 15, fill = 'var(--fg-muted)' }: {
  x: number
  y: number
  children: React.ReactNode
  anchor?: 'start' | 'middle' | 'end'
  size?: number
  fill?: string
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" fontSize={size} fontFamily="var(--font-sans)" fill={fill}>
      {children}
    </text>
  )
}

/**
 * Energy against dihedral angle for ethane: maxima are the eclipsed forms, minima the staggered
 * forms, and the barrier between them is bracketed. A marker follows the `dihedral` prop, so it
 * can sit beside a Newman projection and move with it.
 */
export const TorsionalEnergyPlot = forwardRef<SVGGElement, TorsionalEnergyPlotProps>(function TorsionalEnergyPlot(
  { dihedral = 0, energy = ethaneTorsionalEnergy, x = 0, y = 0, ...rest },
  ref
) {
  const box = BOX
  const curve = useMemo(() => sampleCurve(BOX, energy, 2), [energy])
  const { maxima, minima } = useMemo(() => torsionalExtremes(energy), [energy])
  const d = ((dihedral % 360) + 360) % 360
  const markerE = energy(d)
  const eStag = Math.min(...minima.map((m) => energy(m)))
  const eEcl = Math.max(...maxima.map((m) => energy(m)))
  const barrier = eEcl - eStag
  const bottom = box.top + box.height
  const right = box.left + box.width
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const yTicks = [0, 1, 2, 3]
  const xTicks = [0, 60, 120, 180, 240, 300, 360]
  const markerX = plotX(box, d)
  const markerY = plotY(box, markerE)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Gridlines and y ticks */}
      {yTicks.map((t) => (
        <g key={`y-${t}`}>
          <line x1={box.left} x2={right} y1={plotY(box, t)} y2={plotY(box, t)} stroke="var(--border)" strokeWidth={1} />
          <Text x={box.left - 12} y={plotY(box, t)} anchor="end">
            {String(t)}
          </Text>
        </g>
      ))}
      {/* Eclipsed barrier reference */}
      <line x1={box.left} x2={right} y1={plotY(box, eEcl)} y2={plotY(box, eEcl)} stroke="var(--fg-subtle)" strokeWidth={1} strokeDasharray="4 4" />
      {/* Axes */}
      <line x1={box.left} x2={box.left} y1={box.top} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.6} />
      <line x1={box.left} x2={right} y1={bottom} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.6} />
      {xTicks.map((t) => (
        <g key={`x-${t}`}>
          <line x1={plotX(box, t)} x2={plotX(box, t)} y1={bottom} y2={bottom + 6} stroke="var(--fg-muted)" strokeWidth={1.4} />
          <Text x={plotX(box, t)} y={bottom + 22}>
            {`${t}°`}
          </Text>
        </g>
      ))}
      <Text x={box.left + box.width / 2} y={bottom + 50} size={16}>
        Dihedral angle θ
      </Text>
      <text x={18} y={box.top + box.height / 2} textAnchor="middle" dominantBaseline="central" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)" transform={`rotate(-90 18 ${box.top + box.height / 2})`}>
        Energy / kcal mol⁻¹
      </text>

      {/* Curve */}
      <path d={path} fill="none" stroke="var(--energy-curve)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {/* Barrier bracket in the right margin */}
      <line x1={right + 16} x2={right + 16} y1={plotY(box, eStag)} y2={plotY(box, eEcl)} stroke="var(--fg)" strokeWidth={1.6} />
      <line x1={right + 10} x2={right + 22} y1={plotY(box, eStag)} y2={plotY(box, eStag)} stroke="var(--fg)" strokeWidth={1.6} />
      <line x1={right + 10} x2={right + 22} y1={plotY(box, eEcl)} y2={plotY(box, eEcl)} stroke="var(--fg)" strokeWidth={1.6} />
      <Text x={right + 30} y={(plotY(box, eStag) + plotY(box, eEcl)) / 2 - 22} anchor="start" size={15} fill="var(--fg)">
        Barrier
      </Text>
      <Text x={right + 30} y={(plotY(box, eStag) + plotY(box, eEcl)) / 2} anchor="start" size={15} fill="var(--fg)">
        {`${barrier.toFixed(1)} kcal`}
      </Text>
      <Text x={right + 30} y={(plotY(box, eStag) + plotY(box, eEcl)) / 2 + 22} anchor="start" size={15} fill="var(--fg)">
        mol⁻¹
      </Text>

      {/* Labelled points: eclipsed maxima above, staggered minima below */}
      {maxima.map((m) => {
        const px = plotX(box, m)
        const py = plotY(box, energy(m))
        // The label stays inside the plot: the one at 0 sits right of its point, the one at 360 left of it.
        const anchor = m === 0 ? 'start' : m === 360 ? 'end' : 'middle'
        const lx = m === 0 ? px + 12 : m === 360 ? px - 12 : px
        return (
          <g key={`max-${m}`}>
            <circle cx={px} cy={py} r={4.5} fill="var(--surface)" stroke="var(--energy-curve)" strokeWidth={2} />
            <Text x={lx} y={py - (m === 0 || m === 360 ? 4 : 18)} anchor={anchor} size={15} fill="var(--fg)">
              eclipsed
            </Text>
          </g>
        )
      })}
      {minima.map((m) => {
        const px = plotX(box, m)
        const py = plotY(box, energy(m))
        return (
          <g key={`min-${m}`}>
            <circle cx={px} cy={py} r={4.5} fill="var(--surface)" stroke="var(--energy-curve)" strokeWidth={2} />
            <Text x={px} y={py + 18} size={15} fill="var(--fg)">
              staggered
            </Text>
          </g>
        )
      })}

      {/* Marker that follows the dihedral prop */}
      <line x1={markerX} x2={markerX} y1={markerY + 9} y2={bottom} stroke="var(--fg-subtle)" strokeWidth={1.2} strokeDasharray="3 3" />
      <circle cx={markerX} cy={markerY} r={8} fill="var(--energy-curve)" stroke="var(--surface)" strokeWidth={2.5} />
    </g>
  )
})
