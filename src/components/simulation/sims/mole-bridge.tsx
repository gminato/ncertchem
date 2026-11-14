'use client'

import { useState, type ReactNode } from 'react'
import {
  Label,
  MOLECULE_LAYOUTS,
  ParticleBox,
  Vessel,
  VocabDefs,
  atomRadius,
  type ParticleItem,
} from '@/components/vocab'
import { NumberField, Segmented, type SegmentedOption } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { parseFormula } from '@/lib/chem/formula'
import {
  formatQuantity,
  formatScientific,
  gramsFromMoles,
  massToMolesLine,
  molesFromGrams,
  molesFromParticles,
  molesToMassLine,
  molesToParticlesLine,
  particlesToMolesLine,
  resolveSubstance,
  sampleFromMoles,
  scientificParts,
  superscript,
} from '@/lib/chem/mole-bridge'
import { roundToSigFigs } from '@/lib/chem/sigfigs'
import styles from './mole-bridge.module.css'

/** Which node the Learner last edited. It sets the direction of the flow. */
type Source = 'mass' | 'amount' | 'particles'

/** One arrow's flow dot. `id` changes on every edit, so the CSS animation restarts. */
interface Pulse {
  id: number
  delay: number
}

const DEFAULT_FORMULA = 'H2O'
/** The worked example: 36.04 g of water is 2.000 mol. */
const DEFAULT_GRAMS = 36.04
const FLOW_DELAY_SECOND = 0.35

const PRESETS: readonly SegmentedOption<string>[] = [
  { value: 'H2O', label: <>H<sub>2</sub>O</> },
  { value: 'CO2', label: <>CO<sub>2</sub></> },
  { value: 'NaCl', label: 'NaCl' },
  { value: 'C6H12O6', label: <>C<sub>6</sub>H<sub>12</sub>O<sub>6</sub></> },
]

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉'
/** Subscript digits for display only, e.g. "C6H12O6" becomes "C₆H₁₂O₆". */
const subscript = (text: string) => text.replace(/\d/g, (digit) => SUBSCRIPTS[Number(digit)])

// SVG geometry for the magnified view. viewBox 640 × 340.
const ZOOM = {
  vessel: { x: 120, y: 160, width: 130, height: 200 },
  window: { x: 92, y: 148, width: 56, height: 44 },
  inset: { x: 330, y: 40, width: 280, height: 210, cols: 3, rows: 2 },
}
const INSET_ATOM_CAP = 40

/**
 * Items for one cell of the magnifier. A formula with a Molecule layout is
 * drawn as that molecule. Any other formula is drawn as a schematic cluster of
 * its atoms, so the magnifier never breaks on an unusual formula.
 */
function cellItems(formula: string, x: number, y: number, scaleFactor: number): ParticleItem[] {
  if (MOLECULE_LAYOUTS[formula]) {
    return [{ kind: 'molecule', formula, x, y, style: 'ball-and-stick', scale: scaleFactor }]
  }
  const counts = parseFormula(formula)
  const atoms: string[] = []
  for (const element of Object.keys(counts)) {
    for (let i = 0; i < counts[element]; i++) atoms.push(element)
  }
  atoms.sort((a, b) => atomRadius(b) - atomRadius(a))
  const golden = Math.PI * (3 - Math.sqrt(5))
  return atoms.slice(0, INSET_ATOM_CAP).map((element, i) => {
    const radius = 7 * Math.sqrt(i) * scaleFactor
    const angle = i * golden
    return {
      kind: 'atom',
      element,
      x: x + radius * Math.cos(angle),
      y: y + radius * Math.sin(angle),
      r: atomRadius(element) * 0.5 * scaleFactor,
    }
  })
}

/** The magnifier's items: a grid of cells, one molecule or cluster per cell. */
function insetItems(formula: string): ParticleItem[] {
  const { width, height, cols, rows } = ZOOM.inset
  const cellW = width / cols
  const cellH = height / rows
  const items: ParticleItem[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      items.push(...cellItems(formula, (col + 0.5) * cellW, (row + 0.5) * cellH, 1))
    }
  }
  return items
}

/**
 * MoleBridge: the mole as a hub between mass, amount and particle count. The
 * three nodes stay linked: editing any one updates the others, and a flow dot
 * runs along the arrows between them. A zoom view shows the sample and a
 * magnified inset with its particle count in scientific notation.
 */
export function MoleBridge({ reducedMotion }: SimulationProps) {
  const [formula, setFormula] = useState(DEFAULT_FORMULA)
  const [moles, setMoles] = useState(() => molesFromGrams(DEFAULT_FORMULA, DEFAULT_GRAMS))
  /**
   * The node the Learner last typed into, and the number exactly as typed. The
   * field being edited shows that number, so a half-typed value such as "36."
   * is never reformatted by a round trip through the conversions.
   */
  const [source, setSource] = useState<Source>('mass')
  const [typed, setTyped] = useState(DEFAULT_GRAMS)
  const [draft, setDraft] = useState(DEFAULT_FORMULA)
  const [formulaError, setFormulaError] = useState<string | null>(null)
  const [editId, setEditId] = useState(0)

  const sample = sampleFromMoles(formula, moles)
  const shownFormula = subscript(formula)

  const recordEdit = (next: Source, value: number, amount: number) => {
    setSource(next)
    setTyped(value)
    setMoles(amount)
    setEditId((id) => id + 1)
  }

  const editMass = (grams: number) => recordEdit('mass', grams, molesFromGrams(formula, grams))
  const editAmount = (value: number) => recordEdit('amount', value, value)
  /**
   * The particle field is in normalised scientific notation, so the typed
   * mantissa is scaled by the exponent that the field currently shows.
   */
  const editParticles = (mantissa: number) => {
    const exponent = scientificParts(sample.particles).exponent
    const particles = Number(`${mantissa}e${exponent}`)
    recordEdit('particles', mantissa, molesFromParticles(particles))
  }
  const particleParts = scientificParts(sample.particles)
  const amountText =
    sample.moles >= 1e-3 && sample.moles < 1e6 ? roundToSigFigs(sample.moles, 4) : undefined

  /**
   * Switches the substance but keeps the same mass, so the amount changes:
   * the same 36.04 g of CO₂ is a different number of moles from the same mass of H₂O.
   */
  const applyFormula = (text: string) => {
    const result = resolveSubstance(text)
    if (!result.ok) {
      setFormulaError(result.message)
      return
    }
    const grams = gramsFromMoles(formula, moles)
    setFormula(result.formula)
    setMoles(molesFromGrams(result.formula, grams))
    setSource('mass')
    setTyped(grams)
    setFormulaError(null)
  }

  const onDraft = (text: string) => {
    setDraft(text)
    if (text.trim() === '') {
      setFormulaError('Type a formula, such as CH4 or Na2CO3.')
      return
    }
    applyFormula(text)
  }

  const onPreset = (value: string) => {
    setDraft(value)
    applyFormula(value)
  }

  const presetValue = formulaError === null && draft.trim() === formula ? formula : ''

  const massLine =
    source === 'mass'
      ? massToMolesLine(sample.grams, sample.moles, formula)
      : molesToMassLine(sample.moles, sample.grams, formula)
  const particleLine =
    source === 'particles'
      ? particlesToMolesLine(sample.particles, sample.moles)
      : molesToParticlesLine(sample.moles, sample.particles)

  const pulses = pulsesFor(source, editId)
  const motionOn = !reducedMotion

  const summary = `${shownFormula} sample: ${formatQuantity(sample.grams)} g, ${formatQuantity(sample.moles)} mol, ${formatScientific(sample.particles)} particles.`

  return (
    <div className={styles.sim} data-testid="mole-bridge" data-formula={formula}>
      <div className={styles.bridge}>
        <Node title="Mass" formula={shownFormula} highlighted={source === 'mass'}>
          <NumberField
            label="Mass"
            value={source === 'mass' ? typed : sample.grams}
            onChange={editMass}
            min={0}
            unit="g"
            precision={3}
            id="mole-bridge-mass"
          />
        </Node>

        <FlowPair
          top={{ label: '÷ M', direction: 'right', pulse: pulses.topLeft }}
          bottom={{ label: '× M', direction: 'left', pulse: pulses.bottomLeft }}
          motionOn={motionOn}
          ariaLabel="Mass to amount: divide by the molar mass M. Amount to mass: multiply by M."
        />

        <Node title="Amount" formula={shownFormula} highlighted={source === 'amount'}>
          <NumberField
            label="Amount"
            value={source === 'amount' ? typed : sample.moles}
            displayValue={amountText}
            onChange={editAmount}
            min={0}
            unit="mol"
            precision={3}
            id="mole-bridge-amount"
          />
        </Node>

        <FlowPair
          top={{ label: <>× N<sub>A</sub></>, direction: 'right', pulse: pulses.topRight }}
          bottom={{ label: <>÷ N<sub>A</sub></>, direction: 'left', pulse: pulses.bottomRight }}
          motionOn={motionOn}
          ariaLabel="Amount to particles: multiply by the Avogadro constant N A. Particles to amount: divide by N A."
        />

        <Node title="Particles" formula={shownFormula} highlighted={source === 'particles'}>
          <NumberField
            label="Particles"
            value={source === 'particles' ? typed : Number(particleParts.mantissa)}
            displayValue={particleParts.mantissa}
            onChange={editParticles}
            min={0}
            unit={`× 10${superscript(particleParts.exponent)}`}
            precision={4}
            id="mole-bridge-particles"
          />
        </Node>
      </div>

      <div className={styles.calc} aria-live="polite" data-testid="mole-bridge-calc">
        <p className={styles.calcLine}>{massLine}</p>
        <p className={styles.calcLine}>{particleLine}</p>
      </div>

      <Zoom formula={formula} sample={sample} reducedMotion={reducedMotion} summary={summary} />

      <SimulationControls>
        <div className={styles.controlGroup}>
          <Segmented
            label="Substance"
            options={PRESETS}
            value={presetValue}
            onChange={onPreset}
          />
          <label className={styles.formulaField}>
            <span className={styles.formulaLabel}>Any formula</span>
            <input
              className={styles.formulaInput}
              type="text"
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              aria-invalid={formulaError !== null}
              aria-describedby="mole-bridge-formula-error"
              spellCheck={false}
              autoComplete="off"
              data-testid="mole-bridge-formula"
            />
          </label>
          <p
            id="mole-bridge-formula-error"
            className={formulaError ? styles.error : styles.hint}
            aria-live="polite"
          >
            {formulaError ?? 'Element symbols with capitals, e.g. NaCl or Fe2O3.'}
          </p>
        </div>
      </SimulationControls>
    </div>
  )
}

/** Which dots run on which arrow for an edit. Only the flow direction differs. */
function pulsesFor(source: Source, id: number) {
  const none = null
  const pulse = (delay: number): Pulse => ({ id, delay })
  switch (source) {
    case 'mass':
      return { topLeft: pulse(0), bottomLeft: none, topRight: pulse(FLOW_DELAY_SECOND), bottomRight: none }
    case 'amount':
      return { topLeft: none, bottomLeft: pulse(0), topRight: pulse(0), bottomRight: none }
    default:
      return { topLeft: none, bottomLeft: pulse(FLOW_DELAY_SECOND), topRight: none, bottomRight: pulse(0) }
  }
}

function Node({
  title,
  formula,
  highlighted,
  children,
}: {
  title: string
  formula: string
  highlighted: boolean
  children: ReactNode
}) {
  return (
    <div className={`${styles.node} ${highlighted ? styles.nodeActive : ''}`} data-node={title.toLowerCase()}>
      <div className={styles.nodeHead}>
        <span className={styles.nodeTitle}>{title}</span>
        <span className={styles.nodeFormula}>{formula}</span>
      </div>
      {children}
    </div>
  )
}

interface ArrowSpec {
  label: ReactNode
  direction: 'right' | 'left'
  pulse: Pulse | null
}

/** Two arrows, one each way, between a pair of nodes, labelled with their operation. */
function FlowPair({
  top,
  bottom,
  motionOn,
  ariaLabel,
}: {
  top: ArrowSpec
  bottom: ArrowSpec
  motionOn: boolean
  ariaLabel: string
}) {
  return (
    <div className={styles.pair} role="group" aria-label={ariaLabel}>
      <FlowArrow spec={top} motionOn={motionOn} />
      <FlowArrow spec={bottom} motionOn={motionOn} />
    </div>
  )
}

function FlowArrow({ spec, motionOn }: { spec: ArrowSpec; motionOn: boolean }) {
  const dotClass = spec.direction === 'right' ? styles.dotRight : styles.dotLeft
  return (
    <div className={styles.arrow} data-direction={spec.direction}>
      <span className={styles.arrowLabel}>{spec.label}</span>
      <div className={styles.track}>
        <svg className={styles.arrowSvg} viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden="true">
          <line
            x1={spec.direction === 'right' ? 2 : 98}
            x2={spec.direction === 'right' ? 96 : 4}
            y1={7}
            y2={7}
            className={styles.arrowLine}
          />
          <polygon
            points={spec.direction === 'right' ? '100,7 90,2 90,12' : '0,7 10,2 10,12'}
            className={styles.arrowHead}
          />
        </svg>
        {motionOn && spec.pulse && (
          <span
            key={spec.pulse.id}
            className={`${styles.dot} ${dotClass}`}
            style={{ animationDelay: `${spec.pulse.delay}s` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}

function Zoom({
  formula,
  sample,
  reducedMotion,
  summary,
}: {
  formula: string
  sample: ReturnType<typeof sampleFromMoles>
  reducedMotion: boolean
  summary: string
}) {
  const { vessel, window: win, inset } = ZOOM
  const insetRight = inset.x + inset.width
  const insetBottom = inset.y + inset.height
  const shown = insetItems(formula)
  const caption = formatScientific(sample.particles)
  return (
    <figure className={styles.zoomFigure}>
      <svg
        viewBox="0 0 640 340"
        className={styles.zoomSvg}
        role="img"
        aria-label={`Magnified view. ${summary}`}
        data-testid="mole-bridge-zoom"
      >
        <VocabDefs idPrefix="mole" />

        <Vessel
          x={vessel.x}
          y={vessel.y}
          width={vessel.width}
          height={vessel.height}
          level={0.7}
          liquid
          graduated
        />
        <Label x={vessel.x} y={vessel.y + vessel.height / 2 + 26} fontSize={17} fill="var(--fg)">
          Sample: {formatQuantity(sample.moles)} mol
        </Label>

        {/* The zoom window on the sample, and the two lines that run from it to the magnifier */}
        <rect x={win.x} y={win.y} width={win.width} height={win.height} rx={4} className={styles.window} />
        <line
          x1={win.x + win.width}
          y1={win.y}
          x2={inset.x}
          y2={inset.y}
          className={styles.zoomLine}
        />
        <line
          x1={win.x + win.width}
          y1={win.y + win.height}
          x2={inset.x}
          y2={insetBottom}
          className={styles.zoomLine}
        />

        <g
          key={formula}
          className={reducedMotion ? undefined : styles.zoomIn}
          data-testid="mole-bridge-inset"
        >
          <ParticleBox
            x={inset.x}
            y={inset.y}
            width={inset.width}
            height={inset.height}
            items={shown}
            defsPrefix="mole"
          />
        </g>

        <Label x={(inset.x + insetRight) / 2} y={insetBottom + 30} fontSize={19} fill="var(--fg)">
          <tspan fontStyle="italic">N</tspan> = {caption} particles
        </Label>
        <Label x={(inset.x + insetRight) / 2} y={insetBottom + 54} fontSize={15} fill="var(--fg-muted)">
          magnified: {ZOOM.inset.cols * ZOOM.inset.rows} shown, schematic
        </Label>
      </svg>
    </figure>
  )
}
