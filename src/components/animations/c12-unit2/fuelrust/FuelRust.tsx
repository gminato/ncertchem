'use client'

import type { ReactNode } from 'react'
import { Beaker, Electrode, GasBubbles, Ion, VocabDefs, Wire, type Point } from '@/components/vocab'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import {
  E0_FE_ANODE,
  E0_O2_CATHODE,
  EFF_FUEL_CELL,
  EFF_THERMAL,
  E_CELL_RUST,
  fmtSignedVolts,
  getFuelRustStep,
} from './fuel-rust-steps'

export interface FuelRustProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 470

/** A value that loops 0 to 1 as time passes; `offset` staggers particles along the path. */
function loop(t: number, speed: number, offset: number): number {
  const x = (t * speed + offset) % 1
  return x < 0 ? x + 1 : x
}

/* ---------- Steps 1 and 2: the H₂–O₂ fuel cell ---------- */

const CELL_BEAKER = { x: 150, y: 160, width: 280, height: 220 }
const CELL_LEVEL = 0.7
const ANODE_X = 230
const CATHODE_X = 350
const ELECTRODE_TOP = 124
const ELECTRODE_LEN = 220
const WIRE_TOP = 64

function FuelCell({ active, t }: { active: boolean; t: number }) {
  const liquidTop = CELL_BEAKER.y + (1 - CELL_LEVEL) * CELL_BEAKER.height
  const externalWire: Point[] = [
    { x: ANODE_X, y: ELECTRODE_TOP },
    { x: ANODE_X, y: WIRE_TOP },
    { x: CATHODE_X, y: WIRE_TOP },
    { x: CATHODE_X, y: ELECTRODE_TOP },
  ]
  const ions = [0, 1, 2].map((k) => {
    const f = active ? loop(t, 0.12, k / 3) : k / 3
    return { k, x: CATHODE_X + 10 - 150 * f, y: liquidTop + 60 + (k % 2) * 36 }
  })
  return (
    <g data-scene="cell">
      <Beaker
        x={CELL_BEAKER.x}
        y={CELL_BEAKER.y}
        width={CELL_BEAKER.width}
        height={CELL_BEAKER.height}
        level={CELL_LEVEL}
        tint="clear"
      />
      <text x={290} y={402} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        Concentrated NaOH(aq)
      </text>
      <Wire corners={externalWire} t={t} electrons={active} direction="forward" strokeWidth={3} />
      <text x={290} y={50} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--electron)">
        electrons (e⁻) flow in the wire
      </text>
      <Electrode
        x={ANODE_X}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LEN}
        width={18}
        material="graphite"
        polarity="−"
        role="anode"
      />
      <Electrode
        x={CATHODE_X}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LEN}
        width={18}
        material="graphite"
        polarity="+"
        role="cathode"
      />
      <GasBubbles x={172} y={262} width={44} height={110} count={5} t={t} />
      <GasBubbles x={364} y={262} width={44} height={110} count={5} t={t} />
      <path d="M80 276 H138 M130 270 L138 276 L130 282" fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} />
      <text x={24} y={280} fontSize={16} fill="var(--fg-muted)">
        H₂ in
      </text>
      <path d="M500 276 H442 M450 270 L442 276 L450 282" fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} />
      <text x={556} y={280} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
        O₂ in
      </text>
      {ions.map((ion) => (
        <Ion key={ion.k} x={ion.x} y={ion.y} kind="anion" formula="OH" charge="−" fontSize={15} />
      ))}
      {active && (
        <g data-scene="water-out">
          <path d="M226 236 q 6 9 0 13 q -6 -4 0 -13 Z" fill="var(--liquid-edge)" />
          <text x={248} y={246} fontSize={15} fill="var(--fg)">
            H₂O
          </text>
        </g>
      )}
      <text x={290} y={430} textAnchor="middle" fontSize={16} fill="var(--ox)">
        Anode (−): 2H₂ + 4OH⁻ → 4H₂O + 4e⁻
      </text>
      <text x={290} y={456} textAnchor="middle" fontSize={16} fill="var(--red)">
        Cathode (+): O₂ + 2H₂O + 4e⁻ → 4OH⁻
      </text>
    </g>
  )
}

/* ---------- Step 3: efficiency bars ---------- */

const BAR_X = 40
const BAR_W = 500

function EfficiencyBars() {
  const thermal = (EFF_THERMAL / 100) * BAR_W
  const cell = (EFF_FUEL_CELL / 100) * BAR_W
  return (
    <g data-scene="bars">
      <text x={BAR_X} y={92} fontSize={18} fontWeight={600} fill="var(--fg)">
        Thermal power plant
      </text>
      <rect x={BAR_X} y={108} width={BAR_W} height={56} rx={8} fill="var(--surface-raised)" stroke="var(--border)" />
      <rect x={BAR_X} y={108} width={thermal} height={56} rx={8} fill="var(--ox)" />
      <text x={BAR_X + thermal + 12} y={144} fontSize={20} fontWeight={600} fill="var(--fg)">
        ≈{EFF_THERMAL}%
      </text>
      <text x={BAR_X} y={192} fontSize={16} fill="var(--fg-muted)">
        The rest is lost as heat at the boiler and the turbine.
      </text>
      <text x={BAR_X} y={262} fontSize={18} fontWeight={600} fill="var(--fg)">
        H₂–O₂ fuel cell
      </text>
      <rect x={BAR_X} y={278} width={BAR_W} height={56} rx={8} fill="var(--surface-raised)" stroke="var(--border)" />
      <rect x={BAR_X} y={278} width={cell} height={56} rx={8} fill="var(--success)" />
      <text x={BAR_X + cell + 12} y={314} fontSize={20} fontWeight={600} fill="var(--fg)">
        ≈{EFF_FUEL_CELL}%
      </text>
      <text x={BAR_X} y={362} fontSize={16} fill="var(--fg-muted)">
        No boiler or turbine step: the chemical energy becomes electricity directly.
      </text>
      <path d="M40 420 H160 M150 412 L160 420 L150 428" fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} />
      <text x={172} y={426} fontSize={16} fill="var(--fg-muted)">
        fuel in (both rows)
      </text>
    </g>
  )
}

/* ---------- Steps 4 and 5: a water droplet on iron ---------- */

const IRON_Y = 318
const IRON_H = 90
const ANODIC_X = 200
const CATHODIC_X = 380
const DROPLET = 'M100 318 C100 230 180 190 290 190 C400 190 480 230 480 318 Z'

function CorrosionSpot({ x, role }: { x: number; role: 'anode' | 'cathode' }) {
  const colour = role === 'anode' ? 'var(--ox)' : 'var(--red)'
  return <circle cx={x} cy={IRON_Y} r={34} fill={colour} fillOpacity={0.18} stroke={colour} strokeWidth={2} strokeDasharray="6 4" />
}

function Corrosion({ t, moving, rust }: { t: number; moving: boolean; rust: boolean }) {
  const electronWire: Point[] = [
    { x: ANODIC_X, y: 372 },
    { x: CATHODIC_X, y: 372 },
  ]
  const feIons = [0, 1].map((k) => {
    const f = moving ? loop(t, 0.2, k / 2) : k / 2
    return rust
      ? { k, x: ANODIC_X + 130 * f, y: IRON_Y - 30 - 150 * f * 0.9 }
      : { k, x: ANODIC_X, y: IRON_Y - 22 - 70 * f }
  })
  const hIons = [0, 1].map((k) => {
    const f = moving ? loop(t, 0.16, k / 2) : k / 2
    return { k, x: 262 + 110 * f, y: 262 + k * 30 }
  })
  return (
    <g data-scene="corrosion">
      <text x={556} y={262} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
        air
      </text>
      <path d={DROPLET} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
      <rect x={40} y={IRON_Y} width={500} height={IRON_H} rx={6} fill="var(--metal-fe)" stroke="var(--border)" />
      <text x={540} y={446} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
        Iron (Fe)
      </text>
      <CorrosionSpot x={ANODIC_X} role="anode" />
      <CorrosionSpot x={CATHODIC_X} role="cathode" />
      <Wire corners={electronWire} t={t} electrons direction="forward" strokeWidth={3} />
      <text x={290} y={394} textAnchor="middle" fontSize={15} fill="var(--fg)">
        2e⁻ move through the metal
      </text>
      {rust && (
        <g data-scene="rust-layer">
          <rect x={ANODIC_X - 46} y={IRON_Y - 12} width={92} height={22} rx={10} fill="var(--heat)" />
          <text x={40} y={446} fontSize={16} fontWeight={600} fill="var(--heat)">
            Rust: Fe₂O₃·xH₂O
          </text>
        </g>
      )}
      {feIons.map((ion) => (
        <Ion key={`fe${ion.k}`} x={ion.x} y={ion.y} kind="cation" formula="Fe" charge="2+" fontSize={15} />
      ))}
      {hIons.map((ion) => (
        <Ion key={`h${ion.k}`} x={ion.x} y={ion.y} kind="cation" formula="H" charge="+" fontSize={15} />
      ))}
      <g data-scene="callouts">
        <text x={24} y={120} fontSize={16} fontWeight={600} fill="var(--ox)">
          Anode (−)
        </text>
        <text x={24} y={144} fontSize={16} fill="var(--fg)">
          Fe → Fe²⁺ + 2e⁻
        </text>
        <text x={24} y={166} fontSize={16} fill="var(--fg-muted)">
          E° = {fmtSignedVolts(E0_FE_ANODE)}
        </text>
        <path d="M70 172 L170 286" fill="none" stroke="var(--ox)" strokeWidth={1.5} />
        <text x={556} y={120} textAnchor="end" fontSize={16} fontWeight={600} fill="var(--red)">
          Cathode (+)
        </text>
        <text x={556} y={144} textAnchor="end" fontSize={16} fill="var(--fg)">
          O₂ + 4H⁺ + 4e⁻ → 2H₂O
        </text>
        <text x={556} y={166} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
          E° = {fmtSignedVolts(E0_O2_CATHODE)}
        </text>
        <path d="M500 172 L400 286" fill="none" stroke="var(--red)" strokeWidth={1.5} />
      </g>
      {!rust && (
        <text x={290} y={460} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          E°cell = {E_CELL_RUST.toFixed(2)} V
        </text>
      )}
    </g>
  )
}

/* ---------- Step 6: three protections ---------- */

const PANEL_CENTRES = [105, 290, 475] as const

function Panel({ cx, title, children }: { cx: number; title: string; children: ReactNode }) {
  return (
    <g>
      <rect x={cx - 86} y={44} width={172} height={392} rx={12} fill="var(--surface)" stroke="var(--border)" />
      <text x={cx} y={74} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {title}
      </text>
      <rect x={cx - 80} y={IRON_Y} width={160} height={56} rx={4} fill="var(--metal-fe)" stroke="var(--border)" />
      {children}
    </g>
  )
}

function Protection() {
  const [paint, zinc, magnesium] = PANEL_CENTRES
  const dome = (cx: number) => `M${cx - 75} ${IRON_Y} C${cx - 75} 262 ${cx - 35} 240 ${cx} 240 C${cx + 35} 240 ${cx + 75} 262 ${cx + 75} ${IRON_Y} Z`
  return (
    <g data-scene="protection">
      <Panel cx={paint} title="1. Paint">
        <path d={dome(paint)} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
        <rect x={paint - 80} y={IRON_Y} width={160} height={14} rx={3} fill="var(--accent-soft)" stroke="var(--border)" />
        <text x={paint} y={392} textAnchor="middle" fontSize={15} fill="var(--fg)">
          Paint keeps water
        </text>
        <text x={paint} y={414} textAnchor="middle" fontSize={15} fill="var(--fg)">
          and O₂ off the iron
        </text>
      </Panel>
      <Panel cx={zinc} title="2. Zinc coat">
        <path d={dome(zinc)} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
        <rect x={zinc - 80} y={IRON_Y} width={160} height={14} rx={3} fill="var(--metal-zn)" />
        <text x={zinc} y={392} textAnchor="middle" fontSize={15} fill="var(--fg)">
          Zn corrodes
        </text>
        <text x={zinc} y={414} textAnchor="middle" fontSize={15} fill="var(--fg)">
          instead of the Fe
        </text>
      </Panel>
      <Panel cx={magnesium} title="3. Magnesium block">
        <path d={dome(magnesium)} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
        <rect x={magnesium - 30} y={262} width={60} height={38} rx={4} fill="var(--metal-mg)" stroke="var(--border)" />
        <text x={magnesium} y={392} textAnchor="middle" fontSize={15} fill="var(--ox)">
          Mg is the anode
        </text>
        <text x={magnesium} y={414} textAnchor="middle" fontSize={15} fill="var(--fg)">
          Mg corrodes, Fe spared
        </text>
      </Panel>
    </g>
  )
}

export function FuelRust({ step, reducedMotion }: FuelRustProps) {
  const state = getFuelRustStep(step)
  const t = useAmbientTime(reducedMotion)
  const moving = !reducedMotion
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={state.ariaLabel}
      data-step={state.index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <VocabDefs />
      {state.scene === 'cell' && <FuelCell active={state.active} t={t} />}
      {state.scene === 'bars' && <EfficiencyBars />}
      {(state.scene === 'corrosion' || state.scene === 'rust') && (
        <Corrosion t={t} moving={moving && state.active} rust={state.scene === 'rust'} />
      )}
      {state.scene === 'protection' && <Protection />}
    </svg>
  )
}
