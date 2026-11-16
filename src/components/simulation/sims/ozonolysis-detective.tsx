'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { Tex } from '@/components/animations/unit6/qk/Tex'
import { SkeletalFormula, StructuralFormula, drawingFrame, skeletalBounds } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { nameOf } from '@/lib/chem/hydrocarbon-species'
import {
  FORWARD_PRESETS,
  FORWARD_REAGENTS,
  REVERSE_PUZZLES,
  carbonylCarbons,
  checkReverse,
  chainAlkeneSmiles,
  doubleBondCount,
  forwardReaction,
  puzzleProducts,
  type CarbonylCarbon,
  type ForwardReagent,
} from '@/lib/chem/ozonolysis-model'
import styles from './ozonolysis-detective.module.css'

type Mode = 'forward' | 'reverse'
type Source = 'preset' | 'build'

const MODE_OPTIONS: readonly { value: Mode; label: string }[] = [
  { value: 'forward', label: 'Forward: alkene to products' },
  { value: 'reverse', label: 'Reverse: products to alkene' },
]
const SOURCE_OPTIONS: readonly { value: Source; label: string }[] = [
  { value: 'preset', label: 'Preset' },
  { value: 'build', label: 'Build a chain' },
]
const REAGENT_OPTIONS = FORWARD_REAGENTS.map((r) => ({ value: r.value, label: r.label }))
const PRESET_OPTIONS = FORWARD_PRESETS.map((p) => ({ value: p.id, label: nameOf(parseSmiles(p.smiles)) }))
const PUZZLE_OPTIONS = REVERSE_PUZZLES.map((p) => ({ value: p.id, label: p.label }))

/** Short arrow labels: the reagent on the arrow. The conditions from the lib go in the paragraph. */
const ARROW_LABEL: Record<ForwardReagent, string> = {
  ozone: 'O₃, then Zn/H₂O',
  baeyer: 'cold, dilute aqueous KMnO₄',
  acidic: 'hot acidic KMnO₄',
}

/** Drawings are placed on a 900-unit canvas, so the stage scales them up to fill its width. */
const VIEW_WIDTH = 900

const SUBSCRIPT = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

/** Real subscripts for chemical formulas in running text: CO2 becomes CO₂, C6H12O2 becomes C₆H₁₂O₂. Locants such as 2-methyl are left alone. */
function sub(text: string): string {
  return text.replace(/(?<=[A-Za-z)\]])\d+/g, (digits) => [...digits].map((d) => SUBSCRIPT[Number(d)]).join(''))
}

/** Splits a phrase into lines of at most `max` characters, at spaces. */
function wrapWords(text: string, max: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** The bond length at which a skeletal drawing is at most `maxWidth` wide (never larger than `scale`). */
function fitScale(g: MolGraph, scale: number, maxWidth: number): number {
  const b = skeletalBounds(g, scale)
  return scale * Math.min(1, maxWidth / b.width)
}

/**
 * A molecule centred at (x, y), fitted to `maxWidth`. Molecules with one or two carbons (methanal,
 * ethanal, ethene) are written in full, with every hydrogen, so no bare C=O appears; larger ones are
 * skeletal drawings.
 */
function Figure({
  graph,
  scale,
  x,
  y,
  maxWidth,
  highlight = [],
}: {
  graph: MolGraph
  scale: number
  x: number
  y: number
  maxWidth: number
  highlight?: readonly number[]
}) {
  const carbons = graph.atoms.filter((a) => a.element === 'C').length
  if (carbons <= 2) return <StructuralFormula graph={graph} mode="complete" completeScale={30} x={x} y={y} />
  return <SkeletalFormula graph={graph} scale={fitScale(graph, scale, maxWidth)} x={x} y={y} highlightAtoms={highlight} />
}

/** The atoms of the C=C bonds of an alkene (washed in the highlight colour). */
function doubleBondAtoms(g: MolGraph): number[] {
  return g.bonds.filter((b) => b.order === 2).flatMap((b) => [b.a, b.b])
}

/** Forward mode: an alkene, the reagent, and the products the lib gives, each in its own cell. */
function ForwardPanel() {
  const [source, setSource] = useState<Source>('preset')
  const [presetId, setPresetId] = useState<(typeof FORWARD_PRESETS)[number]['id']>(FORWARD_PRESETS[1].id)
  const [carbons, setCarbons] = useState(5)
  const [position, setPosition] = useState(2)
  const [reagent, setReagent] = useState<ForwardReagent>('ozone')

  const k = Math.min(position, carbons - 1)
  const smiles = source === 'preset' ? (FORWARD_PRESETS.find((p) => p.id === presetId) ?? FORWARD_PRESETS[0]).smiles : chainAlkeneSmiles(carbons, k)
  const alkene = useMemo(() => parseSmiles(smiles), [smiles])
  const alkeneName = nameOf(alkene)
  const bonds = doubleBondCount(alkene)
  const reagentLabel = FORWARD_REAGENTS.find((r) => r.value === reagent)?.label ?? reagent

  const outcome = useMemo(() => {
    try {
      return { reaction: forwardReaction(alkene, reagent), error: null as string | null }
    } catch (e) {
      return { reaction: null, error: e instanceof Error ? e.message : 'This reagent does not apply to this alkene.' }
    }
  }, [alkene, reagent])

  const reaction = outcome.reaction
  const products = reaction?.products ?? []
  const names = products.map((p) => p.name)
  const readout = reaction
    ? sub(`${alkeneName} with ${reagentLabel} gives ${names.join(' + ')}. ${reaction.why}`)
    : sub(`${alkeneName}: ${outcome.error}`)

  // Layout (900 wide): reactant cell 0 to 260, arrow 270 to 400, products 440 to 888 in equal cells.
  const REACT_X = 130
  const ARROW = { x1: 270, x2: 400, y: 190 }
  const PRODUCT_LEFT = 440
  const PRODUCT_RIGHT = 888
  const cell = products.length ? (PRODUCT_RIGHT - PRODUCT_LEFT) / products.length : 0
  const arrowLines = reaction ? wrapWords(ARROW_LABEL[reagent], 16) : []

  return (
    <>
      <div className={styles.controls}>
        <Segmented label="Alkene source" options={SOURCE_OPTIONS} value={source} onChange={setSource} />
        {source === 'preset' ? (
          <Segmented label="Preset alkene" options={PRESET_OPTIONS} value={presetId} onChange={setPresetId} />
        ) : (
          <>
            <Slider label="Carbons in the chain" value={carbons} min={2} max={7} step={1} onChange={setCarbons} />
            <Slider label="Double bond after carbon" value={k} min={1} max={carbons - 1} step={1} onChange={setPosition} />
          </>
        )}
        <Segmented label="Reagent" options={REAGENT_OPTIONS} value={reagent} onChange={setReagent} />
      </div>

      <p className={styles.readout} aria-live="polite" data-testid="forward-readout">
        {readout}
      </p>

      <div className={styles.stage}>
        {reaction ? (
          <svg viewBox="0 0 900 340" role="img" aria-label={sub(`${alkeneName} with ${reagentLabel}: ${names.join(' and ')}`)} className={styles.scheme}>
            <text x={REACT_X} y={34} textAnchor="middle" fontSize={18} fill="var(--fg)" data-role="name">
              {sub(alkeneName)}
            </text>
            <Figure graph={alkene} scale={70} x={REACT_X} y={190} maxWidth={210} highlight={doubleBondAtoms(alkene)} />
            <line x1={ARROW.x1} y1={ARROW.y} x2={ARROW.x2 - 12} y2={ARROW.y} stroke="var(--fg-muted)" strokeWidth={2.5} />
            <path d={`M ${ARROW.x2 - 14} ${ARROW.y - 7} L ${ARROW.x2} ${ARROW.y} L ${ARROW.x2 - 14} ${ARROW.y + 7} Z`} fill="var(--fg-muted)" />
            {arrowLines.map((line, i) => (
              <text key={line} x={(ARROW.x1 + ARROW.x2) / 2} y={ARROW.y - 16 - (arrowLines.length - 1 - i) * 20} textAnchor="middle" fontSize={16} fill="var(--fg)">
                {sub(line)}
              </text>
            ))}
            {products.map((p, i) => {
              const x = PRODUCT_LEFT + cell * (i + 0.5)
              const hasGraph = p.graph.atoms.length > 0
              return (
                <g key={`${p.name}-${i}`} data-testid="forward-product">
                  {hasGraph ? (
                    <Figure graph={p.graph} scale={46} x={x} y={190} maxWidth={cell - 36} />
                  ) : (
                    <text x={x} y={190} textAnchor="middle" fontSize={18} fill="var(--fg)">
                      {sub(p.formula)}
                    </text>
                  )}
                  <text x={x} y={286} textAnchor="middle" fontSize={16} fill="var(--fg)" data-role="name">
                    {sub(p.name)}
                  </text>
                  {i > 0 && (
                    <text x={PRODUCT_LEFT + cell * i} y={198} textAnchor="middle" fontSize={30} fill="var(--fg-muted)">
                      +
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        ) : (
          <p className={styles.note}>{sub(outcome.error ?? '')}</p>
        )}
      </div>

      {reaction && (
        <div className={styles.equation} data-testid="forward-equation">
          <Tex tex={reaction.equation} display />
        </div>
      )}
      {bonds > 1 && reaction && (
        <p className={styles.note}>
          {`This alkene has ${bonds} C=C bonds, and ozone cuts each one. The ${products.length} products are shown in separate cells.`}
        </p>
      )}
    </>
  )
}

/** Reverse mode: the lib's carbonyl products; the learner joins two carbonyl carbons into a C=C. */
function ReversePanel() {
  const [puzzleId, setPuzzleId] = useState<(typeof REVERSE_PUZZLES)[number]['id']>(REVERSE_PUZZLES[0].id)
  const [picks, setPicks] = useState<CarbonylCarbon[]>([])

  const products = useMemo(() => puzzleProducts(puzzleId), [puzzleId])
  const carbonyls = useMemo(() => carbonylCarbons(products), [products])
  const SCALE = 72
  const frames = useMemo(() => products.map((g) => drawingFrame(g, SCALE)), [products])
  const productNames = products.map((g) => nameOf(g))
  const count = products.length
  const centres = products.map((_, i) => ({ x: (VIEW_WIDTH * (i + 0.5)) / count, y: 150 }))

  const isPicked = (c: CarbonylCarbon) => picks.some((p) => p.part === c.part && p.atom === c.atom)
  const toggle = (c: CarbonylCarbon) => {
    if (isPicked(c)) setPicks(picks.filter((p) => !(p.part === c.part && p.atom === c.atom)))
    else if (picks.length < 2) setPicks([...picks, c])
  }

  const joined = picks.length === 2 ? checkReverse(products, picks[0], picks[1]) : null
  const forwardNames = joined ? productNames.join(' and ') : ''

  let readout: string
  if (picks.length === 0) readout = `Products: ${productNames.join(' and ')}. Pick two carbonyl carbons (C=O) to join by a C=C.`
  else if (picks.length === 1) readout = 'One carbonyl carbon is picked. Pick the second one.'
  else if (joined && joined.matches) readout = sub(`Joined: ${joined.expectedName}. Ozonolysis of this alkene gives back ${forwardNames}.`)
  else readout = 'That join does not give the alkene that the forward reaction starts from. Reset and try another pair.'

  return (
    <>
      <div className={styles.controls}>
        <Segmented
          label="Carbonyl products"
          options={PUZZLE_OPTIONS}
          value={puzzleId}
          onChange={(id) => {
            setPuzzleId(id)
            setPicks([])
          }}
        />
        <Button variant="secondary" onClick={() => setPicks([])} disabled={picks.length === 0}>
          Reset the picks
        </Button>
      </div>

      <p className={styles.readout} aria-live="polite" data-testid="reverse-readout">
        {readout}
      </p>

      <div className={styles.stage}>
        <svg viewBox="0 0 900 450" role="group" aria-label="Carbonyl products. Choose two carbonyl carbons." className={styles.scheme}>
          {products.map((g, i) => {
            const c = centres[i]
            const partAtoms = picks.filter((p) => p.part === i).map((p) => p.atom)
            return (
              <g key={`p-${i}`}>
                <SkeletalFormula graph={g} scale={SCALE} x={c.x} y={c.y} highlightAtoms={partAtoms} />
                <text x={c.x} y={c.y + 104} textAnchor="middle" fontSize={17} fill="var(--fg)" data-role="name">
                  {sub(productNames[i])}
                </text>
              </g>
            )
          })}
          {count > 1 && (
            <text x={VIEW_WIDTH / 2} y={154} textAnchor="middle" fontSize={34} fill="var(--fg-muted)">
              +
            </text>
          )}
          {carbonyls.map((c) => {
            const frame = frames[c.part]
            const p = frame.points[c.atom]
            const x = centres[c.part].x + p.x
            const y = centres[c.part].y + p.y
            const on = isPicked(c)
            const label = `${productNames[c.part]}: carbonyl carbon${on ? ', picked' : ''}`
            return (
              <circle
                key={`c-${c.part}-${c.atom}`}
                cx={x}
                cy={y}
                r={18}
                fill={on ? 'var(--highlight)' : 'transparent'}
                fillOpacity={on ? 0.45 : 0}
                stroke={on ? 'var(--fg)' : 'var(--fg-muted)'}
                strokeDasharray={on ? undefined : '3 3'}
                strokeWidth={1.5}
                role="button"
                tabIndex={0}
                aria-label={sub(label)}
                aria-pressed={on}
                style={{ cursor: 'pointer' }}
                onClick={() => toggle(c)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(c)
                  }
                }}
              />
            )
          })}
          {joined && (
            <g data-testid="reverse-built">
              <line x1={VIEW_WIDTH / 2} y1={262} x2={VIEW_WIDTH / 2} y2={296} stroke="var(--fg-muted)" strokeWidth={2.5} />
              <path d={`M ${VIEW_WIDTH / 2 - 7} 290 L ${VIEW_WIDTH / 2} 304 L ${VIEW_WIDTH / 2 + 7} 290 Z`} fill="var(--fg-muted)" />
              <SkeletalFormula graph={joined.expected} scale={78} x={VIEW_WIDTH / 2} y={346} />
              <text x={VIEW_WIDTH / 2} y={442} textAnchor="middle" fontSize={18} fill="var(--fg)" data-role="name">
                {sub(joined.expectedName)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {joined && <p className={styles.note}>{sub(`The alkene for these two carbonyl compounds is ${joined.expectedName}.`)}</p>}
    </>
  )
}

/**
 * Ozonolysis detective (NCERT 9.3.5, item 7). Forward: pick or build an alkene and see the products
 * the lib gives for ozone, cold dilute KMnO₄ or hot acidic KMnO₄, with the equation. Reverse: the
 * carbonyl products are given; the learner picks two carbonyl carbons to join with a C=C, and the result
 * is checked against ozonolysisReverse.
 */
export function OzonolysisDetective(_props: SimulationProps) {
  const [mode, setMode] = useState<Mode>('forward')
  return (
    <div className={styles.sim} data-testid="ozonolysis-detective">
      <SimulationControls>
        <div className={styles.modeRow}>
          <Segmented label="Mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        </div>
      </SimulationControls>
      {mode === 'forward' ? <ForwardPanel /> : <ReversePanel />}
    </div>
  )
}

