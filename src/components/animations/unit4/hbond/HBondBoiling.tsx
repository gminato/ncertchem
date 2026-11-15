'use client'

import { Label } from '@/components/vocab'
import { HYDRIDE_BOILING_POINTS } from '@/lib/chem/hydrogen-bond'
import { BOILING_GROUPS, boilingTargetForStep, groupSeries, type BoilingGroup } from './hbond-steps'
import styles from './hbond.module.css'

export interface HBondBoilingProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 540
const PLOT_TOP = 70
const PLOT_BOTTOM = 420
const K_MIN = 100
const K_MAX = 400
const PERIOD_X0 = 110
const PERIOD_STEP = 125
/** Groups 14 to 17 sit side by side within each period, so their points do not overlap. */
const GROUP_OFFSET = 14

const FORMULA: Record<string, string> = {
  CH4: 'CH₄',
  SiH4: 'SiH₄',
  GeH4: 'GeH₄',
  SnH4: 'SnH₄',
  NH3: 'NH₃',
  PH3: 'PH₃',
  AsH3: 'AsH₃',
  SbH3: 'SbH₃',
  H2O: 'H₂O',
  H2S: 'H₂S',
  H2Se: 'H₂Se',
  H2Te: 'H₂Te',
  HF: 'HF',
  HCl: 'HCl',
  HBr: 'HBr',
  HI: 'HI',
}

const GROUP_COLOUR: Record<BoilingGroup, string> = {
  14: 'var(--fg-subtle)',
  15: 'var(--fg-subtle)',
  16: 'var(--accent)',
  17: 'var(--fg-subtle)',
}

function xOf(period: number, group: BoilingGroup): number {
  return PERIOD_X0 + (period - 2) * PERIOD_STEP + (group - 15.5) * GROUP_OFFSET
}

function yOf(kelvin: number): number {
  return PLOT_BOTTOM - ((kelvin - K_MIN) / (K_MAX - K_MIN)) * (PLOT_BOTTOM - PLOT_TOP)
}

/** A signed anomaly in kelvin, with the true minus sign (U+2212). */
function signed(value: number): string {
  const rounded = Math.round(value)
  return `${rounded < 0 ? '−' : '+'}${Math.abs(rounded)}`
}

/**
 * HBondBoiling: boiling points of the hydrides of groups 14 to 17. The heavier hydrides follow a
 * straight-line trend. Each revealed period-2 hydride sits far above the extrapolated trend, and
 * H₂O is the largest gap. The values are from the CRC Handbook (src/lib/chem/hydrogen-bond.ts),
 * not NCERT.
 */
export function HBondBoiling({ step, reducedMotion }: HBondBoilingProps) {
  const target = boilingTargetForStep(step)
  const revealed = new Set<BoilingGroup>(target.revealed)
  const ticks = [100, 200, 300, 400]
  const readout = BOILING_GROUPS.filter((g) => revealed.has(g))
    .map((g) => {
      const { anomaly } = groupSeries(g)
      return `${FORMULA[anomaly.formula] ?? anomaly.formula} ${signed(anomaly.anomalyK)} K`
    })
    .join('  ·  ')

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label="Boiling points of the hydrides of groups 14 to 17 by period. Heavier hydrides follow a trend. Water, ammonia and hydrogen fluoride lie far above the trend of their groups; methane lies slightly below."
      data-testid="hbond-boiling"
      data-step={Math.round(Number.isFinite(step) ? step : 0)}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <Label x={VIEW_WIDTH / 2} y={26} fontSize={16} fill="var(--fg-muted)">
        Boiling points of the hydrides, groups 14 to 17
      </Label>

      {/* Axes and gridlines */}
      {ticks.map((k) => (
        <g key={`tick-${k}`}>
          <line x1={62} y1={yOf(k)} x2={560} y2={yOf(k)} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
          <Label x={50} y={yOf(k)} fontSize={14} fill="var(--fg-muted)" textAnchor="end">
            {String(k)}
          </Label>
        </g>
      ))}
      <Label x={14} y={(PLOT_TOP + PLOT_BOTTOM) / 2} fontSize={14} fill="var(--fg-muted)" textAnchor="middle" transform={`rotate(-90 14 ${(PLOT_TOP + PLOT_BOTTOM) / 2})`}>
        Boiling point, K
      </Label>
      {[2, 3, 4, 5].map((p) => (
        <Label key={`period-${p}`} x={PERIOD_X0 + (p - 2) * PERIOD_STEP} y={PLOT_BOTTOM + 22} fontSize={15} fill="var(--fg-muted)">
          {`Period ${p}`}
        </Label>
      ))}

      {BOILING_GROUPS.map((group) => {
        const { points, anomaly } = groupSeries(group)
        const heavy = points.filter((h) => h.period >= 3)
        const light = points.find((h) => h.period === 2)
        const shown = revealed.has(group)
        const colour = GROUP_COLOUR[group]
        const heavyPath = heavy
          .map((h, i) => `${i === 0 ? 'M' : 'L'}${xOf(h.period, group)},${yOf(h.boilingPointK)}`)
          .join(' ')
        return (
          <g key={`group-${group}`} data-group={group}>
            <path d={heavyPath} fill="none" strokeWidth={2} style={{ stroke: colour }} />
            {heavy.map((h) => (
              <circle key={h.formula} cx={xOf(h.period, group)} cy={yOf(h.boilingPointK)} r={4.5} style={{ fill: colour }} />
            ))}
            {shown && light && (
              <g data-revealed={group} data-testid={`hbond-point-${light.formula}`}>
                <line
                  x1={xOf(3, group)}
                  y1={yOf(heavy[0].boilingPointK)}
                  x2={xOf(2, group)}
                  y2={yOf(anomaly.expectedK)}
                  strokeWidth={1.4}
                  strokeDasharray="4 4"
                  style={{ stroke: 'var(--fg-muted)' }}
                />
                <circle cx={xOf(2, group)} cy={yOf(anomaly.expectedK)} r={5} strokeWidth={1.6} style={{ fill: 'var(--surface)', stroke: 'var(--fg-muted)' }} />
                <line
                  x1={xOf(2, group)}
                  y1={yOf(anomaly.expectedK)}
                  x2={xOf(2, group)}
                  y2={yOf(anomaly.observedK)}
                  strokeWidth={1}
                  strokeDasharray="1 3"
                  style={{ stroke: 'var(--accent)' }}
                />
                <circle cx={xOf(2, group)} cy={yOf(light.boilingPointK)} r={6} style={{ fill: colour === 'var(--accent)' ? 'var(--accent)' : 'var(--fg)' }} />
                <Label
                  x={group === 14 || group === 15 ? xOf(2, group) - 12 : xOf(2, group) + 12}
                  y={yOf(light.boilingPointK) + 2}
                  fontSize={15}
                  fill="var(--fg)"
                  textAnchor={group === 14 || group === 15 ? 'end' : 'start'}
                >
                  {FORMULA[light.formula]}
                </Label>
              </g>
            )}
          </g>
        )
      })}

      {/* Formula labels on the period-5 points, for orientation */}
      {BOILING_GROUPS.map((group) => {
        const h = HYDRIDE_BOILING_POINTS.find((p) => p.group === group && p.period === 5)
        if (!h) return null
        return (
          <Label key={`end-${group}`} x={xOf(5, group) + 10} y={yOf(h.boilingPointK) + 2} fontSize={14} fill="var(--fg-muted)" textAnchor="start">
            {FORMULA[h.formula]}
          </Label>
        )
      })}

      <Label x={VIEW_WIDTH / 2} y={470} fontSize={15} fill="var(--fg)" data-testid="hbond-readout">
        {readout.length > 0 ? `Anomaly against the trend: ${readout}` : 'Trend: straight lines through periods 3 to 5'}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={496} fontSize={14} fill="var(--fg-subtle)">
        Hollow circle: value on the straight-line trend extended to period 2.
      </Label>
      <Label x={VIEW_WIDTH / 2} y={520} fontSize={13} fill="var(--fg-subtle)">
        Data: CRC Handbook of Chemistry and Physics, normal boiling points (not from NCERT)
      </Label>
    </svg>
  )
}

