'use client'

import React, { useState, useMemo } from 'react'
import type { SimulationProps } from '@/components/simulation/registry'
import { Button } from '@/components/controls'
import { formatTrueMinus } from '@/components/redox/geometry'
import { LaneLadder } from '@/components/animations/unit7/types/LaneLadder'
import {
  buildLadderModel,
  formatOn,
  toUnicodeFormula,
} from '@/components/animations/unit7/types/ladder-model'
import {
  analyseRedox,
  type RedoxAnalysisResult,
} from '@/lib/chem/redox-analysis'
import { rationalToNumber } from '@/lib/chem/oxidation-number'
import type { NcertRedoxType } from '@/lib/chem/ncert-unit7-tables'
import styles from './redox-classifier.module.css'

export interface ReactionCard {
  id: string
  equation: string
  displayEquation: string
  expectedType: NcertRedoxType
  hint: string
}

export const CLASSIFIER_DECK: readonly ReactionCard[] = [
  {
    id: 'rx-1',
    equation: '2Mg(s) + O2(g) -> 2MgO(s)',
    displayEquation: '2Mg(s) + O₂(g) → 2MgO(s)',
    expectedType: 'combination',
    hint: 'Elemental magnesium and oxygen combine to produce magnesium oxide.',
  },
  {
    id: 'rx-2',
    equation: '2KClO3(s) -> 2KCl(s) + 3O2(g)',
    displayEquation: '2KClO₃(s) → 2KCl(s) + 3O₂(g)',
    expectedType: 'decomposition',
    hint: 'Potassium chlorate breaks down into potassium chloride and elemental dioxygen.',
  },
  {
    id: 'rx-3',
    equation: 'CaCO3(s) -> CaO(s) + CO2(g)',
    displayEquation: 'CaCO₃(s) → CaO(s) + CO₂(g)',
    expectedType: 'not-redox',
    hint: 'Check if any atom changes its oxidation number during this thermal breakdown.',
  },
  {
    id: 'rx-4',
    equation: 'Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)',
    displayEquation: 'Zn(s) + CuSO₄(aq) → ZnSO₄(aq) + Cu(s)',
    expectedType: 'metal-displacement',
    hint: 'Metallic zinc displaces copper(II) ions from solution.',
  },
  {
    id: 'rx-5',
    equation: 'TiCl4(l) + 2Mg(s) -> Ti(s) + 2MgCl2(s)',
    displayEquation: 'TiCl₄(l) + 2Mg(s) → Ti(s) + 2MgCl₂(s)',
    expectedType: 'metal-displacement',
    hint: 'Kroll process: magnesium reduces titanium tetrachloride to pure metallic titanium.',
  },
  {
    id: 'rx-6',
    equation: 'Cl2(g) + 2KBr(aq) -> 2KCl(aq) + Br2(l)',
    displayEquation: 'Cl₂(g) + 2KBr(aq) → 2KCl(aq) + Br₂(l)',
    expectedType: 'non-metal-displacement',
    hint: 'Chlorine gas oxidises bromide ions, liberating elemental bromine.',
  },
  {
    id: 'rx-7',
    equation: 'Zn(s) + 2HCl(aq) -> ZnCl2(aq) + H2(g)',
    displayEquation: 'Zn(s) + 2HCl(aq) → ZnCl₂(aq) + H₂(g)',
    expectedType: 'non-metal-displacement',
    hint: 'Zinc reacts with dilute acid to liberate dihydrogen gas.',
  },
  {
    id: 'rx-8',
    equation: '2H2O2(aq) -> 2H2O(l) + O2(g)',
    displayEquation: '2H₂O₂(aq) → 2H₂O(l) + O₂(g)',
    expectedType: 'disproportionation',
    hint: 'Peroxide oxygen (−1) simultaneously forms water (−2) and dioxygen (0).',
  },
  {
    id: 'rx-9',
    equation: 'Cl2(g) + 2OH-(aq) -> ClO-(aq) + Cl-(aq) + H2O(l)',
    displayEquation: 'Cl₂(g) + 2OH⁻(aq) → ClO⁻(aq) + Cl⁻(aq) + H₂O(l)',
    expectedType: 'disproportionation',
    hint: 'Chlorine (0) in cold alkali forms hypochlorite (+1) and chloride (−1).',
  },
  {
    id: 'rx-10',
    equation: 'P4(s) + 3OH-(aq) + 3H2O(l) -> PH3(g) + 3H2PO2-(aq)',
    displayEquation: 'P₄(s) + 3OH⁻(aq) + 3H₂O(l) → PH₃(g) + 3H₂PO₂⁻(aq)',
    expectedType: 'disproportionation',
    hint: 'White phosphorus (0) forms phosphine (−3) and hypophosphite (+1).',
  },
  {
    id: 'rx-11',
    equation: 'BaCl2(aq) + H2SO4(aq) -> BaSO4(s) + 2HCl(aq)',
    displayEquation: 'BaCl₂(aq) + H₂SO₄(aq) → BaSO₄(s) + 2HCl(aq)',
    expectedType: 'not-redox',
    hint: 'Precipitation of barium sulphate: inspect Ba, Cl, H, S, and O oxidation states.',
  },
  {
    id: 'rx-12',
    equation: 'CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)',
    displayEquation: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)',
    expectedType: 'combination',
    hint: 'Combustion of methane: carbon is oxidised (−4 to +4) and oxygen is reduced (0 to −2).',
  },
  {
    id: 'rx-13',
    equation: 'V2O5(s) + 5Ca(s) -> 2V(s) + 5CaO(s)',
    displayEquation: 'V₂O₅(s) + 5Ca(s) → 2V(s) + 5CaO(s)',
    expectedType: 'metal-displacement',
    hint: 'Metallurgical reduction of vanadium(V) oxide using metallic calcium.',
  },
  {
    id: 'rx-14',
    equation: '2Na(s) + 2H2O(l) -> 2NaOH(aq) + H2(g)',
    displayEquation: '2Na(s) + 2H₂O(l) → 2NaOH(aq) + H₂(g)',
    expectedType: 'non-metal-displacement',
    hint: 'Alkali metal sodium displaces hydrogen from cold water.',
  },
] as const

interface CategoryOption {
  type: NcertRedoxType
  label: string
}

const CATEGORIES: readonly CategoryOption[] = [
  { type: 'combination', label: 'Combination' },
  { type: 'decomposition', label: 'Decomposition' },
  { type: 'metal-displacement', label: 'Metal Displacement' },
  { type: 'non-metal-displacement', label: 'Non-metal Displacement' },
  { type: 'disproportionation', label: 'Disproportionation' },
  { type: 'not-redox', label: 'Not Redox' },
]

/** Plain-text summary of unchanged states, e.g. "Ca +2, C +4, O −2". */
function unchangedStatesText(analysis: RedoxAnalysisResult): string {
  return Object.entries(analysis.reactantStates)
    .map(([element, state]) => `${toUnicodeFormula(element)} ${formatOn(rationalToNumber(state))}`)
    .join(', ')
}

export function RedoxClassifier({}: SimulationProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedTypes, setSelectedTypes] = useState<Record<number, NcertRedoxType>>({})
  const [scores, setScores] = useState<Record<number, boolean>>({})
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  const currentCard = CLASSIFIER_DECK[currentIndex]
  const currentSelection = selectedTypes[currentIndex]
  const hasAnswered = currentSelection !== undefined
  const isCorrect = scores[currentIndex] === true

  const analysis = useMemo(() => {
    return analyseRedox(currentCard.equation)
  }, [currentCard.equation])

  const ladderModel = useMemo(() => {
    return analysis.isRedox ? buildLadderModel(currentCard.equation) : null
  }, [analysis, currentCard.equation])

  const totalScore = Object.values(scores).filter(Boolean).length

  const handleSelectCategory = (type: NcertRedoxType) => {
    if (hasAnswered) return
    const correct = type === currentCard.expectedType
    setSelectedTypes((prev) => ({ ...prev, [currentIndex]: type }))
    setScores((prev) => ({ ...prev, [currentIndex]: correct }))

    const categoryLabel = CATEGORIES.find((c) => c.type === type)?.label ?? type
    const expectedLabel = CATEGORIES.find((c) => c.type === currentCard.expectedType)?.label ?? currentCard.expectedType
    const msg = correct
      ? `Correct! ${currentCard.displayEquation} is classified as ${categoryLabel}.`
      : `Incorrect. You chose ${categoryLabel}, but this reaction is a ${expectedLabel}.`
    setLiveAnnouncement(msg)
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
      setLiveAnnouncement(`Moved to reaction card ${currentIndex}.`)
    }
  }

  const handleNext = () => {
    if (currentIndex < CLASSIFIER_DECK.length - 1) {
      setCurrentIndex((i) => i + 1)
      setLiveAnnouncement(`Moved to reaction card ${currentIndex + 2}.`)
    }
  }

  const handleReset = () => {
    setSelectedTypes({})
    setScores({})
    setCurrentIndex(0)
    setLiveAnnouncement('Classification exercise reset to card 1.')
  }

  return (
    <div
      className={styles.container}
      data-testid="redox-classifier-container"
      aria-label="Redox reaction classifier interactive simulation"
    >
      <div className={styles.liveRegion} aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Top Header & Navigation Bar */}
      <div className={styles.topBar}>
        <div className={styles.deckStats}>
          <span>
            Reaction {currentIndex + 1} of {CLASSIFIER_DECK.length}
          </span>
          <span className={styles.scoreBadge} data-testid="score-display">
            Score: {totalScore} / {CLASSIFIER_DECK.length}
          </span>
        </div>

        <div className={styles.navControls}>
          <Button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            variant="secondary"
            aria-label="Previous reaction"
          >
            ← Prev
          </Button>
          <Button
            onClick={handleNext}
            disabled={currentIndex === CLASSIFIER_DECK.length - 1}
            variant="secondary"
            aria-label="Next reaction"
          >
            Next →
          </Button>
          <Button onClick={handleReset} variant="secondary" aria-label="Reset deck">
            Reset
          </Button>
        </div>
      </div>

      {/* Main Card Stage */}
      <div className={styles.cardStage}>
        <div className={styles.equationCard}>
          <div className={styles.equationText} data-testid="current-equation">
            {formatTrueMinus(currentCard.displayEquation)}
          </div>
        </div>

        <p className={styles.promptText}>
          {hasAnswered
            ? 'Reaction analysis and oxidation state changes:'
            : 'Select the mechanism that best categorises this chemical transformation:'}
        </p>

        {/* Categories Selection Grid */}
        <div className={styles.categoryGrid} role="group" aria-label="Reaction categories">
          {CATEGORIES.map((cat) => {
            const isThisSelected = currentSelection === cat.type
            const isThisTarget = currentCard.expectedType === cat.type
            let btnClass = styles.catBtn
            if (hasAnswered) {
              if (isThisSelected && isCorrect) btnClass += ` ${styles.catBtnCorrect}`
              else if (isThisSelected && !isCorrect) btnClass += ` ${styles.catBtnWrong}`
              else if (isThisTarget) btnClass += ` ${styles.catBtnCorrect}`
            }

            return (
              <button
                key={cat.type}
                type="button"
                className={btnClass}
                onClick={() => handleSelectCategory(cat.type)}
                disabled={hasAnswered}
                data-testid={`cat-btn-${cat.type}`}
                aria-pressed={isThisSelected}
              >
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Feedback Section Once Answered */}
        {hasAnswered && (
          <div className={styles.feedbackSection} data-testid="feedback-section">
            <div
              className={`${styles.verdictBanner} ${
                isCorrect ? styles.verdictBannerCorrect : styles.verdictBannerWrong
              }`}
              data-testid="verdict-banner"
            >
              <span>{isCorrect ? '✓' : '✗'}</span>
              <span>
                {isCorrect
                  ? 'Correct classification!'
                  : `Not quite. This reaction is a ${
                      CATEGORIES.find((c) => c.type === currentCard.expectedType)?.label
                    }.`}
              </span>
            </div>

            <div className={styles.analysisDetails}>
              <p>
                <strong>Mechanism: </strong>
                {currentCard.hint}
              </p>
              <p>
                <strong>Analysis: </strong>
                {formatTrueMinus(analysis.summary)}
              </p>

              {analysis.isRedox && (
                <div className={styles.agentRoles}>
                  {analysis.oxidants.length > 0 && (
                    <span className={`${styles.roleTag} ${styles.roleOxidant}`}>
                      <span>Oxidant (reduced):</span>
                      <strong>{analysis.oxidants.map(toUnicodeFormula).join(', ')}</strong>
                    </span>
                  )}
                  {analysis.reductants.length > 0 && (
                    <span className={`${styles.roleTag} ${styles.roleReductant}`}>
                      <span>Reductant (oxidised):</span>
                      <strong>{analysis.reductants.map(toUnicodeFormula).join(', ')}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Oxidation number ladder: one lane per element that changes */}
            {analysis.isRedox && ladderModel && (
              <div className={styles.ladderContainer} data-testid="ladder-display">
                <LaneLadder
                  model={ladderModel}
                  height={330}
                  ariaLabel={`Oxidation number changes for ${currentCard.displayEquation}`}
                />
              </div>
            )}
            {!analysis.isRedox && (
              <p className={styles.unchangedNote} data-testid="unchanged-note">
                No element changes its oxidation number: {unchangedStatesText(analysis)}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
