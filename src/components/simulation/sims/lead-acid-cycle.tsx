'use client'

import { useRef, useState } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { Beaker, Electrode, Ion, VocabDefs, Wire } from '@/components/vocab'
import { leadCycleAtTime } from '@/lib/chem/lead-acid-cycle'
import styles from './lead-acid-cycle.module.css'

type Mode = 'discharge' | 'charge'

const MODE_OPTIONS = [
  { value: 'discharge', label: 'Discharge (cell supplies current)' },
  { value: 'charge', label: 'Recharge (charger forces current)' },
] as const

const CURRENT_A = 2.0
const MAX_HOURS = 3.0
const DEFAULT_HOURS = 1.5

const VIEW_W = 580
const VIEW_H = 390
const LEFT_X = 215
const RIGHT_X = 365
const PLATE_TOP = 118
const PLATE_LEN = 200
const PLATE_W = 36
const PLATE_TIP = PLATE_TOP + PLATE_LEN
const WIRE_Y = 52
const LOAD = { x: 236, y: 22, width: 118, height: 60 }
/** Wires leave each plate beside its polarity badge, so the badge never sits on a stroke. */
const LEFT_WIRE_X = LEFT_X + 12
const RIGHT_WIRE_X = RIGHT_X + 12
const CRUST_MAX = 150

/** Fixed ion sites. Sulphate drifts toward the anode, H⁺ toward the cathode. */
const SULPHATE_SITES = [
  { x: 166, y: 252 },
  { x: 160, y: 304 },
  { x: 300, y: 250 },
  { x: 298, y: 306 },
  { x: 414, y: 262 },
  { x: 420, y: 310 },
] as const

const HYDROGEN_SITES = [
  { x: 258, y: 280 },
  { x: 306, y: 280 },
  { x: 236, y: 336 },
  { x: 290, y: 338 },
  { x: 290, y: 216 },
] as const

const EQUATIONS: Record<Mode, { anode: string; cathode: string; overall: string; flow: string }> = {
  discharge: {
    anode: 'Anode, oxidation (Pb plate): Pb + SO₄²⁻ → PbSO₄ + 2e⁻',
    cathode: 'Cathode, reduction (PbO₂ plate): PbO₂ + SO₄²⁻ + 4H⁺ + 2e⁻ → PbSO₄ + 2H₂O',
    overall: 'Overall: Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O',
    flow: 'Electrons leave the Pb plate, pass through the load and enter the PbO₂ plate.',
  },
  charge: {
    anode: 'Anode, oxidation (PbO₂ plate): PbSO₄ + 2H₂O → PbO₂ + SO₄²⁻ + 4H⁺ + 2e⁻',
    cathode: 'Cathode, reduction (Pb plate): PbSO₄ + 2e⁻ → Pb + SO₄²⁻',
    overall: 'Overall: 2PbSO₄ + 2H₂O → Pb + PbO₂ + 2H₂SO₄',
    flow: 'The charger pulls electrons out of the PbO₂ plate and pushes them into the Pb plate.',
  },
}

const fmtCoulomb = (q: number) => `${Math.round(q).toLocaleString('en-US')} C`
const fmtGram = (g: number) => `${g.toFixed(2)} g`
const fmtMol = (n: number) => `${n.toFixed(3)} mol`

/** Lead storage cell: plates, electron flow and charge bookkeeping for discharge and recharge. */
export function LeadAcidCycle({ reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<Mode>('discharge')
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const t = useAmbientTime(reducedMotion || !active)

  const discharging = mode === 'discharge'
  const progress = Math.min(1, hours / MAX_HOURS)
  const readout = leadCycleAtTime(CURRENT_A, hours)
  // Coating on both plates: PbSO₄ builds up on discharge and clears on recharge.
  const coat = discharging ? progress : 1 - progress
  const crustH = CRUST_MAX * coat
  // Illustrative only: the lib gives no acid concentrations.
  const acidLevel = discharging ? 1 - 0.6 * progress : 0.4 + 0.6 * progress
  const leftRole = discharging ? 'anode' : 'cathode'
  const rightRole = discharging ? 'cathode' : 'anode'
  const flowDirection = discharging ? 'forward' : 'reverse'
  const eq = EQUATIONS[mode]
  const drift = discharging ? 1 : -1

  const sulphateX = (site: { x: number }, k: number) =>
    site.x - drift * 16 * (0.5 + 0.5 * Math.sin(t * 0.8 + k * 1.3))
  const hydrogenX = (site: { x: number }, k: number) =>
    site.x + drift * 16 * (0.5 + 0.5 * Math.sin(t * 0.8 + k * 1.7))

  const crust = (cx: number) => (
    <rect
      x={cx - PLATE_W / 2 - 5}
      y={PLATE_TIP - crustH}
      width={PLATE_W + 10}
      height={crustH}
      rx={4}
      className={styles.crust}
    />
  )

  return (
    <div className={styles.sim} ref={rootRef}>
      <div className={styles.controls}>
        <Segmented
          label="Mode"
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />
        <Slider
          label={`Time at ${CURRENT_A.toFixed(1)} A`}
          value={hours}
          min={0}
          max={MAX_HOURS}
          step={0.25}
          onChange={setHours}
          format={(v) => `${v.toFixed(2)} h`}
        />
      </div>

      <div className={styles.stage}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className={styles.svg}
          role="img"
          aria-label={`Lead storage cell, ${discharging ? 'discharging' : 'recharging'}, ${hours.toFixed(2)} hours`}
        >
          <VocabDefs idPrefix="lead-acid" />

          <Beaker x={120} y={150} width={340} height={210} level={0.8} tint="clear" />

          {/* Two runs that stop at the load box edges, so no electron dot is ever drawn under the box. */}
          <Wire
            corners={[
              { x: LEFT_WIRE_X, y: PLATE_TOP },
              { x: LEFT_WIRE_X, y: WIRE_Y },
              { x: LOAD.x, y: WIRE_Y },
            ]}
            t={t}
            electrons
            dots={2}
            direction={flowDirection}
          />
          <Wire
            corners={[
              { x: LOAD.x + LOAD.width, y: WIRE_Y },
              { x: RIGHT_WIRE_X, y: WIRE_Y },
              { x: RIGHT_WIRE_X, y: PLATE_TOP },
            ]}
            t={t}
            electrons
            dots={2}
            direction={flowDirection}
          />

          {discharging ? (
            <g>
              <rect x={LOAD.x} y={LOAD.y} width={LOAD.width} height={LOAD.height} rx={10} className={styles.load} />
              <text x={LOAD.x + LOAD.width / 2} y={LOAD.y + 26} textAnchor="middle" className={styles.label}>
                Load
              </text>
              <text x={LOAD.x + LOAD.width / 2} y={LOAD.y + 48} textAnchor="middle" className={styles.small}>
                {`${CURRENT_A.toFixed(1)} A`}
              </text>
            </g>
          ) : (
            <g>
              <rect x={LOAD.x} y={LOAD.y} width={LOAD.width} height={LOAD.height} rx={10} className={styles.load} />
              <text x={LOAD.x + LOAD.width / 2} y={LOAD.y + 26} textAnchor="middle" className={styles.label}>
                Charger
              </text>
              <text x={LOAD.x + LOAD.width / 2} y={LOAD.y + 48} textAnchor="middle" className={styles.small}>
                {`${CURRENT_A.toFixed(1)} A`}
              </text>
            </g>
          )}

          {SULPHATE_SITES.map((site, k) => (
            <Ion
              key={`so4-${k}`}
              x={sulphateX(site, k)}
              y={site.y}
              kind="anion"
              formula="SO₄"
              charge="2-"
            />
          ))}
          {HYDROGEN_SITES.map((site, k) => (
            <Ion
              key={`h-${k}`}
              x={hydrogenX(site, k)}
              y={site.y}
              kind="cation"
              formula="H"
              charge="+"
            />
          ))}

          <Electrode
            x={LEFT_X}
            top={PLATE_TOP}
            length={PLATE_LEN}
            width={PLATE_W}
            material="pb"
            polarity="−"
            role={leftRole}
          />
          <Electrode
            x={RIGHT_X}
            top={PLATE_TOP}
            length={PLATE_LEN}
            width={PLATE_W}
            material="pbo2"
            polarity="+"
            role={rightRole}
          />
          {crust(LEFT_X)}
          {crust(RIGHT_X)}

          <text x={LEFT_X} y={VIEW_H - 8} textAnchor="middle" className={styles.label}>
            Pb plate
          </text>
          <text x={RIGHT_X} y={VIEW_H - 8} textAnchor="middle" className={styles.label}>
            PbO₂ plate
          </text>
        </svg>

        <p className={styles.equation}>{eq.anode}</p>
        <p className={styles.equation}>{eq.cathode}</p>
        <p className={styles.equation}>{eq.overall}</p>
        <p className={styles.note}>{eq.flow}</p>
      </div>

      <div className={styles.acid}>
        <span className={styles.acidLabel}>H₂SO₄ concentration</span>
        <div className={styles.acidTrack} aria-hidden="true">
          <div className={styles.acidFill} style={{ width: `${(acidLevel * 100).toFixed(1)}%` }} />
        </div>
        <span className={styles.note}>Illustrative only, not to scale: the model gives no acid values.</span>
      </div>

      <dl className={styles.stats}>
        <div>
          <dt>Current</dt>
          <dd>{`${CURRENT_A.toFixed(1)} A, held constant`}</dd>
        </div>
        <div>
          <dt>Charge passed, Q = It</dt>
          <dd>{fmtCoulomb(readout.charge)}</dd>
        </div>
        <div>
          <dt>Electrons moved</dt>
          <dd>{`${fmtMol(readout.electronMoles)} e⁻`}</dd>
        </div>
        <div>
          <dt>{discharging ? 'Pb converted to PbSO₄' : 'Pb regenerated from PbSO₄'}</dt>
          <dd>{`${fmtGram(readout.leadMassG)} (${fmtMol(readout.leadMoles)})`}</dd>
        </div>
        <div>
          <dt>{discharging ? 'PbSO₄ formed, total on both plates' : 'PbSO₄ removed, total on both plates'}</dt>
          <dd>{`${fmtGram(readout.pbSO4MassG)} (half on each plate)`}</dd>
        </div>
        <div>
          <dt>{discharging ? 'H₂SO₄ used' : 'H₂SO₄ made back'}</dt>
          <dd>{fmtMol(readout.h2SO4Moles)}</dd>
        </div>
      </dl>

      <p className={styles.srOnly} aria-live="polite">
        {`${discharging ? 'Discharging' : 'Recharging'} at ${CURRENT_A.toFixed(1)} A for ${hours.toFixed(2)} hours: ${fmtGram(readout.leadMassG)} of lead converted, ${fmtCoulomb(readout.charge)} passed.`}
      </p>
    </div>
  )
}
