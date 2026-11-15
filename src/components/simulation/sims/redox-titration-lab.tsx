'use client'

import React, { useRef, useState, useId, useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  REDOX_TITRATIONS,
  equivalenceVolume,
  titrationState,
  type RedoxTitrationType,
} from '@/lib/chem/redox-titration'
import {
  TITRATION_EQUATIONS_MHCHEM,
  flaskAppearance,
  formatMolesText,
  progressToward,
} from '@/lib/chem/redox-titration-display'
import styles from './redox-titration-lab.module.css'

/** One mhchem equation (pure mhchem, no outer \\ce{}) rendered with KaTeX. */
function MhchemEquation({ equation }: { equation: string }) {
  const html = useMemo(
    () => katex.renderToString(`\\ce{${equation}}`, { throwOnError: false }),
    [equation],
  )
  return <span className={styles.chemEquation} dangerouslySetInnerHTML={{ __html: html }} />
}

interface TitrationPreset {
  titrantMolarity: number
  analyteMolarity: number
  analyteVolumeMl: number
  titrantName: string
  analyteName: string
  titrantColor: string
  indicatorName: string
}

const PRESETS: Record<RedoxTitrationType, TitrationPreset> = {
  'permanganate-fe': {
    titrantMolarity: 0.02,
    analyteMolarity: 0.05,
    analyteVolumeMl: 20.0,
    titrantName: 'KMnO₄',
    analyteName: 'Fe²⁺ (Mohr salt)',
    titrantColor: 'var(--sol-mno4)',
    indicatorName: 'Self-indicator (MnO₄⁻)',
  },
  'permanganate-oxalate': {
    titrantMolarity: 0.02,
    analyteMolarity: 0.05,
    analyteVolumeMl: 20.0,
    titrantName: 'KMnO₄',
    analyteName: 'C₂O₄²⁻ (Oxalate)',
    titrantColor: 'var(--sol-mno4)',
    indicatorName: 'Self-indicator (MnO₄⁻)',
  },
  'dichromate-fe': {
    titrantMolarity: 0.02,
    analyteMolarity: 0.06,
    analyteVolumeMl: 20.0,
    titrantName: 'K₂Cr₂O₇',
    analyteName: 'Fe²⁺ (Mohr salt)',
    titrantColor: '#EA580C',
    indicatorName: 'Diphenylamine',
  },
  'iodometric-cu-thiosulphate': {
    titrantMolarity: 0.05,
    analyteMolarity: 0.05,
    analyteVolumeMl: 20.0,
    titrantName: 'Na₂S₂O₃',
    analyteName: 'Cu²⁺ (with excess KI)',
    titrantColor: 'var(--glass-fill)',
    indicatorName: 'Starch indicator',
  },
}

const TITRATION_OPTIONS: readonly { value: RedoxTitrationType; label: string }[] = [
  { value: 'permanganate-fe', label: 'MnO₄⁻ / Fe²⁺' },
  { value: 'permanganate-oxalate', label: 'MnO₄⁻ / C₂O₄²⁻' },
  { value: 'dichromate-fe', label: 'Cr₂O₇²⁻ / Fe²⁺' },
  { value: 'iodometric-cu-thiosulphate', label: 'Iodometry (Cu²⁺ / S₂O₃²⁻)' },
]

export function RedoxTitrationLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const clipId = useId()

  const [type, setType] = useState<RedoxTitrationType>('permanganate-fe')
  const [analyteVolumeMl, setAnalyteVolumeMl] = useState(20.0)
  const [analyteMolarity, setAnalyteMolarity] = useState(0.05)
  const [titrantMolarity, setTitrantMolarity] = useState(0.02)
  const [addedMl, setAddedMl] = useState(0.0)
  const [dropping, setDropping] = useState(false)
  const [starchAdded, setStarchAdded] = useState(false)

  const preset = PRESETS[type]
  const stoichiometry = REDOX_TITRATIONS[type]

  // Calculate stoichiometric equivalence point via chemistry lib
  const eqVol = equivalenceVolume(
    titrantMolarity,
    analyteMolarity,
    analyteVolumeMl,
    type
  )

  // Current titration state (volumes, moles, equivalence) from the foundation lib
  const state = titrationState(addedMl, {
    titrationType: type,
    titrantMolarity,
    analyteMolarity,
    analyteVolumeMl,
  })
  const isPastOrAt = state.isAtEquivalence || state.isPastEquivalence
  const appearance = flaskAppearance({ type, addedMl, eqVolMl: eqVol, starchAdded })
  const progress = progressToward(addedMl, eqVol)

  // Flask solution colour: the stage decides the hue, the fraction decides the strength
  let flaskColor = 'var(--glass-fill)'
  let flaskOpacity = 0.45

  if (type === 'permanganate-fe' || type === 'permanganate-oxalate') {
    if (isPastOrAt) {
      flaskColor = 'var(--sol-pink)'
      flaskOpacity = 0.85
    } else {
      flaskColor = 'var(--glass-fill)'
      flaskOpacity = 0.35
    }
  } else if (type === 'dichromate-fe') {
    if (isPastOrAt) {
      // Diphenylamine after equivalence: intense violet-blue
      flaskColor = '#2563EB'
      flaskOpacity = 0.92
    } else {
      // Faint green from Fe2+ at 0 mL, deepening to green as Cr3+ accumulates
      flaskColor = '#10B981'
      flaskOpacity = 0.12 + 0.6 * progress
    }
  } else if (type === 'iodometric-cu-thiosulphate') {
    if (isPastOrAt) {
      // Blue-black discharged: off-white Cu2I2 suspension
      flaskColor = '#F8FAFC'
      flaskOpacity = 0.75
    } else if (starchAdded) {
      // Starch-iodine complex: intense blue-black
      flaskColor = '#0F172A'
      flaskOpacity = 0.95
    } else if (addedMl <= 0) {
      // Excess KI: brown with I3- and an off-white Cu2I2 precipitate
      flaskColor = '#92400E'
      flaskOpacity = 0.88
    } else if (progress >= 0.75) {
      // Fading to pale straw yellow: time to add starch
      flaskColor = '#FEF08A'
      flaskOpacity = 0.6
    } else {
      flaskColor = '#D97706'
      flaskOpacity = 0.75
    }
  }

  // Read-only summary for screen readers, with moles in scientific notation
  const srSummary =
    `Delivered ${addedMl.toFixed(2)} mL of ${preset.titrantName} out of ${eqVol.toFixed(2)} mL needed. ` +
    `Flask: ${appearance}. ` +
    (state.isBeforeEquivalence
      ? `Analyte remaining: ${formatMolesText(state.remainingAnalyteMoles)}.`
      : state.isAtEquivalence
        ? 'At the equivalence point there is no excess titrant.'
        : `Titrant in excess: ${formatMolesText(state.excessTitrantMoles)}.`)

  // Switch titration preset
  const handleTypeChange = (newType: RedoxTitrationType) => {
    setType(newType)
    const p = PRESETS[newType]
    setTitrantMolarity(p.titrantMolarity)
    setAnalyteMolarity(p.analyteMolarity)
    setAnalyteVolumeMl(p.analyteVolumeMl)
    setAddedMl(0.0)
    setDropping(false)
    setStarchAdded(false)
  }

  // Add titrant increment
  const deliverTitrant = (deltaMl: number) => {
    setDropping(true)
    const next = Math.min(25.0, Math.max(0, +(addedMl + deltaMl).toFixed(2)))
    setAddedMl(next)
    if (!reducedMotion) {
      setTimeout(() => setDropping(false), 300)
    } else {
      setDropping(false)
    }
  }

  // Jump straight to equivalence point
  const jumpToEquivalence = () => {
    setDropping(true)
    setAddedMl(+eqVol.toFixed(2))
    if (type === 'iodometric-cu-thiosulphate') {
      setStarchAdded(true)
    }
    if (!reducedMotion) {
      setTimeout(() => setDropping(false), 300)
    } else {
      setDropping(false)
    }
  }

  // Reset burette to 0.0 mL
  const resetBurette = () => {
    setAddedMl(0.0)
    setDropping(false)
    setStarchAdded(false)
  }

  // Step-by-step stoichiometric deduction values
  const nTitrantDeliveredMmol = addedMl * titrantMolarity
  const nAnalyteCalculatedMmol = nTitrantDeliveredMmol / stoichiometry.titrantPerAnalyteRatio
  const calculatedMolarity = (nAnalyteCalculatedMmol / analyteVolumeMl)

  // Burette graphics math (25 mL capacity)
  const maxBurette = 25.0
  const burFrac = Math.min(1, Math.max(0, addedMl / maxBurette))
  const burScaleStartY = -180
  const burScaleEndY = 30
  const meniscusY = burScaleStartY + burFrac * (burScaleEndY - burScaleStartY)

  return (
    <div ref={rootRef} className={styles.container}>
      {/* Controls row portalled to Simulation header/footer */}
      <SimulationControls>
        <div className={styles.controlsGrid}>
          {/* 1. Titration Selection */}
          <div className={styles.controlsRow}>
            <Segmented
              label="Select redox titration"
              options={TITRATION_OPTIONS}
              value={type}
              onChange={handleTypeChange}
            />
          </div>

          {/* 2. Experimental Parameters */}
          <div className={styles.controlsRow}>
            <div style={{ flex: '1 1 200px' }}>
              <Slider
                label={`Volume of ${preset.analyteName}`}
                min={10}
                max={25}
                step={5}
                unit="mL"
                value={analyteVolumeMl}
                onChange={(val) => {
                  setAnalyteVolumeMl(val)
                  setAddedMl(0.0)
                }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <Slider
                label={`Unknown ${preset.analyteName} Molarity`}
                min={0.02}
                max={0.1}
                step={0.01}
                unit="M"
                value={analyteMolarity}
                onChange={(val) => {
                  setAnalyteMolarity(val)
                  setAddedMl(0.0)
                }}
              />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <Slider
                label={`Standard ${preset.titrantName} Titrant`}
                min={0.01}
                max={0.05}
                step={0.005}
                unit="M"
                value={titrantMolarity}
                onChange={(val) => {
                  setTitrantMolarity(val)
                  setAddedMl(0.0)
                }}
              />
            </div>
          </div>

          {/* 3. Delivery Actions */}
          <div className={styles.controlsRow}>
            <div className={styles.buttonGroup}>
              <Button
                variant="primary"
                onClick={() => deliverTitrant(0.05)}
                disabled={addedMl >= 25.0}
              >
                +1 Drop (0.05 mL)
              </Button>
              <Button
                variant="primary"
                onClick={() => deliverTitrant(1.0)}
                disabled={addedMl >= 25.0}
              >
                +1.0 mL
              </Button>
              <Button
                variant="primary"
                onClick={() => deliverTitrant(5.0)}
                disabled={addedMl >= 25.0}
              >
                +5.0 mL
              </Button>
              <Button
                variant="secondary"
                onClick={jumpToEquivalence}
                disabled={addedMl >= 25.0 || Math.abs(addedMl - eqVol) < 0.01}
              >
                Jump to End Point ({eqVol.toFixed(1)} mL)
              </Button>
              {type === 'iodometric-cu-thiosulphate' && (
                <Button
                  variant={addedMl >= 0.75 * eqVol && !starchAdded ? 'primary' : 'secondary'}
                  onClick={() => setStarchAdded(true)}
                  disabled={starchAdded || addedMl < 0.75 * eqVol}
                >
                  {starchAdded ? '✓ Starch Indicator Added' : 'Add Starch Indicator'}
                </Button>
              )}
              <Button variant="secondary" onClick={resetBurette}>
                Reset
              </Button>
            </div>
          </div>

          {/* Iodometry contextual starch guidance note */}
          {type === 'iodometric-cu-thiosulphate' && addedMl >= 0.75 * eqVol && !starchAdded && !isPastOrAt && (
            <div className={styles.starchNotice}>
              <strong>Indicator notice:</strong> Solution has faded to pale straw yellow. Click <strong>Add Starch Indicator</strong> now to form the deep blue-black polyiodide complex before titrating to the end point!
            </div>
          )}
          {type === 'iodometric-cu-thiosulphate' && starchAdded && !isPastOrAt && (
            <div className={styles.starchNoticeActive}>
              <strong>Starch added:</strong> Deep blue-black complex formed. Deliver titrant drop by drop (+0.05 mL) until the blue colour completely discharges!
            </div>
          )}
        </div>
      </SimulationControls>

      {/* Main interactive stage */}
      <div className={styles.stageGrid}>
        {/* Left: Titration Rig Apparatus */}
        <div className={styles.rigCard}>
          <svg
            viewBox="-160 -230 320 480"
            className={styles.rigSvg}
            role="img"
            aria-label={`Burette at ${addedMl.toFixed(2)} mL, flask: ${appearance}`}
          >
            <defs>
              {/* Burette interior clip */}
              <clipPath id={`bur-clip-${clipId}`}>
                <path d="M -10 -205 L 10 -205 L 10 42 L 3.5 56 L 2.5 80 L -2.5 80 L -3.5 56 L -10 42 Z" />
              </clipPath>
              {/* Flask interior clip */}
              <clipPath id={`flask-clip-${clipId}`}>
                <path d="M -18 108 L 18 108 L 18 132 L 61 203 Q 66 208 56 208 L -56 208 Q -66 208 -61 203 L -18 132 Z" />
              </clipPath>
            </defs>

            {/* Stand base plate & rod */}
            <rect
              x={-130}
              y={202}
              width={90}
              height={14}
              rx={3}
              fill="var(--fg-muted)"
              stroke="var(--fg)"
              strokeWidth={1.2}
            />
            <line
              x1={-85}
              y1={-212}
              x2={-85}
              y2={210}
              stroke="var(--fg-muted)"
              strokeWidth={5}
              strokeLinecap="round"
            />
            {/* Upper & lower clamps */}
            <rect x={-85} y={-126} width={85} height={12} rx={2} fill="var(--fg-muted)" />
            <rect x={-85} y={9} width={85} height={12} rx={2} fill="var(--fg-muted)" />

            {/* White Tile */}
            <rect
              x={-75}
              y={210}
              width={150}
              height={12}
              rx={3}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.4}
            />
            <text
              x={0}
              y={236}
              textAnchor="middle"
              fontSize={13}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
              fontWeight={500}
            >
              White tile
            </text>

            {/* Conical Flask Solution */}
            <g clipPath={`url(#flask-clip-${clipId})`}>
              <rect
                x={-75}
                y={156}
                width={150}
                height={60}
                fill={flaskColor}
                opacity={flaskOpacity}
              />
              <line
                x1={-60}
                y1={156}
                x2={60}
                y2={156}
                stroke={flaskColor}
                strokeWidth={2}
                opacity={0.9}
              />
              {/* For iodometric titration, render the insoluble off-white Cu2I2 precipitate */}
              {type === 'iodometric-cu-thiosulphate' && (
                <g>
                  <ellipse cx={0} cy={204} rx={50} ry={5} fill="#F8FAFC" opacity={0.88} stroke="#CBD5E1" strokeWidth={0.8} />
                  <text
                    x={0}
                    y={201}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fontFamily="var(--font-sans)"
                    fill="#475569"
                    stroke="var(--surface-raised)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    Cu₂I₂ (off-white ppt)
                  </text>
                </g>
              )}
            </g>
            {/* Flask glass contour */}
            <path
              d="M -18 108 L 18 108 L 18 132 L 61 203 Q 66 208 56 208 L -56 208 Q -66 208 -61 203 L -18 132 Z"
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <line
              x1={-36}
              y1={145}
              x2={-56}
              y2={195}
              stroke="var(--glass-sheen)"
              strokeWidth={2.8}
              strokeLinecap="round"
            />

            {/* Burette Glass & Liquid */}
            <g clipPath={`url(#bur-clip-${clipId})`}>
              <rect
                x={-12}
                y={meniscusY}
                width={24}
                height={80 - meniscusY}
                fill={preset.titrantColor}
                opacity={0.9}
              />
              <ellipse cx={0} cy={meniscusY} rx={10} ry={2.8} fill={preset.titrantColor} />
            </g>
            <path
              d="M -10 -205 L -10 42 L -3.5 56 L -2.5 80 M 2.5 80 L 3.5 56 L 10 42 L 10 -205"
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={2}
            />
            <line x1={-13} y1={-205} x2={13} y2={-205} stroke="var(--glass-wall)" strokeWidth={2} />

            {/* Graduations */}
            {[0, 5, 10, 15, 20, 25].map((tick) => {
              const ty = burScaleStartY + (tick / maxBurette) * (burScaleEndY - burScaleStartY)
              return (
                <g key={tick}>
                  <line x1={4} y1={ty} x2={10} y2={ty} stroke="var(--glass-wall)" strokeWidth={1.4} />
                  <text
                    x={16}
                    y={ty}
                    dominantBaseline="central"
                    fontSize={13}
                    fontFamily="var(--font-sans)"
                    fill="var(--fg-muted)"
                    fontWeight={500}
                  >
                    {tick}
                  </text>
                </g>
              )
            })}

            {/* Stopcock */}
            <circle cx={0} cy={46} r={7} fill="var(--fg-muted)" stroke="var(--glass-wall)" strokeWidth={1.4} />
            {dropping ? (
              <line x1={0} y1={32} x2={0} y2={60} stroke="var(--fg)" strokeWidth={3.2} strokeLinecap="round" />
            ) : (
              <line x1={-14} y1={46} x2={14} y2={46} stroke="var(--fg)" strokeWidth={3.2} strokeLinecap="round" />
            )}

            {/* Falling droplets */}
            {dropping && (
              <g>
                <circle cx={0} cy={89} r={3.2} fill={preset.titrantColor} />
                <circle cx={0} cy={102} r={3.5} fill={preset.titrantColor} />
              </g>
            )}

            {/* Readout Callout */}
            <g transform={`translate(38, ${meniscusY})`}>
              <line x1={-14} y1={0} x2={0} y2={0} stroke="var(--border)" strokeWidth={1.4} strokeDasharray="2 2" />
              <rect x={0} y={-14} width={86} height={28} rx={5} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.4} />
              <text
                x={43}
                y={0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={15}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                {addedMl.toFixed(1)} <tspan className="sym">mL</tspan>
              </text>
            </g>

            {/* End Point Callout Badge */}
            {isPastOrAt && (
              <g transform="translate(76, 162)">
                <rect x={0} y={-14} width={80} height={28} rx={5} fill="var(--surface-raised)" stroke="var(--success)" strokeWidth={1.5} />
                <text
                  x={40}
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fontWeight={700}
                  fontFamily="var(--font-sans)"
                  fill="var(--success)"
                >
                  End point
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Right: Telemetry & Stoichiometric Deduction */}
        <div className={styles.telemetryCard}>
          <div className={styles.hudHeader}>
            <div className={styles.hudTitleGroup}>
              <span className={styles.hudKicker}>{preset.indicatorName}</span>
              <h4 className={styles.hudTitle}>{preset.titrantName} vs {preset.analyteName}</h4>
            </div>
            <span
              className={`${styles.statusBadge} ${
                state.isAtEquivalence
                  ? styles.statusAt
                  : state.isPastEquivalence
                  ? styles.statusPast
                  : styles.statusBefore
              }`}
            >
              {state.isAtEquivalence
                ? 'Equivalence Reached'
                : state.isPastEquivalence
                ? 'Past Equivalence'
                : 'Before Equivalence'}
            </span>
          </div>

          {/* Metric cards */}
          <div className={styles.metricsRow}>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Titrant Delivered (<span className="sym">V</span>)</span>
              <span className={styles.metricValue}>{addedMl.toFixed(2)} mL</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Equivalence Volume (<span className="sym">V</span>ₑ)</span>
              <span className={styles.metricValue}>{eqVol.toFixed(2)} mL</span>
            </div>
            <div className={styles.metricBox}>
              <span className={styles.metricLabel}>Flask Colour</span>
              <span className={styles.metricValue} style={{ fontSize: '14px', lineHeight: 1.25 }}>
                {appearance}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className={styles.progressBarContainer}>
            <div className={styles.progressLabels}>
              <span>Titration Progress</span>
              <span>{(state.progressFraction * 100).toFixed(1)}%</span>
            </div>
            <div className={styles.progressBarTrack}>
              <div
                className={styles.progressBarFill}
                style={{
                  width: `${Math.min(100, state.progressFraction * 100)}%`,
                  background: isPastOrAt ? 'var(--success)' : 'var(--ox)',
                }}
              />
            </div>
          </div>

          {/* Stoichiometric Deduction when at or past end point */}
          {isPastOrAt ? (
            <div className={styles.deductionCard}>
              <div className={styles.deductionTitle}>
                <span>✓ Stoichiometric Deduction of Unknown Concentration</span>
              </div>
              <div className={styles.deductionSteps}>
                <div className={styles.deductionStep}>
                  <div className={styles.stepNum}>1</div>
                  <div className={styles.stepContent}>
                    <strong>Balanced Redox Reaction:</strong>
                    {TITRATION_EQUATIONS_MHCHEM[type].map((eq) => (
                      <MhchemEquation key={eq} equation={eq} />
                    ))}
                    <span>
                      Molar ratio: {stoichiometry.titrantPerAnalyteRatio === 1 ? '1 : 1' : `1 mol titrant ≡ ${(1 / stoichiometry.titrantPerAnalyteRatio).toFixed(1)} mol analyte`}
                    </span>
                  </div>
                </div>

                <div className={styles.deductionStep}>
                  <div className={styles.stepNum}>2</div>
                  <div className={styles.stepContent}>
                    <strong>Moles of Standard Titrant Delivered:</strong>
                    <div className={styles.stepMath}>
                      n(titrant) = M × V = {titrantMolarity.toFixed(3)} M × {addedMl.toFixed(2)} mL = {nTitrantDeliveredMmol.toFixed(4)} mmol
                    </div>
                  </div>
                </div>

                <div className={styles.deductionStep}>
                  <div className={styles.stepNum}>3</div>
                  <div className={styles.stepContent}>
                    <strong>Moles of Analyte Consumed at Equivalence:</strong>
                    <div className={styles.stepMath}>
                      n(analyte) = n(titrant) / ratio = {nAnalyteCalculatedMmol.toFixed(4)} mmol
                    </div>
                  </div>
                </div>

                <div className={styles.deductionStep}>
                  <div className={styles.stepNum}>4</div>
                  <div className={styles.stepContent}>
                    <strong>Calculated Unknown Concentration:</strong>
                    <div className={styles.stepMath}>
                      M(analyte) = n(analyte) / V(analyte) = {nAnalyteCalculatedMmol.toFixed(4)} mmol / {analyteVolumeMl.toFixed(1)} mL = {calculatedMolarity.toFixed(4)} M
                    </div>
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '12px' }}>
                      Exact target was {analyteMolarity.toFixed(3)} M ({Math.abs(calculatedMolarity - analyteMolarity) < 0.002 ? 'Perfect match' : 'Overshoot error: ' + ((calculatedMolarity - analyteMolarity) / analyteMolarity * 100).toFixed(1) + '%'})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.guidanceCard}>
              <strong>How to reach the end point:</strong> Deliver titrant from the burette in small increments. As you near the equivalence volume ({eqVol.toFixed(1)} mL), deliver single drops (+0.05 mL). The end point is signaled as soon as the indicator colour permanently changes over the white tile!
            </div>
          )}
        </div>
      </div>

      {/* Screen reader live region */}
      <p className="sr-only" aria-live="polite">
        {srSummary}
      </p>
    </div>
  )
}
export default RedoxTitrationLab
