'use client'

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button, Segmented, Slider } from '@/components/controls'
import { clamp01 } from '@/components/redox/geometry'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import { cellEmf, lookupPotential } from '@/lib/chem/electrode-potentials'
import { displacementEquation, splitCation } from '@/lib/chem/metal-displacement'
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

/** Activity series shown in the strip. Co is not in NCERT Table 7.1 and is marked. */
const ACTIVITY_SERIES_DISPLAY: ReadonlyArray<{ symbol: string; e0: number; isNonNcert?: boolean }> = [
  { symbol: 'Mg', e0: -2.36 },
  { symbol: 'Zn', e0: -0.76 },
  { symbol: 'Fe', e0: -0.44 },
  { symbol: 'Co', e0: -0.28, isNonNcert: true },
  { symbol: 'Ni', e0: -0.25 },
  { symbol: 'Pb', e0: -0.13 },
  { symbol: 'Cu', e0: 0.34 },
  { symbol: 'Ag', e0: 0.8 },
]

const SUPERSCRIPT: Record<string, string> = { '1': '¹', '2': '²', '3': '³' }

/** Signed volts with a true minus sign, e.g. +1.10 V or −0.76 V. */
function formatSignedVolts(val: number): string {
  const sign = val >= 0 ? '+' : '−'
  return `${sign}${Math.abs(val).toFixed(2)} V`
}

/** Ion label with Unicode superscript charge, e.g. Cu2+ becomes Cu²⁺ and Ag+ becomes Ag⁺. */
function ionLabel(cation: string): string {
  const { metal, charge } = splitCation(cation)
  return `${metal}${charge === 1 ? '' : SUPERSCRIPT[String(charge)] ?? ''}⁺`
}

/** Strip colour per metal. Mg, Fe, Pb and Co have no token, so they use neutral greys. */
const STRIP_COLOUR: Record<StripMetal, string> = {
  Mg: '#D4D4D8',
  Zn: 'var(--metal-zn)',
  Fe: '#6B7280',
  Pb: '#4B5563',
  Cu: 'var(--metal-cu)',
  Ag: 'var(--metal-ag)',
  Co: '#7C8798',
}

/** Colour of the deposit, which is the metal of the cation. */
function depositColour(metal: string): string {
  if (metal === 'Cu') return 'var(--metal-cu)'
  if (metal === 'Ag') return 'var(--metal-ag)'
  if (metal === 'Zn') return 'var(--metal-zn)'
  if (metal === 'Ni') return '#8B9A8E'
  return '#6B7280'
}

/** Renders a mhchem equation with KaTeX. The strings come from the tested lib. */
function Ce({ mhchem }: { mhchem: string }) {
  const html = useMemo(
    () => katex.renderToString(`\\ce{${mhchem}}`, { throwOnError: false }),
    [mhchem],
  )
  return <span className={styles.ce} dangerouslySetInnerHTML={{ __html: html }} />
}

// Stage geometry, in the stage group's own units (the stage is 374 × 394).
const CX = 187
const RIM_Y = 190
const LIQUID_Y = 222
const BEAKER_BOTTOM = 340
const BEAKER_HALF = 85
/** How far the strip moves when it is dipped. The strip is 110 units long. */
const DIP_SHIFT = 94
const STRIP_W = 34
const STRIP_TOP = 56
const STRIP_LEN = 110

interface DipCellProps {
  stripMetal: StripMetal
  stripMetalLabel: string
  depositMetal: string
  depositLabel: string
  coat: number
  dipped: boolean
  reducedMotion: boolean
  tint: string
  tintStrength: number
  ionProgress: number
  showIons: boolean
  dissolvingLabel: string
  id: string
}

/**
 * The beaker and strip for the displacement lab. The strip sits above the liquid
 * before dipping and moves down into it when dipped. The shared ReactionBeaker always
 * draws its strip submerged, so the lab draws its own beaker here.
 */
function DipCell({
  stripMetal,
  stripMetalLabel,
  depositMetal,
  depositLabel,
  coat,
  dipped,
  reducedMotion,
  tint,
  tintStrength,
  ionProgress,
  showIons,
  dissolvingLabel,
  id,
}: DipCellProps) {
  const clipId = `dc-clip-${id}`
  const c = clamp01(coat)
  const ionP = clamp01(ionProgress)
  const left = CX - BEAKER_HALF
  const right = CX + BEAKER_HALF
  const glass = `M ${left - 4} ${RIM_Y} L ${left} ${RIM_Y + 4} L ${left} ${BEAKER_BOTTOM - 10} Q ${left} ${BEAKER_BOTTOM} ${left + 10} ${BEAKER_BOTTOM} L ${right - 10} ${BEAKER_BOTTOM} Q ${right} ${BEAKER_BOTTOM} ${right} ${BEAKER_BOTTOM - 10} L ${right} ${RIM_Y + 4} L ${right + 4} ${RIM_Y}`
  const clipPath = `M ${left} ${RIM_Y} L ${left} ${BEAKER_BOTTOM - 10} Q ${left} ${BEAKER_BOTTOM} ${left + 10} ${BEAKER_BOTTOM} L ${right - 10} ${BEAKER_BOTTOM} Q ${right} ${BEAKER_BOTTOM} ${right} ${BEAKER_BOTTOM - 10} L ${right} ${RIM_Y} Z`

  // Strip coordinates are the undipped ones; the group moves the strip down into the liquid.
  // The part of the strip below the liquid surface, in strip coordinates.
  const coatTop = LIQUID_Y - DIP_SHIFT
  const coatHeight = STRIP_TOP + STRIP_LEN - coatTop

  const ionOpacityDeposit = Math.max(0, 1 - 1.1 * ionP)
  const ionOpacityDissolve = Math.min(1, 1.2 * ionP)
  const transition = reducedMotion ? 'none' : 'transform 0.7s ease'

  const ions: Array<{ key: string; label: string; from: [number, number]; to: [number, number]; tone: 'ox' | 'red'; opacity: number }> = [
    // Pills are 48 wide, so the paths stay between the glass walls (CX ± 85).
    { key: 'd1', label: depositLabel, from: [CX - 54, 262], to: [CX - 26, 268], tone: 'red', opacity: ionOpacityDeposit },
    { key: 'd2', label: depositLabel, from: [CX + 54, 300], to: [CX + 26, 294], tone: 'red', opacity: ionOpacityDeposit },
    { key: 's1', label: dissolvingLabel, from: [CX - 22, 250], to: [CX - 52, 246], tone: 'ox', opacity: ionOpacityDissolve },
    { key: 's2', label: dissolvingLabel, from: [CX + 22, 282], to: [CX + 52, 278], tone: 'ox', opacity: ionOpacityDissolve },
  ]

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={clipPath} />
        </clipPath>
      </defs>

      {/* Liquid, clipped to the beaker */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={left - 10}
          y={LIQUID_Y}
          width={BEAKER_HALF * 2 + 20}
          height={BEAKER_BOTTOM - LIQUID_Y + 10}
          fill={tint}
          opacity={0.1 + 0.7 * clamp01(tintStrength)}
        />
        <line
          x1={left}
          y1={LIQUID_Y}
          x2={right}
          y2={LIQUID_Y}
          stroke={tint}
          strokeWidth={2}
          opacity={0.3 + 0.7 * clamp01(tintStrength)}
        />
      </g>

      {/* Strip, which moves down into the liquid when dipped */}
      <g style={{ transform: `translateY(${dipped ? DIP_SHIFT : 0}px)`, transition }}>
        <rect
          x={CX - STRIP_W / 2}
          y={STRIP_TOP}
          width={STRIP_W}
          height={STRIP_LEN}
          rx={3}
          fill={STRIP_COLOUR[stripMetal]}
          stroke="var(--fg-muted)"
          strokeWidth={1.2}
        />
        {c > 0 && (
          <rect
            x={CX - STRIP_W / 2 - 3 * c}
            y={coatTop}
            width={STRIP_W + 6 * c}
            height={coatHeight}
            rx={3}
            fill={depositColour(depositMetal)}
            stroke="var(--fg-muted)"
            strokeWidth={1}
          />
        )}
        <text
          x={CX}
          y={STRIP_TOP - 12}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {stripMetalLabel} strip
        </text>
      </g>

      {/* Deposit label, shown once the coating is visible */}
      {c >= 0.25 && (
        <text
          x={CX + STRIP_W / 2 + 10}
          y={LIQUID_Y + 14}
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill={depositColour(depositMetal)}
        >
          {depositLabel} deposit
        </text>
      )}

      {/* Ions moving through the liquid */}
      {showIons &&
        ions.map((ion) => {
          if (ion.opacity <= 0.05) return null
          const x = ion.from[0] + (ion.to[0] - ion.from[0]) * ionP
          const y = ion.from[1] + (ion.to[1] - ion.from[1]) * ionP
          const stroke = ion.tone === 'ox' ? 'var(--ox)' : 'var(--red)'
          return (
            <g key={ion.key} transform={`translate(${x}, ${y})`} opacity={ion.opacity}>
              <rect x={-24} y={-12} width={48} height={24} rx={6} fill="var(--surface-raised)" stroke={stroke} strokeWidth={1.4} />
              <text
                x={0}
                y={1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={14}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill={stroke}
              >
                {ion.label}
              </text>
            </g>
          )
        })}

      {/* Glass */}
      <path d={glass} fill="none" stroke="var(--glass-wall)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <line
        x1={left + 10}
        y1={LIQUID_Y + 10}
        x2={left + 10}
        y2={BEAKER_BOTTOM - 18}
        stroke="var(--glass-sheen)"
        strokeWidth={2.4}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
}

/**
 * Metal Displacement Lab Simulation (Unit 7, Section 7.2.1).
 *
 * Dip a metal strip into a solution of another metal's cations. Displacement shows only when
 * E°cell > 0; the equation, E°cell and the activity-series readouts come from the tested libs.
 */
export function MetalDisplacementLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const seriesGradId = `mdl-grad-${uid}`

  const [metal, setMetal] = useState<StripMetal>('Zn')
  const [ion, setIon] = useState<SolutionIon>('Cu2+')
  const [isDipped, setIsDipped] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isCoNiCase, setIsCoNiCase] = useState(false)

  const activeMetal: StripMetal = isCoNiCase ? 'Co' : metal
  const activeIon: SolutionIon = isCoNiCase ? 'Ni2+' : ion
  const activeCationMetal = splitCation(activeIon).metal

  const eCathode = lookupPotential(activeIon)
  const eAnode = lookupPotential(activeMetal)
  const emf = cellEmf(activeIon, activeMetal)
  const equation = displacementEquation(activeMetal, activeIon)
  const outcome = equation.outcome
  const isSame = activeMetal === activeCationMetal

  const observation = useMemo(() => {
    if (!isDipped) {
      return 'Strip held above the solution. Press "Dip strip" to lower it in.'
    }
    if (isSame) {
      return `Identical metal and cation: E°cell = 0.00 V, so nothing changes overall.`
    }
    if (outcome === 'no visible reaction') {
      return `No visible reaction. ${equation.noReactionReason ?? ''}`
    }
    if (outcome === 'moderate both ways') {
      return 'Dynamic equilibrium: Co²⁺(aq) and Ni²⁺(aq) both stay at moderate concentrations, because E°cell is only +0.03 V.'
    }
    if (activeMetal === 'Zn' && activeIon === 'Cu2+') {
      return 'Reddish copper coats the zinc strip, and the blue Cu²⁺ colour fades as Zn²⁺ ions enter the solution.'
    }
    if (activeMetal === 'Cu' && activeIon === 'Ag+') {
      return 'Silver deposits on the copper strip, and the solution turns blue as Cu²⁺ ions form.'
    }
    if (activeIon === 'Ag+') {
      return `Silvery deposits coat the ${activeMetal} strip, and the solution stays colourless.`
    }
    return `${activeMetal} dissolves as ${activeCationMetal} deposits from the solution.`
  }, [isDipped, isSame, outcome, equation.noReactionReason, activeMetal, activeIon, activeCationMetal])

  // Reaction progress animates from 0 to its end point after dipping.
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

  const handleDipToggle = () => {
    if (isDipped) {
      setIsDipped(false)
      setIsAnimating(false)
      setProgress(0)
      return
    }
    setIsDipped(true)
    if (outcome === 'no visible reaction') {
      setProgress(0)
      return
    }
    if (reducedMotion) {
      setProgress(outcome === 'moderate both ways' ? 0.35 : 1.0)
    } else {
      setProgress(0)
      setIsAnimating(true)
    }
  }

  const handleReset = () => {
    setIsDipped(false)
    setIsAnimating(false)
    setProgress(0)
  }

  const reacting = isDipped && outcome !== 'no visible reaction' && !isSame
  const effectiveProgress = reacting ? progress : 0

  // Solution tint: Cu²⁺ blue, Fe²⁺ pale green, Ni²⁺ pale emerald, the rest clear.
  // When copper strip is dipped in silver nitrate, the solution turns blue as Cu²⁺ forms.
  let tint = 'transparent'
  let tintStrength = 0
  if (activeIon === 'Cu2+') {
    tint = 'var(--sol-cu)'
    tintStrength = Math.max(0, 1 - (reacting ? effectiveProgress * 0.92 : 0))
  } else if (activeIon === 'Fe2+') {
    tint = 'rgba(74, 222, 128, 0.45)'
    tintStrength = 0.8
  } else if (activeIon === 'Ni2+') {
    tint = 'rgba(52, 211, 153, 0.45)'
    tintStrength = 0.7
  }
  if (activeMetal === 'Cu' && activeIon === 'Ag+') {
    tint = 'var(--sol-cu)'
    tintStrength = reacting ? effectiveProgress * 0.95 : 0
  }

  const coatMetal = activeCationMetal
  const coat = reacting ? effectiveProgress : 0

  const statusColour =
    outcome === 'products strongly favoured'
      ? 'var(--ox)'
      : outcome === 'moderate both ways'
        ? 'var(--caution)'
        : 'var(--fg-subtle)'

  const statusText = !isDipped
    ? 'Strip above the solution (ready)'
    : isSame
      ? 'Same metal and cation (E°cell = 0)'
      : outcome === 'products strongly favoured'
        ? `Active displacement (${Math.round(effectiveProgress * 100)}%)`
        : outcome === 'moderate both ways'
          ? 'Dynamic equilibrium (Co/Ni, moderate)'
          : 'No visible reaction (E°cell < 0)'

  const emfRowColour = emf > 0 ? 'var(--ox)' : 'var(--fg-muted)'

  return (
    <div ref={rootRef} className={styles.sim} data-testid="metal-displacement-lab">
      <svg
        viewBox="0 0 840 430"
        className={styles.svg}
        role="img"
        aria-label={`Metal displacement lab: ${activeMetal} strip in ${ionLabel(activeIon)} solution. E°cell = ${formatSignedVolts(emf)}. ${observation}`}
      >
        <defs>
          <linearGradient id={seriesGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--ox)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--red)" stopOpacity={0.8} />
          </linearGradient>
        </defs>

        <rect x={6} y={6} width={828} height={418} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />

        {/* LEFT: displacement cell */}
        <g transform="translate(18, 18)">
          <rect x={0} y={0} width={374} height={394} rx={10} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1} />
          <text x={20} y={24} fontSize={12} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)" style={{ letterSpacing: '0.04em' }}>
            DISPLACEMENT CELL
          </text>

          <DipCell
            id={uid}
            stripMetal={activeMetal}
            stripMetalLabel={activeMetal}
            depositMetal={coatMetal}
            depositLabel={activeCationMetal}
            coat={coat}
            dipped={isDipped}
            reducedMotion={!!reducedMotion}
            tint={tint}
            tintStrength={tintStrength}
            ionProgress={effectiveProgress}
            showIons={reacting}
            dissolvingLabel={`${activeMetal}²⁺`}
          />

          <g transform="translate(20, 350)">
            <rect
              x={0}
              y={0}
              width={334}
              height={32}
              rx={6}
              fill="var(--surface)"
              stroke={statusColour === 'var(--fg-subtle)' ? 'var(--border)' : statusColour}
              strokeWidth={1.2}
            />
            <circle cx={16} cy={16} r={5} fill={statusColour} />
            <text x={30} y={17} dominantBaseline="central" fontSize={13} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
              {statusText}
            </text>
          </g>
        </g>

        {/* RIGHT: activity series and readouts */}
        <g transform="translate(410, 18)">
          <g>
            <rect x={0} y={0} width={412} height={148} rx={10} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1} />
            <text x={20} y={24} fontSize={12} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)" style={{ letterSpacing: '0.04em' }}>
              ACTIVITY SERIES (REDUCING POWER)
            </text>

            <g transform="translate(20, 48)">
              <rect x={0} y={0} width={372} height={4} rx={2} fill={`url(#${seriesGradId})`} />
              <text x={0} y={-8} fontSize={12} fontWeight={700} fill="var(--ox)" fontFamily="var(--font-sans)">
                STRONGER REDUCTANT
              </text>
              <text x={372} y={-8} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--red)" fontFamily="var(--font-sans)">
                WEAKER REDUCTANT
              </text>
            </g>

            <g transform="translate(20, 72)">
              {ACTIVITY_SERIES_DISPLAY.map((item, idx) => {
                const isAnode = item.symbol === activeMetal
                const isCathode = item.symbol === activeCationMetal
                const stroke = isAnode ? 'var(--ox)' : isCathode ? 'var(--red)' : 'var(--border)'
                const fill = isAnode || isCathode ? 'var(--surface)' : 'var(--surface-raised)'
                const textFill = isAnode ? 'var(--ox)' : isCathode ? 'var(--red)' : 'var(--fg)'
                return (
                  <g key={item.symbol} transform={`translate(${idx * 46.5}, 0)`}>
                    <rect x={0} y={0} width={40} height={32} rx={6} fill={fill} stroke={stroke} strokeWidth={isAnode || isCathode ? 2 : 1} />
                    <text x={20} y={16} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fontFamily="var(--font-sans)" fill={textFill}>
                      {item.symbol}
                      {item.isNonNcert ? '*' : ''}
                    </text>
                    <text x={20} y={46} textAnchor="middle" fontSize={12} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                      {item.e0.toFixed(2).replace('-', '−')}
                    </text>
                  </g>
                )
              })}
            </g>

            {isCoNiCase && (
              <text x={20} y={138} fontSize={12} fill="var(--ox)" fontFamily="var(--font-sans)" fontWeight={600}>
                * Co (−0.28 V) is from standard tables, not NCERT Table 7.1.
              </text>
            )}
          </g>

          <g transform="translate(0, 162)">
            <rect x={0} y={0} width={412} height={232} rx={10} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1} />

            <g transform="translate(20, 18)">
              <text x={0} y={10} fontSize={12} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)" style={{ letterSpacing: '0.04em' }}>
                STANDARD CELL POTENTIAL
              </text>
              <text x={0} y={38} fontSize={22} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
                <tspan className="sym">E</tspan>
                <tspan dy="-0.4em" fontSize="0.75em">°</tspan>
                <tspan dy="0.4em">cell = </tspan>
                <tspan fill={emfRowColour}>{formatSignedVolts(emf)}</tspan>
              </text>
              <text x={0} y={62} fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                = <tspan className="sym">E</tspan>°(cathode) − <tspan className="sym">E</tspan>°(anode)
              </text>
              <text x={0} y={80} fontSize={13} fill="var(--fg)" fontFamily="var(--font-sans)">
                = {formatSignedVolts(eCathode)} ({ionLabel(activeIon)}) − ({formatSignedVolts(eAnode)} ({activeMetal}))
              </text>
            </g>

            {/* Equation box: KaTeX inside a foreignObject so the mhchem wraps the same way as the prose */}
            <g transform="translate(20, 116)">
              <rect x={0} y={0} width={372} height={104} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} />
              <text x={14} y={20} fontSize={11} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)" style={{ letterSpacing: '0.04em' }}>
                {equation.mhchem === null ? 'NO REACTION' : 'BALANCED IONIC EQUATION'}
              </text>
              <foreignObject x={10} y={28} width={352} height={40}>
                <div className={styles.eqBox}>
                  {equation.mhchem === null ? (
                    <span className={styles.noReaction}>{equation.noReactionReason}</span>
                  ) : (
                    <Ce mhchem={equation.mhchem} />
                  )}
                </div>
              </foreignObject>
              <text x={14} y={88} fontSize={12} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                {outcome === 'products strongly favoured'
                  ? 'Thermodynamically spontaneous (E°cell > 0)'
                  : outcome === 'moderate both ways'
                    ? 'Reactants and products both present at equilibrium'
                    : 'Stays unchanged under standard conditions'}
              </text>
            </g>
          </g>
        </g>
      </svg>

      <dl className={styles.readout}>
        <div className={styles.item}>
          <dt>Metal strip (anode, reductant)</dt>
          <dd data-testid="readout-metal">
            {activeMetal} (<span className="sym">E</span>° = {formatSignedVolts(eAnode)})
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Solution cation (cathode, oxidant)</dt>
          <dd data-testid="readout-ion">
            {ionLabel(activeIon)} (<span className="sym">E</span>° = {formatSignedVolts(eCathode)})
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Cell EMF (<span className="sym">E</span>°cell)</dt>
          <dd data-testid="readout-emf">{formatSignedVolts(emf)}</dd>
        </div>
        <div className={styles.item}>
          <dt>Displacement outcome</dt>
          <dd data-testid="readout-outcome">
            {outcome === 'products strongly favoured'
              ? 'Displacement Spontaneous'
              : outcome === 'moderate both ways'
                ? 'Moderate Both Ways'
                : 'No Visible Reaction'}
          </dd>
        </div>
      </dl>

      <p className={styles.live} aria-live="polite" data-testid="metal-displacement-live">
        {observation}
      </p>

      {isCoNiCase && (
        <p className={styles.footnote} data-testid="co-ni-footnote">
          Note: the cobalt reduction potential <span className="sym">E</span>°(Co²⁺/Co) = −0.28 V is cited from standard
          electrochemical tables and is not printed in NCERT Table 7.1.
        </p>
      )}

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
            Preset: metallic cobalt in nickel(II) sulphate solution (NCERT §7.2.1).
          </p>
        )}

        <Button variant="primary" onClick={handleDipToggle} data-testid="dip-button">
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
          {isCoNiCase ? 'Exit Co/Ni case' : 'NCERT Co in Ni²⁺ case'}
        </Button>

        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>

        {reacting && (
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
