'use client'

import { useMemo, useState } from 'react'
import { Button, Toggle } from '@/components/controls'
import { CurvedArrow, deltaText } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  PHENOL_GROUP_LABELS,
  PHENOL_PATHWAYS,
  STRUCT_PHENOL_ACTIVATED,
  getPathway,
  nitrophenolPkaData,
  type PathwayStepSpec,
  type PhenolPathway,
  type PhenolPathwayGroup,
  type PhenolPathwayId,
} from '@/lib/chem/c12-u7-s9-phenols'
import {
  Br2PolarisationComparison,
  HBondNitrophenolComparison,
  PhenolRing,
  ReactionArrow,
} from '@/components/animations/c12-unit7/phenols/PhenolStructureSvg'
import styles from './phenol-reaction-bench.module.css'

const STAGE_W = 620
const UPPER_H = 232
const LOWER_H = 258

const GROUP_ORDER: readonly PhenolPathwayGroup[] = [
  'nitration',
  'bromination',
  'named',
  'redox',
]

function UpperReactionSvg({ pathway }: { pathway: PhenolPathway }) {
  const products = pathway.stageProducts
  const twoProducts = products.length > 1
  const hasLeftStoich = Boolean(pathway.stageStoichRight)

  if (twoProducts) {
    return (
      <svg
        viewBox={`0 0 ${STAGE_W} ${UPPER_H}`}
        role="img"
        aria-label={`Reaction overview: ${pathway.equationSummary}`}
        className={styles.svg}
      >
        <PhenolRing
          spec={pathway.stageReactant}
          cx={74}
          cy={106}
          radius={28}
          showName
          nameYOffset={66}
        />
        <ReactionArrow
          x1={122}
          x2={244}
          y={106}
          above={pathway.stageArrowAbove}
          below={pathway.stageArrowBelow}
        />
        <PhenolRing
          spec={products[0]}
          cx={336}
          cy={98}
          radius={26}
          showName
          nameYOffset={78}
        />
        <text
          x={426}
          y={98}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={20}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          +
        </text>
        <PhenolRing
          spec={products[1]}
          cx={518}
          cy={98}
          radius={26}
          showName
          nameYOffset={78}
        />
      </svg>
    )
  }

  // Single organic product (plus optional stoichiometry such as + 3 Br2 -> + 3 HBr or + Zn -> + ZnO)
  const productCx = pathway.id === 'bromination-water' ? 416 : pathway.id === 'zinc-dust' ? 426 : 458
  const arrowX1 = hasLeftStoich ? 204 : 158
  const arrowX2 = hasLeftStoich ? 316 : 332

  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${UPPER_H}`}
      role="img"
      aria-label={`Reaction overview: ${pathway.equationSummary}`}
      className={styles.svg}
    >
      <PhenolRing
        spec={pathway.stageReactant}
        cx={92}
        cy={104}
        radius={30}
        showName
        nameYOffset={68}
      />

      {pathway.stageStoichRight ? (
        <text
          x={162}
          y={104}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {pathway.stageStoichRight}
        </text>
      ) : null}

      <ReactionArrow
        x1={arrowX1}
        x2={arrowX2}
        y={104}
        above={pathway.stageArrowAbove}
        below={pathway.stageArrowBelow}
        belowTone={pathway.isPoorYield ? 'var(--caution)' : 'var(--fg-muted)'}
      />

      <PhenolRing
        spec={products[0]}
        cx={productCx}
        cy={100}
        radius={28}
        showName
        nameYOffset={76}
      />

      {pathway.id === 'bromination-water' ? (
        <text
          x={548}
          y={100}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          + 3 HBr
        </text>
      ) : null}

      {pathway.id === 'zinc-dust' ? (
        <text
          x={526}
          y={100}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          + ZnO
        </text>
      ) : null}
    </svg>
  )
}

function MultiStepDetailSvg({
  pathway,
  activeStep,
  showMechanism,
}: {
  pathway: PhenolPathway
  activeStep: PathwayStepSpec
  showMechanism: boolean
}) {
  const total = pathway.multiSteps?.length ?? 1
  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
      role="img"
      aria-label={`Step ${activeStep.stepNumber} of ${total}: ${activeStep.explanation}`}
      className={styles.svg}
    >
      <text
        x={310}
        y={22}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {`${activeStep.label} (Stage ${activeStep.stepNumber} of ${total}): ${activeStep.ringState}`}
      </text>

      <PhenolRing
        spec={activeStep.reactant}
        cx={126}
        cy={104}
        radius={26}
        showName
        nameYOffset={80}
      />

      {showMechanism && activeStep.reactant.id === 'phenoxide' ? (
        <CurvedArrow from={{ x: 96, y: 50 }} to={{ x: 122, y: 70 }} bend={-0.38} />
      ) : null}

      <ReactionArrow
        x1={224}
        x2={358}
        y={104}
        above={activeStep.reagentAbove}
        below={activeStep.conditionBelow}
      />

      <PhenolRing
        spec={activeStep.intermediateOrProduct}
        cx={462}
        cy={104}
        radius={26}
        showName
        nameYOffset={80}
      />

      {activeStep.byProductText ? (
        <text
          x={566}
          y={104}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {activeStep.byProductText}
        </text>
      ) : null}

      {showMechanism ? (
        <text
          x={310}
          y={238}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--accent)"
        >
          {pathway.id === 'nitration-modern'
            ? 'Sulphonation limits oxidation; 3 -NO₂ make picric acid strong'
            : pathway.id === 'kolbe'
              ? 'Phenoxide -O⁻ boosts o/p density for attack on CO₂'
              : 'Benzal chloride (-CHCl₂) hydrolyses cleanly in aq. NaOH'}
        </text>
      ) : null}
    </svg>
  )
}

function DetailSvg({
  pathway,
  stepIndex,
  showMechanism,
}: {
  pathway: PhenolPathway
  stepIndex: number
  showMechanism: boolean
}) {
  const pkas = useMemo(() => nitrophenolPkaData(), [])

  // Explicit H-bonding / polarisation comparisons when toggled for Nitration or Bromination
  if (showMechanism && pathway.hasHBondComparison) {
    return (
      <svg
        viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
        role="img"
        aria-label="Comparison of intramolecular hydrogen bonding in o-nitrophenol and intermolecular hydrogen bonding in p-nitrophenol"
        className={styles.svg}
      >
        <HBondNitrophenolComparison variant="side-by-side" />
      </svg>
    )
  }

  if (showMechanism && pathway.hasBr2PolarisationComparison) {
    return (
      <svg
        viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
        role="img"
        aria-label="Comparison showing phenol polarises Br2 directly without FeBr3 catalyst whereas benzene requires FeBr3"
        className={styles.svg}
      >
        <Br2PolarisationComparison aqueous={pathway.id === 'bromination-water'} />
      </svg>
    )
  }

  // Multi-step intermediate stage (modern picric acid, Kolbe, Reimer-Tiemann)
  if (pathway.multiSteps && pathway.multiSteps.length > 0) {
    const safeIdx = Math.min(pathway.multiSteps.length - 1, Math.max(0, stepIndex))
    return (
      <MultiStepDetailSvg
        pathway={pathway}
        activeStep={pathway.multiSteps[safeIdx]}
        showMechanism={showMechanism}
      />
    )
  }

  // Single-step mechanistic / physical insight panel
  if (pathway.id === 'nitration-dilute') {
    return (
      <svg
        viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
        role="img"
        aria-label="Ring activation and pKa comparison for nitrophenols"
        className={styles.svg}
      >
        <text x={310} y={24} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          Activated ortho &amp; para sites + steam distillation note
        </text>
        <PhenolRing spec={STRUCT_PHENOL_ACTIVATED} cx={116} cy={126} radius={34} />
        <CurvedArrow from={{ x: 88, y: 66 }} to={{ x: 112, y: 84 }} bend={-0.38} />
        <rect x={228} y={56} width={376} height={148} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
        <text x={244} y={84} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          {`Table 7.3 pKₐ values: Phenol (${pkas.phenol.printed})`}
        </text>
        <text x={244} y={112} fontSize={15} fontFamily="var(--font-sans)" fill="var(--accent)">
          {`o-Nitrophenol: pKₐ ${pkas.oNitrophenol.printed} (steam volatile)`}
        </text>
        <text x={244} y={140} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          {`p-Nitrophenol: pKₐ ${pkas.pNitrophenol.printed} (less volatile)`}
        </text>
        <text x={244} y={176} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          Toggle H-Bonding View below to compare.
        </text>
      </svg>
    )
  }

  if (pathway.id === 'nitration-conc') {
    return (
      <svg
        viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
        role="img"
        aria-label="Direct concentrated nitration oxidation warning and strong acidity of 2,4,6-trinitrophenol"
        className={styles.svg}
      >
        <text x={310} y={24} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          {showMechanism ? 'Why 2,4,6-Trinitrophenol is a Strong Acid' : 'Ring Oxidation Warning vs Modern Route'}
        </text>

        <rect x={16} y={48} width={286} height={176} rx={12} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1.2} />
        <text x={32} y={76} fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
          Poor yield with direct Conc. HNO₃
        </text>
        <text x={32} y={108} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          Strong oxidising acid destroys
        </text>
        <text x={32} y={130} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          part of the activated ring.
        </text>
        <text x={32} y={168} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          Try the H₂SO₄ then HNO₃ pathway
        </text>
        <text x={32} y={190} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          for the high-yield synthesis.
        </text>

        <rect x={318} y={48} width={286} height={176} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
        <text x={334} y={76} fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          Three -NO₂ groups boost acidity
        </text>
        <text x={334} y={108} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          Electron-withdrawing -NO₂ at C-2,
        </text>
        <text x={334} y={130} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          C-4, C-6 pull density away from -OH,
        </text>
        <text x={334} y={152} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          stabilising the phenoxide anion and
        </text>
        <text x={334} y={174} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          facilitating release of H⁺.
        </text>
      </svg>
    )
  }

  if (pathway.id === 'bromination-cs2' || pathway.id === 'bromination-water') {
    const isWater = pathway.id === 'bromination-water'
    return (
      <svg
        viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
        role="img"
        aria-label="Solvent polarity and Lewis-acid-free bromination summary"
        className={styles.svg}
      >
        <text x={310} y={24} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          {isWater ? 'Aqueous Medium: 2,4,6-Tribromophenol Precipitate' : 'Low-Polarity Medium: Selective Monobromination'}
        </text>
        <PhenolRing spec={STRUCT_PHENOL_ACTIVATED} cx={116} cy={126} radius={34} />
        <CurvedArrow from={{ x: 88, y: 66 }} to={{ x: 112, y: 84 }} bend={-0.38} />
        <rect x={228} y={56} width={376} height={150} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
        <text x={244} y={84} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          {isWater ? 'White precipitate + 3 HBr' : 'Major para + Minor ortho at 273 K'}
        </text>
        <text x={244} y={114} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          {isWater
            ? 'Water permits partial phenoxide (C₆H₅O⁻)'
            : 'CS₂ / CHCl₃ keeps phenol neutral'}
        </text>
        <text x={244} y={138} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
          {isWater
            ? 'ionisation, substituting all 3 o/p sites.'
            : 'and stops reaction after one Br enters.'}
        </text>
        <text x={244} y={176} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          Toggle Mechanistic View below to compare.
        </text>
      </svg>
    )
  }

  // Reduction (Zn dust) or Oxidation (Na2Cr2O7 + H2SO4)
  const isZinc = pathway.id === 'zinc-dust'
  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${LOWER_H}`}
      role="img"
      aria-label={pathway.observationNote}
      className={styles.svg}
    >
      <text x={310} y={24} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {isZinc ? 'C-O Bond Cleavage by Heated Zinc Dust' : 'Oxidative Ring Conversion & Air Oxidation'}
      </text>

      <rect x={16} y={50} width={588} height={168} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />

      <text x={36} y={82} fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill={isZinc ? 'var(--accent)' : 'var(--ox)'}>
        {isZinc ? 'Ring aromaticity preserved (C₆H₅OH → C₆H₆)' : 'Ring aromaticity converted to conjugated diketone'}
      </text>
      <text x={36} y={114} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
        {isZinc
          ? 'Heated zinc removes the phenolic oxygen as solid ZnO.'
          : 'Chromic acid (Na₂Cr₂O₇ + H₂SO₄) forms p-benzoquinone.'}
      </text>
      <text x={36} y={146} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {isZinc
          ? 'Contrast with chromic acid, which forms benzoquinone.'
          : 'In air, phenols slowly oxidise to dark quinone mixtures.'}
      </text>
      {showMechanism ? (
        <text x={36} y={186} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          {deltaText(
            isZinc
              ? 'Net reduction: phenolic O leaves with Zn; ring stays aromatic.'
              : 'Net oxidation: C-1, C-4 become C=O; C2=C3, C5=C6 stay conjugated.',
          )}
        </text>
      ) : null}
    </svg>
  )
}

/**
 * Interactive Phenol Reaction Bench covering all 9 reactions of Section 7.4.4(c):
 * Nitration (dilute, conc., modern two-step), Bromination (CS2/CHCl3, bromine water),
 * Kolbe, Reimer-Tiemann, Zn dust reduction, and chromic acid oxidation.
 */
export function PhenolReactionBench(_props: SimulationProps) {
  const [pathwayId, setPathwayId] = useState<PhenolPathwayId>('nitration-dilute')
  const [stepIndex, setStepIndex] = useState(0)
  const [showMechanism, setShowMechanism] = useState(false)

  const pathway = useMemo(() => getPathway(pathwayId), [pathwayId])
  const multiSteps = pathway.multiSteps
  const activeStep = multiSteps ? multiSteps[Math.min(multiSteps.length - 1, Math.max(0, stepIndex))] : null

  const selectPathway = (nextId: PhenolPathwayId) => {
    setPathwayId(nextId)
    setStepIndex(0)
  }

  const activeRingState = activeStep ? activeStep.ringState : pathway.ringState
  const liveSummary = activeStep
    ? `${pathway.title}. ${activeStep.label}: ${activeStep.explanation} Ring state: ${activeRingState}. Major product: ${pathway.majorProduct}.`
    : `${pathway.title}. Conditions: ${pathway.reagents}, ${pathway.temperatureText}. Major product: ${pathway.majorProduct}. ${pathway.observationNote}`

  const badgeToneClass = pathway.isPoorYield
    ? styles.stageBadgeCaution
    : pathway.isPrecipitate
      ? styles.stageBadgeSuccess
      : ''

  const badgeLabel = pathway.isPoorYield
    ? 'Poor yield (ring oxidation)'
    : pathway.isPrecipitate
      ? 'White precipitate'
      : pathway.temperatureText

  return (
    <div className={styles.root} data-testid="phenol-reaction-bench">
      <div className={styles.twoZone}>
        {/* Left visual column: Upper overall reaction + Lower step/mechanism focus */}
        <div className={styles.visualCol}>
          <div className={styles.stageCard}>
            <div className={styles.stageHeader}>
              <span className={styles.stageLabel}>Reaction Overview</span>
              <span className={`${styles.stageBadge} ${badgeToneClass}`} data-testid="bench-status-badge">
                {badgeLabel}
              </span>
            </div>
            <UpperReactionSvg pathway={pathway} />
          </div>

          <div className={styles.stageCard}>
            <div className={styles.stageHeader}>
              <span className={styles.stageLabel}>
                {multiSteps
                  ? 'Step-by-Step Intermediate Stage'
                  : showMechanism && (pathway.hasHBondComparison || pathway.hasBr2PolarisationComparison)
                    ? 'Mechanistic & Physical Comparison'
                    : 'Ring State & Mechanistic Insight'}
              </span>
            </div>
            <DetailSvg pathway={pathway} stepIndex={stepIndex} showMechanism={showMechanism} />
          </div>
        </div>

        {/* Right readout column */}
        <div className={styles.readoutCol}>
          <h4 className={styles.pathwayTitle} data-testid="bench-pathway-title">
            {pathway.title}
          </h4>
          <p className={styles.equationBox} data-testid="bench-equation">
            {pathway.equationSummary}
          </p>

          <div className={styles.readoutGrid}>
            <div className={styles.readoutCard}>
              <span className={styles.readoutKey}>Conditions &amp; Catalyst</span>
              <p className={styles.readoutValue} data-testid="bench-conditions">
                {`${pathway.reagents} | ${pathway.solvent} | ${pathway.temperatureText}`}
              </p>
              <p className={styles.readoutValue}>{pathway.catalystNote}</p>
            </div>

            <div className={styles.readoutCard}>
              <span className={styles.readoutKey}>Ring State</span>
              <span className={styles.ringPill} data-testid="bench-ring-state">
                {activeRingState}
              </span>
            </div>

            <div className={styles.readoutCard}>
              <span className={styles.readoutKey}>Major Product &amp; By-products</span>
              <p className={styles.readoutValue} data-testid="bench-products">
                <strong>{pathway.majorProduct}</strong>
                {` | By-products: ${pathway.minorOrByProducts}`}
              </p>
            </div>

            <div className={styles.readoutCard}>
              <span className={styles.readoutKey}>
                {activeStep ? `${activeStep.label} Note` : 'Observation & Yield Note'}
              </span>
              <p className={styles.readoutValue} data-testid="bench-observation">
                {activeStep ? activeStep.explanation : pathway.observationNote}
              </p>
            </div>
          </div>

          <p className={styles.srOnly} aria-live="polite" data-testid="phenol-bench-live">
            {liveSummary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controlsRoot}>
          <div className={styles.pathwayGroups} role="group" aria-label="Phenol reaction pathways">
            {GROUP_ORDER.map((group) => (
              <div key={group} className={styles.groupBox}>
                <span className={styles.groupTitle}>{PHENOL_GROUP_LABELS[group]}</span>
                <div className={styles.buttonWrap}>
                  {PHENOL_PATHWAYS.filter((p) => p.group === group).map((item) => {
                    const active = item.id === pathwayId
                    return (
                      <Button
                        key={item.id}
                        variant="secondary"
                        aria-pressed={active}
                        className={`${styles.pathwayButton} ${active ? styles.pressed : ''}`}
                        onClick={() => selectPathway(item.id)}
                      >
                        {item.buttonLabel}
                      </Button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.inspectRow}>
            <div className={styles.stepBar} role="group" aria-label="Multi-step intermediate controls">
              {multiSteps ? (
                multiSteps.map((s, idx) => {
                  const isCurrent = idx === Math.min(multiSteps.length - 1, stepIndex)
                  return (
                    <Button
                      key={s.label}
                      variant="secondary"
                      aria-pressed={isCurrent}
                      className={`${styles.pathwayButton} ${isCurrent ? styles.pressed : ''}`}
                      onClick={() => setStepIndex(idx)}
                    >
                      {s.label}
                    </Button>
                  )
                })
              ) : (
                <span className={styles.stepHint}>
                  Single-step pathway (select H₂SO₄ → HNO₃, Kolbe, or Reimer-Tiemann for step-through intermediates)
                </span>
              )}
            </div>

            <Toggle
              label="Show Mechanistic / H-Bonding View"
              checked={showMechanism}
              onChange={setShowMechanism}
            />
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
