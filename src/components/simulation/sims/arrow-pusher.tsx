'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import {
  CurvedArrow,
  SkeletalFormula,
  bondAnchor,
  lonePairAngles,
  lonePairCount,
  lonePairPoint,
  skeletalBounds,
  skeletalFrame,
    type Point,
} from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  atomLabel,
  buildStep,
  bondLabel,
  displaySpecies,
  judgeArrow,
  partOf,
  stepOutcome,
  subgraph,
  type ArrowHead,
  type ArrowSource,
  type ArrowSpec,
  type PushStep,
} from '@/lib/chem/arrow-push'
import { intermediateStability, rankIntermediates, type IntermediateKind } from '@/lib/chem/electronic-effects'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { speciesLabel } from '@/lib/chem/species-labels'
import { ARROW_PUSHER_STEPS } from './arrow-pusher-steps'
import styles from './arrow-pusher.module.css'

/** Pixels per bond in the stage. */
const SCALE = 70
const VIEW = { width: 560, height: 300 }
const CENTRE = { x: VIEW.width / 2, y: VIEW.height / 2 }
const STEPS: PushStep[] = ARROW_PUSHER_STEPS.map(buildStep)
/** Elements whose lone pairs can start an arrow in this unit. */
const LONE_PAIR_ELEMENTS = ['N', 'O', 'Cl', 'Br', 'I']

/** Ranking sets, written in a scrambled order so the learner has to sort them. */
const RANK_SETS: Record<IntermediateKind, string[]> = {
  carbocation: ['C[C+](C)C', '[CH3+]', 'C[CH+]C', 'C[CH2+]'],
  radical: ['C[CH]C', '[CH3]', 'C[C](C)C', 'C[CH2]'],
  carbanion: ['[CH3-]', 'C[C-](C)C', 'C[CH2-]', 'C[CH-]C'],
}
const RANK_KINDS: { value: IntermediateKind; label: string }[] = [
  { value: 'carbocation', label: 'Carbocations' },
  { value: 'radical', label: 'Radicals' },
  { value: 'carbanion', label: 'Carbanions' },
]

/** A species as text for the learner: its labelled name, or its condensed formula. */
function speciesText(g: MolGraph): string {
  return displaySpecies(g)
}

/** Atom positions on the stage (pixels), from the same frame that SkeletalFormula draws. */
function stageAtoms(step: PushStep): Point[] {
  const atoms: Point[] = new Array(step.graph.atoms.length)
  step.parts.forEach((part, p) => {
    const sub = subgraph(step, p)
    const origin = { x: CENTRE.x + part.offset.x, y: CENTRE.y + part.offset.y }
    skeletalFrame(sub, SCALE).points.forEach((q, k) => {
      atoms[step.partStart[p] + k] = { x: origin.x + q.x, y: origin.y + q.y }
    })
  })
  return atoms
}

/**
 * Where an arrow starts on the stage: the middle of a bond, or the lone pair of an atom. The lone
 * pair is the one SkeletalFormula draws on the side facing the acceptor, so the arrow leaves the dots.
 */
function sourcePoint(step: PushStep, atoms: Point[], src: ArrowSource, target: number): Point {
  if (src.kind === 'bond') {
    const b = step.graph.bonds[src.bond]
    return bondAnchor(atoms[b.a], atoms[b.b])
  }
  const part = partOf(step, src.atom)
  const sub = subgraph(step, part)
  const k = src.atom - step.partStart[part]
  const frame = skeletalFrame(sub, SCALE)
  const atom = sub.atoms[k]
  const bondOrderSum = sub.bonds.reduce((t, b) => t + (b.a === k || b.b === k ? b.order : 0), 0)
  const count = lonePairCount(atom.element, atom.charge ?? 0, bondOrderSum, atom.hCount ?? 0, atom.radical ?? 0)
  const angles = lonePairAngles(frame.points, frame.adj, k, count)
  const p = atoms[src.atom]
  const toTarget = Math.atan2(atoms[target].y - p.y, atoms[target].x - p.x)
  const facing = angles.reduce((best, a) => (Math.cos(a - toTarget) > Math.cos(best - toTarget) ? a : best), angles[0] ?? toTarget)
  return lonePairPoint(p, facing, 0.64 * SCALE + 6)
}

/**
 * Where an arrow ends on the stage. From a bond, the head sits just outside the atom, on the far
 * side from the bond, so the curve reads as the pair moving onto that atom. From a lone pair, the
 * head stops short of the acceptor atom, on the side the electrons come from.
 */
function endPoint(step: PushStep, atoms: Point[], spec: ArrowSpec): Point {
  const to = atoms[spec.target]
  const from = sourcePoint(step, atoms, spec.source, spec.target)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const reach = spec.source.kind === 'bond' ? 44 : 16
  if (spec.source.kind === 'bond') {
    return { x: to.x + (dx / len) * reach, y: to.y + (dy / len) * reach }
  }
  return { x: to.x - (dx / len) * reach, y: to.y - (dy / len) * reach }
}

/** Labels for the start options: bonds, and atoms that can give a lone pair. */
function startOptions(step: PushStep): { source: ArrowSource; label: string }[] {
  const g = step.graph
  const bonds = g.bonds.map((_, i) => ({ source: { kind: 'bond' as const, bond: i }, label: `${bondLabel(g, i)} bond` }))
  const atoms = g.atoms
    .map((a, i) => ({ a, i }))
    .filter(({ a }) => LONE_PAIR_ELEMENTS.includes(a.element) || (a.charge ?? 0) < 0)
    .map(({ a, i }) => ({ source: { kind: 'atom' as const, atom: i }, label: `${a.element} lone pair (atom ${i + 1})` }))
  return step.kind === 'attack' ? atoms : bonds
}

/** The learner's arrows, drawn over the stage. */
function ArrowLayer({
  step,
  atoms,
  placed,
  draft,
  ghosts,
}: {
  step: PushStep
  atoms: Point[]
  placed: ArrowSpec[]
  draft: { source: ArrowSource | null; target: number | null; head: ArrowHead }
  ghosts: ArrowSpec[]
}) {
  const arrowFor = (spec: ArrowSpec, key: string, opacity: number) => (
    <g key={key} opacity={opacity} data-arrow={key}>
      <CurvedArrow
        from={sourcePoint(step, atoms, spec.source, spec.target)}
        to={endPoint(step, atoms, spec)}
        bend={spec.source.kind === 'bond' ? 0.55 : 0.35}
        kind={spec.head}
        gap={4}
        headSize={13}
        strokeWidth={2.6}
      />
    </g>
  )
  return (
    <g>
      {ghosts.map((g, i) => arrowFor(g, `ghost-${i}`, 0.35))}
      {placed.map((p, i) => arrowFor(p, `placed-${i}`, 1))}
      {draft.source && draft.target !== null && (
        <g opacity={0.6} data-arrow="draft">
          <CurvedArrow
            from={sourcePoint(step, atoms, draft.source, draft.target)}
            to={endPoint(step, atoms, { source: draft.source, target: draft.target, head: draft.head })}
            kind={draft.head}
            gap={4}
            headSize={13}
            strokeWidth={2.6}
            strokeDasharray="5 4"
          />
        </g>
      )}
    </g>
  )
}

/** Circles and bond lines that the learner clicks on the stage. */
function HitLayer({
  step,
  atoms,
  onAtom,
  onBond,
}: {
  step: PushStep
  atoms: Point[]
  onAtom: (i: number) => void
  onBond: (i: number) => void
}) {
  return (
    <g>
      {step.graph.bonds.map((b, i) => (
        <line
          key={`hb-${i}`}
          x1={atoms[b.a].x}
          y1={atoms[b.a].y}
          x2={atoms[b.b].x}
          y2={atoms[b.b].y}
          stroke="transparent"
          strokeWidth={26}
          strokeLinecap="round"
          style={{ cursor: 'pointer' }}
          onClick={() => onBond(i)}
          data-hit={`bond-${i}`}
          aria-hidden="true"
        />
      ))}
      {atoms.map((p, i) => (
        <circle
          key={`ha-${i}`}
          cx={p.x}
          cy={p.y}
          r={18}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={() => onAtom(i)}
          data-hit={`atom-${i}`}
          aria-hidden="true"
        />
      ))}
    </g>
  )
}

/** One elementary step: the species, the learner's arrows, and the readout. */
function ArrowStage({
  step,
  placed,
  draft,
  ghosts,
  onAtom,
  onBond,
}: {
  step: PushStep
  placed: ArrowSpec[]
  draft: { source: ArrowSource | null; target: number | null; head: ArrowHead }
  ghosts: ArrowSpec[]
  onAtom: (i: number) => void
  onBond: (i: number) => void
}) {
  const atoms = useMemo(() => stageAtoms(step), [step])
  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={`${step.title}. Draw the arrows: start on a bond or a lone pair, end on an atom.`}
      className={styles.stage}
      data-testid="arrow-stage"
    >
      {step.parts.map((part, p) => (
        <g key={p} transform={`translate(${CENTRE.x + part.offset.x}, ${CENTRE.y + part.offset.y})`}>
          <SkeletalFormula graph={subgraph(step, p)} scale={SCALE} showLonePairs />
        </g>
      ))}
      <ArrowLayer step={step} atoms={atoms} placed={placed} draft={draft} ghosts={ghosts} />
      <HitLayer step={step} atoms={atoms} onAtom={onAtom} onBond={onBond} />
    </svg>
  )
}

/** Plain words for why a species sits where it does: its alkyl groups and α-hydrogens. */
function reasonText(kind: IntermediateKind, alkylGroups: number, alphaH: number): string {
  const alkyl = `${alkylGroups} alkyl ${alkylGroups === 1 ? 'group' : 'groups'} (+I)`
  if (kind === 'carbanion') {
    return `${alkyl}, which push more charge onto the negative carbon`
  }
  const hydrogens = `${alphaH} α-hydrogen${alphaH === 1 ? '' : 's'} (hyperconjugation)`
  return `${alkyl} and ${hydrogens}`
}

/** The intermediate-stability ranking game: sort the species, most stable first, then check. */
function RankingGame() {
  const [kind, setKind] = useState<IntermediateKind>('carbocation')
  const [picks, setPicks] = useState<number[]>([])
  const [headline, setHeadline] = useState('Pick the four species in order, most stable first.')
  const [lines, setLines] = useState<string[]>([])
  const items = useMemo(
    () =>
      RANK_SETS[kind].map((s) => {
        const graph = parseSmiles(s)
        return { kind, graph, centre: centreOf(graph) }
      }),
    [kind],
  )

  const choose = (k: IntermediateKind) => {
    setKind(k)
    setPicks([])
    setLines([])
    setHeadline('Pick the four species in order, most stable first.')
  }

  const toggle = (i: number) => {
    setPicks((current) => {
      if (current.includes(i)) return current.filter((x) => x !== i)
      return [...current, i]
    })
  }

  const check = () => {
    if (picks.length < items.length) {
      setLines([])
      setHeadline(`Pick all ${items.length} species first. ${items.length - picks.length} to go.`)
      return
    }
    const correct = rankIntermediates(items)
    const same = correct.every((c, k) => c === picks[k])
    setHeadline(same ? 'Correct. Most stable first:' : 'Not quite. The order, most stable first:')
    setLines(
      correct.map((c) => {
        const st = intermediateStability(kind, items[c].graph, items[c].centre)
        return `${speciesText(items[c].graph)}: ${reasonText(kind, st.alkylGroups, st.alphaH)}.`
      }),
    )
  }

  return (
    <div className={styles.rank} data-testid="rank-game">
      <h4 className={styles.subhead}>Rank the intermediates</h4>
      <Segmented label="Kind of intermediate" options={RANK_KINDS} value={kind} onChange={choose} />
      <ul className={styles.rankGrid} aria-label={`${RANK_KINDS.find((k) => k.value === kind)?.label} to rank`}>
        {items.map((item, i) => {
          const order = picks.indexOf(i)
          const label = speciesText(item.graph)
          return (
            <li key={RANK_SETS[kind][i]}>
              <button
                type="button"
                className={styles.card}
                aria-pressed={order >= 0}
                aria-label={label}
                data-picked={order >= 0 ? 'true' : 'false'}
                onClick={() => toggle(i)}
              >
                <span className={styles.name}>
                  <span className={styles.cardLabel}>{label}</span>
                  {order >= 0 ? <span className={styles.badge}>{order + 1}</span> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className={styles.row}>
        <Button variant="primary" onClick={check} disabled={picks.length === 0}>
          Check the order
        </Button>
        <Button variant="secondary" onClick={() => setPicks([])} disabled={picks.length === 0}>
          Clear
        </Button>
      </div>
      <div className={styles.readout} aria-live="polite" data-testid="rank-readout">
        <p>{headline}</p>
        {lines.length > 0 && (
          <ol className={styles.rankLines}>
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

/** The lib's centre for an ion or radical: its charged or unpaired carbon. */
function centreOf(g: MolGraph): number {
  return g.atoms.findIndex((a) => a.element === 'C' && ((a.charge ?? 0) !== 0 || (a.radical ?? 0) > 0))
}

/**
 * Arrow-pusher: eight elementary steps (heterolysis, homolysis, nucleophilic attack). The learner
 * draws each arrow by choosing where it starts (a bond or a lone pair) and where it ends (an atom),
 * and its head (full for a pair, half for one electron). The lib judges each arrow and, once all
 * are drawn, works out what the step gives. A ranking game follows, using rankIntermediates.
 */
export function ArrowPusher(_props: SimulationProps) {
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<ArrowSpec[]>([])
  const [mode, setMode] = useState<'source' | 'target'>('source')
  const [source, setSource] = useState<ArrowSource | null>(null)
  const [target, setTarget] = useState<number | null>(null)
  const [head, setHead] = useState<ArrowHead>('pair')
  const [reveal, setReveal] = useState(false)
  const [feedback, setFeedback] = useState('Choose where the arrow starts, then where it ends.')

  const step = STEPS[index]
  const complete = placed.length === step.required.length
  const outcome = useMemo(() => (complete ? stepOutcome(step) : null), [complete, step])
  const starts = useMemo(() => startOptions(step), [step])

  const resetDraft = () => {
    setSource(null)
    setTarget(null)
    setMode('source')
  }

  const goTo = (next: number) => {
    setIndex(next)
    setPlaced([])
    setReveal(false)
    resetDraft()
    setHead(STEPS[next].kind === 'homolysis' ? 'radical' : 'pair')
    setFeedback(
      STEPS[next].kind === 'homolysis'
        ? 'Homolysis: draw two half heads, one from the bond to each atom.'
        : 'Choose where the arrow starts, then where it ends.',
    )
  }

  const pickSource = (s: ArrowSource, label: string) => {
    setSource(s)
    setMode('target')
    setFeedback(`Start: ${label}. Now choose the atom where the electrons go.`)
  }

  const onAtom = (i: number) => {
    if (mode === 'source') {
      const a = step.graph.atoms[i]
      if (step.kind === 'attack' && !LONE_PAIR_ELEMENTS.includes(a.element) && (a.charge ?? 0) >= 0) {
        setFeedback(`${atomLabel(step.graph, i)} has no lone pair to give here. Pick the nucleophile's atom.`)
        return
      }
      pickSource({ kind: 'atom', atom: i }, `${atomLabel(step.graph, i)} lone pair`)
      return
    }
    setTarget(i)
    setFeedback(`End: ${atomLabel(step.graph, i)}. Choose the head, then place the arrow.`)
  }

  const onBond = (i: number) => {
    if (mode === 'target') {
      setFeedback('The arrow ends on an atom. Click an atom, or pick one from the list.')
      return
    }
    pickSource({ kind: 'bond', bond: i }, `${bondLabel(step.graph, i)} bond`)
  }

  const place = () => {
    if (!source || target === null) return
    const attempt: ArrowSpec = { source, target, head }
    const verdict = judgeArrow(step, attempt, placed)
    if (!verdict.ok) {
      setFeedback(verdict.reason)
      return
    }
    const next = [...placed, attempt]
    setPlaced(next)
    resetDraft()
    if (next.length === step.required.length) {
      setFeedback('All the arrows are drawn. The result follows from the arrows.')
    } else {
      setFeedback(`Arrow ${next.length} placed. ${step.required.length - next.length} to go.`)
    }
  }

  const undo = () => {
    if (placed.length === 0) return
    setPlaced(placed.slice(0, -1))
    setReveal(false)
    setFeedback('The last arrow is removed.')
  }

  const showAnswer = () => {
    setReveal(true)
    setPlaced([])
    resetDraft()
    setFeedback(`The arrows for this step: ${step.required.length === 1 ? 'one' : 'two'}, shown faintly.`)
  }

  const draft = { source, target, head }
  const startLabel = source ? startOptions(step).find((o) => sameStart(o.source, source))?.label ?? '' : ''
  const headOptions = [
    { value: 'pair' as const, label: 'Full head: a pair' },
    { value: 'radical' as const, label: 'Half head: one electron' },
  ]

  return (
    <div className={styles.sim} data-testid="arrow-pusher">
      <SimulationControls>
        <Button variant="secondary" onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0}>
          Previous step
        </Button>
        <span className={styles.counter} aria-live="off">
          Step {index + 1} of {STEPS.length}
        </span>
        <Button variant="secondary" onClick={() => goTo(Math.min(STEPS.length - 1, index + 1))} disabled={index === STEPS.length - 1}>
          Next step
        </Button>
      </SimulationControls>

      <h4 className={styles.subhead}>{step.title}</h4>
      <ArrowStage
        step={step}
        placed={placed}
        draft={draft}
        ghosts={reveal ? step.required : []}
        onAtom={onAtom}
        onBond={onBond}
      />

      <div className={styles.controls}>
        <Segmented
          label="Next click on the drawing"
          options={[
            { value: 'source' as const, label: 'Choose the start' },
            { value: 'target' as const, label: 'Choose the end' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <Segmented label="Head of the arrow" options={headOptions} value={head} onChange={setHead} />
      </div>

      <div className={styles.pickers}>
        <fieldset className={styles.fieldset}>
          <legend>Start (bond or lone pair)</legend>
          <div className={styles.chips}>
            {starts.map((o) => (
              <Button
                key={startKey(o.source)}
                variant={source && sameStart(o.source, source) ? 'primary' : 'secondary'}
                aria-pressed={!!source && sameStart(o.source, source)}
                onClick={() => pickSource(o.source, o.label)}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend>End (atom)</legend>
          <div className={styles.chips}>
            {step.graph.atoms.map((_, i) => (
              <Button
                key={`end-${i}`}
                variant={target === i ? 'primary' : 'secondary'}
                aria-pressed={target === i}
                onClick={() => {
                  setTarget(i)
                  setFeedback(`End: ${atomLabel(step.graph, i)}. Choose the head, then place the arrow.`)
                }}
              >
                {`${atomLabel(step.graph, i)} (atom ${i + 1})`}
              </Button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.row}>
        <Button variant="primary" onClick={place} disabled={!source || target === null || complete}>
          Place arrow
        </Button>
        <Button variant="secondary" onClick={undo} disabled={placed.length === 0}>
          Undo last arrow
        </Button>
        <Button variant="secondary" onClick={showAnswer}>
          Show the arrows
        </Button>
        <Button variant="secondary" onClick={() => goTo(index)}>
          Start this step again
        </Button>
      </div>

      <p className={styles.readout} aria-live="polite" data-testid="arrow-readout">
        {source ? `Draft: ${startLabel}, ${target === null ? 'no end yet' : `to ${atomLabel(step.graph, target)}`}, ${head === 'pair' ? 'full head' : 'half head'}. ` : ''}
        {feedback}
      </p>

      {outcome && (
        <div className={styles.outcome} data-testid="arrow-outcome">
          <p className={styles.outcomeLead}>What the arrows give</p>
          <ul>
            {outcome.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {outcome.product && (
            <svg
              viewBox={productViewBox(outcome.product)}
              role="img"
              aria-label="Product of the attack"
              className={styles.productDrawing}
            >
              <SkeletalFormula graph={outcome.product} scale={40} showLonePairs />
            </svg>
          )}
        </div>
      )}

      <RankingGame />
    </div>
  )
}

function startKey(s: ArrowSource): string {
  return s.kind === 'bond' ? `b${s.bond}` : `a${s.atom}`
}

function sameStart(x: ArrowSource, y: ArrowSource): boolean {
  return startKey(x) === startKey(y)
}

function productViewBox(g: MolGraph): string {
  const b = skeletalBounds(g, 40)
  return `${b.x} ${b.y} ${b.width} ${b.height}`
}
