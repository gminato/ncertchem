import React from 'react'
import { radiusToPx } from './atom-size'

export interface AtomSizeItem {
  label: string
  /** Second line under the label, for example "140 pm" or "isoelectronic, 10 e". */
  sublabel?: string
  radiusPm: number
  /** Charge drawn as a superscript, for example "+", "2-" or "2+". */
  charge?: string
}

export interface AtomSizeRowProps {
  items: readonly AtomSizeItem[]
  /** Labels inside the circles, or beneath them. */
  labelPlacement?: 'inside' | 'beneath'
  /** Draw a small nucleus dot at each centre. */
  nucleus?: boolean
  /** A CSS colour variable for the circles, for example "var(--electron)". */
  colorVar?: string
  maxRadiusPx?: number
  width?: number
  /** Accessible name for the row. */
  title: string
  className?: string
}

const BASE_PAD = 8
const LABEL_BLOCK = 58

/**
 * A row of circles whose radii are proportional to their radius in pm, sitting
 * on a common baseline. Used for atomic and ionic radius comparisons.
 */
export function AtomSizeRow({
  items,
  labelPlacement = 'beneath',
  nucleus = false,
  colorVar = 'var(--electron)',
  maxRadiusPx = 60,
  width = 640,
  title,
  className,
}: AtomSizeRowProps) {
  const maxPm = items.reduce((m, it) => Math.max(m, it.radiusPm), 0)
  const slot = items.length > 0 ? width / items.length : width
  const circleBottom = BASE_PAD + maxRadiusPx * 2
  const beneath = labelPlacement === 'beneath'
  const height = circleBottom + (beneath ? LABEL_BLOCK : BASE_PAD)
  const baseline = circleBottom

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label={title}
      style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
    >
      <line
        x1={0}
        x2={width}
        y1={baseline}
        y2={baseline}
        style={{ stroke: 'var(--border)', strokeWidth: 1 }}
      />
      {items.map((item, i) => {
        const cx = slot * i + slot / 2
        const r = radiusToPx(item.radiusPm, maxPm, maxRadiusPx)
        const cy = baseline - r
        const sym = (
          <>
            {item.label}
            {item.charge && (
              <tspan dy="-0.55em" fontSize="0.6em">
                {item.charge}
              </tspan>
            )}
          </>
        )
        return (
          <g key={`${item.label}-${i}`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              style={{ fill: colorVar, opacity: 0.22, stroke: colorVar, strokeWidth: 1.5 }}
            />
            {nucleus && (
              <circle cx={cx} cy={cy} r={3} style={{ fill: 'var(--proton)' }} />
            )}
            {beneath ? (
              <>
                <text
                  x={cx}
                  y={baseline + 22}
                  textAnchor="middle"
                  style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 600, fill: 'var(--fg)' }}
                >
                  {sym}
                </text>
                {item.sublabel && (
                  <text
                    x={cx}
                    y={baseline + 40}
                    textAnchor="middle"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fill: 'var(--fg-muted)' }}
                  >
                    {item.sublabel}
                  </text>
                )}
              </>
            ) : (
              <text
                x={cx}
                y={cy + 5}
                textAnchor="middle"
                style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, fill: 'var(--fg)' }}
              >
                {sym}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
