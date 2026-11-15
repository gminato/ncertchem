'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { ReactionBeaker, type IonParticle } from '@/components/redox/ReactionBeaker'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  cellEmf,
  displacementOutcome,
  lookupPotential,
} from '@/lib/chem/electrode-potentials'
import { balanceRedox } from '@/lib/chem/redox-balance'
import styles from './metal-displacement-lab.module.css'

export type StripMetal = 'Mg' | 'Zn' | 'Fe' | 'Pb' | 'Cu' | 'Ag' | 'Co'
export type SolutionIon = 'Cu2+' | 'Ag+' | 'Zn2+' | 'Fe2+' | 'Pb2+' | 'Ni2+'

const STRIP_OPTIONS: ReadonlyArray<{ value: StripMetal; label: string }> = [
  { value: 'Mg', label: 'Mg' },
  { value: 'Zn', label: 'Zn' },
  { value: 'Fe', label: 'Fe' },
  { value: 'Pb', label: 'Pb' },
  { value: 'Cu', label: 'Cu' },
  { value: 'Ag', label: 'Ag' },
]

const SOLUTION_OPTIONS: ReadonlyArray<{ value: SolutionIon; label: string }> = [
  { value: 'Cu2+', label: 'Cu²⁺' },
  { value: 'Ag+', label: 'Ag⁺' },
  { value: 'Zn2+', label: 'Zn²⁺' },
  { value: 'Fe2+', label: 'Fe²⁺' },
  { value: 'Pb2+', label: 'Pb²⁺' },
]

/** Full activity series subset displayed in the series strip. */
interface ActivitySeriesItem {
  symbol: string
  e0: number
  isNonNcert?: boolean
}

const ACTIVITY_SERIES_DISPLAY: readonly ActivitySeriesItem[] = [
  { symbol: 'Mg', e0: -2.36 },
  { symbol: 'Zn', e0: -0.76 },
  { symbol: 'Fe', e0: -0.44 },
  { symbol: 'Co', e0: -0.28, isNonNcert: true },
  { symbol: 'Ni', e0: -0.25 },
  { symbol: 'Pb', e0: -0.13 },
  { symbol: 'Cu', e0: 0.34 },
  { symbol: 'Ag', e0: 0.80 },
]

/** Formats signed volts e.g. +1.10 V or −0.76 V using true unicode minus. */
function formatSignedVolts(val: number): string {
  const sign = val >= 0 ? '+' : '−'
  const absStr = Math.abs(val).toFixed(2)
  return `${sign}${absStr} V`
}

/** Formats an ion key with proper superscript charge notation. */
function formatIonDisplay(ion: string): string {
  return ion.replace('2+', '²⁺').replace('+', '⁺')
}

/**
 * Metal Displacement Lab Simulation (Unit 7, Section 7.2.1).
 *
 * Demonstrates competitive electron transfer:
 * - Dip various metal strips into metal cation solutions
 * - Spontaneous displacement occurs only when E°cell > 0
 * - Coating and solution colour change dynamically via ReactionBeaker
 * - Balance and E°cell are verified through chem libs
 * - Clearly highlights activity series hierarchy (Mg > Zn > Fe > Pb > Cu > Ag)
 * - Flags Co/Ni as non-NCERT value when loaded.
 */
export function MetalDisplacementLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const seriesGradId = `mdl-grad-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  const [metal, setMetal] = useState<StripMetal>('Zn')
  const [ion, setIon] = useState<SolutionIon>('Cu2+')
  const [isDipped, setIsDipped] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCoNiCase, setIsCoNiCase] = useState(false)

  // Determine active species based on case
  const activeMetal: StripMetal = isCoNiCase ? 'Co' : metal
  const activeIon: SolutionIon = isCoNiCase ? 'Ni2+' : ion

  // Chemistry calculations from libraries
  const eCathode = lookupPotential(activeIon)
  const eAnode = lookupPotential(activeMetal)
  const emf = cellEmf(activeIon, activeMetal)
  const outcome = displacementOutcome(activeMetal, activeIon)

  // Calculate balanced equation via lib
  const equationData = useMemo(() => {
    const cleanIonMetal = activeIon === 'Ag+' ? 'Ag' : activeIon.replace('2+', '')
    if (activeMetal === cleanIonMetal) {
      return {
        equationText: `${activeMetal}(s) + ${activeIon}(aq) ⇌ ${activeMetal}²⁺(aq) + ${activeMetal}(s)`,
        isReaction: false,
      }
    }
    if (outcome === 'no visible reaction') {
      return {
        equationText: 'No visible reaction (thermodynamically non-spontaneous)',
        isReaction: false,
      }
    }
    if (outcome === 'moderate both ways') {
      return {
        equationText: `${activeMetal}(s) + ${activeIon}(aq) ⇌ ${activeMetal}²⁺(aq) + ${cleanIonMetal}(s)`,
        isReaction: true,
      }
    }

    try {
      const ionProduct = activeIon === 'Ag+' ? 'Ag' : cleanIonMetal
      const skel = `${activeMetal} + ${activeIon} -> ${activeMetal}2+ + ${ionProduct}`
      const balanced = balanceRedox(skel, 'acidic')
      return {
        equationText: balanced.equationString
          .replace('->', '→')
          .replace('2+', '²⁺')
          .replace('+', '⁺'),
        isReaction: true,
      }
    } catch {
      return {
        equationText: `${activeMetal}(s) + ${activeIon}(aq) → ${activeMetal}²⁺(aq) + ${cleanIonMetal}(s)`,
        isReaction: true,
      }
    }
  }, [activeMetal, activeIon, outcome])

  // Observation description based on selected species and progress
  const observation = useMemo(() => {
    if (!isDipped) {
      return 'Strip held above solution. Press "Dip strip" to submerge.'
    }
    if (activeMetal === (activeIon === 'Ag+' ? 'Ag' : activeIon.replace('2+', ''))) {
      return 'Identical metal and cation: dynamic equilibrium at E°cell = 0.00 V.'
    }
    if (outcome === 'no visible reaction') {
      return `No visible reaction observed. ${activeMetal} has a higher reduction potential than ${activeIon}, so electron transfer is non-spontaneous.`
    }
    if (outcome === 'moderate both ways') {
      return `Dynamic equilibrium attained. Both Co²⁺(aq) and Ni²⁺(aq) are present at moderate concentrations because E°cell is close to 0 V (+0.03 V).`
    }
    if (activeMetal === 'Zn' && activeIon === 'Cu2+') {
      return `Reddish copper coats the zinc strip; blue Cu²⁺ colour fades to colourless as Zn²⁺ ions dissolve.`
    }
    if (activeMetal === 'Cu' && activeIon === 'Ag+') {
      return `Glistening silver dendrites deposit on the copper strip; solution turns blue as Cu²⁺ ions enter.`
    }
    if (activeIon === 'Ag+') {
      return `Silvery metallic deposits coat the ${activeMetal} strip; solution remains colourless.`
    }
    if (activeIon === 'Cu2+') {
      return `Reddish copper deposit coats the ${activeMetal} strip; blue solution fades.`
    }
    return `Displacement active: ${activeMetal} dissolves while depositing metallic cations from solution.`
  }, [isDipped, activeMetal, activeIon, outcome])

  // Animation frame loop
  const pRef = useRef(progress)

  useEffect(() => {
    pRef.current = progress
  }, [progress])

  useEffect(() => {
    if (!isAnimating || !active || reducedMotion) return

    let lastTime = performance.now()
    let frameId: number

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000
      lastTime = now

      // Spontaneous reactions take ~2.2 seconds to reach completion
      const targetMax = outcome === 'moderate both ways' ? 0.35 : 1.0
      const nextP = Math.min(targetMax, pRef.current + dt / 2.2)
      setProgress(nextP)

      if (nextP >= targetMax) {
        setIsAnimating(false)
      } else {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [isAnimating, active, reducedMotion, outcome])

  // Dip strip handler
  const handleDipToggle = () => {
    if (isDipped) {
      // Lift strip
      setIsDipped(false)
      setIsAnimating(false)
      setProgress(0)
    } else {
      // Dip strip
      setIsDipped(true)
      if (reducedMotion) {
        setProgress(outcome === 'moderate both ways' ? 0.35 : outcome === 'products strongly favoured' ? 1.0 : 0)
      } else if (outcome !== 'no visible reaction') {
        setProgress(0)
        setIsAnimating(true)
      } else {
        setProgress(0)
      }
    }
  }

  const handleReset = () => {
    setIsDipped(false)
    setIsAnimating(false)
    setProgress(0)
  }

  // Determine beaker graphics parameters
  const effectiveProgress = isDipped ? progress : 0
  const coatingMetal = activeIon === 'Ag+' ? 'Ag' : activeIon.replace('2+', '')

  // Solution tinting: Cu²⁺ is blue, Fe²⁺ pale green, Ni²⁺ pale emerald, others clear
  let baseTint = 'transparent'
  let initialTintStrength = 0
  if (activeIon === 'Cu2+') {
    baseTint = 'var(--sol-cu)'
    initialTintStrength = 1
  } else if (activeIon === 'Fe2+') {
    baseTint = 'rgba(74, 222, 128, 0.45)'
    initialTintStrength = 0.8
  } else if (activeIon === 'Ni2+') {
    baseTint = 'rgba(52, 211, 153, 0.45)'
    initialTintStrength = 0.7
  }

  // When Cu metal is oxidised (e.g. Cu in Ag+), solution turns blue over time
  let activeTint = baseTint
  let currentTintStrength = initialTintStrength
  if (activeMetal === 'Cu' && activeIon === 'Ag+') {
    activeTint = 'var(--sol-cu)'
    currentTintStrength = effectiveProgress * 0.95
  } else if (activeIon === 'Cu2+') {
    // Blue fades as Cu2+ is consumed
    currentTintStrength = Math.max(0, initialTintStrength * (1 - effectiveProgress * 0.92))
  }

  // Active ions in beaker
  const beakerIons: IonParticle[] = useMemo(() => {
    if (!isDipped || outcome === 'no visible reaction') {
      return []
    }
    const cleanIonLabel = activeIon === 'Ag+' ? 'Ag⁺' : `${coatingMetal}²⁺`
    const dissolvedLabel = `${activeMetal}²⁺`
    return [
      {
        id: 'ion1',
        label: cleanIonLabel,
        direction: 'to-strip',
        start: { x: -62, y: 35 },
        end: { x: -22, y: 30 },
        tone: 'red',
      },
      {
        id: 'ion2',
        label: cleanIonLabel,
        direction: 'to-strip',
        start: { x: 58, y: 55 },
        end: { x: 22, y: 48 },
        tone: 'red',
      },
      {
        id: 'ion3',
        label: dissolvedLabel,
        direction: 'from-strip',
        start: { x: -18, y: -2 },
        end: { x: -62, y: -8 },
        tone: 'ox',
      },
      {
        id: 'ion4',
        label: dissolvedLabel,
        direction: 'from-strip',
        start: { x: 18, y: 20 },
        end: { x: 58, y: 46 },
        tone: 'ox',
      },
    ]
  }, [isDipped, outcome, activeIon, activeMetal, coatingMetal])

  return (
    <div
      ref={rootRef}
      className={styles.sim}
      data-testid="metal-displacement-lab"
    >
      <svg
        viewBox="0 0 840 430"
        className={styles.svg}
        role="img"
        aria-label={`Metal displacement lab: ${activeMetal} strip in ${activeIon} solution. E°cell = ${formatSignedVolts(emf)}. ${observation}`}
      >
        <defs>
          <linearGradient id={seriesGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--ox)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--red)" stopOpacity={0.8} />
          </linearGradient>
        </defs>

        {/* Outer Background Container */}
        <rect
          x={6}
          y={6}
          width={828}
          height={418}
          rx={14}
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth={1.2}
        />

        {/* LEFT PANEL: Beaker Stage (width 390) */}
        <g transform="translate(18, 18)">
          <rect
            x={0}
            y={0}
            width={374}
            height={394}
            rx={10}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1}
          />

          {/* Stage Label */}
          <text
            x={20}
            y={24}
            fontSize={12}
            fontWeight={700}
            fill="var(--fg-subtle)"
            fontFamily="var(--font-sans)"
            style={{ letterSpacing: '0.04em' }}
          >
            DISPLACEMENT CELL
          </text>

          {/* Strip position shifts vertically when dipped */}
          <g transform={`translate(187, ${isDipped ? 230 : 190})`}>
            <ReactionBeaker
              stripMetal={activeMetal}
              coatingMetal={coatingMetal}
              coating={outcome === 'no visible reaction' ? 0 : effectiveProgress}
              solutionTint={activeTint}
              tintStrength={currentTintStrength}
              progress={effectiveProgress}
              ions={beakerIons}
              title={`${activeMetal} in ${activeIon}`}
            />
          </g>

          {/* Status Overlay Tag */}
          <g transform="translate(20, 350)">
            <rect
              x={0}
              y={0}
              width={334}
              height={32}
              rx={6}
              fill="var(--surface)"
              stroke={
                outcome === 'products strongly favoured'
                  ? 'var(--ox)'
                  : outcome === 'moderate both ways'
                    ? 'var(--caution)'
                    : 'var(--border)'
              }
              strokeWidth={1.2}
            />
            <circle
              cx={16}
              cy={16}
              r={5}
              fill={
                outcome === 'products strongly favoured'
                  ? 'var(--ox)'
                  : outcome === 'moderate both ways'
                    ? 'var(--caution)'
                    : 'var(--fg-subtle)'
              }
            />
            <text
              x={30}
              y={17}
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fill="var(--fg)"
              fontFamily="var(--font-sans)"
            >
              {isDipped
                ? outcome === 'products strongly favoured'
                  ? `Active Displacement (${Math.round(effectiveProgress * 100)}%)`
                  : outcome === 'moderate both ways'
                    ? 'Dynamic Equilibrium (Co/Ni moderate)'
                    : 'No Visible Reaction (E° < 0)'
                : 'Strip Undipped (Ready)'}
            </text>
          </g>
        </g>

        {/* RIGHT PANEL: Activity Series & Quantitative Readouts (x = 410, width 412) */}
        <g transform="translate(410, 18)">
          {/* Activity Series Strip Card */}
          <g transform="translate(0, 0)">
            <rect
              x={0}
              y={0}
              width={412}
              height={148}
              rx={10}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1}
            />

            <text
              x={20}
              y={24}
              fontSize={12}
              fontWeight={700}
              fill="var(--fg-subtle)"
              fontFamily="var(--font-sans)"
              style={{ letterSpacing: '0.04em' }}
            >
              ACTIVITY SERIES (REDUCING POWER HIERARCHY)
            </text>

            {/* Gradient Line */}
            <g transform="translate(20, 48)">
              <rect x={0} y={0} width={372} height={4} rx={2} fill={`url(#${seriesGradId})`} />
              <text x={0} y={-8} fontSize={10} fontWeight={700} fill="var(--ox)" fontFamily="var(--font-sans)">
                STRONGER REDUCTANT (Lower E°)
              </text>
              <text x={372} y={-8} textAnchor="end" fontSize={10} fontWeight={700} fill="var(--red)" fontFamily="var(--font-sans)">
                WEAKER REDUCTANT
              </text>
            </g>

            {/* Metal badges along the series */}
            <g transform="translate(20, 72)">
              {ACTIVITY_SERIES_DISPLAY.map((item, idx) => {
                const stepX = idx * 52
                const isSelectedAnode = item.symbol === activeMetal
                const isSelectedCathode =
                  item.symbol === (activeIon === 'Ag+' ? 'Ag' : activeIon.replace('2+', ''))

                const badgeStroke = isSelectedAnode
                  ? 'var(--ox)'
                  : isSelectedCathode
                    ? 'var(--red)'
                    : 'var(--border)'
                const badgeFill = isSelectedAnode || isSelectedCathode ? 'var(--surface)' : 'var(--surface-raised)'

                return (
                  <g key={item.symbol} transform={`translate(${stepX}, 0)`}>
                    {/* Metal Pill */}
                    <rect
                      x={0}
                      y={0}
                      width={46}
                      height={32}
                      rx={6}
                      fill={badgeFill}
                      stroke={badgeStroke}
                      strokeWidth={isSelectedAnode || isSelectedCathode ? 2 : 1}
                    />
                    <text
                      x={23}
                      y={16}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={13}
                      fontWeight={700}
                      fontFamily="var(--font-sans)"
                      fill={
                        isSelectedAnode
                          ? 'var(--ox)'
                          : isSelectedCathode
                            ? 'var(--red)'
                            : 'var(--fg)'
                      }
                    >
                      {item.symbol}
                      {item.isNonNcert ? '*' : ''}
                    </text>
                    {/* Potential text underneath */}
                    <text
                      x={23}
                      y={44}
                      textAnchor="middle"
                      fontSize={9.5}
                      fontFamily="var(--font-sans)"
                      fill="var(--fg-muted)"
                    >
                      {item.e0.toFixed(2)}
                    </text>
                  </g>
                )
              })}
            </g>

            {/* Non-NCERT disclaimer flag */}
            {isCoNiCase && (
              <text x={20} y={136} fontSize={10} fill="var(--ox)" fontFamily="var(--font-sans)" fontWeight={600}>
                * Co potential (−0.28 V) from standard tables (not in NCERT Table 7.1).
              </text>
            )}
          </g>

          {/* Quantitative EMF & Equation Card */}
          <g transform="translate(0, 162)">
            <rect
              x={0}
              y={0}
              width={412}
              height={232}
              rx={10}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1}
            />

            {/* Standard Cell Potential Breakdown */}
            <g transform="translate(20, 20)">
              <text x={0} y={10} fontSize={12} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
                STANDARD CELL POTENTIAL
              </text>
              <text x={0} y={36} fontSize={22} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
                <tspan className="sym">E</tspan>
                <tspan dy="-0.4em" fontSize="0.75em">°</tspan>
                <tspan dy="0.4em">cell = </tspan>
                <tspan fill={emf > 0 ? 'var(--ox)' : 'var(--fg-muted)'}>
                  {formatSignedVolts(emf)}
                </tspan>
              </text>

              <text x={0} y={64} fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                = <tspan className="sym">E</tspan>°(cathode) − <tspan className="sym">E</tspan>°(anode)
              </text>
              <text x={0} y={84} fontSize={13} fill="var(--fg)" fontFamily="var(--font-sans)">
                = {formatSignedVolts(eCathode)} ({formatIonDisplay(activeIon)}) − ({formatSignedVolts(eAnode)} ({activeMetal}))
              </text>
            </g>

            {/* Ionic Equation Box */}
            <g transform="translate(20, 128)">
              <rect
                x={0}
                y={0}
                width={372}
                height={84}
                rx={8}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={14} y={22} fontSize={11} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
                REPRESENTATIVE IONIC EQUATION
              </text>
              <text
                x={14}
                y={48}
                fontSize={15}
                fontWeight={700}
                fill={outcome === 'no visible reaction' ? 'var(--fg-subtle)' : 'var(--fg)'}
                fontFamily="var(--font-sans)"
              >
                {equationData.equationText}
              </text>
              <text x={14} y={70} fontSize={11} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                {outcome === 'products strongly favoured'
                  ? 'Thermodynamically spontaneous (E°cell > 0)'
                  : outcome === 'moderate both ways'
                    ? 'Both reactants and products present at equilibrium'
                    : 'Non-spontaneous under standard conditions'}
              </text>
            </g>
          </g>
        </g>
      </svg>

      {/* Accessible Readout Table */}
      <dl className={styles.readout}>
        <div className={styles.item}>
          <dt>Metal Strip (Anode / Reductant)</dt>
          <dd data-testid="readout-metal">
            {activeMetal} (<span className="sym">E</span>° = {formatSignedVolts(eAnode)})
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Solution Cation (Cathode / Oxidant)</dt>
          <dd data-testid="readout-ion">
            {formatIonDisplay(activeIon)} (<span className="sym">E</span>° = {formatSignedVolts(eCathode)})
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Cell EMF (<span className="sym">E</span>°cell)</dt>
          <dd data-testid="readout-emf">{formatSignedVolts(emf)}</dd>
        </div>
        <div className={styles.item}>
          <dt>Displacement Outcome</dt>
          <dd data-testid="readout-outcome">
            {outcome === 'products strongly favoured'
              ? 'Displacement Spontaneous'
              : outcome === 'moderate both ways'
                ? 'Moderate Both Ways'
                : 'No Visible Reaction'}
          </dd>
        </div>
      </dl>

      {/* Live region for assistive tech */}
      <p className={styles.live} aria-live="polite" data-testid="metal-displacement-live">
        {observation}
      </p>

      {/* Co/Ni footnote notice */}
      {isCoNiCase && (
        <p className={styles.footnote} data-testid="co-ni-footnote">
          Note: Cobalt reduction potential <span className="sym">E</span>°(Co²⁺/Co) = −0.28 V is cited
          from standard electrochemical tables and is not printed in NCERT Table 7.1.
        </p>
      )}

      {/* Interactive Controls */}
      <SimulationControls>
        {!isCoNiCase ? (
          <>
            <Segmented<StripMetal>
              label="Metal strip"
              options={STRIP_OPTIONS}
              value={metal}
              onChange={(val) => {
                setMetal(val)
                setIsDipped(false)
                setIsAnimating(false)
                setProgress(0)
              }}
            />
            <Segmented<SolutionIon>
              label="Aqueous solution"
              options={SOLUTION_OPTIONS}
              value={ion}
              onChange={(val) => {
                setIon(val)
                setIsDipped(false)
                setIsAnimating(false)
                setProgress(0)
              }}
            />
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--fg-muted)' }}>
            Preset: Metallic Cobalt (Co) placed in Nickel sulphate (Ni²⁺) solution (NCERT §7.2.1).
          </p>
        )}

        <Button
          variant="primary"
          onClick={handleDipToggle}
          data-testid="dip-button"
        >
          {isDipped ? 'Lift strip' : 'Dip strip'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            setIsCoNiCase(!isCoNiCase)
            setIsDipped(false)
            setIsAnimating(false)
            setProgress(0)
          }}
          data-testid="co-ni-toggle"
        >
          {isCoNiCase ? 'Exit Co/Ni Case' : 'NCERT Co in Ni²⁺ Case'}
        </Button>

        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>

        {isDipped && outcome !== 'no visible reaction' && (
          <Slider
            label="Reaction progress"
            value={Math.round(progress * 100)}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(val) => {
              setIsAnimating(false)
              setProgress(val / 100)
            }}
          />
        )}
      </SimulationControls>
    </div>
  )
}
