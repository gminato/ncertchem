'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { EquilibriumCurves } from '@/components/equilibrium/EquilibriumCurves'
import { LeChatelierScale, type LeChatelierStress } from '@/components/equilibrium/LeChatelierScale'
import { PistonVessel, type VesselSpecies } from '@/components/animations/unit6/lechatelier/PistonVessel'
import { concentrationAxisMax, fixed } from '@/components/animations/unit6/lechatelier/lechatelier-steps'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ARGON_AMOUNT,
  TEMPERATURE_STEP_K,
  applyLabEvent,
  compositionAt,
  createLab,
  labActions,
  labSystem,
  kUnit,
  lastEnd,
  seriesBetween,
  type LabEvent,
  type LabSnapshot,
  type LabSystemId,
  type LabSystem,
  type LabEventRecord,
} from '@/lib/chem/le-chatelier-lab'
import styles from './le-chatelier-lab.module.css'

/** Width of the curve window, in lab time units. */
const WINDOW = 24
/** Lab time from the left edge of the window to the head of the curves. */
const HEAD = 14
/** Lab time that passes per real second while a relaxation runs. */
const SPEED = 4

const SPECIES_COLOUR: Record<string, string> = {
  N2: 'var(--fg-muted)',
  H2: 'var(--accent)',
  NH3: 'var(--fwd)',
  N2O4: 'var(--fg-subtle)',
  NO2: 'var(--no2)',
  'Fe3+': '#D9A53B',
  'SCN-': 'var(--fg-muted)',
  'FeSCN2+': '#C62828',
}

const SYSTEM_OPTIONS: { value: LabSystemId; label: string }[] = [
  { value: 'haber', label: 'N₂ + 3H₂ ⇌ 2NH₃' },
  { value: 'n2o4', label: 'N₂O₄ ⇌ 2NO₂' },
  { value: 'fe-scn', label: 'Fe³⁺ + SCN⁻' },
]

const GROUP_LABEL: Record<string, string> = {
  concentration: 'Concentration',
  pressure: 'Volume (pressure)',
  temperature: 'Temperature',
  inert: 'Inert gas',
  catalyst: 'Catalyst',
}

/** Words for the direction of a shift. */
function directionText(direction: LabEventRecord['direction']): string {
  if (direction === 'forward') return 'towards products'
  if (direction === 'reverse') return 'towards reactants'
  return 'no net shift'
}

/** The balance stress that matches the last stress pressed. */
function balanceFor(system: LabSystem, last: LabEventRecord | null): { stress: LeChatelierStress; shift: 'products' | 'reactants' } {
  if (!last) return { stress: 'none', shift: 'products' }
  const shift = last.shift === 'left' ? 'reactants' : 'products'
  const e = last.event
  switch (e.kind) {
    case 'add': {
      const role = system.species.find((s) => s.id === e.species)!.role
      return { stress: role === 'reactant' ? 'add-reactant' : 'add-product', shift }
    }
    case 'remove': {
      const role = system.species.find((s) => s.id === e.species)!.role
      return { stress: role === 'reactant' ? 'remove-reactant' : 'remove-product', shift }
    }
    case 'compress':
      return { stress: 'compress', shift }
    case 'expand':
    case 'argon-constant-pressure':
      return { stress: 'expand', shift }
    case 'heat':
      return { stress: 'heat', shift }
    case 'cool':
      return { stress: 'cool', shift }
    default:
      return { stress: 'none', shift: 'products' }
  }
}

function lastLabel(system: LabSystem, last: LabEventRecord | null): string {
  if (!last) return 'Starting mixture, approaching equilibrium'
  const e = last.event
  const name = (id: string) => system.species.find((s) => s.id === id)!.label
  switch (e.kind) {
    case 'add':
      return `Added ${name(e.species)}`
    case 'remove':
      return `Removed ${name(e.species)}`
    case 'compress':
      return 'Compressed to ½ V'
    case 'expand':
      return 'Expanded to 2 V'
    case 'argon-constant-volume':
      return `Added ${ARGON_AMOUNT} mol Ar at constant V`
    case 'argon-constant-pressure':
      return `Added ${ARGON_AMOUNT} mol Ar at constant p`
    case 'heat':
      return `Heated by ${TEMPERATURE_STEP_K} K`
    case 'cool':
      return `Cooled by ${TEMPERATURE_STEP_K} K`
    case 'catalyst':
      return 'Added a catalyst'
  }
}

function kText(k: number): string {
  return k >= 100 ? k.toFixed(0) : k.toPrecision(3)
}

/**
 * The Le Chatelier Lab. A piston vessel holds one of three equilibria. Each press applies a stress
 * from the lib, the lib's leChatelier gives Q, the shift and the new equilibrium, and the curves
 * re-settle live in lab time. Gases respond to volume, temperature and argon; the aqueous mixture
 * responds to concentration and catalyst only.
 */
export function LeChatelierLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const [systemId, setSystemId] = useState<LabSystemId>('haber')
  const [snap, setSnap] = useState<LabSnapshot>(() => createLab('haber'))
  const [now, setNow] = useState(0)

  const system = labSystem(systemId)
  const end = lastEnd(snap)
  // Reduced motion shows the settled state at once; otherwise the clock runs through the relaxation.
  const clock = reducedMotion ? end : Math.min(now, end)
  const running = clock < end - 1e-9

  // Lab time runs while a relaxation is in progress and the Lab is on screen.
  useEffect(() => {
    if (!running || !active) return
    let frame = 0
    let last = performance.now()
    const tick = (time: number) => {
      const dt = (time - last) / 1000
      last = time
      setNow((n) => Math.min(end, n + dt * SPEED))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running, active, end])

  const chooseSystem = (id: LabSystemId) => {
    setSystemId(id)
    setSnap(createLab(id))
    setNow(0)
  }

  const reset = () => {
    setSnap(createLab(systemId))
    setNow(0)
  }

  const press = (event: LabEvent) => {
    setSnap(applyLabEvent(snap, event))
  }

  const actions = useMemo(() => labActions(snap), [snap])
  const composition = compositionAt(snap, clock)

  // Curves: the window of the last WINDOW units, ending at the clock.
  // The head of the curves sits 14 units in from the left, so the 'equilibrium reached' label has room.
  const windowStart = Math.max(0, clock - HEAD)
  const series = system.species.map((sp) => ({
    id: sp.id,
    label: sp.label,
    color: SPECIES_COLOUR[sp.id],
    points: seriesBetween(snap, sp.id, windowStart, clock).map(([t, c]) => [t - windowStart, c] as const),
  }))
  const concMax = concentrationAxisMax([Math.max(...series.flatMap((s) => s.points.map((p) => p[1])), 0.1)])
  const lastEvent = snap.epochs[snap.epochs.length - 1].event
  const perturbStart = lastEvent ? snap.epochs[snap.epochs.length - 1].startTime - windowStart : undefined
  const perturbAt = perturbStart !== undefined && perturbStart >= 0 && perturbStart <= WINDOW ? perturbStart : undefined

  const balance = balanceFor(system, snap.last)
  const k = snap.k
  const unit = kUnit(system)
  const isGas = system.medium === 'gas'
  const settled = snap.settled

  const vesselSpecies: VesselSpecies[] = isGas
    ? system.species.map((sp) => ({ id: sp.id, colour: SPECIES_COLOUR[sp.id], amount: composition[sp.id] ?? 0 }))
    : []
  const tint =
    system.id === 'n2o4' ? { colour: SPECIES_COLOUR.NO2, concentration: composition.NO2 ?? 0, half: 0.5 } : null
  const solution =
    system.id === 'fe-scn'
      ? {
          first: { colour: SPECIES_COLOUR['Fe3+'], concentration: composition['Fe3+'] ?? 0, half: 0.3 },
          second: { colour: SPECIES_COLOUR['FeSCN2+'], concentration: composition['FeSCN2+'] ?? 0, half: 0.08 },
        }
      : null

  const q = snap.last ? snap.last.immediateQ : null
  const direction = snap.last ? directionText(snap.last.direction) : 'not stressed yet'
  const species = system.species.map((sp) => `${sp.label} ${fixed(settled[sp.id], 2)} M`).join(', ')
  const summary = `${system.name} at ${snap.temperatureK} K, volume ${fixed(snap.volume, 2)} L. ${lastLabel(system, snap.last)}. K = ${kText(k)} ${unit}. ${
    q === null ? '' : `Q right after the stress = ${kText(q)}, so the shift is ${direction}. `
  }Settled amounts: ${species}.`

  const groups = ['concentration', 'pressure', 'temperature', 'inert', 'catalyst'] as const

  return (
    <div ref={rootRef} className={styles.sim} data-testid="le-chatelier-lab" data-running={running ? 'true' : 'false'}>
      <div className={styles.layout}>
        <div className={styles.card}>
          <svg viewBox="0 0 200 244" role="img" aria-label={`Piston vessel at ${fixed(snap.volume, 2)} litres`} className={styles.vessel} data-testid="lab-vessel">
            {solution ? (
              <PistonVessel
                volume={1}
                medium="solution"
                tint={solution.first}
                secondTint={solution.second}
                caption="Solution, V fixed"
              />
            ) : (
              <PistonVessel volume={snap.volume} species={vesselSpecies} tint={tint} caption={`V = ${fixed(snap.volume, 2)} L`} />
            )}
          </svg>
          <ul className={styles.legend} aria-label="Settled amounts">
            {system.species.map((sp) => (
              <li key={sp.id}>
                <span className={styles.swatch} style={{ background: SPECIES_COLOUR[sp.id] }} aria-hidden="true" />
                <span className="sym">{sp.label.startsWith('[') ? sp.label : `[${sp.label}]`}</span>{' '}<span className={styles.num}>{fixed(composition[sp.id] ?? 0, 2)} M</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.card}>
          <svg viewBox="0 0 700 300" className={styles.plot} role="img" aria-label={`Concentrations against lab time for ${system.name}`} data-testid="lab-curves">
            <EquilibriumCurves
              panels={[{ title: system.name, series }]}
              timeMax={WINDOW}
              concMax={concMax}
              perturbAt={perturbAt}
              equilibriumAt={end - windowStart}
              yLabel="concentration, mol L⁻¹"
              xLabel="time (lab units)"
            />
          </svg>
        </div>

        <div className={styles.card}>
          <svg viewBox="0 0 360 262" className={styles.balance} role="img" aria-label="Balance showing the stress and the direction of the shift">
            <LeChatelierScale
              stress={balance.stress}
              shift={balance.shift}
              progress={1}
              reactantLabel={system.id === 'haber' ? 'N₂ + 3H₂' : system.id === 'n2o4' ? 'N₂O₄' : 'Fe³⁺ + SCN⁻'}
              productLabel={system.id === 'haber' ? '2NH₃' : system.id === 'n2o4' ? '2NO₂' : '[Fe(SCN)]²⁺'}
            />
          </svg>
        </div>

        <dl className={styles.readout} data-testid="lab-readout">
          <div className={styles.item}>
            <dt>Temperature</dt>
            <dd>{snap.temperatureK} K</dd>
          </div>
          <div className={styles.item}>
            <dt>
              <span className="sym">K</span>
            </dt>
            <dd data-testid="lab-k">
              {kText(k)} {unit}
            </dd>
          </div>
          <div className={styles.item}>
            <dt>
              <span className="sym">Q</span> right after the stress
            </dt>
            <dd data-testid="lab-q">{q === null ? '—' : `${kText(q)} ${unit}`}</dd>
          </div>
          <div className={styles.item}>
            <dt>Shift</dt>
            <dd data-testid="lab-direction">{direction}</dd>
          </div>
          <div className={styles.item}>
            <dt>Volume</dt>
            <dd>{fixed(snap.volume, 2)} L</dd>
          </div>
          <div className={styles.item}>
            <dt>Argon added</dt>
            <dd>{fixed(snap.argonMol, 2)} mol</dd>
          </div>
        </dl>
      </div>

      <p className={styles.note}>{system.kSource}</p>

      <p className={styles.srOnly} aria-live="polite" data-testid="lab-live">
        {summary}
      </p>

      <SimulationControls>
        <Segmented<LabSystemId> label="System" options={SYSTEM_OPTIONS} value={systemId} onChange={chooseSystem} />
        {groups.map((group) => {
          const items = actions.filter((a) => a.group === group)
          if (items.length === 0) return null
          return (
            <div key={group} role="group" aria-label={GROUP_LABEL[group]} className={styles.group}>
              <span className={styles.groupLabel} aria-hidden="true">
                {GROUP_LABEL[group]}
              </span>
              {items.map((a) => (
                <Button
                  key={a.id}
                  variant={a.group === 'concentration' ? 'secondary' : 'primary'}
                  disabled={!a.enabled}
                  title={a.reason ?? undefined}
                  onClick={() => press(a.event)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )
        })}
        <Button variant="secondary" onClick={reset}>
          Reset
        </Button>
      </SimulationControls>
    </div>
  )
}
