'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { Tex } from '@/components/animations/unit6/qk/Tex'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
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

/** The drawing is a viewBox of this width; every layout below is in these units. */
const VIEW_WIDTH = 560

/** Splits a phrase into lines of at most `max` characters, at spaces, for the arrow labels. */
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

/** The atoms of the C=C bonds of an alkene (washed in the highlight colour). */
function doubleBondAtoms(g: MolGraph): number[] {
  return g.bonds.filter((b) => b.order === 2).flatMap((b) => [b.a, b.b])
}

/** Forward mode: an alkene, the reagent, and the products the lib gives. */
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
  const names = reaction ? reaction.products.map((p) => p.name) : []
  const readout = reaction
    ? `${alkeneName} with ${reagentLabel} gives ${names.join(' + ')}. ${reaction.why}`
    : `${alkeneName}: ${outcome.error}`

  const reactantScale = 50
  const productScale = 40
  const products = reaction?.products ?? []
  const count = products.length
  const condLines = reaction ? wrapWords(reaction.conditions, 24) : []

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
          <svg viewBox="0 0 560 330" role="img" aria-label={`${alkeneName} with ${reagentLabel}: ${names.join(' and ')}`} className={styles.scheme}>
            <text x={VIEW_WIDTH / 2} y={24} textAnchor="middle" fontSize={17} fill="var(--fg)">
              {alkeneName}
            </text>
            <SkeletalFormula graph={alkene} scale={reactantScale} x={VIEW_WIDTH / 2} y={92} highlightAtoms={doubleBondAtoms(alkene)} />
            <line x1={VIEW_WIDTH / 2} y1={132} x2={VIEW_WIDTH / 2} y2={172} stroke="var(--fg-muted)" strokeWidth={2.5} />
            <path d={`M ${VIEW_WIDTH / 2 - 7} 166 L ${VIEW_WIDTH / 2} 180 L ${VIEW_WIDTH / 2 + 7} 166 Z`} fill="var(--fg-muted)" />
            {condLines.map((line, i) => (
              <text key={line} x={VIEW_WIDTH / 2 + 14} y={146 + i * 17} fontSize={14} fill="var(--fg-muted)">
                {line}
              </text>
            ))}
            {products.map((p, i) => {
              const x = (VIEW_WIDTH * (i + 1)) / (count + 1)
              const y = 236
              const frame = p.graph.atoms.length ? drawingFrame(p.graph, productScale) : null
              return (
                <g key={`${p.name}-${i}`} data-testid="forward-product">
                  {frame ? (
                    <SkeletalFormula graph={p.graph} scale={productScale} x={x} y={y} />
                  ) : (
                    <text x={x} y={y} textAnchor="middle" fontSize={17} fill="var(--fg)">
                      {p.formula}
                    </text>
                  )}
                  <text x={x} y={y + 74} textAnchor="middle" fontSize={15} fill="var(--fg)">
                    {p.name}
                  </text>
                  {i < count - 1 && (
                    <text x={(x + (VIEW_WIDTH * (i + 2)) / (count + 1)) / 2} y={y + 5} textAnchor="middle" fontSize={24} fill="var(--fg-muted)">
                      +
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        ) : (
          <p className={styles.note}>{outcome.error}</p>
        )}
      </div>

      {reaction && (
        <div className={styles.equation} data-testid="forward-equation">
          <Tex tex={reaction.equation} display />
        </div>
      )}
      {bonds > 1 && reaction && (
        <p className={styles.note}>
          {`This alkene has ${bonds} C=C bonds, and ozone cuts each one. The ${count} products are listed under the drawing.`}
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
  const frames = useMemo(() => products.map((g) => drawingFrame(g, 52)), [products])
  const productNames = products.map((g) => nameOf(g))
  const count = products.length
  const centres = products.map((_, i) => ({ x: (VIEW_WIDTH * (i + 1)) / (count + 1), y: 118 }))

  const isPicked = (c: CarbonylCarbon) => picks.some((p) => p.part === c.part && p.atom === c.atom)
  const toggle = (c: CarbonylCarbon) => {
    if (isPicked(c)) setPicks(picks.filter((p) => !(p.part === c.part && p.atom === c.atom)))
    else if (picks.length < 2) setPicks([...picks, c])
  }

  const joined = picks.length === 2 ? checkReverse(products, picks[0], picks[1]) : null

  let readout: string
  if (picks.length === 0) readout = `Products: ${productNames.join(' and ')}. Pick two carbonyl carbons (C=O) to join by a C=C.`
  else if (picks.length === 1) readout = 'One carbonyl carbon is picked. Pick the second one.'
  else if (joined && joined.matches) readout = `Joined: ${joined.expectedName}. Ozonolysis of this alkene gives back ${productNames.join(' and ')}.`
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
        <svg viewBox="0 0 560 360" role="group" aria-label="Carbonyl products. Choose two carbonyl carbons." className={styles.scheme}>
          {products.map((g, i) => {
            const c = centres[i]
            const partAtoms = picks.filter((p) => p.part === i).map((p) => p.atom)
            return (
              <g key={`p-${i}`}>
                <SkeletalFormula graph={g} scale={52} x={c.x} y={c.y} highlightAtoms={partAtoms} />
                <text x={c.x} y={c.y + 104} textAnchor="middle" fontSize={16} fill="var(--fg)">
                  {productNames[i]}
                </text>
              </g>
            )
          })}
          {count > 1 && (
            <text x={VIEW_WIDTH / 2} y={122} textAnchor="middle" fontSize={26} fill="var(--fg-muted)">
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
                r={16}
                fill={on ? 'var(--highlight)' : 'transparent'}
                fillOpacity={on ? 0.45 : 0}
                stroke={on ? 'var(--fg)' : 'var(--fg-muted)'}
                strokeDasharray={on ? undefined : '3 3'}
                strokeWidth={1.5}
                role="button"
                tabIndex={0}
                aria-label={label}
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
              <line x1={VIEW_WIDTH / 2} y1={190} x2={VIEW_WIDTH / 2} y2={226} stroke="var(--fg-muted)" strokeWidth={2.5} />
              <path d={`M ${VIEW_WIDTH / 2 - 7} 220 L ${VIEW_WIDTH / 2} 234 L ${VIEW_WIDTH / 2 + 7} 220 Z`} fill="var(--fg-muted)" />
              <SkeletalFormula graph={joined.expected} scale={40} x={VIEW_WIDTH / 2} y={290} />
              <text x={VIEW_WIDTH / 2} y={352} textAnchor="middle" fontSize={17} fill="var(--fg)">
                {joined.expectedName}
              </text>
            </g>
          )}
        </svg>
      </div>

      {joined && (
        <p className={styles.note}>{`The alkene for these two carbonyl compounds is ${joined.expectedName}.`}</p>
      )}
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
        <Segmented label="Mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      </SimulationControls>
      {mode === 'forward' ? <ForwardPanel /> : <ReversePanel />}
    </div>
  )
}
