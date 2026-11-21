'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, Slider } from '@/components/controls'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  Beaker,
  Electrode,
  Galvanometer,
  SaltBridge,
  VocabDefs,
  Wire,
  clamp01,
  type Point,
} from '@/components/vocab'
import {
  DANIELL_EMF_V,
  electrodeMassChangeG,
  opposingMode,
  schematicCurrentMilliAmp,
  type OpposingMode,
} from '@/lib/chem/opposing-voltage'
import styles from './opposing-voltage-lab.module.css'

const EXT_MAX_V = 2.0
const EXT_STEP_V = 0.05
const MAX_MINUTES = 30
const MINUTES_PER_SECOND = 1.5
const MASS_FULL_SCALE_G = 0.07
const CURRENT_RANGE_MA = 120

// Circuit geometry, in the viewBox (600 × 420). Zinc is the anode, so it sits
// on the left, as in the cell notation Zn | Zn²⁺ || Cu²⁺ | Cu. One external
// wire runs along the top (BUS_Y): Zn → galvanometer → opposing source → Cu.
const ZN_X = 130
const CU_X = 470
const BUS_Y = 64
const ELECTRODE_TOP = 190
const ELECTRODE_LENGTH = 150
const BEAKER_Y = 236
const BRIDGE_Y = 302
const BRIDGE_APEX = 240
// The galvanometer hangs from the bus by its two top corners (its terminals).
const GAL = { x: 262, width: 110, top: BUS_Y + 22, height: 104 }
const SOURCE = { x: 330, y: BUS_Y + 22, width: 120, height: 84 }
// The source's − post is on the zinc side and its + post on the copper side. Both sit on the bus.
const MINUS: Point = { x: SOURCE.x + SOURCE.width * 0.25, y: BUS_Y }
const PLUS: Point = { x: SOURCE.x + SOURCE.width * 0.75, y: BUS_Y }
const GAL_LEFT: Point = { x: GAL.x - GAL.width / 2, y: GAL.top }
const GAL_RIGHT: Point = { x: GAL.x + GAL.width / 2, y: GAL.top }

const MODE_TEXT: Record<OpposingMode, string> = {
  galvanic: 'Galvanic: the cell pushes electrons through the wire',
  balanced: 'Balanced: Eext equals the cell EMF, so no current flows',
  electrolytic: 'Electrolytic: the source overpowers the cell and reverses it',
}

const FLOW_TEXT: Record<OpposingMode, string> = {
  galvanic: 'Electrons flow Zn → Cu in the wire',
  balanced: 'No electrons flow',
  electrolytic: 'Electrons flow Cu → Zn in the wire',
}

function formatSigned(value: number, decimals: number): string {
  const body = Math.abs(value).toFixed(decimals)
  if (Number(body) === 0) return '0'
  return `${value < 0 ? '−' : '+'}${body}`
}

/** The opposing supply, with − on the zinc side (left post) and + on the copper side (right post). */
function OpposingSource({ x, y, width, height, display, label }: { x: number; y: number; width: number; height: number; display: string; label: string }) {
  const posts = [
    { p: MINUS, sign: '−', fill: 'var(--fg)' },
    { p: PLUS, sign: '+', fill: 'var(--proton)' },
  ]
  return (
    <g aria-hidden="true">
      {posts.map(({ p, sign, fill }) => (
        <g key={sign}>
          <line x1={p.x} x2={p.x} y1={p.y} y2={y} stroke="var(--glass-wall)" strokeWidth={3} />
          <circle cx={p.x} cy={p.y} r={9} fill={fill} stroke="var(--glass-wall)" strokeWidth={1.2} />
          <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--surface)">
            {sign}
          </text>
        </g>
      ))}
      <rect x={x} y={y} width={width} height={height} rx={10} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={1.8} />
      <rect x={x + 14} y={y + 12} width={width - 28} height={30} rx={5} fill="var(--surface)" stroke="var(--glass-wall)" strokeWidth={1} />
      <text x={x + width / 2} y={y + 33} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {display}
      </text>
      <text x={x + width / 2} y={y + height - 14} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
        {label}
      </text>
    </g>
  )
}

export function OpposingVoltageLab({ reducedMotion }: SimulationProps) {
  const [eExt, setEExt] = useState<number>(0)
  const [minutes, setMinutes] = useState<number>(0)
  const [playing, setPlaying] = useState<boolean>(false)
  const [phase, setPhase] = useState<number>(0)

  // The clock stops itself at the end of the run without a state update in an effect.
  const running = playing && minutes < MAX_MINUTES

  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)

  // One rAF loop drives the wire and ion motion (off when reduced motion is
  // on) and the clock for the electrode mass changes (only while playing).
  // It stops entirely when the Simulation is off screen or the tab is hidden.
  useEffect(() => {
    if (!active) return
    if (reducedMotion && !running) return
    let raf = 0
    let last: number | null = null
    let acc = 0
    const tick = (now: number) => {
      if (last !== null) {
        const dt = Math.min(0.05, Math.max(0, (now - last) / 1000))
        if (!reducedMotion) {
          acc += dt
          setPhase((acc * 0.2) % 1)
        }
        if (running) {
          setMinutes((m) => Math.min(MAX_MINUTES, m + dt * MINUTES_PER_SECOND))
        }
      }
      last = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, reducedMotion, running])

  const mode = opposingMode(eExt)
  const currentMa = schematicCurrentMilliAmp(eExt)
  const mass = electrodeMassChangeG(eExt, minutes)
  const znFraction = clamp01(Math.abs(mass.zn) / MASS_FULL_SCALE_G)
  const cuFraction = clamp01(Math.abs(mass.cu) / MASS_FULL_SCALE_G)
  const galvanic = mode === 'galvanic'
  const electrolytic = mode === 'electrolytic'

  // Electron wire points run Zn → galvanometer → source → Cu, in the galvanic direction.
  const zincWire: Point[] = [
    { x: ZN_X, y: ELECTRODE_TOP },
    { x: ZN_X, y: BUS_Y },
    { x: GAL_LEFT.x, y: BUS_Y },
    GAL_LEFT,
  ]
  const galvWire: Point[] = [
    GAL_RIGHT,
    { x: GAL_RIGHT.x, y: BUS_Y },
    { x: MINUS.x, y: BUS_Y },
  ]
  const copperWire: Point[] = [
    { x: PLUS.x, y: BUS_Y },
    { x: CU_X, y: BUS_Y },
    { x: CU_X, y: ELECTRODE_TOP },
  ]
  const wireDirection = electrolytic ? 'reverse' : 'forward'

  return (
    <div className={styles.sim} ref={rootRef}>
      <div className={styles.controls}>
        <Slider
          label="Opposing source Eext"
          value={eExt}
          min={0}
          max={EXT_MAX_V}
          step={EXT_STEP_V}
          unit="V"
          format={(v) => v.toFixed(2)}
          onChange={setEExt}
        />
        <div className={styles.buttons}>
          <Button variant="primary" onClick={() => {
              if (!running && minutes >= MAX_MINUTES) setMinutes(0)
              setPlaying(!running)
            }} aria-pressed={running}>
            {running ? 'Pause' : 'Play'} time
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPlaying(false)
              setMinutes(0)
            }}
          >
            Reset electrodes
          </Button>
        </div>
      </div>

      <div className={styles.stage}>
        <svg viewBox="0 0 600 420" role="img" aria-label="Daniell cell wired against an opposing DC source, with a galvanometer in the external wire">
          <VocabDefs idPrefix="opvlab" />

          <Wire corners={zincWire} t={phase} electrons={mode !== 'balanced'} dots={4} direction={wireDirection} />
          <Wire corners={galvWire} t={phase} electrons={mode !== 'balanced'} dots={2} direction={wireDirection} />
          <Wire corners={copperWire} t={phase} electrons={mode !== 'balanced'} dots={4} direction={wireDirection} currentArrow={mode !== 'balanced'} />

          <text x={300} y={30} textAnchor="middle" fontSize={16} className={styles.flowLabel}>
            {FLOW_TEXT[mode]}
          </text>

          <OpposingSource
            x={SOURCE.x}
            y={SOURCE.y}
            width={SOURCE.width}
            height={SOURCE.height}
            display={`${eExt.toFixed(2)} V`}
            label="Opposing source"
          />

          <Galvanometer
            x={GAL.x}
            y={GAL.top + GAL.height / 2}
            width={GAL.width}
            height={GAL.height}
            value={currentMa}
            range={[-CURRENT_RANGE_MA, CURRENT_RANGE_MA]}
            unit="mA"
            scaleLabels={['−', '0', '+']}
            caption=""
            digital
            terminals={false}
            decimals={0}
          />
          <text x={GAL.x} y={GAL.top + GAL.height + 18} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
            Galvanometer
          </text>

          <Beaker x={40} y={BEAKER_Y} width={180} height={140} level={0.72} tint="clear" label="ZnSO₄(aq)" />
          <Beaker x={380} y={BEAKER_Y} width={180} height={140} level={0.72} tint="blue" label="CuSO₄(aq)" />

          <Electrode
            x={CU_X}
            top={ELECTRODE_TOP}
            length={ELECTRODE_LENGTH}
            material="cu"
            thinning={electrolytic ? cuFraction : 0}
            plating={galvanic ? cuFraction : 0}
            depositMaterial="cu"
            polarity="+"
            role={galvanic ? 'cathode' : electrolytic ? 'anode' : undefined}
          />
          <Electrode
            x={ZN_X}
            top={ELECTRODE_TOP}
            length={ELECTRODE_LENGTH}
            material="zn"
            thinning={galvanic ? znFraction : 0}
            plating={electrolytic ? znFraction : 0}
            depositMaterial="zn"
            polarity="−"
            role={galvanic ? 'anode' : electrolytic ? 'cathode' : undefined}
          />

          <SaltBridge
            start={{ x: 200, y: BRIDGE_Y }}
            finish={{ x: 400, y: BRIDGE_Y }}
            apex={BRIDGE_APEX}
            plugs
            t={phase}
            ions={mode !== 'balanced'}
            ionCount={3}
            cationsTo={electrolytic ? 'from' : 'to'}
          />
          {/* Below the arch and its plugs, clear of every stroke. */}
          <text x={300} y={334} textAnchor="middle" fontSize={15} className={styles.flowLabel}>
            KCl in agar gel
          </text>
        </svg>
        <p className={styles.note}>
          Purple arrow: conventional current. Blue dots: electrons. Current and mass changes are schematic (set by Ecell − Eext), not measured.
        </p>
      </div>

      <div className={styles.readout}>
        <p className={styles.mode} data-mode={mode}>
          {MODE_TEXT[mode]}
        </p>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              <span className="sym">E</span>
              <sub>cell</sub> − <span className="sym">E</span>ext (driving)
            </span>
            <span className={styles.metricValue}>{formatSigned(DANIELL_EMF_V - eExt, 2)} V</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Current (illustrative)</span>
            <span className={styles.metricValue}>{currentMa.toFixed(1)} mA</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Time</span>
            <span className={styles.metricValue}>{minutes.toFixed(1)} min</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Zn electrode Δm (illustrative)</span>
            <span className={styles.metricValue}>{formatSigned(mass.zn * 1000, 1)} mg</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Cu electrode Δm (illustrative)</span>
            <span className={styles.metricValue}>{formatSigned(mass.cu * 1000, 1)} mg</span>
          </div>
        </div>
        <p className={styles.srOnly} aria-live="polite">
          {`Eext ${eExt.toFixed(2)} V. ${MODE_TEXT[mode]}. ${FLOW_TEXT[mode]}. Schematic current ${currentMa.toFixed(1)} milliamps. After ${minutes.toFixed(1)} minutes, zinc electrode change ${(mass.zn * 1000).toFixed(1)} milligrams and copper electrode change ${(mass.cu * 1000).toFixed(1)} milligrams.`}
        </p>
      </div>
    </div>
  )
}
