'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { Row, type RowItem } from '@/components/animations/unit9/eas/row'
import { BenzeneHexagon, BENZENE_HEX_WIDTH, sigmaItem, skeletalNode } from '@/components/animations/unit9/eas/parts'
import { huckel } from '@/lib/chem/aromaticity'
import {
  conditionText,
  isMechanismOrder,
  MECHANISM_STAGES,
  protonatedBase,
  reactionText,
  STAGE_LABEL,
  workbenchReactions,
  subscriptFormulas,
  type MechanismStage,
  type WorkbenchId,
  type WorkbenchReaction,
} from '@/lib/chem/eas-workbench'
import { useIsActive } from '../useIsActive'
import styles from './eas-workbench.module.css'

/** The stage is 960 × 340 units; a drawing fills about 70% of its width. */
const VIEW_W = 960
const VIEW_H = 340
const TARGET = Math.round(0.7 * VIEW_W)
/** Drawings sit above the caption line (y = VIEW_H - 22) and never scale past 1.5, so they stay inside the box. */
const ROW_CY = 160
const ROW_MAX = 1.5
/** Stage 0 is the reactants; stages 1 to 4 follow the four mechanism stages in order. */
const LAST_STAGE = 4
const STAGE_MS = 1400
/** The order the cards start in: a scramble of the mechanism, so the learner has to put it right. */
const SCRAMBLED: MechanismStage[] = ['attack', 'restore', 'generate', 'deprotonate']
const WORKBENCH_IDS: WorkbenchId[] = ['nitration', 'chlorination', 'sulphonation', 'alkylation', 'acylation', 'bhc', 'hydrogenation']
const SKELETAL_SCALE = 40

const BUTTON_LABEL: Record<WorkbenchId, string> = {
  nitration: 'Nitration',
  chlorination: 'Halogenation',
  sulphonation: 'Sulphonation',
  alkylation: 'Friedel–Crafts alkylation',
  acylation: 'Friedel–Crafts acylation',
  bhc: 'Cl₂ in UV light',
  hydrogenation: 'Hydrogenation',
}

/**
 * The σ-complex label on the sp³ carbon: the electrophile of the lib without its charge (CH₃⁺ gives CH₃).
 * Nitration uses the shared drawing (NO₂); sulphonation's zwitterion carries SO₃⁻ and acylation its COCH₃.
 */
function sigmaLabel(r: WorkbenchReaction): string {
  const f = r.electrophile?.formula ?? ''
  if (r.id === 'sulphonation') return 'SO₃⁻'
  if (r.id === 'acylation') return 'COCH₃'
  if (r.id === 'nitration') return 'NO2'
  return f.replace(/⁺$/, '')
}

/** The species of a reaction as text items, with the benzene drawn as a hexagon. */
function reactantItems(r: WorkbenchReaction): RowItem[] {
  const items: RowItem[] = [{ kind: 'node', width: BENZENE_HEX_WIDTH, render: () => <BenzeneHexagon /> }]
  for (const f of r.reagents) items.push({ kind: 'text', text: '+ ' + f, size: 26 })
  return items
}

/** The product of a reaction as a structure, with its by-products after a plus. */
function productItems(r: WorkbenchReaction): RowItem[] {
  const items: RowItem[] = [skeletalNode(r.product.graph, SKELETAL_SCALE)]
  for (const f of r.byproducts) items.push({ kind: 'text', text: '+ ' + f, size: 26 })
  return items
}

/** Stage 3: the σ-complex and the base give the restored product and the protonated base. */
function baseItems(r: WorkbenchReaction): RowItem[] {
  return [
    sigmaItem(r.id === 'nitration' ? 'NO2' : sigmaLabel(r)),
    { kind: 'text', text: '+ ' + r.base!, size: 26 },
    { kind: 'arrow', width: 84 },
    skeletalNode(r.product.graph, SKELETAL_SCALE),
    { kind: 'text', text: '+ ' + protonatedBase(r.base!), size: 26 },
  ]
}

/** The drawing for one stage of a reaction. */
function StageDrawing({ r, stage }: { r: WorkbenchReaction; stage: number }) {
  const title = stageTitle(r, stage)
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={title} className={styles.drawing} data-stage={stage}>
      <text x={VIEW_W / 2} y={28} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {title}
      </text>
      {stage === 0 && (
        <Row items={reactantItems(r)} cx={VIEW_W / 2} cy={ROW_CY} targetWidth={TARGET} maxScale={ROW_MAX} />
      )}
      {stage === 1 && r.electrophile && (
        <g>
          <text x={VIEW_W / 2} y={150} textAnchor="middle" dominantBaseline="central" fontSize={56} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
            {r.electrophile.formula}
          </text>
          <text x={VIEW_W / 2} y={212} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg)">
            {r.electrophile.name}
          </text>
          <text x={VIEW_W / 2} y={262} textAnchor="middle" dominantBaseline="central" fontSize={20} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {r.electrophile.generation}
          </text>
        </g>
      )}
      {stage === 2 && r.kind === 'substitution' && (
        <g>
          <Row items={[sigmaItem(r.id === 'nitration' ? 'NO2' : sigmaLabel(r))]} cx={VIEW_W / 2} cy={ROW_CY} targetWidth={TARGET} maxScale={ROW_MAX} />
          <text x={VIEW_W / 2} y={VIEW_H - 22} textAnchor="middle" dominantBaseline="central" fontSize={20} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {`σ-complex ${r.sigmaFormula}: the sp³ carbon bears H and the electrophile`}
          </text>
        </g>
      )}
      {stage === 3 && r.kind === 'substitution' && <Row items={baseItems(r)} cx={VIEW_W / 2} cy={ROW_CY} targetWidth={TARGET} maxScale={ROW_MAX} />}
      {stage === 4 &&
        (r.kind === 'substitution' ? (
          <g>
            <Row items={[skeletalNode(r.product.graph, SKELETAL_SCALE)]} cx={VIEW_W / 2} cy={ROW_CY} targetWidth={TARGET} maxScale={ROW_MAX} />
            <text x={VIEW_W / 2} y={VIEW_H - 22} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {`${r.product.name} (${r.product.formula}): ${aromaticText(r)}`}
            </text>
          </g>
        ) : (
          <Row items={[...reactantItems(r), ...productItems(r)]} cx={VIEW_W / 2} cy={ROW_CY} targetWidth={TARGET} maxScale={ROW_MAX} />
        ))}
    </svg>
  )
}

/** Stage titles: the mechanism's names, with the reaction's own product where it has one. */
function stageTitle(r: WorkbenchReaction, stage: number): string {
  if (stage === 0) return 'Reactants'
  if (stage === 1) return STAGE_LABEL.generate
  if (stage === 2) return STAGE_LABEL.attack
  if (stage === 3) return STAGE_LABEL.deprotonate
  return r.kind === 'substitution' ? STAGE_LABEL.restore : `Product: ${r.product.name}`
}

/** The lib's Hückel verdict for the product ring, in words (substitutions, where the ring is restored). */
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
        {conditionText(r)}
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
