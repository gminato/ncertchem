import React from 'react'
import styles from './ScaleLegend.module.css'

export interface ScaleLegendProps {
  /** Gradient colours, from the low end to the high end. */
  stops: readonly string[]
  domain: readonly [number, number]
  /** Unit shown after the min and max, for example "eV" or "Pauling". */
  unit: string
  /** What the colours encode, for example "Electronegativity". */
  label: string
  kind: 'sequential' | 'diverging'
  /** The neutral value on a diverging scale. Labelled at the centre of the bar. */
  midpoint?: number
  className?: string
}

function format(value: number): string {
  return Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, '')
}

/**
 * A colour key for a heatmap: a gradient bar with min and max (and midpoint for
 * diverging scales), plus a swatch for missing values.
 */
export function ScaleLegend({
  stops,
  domain,
  unit,
  label,
  kind,
  midpoint,
  className,
}: ScaleLegendProps) {
  const [min, max] = domain
  const gradient = `linear-gradient(to right, ${stops.join(', ')})`
  const ariaLabel =
    kind === 'diverging' && midpoint !== undefined
      ? `${label}: from ${format(min)} to ${format(max)} ${unit}, neutral at ${format(midpoint)} ${unit}`
      : `${label}: from ${format(min)} to ${format(max)} ${unit}`
  const midpointPct = kind === 'diverging' && midpoint !== undefined && max !== min
    ? ((midpoint - min) / (max - min)) * 100
    : null

  return (
    <div className={`${styles.legend} ${className ?? ''}`}>
      <div className={styles.heading}>
        <span className={styles.label}>{label}</span>
        <span className={styles.unit}>{unit}</span>
      </div>
      <div className={styles.barWrap} role="img" aria-label={ariaLabel}>
        <div className={styles.bar} style={{ background: gradient }} />
        {midpointPct !== null && (
          <span className={styles.tick} style={{ left: `${midpointPct}%` }} aria-hidden="true" />
        )}
      </div>
      <div className={styles.scale} aria-hidden="true">
        <span>{format(min)}</span>
        {midpointPct !== null && midpoint !== undefined && (
          <span className={styles.mid} style={{ left: `${midpointPct}%` }}>
            {format(midpoint)}
          </span>
        )}
        <span>{format(max)}</span>
      </div>
      <div className={styles.missing}>
        <span className={styles.swatch} aria-hidden="true" />
        <span>No data</span>
      </div>
    </div>
  )
}
