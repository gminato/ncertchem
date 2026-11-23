'use client'

import { useState } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { MoleculeDiagram } from '@/components/animations/c12-unit7/nomenclature/MoleculeDiagram'
import {
  ALCOHOL_PRESETS,
  getAlcoholNomenclature,
  getEtherPairNomenclature,
  getPhenolNomenclature,
  getSpecialEtherNomenclature,
  type AlcoholPresetId,
  type EtherLeftGroup,
  type EtherRightGroup,
  type EtherSpecialPreset,
  type IupacToken,
  type NomenclatureEntry,
  type PhenolSubstituent,
  type RingPosition,
} from '@/lib/chem/c12-u7-s2-nomenclature'
import styles from './oxygen-group-namer.module.css'

type Family = 'alcohols' | 'phenols' | 'ethers'

const FAMILY_OPTIONS: { value: Family; label: string }[] = [
  { value: 'alcohols', label: 'Alcohols' },
  { value: 'phenols', label: 'Phenols' },
  { value: 'ethers', label: 'Ethers' },
]

const PHENOL_SUB_OPTIONS: { value: PhenolSubstituent; label: string }[] = [
  { value: 'none', label: 'None (Phenol)' },
  { value: 'methyl', label: 'Methyl (Cresol)' },
  { value: 'hydroxyl', label: 'Hydroxyl (Benzenediol)' },
]

const RING_POS_OPTIONS: { value: RingPosition; label: string }[] = [
  { value: 'ortho', label: '1,2 (ortho)' },
  { value: 'meta', label: '1,3 (meta)' },
  { value: 'para', label: '1,4 (para)' },
]

const ETHER_LEFT_OPTIONS: { value: EtherLeftGroup; label: string }[] = [
  { value: 'methyl', label: 'Methyl' },
  { value: 'ethyl', label: 'Ethyl' },
  { value: 'isopropyl', label: 'Isopropyl' },
  { value: 'phenyl', label: 'Phenyl' },
]

const ETHER_RIGHT_OPTIONS: { value: EtherRightGroup; label: string }[] = [
  { value: 'methyl', label: 'Methyl' },
  { value: 'ethyl', label: 'Ethyl' },
  { value: 'propyl', label: 'n-Propyl' },
  { value: 'isopentyl', label: 'Isopentyl' },
  { value: 'heptyl', label: 'Heptyl' },
  { value: 'phenyl', label: 'Phenyl' },
]

const ETHER_SPECIAL_PRESETS: { id: EtherSpecialPreset; label: string }[] = [
  { id: '1,2-dimethoxyethane', label: '1,2-Dimethoxyethane' },
  { id: '2-ethoxy-1,1-dimethylcyclohexane', label: '2-Ethoxy-1,1-dimethylcyclohexane' },
]

function tokenClass(kind: IupacToken['kind']): string {
  switch (kind) {
    case 'locant':
      return styles.tokLocant
    case 'substituent':
      return styles.tokSubstituent
    case 'parent':
      return styles.tokParent
    case 'suffix':
      return styles.tokSuffix
    case 'punctuation':
      return styles.tokPunctuation
  }
}

export function OxygenGroupNamer(_props: SimulationProps) {
  const [family, setFamily] = useState<Family>('alcohols')
  const [showNumbering, setShowNumbering] = useState(true)

  // Alcohols state
  const [alcoholId, setAlcoholId] = useState<AlcoholPresetId>('2-methylpropan-1-ol')

  // Phenols state
  const [phenolSub, setPhenolSub] = useState<PhenolSubstituent>('methyl')
  const [ringPos, setRingPos] = useState<RingPosition>('ortho')

  // Ethers state
  const [etherLeft, setEtherLeft] = useState<EtherLeftGroup>('phenyl')
  const [etherRight, setEtherRight] = useState<EtherRightGroup>('heptyl')
  const [etherSpecial, setEtherSpecial] = useState<EtherSpecialPreset | null>(null)

  const entry: NomenclatureEntry =
    family === 'alcohols'
      ? getAlcoholNomenclature(alcoholId)
      : family === 'phenols'
        ? getPhenolNomenclature(phenolSub, ringPos)
        : etherSpecial
          ? getSpecialEtherNomenclature(etherSpecial)
          : getEtherPairNomenclature(etherLeft, etherRight)

  const commonText = entry.commonName
    ? entry.commonAlt
      ? `${entry.commonName} (${entry.commonAlt})`
      : entry.commonName
    : 'None listed'

  const iupacText = entry.iupacAlt ? `${entry.iupacName} (${entry.iupacAlt})` : entry.iupacName

  const summary = [
    `IUPAC name: ${iupacText}.`,
    `Common name: ${commonText}.`,
    `Formula: ${entry.condensedFormula} (${entry.molecularFormula}).`,
    `Rule: ${entry.parentRuleBadge}.`,
  ].join(' ')

  const selectLeftEther = (val: EtherLeftGroup) => {
    setEtherSpecial(null)
    if (val === 'phenyl' && etherRight === 'phenyl') {
      setEtherRight('methyl')
    }
    setEtherLeft(val)
  }

  const selectRightEther = (val: EtherRightGroup) => {
    setEtherSpecial(null)
    if (val === 'phenyl' && etherLeft === 'phenyl') {
      setEtherLeft('methyl')
    }
    setEtherRight(val)
  }

  return (
    <div className={styles.namer} data-testid="oxygen-group-namer">
      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.topBar}>
            <Segmented
              label="Compound family"
              options={FAMILY_OPTIONS}
              value={family}
              onChange={setFamily}
            />
            <Toggle
              label="Show carbon numbering"
              checked={showNumbering}
              onChange={setShowNumbering}
            />
          </div>

          {family === 'alcohols' && (
            <div className={styles.groupField}>
              <span className={styles.groupLabel}>Carbon skeleton preset</span>
              <div role="group" aria-label="Carbon skeleton" className={styles.buttonRow}>
                {ALCOHOL_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={alcoholId === preset.id}
                    className={styles.presetBtn}
                    onClick={() => setAlcoholId(preset.id)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {family === 'phenols' && (
            <div className={styles.etherSelectors}>
              <div className={styles.groupField}>
                <span className={styles.groupLabel}>Second substituent</span>
                <div role="radiogroup" aria-label="Second substituent" className={styles.radioStrip}>
                  {PHENOL_SUB_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={phenolSub === opt.value}
                      className={styles.radioStripBtn}
                      onClick={() => setPhenolSub(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.groupField}>
                <span className={styles.groupLabel}>Ring position</span>
                <div role="radiogroup" aria-label="Ring position" className={styles.radioStrip}>
                  {RING_POS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="radio"
                      aria-checked={ringPos === opt.value}
                      disabled={phenolSub === 'none'}
                      className={styles.radioStripBtn}
                      onClick={() => setRingPos(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {family === 'ethers' && (
            <>
              <div className={styles.etherSelectors}>
                <div className={styles.groupField}>
                  <span className={styles.groupLabel}>Left group R1</span>
                  <div role="radiogroup" aria-label="Left group R1" className={styles.radioStrip}>
                    {ETHER_LEFT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={etherSpecial === null && etherLeft === opt.value}
                        disabled={opt.value === 'phenyl' && etherRight === 'phenyl' && etherSpecial === null}
                        className={styles.radioStripBtn}
                        onClick={() => selectLeftEther(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.groupField}>
                  <span className={styles.groupLabel}>Right group R2</span>
                  <div role="radiogroup" aria-label="Right group R2" className={styles.radioStrip}>
                    {ETHER_RIGHT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={etherSpecial === null && etherRight === opt.value}
                        disabled={opt.value === 'phenyl' && etherLeft === 'phenyl' && etherSpecial === null}
                        className={styles.radioStripBtn}
                        onClick={() => selectRightEther(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.groupField}>
                <span className={styles.groupLabel}>Special Table 7.2 presets</span>
                <div role="group" aria-label="Special ether presets" className={styles.buttonRow}>
                  {ETHER_SPECIAL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      aria-pressed={etherSpecial === preset.id}
                      className={styles.presetBtn}
                      onClick={() => setEtherSpecial(preset.id)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SimulationControls>

      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg
            viewBox="0 0 520 340"
            role="img"
            aria-label={`Structure of ${entry.iupacName}`}
            className={styles.drawing}
            data-testid="oxygen-drawing"
          >
            <MoleculeDiagram
              structure={entry.structure}
              cx={260}
              cy={170}
              maxWidth={456}
              maxHeight={276}
              maxScale={62}
              showNumbering={showNumbering}
            />
          </svg>
          <figcaption className={styles.caption}>
            <span className={styles.legendItem}>
              <span className={styles.swatchParent} aria-hidden="true" />
              Parent skeleton
            </span>
            <span className={styles.legendItem}>
              <span className={styles.swatchFunctional} aria-hidden="true" />
              Functional oxygen (-OH / -O-)
            </span>
            <span className={styles.legendItem}>
              <span className={styles.swatchBranch} aria-hidden="true" />
              Substituent / alkyl branch
            </span>
          </figcaption>
        </figure>

        <section className={styles.panel} aria-label="Nomenclature derivation">
          <div className={styles.ruleBadge} data-testid="parent-rule-badge">
            {entry.parentRuleBadge}
          </div>

          <div>
            <p className={styles.sectionLabel}>IUPAC name</p>
            <p className={styles.iupacName} data-testid="iupac-name">
              {entry.iupacTokens.map((tok, i) => (
                <span key={`${tok.kind}-${i}`} className={tokenClass(tok.kind)}>
                  {tok.text}
                </span>
              ))}
              {entry.iupacAlt ? <span className={styles.iupacAlt}> ({entry.iupacAlt})</span> : null}
            </p>
            <div className={styles.tokenKey} aria-hidden="true">
              <span className={styles.tokLocant}>Locant</span>
              <span className={styles.tokSubstituent}>Substituent</span>
              <span className={styles.tokParent}>Parent</span>
              <span className={styles.tokSuffix}>Suffix</span>
            </div>
          </div>

          <div className={styles.metaGrid}>
            <p className={styles.metaRow}>
              <span className={styles.metaKey}>Formula: </span>
              <span className={styles.mono} data-testid="condensed-formula">
                {entry.condensedFormula}
              </span>{' '}
              ({entry.molecularFormula})
            </p>
            <p className={styles.metaRow} data-testid="common-name">
              <span className={styles.metaKey}>Common name: </span>
              {commonText}
            </p>
          </div>

          <div>
            <p className={styles.sectionLabel}>Step-by-step rule derivation</p>
            <ol className={styles.steps} data-testid="derivation-steps">
              {entry.steps.map((stepText, idx) => (
                <li key={idx}>{stepText}</li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      <p className={styles.srOnly} aria-live="polite" data-testid="namer-live">
        {summary}
      </p>
    </div>
  )
}
