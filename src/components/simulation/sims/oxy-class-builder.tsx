'use client'

import { useState } from 'react'
import { Button, Segmented, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { OxyDiagram } from '@/components/animations/c12-unit7/classes/OxyDiagram'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  DEFAULT_OXY_SPEC,
  OXY_PRESETS,
  buildOxyMolecule,
  type AlcoholDegree,
  type AttachmentEnv,
  type EtherGroup,
  type OxyBuilderSpec,
  type SimFamilyMode,
} from '@/lib/chem/c12-u7-s1-classification'
import styles from './oxy-class-builder.module.css'

const VIEW = { width: 560, height: 340 }

const FAMILY_OPTIONS: readonly { value: SimFamilyMode; label: string }[] = [
  { value: 'alcohol-phenol', label: 'Alcohol / Phenol' },
  { value: 'ether', label: 'Ether' },
]

const ENV_OPTIONS: readonly { value: AttachmentEnv; label: string }[] = [
  { value: 'aliphatic', label: 'Aliphatic chain (sp³ C)' },
  { value: 'allylic', label: 'Allylic (sp³ C next to C=C)' },
  { value: 'benzylic', label: 'Benzylic (sp³ C next to benzene)' },
  { value: 'spacer-benzene', label: 'Spacer + Benzene (non-benzylic sp³ C)' },
  { value: 'vinylic', label: 'Vinylic (sp² C=C)' },
  { value: 'aromatic', label: 'Aromatic ring (sp² phenol C)' },
]

const DEGREE_OPTIONS: readonly { value: AlcoholDegree; label: string }[] = [
  { value: '1°', label: '1° (-CH₂-OH)' },
  { value: '2°', label: '2° (>CH-OH)' },
  { value: '3°', label: '3° (>C-OH)' },
]

const COUNT_OPTIONS: readonly { value: '1' | '2' | '3'; label: string }[] = [
  { value: '1', label: '1 (monohydric)' },
  { value: '2', label: '2 (dihydric)' },
  { value: '3', label: '3 (trihydric)' },
]

const ETHER_GROUP_OPTIONS: readonly { value: EtherGroup; label: string }[] = [
  { value: 'CH3', label: 'Methyl (CH₃)' },
  { value: 'C2H5', label: 'Ethyl (C₂H₅)' },
  { value: 'C6H5', label: 'Phenyl (C₆H₅)' },
]

function primaryFamilyLabel(family: 'alcohol' | 'phenol' | 'ether'): string {
  if (family === 'alcohol') return 'Alcohol'
  if (family === 'phenol') return 'Phenol'
  return 'Ether'
}

function stageHint(built: ReturnType<typeof buildOxyMolecule>): string {
  const c = built.classification
  if (c.family === 'ether') {
    return c.etherSymmetry === 'simple'
      ? 'Symmetrical arms (R₁ = R₂) across the oxygen bridge'
      : 'Unsymmetrical arms (R₁ ≠ R₂) across the oxygen bridge'
  }
  if (c.family === 'phenol') return '–OH bonded directly to sp² aromatic ring carbon'
  if (c.subclassKind === 'vinylic') return '–OH bonded directly to sp² C=C carbon (120° planar)'
  if (c.subclassKind === 'allylic') return 'sp³ C–OH adjacent to C=C double bond'
  if (c.subclassKind === 'benzylic') return 'sp³ C–OH directly adjacent to benzene ring'
  if (c.spacerAtoms.length > 0) return '–CH₂– spacer separates C–OH from benzene ring'
  if (c.hydroxylCount > 1) return `${c.hydroxylCount} hydroxyl groups on aliphatic carbon chain`
  return `sp³ C–OH carbon with ${c.degree} substitution`
}

export function OxyClassBuilder(_props: SimulationProps) {
  const [spec, setSpec] = useState<OxyBuilderSpec>(DEFAULT_OXY_SPEC)
  const built = buildOxyMolecule(spec)
  const c = built.classification
  const graph = parseSmiles(built.smiles)
  const hasSpacerWarning = c.spacerAtoms.length > 0

  const supportsPoly = spec.env === 'aliphatic' || spec.env === 'aromatic'
  const showDegree =
    spec.mode === 'alcohol-phenol' &&
    spec.env !== 'vinylic' &&
    spec.env !== 'aromatic' &&
    (!supportsPoly || spec.hydroxylCount === 1)

  const hint = stageHint(built)
  const hintColor = hasSpacerWarning
    ? 'var(--caution)'
    : c.carbonHybridisation === 'sp²'
      ? 'var(--ox)'
      : 'var(--orbital-neg)'

  const classCellLabel = c.family === 'ether' ? 'Symmetry class' : 'Hydroxyl class'
  const classCellValue =
    c.family === 'ether'
      ? c.etherSymmetry === 'simple'
        ? 'Symmetrical'
        : 'Unsymmetrical'
      : c.hydroxylClass ?? 'Monohydric'

  const liveSummary = `${built.iupac}, ${built.formula}: ${c.subclassLabel}. ${c.ruleTrace}`

  return (
    <div className={styles.builder} data-testid="oxy-class-builder">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg
            viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
            role="img"
            aria-label={`Structure of ${built.iupac}: ${c.subclassLabel}`}
            className={styles.drawing}
            data-testid="oxy-drawing"
          >
            <OxyDiagram
              graph={graph}
              classification={c}
              cx={VIEW.width / 2}
              cy={136}
              maxW={480}
              maxH={198}
              minScale={44}
              maxScale={80}
              highlightOh={c.family !== 'ether'}
              numberCarbons={c.family === 'alcohol' && c.hydroxylCount === 1 && c.carbonHybridisation === 'sp³'}
              labelRingAlkyl={c.family === 'phenol'}
              showPlanarAngle={c.subclassKind === 'vinylic'}
              showLonePairs={c.family === 'ether'}
              etherOverlay={
                built.etherArms
                  ? {
                      leftLabel: built.etherArms.leftLabel,
                      rightLabel: built.etherArms.rightLabel,
                      symmetrical: built.etherArms.same,
                    }
                  : undefined
              }
              surfaceFill="var(--surface)"
            />
            <text
              x={VIEW.width / 2}
              y={290}
              textAnchor="middle"
              fontSize={16}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {built.condensed}
            </text>
            <text
              x={VIEW.width / 2}
              y={320}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={hintColor}
            >
              {hint}
            </text>
          </svg>
          <figcaption className={styles.caption}>
            Pick any preset or modify the carbon framework and oxygen attachment below.
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <div className={styles.titleGroup}>
            <p className={styles.name} data-testid="oxy-name">
              {built.iupac}
            </p>
            <p className={styles.commonFormula}>
              {built.common ? `${built.common} · ` : ''}
              {built.formula}
            </p>
          </div>

          <p
            className={`${styles.verdict} ${hasSpacerWarning ? styles.verdictCaution : ''}`}
            data-testid="oxy-verdict"
          >
            {c.subclassLabel}
          </p>

          <dl className={styles.readoutGrid}>
            <div className={styles.readoutCell}>
              <dt className={styles.readoutLabel}>Primary family</dt>
              <dd className={styles.readoutValue} data-testid="oxy-family">
                {primaryFamilyLabel(c.family)}
              </dd>
            </div>
            <div className={styles.readoutCell}>
              <dt className={styles.readoutLabel}>{classCellLabel}</dt>
              <dd className={styles.readoutValue} data-testid="oxy-class">
                {classCellValue}
              </dd>
            </div>
            <div className={styles.readoutCell}>
              <dt className={styles.readoutLabel}>C–O carbon</dt>
              <dd className={styles.readoutValue} data-testid="oxy-hyb">
                {c.carbonHybridisation}
              </dd>
            </div>
            <div className={styles.readoutCell}>
              <dt className={styles.readoutLabel}>Degree</dt>
              <dd className={styles.readoutValue} data-testid="oxy-degree">
                {c.degree}
              </dd>
            </div>
          </dl>

          <p
            className={`${styles.ruleTrace} ${hasSpacerWarning ? styles.ruleTraceCaution : ''}`}
            data-testid="oxy-rule-trace"
          >
            {c.ruleTrace}
          </p>

          <div className={styles.legend} aria-hidden="true">
            <span className={styles.legendItem}>
              <span className={styles.swatchSp3} />
              sp³ C–O
            </span>
            <span className={styles.legendItem}>
              <span className={styles.swatchSp2} />
              sp² C–O / C=C
            </span>
            <span className={styles.legendItem}>
              <span className={styles.swatchSpacer} />
              –CH₂– spacer
            </span>
          </div>

          <p className={styles.srOnly} aria-live="polite" data-testid="oxy-live">
            {liveSummary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.row}>
            <div className={styles.controlGroup}>
              <span className={styles.groupLabel}>Family mode</span>
              <Segmented
                label="Family mode"
                options={FAMILY_OPTIONS}
                value={spec.mode}
                onChange={(mode) => setSpec((prev) => ({ ...prev, mode }))}
              />
            </div>

            {spec.mode === 'alcohol-phenol' && supportsPoly && (
              <div className={styles.controlGroup}>
                <span className={styles.groupLabel}>Hydroxyl count</span>
                <Segmented
                  label="Hydroxyl count"
                  options={COUNT_OPTIONS}
                  value={String(spec.hydroxylCount) as '1' | '2' | '3'}
                  onChange={(v) =>
                    setSpec((prev) => ({
                      ...prev,
                      hydroxylCount: Number(v) as 1 | 2 | 3,
                    }))
                  }
                />
              </div>
            )}
          </div>

          {spec.mode === 'alcohol-phenol' ? (
            <>
              <div className={styles.controlGroup}>
                <span className={styles.groupLabel}>Attachment environment</span>
                <div className={styles.envGrid} role="radiogroup" aria-label="Attachment environment">
                  {ENV_OPTIONS.map((opt) => {
                    const checked = spec.env === opt.value
                    return (
                      <Button
                        key={opt.value}
                        role="radio"
                        aria-checked={checked}
                        variant={checked ? 'primary' : 'secondary'}
                        className={styles.envChip}
                        onClick={() =>
                          setSpec((prev) => ({
                            ...prev,
                            env: opt.value,
                            hydroxylCount:
                              opt.value === 'aliphatic' || opt.value === 'aromatic' ? prev.hydroxylCount : 1,
                          }))
                        }
                      >
                        {opt.label}
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className={styles.row}>
                {showDegree ? (
                  <div className={styles.controlGroup}>
                    <span className={styles.groupLabel}>Carbon degree</span>
                    <Segmented
                      label="Carbon degree"
                      options={DEGREE_OPTIONS}
                      value={spec.degree}
                      onChange={(degree) => setSpec((prev) => ({ ...prev, degree }))}
                    />
                  </div>
                ) : (
                  <span className={styles.noteBadge}>
                    Degree (1°, 2°, 3°) applies to monohydric sp³ alcohols; here degree is N/A.
                  </span>
                )}

                {spec.env === 'aromatic' && spec.hydroxylCount === 1 && (
                  <div className={styles.controlGroup}>
                    <span className={styles.groupLabel}>Ring substituent</span>
                    <Toggle
                      label="Add 2-CH₃ substituent (o-cresol)"
                      checked={spec.orthoMethyl}
                      onChange={(orthoMethyl) => setSpec((prev) => ({ ...prev, orthoMethyl }))}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.row}>
              <div className={styles.controlGroup}>
                <span className={styles.groupLabel}>Left group (R₁)</span>
                <Segmented
                  label="Left group R1"
                  options={ETHER_GROUP_OPTIONS}
                  value={spec.r1}
                  onChange={(r1) => setSpec((prev) => ({ ...prev, r1 }))}
                />
              </div>
              <div className={styles.controlGroup}>
                <span className={styles.groupLabel}>Right group (R₂)</span>
                <Segmented
                  label="Right group R2"
                  options={ETHER_GROUP_OPTIONS}
                  value={spec.r2}
                  onChange={(r2) => setSpec((prev) => ({ ...prev, r2 }))}
                />
              </div>
            </div>
          )}

          <div className={styles.controlGroup}>
            <span className={styles.groupLabel}>Section 7.1 presets</span>
            <div className={styles.gallery} role="group" aria-label="Section 7.1 presets">
              {OXY_PRESETS.map((preset) => {
                const active = built.presetId === preset.id
                return (
                  <Button
                    key={preset.id}
                    variant={active ? 'primary' : 'secondary'}
                    aria-pressed={active}
                    className={styles.presetButton}
                    onClick={() => setSpec(preset.spec)}
                  >
                    {preset.label}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
