'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SkeletalFormula, skeletalBounds } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  CHAIN_GROUPS,
  QUIZ_SMILES,
  RING_GROUPS,
  chainExplanation,
  chainPrincipal,
  chainSmiles,
  emptyChain,
  findGroups,
  groupAllowed,
  linkAllowed,
  nameOf,
  quizItem,
  ringParentHint,
  ringSmiles,
  typeset,
  withGroup,
  withLength,
  withLink,
  type ChainGroupId,
  type ChainState,
  type LinkOrder,
  type PrincipalKind,
  type RingGroupId,
} from '@/lib/chem/functional-namer'
import styles from './functional-group-namer.module.css'

/** Pixels per bond in the drawings. At the stage width this keeps the labels at about 15 px. */
const SCALE = 56
const PAD = 26
const MIN_W = 420
const MIN_H = 230

type Mode = 'chain' | 'ring' | 'quiz'

const CHAIN_OPTIONS: (ChainGroupId | null)[] = [null, 'OH', 'NH2', 'Cl', 'NO2', 'OCH3', 'oxo', 'CHO', 'COOH']
const RING_OPTIONS: (RingGroupId | null)[] = [null, 'Cl', 'Br', 'CH3', 'OH', 'NH2', 'NO2', 'OCH3']

const BOND_SYMBOL: Record<LinkOrder, string> = { 1: '–', 2: '=', 3: '≡' }
const BOND_WORD: Record<LinkOrder, string> = { 1: 'single', 2: 'double', 3: 'triple' }

/** The starting chain: five carbons, an OH on C1 and a ketone on C3. */
const START_CHAIN: ChainState = withGroup(withGroup(emptyChain(5), 0, 'OH'), 2, 'oxo')
/** The starting ring: a chlorine and an OH, para to each other. */
const START_RING: (RingGroupId | null)[] = ['OH', null, null, 'Cl', null, null]

/** The label of a group as the buttons and tiles show it. */
const chainLabel = (id: ChainGroupId | null) => (id ? CHAIN_GROUPS[id].label : 'None')
const ringLabel = (id: RingGroupId | null) => (id ? RING_GROUPS[id].label : 'None')

/** The next bond order that the lib allows, or the same order when none is allowed. */
function cycledLink(state: ChainState, i: number): ChainState {
  const current = state.links[i]
  const order: LinkOrder[] = [1, 2, 3]
  const start = order.indexOf(current)
  for (let step = 1; step <= 3; step++) {
    const next = order[(start + step) % 3]
    if (linkAllowed(state, i, next)) return withLink(state, i, next)
  }
  return state
}

/** The positions of two ring substituents, as ortho, meta or para. */
function relation(a: number, b: number): string {
  const d = Math.min(Math.abs(a - b), 6 - Math.abs(a - b))
  if (d === 1) return 'ortho'
  if (d === 2) return 'meta'
  return 'para'
}

/** A skeletal drawing in a fixed-width stage, with its bounds shown in full. */
function Stage({ smiles, highlightAtoms = [], highlightBonds = [], innerCircles = false, label }: {
  smiles: string
  highlightAtoms?: number[]
  highlightBonds?: number[]
  innerCircles?: boolean
  label: string
}) {
  const graph = useMemo(() => parseSmiles(smiles), [smiles])
  const bounds = useMemo(() => skeletalBounds(graph, SCALE), [graph])
  const w = Math.max(MIN_W, bounds.width + 2 * PAD)
  const h = Math.max(MIN_H, bounds.height + 2 * PAD)
  return (
    <svg viewBox={`${-w / 2} ${-h / 2} ${w} ${h}`} role="img" aria-label={label} className={styles.drawing}>
      <SkeletalFormula
        graph={graph}
        scale={SCALE}
        highlightAtoms={highlightAtoms}
        highlightBonds={highlightBonds}
        innerCircles={innerCircles}
      />
    </svg>
  )
}

/** Chain mode: a chain of carbons, groups and bonds chosen on it, and the lib's name for the result. */
function ChainMode({ chain, setChain, sel, setSel }: {
  chain: ChainState
  setChain: (s: ChainState) => void
  sel: number
  setSel: (k: number) => void
}) {
  const n = chain.groups.length
  const smiles = chainSmiles(chain)
  const outcome = nameOf(smiles)
  const lines = chainExplanation(chain)
  const principal = chainPrincipal(chain)
  const highlight = useMemo(() => principalHighlight(smiles, principal), [smiles, principal])

  return (
    <>
      <SimulationControls>
        <Slider label="Carbons in the chain" value={n} min={2} max={8} step={1} onChange={(v) => setChain(withLength(chain, v))} />
        <div role="group" aria-label="Carbon to edit" className={styles.row}>
          {chain.groups.map((g, k) => (
            <Button
              key={k}
              variant={k === sel ? 'primary' : 'secondary'}
              aria-pressed={k === sel}
              onClick={() => setSel(k)}
            >
              {`C${k + 1}`}
              {g ? ` ${chainLabel(g)}` : ''}
            </Button>
          ))}
        </div>
        <div role="group" aria-label={`Group on C${sel + 1}`} className={styles.row}>
          {CHAIN_OPTIONS.map((opt) => {
            const current = chain.groups[sel] === opt
            const allowed = groupAllowed(chain, sel, opt)
            return (
              <Button
                key={opt ?? 'none'}
                variant={current ? 'primary' : 'secondary'}
                aria-pressed={current}
                disabled={!allowed && !current}
                onClick={() => setChain(withGroup(chain, sel, opt))}
              >
                {chainLabel(opt)}
              </Button>
            )
          })}
        </div>
        <div role="group" aria-label="Bonds between carbons" className={styles.row}>
          {chain.links.map((order, i) => (
            <Button
              key={i}
              variant="secondary"
              aria-label={`Bond between C${i + 1} and C${i + 2}: ${BOND_WORD[order]}. Activate to change it.`}
              onClick={() => setChain(cycledLink(chain, i))}
            >
              {`C${i + 1}${BOND_SYMBOL[order]}C${i + 2}`}
            </Button>
          ))}
        </div>
      </SimulationControls>

      <div className={styles.stage}>
        <Stage
          smiles={smiles}
          label={outcome.ok ? `Drawing of ${outcome.name}` : 'Drawing of the chain'}
          highlightAtoms={highlight.atoms}
          highlightBonds={highlight.bonds}
        />
      </div>

      <div className={styles.readout} aria-live="polite" data-testid="namer-readout">
        {outcome.ok ? (
          <>
            <p className={styles.name} data-testid="namer-name">{outcome.name}</p>
            <ul className={styles.reasons}>
              {lines.map((line) => (
                <li key={line}>{typeset(line)}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.notice}>
            The naming lib does not name this shape yet: {outcome.reason}
          </p>
        )}
      </div>
    </>
  )
}

/** The atoms and bonds of the principal group, found by the lib's pattern match on the drawn molecule. */
function principalHighlight(smiles: string, principal: PrincipalKind | null): { atoms: number[]; bonds: number[] } {
  if (!principal) return { atoms: [], bonds: [] }
  const matches = findGroups(parseSmiles(smiles), principal)
  return { atoms: matches.flatMap((m) => m.atoms), bonds: matches.flatMap((m) => m.bonds) }
}

/** Benzene mode: a ring with up to three substituents, named once there are two or more. */
function RingMode({ ring, setRing, sel, setSel }: {
  ring: (RingGroupId | null)[]
  setRing: (r: (RingGroupId | null)[]) => void
  sel: number
  setSel: (k: number) => void
}) {
  const count = ring.filter((x) => x !== null).length
  const smiles = ringSmiles(ring)
  const outcome = nameOf(smiles)
  const positions = ring.map((x, i) => (x ? i + 1 : 0)).filter((p) => p > 0)
  const lines: string[] = []
  if (count >= 2) lines.push(ringParentHint(ring))
  if (count === 2) lines.push(`The two substituents sit at positions ${positions[0]} and ${positions[1]}, so they are ${relation(positions[0], positions[1])} to each other.`)

  return (
    <>
      <SimulationControls>
        <div role="group" aria-label="Ring position to edit" className={styles.row}>
          {ring.map((g, k) => (
            <Button key={k} variant={k === sel ? 'primary' : 'secondary'} aria-pressed={k === sel} onClick={() => setSel(k)}>
              {`${k + 1}${g ? ` ${ringLabel(g)}` : ''}`}
            </Button>
          ))}
        </div>
        <div role="group" aria-label={`Substituent on position ${sel + 1}`} className={styles.row}>
          {RING_OPTIONS.map((opt) => {
            const current = ring[sel] === opt
            const next = ring.map((x, i) => (i === sel ? opt : x))
            const allowed = next.filter((x) => x !== null).length <= 3
            return (
              <Button
                key={opt ?? 'none'}
                variant={current ? 'primary' : 'secondary'}
                aria-pressed={current}
                disabled={!allowed && !current}
                onClick={() => setRing(next)}
              >
                {ringLabel(opt)}
              </Button>
            )
          })}
        </div>
      </SimulationControls>

      <div className={styles.stage}>
        <Stage smiles={smiles} label={outcome.ok ? `Drawing of ${outcome.name}` : 'Drawing of the ring'} />
      </div>

      <div className={styles.readout} aria-live="polite" data-testid="namer-readout">
        {count === 0 ? (
          <p className={styles.notice}>Benzene, with no substituent yet.</p>
        ) : outcome.ok ? (
          <>
            <p className={styles.name} data-testid="namer-name">{outcome.name}</p>
            <ul className={styles.reasons}>
              {lines.map((line) => (
                <li key={line}>{typeset(line)}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.notice}>The naming lib does not name this ring yet: {outcome.reason}</p>
        )}
      </div>
    </>
  )
}

/** Quiz mode: a structure from the quiz list, four names to choose from, and the lib's answer. */
function QuizMode({ index, setIndex }: { index: number; setIndex: (i: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const item = quizItem(index)
  const correct = picked !== null && picked === item.answer

  const next = () => {
    setIndex((index + 1) % QUIZ_SMILES.length)
    setPicked(null)
    setChecked(false)
  }

  return (
    <>
      <SimulationControls>
        <Button variant="secondary" onClick={next}>
          Next molecule
        </Button>
      </SimulationControls>

      <div className={styles.stage}>
        <Stage smiles={item.smiles} label="The quiz molecule" />
      </div>

      <div className={styles.quiz}>
        <div role="group" aria-label="Choose the name" className={styles.options}>
          {item.options.map((name, i) => (
            <Button
              key={name}
              variant={picked === i ? 'primary' : 'secondary'}
              aria-pressed={picked === i}
              disabled={checked}
              onClick={() => setPicked(i)}
            >
              {name}
            </Button>
          ))}
        </div>
        <Button variant="primary" disabled={picked === null || checked} onClick={() => setChecked(true)}>
          Check my answer
        </Button>
      </div>

      <div className={styles.readout} aria-live="polite" data-testid="namer-readout">
        {checked ? (
          correct ? (
            <p className={styles.name} data-testid="namer-name">Correct: {item.name}</p>
          ) : (
            <p className={styles.notice}>Not quite. This molecule is {item.name}.</p>
          )
        ) : (
          <p className={styles.notice}>Pick a name, then check it against the lib.</p>
        )}
      </div>
    </>
  )
}

/**
 * Functional-group namer (Sections 8.5.3 and 8.5.4). Chain mode: attach groups and bonds to a
 * chain of carbons; the lib names the result and the reasoning follows NCERT's order of priority.
 * Benzene mode: place up to three substituents on a ring; the lib names it and gives the locants.
 * Quiz mode: match a structure to its name from four choices. Every name comes from the lib.
 */
export function FunctionalGroupNamer(_props: SimulationProps) {
  const [mode, setMode] = useState<Mode>('chain')
  const [chain, setChain] = useState<ChainState>(START_CHAIN)
  const [chainSel, setChainSel] = useState(0)
  const [ring, setRing] = useState<(RingGroupId | null)[]>(START_RING)
  const [ringSel, setRingSel] = useState(0)
  const [quiz, setQuiz] = useState(0)
  const chainK = Math.min(chainSel, chain.groups.length - 1)

  return (
    <div className={styles.sim} data-testid="functional-group-namer">
      <div className={styles.modes}>
        <Segmented<Mode>
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'chain', label: 'Chain' },
            { value: 'ring', label: 'Benzene' },
            { value: 'quiz', label: 'Quiz' },
          ]}
        />
      </div>

      {mode === 'chain' ? (
        <ChainMode chain={chain} setChain={setChain} sel={chainK} setSel={setChainSel} />
      ) : null}
      {mode === 'ring' ? <RingMode ring={ring} setRing={setRing} sel={ringSel} setSel={setRingSel} /> : null}
      {mode === 'quiz' ? <QuizMode index={quiz} setIndex={setQuiz} /> : null}
    </div>
  )
}
