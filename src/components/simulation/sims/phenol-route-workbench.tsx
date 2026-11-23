'use client'

import { useState } from 'react'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { AromaticRing, StraightArrow, TagPill } from '@/components/animations/c12-unit7/phenol-prep/PhenolChemSvg'
import {
  CHLOROBENZENE_EQUATION_PRESSURE_ATM,
  CHLOROBENZENE_TARGET_TEMP_K,
  DEFAULT_WORKBENCH_STATE,
  evaluateWorkbench,
  type PipelineStageVisual,
  type PipelineStatusKind,
  type RouteSubstrateId,
  type WorkbenchState,
} from '@/lib/chem/c12-u7-s5-phenol-prep'
import styles from './phenol-route-workbench.module.css'

const SUBSTRATE_OPTIONS: readonly { value: RouteSubstrateId; label: string }[] = [
  { value: 'chlorobenzene', label: 'Chlorobenzene (C₆H₅Cl)' },
  { value: 'benzene', label: 'Benzene (C₆H₆)' },
  { value: 'aniline', label: 'Aniline (C₆H₅NH₂)' },
  { value: 'cumene', label: 'Cumene (isopropylbenzene)' },
]

const BENZENE_STEP1_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'oleum', label: 'Oleum' },
] as const

const BENZENE_STEP2_OPTIONS = [
  { value: 'aqueous', label: 'Aqueous NaOH' },
  { value: 'molten', label: 'Molten NaOH + heat' },
] as const

const ANILINE_STEP2_OPTIONS = [
  { value: 'cold', label: 'Keep cold' },
  { value: 'warm', label: 'Warm with H₂O' },
] as const

const ROUTE_TITLES: Readonly<Record<RouteSubstrateId, string>> = {
  chlorobenzene: 'Route 1: From haloarenes (chlorobenzene fusion)',
  benzene: 'Route 2: From benzenesulphonic acid',
  aniline: 'Route 3: From diazonium salts',
  cumene: 'Route 4: From cumene (industrial manufacture)',
}

const VB_W = 820
const VB_H = 336

function statusColors(kind: PipelineStatusKind): { fill: string; stroke: string; text: string } {
  switch (kind) {
    case 'complete':
      return { fill: 'var(--success-soft)', stroke: 'var(--success)', text: 'var(--success)' }
    case 'intermediate':
      return { fill: 'var(--accent-soft)', stroke: 'var(--accent)', text: 'var(--accent)' }
    case 'trapped':
      return { fill: 'var(--caution-soft)', stroke: 'var(--caution)', text: 'var(--caution)' }
    case 'blocked':
    case 'decomposed':
      return { fill: 'var(--caution-soft)', stroke: 'var(--proton)', text: 'var(--proton)' }
  }
}

function StageSpecies({ node, x, y }: { node: PipelineStageVisual; x: number; y: number }) {
  const r = 36
  if (node.kind === 'blocked' || node.kind === 'degraded') {
    const stroke = node.kind === 'degraded' ? 'var(--proton)' : 'var(--caution)'
    return (
      <g transform={`translate(${x}, ${y})`}>
        <rect
          x={-68}
          y={-42}
          width={136}
          height={84}
          rx={12}
          fill="var(--caution-soft)"
          stroke={stroke}
          strokeWidth={1.8}
          strokeDasharray="6 4"
        />
        <text
          x={0}
          y={-8}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill={stroke}
        >
          {node.kind === 'degraded' ? 'Decomposed' : 'Blocked'}
        </text>
        <text
          x={0}
          y={18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {node.formula}
        </text>
        <text
          x={0}
          y={r + 24}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {node.label}
        </text>
      </g>
    )
  }

  const topSubstituentMap = {
    benzene: undefined,
    chlorobenzene: { label: 'Cl', color: 'var(--atom-hal)', bondHighlight: true },
    benzenesulphonicAcid: { label: 'SO₃H', color: 'var(--atom-s)' },
    phenoxide: { label: 'O⁻ Na⁺', color: 'var(--atom-o)' },
    aniline: { label: 'NH₂', color: 'var(--atom-n)' },
    diazonium: { label: 'N₂⁺ Cl⁻', color: 'var(--atom-n)' },
    cumene: { label: 'CH(CH₃)₂', color: 'var(--fg)' },
    hydroperoxide: { label: 'C(CH₃)₂OOH', color: 'var(--atom-o)' },
    phenol: { label: 'OH', color: 'var(--atom-o)' },
  } as const

  const highlightRing = node.kind === 'phenol'
  const ringFill = node.kind === 'phenol' ? 'var(--success-soft)' : undefined

  return (
    <AromaticRing
      x={x}
      y={y}
      r={r}
      highlightRing={highlightRing}
      ringFill={ringFill}
      topSubstituent={topSubstituentMap[node.kind]}
      caption={node.label}
      subcaption={node.formula}
      captionColor={node.kind === 'phenol' ? 'var(--success)' : 'var(--fg)'}
    />
  )
}

export function PhenolRouteWorkbench({ reducedMotion }: SimulationProps) {
  const [state, setState] = useState<WorkbenchState>(DEFAULT_WORKBENCH_STATE)
  const outcome = evaluateWorkbench(state)
  const time = useAmbientTime(reducedMotion || !outcome.gasBubbles)
  const badgeStyle = statusColors(outcome.statusKind)

  const step1Blocked = !outcome.step1Active && (outcome.statusKind === 'blocked' || outcome.statusKind === 'decomposed')
  const step2Blocked = outcome.step1Active && !outcome.step2Active
  const bubbleShift = reducedMotion || !outcome.gasBubbles ? 0 : Math.sin(time * 2.4) * 5

  return (
    <div className={styles.sim}>
      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={outcome.liveSummary}
        >
          {/* Header row */}
          <text
            x={24}
            y={30}
            textAnchor="start"
            dominantBaseline="central"
            fontSize={18}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            {ROUTE_TITLES[state.substrate]}
          </text>
          <TagPill
            x={700}
            y={30}
            text={outcome.statusLabel}
            width={200}
            height={32}
            fill={badgeStyle.fill}
            stroke={badgeStyle.stroke}
            textColor={badgeStyle.text}
            fontSize={16}
          />

          {/* Stage column headings */}
          <text x={115} y={66} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Substrate
          </text>
          <text x={395} y={66} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Intermediate
          </text>
          <text x={685} y={66} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            Workup / Product
          </text>

          {/* Pipeline species and arrows */}
          <StageSpecies node={outcome.startNode} x={115} y={176} />

          <StraightArrow
            x1={174}
            y1={176}
            x2={322}
            y2={176}
            above={[outcome.step1Reagent]}
            below={[outcome.step1Condition]}
            color={outcome.step1Active ? 'var(--accent)' : 'var(--fg-muted)'}
            aboveColor={outcome.step1Active ? 'var(--fg)' : 'var(--fg-muted)'}
            blocked={step1Blocked}
          />

          <StageSpecies node={outcome.intermediateNode} x={395} y={176} />

          <StraightArrow
            x1={468}
            y1={176}
            x2={610}
            y2={176}
            above={[outcome.step2Reagent]}
            below={[outcome.step2Condition]}
            color={outcome.step2Active ? 'var(--success)' : 'var(--fg-muted)'}
            aboveColor={outcome.step2Active ? 'var(--fg)' : 'var(--fg-muted)'}
            dashed={!outcome.step2Active}
            blocked={step2Blocked}
          />

          <StageSpecies node={outcome.productNode} x={685} y={176} />

          {/* Animated N2 gas bubbles for diazonium hydrolysis / decomposition */}
          {outcome.gasBubbles && (
            <g transform={`translate(0, ${bubbleShift.toFixed(2)})`}>
              <TagPill
                x={540}
                y={102}
                text="N₂ ↑ gas"
                width={106}
                fill="var(--accent-soft)"
                stroke="var(--accent)"
                textColor="var(--accent)"
                fontSize={16}
              />
            </g>
          )}

          {/* Co-product / by-product pill in bottom margin */}
          {outcome.coProductFormula && (
            <TagPill
              x={685}
              y={302}
              text={`+ ${outcome.coProductFormula}`}
              width={186}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              textColor="var(--fg)"
              fontSize={16}
            />
          )}
        </svg>
      </div>

      <div className={styles.statusBanner} data-status={outcome.statusKind}>
        <span className={styles.statusBadge}>{outcome.statusLabel}</span>
        <p className={styles.explanation}>{outcome.explanation}</p>
      </div>

      <div className={styles.ledger}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Active intermediate</span>
          <span className={styles.cardValue} data-testid="readout-intermediate">
            {outcome.activeIntermediateText}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Organic product(s)</span>
          <span className={styles.cardValue} data-testid="readout-products">
            {outcome.organicProductsText}
          </span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardLabel}>By-products</span>
          <span className={styles.cardValue} data-testid="readout-byproducts">
            {outcome.byProductsText}
          </span>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {outcome.liveSummary}
      </p>

      <SimulationControls>
        <div className={styles.controlsRoot}>
          <div className={styles.controlBlock}>
            <span className={styles.controlTitle}>Starting substrate</span>
            <Segmented
              label="Starting substrate"
              options={SUBSTRATE_OPTIONS}
              value={state.substrate}
              onChange={(substrate) => setState((prev) => ({ ...prev, substrate }))}
            />
          </div>

          {state.substrate === 'chlorobenzene' && (
            <div className={styles.controlRow}>
              <div className={styles.sliderWrap}>
                <Slider
                  label="Fusion temperature"
                  min={300}
                  max={650}
                  step={1}
                  unit="K"
                  value={state.chloroTempK}
                  onChange={(chloroTempK) => setState((prev) => ({ ...prev, chloroTempK }))}
                />
                <span className={styles.targetNote}>Target: {CHLOROBENZENE_TARGET_TEMP_K} K</span>
              </div>
              <div className={styles.sliderWrap}>
                <Slider
                  label="Pressure"
                  min={1}
                  max={350}
                  step={1}
                  unit="atm"
                  value={state.chloroPressureAtm}
                  onChange={(chloroPressureAtm) => setState((prev) => ({ ...prev, chloroPressureAtm }))}
                />
                <span className={styles.targetNote}>Target: 300-320 atm</span>
              </div>
              <Toggle
                label="HCl workup (acidification)"
                checked={state.chloroAcidify}
                onChange={(chloroAcidify) => setState((prev) => ({ ...prev, chloroAcidify }))}
              />
              <Button
                variant="secondary"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    chloroTempK: CHLOROBENZENE_TARGET_TEMP_K,
                    chloroPressureAtm: CHLOROBENZENE_EQUATION_PRESSURE_ATM,
                    chloroAcidify: true,
                  }))
                }
              >
                Set NCERT target
              </Button>
            </div>
          )}

          {state.substrate === 'benzene' && (
            <div className={styles.controlRow}>
              <div className={styles.controlBlock}>
                <span className={styles.controlTitle}>Step 1 reagent</span>
                <Segmented
                  label="Step 1 reagent"
                  options={BENZENE_STEP1_OPTIONS}
                  value={state.benzeneStep1}
                  onChange={(benzeneStep1) => setState((prev) => ({ ...prev, benzeneStep1 }))}
                />
              </div>
              <div className={styles.controlBlock}>
                <span className={styles.controlTitle}>Step 2 fusion</span>
                <Segmented
                  label="Step 2 fusion"
                  options={BENZENE_STEP2_OPTIONS}
                  value={state.benzeneStep2}
                  onChange={(benzeneStep2) => setState((prev) => ({ ...prev, benzeneStep2 }))}
                />
              </div>
              <Toggle
                label="Step 3 acidification (H⁺)"
                checked={state.benzeneAcidify}
                onChange={(benzeneAcidify) => setState((prev) => ({ ...prev, benzeneAcidify }))}
              />
            </div>
          )}

          {state.substrate === 'aniline' && (
            <div className={styles.controlRow}>
              <div className={styles.sliderWrap}>
                <Slider
                  label="Diazotisation temperature"
                  min={268}
                  max={310}
                  step={1}
                  unit="K"
                  value={state.anilineTempK}
                  onChange={(anilineTempK) => setState((prev) => ({ ...prev, anilineTempK }))}
                />
                <span className={styles.targetNote}>Safe window: 273-278 K</span>
              </div>
              <div className={styles.controlBlock}>
                <span className={styles.controlTitle}>Step 2 hydrolysis</span>
                <Segmented
                  label="Step 2 hydrolysis"
                  options={ANILINE_STEP2_OPTIONS}
                  value={state.anilineStep2}
                  onChange={(anilineStep2) => setState((prev) => ({ ...prev, anilineStep2 }))}
                />
              </div>
            </div>
          )}

          {state.substrate === 'cumene' && (
            <div className={styles.controlRow}>
              <Toggle
                label="Step 1: O₂ (air) oxidation"
                checked={state.cumeneOxygen}
                onChange={(cumeneOxygen) => setState((prev) => ({ ...prev, cumeneOxygen }))}
              />
              <Toggle
                label="Step 2: Dilute acid (H⁺ / H₂O)"
                checked={state.cumeneAcid}
                onChange={(cumeneAcid) => setState((prev) => ({ ...prev, cumeneAcid }))}
              />
            </div>
          )}
        </div>
      </SimulationControls>
    </div>
  )
}
