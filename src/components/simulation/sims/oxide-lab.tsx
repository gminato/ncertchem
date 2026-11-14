'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Vessel } from '@/components/vocab'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  OXIDE_LAB_REACTIONS,
  PERIOD_THREE_OXIDES,
  reactionToCe,
  type OxideFormula,
  type Reaction,
} from '@/lib/chem/oxide-lab'
import { oxideNature } from '@/lib/chem/periodicity'
import styles from './oxide-lab.module.css'

/**
 * Illustrative universal-indicator colours. They are qualitative and are not
 * calibrated to a measured pH. Each name says what the colour stands for.
 */
const PH_COLOUR = {
  violet: { hex: '#7B3FB0', name: 'violet', meaning: 'strongly basic' },
  blue: { hex: '#2F6FD0', name: 'blue', meaning: 'basic' },
  orange: { hex: '#E8772E', name: 'orange', meaning: 'acidic' },
  red: { hex: '#D7322B', name: 'red', meaning: 'strongly acidic' },
  green: { hex: '#3E9B4F', name: 'green', meaning: 'neutral' },
} as const

type PhColour = keyof typeof PH_COLOUR

/** What one beaker holds, and what the oxide does in it. */
interface Beaker {
  label: string
  colour: PhColour
  /** The oxide dissolves in this liquid. */
  dissolves: boolean
}

interface OxideSetup {
  formula: OxideFormula
  label: string
  /** One beaker of water, or three beakers: dilute HCl, water and NaOH. */
  layout: 'single' | 'triple'
  /** Beaker data for the layout. Triple setups are [HCl, water, NaOH]. */
  beakers: Beaker[]
  /** One sentence for the readout: what happens and why the colour is what it is. */
  summary: string
}

const SETUPS: Record<OxideFormula, OxideSetup> = {
  Na2O: {
    formula: 'Na2O',
    label: 'Na₂O',
    layout: 'single',
    beakers: [{ label: 'water', colour: 'violet', dissolves: true }],
    summary: 'Na₂O dissolves in water to form sodium hydroxide, a strong base.',
  },
  MgO: {
    formula: 'MgO',
    label: 'MgO',
    layout: 'single',
    beakers: [{ label: 'water', colour: 'blue', dissolves: false }],
    summary: 'MgO is basic but sparingly soluble, so only part of it goes into solution as Mg(OH)₂.',
  },
  Al2O3: {
    formula: 'Al2O3',
    label: 'Al₂O₃',
    layout: 'triple',
    beakers: [
      { label: 'dilute HCl', colour: 'red', dissolves: true },
      { label: 'water', colour: 'green', dissolves: false },
      { label: 'NaOH', colour: 'violet', dissolves: true },
    ],
    summary: 'Al₂O₃ is insoluble in water, but it dissolves in both acid and base. That makes it amphoteric.',
  },
  SiO2: {
    formula: 'SiO2',
    label: 'SiO₂',
    layout: 'triple',
    beakers: [
      { label: 'dilute HCl', colour: 'green', dissolves: false },
      { label: 'water', colour: 'green', dissolves: false },
      { label: 'hot NaOH', colour: 'violet', dissolves: true },
    ],
    summary:
      'SiO₂ is insoluble in water and does not react with acid. It is a weakly acidic oxide: it reacts with hot, concentrated base.',
  },
  P4O10: {
    formula: 'P4O10',
    label: 'P₄O₁₀',
    layout: 'single',
    beakers: [{ label: 'water', colour: 'orange', dissolves: true }],
    summary: 'P₄O₁₀ reacts with water to form phosphoric acid, an acid.',
  },
  SO3: {
    formula: 'SO3',
    label: 'SO₃',
    layout: 'single',
    beakers: [{ label: 'water', colour: 'red', dissolves: true }],
    summary: 'SO₃ dissolves in water to form sulphuric acid, a strong acid.',
  },
  Cl2O7: {
    formula: 'Cl2O7',
    label: 'Cl₂O₇',
    layout: 'single',
    beakers: [{ label: 'water', colour: 'red', dissolves: true }],
    summary: 'Cl₂O₇ dissolves in water to form perchloric acid, a strong acid.',
  },
}

/** Equations shown with each oxide, in the order the readout names them. */
function equationsFor(formula: OxideFormula): { role: string; reaction: Reaction }[] {
  const set = OXIDE_LAB_REACTIONS[formula]
  const out: { role: string; reaction: Reaction }[] = []
  if (set.water) out.push({ role: 'with water', reaction: set.water })
  if (set.acid) out.push({ role: 'with dilute HCl', reaction: set.acid })
  if (set.base) out.push({ role: formula === 'SiO2' ? 'with hot NaOH' : 'with NaOH', reaction: set.base })
  return out
}

/** A mhchem equation rendered by KaTeX. The string comes from the tested data module. */
function Equation({ ce }: { ce: string }) {
  const html = useMemo(() => katex.renderToString(ce, { throwOnError: false }), [ce])
  return <span className={styles.equation} dangerouslySetInnerHTML={{ __html: html }} />
}

// Stage geometry (SVG viewBox 600 × 340).
const STAGE = { width: 600, height: 340 }
const SINGLE_X = 300
const TRIPLE_X = [110, 300, 490]
const LIQUID_LEVEL = 0.6

interface SolidProps {
  x: number
  y: number
  dissolves: boolean
  reducedMotion: boolean
  /** A powder heap in a triple setup, or a lump dropped into one beaker. */
  kind: 'lump' | 'heap'
}

/** The oxide solid: a lump that falls in, or a heap of powder that settles at the bottom. */
function Solid({ x, y, dissolves, reducedMotion, kind }: SolidProps) {
  const stateClass = reducedMotion
    ? dissolves
      ? styles.gone
      : ''
    : dissolves
      ? styles.dropDissolve
      : styles.drop
  return (
    <g className={stateClass} data-solid={kind}>
      {kind === 'lump' ? (
        <rect x={x - 26} y={y - 14} width={52} height={28} rx={8} className={styles.solid} />
      ) : (
        <ellipse cx={x} cy={y} rx={44} ry={15} className={styles.solid} />
      )}
    </g>
  )
}

function BeakerLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" className={styles.beakerLabel}>
      {children}
    </text>
  )
}

function Stage({
  setup,
  replay,
  reducedMotion,
}: {
  setup: OxideSetup
  replay: number
  reducedMotion: boolean
}) {
  const single = setup.layout === 'single'
  const xs = single ? [SINGLE_X] : TRIPLE_X
  const size = single ? { width: 200, height: 200 } : { width: 150, height: 190 }
  const yCentre = 190
  return (
    <svg
      className={styles.stage}
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      role="img"
      aria-label={`${setup.label} added to ${single ? 'water' : 'dilute HCl, water and NaOH'}: ${setup.summary}`}
    >
      {xs.map((x, i) => {
        const beaker = setup.beakers[i]
        const liquidStyle = { '--liquid': PH_COLOUR[beaker.colour].hex } as CSSProperties
        return (
          <g key={`${setup.formula}-${i}`} className={styles.beakerGroup} style={liquidStyle}>
            <Vessel
              x={x}
              y={yCentre}
              width={size.width}
              height={size.height}
              level={LIQUID_LEVEL}
              className={styles.vessel}
            />
            <BeakerLabel x={x} y={yCentre + size.height / 2 + 30}>
              {beaker.label}
            </BeakerLabel>
          </g>
        )
      })}
      {xs.map((x, i) => {
        const beaker = setup.beakers[i]
        const surface = yCentre + size.height / 2 - LIQUID_LEVEL * size.height
        return (
          <Solid
            key={`${replay}-${setup.formula}-${i}`}
            x={x}
            y={single ? surface + 30 : surface + size.height * 0.3}
            dissolves={beaker.dissolves}
            reducedMotion={reducedMotion}
            kind={single ? 'lump' : 'heap'}
          />
        )
      })}
    </svg>
  )
}

export function OxideLab({ reducedMotion }: SimulationProps) {
  const [formula, setFormula] = useState<OxideFormula>('Na2O')
  const [replay, setReplay] = useState(0)
  const setup = SETUPS[formula]
  const equations = equationsFor(formula)
  const rootClass = reducedMotion ? `${styles.root} ${styles.still}` : styles.root

  return (
    <div className={rootClass} data-oxide={formula}>
      <Stage key={formula} setup={setup} replay={replay} reducedMotion={reducedMotion} />

      <div className={styles.readout} aria-live="polite">
        <p className={styles.summary}>
          <strong>{setup.label}</strong> is a {oxideNature(formula)} oxide. {setup.summary}
        </p>
        <ul className={styles.swatches} aria-label="Illustrative pH colours">
          {setup.beakers.map((b) => (
            <li key={b.label} className={styles.swatch}>
              <span className={styles.dot} style={{ background: PH_COLOUR[b.colour].hex }} aria-hidden="true" />
              <span>
                {b.label}: <span className={styles.phName}>{PH_COLOUR[b.colour].name}</span>,{' '}
                {PH_COLOUR[b.colour].meaning}
              </span>
            </li>
          ))}
        </ul>
        <p className={styles.legend}>Illustrative pH colour: qualitative, not measured.</p>
      </div>

      <div className={styles.equations}>
        {equations.length === 0 ? (
          <p className={styles.note}>No reaction is shown for this oxide.</p>
        ) : (
          equations.map(({ role, reaction }) => (
            <p key={role} className={styles.equationRow}>
              <span className={styles.role}>{role}</span>
              <Equation ce={reactionToCe(reaction)} />
            </p>
          ))
        )}
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div role="group" aria-label="Choose an oxide" className={styles.tiles}>
            {PERIOD_THREE_OXIDES.map((o) => {
              const selected = o.formula === formula
              return (
                <button
                  key={o.formula}
                  type="button"
                  className={styles.tile}
                  aria-pressed={selected}
                  data-selected={selected ? 'true' : 'false'}
                  onClick={() => setFormula(o.formula)}
                >
                  <span className={styles.tileFormula}>{SETUPS[o.formula].label}</span>
                  <span className={styles.tileNature}>{oxideNature(o.formula)}</span>
                </button>
              )
            })}
          </div>
          <Button variant="secondary" onClick={() => setReplay((n) => n + 1)}>
            Drop again
          </Button>
        </div>
      </SimulationControls>
    </div>
  )
}
