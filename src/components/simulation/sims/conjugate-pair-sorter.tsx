'use client'

import { useId, useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  CONJUGATE_DECK,
  deckScore,
  judgeCard,
  pairRoles,
  type CardJudgement,
  type PairCard,
  type PairRole,
  type PairSpecies,
} from '@/lib/chem/conjugate-pairs'
import styles from './conjugate-pair-sorter.module.css'

const ROLE_LABEL: Record<PairRole, string> = {
  acid: 'Brønsted acid',
  base: 'Brønsted base',
  'conjugate-acid': 'Conjugate acid',
  'conjugate-base': 'Conjugate base',
  'lewis-acid': 'Lewis acid',
  'lewis-base': 'Lewis base',
}

const ROLE_QUESTION: Record<PairCard['kind'], string> = {
  bronsted: 'Name the acid, the base, the conjugate acid and the conjugate base.',
  lewis: 'Name the Lewis acid (electron-pair acceptor) and the Lewis base (electron-pair donor).',
}

/** A mhchem formula rendered by KaTeX. */
function Chem({ ce }: { ce: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${ce}}`, { throwOnError: false }), [ce])
  return <span className={styles.chem} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A full mhchem reaction string (it already contains its \ce{} wrapper) rendered by KaTeX. */
function Reaction({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: true }), [tex])
  return <div className={styles.reaction} dangerouslySetInnerHTML={{ __html: html }} />
}

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}
const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻',
}

/**
 * Plain Unicode text for a species, with subscripts and charges, e.g. H3O+ becomes H₃O⁺ and
 * Co(NH3)6 becomes Co(NH₃)₆. Used where a formula appears as text rather than KaTeX.
 */
function speciesText(s: PairSpecies): string {
  const id = s.id.replace(/\^/g, '')
  const charge = id.match(/(\d*[+-])$/)
  const body = charge ? id.slice(0, id.length - charge[1].length) : id
  const sub = body.replace(/\d/g, (d) => SUBSCRIPT[d])
  if (!charge) return sub
  const sign = charge[1].slice(-1)
  const magnitude = charge[1].slice(0, -1)
  const mag = magnitude ? magnitude.replace(/\d/g, (d) => SUPERSCRIPT[d]) : ''
  return `${sub}${mag}${SUPERSCRIPT[sign]}`
}

/**
 * Twelve cards, each a reaction or an acid-base pair. The Learner picks the species for every
 * role, checks the card, reads the reasons, and moves on. The score counts cards with every role
 * right.
 */
export function ConjugatePairSorter(_props: SimulationProps) {
  const [index, setIndex] = useState(0)
  const [picks, setPicks] = useState<Partial<Record<PairRole, string>>>({})
  const [judgement, setJudgement] = useState<CardJudgement | null>(null)
  const [results, setResults] = useState<CardJudgement[]>([])
  const groupId = useId()

  const card = CONJUGATE_DECK[index]
  const roles = pairRoles(card.kind)
  const allPicked = roles.every((r) => picks[r] !== undefined)
  const finished = results.length === CONJUGATE_DECK.length
  const score = deckScore(results)

  const pick = (role: PairRole, id: string) => {
    if (judgement) return
    setPicks((prev) => ({ ...prev, [role]: id }))
  }

  const check = () => {
    if (!allPicked || judgement) return
    const result = judgeCard(card, picks)
    setJudgement(result)
    setResults((prev) => [...prev, result])
  }

  const next = () => {
    setIndex((i) => Math.min(i + 1, CONJUGATE_DECK.length - 1))
    setPicks({})
    setJudgement(null)
  }

  const restart = () => {
    setIndex(0)
    setPicks({})
    setJudgement(null)
    setResults([])
  }

  const summary = finished
    ? `Deck finished. ${score.correct} of ${score.total} cards were answered with every role right.`
    : judgement
      ? `${judgement.correct ? 'All roles right' : 'Not every role right'}. Card ${index + 1} of ${CONJUGATE_DECK.length}: ${roles
          .map((r) => `${ROLE_LABEL[r]} ${judgement.roles[r] ? 'right' : `wrong, the answer is ${speciesText(card.choices.find((s) => s.id === card.answers[r])!)}`}`)
          .join('; ')}.`
      : `Card ${index + 1} of ${CONJUGATE_DECK.length}. ${ROLE_QUESTION[card.kind]} ${
          allPicked ? 'All roles are picked; check the card.' : 'Pick one species for each role.'
        }`

  if (finished) {
    return (
      <div className={styles.sim} data-testid="sorter" data-finished="true">
        <div className={styles.finish}>
          <p className={styles.scoreBig} data-testid="final-score">
            {score.correct} of {score.total}
          </p>
          <p className={styles.note}>cards answered with every role right on the check</p>
          <Button onClick={restart}>Start the deck again</Button>
        </div>
        <p className={styles.live} aria-live="polite">
          {summary}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.sim} data-testid="sorter" data-card={card.id} data-index={index}>
      <div className={styles.topBar}>
        <span className={styles.progress} data-testid="progress">
          Card {index + 1} of {CONJUGATE_DECK.length}
        </span>
        <span className={styles.score} data-testid="score">
          Right so far: {score.correct} of {results.length}
        </span>
      </div>

      <div className={styles.card}>
        <span className={styles.kind}>{card.kind === 'bronsted' ? 'Brønsted–Lowry' : 'Lewis'}</span>
        <Reaction tex={card.reaction} />
        <p className={styles.question}>{ROLE_QUESTION[card.kind]}</p>

        <div className={styles.roles}>
          {roles.map((role) => {
            const groupName = `${groupId}-${card.id}-${role}`
            const verdict = judgement?.roles[role]
            const chosen = picks[role]
            const answerSpecies = card.choices.find((s) => s.id === card.answers[role])!
            return (
              <div key={role} className={styles.role} role="group" aria-labelledby={`${groupName}-label`}>
                <div className={styles.roleLabel} id={`${groupName}-label`}>
                  <span>{ROLE_LABEL[role]}</span>
                  {judgement && (
                    <span
                      className={verdict ? styles.markRight : styles.markWrong}
                      data-testid={`mark-${role}`}
                      data-verdict={verdict ? 'right' : 'wrong'}
                    >
                      {verdict ? '✓ right' : `✗ answer: ${speciesText(answerSpecies)}`}
                    </span>
                  )}
                </div>
                <div className={styles.chips}>
                  {card.choices.map((s) => {
                    const isPicked = chosen === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={styles.chip}
                        aria-pressed={isPicked}
                        aria-label={`${ROLE_LABEL[role]}: ${speciesText(s)}`}
                        disabled={judgement !== null}
                        data-picked={isPicked ? 'true' : 'false'}
                        onClick={() => pick(role, s.id)}
                      >
                        <Chem ce={s.ce} />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className={styles.actions}>
          {judgement === null ? (
            <Button onClick={check} disabled={!allPicked}>
              Check card
            </Button>
          ) : (
            <Button onClick={next}>{index === CONJUGATE_DECK.length - 1 ? 'See the score' : 'Next card'}</Button>
          )}
        </div>

        {judgement && (
          <p className={judgement.correct ? styles.feedbackRight : styles.feedbackWrong} data-testid="feedback">
            {judgement.correct ? 'Every role is right. ' : 'Not every role is right yet. '}
            {card.explanation}
          </p>
        )}
      </div>

      <p className={styles.live} aria-live="polite" data-testid="summary">
        {summary}
      </p>
    </div>
  )
}
