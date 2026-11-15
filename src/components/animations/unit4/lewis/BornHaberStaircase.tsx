'use client'

import { Label } from '@/components/vocab'
import { useTweenedValues } from '@/components/animations/unit2/bohr/useTweenedValues'
import { BORN_HABER_STEP_COUNT, FORMATION_KJ, levelAtStep, staircase } from './lewis-steps'
import styles from './lewis.module.css'

export interface BornHaberStaircaseProps {
  step: number
  reducedMotion: boolean
}

// Sized for a ~570 px visual panel: category labels are 13 units and value labels 15.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 360
const PLOT = { left: 64, right: 548, top: 34, bottom: 296 }
const SLOTS = BORN_HABER_STEP_COUNT
const SLOT_WIDTH = (PLOT.right - PLOT.left) / SLOTS
const BAR_WIDTH = 50

/** Two-line category labels, one per Step (Step 0 is the reference state). */
const CATEGORY: readonly (readonly string[])[] = [
  ['Na(s) +', '½Cl₂(g)'],
  ['Sublimation'],
  ['Dissociation'],
  ['Ionisation'],
  ['Electron', 'gain'],
  ['Lattice', 'formation'],
]

/** Tick marks on the enthalpy axis, in kJ mol⁻¹. */
const TICKS = [-400, -200, 0, 200, 400, 600] as const

/** Enthalpy at the top and bottom of the drawing, padded past the highest and lowest level. */
const bars = staircase()
const levels = [0, ...bars.flatMap((b) => [b.from, b.to])]
const V_MAX = Math.max(...levels) + 40
const V_MIN = Math.min(...levels) - 40

/** Maps an enthalpy in kJ mol⁻¹ to the SVG y coordinate. */
function yOf(value: number): number {
  return PLOT.top + ((V_MAX - value) / (V_MAX - V_MIN)) * (PLOT.bottom - PLOT.top)
}

/** Formats an enthalpy with its sign: a true minus sign for negative values. */
export function signedKj(value: number): string {
  const magnitude = Number.isInteger(value) ? String(Math.abs(value)) : Math.abs(value).toFixed(1)
  if (value === 0) return '0'
  return `${value > 0 ? '+' : '−'}${magnitude}`
}

function slotLeft(slot: number): number {
  return PLOT.left + slot * SLOT_WIDTH
}

/** Readout under the picture for one Step, computed from the cycle's numbers. */
function readoutFor(step: number): string {
  const s = Math.min(BORN_HABER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  if (s === 0) return 'Start from the elements, Na(s) and ½Cl₂(g), at 0 kJ mol⁻¹.'
  const bar = bars[s - 1]
  return `${bar.label}: ${signedKj(bar.enthalpyKj)} kJ mol⁻¹. The level is now ${signedKj(levelAtStep(s))} kJ mol⁻¹.`
}

/**
 * The Born–Haber cycle for NaCl as a waterfall. Each Step adds one bar of the cycle, in the
 * formation direction, and the last bar lands on the enthalpy of formation. The bar heights,
 * levels and labels all come from the cycle in ionic.ts.
 */
export function BornHaberStaircase({ step, reducedMotion }: BornHaberStaircaseProps) {
  const s = Math.min(BORN_HABER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const live = useTweenedValues({ drawn: s }, reducedMotion)
  const progressOf = (i: number) => Math.min(1, Math.max(0, live.drawn - i))

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`Born–Haber cycle for NaCl as an energy staircase. ${readoutFor(s)}`}
        data-testid="born-haber-staircase"
        data-step={s}
      >
        {TICKS.map((tick) => (
          <g key={`tick-${tick}`}>
            <line
              x1={PLOT.left - 4}
              x2={PLOT.right}
              y1={yOf(tick)}
              y2={yOf(tick)}
              strokeWidth={tick === 0 ? 1.2 : 0.6}
              strokeDasharray={tick === 0 ? undefined : '2 5'}
              style={{ stroke: tick === 0 ? 'var(--fg-muted)' : 'var(--border)' }}
            />
            <Label x={PLOT.left - 10} y={yOf(tick)} textAnchor="end" fontSize={13} fill="var(--fg-muted)">
              {signedKj(tick)}
            </Label>
          </g>
        ))}

        {/* Category labels under each slot */}
        {CATEGORY.map((lines, slot) => (
          <Label
            key={`cat-${slot}`}
            x={slotLeft(slot) + SLOT_WIDTH / 2}
            y={lines.length === 1 ? 320 : 314}
            fontSize={13}
            fill={slot === s ? 'var(--fg)' : 'var(--fg-muted)'}
          >
            {lines.map((line, k) => (
              <tspan key={line} x={slotLeft(slot) + SLOT_WIDTH / 2} dy={k === 0 ? 0 : 16}>
                {line}
              </tspan>
            ))}
          </Label>
        ))}

        {/* Bars, growing as each Step is reached */}
        {bars.map((bar, i) => {
          const p = progressOf(i)
          const slot = i + 1
          const x = slotLeft(slot) + (SLOT_WIDTH - BAR_WIDTH) / 2
          const end = bar.from + (bar.to - bar.from) * p
          const top = Math.min(yOf(bar.from), yOf(end))
          const height = Math.abs(yOf(end) - yOf(bar.from))
          const endothermic = bar.enthalpyKj > 0
          const isCurrent = s === i + 1
          // Uphill bars carry their value above the top edge; downhill bars carry it just inside
          // the lower edge, which keeps it clear of the category labels under the plot.
          const valueY = endothermic ? yOf(Math.max(bar.from, bar.to)) - 9 : yOf(Math.min(bar.from, bar.to)) - 9
          return (
            <g key={`bar-${i}`} data-testid={`bar-${i}`}>
              {p > 0 && (
                <rect
                  x={x}
                  y={top}
                  width={BAR_WIDTH}
                  height={Math.max(0, height)}
                  rx={3}
                  style={{
                    fill: endothermic ? 'var(--accent-soft)' : 'var(--success-soft)',
                    stroke: endothermic ? 'var(--accent)' : 'var(--success)',
                  }}
                  strokeWidth={isCurrent ? 2 : 1}
                />
              )}
              {p >= 1 && (
                <Label
                  x={x + BAR_WIDTH / 2}
                  y={valueY}
                  fontSize={15}
                  fill={isCurrent ? 'var(--fg)' : 'var(--fg-muted)'}
                >
                  {signedKj(bar.enthalpyKj)}
                </Label>
              )}
            </g>
          )
        })}

        {/* Dashed connectors: the level at the end of each bar carries across to the next */}
        {bars.slice(0, -1).map((bar, i) => {
          const p = progressOf(i)
          if (p < 1) return null
          const y = yOf(bar.to)
          return (
            <line
              key={`conn-${i}`}
              x1={slotLeft(i + 1) + (SLOT_WIDTH + BAR_WIDTH) / 2}
              x2={slotLeft(i + 2) + (SLOT_WIDTH - BAR_WIDTH) / 2}
              y1={y}
              y2={y}
              strokeWidth={1}
              strokeDasharray="3 3"
              style={{ stroke: 'var(--fg-subtle)' }}
            />
          )
        })}

        {/* The formation level, drawn once the cycle closes */}
        {progressOf(bars.length - 1) >= 1 && (
          <g data-testid="formation-level">
            <line
              x1={PLOT.left}
              x2={PLOT.right}
              y1={yOf(FORMATION_KJ)}
              y2={yOf(FORMATION_KJ)}
              strokeWidth={1}
              strokeDasharray="5 4"
              style={{ stroke: 'var(--fg-muted)' }}
            />
            <Label x={PLOT.left + 6} y={yOf(FORMATION_KJ) - 12} textAnchor="start" fontSize={15} fill="var(--fg)">
              <tspan className="sym">Δ</tspan>
              <tspan dy="4" fontSize={11}>
                f
              </tspan>
              <tspan dy="-4">H</tspan>
              <tspan dy="0"> = {signedKj(FORMATION_KJ)} kJ mol⁻¹</tspan>
            </Label>
          </g>
        )}

      </svg>

      <p className={styles.note} aria-live="polite" data-testid="born-haber-readout">
        {readoutFor(s)}
      </p>
      {s === BORN_HABER_STEP_COUNT - 1 && (
        <p className={styles.note}>
          The lattice formation step is −788 kJ mol⁻¹ here. NCERT defines lattice enthalpy for the reverse process, separating the
          solid into gaseous ions, and prints it as +788 kJ mol⁻¹.
        </p>
      )}
      <p className={styles.smallPrint}>
        Sublimation and dissociation are standard data, not printed in NCERT Unit 4. Ionisation, electron gain and lattice
        formation are NCERT’s values.
      </p>
    </div>
  )
}
