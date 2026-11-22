'use client'

import { useState } from 'react'
import { Slider } from '@/components/controls'
import { PlotFrame, PlotPoint, usePlotScale } from '@/components/vocab'
import { ConfigurationBoxes, MagnetBalance, SERIES_TONE, configurationLayout } from '@/components/vocab/dblock'
import { SimulationControls } from '@/components/simulation/Simulation'
import {
  DEFAULT_ION_INDEX,
  ION_CHOICES,
  calculatedSeries,
  measuredSeries,
  momentSummary,
  readMoment,
} from './magnetic-moment-lab-model'
import styles from './magnetic-moment-lab.module.css'

const PLOT = { x: 78, y: 296, width: 440, height: 150 }
const PLOT_DOMAIN = { xMin: -0.5, xMax: 10.5, yMin: -0.5, yMax: 7 }
const D_TICKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const MU_TICKS = [0, 2, 4, 6]
const BOX_X = 300
const BOX_Y = 40
const BOX_WIDTH = 240
const BOX_MAX = 36
const TONE = SERIES_TONE['3d']

/**
 * Where the selected point's label goes. The label keeps clear of the Table 4.7 range bars and marks:
 * at d⁸ the Ni²⁺ range bar sits above the point, so the label goes below-left; at d³ the label
 * would sit on the rising line, so it goes above-left.
 */
function labelSide(d: number): 'ne' | 'nw' | 'sw' {
  if (d === 8) return 'sw'
  if (d === 3) return 'nw'
  return d >= 8 ? 'nw' : 'ne'
}

/** The calculated hill (filled points joined by a line) and the Table 4.7 measured values (hollow marks, ranges as bars). */
function MomentSeries() {
  const s = usePlotScale()
  const calc = calculatedSeries()
  const path = calc.map((p, i) => `${i === 0 ? 'M' : 'L'}${s.x(p.d).toFixed(2)} ${s.y(p.mu).toFixed(2)}`).join(' ')
  return (
    <g>
      <path d={path} fill="none" stroke={TONE} strokeWidth={3} strokeLinejoin="round" />
      {calc.map((p) => (
        <circle key={`c${p.d}`} cx={s.x(p.d)} cy={s.y(p.mu)} r={4} fill={TONE} />
      ))}
      {measuredSeries().map((m) => {
        const cx = s.x(m.d)
        if (typeof m.value === 'number') {
          return <circle key={`m${m.d}`} cx={cx} cy={s.y(m.value)} r={7} fill="none" stroke={TONE} strokeWidth={2.5} />
        }
        const [lo, hi] = m.value
        return (
          <g key={`m${m.d}`}>
            <line x1={cx} x2={cx} y1={s.y(lo)} y2={s.y(hi)} stroke={TONE} strokeWidth={2.5} />
            <line x1={cx - 5} x2={cx + 5} y1={s.y(lo)} y2={s.y(lo)} stroke={TONE} strokeWidth={2.5} />
            <line x1={cx - 5} x2={cx + 5} y1={s.y(hi)} y2={s.y(hi)} stroke={TONE} strokeWidth={2.5} />
          </g>
        )
      })}
    </g>
  )
}

export function MagneticMomentLab() {
  const [index, setIndex] = useState(DEFAULT_ION_INDEX)
  const r = readMoment(index)
  const boxLayout = configurationLayout([{ subshell: '3d', electrons: r.dCount }], BOX_WIDTH, BOX_MAX)
  const textY = BOX_Y + boxLayout.height + 34

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <Slider
          label="3d ion"
          value={index}
          min={0}
          max={ION_CHOICES.length - 1}
          step={1}
          onChange={setIndex}
          format={(v) => readMoment(v).ion}
        />
      </SimulationControls>

      <div className={styles.stage}>
        <svg viewBox="0 0 560 500" className={styles.scene} role="img" aria-label={`Balance pull, d-electron boxes and spin-only moment plot for ${r.ion}`}>
          <MagnetBalance pull={r.pull} x={0} y={0} schematic />

          <text x={BOX_X} y={22} fontSize={16} style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
            3d electrons, high spin
          </text>
          <ConfigurationBoxes config={[{ subshell: '3d', electrons: r.dCount }]} x={BOX_X} y={BOX_Y} width={BOX_WIDTH} maxSize={BOX_MAX} />
          <text x={BOX_X} y={textY} fontSize={22} style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
            {r.unpaired} unpaired
          </text>
          <text x={BOX_X} y={textY + 28} fontSize={18} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
            spin-only μ = {r.muText} BM
          </text>

          <PlotFrame
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.width}
            height={PLOT.height}
            domain={PLOT_DOMAIN}
            xTicks={D_TICKS}
            yTicks={MU_TICKS}
            xTickFormat={(v) => String(v)}
            yTickFormat={(v) => String(v)}
            xTitle="d electrons"
            yTitle="μ / BM"
          >
            <MomentSeries />
            <PlotPoint at={{ x: r.dCount, y: r.mu }} tone="accent" label={r.muText} side={labelSide(r.dCount)} />
          </PlotFrame>
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.results}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Configuration</span>
            <span className={styles.statValue}>{r.configuration}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Unpaired electrons, n</span>
            <span className={styles.statValue}>{r.unpaired}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              Spin-only <span className="sym">μ</span>
            </span>
            <span className={styles.statValue}>{r.muText} BM</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>Measured, Table 4.7</span>
            <span className={styles.statValue}>{r.measuredText === null ? 'Not listed' : `${r.measuredText} BM`}</span>
          </div>
        </div>
        <p className={styles.legend}>
          <span className={styles.keyFilled} aria-hidden="true" /> Spin-only, calculated
          <span className={styles.keyRing} aria-hidden="true" /> Measured (a bar is a range)
        </p>
        <p className={styles.note}>
          {r.behaviour === 'diamagnetic'
            ? 'No electron is unpaired, so the sample is pushed out of the field very slightly. The balance is schematic, not to scale.'
            : 'The balance pull is drawn in proportion to the spin-only moment. The drawing is schematic, not to scale.'}
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {momentSummary(r)}
      </p>
    </div>
  )
}
