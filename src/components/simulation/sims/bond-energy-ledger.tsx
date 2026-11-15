'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Segmented, Slider, type SegmentedOption } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  LEDGER_REACTIONS,
  formationReactionEnthalpy,
  ledgerEstimate,
  ledgerEvents,
  ledgerMolecule,
  ledgerTotalsAt,
  type LedgerEvent,
  type LedgerReaction,
} from '@/lib/chem/bond-ledger'
import {
  ATOM_RADIUS,
  LEDGER_VIEW,
  ROW_Y,
  SKETCH,
  layoutCopies,
} from './bond-energy-ledger-layout'
import styles from './bond-energy-ledger.module.css'

const REACTION_SHORT: Readonly<Record<string, string>> = {
  'ch4-o2': 'CH₄ + O₂',
  'h2-cl2': 'H₂ + Cl₂',
  'c2h4-h2': 'C₂H₄ + H₂',
  'n2-h2': 'N₂ + H₂',
}

const REACTION_OPTIONS: readonly SegmentedOption<string>[] = LEDGER_REACTIONS.map((r) => ({
  value: r.id,
  label: REACTION_SHORT[r.id] ?? r.label,
}))

const PLAY_INTERVAL_MS = 650
const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉'

/** Index of an event in the reaction's event list, found by its key. */
function eventIndexMap(events: readonly LedgerEvent[]): Map<string, number> {
  const map = new Map<string, number>()
  events.forEach((e, i) => map.set(`${e.phase}|${e.molecule}|${e.copy}|${e.bondIndex}`, i))
  return map
}

/** Spoken description of the latest event, for the live region. */
function describeEvent(event: LedgerEvent | undefined, reaction: LedgerReaction): string {
  if (!event) return 'Start: no bonds have changed.'
  const mol = ledgerMolecule(event.molecule)
  const bond = mol.bonds[event.bondIndex]
  const pair = `${mol.atoms[bond.a]}${bond.order === 1 ? '–' : bond.order === 2 ? '=' : '≡'}${mol.atoms[bond.b]}`
  const verb = event.phase === 'break' ? 'Breaking a' : 'Forming a'
  const sign = event.phase === 'break' ? 'energy in' : 'energy out'
  return `${verb} ${pair} bond in ${event.molecule} (${event.energyKJ} kJ mol⁻¹, ${sign}). Reaction: ${reaction.label}.`
}

function formatKJ(value: number): string {
  if (Math.abs(value) < 1e-9) return '0'
  return `${Number.isInteger(value) ? value : value.toFixed(1)}`
}

function signedKJ(value: number): string {
  const magnitude = Math.abs(value).toFixed(1)
  if (Number(magnitude) === 0) return '0.0'
  return value < 0 ? `−${magnitude}` : `+${magnitude}`
}

/** Formula with digits as subscripts, e.g. CH4 becomes CH₄. */
function subscriptFormula(id: string): string {
  return id.replace(/\d/g, (d) => SUBSCRIPT_DIGITS[Number(d)])
}

/**
 * The bond-energy ledger: a gas-phase reaction drawn as ball-and-stick sketches, reactants on the top
 * row and products below. Each Learner step breaks one reactant bond (energy in, orange) or forms one
 * product bond (energy out, teal). The two running totals give the estimate of ΔᵣH, which is compared
 * with the Table 5.2 value.
 */
export function BondEnergyLedger({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const [reactionId, setReactionId] = useState<string>('ch4-o2')
  const [count, setCount] = useState(0)
  const [playing, setPlaying] = useState(false)

  const reaction = LEDGER_REACTIONS.find((r) => r.id === reactionId) ?? LEDGER_REACTIONS[0]
  const events = useMemo(() => ledgerEvents(reaction), [reaction])
  const copies = useMemo(() => layoutCopies(reaction), [reaction])
  const indexOf = useMemo(() => eventIndexMap(events), [events])
  const estimate = useMemo(() => ledgerEstimate(reaction), [reaction])
  const table = useMemo(() => formationReactionEnthalpy(reaction), [reaction])
  const total = events.length
  const k = Math.max(0, Math.min(total, count))
  const totals = ledgerTotalsAt(events, k)
  const scale = Math.max(estimate.brokenKJ, estimate.formedKJ, 1)
  const lastEvent = k > 0 ? events[k - 1] : undefined
  const done = k === total

  // Auto-play one event at a time, only while the simulation is on screen and reduced motion is off.
  useEffect(() => {
    if (!playing || !active || reducedMotion || count >= total) return
    const id = window.setTimeout(() => setCount((c) => Math.min(total, c + 1)), PLAY_INTERVAL_MS)
    return () => window.clearTimeout(id)
  }, [playing, active, reducedMotion, count, total])

  const chooseReaction = (id: string) => {
    setReactionId(id)
    setCount(0)
    setPlaying(false)
  }

  const togglePlay = () => {
    if (done) {
      setCount(0)
      if (reducedMotion) {
        setCount(total)
        return
      }
      setPlaying(true)
      return
    }
    if (reducedMotion) {
      setCount(total)
      return
    }
    setPlaying((p) => !p)
  }

  return (
    <div ref={rootRef} className={styles.wrap}>
      <svg
        viewBox={`0 0 ${LEDGER_VIEW.width} ${LEDGER_VIEW.height}`}
        className={styles.svg}
        role="img"
        aria-label={`Ball-and-stick sketches of ${reaction.label}. ${k} of ${total} bond changes shown.`}
        data-testid="ledger-stage"
      >
        {copies.map((c) => {
          const mol = ledgerMolecule(c.molecule)
          const pos = SKETCH[c.molecule]
          const abs = mol.atoms.map((_, i) => ({ x: c.cx + pos[i].x, y: c.cy + pos[i].y }))
          const label = c.side === 'break' ? 'reactant' : 'product'
          return (
            <g key={c.key} data-testid={`copy-${label}`}>
              {mol.bonds.map((bond, bi) => {
                const idx = indexOf.get(`${c.side}|${mol.id}|${c.copy}|${bi}`) ?? -1
                const broken = c.side === 'break' && idx < k
                const formed = c.side === 'form' && idx < k
                const ghostForm = c.side === 'form' && !formed
                const pa = abs[bond.a]
                const pb = abs[bond.b]
                const len = Math.hypot(pb.x - pa.x, pb.y - pa.y)
                const ux = (pb.x - pa.x) / len
                const uy = (pb.y - pa.y) / len
                const nx = -uy
                const ny = ux
                const sa = { x: pa.x + ux * ATOM_RADIUS, y: pa.y + uy * ATOM_RADIUS }
                const sb = { x: pb.x - ux * ATOM_RADIUS, y: pb.y - uy * ATOM_RADIUS }
                if (broken) {
                  // A broken bond snaps into two stubs pulled apart at the middle.
                  const mx = (sa.x + sb.x) / 2
                  const my = (sa.y + sb.y) / 2
                  const gap = 7
                  return (
                    <g key={`b-${bi}`} data-state="ghost-break">
                      <line x1={sa.x} y1={sa.y} x2={mx - ux * gap} y2={my - uy * gap} strokeWidth={2.5} strokeLinecap="round" style={{ stroke: 'var(--heat)' }} />
                      <line x1={sb.x} y1={sb.y} x2={mx + ux * gap} y2={my + uy * gap} strokeWidth={2.5} strokeLinecap="round" style={{ stroke: 'var(--heat)' }} />
                    </g>
                  )
                }
                const offsets = bond.order === 1 ? [0] : bond.order === 2 ? [-5, 5] : [-7, 0, 7]
                const state = formed ? 'formed' : ghostForm ? 'ghost-form' : 'intact'
                return (
                  <g key={`b-${bi}`} data-state={state}>
                    {offsets.map((o) => (
                      <line
                        key={o}
                        x1={sa.x + nx * o}
                        y1={sa.y + ny * o}
                        x2={sb.x + nx * o}
                        y2={sb.y + ny * o}
                        strokeWidth={formed ? 3.2 : state === 'intact' ? 3 : 1.2}
                        strokeDasharray={state === 'ghost-form' ? '2 4' : undefined}
                        strokeLinecap="round"
                        style={{
                          stroke: formed ? 'var(--work)' : state === 'intact' ? 'var(--fg-muted)' : 'var(--border)',
                        }}
                      />
                    ))}
                  </g>
                )
              })}
              {mol.atoms.map((el, i) => (
                <g key={`a-${i}`}>
                  <circle cx={abs[i].x} cy={abs[i].y} r={ATOM_RADIUS} style={{ fill: 'var(--surface)', stroke: 'var(--fg-muted)' }} strokeWidth={1.4} />
                  <text
                    x={abs[i].x}
                    y={abs[i].y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={el === 'H' ? 15 : 16}
                    fontFamily="var(--font-sans)"
                    style={{ fill: 'var(--fg)' }}
                  >
                    {el}
                  </text>
                </g>
              ))}
              <text x={c.cx} y={c.cy + 84} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg-muted)' }}>
                {subscriptFormula(mol.id)}
              </text>
            </g>
          )
        })}
        <line x1={LEDGER_VIEW.width / 2} y1={ROW_Y.reactant + 110} x2={LEDGER_VIEW.width / 2} y2={ROW_Y.product - 70} strokeWidth={2.5} style={{ stroke: 'var(--fg-muted)' }} />
        <polygon
          points={`${LEDGER_VIEW.width / 2},${ROW_Y.product - 66} ${LEDGER_VIEW.width / 2 - 7},${ROW_Y.product - 80} ${LEDGER_VIEW.width / 2 + 7},${ROW_Y.product - 80}`}
          style={{ fill: 'var(--fg-muted)' }}
        />
      </svg>

      <div className={styles.ledger}>
        <div className={styles.row}>
          <span>
            Bonds broken <span className="sym">(energy in)</span>
          </span>
          <div className={styles.track}>
            <div className={`${styles.fill} ${styles.heat}`} style={{ width: `${(totals.brokenKJ / scale) * 100}%` }} />
          </div>
          <span className={styles.value}>+{formatKJ(totals.brokenKJ)} kJ mol⁻¹</span>
        </div>
        <div className={styles.row}>
          <span>
            Bonds formed <span className="sym">(energy out)</span>
          </span>
          <div className={styles.track}>
            <div className={`${styles.fill} ${styles.work}`} style={{ width: `${(totals.formedKJ / scale) * 100}%` }} />
          </div>
          <span className={styles.value}>{totals.formedKJ > 0 ? '−' : ''}{formatKJ(totals.formedKJ)} kJ mol⁻¹</span>
        </div>
      </div>

      <p className={styles.result} aria-live="polite" data-testid="ledger-result">
        Estimate: <span className="sym">ΔᵣH</span> ≈ {formatKJ(totals.brokenKJ)} − {formatKJ(totals.formedKJ)} = {signedKJ(totals.netKJ)} kJ mol⁻¹
        so far. {describeEvent(lastEvent, reaction)}
      </p>

      <p className={styles.note}>
        Table 5.2 (standard enthalpies of formation, gas phase): <span className="sym">ΔᵣH</span> = {signedKJ(table)} kJ mol⁻¹. The
        bond estimate is {signedKJ(estimate.deltaHKJ)} kJ mol⁻¹, a difference of {Math.abs(estimate.deltaHKJ - table).toFixed(1)} kJ
        mol⁻¹. Mean bond enthalpies are averages over many compounds, and a bond in one molecule can differ from the same bond in
        another, so the estimate is approximate and only for gas-phase reactions.
      </p>

      <div className={styles.controls}>
        <SimulationControls>
          <Segmented label="Reaction" options={REACTION_OPTIONS} value={reaction.id} onChange={chooseReaction} />
          <Slider
            label="Bond changes"
            value={k}
            min={0}
            max={total}
            step={1}
            format={(v) => `${v} of ${total}`}
            onChange={(v) => {
              setPlaying(false)
              setCount(v)
            }}
          />
          <Button variant="secondary" onClick={togglePlay}>
            {done ? 'Replay' : playing ? 'Pause' : 'Play'}
          </Button>
        </SimulationControls>
      </div>
    </div>
  )
}
