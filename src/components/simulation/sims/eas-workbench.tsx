'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { ReactionScheme, SkeletalFormula, reactionSchemeSize, type SchemePath } from '@/components/organic'
import { huckel } from '@/lib/chem/aromaticity'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  isMechanismOrder,
  MECHANISM_STAGES,
  protonatedBase,
  reactionText,
  subscriptFormulas,
  STAGE_LABEL,
  workbenchReactions,
  type MechanismStage,
  type WorkbenchId,
  type WorkbenchReaction,
} from '@/lib/chem/eas-workbench'
import { useIsActive } from '../useIsActive'
import styles from './eas-workbench.module.css'

/** The stage is about 1,000 px wide on a desktop, so its drawing box is that wide: text stays near 1 to 1.2 times its size. */
const VIEW_W = 960
const VIEW_H = 400
/** The order the cards start in: a scramble of the mechanism, so the learner has to put it right. */
const SCRAMBLED: MechanismStage[] = ['attack', 'restore', 'generate', 'deprotonate']
/** Stage 0 is the reactants; stages 1 to 4 follow the four mechanism stages in order. */
const LAST_STAGE = 4
const STAGE_MS = 1400
/** Benzene, the reactant of every reaction in the workbench. */
const BENZENE = parseSmiles('C1=CC=CC=C1')
const WORKBENCH_IDS: WorkbenchId[] = ['nitration', 'chlorination', 'sulphonation', 'alkylation', 'acylation', 'bhc', 'hydrogenation']

const BUTTON_LABEL: Record<WorkbenchId, string> = {
  nitration: 'Nitration',
  chlorination: 'Halogenation',
  sulphonation: 'Sulphonation',
  alkylation: 'Friedel–Crafts alkylation',
  acylation: 'Friedel–Crafts acylation',
  bhc: 'Cl₂ in UV light',
  hydrogenation: 'Hydrogenation',
}

/** Top of a scheme that is centred in the space under the title. */
function schemeY(height: number): number {
  return 56 + (VIEW_H - 56 - height) / 2
}

/** The benzene and reagents of a reaction, as one group of a scheme. */
function reactantGroup(r: WorkbenchReaction, benzene: MolGraph): SchemePath[number] {
  return [{ formula: benzene }, ...r.reagents.map((f) => ({ formula: f }))]
}

/** The reaction as a scheme from the reactants to the product, with the by-products after a plus. */
function fullScheme(r: WorkbenchReaction, benzene: MolGraph): SchemePath {
  return [reactantGroup(r, benzene), {}, [{ formula: r.product.graph, tag: r.product.name }, ...r.byproducts.map((f) => ({ formula: f }))]]
}

/** Stage 3: the σ-complex and the base give the restored product and the protonated base. */
function baseScheme(r: WorkbenchReaction): SchemePath {
  return [
    [{ formula: r.sigma! }, { formula: r.base! }],
    {},
    [{ formula: r.product.graph, tag: r.product.name }, { formula: protonatedBase(r.base!) }],
  ]
}

/** The drawing for one stage of a reaction, as an SVG. */
function StageDrawing({ r, stage }: { r: WorkbenchReaction; stage: number }) {
  const benzene = BENZENE
  const title = stageTitle(r, stage)
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={title} className={styles.drawing} data-stage={stage}>
      <text x={VIEW_W / 2} y={28} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {title}
      </text>
      {stage === 0 && <ReactionScheme sequence={[reactantGroup(r, benzene)]} maxWidth={VIEW_W - 40} x={20} y={schemeY(reactionSchemeSize([reactantGroup(r, benzene)], VIEW_W - 40).height)} />}
      {stage === 1 && r.electrophile && (
        <g>
          <text x={VIEW_W / 2} y={170} textAnchor="middle" dominantBaseline="central" fontSize={56} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
            {r.electrophile.formula}
          </text>
          <text x={VIEW_W / 2} y={232} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg)">
            {r.electrophile.name}
          </text>
          <text x={VIEW_W / 2} y={282} textAnchor="middle" dominantBaseline="central" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {r.electrophile.generation}
          </text>
        </g>
      )}
      {stage === 2 && r.sigma && (
        <g>
          <g transform={`translate(${VIEW_W / 2}, ${(56 + VIEW_H - 30) / 2})`}>
            <SkeletalFormula graph={r.sigma} scale={46} />
          </g>
          <text x={VIEW_W / 2} y={VIEW_H - 22} textAnchor="middle" dominantBaseline="central" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {`σ-complex ${r.sigmaFormula}: the sp³ carbon bears H and the electrophile`}
          </text>
        </g>
      )}
      {stage === 3 && r.sigma && r.base && (
        <ReactionScheme sequence={baseScheme(r)} maxWidth={VIEW_W - 40} x={20} y={schemeY(reactionSchemeSize(baseScheme(r), VIEW_W - 40).height)} />
      )}
      {stage === 4 &&
        (r.kind === 'substitution' ? (
          <g>
            <g transform={`translate(${VIEW_W / 2}, ${(56 + VIEW_H - 50) / 2})`}>
              <SkeletalFormula graph={r.product.graph} scale={46} />
            </g>
            <text x={VIEW_W / 2} y={VIEW_H - 40} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {`${r.product.name} (${r.product.formula}): ${aromaticText(r)}`}
            </text>
          </g>
        ) : (
          <ReactionScheme sequence={fullScheme(r, benzene)} maxWidth={VIEW_W - 40} x={20} y={schemeY(reactionSchemeSize(fullScheme(r, benzene), VIEW_W - 40).height)} />
        ))}
    </svg>
  )
}

/** Stage titles: the mechanism's names, with the reaction's own species where it has them. */
function stageTitle(r: WorkbenchReaction, stage: number): string {
  if (stage === 0) return 'Reactants'
  if (stage === 1) return STAGE_LABEL.generate
  if (stage === 2) return STAGE_LABEL.attack
  if (stage === 3) return STAGE_LABEL.deprotonate
  return r.kind === 'substitution' ? STAGE_LABEL.restore : `Product: ${r.product.name}`
}

/** The lib's Hückel verdict for the product ring, in words (only for substitutions, where the ring is restored). */
function aromaticText(r: WorkbenchReaction): string {
  const v = huckel(r.product.graph)
  return v.verdict === 'aromatic' ? `aromatic, ${v.piElectrons} π electrons (4n + 2 with n = ${v.n})` : v.verdict
}

/**
 * The electrophilic substitution workbench (Section 9.5.5). Pick one of the seven reactions; for a
 * substitution, put the four mechanism stages in order. Once the order is right, the stages play in
 * turn. Every name, formula, equation, σ-complex, base and verdict comes from the lib.
 */
export function EasWorkbench({ reducedMotion }: SimulationProps) {
  const reactions = useMemo(() => workbenchReactions(), [])
  const [selected, setSelected] = useState<WorkbenchId>('nitration')
  const [order, setOrder] = useState<MechanismStage[]>(SCRAMBLED)
  const [verdict, setVerdict] = useState<'none' | 'right' | 'wrong'>('none')
  const [stage, setStage] = useState(0)
  const [playing, setPlaying] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const onScreen = useIsActive(rootRef)

  const r = reactions.find((x) => x.id === selected)!
  const isSubstitution = r.kind === 'substitution'
  const unlocked = isSubstitution && verdict === 'right'

  const choose = (id: WorkbenchId) => {
    setSelected(id)
    setOrder(SCRAMBLED)
    setVerdict('none')
    setStage(0)
    setPlaying(false)
  }

  const move = (index: number, delta: -1 | 1) => {
    const j = index + delta
    if (j < 0 || j >= order.length) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[index], next[j]] = [next[j], next[index]]
      return next
    })
    setVerdict('none')
  }

  const check = () => setVerdict(isMechanismOrder(order) ? 'right' : 'wrong')

  // The stages play one after another once the order is right; they pause while the section is off screen.
  const autoPlaying = playing && stage < LAST_STAGE
  useEffect(() => {
    if (!autoPlaying || !onScreen) return
    const t = window.setTimeout(() => setStage((s) => Math.min(LAST_STAGE, s + 1)), STAGE_MS)
    return () => window.clearTimeout(t)
  }, [autoPlaying, stage, onScreen])

  // Reduced motion shows the last stage at once: no timed sequence.
  const play = () => {
    if (reducedMotion) {
      setStage(LAST_STAGE)
      setPlaying(false)
      return
    }
    setStage(0)
    setPlaying(true)
  }

  const readout = !isSubstitution
    ? stage === LAST_STAGE
      ? `${r.label}: product ${r.product.name} (${r.product.formula}). ${subscriptFormulas(r.why)}`
      : `${r.label}: ${reactionText(r.equation)}. An addition has no σ-complex and loses no proton.`
    : verdict === 'none'
      ? `Put the four stages in the order the mechanism runs, then check the order.`
      : verdict === 'wrong'
        ? 'Not yet. The electrophile must be made before the ring can attack it, and the ring is restored last.'
        : stage === 0
          ? 'The order is right. Play the mechanism to see each stage.'
          : stage === LAST_STAGE
            ? `Product: ${r.product.name} (${r.product.formula}). ${aromaticText(r)}.`
            : `Stage ${stage} of ${LAST_STAGE}: ${stageTitle(r, stage)}.`

  return (
    <div ref={rootRef} className={styles.lab} data-reaction={r.id} data-stage={stage} data-order-verdict={verdict} data-reduced={reducedMotion ? 'true' : 'false'}>
      <div className={styles.reactions} role="group" aria-label="Reaction">
        {WORKBENCH_IDS.map((id) => (
          <button key={id} type="button" className={styles.reactionButton} aria-pressed={id === selected} data-id={id} onClick={() => choose(id)}>
            {BUTTON_LABEL[id]}
          </button>
        ))}
      </div>

      <p className={styles.equation} data-testid="eas-equation">
        {reactionText(r.equation)}
      </p>
      <p className={styles.conditions}>
        <span className={styles.condLabel}>Condition: </span>
        {subscriptFormulas(r.conditions)}
      </p>

      <div className={styles.stage}>
        <StageDrawing r={r} stage={stage} />
      </div>

      {isSubstitution && (
        <div className={styles.order}>
          <p className={styles.orderTitle}>Put the stages in order</p>
          <ol className={styles.cards}>
            {order.map((s, i) => (
              <li key={s} className={styles.card} data-stage-id={s}>
                <span className={styles.cardText}>{STAGE_LABEL[s]}</span>
                <span className={styles.cardMoves}>
                  <button type="button" className={styles.move} onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move “${STAGE_LABEL[s]}” up`}>
                    ▲
                  </button>
                  <button type="button" className={styles.move} onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label={`Move “${STAGE_LABEL[s]}” down`}>
                    ▼
                  </button>
                </span>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            <Button variant="secondary" onClick={check}>
              Check the order
            </Button>
            <Button onClick={play} disabled={!unlocked}>
              Play the mechanism
            </Button>
            <Button variant="secondary" onClick={() => setStage((s) => Math.min(LAST_STAGE, s + 1))} disabled={!unlocked || stage >= LAST_STAGE}>
              Next stage
            </Button>
          </div>
        </div>
      )}

      {!isSubstitution && (
        <div className={styles.actions}>
          <Button onClick={() => setStage(LAST_STAGE)} disabled={stage === LAST_STAGE}>
            Show the product
          </Button>
        </div>
      )}

      <p className={styles.readout} aria-live="polite" data-testid="eas-readout">
        {readout}
      </p>
    </div>
  )
}
