'use client'

import { useEffect, useRef, useState } from 'react'
import { Button, NumberField, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { SkeletalFormula, drawingFrame, type SkeletalMark } from '@/components/organic'
import { iupacName, nameSteps } from '@/lib/chem/iupac-organic'
import { alkaneChain, chainNumbering, resolveTie, type ChainNumbering } from '@/lib/chem/alkane-naming'
import type { NameStep } from '@/lib/chem/iupac-organic'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  ALKANE_PRESETS,
  MAX_BACKBONE,
  MAX_BRANCHES,
  MAX_BRANCH_LENGTH,
  MIN_BACKBONE,
  designCarbons,
  designGraph,
  isSameName,
  isValidDesign,
  type AlkaneBranch,
  type AlkaneDesign,
} from '@/lib/chem/alkane-builder'
import styles from './alkane-namer.module.css'

type Mode = 'explore' | 'name' | 'draw'
type Verdict = 'idle' | 'right' | 'wrong' | 'revealed' | 'matched'

const MODE_OPTIONS: { value: Mode; label: string }[] = [
  { value: 'explore', label: 'Explore' },
  { value: 'name', label: 'Name this' },
  { value: 'draw', label: 'Draw this' },
]

/** Milliseconds per atom when the chain is numbered one locant at a time. */
const WALK_MS = 450
const EMPTY_DESIGN: AlkaneDesign = { backbone: 2, branches: [] }
const START_DESIGN: AlkaneDesign = ALKANE_PRESETS[8].design

/** The name, or null if the lib does not name this molecule (it throws outside its scope). */
function safeName(g: MolGraph): string | null {
  try {
    return iupacName(g)
  } catch {
    return null
  }
}

/** Scale that fits the drawing in the stage: bonds up to 70 units, and the molecule within the frame. */
function fitScale(g: MolGraph): number {
  const f = drawingFrame(g, 1)
  return Math.min(70, 500 / f.bounds.width, 290 / f.bounds.height)
}

/** The lib's steps for the molecule, or an empty list if the lib does not name it. */
function safeSteps(g: MolGraph): NameStep[] {
  try {
    return nameSteps(g)
  } catch {
    return []
  }
}

/** The side chains as the lib prints them in the name (alphabetical): name and locant. */
function libSubstituents(steps: readonly NameStep[]): { text: string; locant: number }[] {
  const name = steps.length > 0 ? steps[steps.length - 1].text : ''
  return steps
    .filter((s) => s.kind === 'substituent' && s.locant !== undefined)
    .map((s) => ({ text: s.text, locant: s.locant as number }))
    .sort((a, b) => name.indexOf(a.text) - name.indexOf(b.text))
}

/** Text for the numbering, from the lib's chain choice. */
function numberingText(numbering: ChainNumbering): string {
  if (numbering.tie) return 'both ends give the same locants, so the alphabetical rule decides'
  return `locants ${numbering.locants.join(', ')}`
}

/**
 * The alkane namer. Explore: build a branched alkane from a backbone and side chains, or pick a
 * preset, and the lib names it live with its steps. Name this: type the name of a drawn molecule.
 * Draw this: build the molecule named on the card. Every name, count and locant is from the lib.
 */
export function AlkaneNamer({ reducedMotion }: SimulationProps) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useIsActive(ref)

  const [mode, setMode] = useState<Mode>('explore')
  const [design, setDesign] = useState<AlkaneDesign>(START_DESIGN)
  const [quiz, setQuiz] = useState(0)
  const [typed, setTyped] = useState('')
  const [tries, setTries] = useState(0)
  const [verdict, setVerdict] = useState<Verdict>('idle')
  /** Chain carbons numbered so far while the numbering walk runs; null when all are shown. */
  const [walkCount, setWalkCount] = useState<number | null>(null)

  const target = ALKANE_PRESETS[quiz].design
  const shownDesign = mode === 'name' ? target : design
  const graph = designGraph(shownDesign)
  const name = safeName(graph)
  const carbons = designCarbons(shownDesign)
  const chain = alkaneChain(graph)
  const libSteps = safeSteps(graph)
  const numbering = resolveTie(graph, chainNumbering(graph, chain), libSubstituents(libSteps))
  const total = chain.atoms.length
  const shownLocants = mode === 'explore' ? (walkCount === null ? total : Math.min(walkCount, total)) : 0
  const targetName = safeName(designGraph(target)) ?? ''

  // The numbering walk: one locant every WALK_MS, run only while the simulation is on screen.
  useEffect(() => {
    if (walkCount === null || walkCount >= total || reducedMotion || !active) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      if (now - start >= WALK_MS) setWalkCount(walkCount + 1)
      else raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [walkCount, reducedMotion, active, total])

  const setBackbone = (backbone: number) => {
    setDesign((d) => ({
      backbone,
      branches: d.branches
        .filter((b) => b.position <= backbone)
        .map((b) => ({ ...b, position: Math.min(b.position, backbone) })),
    }))
  }

  const [newPosition, setNewPosition] = useState(2)
  const [newLength, setNewLength] = useState(1)
  const addBranch = () => {
    const next = { backbone: design.backbone, branches: [...design.branches, { position: newPosition, length: newLength }] }
    if (isValidDesign(next)) setDesign(next)
  }
  const removeBranch = (index: number) => {
    setDesign((d) => ({ ...d, branches: d.branches.filter((_, i) => i !== index) }))
  }

  const pickPreset = (index: number) => {
    setDesign(ALKANE_PRESETS[index].design)
    setWalkCount(null)
  }

  const startWalk = () => {
    setWalkCount(reducedMotion ? null : 0)
  }

  const nextQuestion = () => {
    setQuiz((q) => (q + 1) % ALKANE_PRESETS.length)
    setTyped('')
    setTries(0)
    setVerdict('idle')
    setDesign(EMPTY_DESIGN)
  }

  const checkTyped = () => {
    if (!name) return
    if (isSameName(typed, targetName)) {
      setVerdict('right')
      return
    }
    const next = tries + 1
    setTries(next)
    setVerdict(next >= 2 ? 'revealed' : 'wrong')
  }

  const checkDrawing = () => {
    if (name && isSameName(name, targetName)) setVerdict('matched')
    else setVerdict('wrong')
  }

  // The drawing: the chain is highlighted in Explore, and numbered from the lib's end.
  const scale = fitScale(graph)
  const centre = { x: 280, y: 170 }
  const showChain = mode === 'explore'
  const showNumbers = mode === 'explore' && !numbering.tie
  const locants: SkeletalMark[] = showNumbers
    ? numbering.order.slice(0, shownLocants).map((atom, k) => ({ atom, label: String(k + 1) }))
    : []

  const summary = name
    ? `${carbons} carbons, ${molecularFormula(graph)}. Parent chain of ${total} carbons, ${numberingText(numbering)}.`
    : 'This molecule is outside the scope of the lib.'

  const showFeedback = mode === 'name' && verdict !== 'idle'

  return (
    <div className={styles.namer} ref={ref} data-testid="alkane-namer">
      <div className={styles.modeRow}>
        <Segmented label="Mode" options={MODE_OPTIONS} value={mode} onChange={(m) => {
          setMode(m)
          setWalkCount(null)
          setVerdict('idle')
          setTyped('')
          setTries(0)
          if (m === 'draw') setDesign(EMPTY_DESIGN)
        }} />
      </div>

      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg
            viewBox="0 0 560 340"
            role="img"
            aria-label={mode === 'name' ? 'A molecule to name. Type its name below.' : `Structure: ${name ?? 'outside the lib'}`}
            className={styles.drawing}
            data-testid="alkane-drawing"
          >
            <SkeletalFormula
              graph={graph}
              scale={scale}
              x={centre.x}
              y={centre.y}
              highlightAtoms={showChain ? chain.atoms : []}
              highlightBonds={showChain ? chainBondIndices(graph, chain.atoms) : []}
              locants={locants}
            />
          </svg>
          <figcaption className={styles.caption}>
            {mode === 'name' ? 'Name the molecule shown.' : mode === 'draw' ? `Build the molecule named: ${targetName}` : `${carbons} carbons`}
          </figcaption>
        </figure>

        <div className={styles.panel}>
          {mode === 'explore' && (
            <>
              <p className={styles.name} data-testid="alkane-name">
                {name ?? 'Not named by the lib'}
              </p>
              <p className={styles.summary} data-testid="alkane-summary">{summary}</p>
              <ol className={styles.steps} data-testid="alkane-steps">
                <li>Parent chain: {total} carbons (the highlighted path)</li>
                <li>Numbering: {numberingText(numbering)}</li>
                {libSubstituents(libSteps).map((line) => (
                  <li key={`${line.text}-${line.locant}`}>Side chain {line.text} at {line.locant}</li>
                ))}
                <li>Assembled: {name}</li>
              </ol>
              <Button variant="secondary" onClick={startWalk} disabled={numbering.tie}>
                Number the chain
              </Button>
            </>
          )}

          {mode === 'name' && (
            <div className={styles.quiz} data-testid="name-quiz">
              <p className={styles.quizHead}>Question {quiz + 1} of {ALKANE_PRESETS.length}</p>
              <label className={styles.label} htmlFor="alkane-typed">Your name for this molecule</label>
              <input
                id="alkane-typed"
                className={styles.input}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') checkTyped()
                }}
                placeholder="for example, 2-methylbutane"
                autoComplete="off"
                spellCheck={false}
                data-testid="typed-name"
              />
              <div className={styles.row}>
                <Button onClick={checkTyped} disabled={typed.trim() === '' || verdict === 'right' || verdict === 'revealed'}>
                  Check
                </Button>
                <Button variant="secondary" onClick={nextQuestion}>Next molecule</Button>
              </div>
              {showFeedback && <Feedback verdict={verdict} name={targetName} />}
            </div>
          )}

          {mode === 'draw' && (
            <div className={styles.quiz} data-testid="draw-quiz">
              <p className={styles.quizHead}>Target: {targetName}</p>
              <p className={styles.summary}>
                Build it with the controls below. The lib names your drawing as you go: {name ?? 'not named'}.
              </p>
              <div className={styles.row}>
                <Button onClick={checkDrawing}>Check my drawing</Button>
                <Button variant="secondary" onClick={nextQuestion}>Next target</Button>
              </div>
              {verdict !== 'idle' && <Feedback verdict={verdict} name={targetName} />}
            </div>
          )}

          <p className={styles.srOnly} aria-live="polite" data-testid="alkane-live">{summary}</p>
        </div>
      </div>

      {mode !== 'name' && (
        <SimulationControls>
          <div className={styles.controls}>
            {mode === 'explore' && (
              <div className={styles.presets} role="group" aria-label="Presets">
                {ALKANE_PRESETS.map((p, i) => (
                  <Button key={p.id} variant="secondary" onClick={() => pickPreset(i)} className={styles.preset}>
                    {safeName(designGraph(p.design)) ?? p.id}
                  </Button>
                ))}
              </div>
            )}
            <Slider
              label="Backbone carbons"
              value={design.backbone}
              min={MIN_BACKBONE}
              max={MAX_BACKBONE}
              step={1}
              onChange={setBackbone}
            />
            <div className={styles.fieldRow}>
              <NumberField
                label="Side chain on carbon"
                value={newPosition}
                min={1}
                max={design.backbone}
                step={1}
                onChange={(v) => setNewPosition(Math.round(v))}
              />
              <NumberField
                label="Carbons in the side chain"
                value={newLength}
                min={1}
                max={MAX_BRANCH_LENGTH}
                step={1}
                onChange={(v) => setNewLength(Math.round(v))}
              />
              <Button onClick={addBranch} disabled={design.branches.length >= MAX_BRANCHES}>
                Add side chain
              </Button>
            </div>
            {design.branches.length > 0 && (
              <ul className={styles.branches} aria-label="Side chains">
                {design.branches.map((b, i) => (
                  <BranchRow key={`${b.position}-${b.length}-${i}`} branch={b} onRemove={() => removeBranch(i)} />
                ))}
              </ul>
            )}
            <p className={styles.note}>{carbons} carbons in total. Backbone {design.backbone}, {design.branches.length} side chain{design.branches.length === 1 ? '' : 's'}.</p>
          </div>
        </SimulationControls>
      )}
    </div>
  )
}

function BranchRow({ branch, onRemove }: { branch: AlkaneBranch; onRemove: () => void }) {
  return (
    <li className={styles.branchRow}>
      <span>{branch.length} carbon{branch.length === 1 ? '' : 's'} on carbon {branch.position}</span>
      <Button variant="secondary" onClick={onRemove} aria-label={`Remove the side chain on carbon ${branch.position}`}>
        Remove
      </Button>
    </li>
  )
}

function Feedback({ verdict, name }: { verdict: Verdict; name: string }) {
  if (verdict === 'right' || verdict === 'matched') {
    return <p className={styles.good} role="status">Correct: {name}.</p>
  }
  if (verdict === 'revealed') {
    return <p className={styles.note} role="status">The name is {name}. Check the longest chain and the locants next time.</p>
  }
  if (verdict === 'wrong') {
    return <p className={styles.note} role="status">Not quite. Look again at the longest chain and the lowest locants.</p>
  }
  return null
}

/** Bond indices of the chain: the bonds that join consecutive chain atoms. */
function chainBondIndices(g: MolGraph, atoms: readonly number[]): number[] {
  const out: number[] = []
  for (let k = 0; k + 1 < atoms.length; k++) {
    const i = g.bonds.findIndex(
      (b) => (b.a === atoms[k] && b.b === atoms[k + 1]) || (b.b === atoms[k] && b.a === atoms[k + 1])
    )
    if (i >= 0) out.push(i)
  }
  return out
}
