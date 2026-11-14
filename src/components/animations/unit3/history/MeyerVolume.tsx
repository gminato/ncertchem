'use client'

import { Label } from '@/components/vocab'
import { meyerStep, ALKALI_SYMBOLS } from './history-steps'
import styles from './history.module.css'

export interface MeyerVolumeProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 330
const X0 = 70
const X1 = 556
const Y_TOP = 40
const Y_BOTTOM = 270
const MASS_MAX = 140
const VOL_MAX = 75

const xOf = (mass: number) => X0 + (mass / MASS_MAX) * (X1 - X0)
const yOf = (vol: number) => Y_BOTTOM - (vol / VOL_MAX) * (Y_BOTTOM - Y_TOP)

/**
 * Lothar Meyer's curve: molar volume (atomic mass ÷ density, which he called atomic
 * volume) of the solid elements against atomic mass. Values come from the PubChem
 * snapshot, so the axis and the data source say so on screen. The curve rises to a
 * peak at each alkali metal, which is the periodic pattern Meyer saw.
 */
export function MeyerVolume({ step, reducedMotion }: MeyerVolumeProps) {
  const s = meyerStep(step)
  const sorted = [...s.points].sort((a, b) => a.atomicMass - b.atomicMass)
  const path = sorted.map((p) => `${xOf(p.atomicMass).toFixed(1)},${yOf(p.volumeCm3).toFixed(1)}`).join(' ')
  const transition = reducedMotion ? 'none' : undefined

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Molar volume of solid elements plotted against atomic mass, peaking at each alkali metal"
        data-testid="meyer-curve"
        data-step={step}
      >
        {[0, 20, 40, 60].map((v) => (
          <g key={`vt${v}`}>
            <line x1={X0} x2={X1} y1={yOf(v)} y2={yOf(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={X0 - 10} y={yOf(v) + 4} textAnchor="end" className={styles.tick}>
              {v}
            </text>
          </g>
        ))}
        {[0, 20, 40, 60, 80, 100, 120, 140].map((m) => (
          <text key={`mt${m}`} x={xOf(m)} y={Y_BOTTOM + 20} textAnchor="middle" className={styles.tick}>
            {m}
          </text>
        ))}
        <line x1={X0} x2={X1} y1={Y_BOTTOM} y2={Y_BOTTOM} className={styles.axis} />
        <line x1={X0} x2={X0} y1={Y_TOP} y2={Y_BOTTOM} className={styles.axis} />

        <text x={X0 + (X1 - X0) / 2} y={Y_BOTTOM + 38} textAnchor="middle" className={styles.note}>
          atomic mass / u
        </text>
        <text
          transform={`translate(20 ${Y_TOP + (Y_BOTTOM - Y_TOP) / 2}) rotate(-90)`}
          textAnchor="middle"
          className={styles.note}
        >
          molar volume / cm<tspan fontSize={10} dy="-6">3</tspan>
          <tspan dy="6"> mol</tspan>
          <tspan fontSize={10} dy="-6">-1</tspan>
        </text>

        {sorted.length > 1 && (
          <polyline
            points={path}
            style={{ fill: 'none', stroke: 'var(--electron)', strokeWidth: 2.5, strokeLinejoin: 'round', transition }}
            data-testid="curve-line"
          />
        )}

        {sorted.map((p) => {
          const alkali = ALKALI_SYMBOLS.includes(p.symbol)
          return (
            <circle
              key={p.Z}
              cx={xOf(p.atomicMass)}
              cy={yOf(p.volumeCm3)}
              r={alkali ? 6 : 4}
              className={alkali ? styles.pointAlkali : styles.point}
              style={{ transition }}
            />
          )
        })}

        {sorted
          .filter((p) => s.labelled.includes(p.symbol))
          .map((p) => (
            <Label
              key={`lab${p.Z}`}
              x={xOf(p.atomicMass)}
              y={yOf(p.volumeCm3) - 14}
              fontSize={16}
              fill="var(--fg)"
              fontWeight={600}
              textAnchor="middle"
            >
              {p.symbol}
            </Label>
          ))}

        <text x={X0} y={VIEW_HEIGHT - 6} className={styles.caption}>
          Data: PubChem (solids only). Plotted by us; Meyer&rsquo;s own values differ.
        </text>
      </svg>
    </div>
  )
}
