import React, { forwardRef, useMemo } from 'react'
import {
  ethaneTorsionalEnergy,
  plotX,
  plotY,
  sampleCurve,
  torsionalExtremes,
  type PlotBox,
} from './hydrocarbon-geometry'

const BOX: PlotBox = { left: 76, top: 40, width: 400, height: 260, eMin: -2.5, eMax: 15.5 }
/** Size of the plot, for a parent viewBox. The right margin holds the barrier bracket. */
export const TORSIONAL_PLOT_SIZE = { width: 610, height: 370 } as const

export interface TorsionalEnergyPlotProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Dihedral of the marker, in degrees (0 to 360). */
  dihedral?: number
  /** Energy in kJ/mol above the staggered form, as a function of dihedral in degrees. Defaults to ethane (12.5 kJ/mol barrier). */
  energy?: (dihedral: number) => number
  x?: number
  y?: number
}

function Text({ x, y, children, anchor = 'middle', size = 16, fill = 'var(--fg-muted)' }: {
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
 * Energy against dihedral angle for ethane, in kJ/mol: maxima are the eclipsed forms, minima the
 * staggered forms, and the barrier between them is bracketed. A marker follows the `dihedral` prop,
 * so it can sit beside a Newman projection and move with it.
 */
export const TorsionalEnergyPlot = forwardRef<SVGGElement, TorsionalEnergyPlotProps>(function TorsionalEnergyPlot(
  { dihedral = 0, energy = ethaneTorsionalEnergy, x = 0, y = 0, ...rest },
  ref
) {
  const curve = useMemo(() => sampleCurve(BOX, energy, 2), [energy])
  const { maxima, minima } = useMemo(() => torsionalExtremes(energy), [energy])
  const box = BOX
  const d = ((dihedral % 360) + 360) % 360
  const markerE = energy(d)
  const eStag = Math.min(...minima.map((m) => energy(m)))
  const eEcl = Math.max(...maxima.map((m) => energy(m)))
  const barrier = eEcl - eStag
  const bottom = box.top + box.height
  const right = box.left + box.width
  const path = curve.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const yTicks = [0, 5, 10]
  const xTicks = [0, 60, 120, 180, 240, 300, 360]
  const markerX = plotX(box, d)
  const markerY = plotY(box, markerE)
  const midBarrier = (plotY(box, eStag) + plotY(box, eEcl)) / 2

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {yTicks.map((t) => (
        <g key={`y-${t}`}>
          <line x1={box.left} x2={right} y1={plotY(box, t)} y2={plotY(box, t)} stroke="var(--border)" strokeWidth={1} />
          <Text x={box.left - 12} y={plotY(box, t)} anchor="end">
            {String(t)}
          </Text>
        </g>
      ))}
      {/* The barrier height, marked on the axis and across the plot */}
      <line x1={box.left} x2={right} y1={plotY(box, eEcl)} y2={plotY(box, eEcl)} stroke="var(--fg-subtle)" strokeWidth={1} strokeDasharray="4 4" />
      <Text x={box.left - 12} y={plotY(box, eEcl)} anchor="end" fill="var(--fg)">
        12.5
      </Text>
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
      <Text x={box.left + box.width / 2} y={bottom + 50} size={17}>
        Dihedral angle θ
      </Text>
      <text x={20} y={box.top + box.height / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)" transform={`rotate(-90 20 ${box.top + box.height / 2})`}>
        Energy / kJ mol⁻¹
      </text>

      <path d={path} fill="none" stroke="var(--energy-curve)" strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Barrier bracket in the right margin */}
      <line x1={right + 16} x2={right + 16} y1={plotY(box, eStag)} y2={plotY(box, eEcl)} stroke="var(--fg)" strokeWidth={1.8} />
      <line x1={right + 10} x2={right + 22} y1={plotY(box, eStag)} y2={plotY(box, eStag)} stroke="var(--fg)" strokeWidth={1.8} />
      <line x1={right + 10} x2={right + 22} y1={plotY(box, eEcl)} y2={plotY(box, eEcl)} stroke="var(--fg)" strokeWidth={1.8} />
      <Text x={right + 30} y={midBarrier - 12} anchor="start" size={16} fill="var(--fg)">
        Barrier
      </Text>
      <Text x={right + 30} y={midBarrier + 10} anchor="start" size={16} fill="var(--fg)">
        {`${barrier.toFixed(1)} kJ mol⁻¹`}
      </Text>

      {maxima.map((m) => {
        const px = plotX(box, m)
        const py = plotY(box, energy(m))
        const anchor = m === 0 ? 'start' : m === 360 ? 'end' : 'middle'
        const lx = m === 0 ? px + 12 : m === 360 ? px - 12 : px
        return (
          <g key={`max-${m}`}>
            <circle cx={px} cy={py} r={5} fill="var(--surface)" stroke="var(--energy-curve)" strokeWidth={2} />
            <Text x={lx} y={py - (m === 0 || m === 360 ? 4 : 20)} anchor={anchor} size={16} fill="var(--fg)">
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
            <circle cx={px} cy={py} r={5} fill="var(--surface)" stroke="var(--energy-curve)" strokeWidth={2} />
            <Text x={px} y={py + 20} size={16} fill="var(--fg)">
              staggered
            </Text>
          </g>
        )
      })}

      <line x1={markerX} x2={markerX} y1={markerY + 10} y2={bottom} stroke="var(--fg-subtle)" strokeWidth={1.2} strokeDasharray="3 3" />
      <circle cx={markerX} cy={markerY} r={9} fill="var(--energy-curve)" stroke="var(--surface)" strokeWidth={2.5} />
    </g>
  )
})
