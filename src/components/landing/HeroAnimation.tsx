'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { BohrEmission } from '@/components/animations/BohrEmission'
import { BOHR_STEP_COUNT, stepDescription } from '@/components/animations/bohr-steps'
import { usePrefersReducedMotion } from '@/components/section/usePrefersReducedMotion'
import { useIsActive } from '@/components/simulation/useIsActive'
import styles from './HeroAnimation.module.css'

/** A short name for each Step of the Bohr emission Animation. */
const STEP_NAMES = ['Ground state', 'Excitation', 'Emission', 'Spectral line'] as const

/** How long each Step stays on screen while the Animation plays by itself, in milliseconds. */
const STEP_HOLD_MS = [2800, 2600, 3400, 4600] as const

const LAST_STEP = BOHR_STEP_COUNT - 1

export interface HeroAnimationProps {
  /** Where the Animation lives on the site. */
  sectionHref: string
  /** The link text, e.g. "Section 2.4". */
  sectionLabel: string
}

/**
 * The Bohr emission Animation from Section 2.4, playing through its Steps by itself.
 * The Learner can pause it or pick a Step. Under reduced motion it does not play:
 * it shows the last Step, and the Step buttons cut straight to each picture.
 */
export function HeroAnimation({ sectionHref, sectionLabel }: HeroAnimationProps) {
  const reducedMotion = usePrefersReducedMotion()
  const cardRef = useRef<HTMLElement>(null)
  const onScreen = useIsActive(cardRef)

  // null until the Animation advances or the Learner picks a Step.
  const [chosenStep, setChosenStep] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)

  const step = chosenStep ?? (reducedMotion ? LAST_STEP : 0)
  const playing = !paused && !reducedMotion && onScreen

  useEffect(() => {
    if (!playing) return
    const id = window.setTimeout(() => {
      setChosenStep((step + 1) % BOHR_STEP_COUNT)
    }, STEP_HOLD_MS[step])
    return () => window.clearTimeout(id)
  }, [playing, step])

  const pickStep = (index: number) => {
    setChosenStep(index)
    setPaused(true)
  }

  return (
    <figure ref={cardRef} className={styles.card} data-testid="hero-animation">
      <figcaption className={styles.titleBar}>
        <span className={styles.eyebrow}>Animation · {sectionLabel}</span>
        <span className={styles.title}>How a hydrogen atom gives out red light</span>
      </figcaption>

      <div className={styles.stage}>
        <BohrEmission step={step} reducedMotion={reducedMotion} announce={false} />
      </div>

      <div className={styles.footer}>
        <ol className={styles.steps} aria-label="Steps of this Animation">
          {STEP_NAMES.map((name, index) => {
            const current = index === step
            return (
              <li key={name} className={styles.stepItem}>
                <button
                  type="button"
                  className={styles.step}
                  aria-current={current ? 'step' : undefined}
                  data-playing={current && playing ? 'true' : undefined}
                  style={{ '--hold': `${STEP_HOLD_MS[index]}ms` } as CSSProperties}
                  onClick={() => pickStep(index)}
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  <span className={styles.stepName}>{name}</span>
                </button>
              </li>
            )
          })}
        </ol>

        <p className={styles.caption} data-testid="hero-caption">
          {stepDescription(step)}
        </p>

        <div className={styles.actions}>
          {!reducedMotion && (
            <button
              type="button"
              className={styles.playButton}
              onClick={() => setPaused((value) => !value)}
              aria-pressed={paused}
            >
              <svg viewBox="0 0 16 16" className={styles.playIcon} aria-hidden="true">
                {paused ? (
                  <path d="M4.5 2.8v10.4L13 8z" />
                ) : (
                  <path d="M4 3h3v10H4zM9 3h3v10H9z" />
                )}
              </svg>
              {paused ? 'Play' : 'Pause'}
            </button>
          )}
          <Link href={sectionHref} className={styles.sectionLink}>
            Open {sectionLabel}
            <span aria-hidden="true"> →</span>
          </Link>
        </div>
      </div>
    </figure>
  )
}
