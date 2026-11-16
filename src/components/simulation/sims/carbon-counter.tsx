'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { fitScale as fitBox, freeDirection } from '@/components/animations/unit9/family/formula'
import { Label, VocabDefs } from '@/components/vocab'
import { ALKANE_PRESETS, designCarbons, designGraph, type AlkaneDesign } from '@/lib/chem/alkane-builder'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  carbonCounts,
  carbonRows,
  chainIsomerNames,
  hydrogenTally,
  monohaloProducts,
  type CarbonClass,
  type MonohaloProduct,
} from '@/lib/chem/carbon-counter'
import styles from './carbon-counter.module.css'

/** The most carbons the counter builds: the presets run to C8, and the side chain adds one. */
const MAX_CARBONS = 8
const MIN_BACKBONE = 2
const CLASSES: CarbonClass[] = ['1°', '2°', '3°', '4°']
const CLASS_FILL: Record<CarbonClass, string> = {
  '0°': 'var(--fg-muted)',
  '1°': 'var(--spot-1)',
  '2°': 'var(--spot-2)',
  '3°': 'var(--spot-3)',
  '4°': 'var(--spot-4)',
}
const CENTRE = { x: 280, y: 180 }
const HALOGEN_OPTIONS = [
  { value: 'Cl' as const, label: 'Cl₂' },
  { value: 'Br' as const, label: 'Br₂' },
]

/** Straight chains C2 to C8, then the branched presets that have at most C8. */
const PRESETS: { id: string; design: AlkaneDesign; name: string }[] = [
  ...Array.from({ length: MAX_CARBONS - 1 }, (_, k) => ({ id: `straight-${k + 2}`, design: { backbone: k + 2, branches: [] } })),
  ...ALKANE_PRESETS.filter((p) => designCarbons(p.design) <= MAX_CARBONS).map((p) => ({ id: p.id, design: p.design })),
].map((p) => ({ ...p, name: nameOf(designGraph(p.design)) }))

const START_DESIGN: AlkaneDesign = { backbone: 5, branches: [] }

/** Same molecule: same backbone and side chains, in any order. */
function sameDesign(a: AlkaneDesign, b: AlkaneDesign): boolean {
  if (a.backbone !== b.backbone || a.branches.length !== b.branches.length) return false
  const key = (d: AlkaneDesign) => d.branches.map((x) => `${x.position}:${x.length}`).sort().join(',')
  return key(a) === key(b)
}

/** The sliders build one methyl side chain at most; the presets may have more. */
function designFromSliders(backbone: number, branchAt: number): AlkaneDesign {
  return { backbone, branches: branchAt > 0 ? [{ position: branchAt, length: 1 }] : [] }
}


/**
 * The carbon counter: an alkane, drawn large. The Learner predicts the class (1°, 2°, 3° or 4°) of each carbon,
 * then asks the lib for the answer. The hydrogen tally, the monochloro products (halogenate) and the chain
 * isomers (alkaneIsomers) all come from the lib. Carbons are chosen with buttons, so the sim works by keyboard.
 */
export function CarbonCounter() {
  const [design, setDesign] = useState<AlkaneDesign>(START_DESIGN)
  const [selected, setSelected] = useState<number | null>(null)
  const [guesses, setGuesses] = useState<Record<number, CarbonClass>>({})
  const [revealed, setRevealed] = useState(false)
  const [halogen, setHalogen] = useState<'Cl' | 'Br'>('Cl')

  const graph = useMemo(() => designGraph(design), [design])
  const rows = useMemo(() => carbonRows(graph), [graph])
  const name = nameOf(graph)
  const formula = molecularFormula(graph)
  const counts = carbonCounts(graph)
  const tally = hydrogenTally(graph)
  const isomers = chainIsomerNames(rows.length)
  const products: MonohaloProduct[] = useMemo(() => {
    try {
      return monohaloProducts(graph, halogen)
    } catch {
      return []
    }
  }, [graph, halogen])

  const presetId = PRESETS.find((p) => sameDesign(p.design, design))?.id ?? 'custom'
  const frame = drawingFrame(graph, fitBox(graph, 96, 440, 250))
  const scale = frame.scale
  const matched = rows.filter((r) => guesses[r.atom] === r.degree).length
  const guessed = rows.filter((r) => guesses[r.atom] !== undefined).length

  /** Replacing the molecule clears the Learner's predictions. */
  function apply(next: AlkaneDesign) {
    setDesign(next)
    setSelected(null)
    setGuesses({})
    setRevealed(false)
  }

  function pickPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id)
    if (p) apply(p.design)
  }

  const branchAt = design.branches[0]?.position ?? 0
  function setBackbone(value: number) {
    const room = MAX_CARBONS - (branchAt > 0 ? 1 : 0)
    const backbone = Math.min(Math.round(value), room)
    apply(designFromSliders(backbone, Math.min(branchAt, backbone)))
  }
  function setBranch(value: number) {
    apply(designFromSliders(design.backbone, Math.min(Math.round(value), design.backbone)))
  }

  const cursor = selected !== null ? rows.findIndex((r) => r.atom === selected) : -1
  const selectedRow = cursor >= 0 ? rows[cursor] : null

  const summary = revealed
    ? `${name}, ${formula}. Carbons: ${counts['1°']} primary, ${counts['2°']} secondary, ${counts['3°']} tertiary, ${counts['4°']} quaternary. Your predictions: ${matched} of ${rows.length} match the lib.`
    : `${name}, ${formula}, ${rows.length} carbons. ${guessed} of ${rows.length} predicted. Choose a carbon, then its class.`
  const hydrogenLine = `Hydrogens: ${tally.primary} on primary carbons, ${tally.secondary} on secondary, ${tally.tertiary} on tertiary, ${tally.quaternary} on quaternary (${tally.total} in all).`

  return (
    <div className={styles.counter} data-testid="carbon-counter">
      <div className={styles.layout}>
        <figure className={styles.stage} style={{ margin: 0 }}>
          <svg
            viewBox="0 0 560 360"
            role="img"
            aria-label={`${name}, drawn with its carbons. ${summary}`}
            className={styles.drawing}
            data-testid="counter-drawing"
          >
            <VocabDefs />
            <SkeletalFormula graph={graph} scale={scale} x={CENTRE.x} y={CENTRE.y} />
            {selectedRow && (
              <circle
                cx={CENTRE.x + frame.points[selectedRow.atom].x}
                cy={CENTRE.y + frame.points[selectedRow.atom].y}
                r={0.42 * scale}
                fill="var(--highlight)"
                data-testid="counter-selected"
              />
            )}
            {rows.map((r) => {
              const p = frame.points[r.atom]
              const d = freeDirection(frame.points, frame.adj, r.atom)
              const offset = 0.62 * scale
              const text = revealed ? r.degree : guesses[r.atom] ?? '?'
              const fill = revealed ? CLASS_FILL[r.degree] : guesses[r.atom] ? 'var(--fg)' : 'var(--fg-muted)'
              return (
                <Label
                  key={r.atom}
                  x={CENTRE.x + p.x + d.x * offset}
                  y={CENTRE.y + p.y + d.y * offset}
                  fontSize={20}
                  fill={fill}
                  data-testid="counter-label"
                  data-atom={r.atom}
                  data-degree={revealed ? r.degree : ''}
                >
                  {text}
                </Label>
              )
            })}
            <Label x={280} y={336} fontSize={22} fill="var(--fg)" data-testid="counter-name">
              {name}
            </Label>
            <Label x={280} y={62} fontSize={18} fill="var(--fg-muted)">
              {revealed ? 'Classes from the lib' : 'Your predictions (?) appear on each carbon'}
            </Label>
          </svg>
        </figure>

        <section className={styles.panel} aria-label="Predict and count">
          <h2 className={styles.title}>{name}</h2>
          <p className={styles.note}>
            {formula}, {rows.length} carbons. {hydrogenLine}
          </p>

          <div>
            <p className={styles.heading}>1. Pick a carbon</p>
            <ul className={styles.chips} aria-label="Carbons">
              {rows.map((r, i) => (
                <li key={r.atom}>
                  <button
                    type="button"
                    className={styles.chip}
                    aria-pressed={selected === r.atom}
                    onClick={() => setSelected(selected === r.atom ? null : r.atom)}
                    data-testid="counter-chip"
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={styles.heading}>2. Predict its class{selectedRow ? ` (carbon ${cursor + 1})` : ''}</p>
            <div className={styles.row} role="group" aria-label="Class of the selected carbon">
              {CLASSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={styles.classBtn}
                  aria-pressed={selectedRow ? guesses[selectedRow.atom] === c : false}
                  disabled={!selectedRow || revealed}
                  onClick={() => selectedRow && setGuesses({ ...guesses, [selectedRow.atom]: c })}
                  data-testid="counter-class"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.row}>
            <Button onClick={() => setRevealed(true)} disabled={revealed || guessed === 0}>
              Reveal from the lib
            </Button>
            <Button variant="secondary" onClick={() => { setGuesses({}); setRevealed(false); setSelected(null) }}>
              Clear predictions
            </Button>
          </div>
          <p className={styles.summary} role="status" data-testid="counter-score">
            {revealed ? `${matched} of ${rows.length} predictions match.` : `${guessed} of ${rows.length} predicted.`}
          </p>

          <div>
            <p className={styles.heading}>Monochloro products (halogenate)</p>
            <div className={styles.row}>
              <Segmented label="Halogen" options={HALOGEN_OPTIONS} value={halogen} onChange={setHalogen} />
              <span className={styles.note} data-testid="counter-products">
                {products.length} distinct product{products.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className={styles.note}>{products.map((p) => p.name).join(', ')}</p>
          </div>

          <div>
            <p className={styles.heading}>Chain isomers of {formula}</p>
            {isomers ? (
              <ul className={styles.isomers} data-testid="counter-isomers">
                {isomers.map((n) => (
                  <li key={n} className={n === name ? styles.current : undefined}>
                    {n}
                    {n === name ? ' (this molecule)' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.note}>The lib lists chain isomers up to C7.</p>
            )}
          </div>

          <p className={styles.srOnly} aria-live="polite" data-testid="counter-live">
            {summary} {hydrogenLine}
          </p>
        </section>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <label className={styles.heading} htmlFor="counter-preset">
            Preset
          </label>
          <select
            id="counter-preset"
            className={styles.select}
            value={presetId}
            onChange={(e) => pickPreset(e.target.value)}
            data-testid="counter-preset"
          >
            {presetId === 'custom' && <option value="custom">Custom (from the sliders)</option>}
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Slider label="Backbone carbons" value={design.backbone} min={MIN_BACKBONE} max={MAX_CARBONS} step={1} onChange={setBackbone} />
          <Slider
            label="Methyl side chain on carbon (0 for none)"
            value={branchAt}
            min={0}
            max={design.backbone}
            step={1}
            onChange={setBranch}
          />
          <p className={styles.note}>
            {rows.length} carbons in all. The sliders build one methyl side chain; a preset can have more.
          </p>
        </div>
      </SimulationControls>
    </div>
  )
}
