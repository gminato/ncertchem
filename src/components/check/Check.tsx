'use client'

import { useId, useState, useSyncExternalStore, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/controls/Button'
import controls from '@/components/controls/controls.module.css'
import styles from './check.module.css'
import {
  checkStorageKey,
  hashText,
  readCheckDone,
  subscribeCheckDone,
  writeCheckDone,
} from './checkStorage'

export interface CheckProps {
  /** The question. Also accepted as children, which suits MDX. */
  question?: ReactNode
  children?: ReactNode
  /** Choice mode: the options, shown as selectable cards. */
  options?: string[]
  /** Choice mode: the index of the correct option. Numeric mode: the correct value. */
  answer: number
  /** Numeric mode: the Learner types a number instead of choosing. */
  numeric?: boolean
  /** Numeric mode: the accepted absolute difference from `answer`. */
  tolerance?: number
  /** Numeric mode: the unit shown after the input and in the reveal. */
  unit?: string
  /** Shown after a correct answer, or after two tries. */
  explanation: ReactNode
  /**
   * Position of this Check in its Section, used in the storage key. Defaults to a
   * hash of the question, so pass `n` if the wording may change.
   */
  n?: number | string
}

type Status = 'idle' | 'wrong' | 'correct' | 'revealed'
const MAX_TRIES = 2
const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function slugFromPath(pathname: string | null): string {
  const segments = (pathname ?? '').split('/').filter(Boolean)
  return segments[segments.length - 1] ?? 'page'
}

/**
 * A short question inside a Section. Choice mode shows selectable options;
 * numeric mode takes a number within a tolerance. Feedback is gentle: a wrong
 * answer invites another try, and the explanation appears after two tries or
 * once the answer is right. Completion is stored in this browser only.
 */
export function Check({
  question,
  children,
  options = [],
  answer,
  numeric = false,
  tolerance = 0,
  unit,
  explanation,
  n,
}: CheckProps) {
  const questionId = useId()
  const groupName = useId()
  const pathname = usePathname()
  const questionText = question ?? children
  const storageKey = checkStorageKey(
    slugFromPath(pathname),
    n ?? hashText(typeof questionText === 'string' ? questionText : '')
  )
  const completed = useSyncExternalStore(
    subscribeCheckDone,
    () => readCheckDone(storageKey),
    () => false
  )

  const [selected, setSelected] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [tries, setTries] = useState(0)
  const [status, setStatus] = useState<Status>('idle')

  const value = draft.trim() === '' ? null : Number(draft)
  const numericValue = value === null || Number.isNaN(value) ? null : value
  const hasAnswer = numeric ? numericValue !== null : selected !== null
  const locked = status === 'correct' || status === 'revealed'

  const isCorrect = numeric
    ? numericValue !== null && Math.abs(numericValue - answer) <= tolerance + 1e-9
    : selected === answer

  const correctLabel = numeric
    ? `${answer}${unit ? ` ${unit}` : ''}`
    : options[answer] ?? ''

  const submit = () => {
    if (locked || !hasAnswer) return
    if (isCorrect) {
      setStatus('correct')
      writeCheckDone(storageKey)
      return
    }
    const nextTries = tries + 1
    setTries(nextTries)
    setStatus(nextTries >= MAX_TRIES ? 'revealed' : 'wrong')
  }

  const tryAgain = () => {
    setStatus('idle')
    setSelected(null)
    setDraft('')
  }

  const onButton = status === 'wrong' ? tryAgain : submit

  return (
    <section className={styles.check} aria-labelledby={questionId} data-status={status}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Check</span>
        {completed && <span className={styles.doneTag}>Answered</span>}
      </header>

      <div id={questionId} className={styles.question}>
        {questionText}
      </div>

      {numeric ? (
        <div className={styles.numeric}>
          <label htmlFor={`${questionId}-value`} className={styles.numericLabel}>
            Your answer
          </label>
          <div className={controls.numberRow}>
            <input
              id={`${questionId}-value`}
              type="number"
              inputMode="decimal"
              step="any"
              className={controls.numberInput}
              value={draft}
              disabled={locked}
              onChange={(event) => {
                setDraft(event.target.value)
                if (status === 'wrong') setStatus('idle')
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submit()
              }}
            />
            {unit && <span className={controls.numberUnit}>{unit}</span>}
          </div>
        </div>
      ) : (
        <div role="radiogroup" aria-labelledby={questionId} className={styles.options}>
          {options.map((option, index) => {
            const isSelected = selected === index
            const isAnswer = index === answer
            const showCorrect = locked && isAnswer
            const showWrong = isSelected && status === 'wrong'
            const className = [
              styles.option,
              isSelected && !showCorrect && !showWrong ? styles.optionSelected : '',
              showCorrect ? styles.optionCorrect : '',
              showWrong || (status === 'revealed' && isSelected && !isAnswer)
                ? styles.optionWrong
                : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <label key={index} className={className}>
                <input
                  type="radio"
                  name={groupName}
                  className={controls.visuallyHidden}
                  checked={isSelected}
                  disabled={locked}
                  onChange={() => {
                    setSelected(index)
                    if (status === 'wrong') setStatus('idle')
                  }}
                />
                <span className={styles.letter} aria-hidden="true">
                  {OPTION_LETTERS[index]}
                </span>
                <span className={styles.optionText}>{option}</span>
              </label>
            )
          })}
        </div>
      )}

      {!locked && (
        <div className={styles.actions}>
          <Button
            variant={status === 'wrong' ? 'secondary' : 'primary'}
            disabled={!hasAnswer && status !== 'wrong'}
            onClick={onButton}
          >
            {status === 'wrong' ? 'Try again' : 'Check'}
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite" className={styles.feedback}>
        {status === 'wrong' && (
          <p className={styles.feedbackGentle}>
            Not quite. Look at the question again and give it another go.
          </p>
        )}
        {status === 'correct' && <p className={styles.feedbackRight}>Correct.</p>}
        {status === 'revealed' && (
          <p className={styles.feedbackGentle}>
            The answer is <strong>{correctLabel}</strong>.
          </p>
        )}
      </div>

      {locked && <div className={styles.explanation}>{explanation}</div>}
    </section>
  )
}
