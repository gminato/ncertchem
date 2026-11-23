'use client'

import { useState } from 'react'
import {
  DEFAULT_COMPLEX,
  REVERSE_CHALLENGES,
  SIM_COUNTER_IONS,
  SIM_LIGANDS,
  SIM_METALS,
  checkReverseMatch,
  evaluateComplex,
  formatCounterIonBadge,
  formatLigandBadge,
  oxidationStatesForMetal,
  type ComplexResult,
  type ComplexSpec,
  type CounterIonId,
  type LigandSlot,
  type MetalSymbol,
  type SimLigandFormula,
} from '@/lib/chem/complex-namer'
import { romanNumeral } from '@/lib/chem/ncert-c12-unit5-s3-tables'
import styles from './complex-namer.module.css'

const SVG_W = 600
const SVG_H = 176

function signedText(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `−${Math.abs(n)}`
  return '0'
}

/** Visual tile diagram of the assembled complex and its charge balance. */
function ComplexDiagram({
  spec,
  result,
  hideNameDetails,
}: {
  spec: ComplexSpec
  result: ComplexResult
  hideNameDetails: boolean
}) {
  const ligands = result.mergedLigands
  const showLeftCounter = result.balanced && result.entityCharge < 0 && result.counterIonCount > 0
  const showRightCounter = result.balanced && result.entityCharge > 0 && result.counterIonCount > 0
  const counterObj = SIM_COUNTER_IONS.find((c) => c.formula === spec.counterIon) ?? null

  // Compute dynamic horizontal positions inside 600px viewBox so nothing ever clips.
  const tileH = 66
  const tileY = 26
  const metalW = 76
  const ligCount = ligands.length
  const ligW = ligCount === 0 ? 0 : Math.min(118, Math.floor(310 / ligCount))
  const gap = 10
  const counterW = 86
  const bracketPad = 14
  const showEntitySubscript = result.balanced && result.entityCount > 1
  const entitySubW = showEntitySubscript ? 20 : 0

  const innerW = metalW + (ligCount > 0 ? ligCount * (ligW + gap) : 0)
  const totalW =
    innerW +
    bracketPad * 2 +
    entitySubW +
    (showLeftCounter ? counterW + gap : 0) +
    (showRightCounter ? counterW + gap : 0)

  let cursor = Math.max(14, Math.floor((SVG_W - totalW) / 2))

  const leftCounterX = showLeftCounter ? cursor : null
  if (showLeftCounter) cursor += counterW + gap

  const bracketLeftX = cursor
  cursor += bracketPad

  const metalX = cursor
  cursor += metalW + gap

  const ligandXs = ligands.map((_, i) => cursor + i * (ligW + gap))
  cursor += ligands.length * (ligW + gap)

  const bracketRightX = cursor - gap + bracketPad
  cursor = bracketRightX + entitySubW + gap

  const rightCounterX = showRightCounter ? cursor : null

  return (
    <svg
      className={styles.scene}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      role="img"
      aria-label={`Coordination complex diagram for ${result.fullFormula} with entity charge ${signedText(result.entityCharge)}`}
    >
      {/* Left counter ion (cation) */}
      {showLeftCounter && leftCounterX !== null && counterObj && (
        <g>
          <rect
            x={leftCounterX}
            y={tileY}
            width={counterW}
            height={tileH}
            rx={8}
            fill="var(--ion-cation)"
            fillOpacity={0.14}
            stroke="var(--ion-cation)"
            strokeWidth={1.8}
            strokeDasharray="5 3"
          />
          <text
            x={leftCounterX + counterW / 2}
            y={tileY + 30}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            fill="var(--fg)"
          >
            {`${result.counterIonCount} ${formatCounterIonBadge(counterObj)}`}
          </text>
          <text
            x={leftCounterX + counterW / 2}
            y={tileY + 54}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
          >
            counter
          </text>
        </g>
      )}

      {/* Left square bracket */}
      <path
        d={`M ${bracketLeftX + 9} ${tileY - 8} L ${bracketLeftX} ${tileY - 8} L ${bracketLeftX} ${tileY + tileH + 8} L ${bracketLeftX + 9} ${tileY + tileH + 8}`}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Metal tile */}
      <g>
        <rect
          x={metalX}
          y={tileY}
          width={metalW}
          height={tileH}
          rx={8}
          fill="var(--ox)"
          fillOpacity={0.16}
          stroke="var(--ox)"
          strokeWidth={2}
        />
        <text
          x={metalX + metalW / 2}
          y={tileY + 30}
          textAnchor="middle"
          fontSize={20}
          fontWeight={700}
          fill="var(--fg)"
        >
          {spec.metal}
        </text>
        <text
          x={metalX + metalW / 2}
          y={tileY + 54}
          textAnchor="middle"
          fontSize={15}
          fontWeight={600}
          fill="var(--ox)"
        >
          {signedText(spec.oxidationState)}
        </text>
      </g>

      {/* Ligand tiles */}
      {ligands.map((item, idx) => {
        const x = ligandXs[idx]
        const isAnion = item.ligand.charge < 0
        const tone = isAnion ? 'var(--ion-anion)' : 'var(--accent)'
        return (
          <g key={item.ligand.formula}>
            <rect
              x={x}
              y={tileY}
              width={ligW}
              height={tileH}
              rx={8}
              fill={tone}
              fillOpacity={0.14}
              stroke={tone}
              strokeWidth={1.8}
            />
            <text
              x={x + ligW / 2}
              y={tileY + 30}
              textAnchor="middle"
              fontSize={17}
              fontWeight={700}
              fill="var(--fg)"
            >
              {`${item.count} ${formatLigandBadge(item.ligand)}`}
            </text>
            <text
              x={x + ligW / 2}
              y={tileY + 54}
              textAnchor="middle"
              fontSize={15}
              fill="var(--fg-muted)"
            >
              {isAnion ? signedText(item.ligand.charge * item.count) : '0'}
            </text>
          </g>
        )
      })}

      {/* Right square bracket */}
      <path
        d={`M ${bracketRightX - 9} ${tileY - 8} L ${bracketRightX} ${tileY - 8} L ${bracketRightX} ${tileY + tileH + 8} L ${bracketRightX - 9} ${tileY + tileH + 8}`}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Entity multiplicity subscript when more than one entity balances the counter ion */}
      {showEntitySubscript && (
        <text
          x={bracketRightX + 9}
          y={tileY + tileH + 10}
          textAnchor="middle"
          fontSize={17}
          fontWeight={700}
          fill="var(--fg)"
          data-testid="entity-count-subscript"
        >
          {String(result.entityCount)}
        </text>
      )}

      {/* Right counter ion (anion) */}
      {showRightCounter && rightCounterX !== null && counterObj && (
        <g>
          <rect
            x={rightCounterX}
            y={tileY}
            width={counterW}
            height={tileH}
            rx={8}
            fill="var(--ion-anion)"
            fillOpacity={0.14}
            stroke="var(--ion-anion)"
            strokeWidth={1.8}
            strokeDasharray="5 3"
          />
          <text
            x={rightCounterX + counterW / 2}
            y={tileY + 30}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            fill="var(--fg)"
          >
            {`${result.counterIonCount} ${formatCounterIonBadge(counterObj)}`}
          </text>
          <text
            x={rightCounterX + counterW / 2}
            y={tileY + 54}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
          >
            counter
          </text>
        </g>
      )}

      {/* Charge balance equation bar */}
      <rect
        x={22}
        y={118}
        width={SVG_W - 44}
        height={44}
        rx={10}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <text x={SVG_W / 2} y={146} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {hideNameDetails
          ? `Entity charge: ${signedText(spec.oxidationState)} + (${signedText(result.ligandChargeSum)}) = ${signedText(result.entityCharge)}`
          : `Entity charge: ${signedText(spec.oxidationState)} + (${signedText(result.ligandChargeSum)}) = ${signedText(result.entityCharge)}  |  CN = ${result.coordinationNumber}`}
      </text>
    </svg>
  )
}

export function ComplexNamer() {
  const [mode, setMode] = useState<'forward' | 'reverse'>('forward')
  const [spec, setSpec] = useState<ComplexSpec>(DEFAULT_COMPLEX)
  const [challengeIdx, setChallengeIdx] = useState(0)
  const [checkResult, setCheckResult] = useState<{ matched: boolean; feedback: string } | null>(null)
  const [revealed, setRevealed] = useState(false)

  const result = evaluateComplex(spec)
  const challenge = REVERSE_CHALLENGES[challengeIdx]
  const oxStates = oxidationStatesForMetal(spec.metal)

  const updateMetal = (metal: MetalSymbol) => {
    const allowed = oxidationStatesForMetal(metal)
    const nextOx = allowed.includes(spec.oxidationState) ? spec.oxidationState : allowed[allowed.length - 1]
    setSpec((prev) => ({ ...prev, metal, oxidationState: nextOx }))
    setCheckResult(null)
  }

  const updateOx = (oxidationState: number) => {
    setSpec((prev) => ({ ...prev, oxidationState }))
    setCheckResult(null)
  }

  const updateSlot = (index: 0 | 1 | 2, patch: Partial<LigandSlot>) => {
    setSpec((prev) => {
      const next: [LigandSlot, LigandSlot, LigandSlot] = [
        { ...prev.slots[0] },
        { ...prev.slots[1] },
        { ...prev.slots[2] },
      ]
      next[index] = { ...next[index], ...patch }
      return { ...prev, slots: next }
    })
    setCheckResult(null)
  }

  const updateCounter = (counterIon: CounterIonId) => {
    setSpec((prev) => ({ ...prev, counterIon }))
    setCheckResult(null)
  }

  const switchMode = (nextMode: 'forward' | 'reverse') => {
    setMode(nextMode)
    setCheckResult(null)
    setRevealed(false)
    if (nextMode === 'reverse') {
      // Clear slots to a neutral starting point for the learner to build
      setSpec({
        metal: 'Co',
        oxidationState: 3,
        slots: [
          { formula: 'NH3', count: 0 },
          { formula: 'Cl', count: 0 },
          { formula: 'H2O', count: 0 },
        ],
        counterIon: 'none',
      })
    } else {
      setSpec(DEFAULT_COMPLEX)
    }
  }

  const nextChallenge = () => {
    setChallengeIdx((i) => (i + 1) % REVERSE_CHALLENGES.length)
    setCheckResult(null)
    setRevealed(false)
    setSpec({
      metal: 'Co',
      oxidationState: 3,
      slots: [
        { formula: 'NH3', count: 0 },
        { formula: 'Cl', count: 0 },
        { formula: 'H2O', count: 0 },
      ],
      counterIon: 'none',
    })
  }

  const handleCheck = () => {
    setCheckResult(checkReverseMatch(spec, challenge))
  }

  const handleReveal = () => {
    setSpec(challenge.spec)
    setRevealed(true)
    setCheckResult({
      matched: true,
      feedback: `Answer loaded: ${evaluateComplex(challenge.spec).fullFormula}`,
    })
  }

  const liveSummary =
    mode === 'forward'
      ? `Formula ${result.fullFormula}. Name ${result.fullName}. Entity charge ${signedText(result.entityCharge)}.`
      : `Name to formula challenge: ${challenge.targetName}. Current formula ${result.fullFormula}. ${checkResult ? checkResult.feedback : ''}`

  return (
    <div className={styles.sim}>
      {/* Mode toggle bar */}
      <div className={styles.modeBar} role="group" aria-label="Simulation direction">
        <button
          type="button"
          className={`${styles.modeButton} ${mode === 'forward' ? styles.modeActive : ''}`}
          aria-pressed={mode === 'forward'}
          onClick={() => switchMode('forward')}
        >
          Formula to name
        </button>
        <button
          type="button"
          className={`${styles.modeButton} ${mode === 'reverse' ? styles.modeActive : ''}`}
          aria-pressed={mode === 'reverse'}
          onClick={() => switchMode('reverse')}
        >
          Name to formula
        </button>
      </div>

      {/* Reverse mode challenge banner */}
      {mode === 'reverse' && (
        <div className={styles.challengeCard}>
          <div className={styles.challengeHeader}>
            <span className={styles.fieldLabel}>
              {`Target name (${challengeIdx + 1} of ${REVERSE_CHALLENGES.length})`}
            </span>
            <button type="button" className={styles.secondaryButton} onClick={nextChallenge}>
              Next name
            </button>
          </div>
          <p className={styles.challengeName}>{challenge.targetName}</p>
          <p className={styles.challengePrompt}>
            Choose the central metal, oxidation state, ligand slots and counter ion below, then check your formula.
          </p>
        </div>
      )}

      {/* Inputs: Metal, Oxidation State, Counter Ion */}
      <div className={styles.controlsGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Central metal</span>
          <select
            className={styles.select}
            value={spec.metal}
            onChange={(e) => updateMetal(e.target.value as MetalSymbol)}
          >
            {SIM_METALS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Oxidation state</span>
          <select
            className={styles.select}
            value={spec.oxidationState}
            onChange={(e) => updateOx(Number(e.target.value))}
          >
            {oxStates.map((st) => (
              <option key={st} value={st}>
                {`${signedText(st)} (${romanNumeral(st)})`}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Counter ion</span>
          <select
            className={styles.select}
            value={result.entityCharge === 0 && spec.counterIon === 'none' ? 'none' : spec.counterIon}
            disabled={result.entityCharge === 0 && spec.counterIon === 'none'}
            onChange={(e) => updateCounter(e.target.value as CounterIonId)}
          >
            <option value="none">
              {result.entityCharge === 0 ? 'None (neutral entity)' : 'None (bare ion)'}
            </option>
            {SIM_COUNTER_IONS.map((ion) => (
              <option key={ion.formula} value={ion.formula}>
                {`${formatCounterIonBadge(ion)} (${ion.name})`}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Inputs: Three Ligand Slots */}
      <div className={styles.slotsGrid}>
        {([0, 1, 2] as const).map((idx) => {
          const slot = spec.slots[idx]
          return (
            <div key={idx} className={styles.slotCard}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{`Ligand slot ${idx + 1}`}</span>
                <select
                  className={styles.select}
                  value={slot.formula}
                  onChange={(e) => updateSlot(idx, { formula: e.target.value as SimLigandFormula })}
                >
                  {SIM_LIGANDS.map((l) => (
                    <option key={l.formula} value={l.formula}>
                      {`${formatLigandBadge(l)} (${l.name})`}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>{`Count ${idx + 1}: ${slot.count}`}</span>
                <input
                  className={styles.slider}
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  aria-label={`Ligand slot ${idx + 1} count`}
                  value={slot.count}
                  onChange={(e) => updateSlot(idx, { count: Number(e.target.value) })}
                />
              </label>
            </div>
          )
        })}
      </div>

      {/* Stage: SVG Diagram + Formula & Name Readouts */}
      <div className={styles.stage}>
        <ComplexDiagram spec={spec} result={result} hideNameDetails={mode === 'reverse' && !revealed} />

        {!result.balanced && result.balanceNote && (
          <div className={styles.warningBox} role="status">
            <p className={styles.warningText}>{result.balanceNote}</p>
            {result.nearestChoice && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => updateCounter(result.nearestChoice!.counterIon)}
              >
                {result.nearestChoice.label}
              </button>
            )}
          </div>
        )}

        <div className={styles.readouts}>
          <div className={styles.readoutCard}>
            <span className={styles.readoutLabel}>Formula</span>
            <p className={styles.formulaValue} data-testid="complex-formula">
              {result.fullFormula}
            </p>
            <p className={styles.metaLine}>
              {result.counterIonCount > 0 && result.balanced
                ? `Balanced with ${result.counterIonCount} counter ion${result.counterIonCount === 1 ? '' : 's'} per ${result.entityCount} entit${result.entityCount === 1 ? 'y' : 'ies'}.`
                : result.entityCharge === 0
                  ? 'Neutral entity: no counter ion needed.'
                  : 'Bare coordination ion (no counter ion selected).'}
            </p>
          </div>

          {mode === 'forward' ? (
            <div className={styles.readoutCard}>
              <span className={styles.readoutLabel}>Systematic IUPAC name</span>
              <p className={styles.nameValue} data-testid="complex-name">
                {result.fullName}
              </p>
              <p className={styles.metaLine}>
                {`Entity charge: ${signedText(result.entityCharge)} (${result.entityCharge > 0 ? 'cation' : result.entityCharge < 0 ? 'anion' : 'neutral'})`}
              </p>
            </div>
          ) : (
            <div className={styles.readoutCard}>
              <span className={styles.readoutLabel}>Check your formula</span>
              <div className={styles.reverseActions}>
                <button type="button" className={styles.primaryButton} onClick={handleCheck}>
                  Check formula
                </button>
                <button type="button" className={styles.secondaryButton} onClick={handleReveal}>
                  Reveal answer
                </button>
              </div>
              {checkResult && (
                <p
                  className={checkResult.matched ? styles.matchFeedback : styles.missFeedback}
                  data-testid="reverse-feedback"
                >
                  {checkResult.feedback}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Rule Chips */}
        <div className={styles.rulesWrap} aria-label="Applied naming rules">
          {result.rules.map((r) => (
            <span
              key={r.id}
              className={`${styles.ruleChip} ${r.active ? styles.ruleChipActive : ''}`}
              data-rule={r.id}
              data-active={r.active ? 'true' : 'false'}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
