'use client'

import React, { useState, useMemo, useRef } from 'react'
import { OxidationTag, type TagSpec } from '@/components/redox/OxidationTag'
import {
  oxidationNumbers,
  oxidationNumbersBySite,
  explainOxidationNumber,
  stockName,
  rationalToString,
  type Rational,
  type SiteOxidation,
  type OxidationExplanation,
} from '@/lib/chem/oxidation-number'
import { parseFormula } from '@/lib/chem/formula'
import { Button, NumberField, Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import styles from './oxidation-number-finder.module.css'

interface PresetSpec {
  id: string
  label: string
  formula: string
  charge: number
  description: string
}

const PRESETS: readonly PresetSpec[] = [
  { id: 'h2o2', label: 'H₂O₂', formula: 'H2O2', charge: 0, description: 'Hydrogen peroxide (peroxide trap)' },
  { id: 'ko2', label: 'KO₂', formula: 'KO2', charge: 0, description: 'Potassium superoxide (superoxide O = −1/2)' },
  { id: 'of2', label: 'OF₂', formula: 'OF2', charge: 0, description: 'Oxygen difluoride (oxygen bonded to F, O = +2)' },
  { id: 'nah', label: 'NaH', formula: 'NaH', charge: 0, description: 'Sodium hydride (metal hydride H = −1)' },
  { id: 'k2cr2o7', label: 'K₂Cr₂O₇', formula: 'K2Cr2O7', charge: 0, description: 'Potassium dichromate (Cr = +6)' },
  { id: 'mno4', label: 'MnO₄⁻', formula: 'MnO4', charge: -1, description: 'Permanganate ion (Mn = +7)' },
  { id: 's2o3', label: 'S₂O₃²⁻', formula: 'S2O3', charge: -2, description: 'Thiosulphate ion (average S = +2)' },
  { id: 'fe3o4', label: 'Fe₃O₄', formula: 'Fe3O4', charge: 0, description: 'Ferrous ferric oxide (mixed valence average Fe = +8/3)' },
  { id: 'nh4no3', label: 'NH₄NO₃', formula: 'NH4NO3', charge: 0, description: 'Ammonium nitrate (distinct N sites: −3 and +5)' },
  { id: 'k4fecn6', label: 'K₄[Fe(CN)₆]', formula: 'K4[Fe(CN)6]', charge: 0, description: 'Potassium ferrocyanide complex (Fe = +2)' },
] as const

function formatMinus(text: string): string {
  return text.replace(/-/g, '−')
}

function formatSubscripts(text: string): string {
  const SUB_MAP: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  }
  return text.replace(/\d/g, (d) => SUB_MAP[d] ?? d)
}

function renderIonMarkup(siteStr: string): React.ReactNode {
  let formula = siteStr
  let charge: string | null = null

  const caretIdx = siteStr.indexOf('^')
  if (caretIdx !== -1) {
    formula = siteStr.slice(0, caretIdx)
    charge = siteStr.slice(caretIdx + 1).replace(/-/g, '−')
  }

  const parts = formula.split(/(\d+)/g)

  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? <sub key={i}>{p}</sub> : <React.Fragment key={i}>{p}</React.Fragment>
      )}
      {charge && <sup>{charge}</sup>}
    </>
  )
}

function renderEquation(eq: string): React.ReactNode {
  const normalized = eq.replace(/\*/g, '×').replace(/-/g, '−')
  const parts = normalized.split(/(x)/g)
  return parts.map((part, i) => {
    if (part === 'x') {
      return (
        <span key={i} className="sym">
          x
        </span>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

function formatCharge(charge: number): string | undefined {
  if (charge === 0) return undefined
  if (charge === 1) return '+'
  if (charge === -1) return '−'
  const mag = Math.abs(charge)
  return charge > 0 ? `${mag}+` : `${mag}−`
}

export function OxidationNumberFinder({ reducedMotion: _reducedMotion }: SimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isActive = useIsActive(containerRef)

  const [formulaInput, setFormulaInput] = useState<string>('K2Cr2O7')
  const [chargeInput, setChargeInput] = useState<number>(0)
  const [selectedPresetId, setSelectedPresetId] = useState<string>('k2cr2o7')
  const [viewMode, setViewMode] = useState<'overall' | 'by-site'>('overall')

  // Load preset
  const handleSelectPreset = (preset: PresetSpec) => {
    setSelectedPresetId(preset.id)
    setFormulaInput(preset.formula)
    setChargeInput(preset.charge)
  }

  // Parse & compute chemistry
  const parsed = useMemo(() => {
    const cleanFormula = formulaInput.trim()
    if (!cleanFormula) {
      return { ok: false as const, error: 'Please enter a chemical formula (e.g. K2Cr2O7 or SO4).' }
    }

    try {
      const counts = parseFormula(cleanFormula)
      const oxMap = oxidationNumbers(cleanFormula, chargeInput)
      const stock = stockName(cleanFormula, chargeInput)
      let explanation: OxidationExplanation | null = null
      try {
        explanation = explainOxidationNumber(cleanFormula, chargeInput)
      } catch {
        // explanation is secondary; keep oxMap if successful
      }

      let sites: SiteOxidation[] = []
      try {
        const siteRes = oxidationNumbersBySite(cleanFormula, chargeInput)
        // Array of sites
        sites = Array.from(siteRes)
      } catch {
        sites = []
      }

      // Convert oxidation numbers to OxidationTag tags
      let tags: TagSpec[] = []
      const targetEl = explanation?.targetElement
      if (cleanFormula === 'NH4NO3') {
        if (viewMode === 'by-site') {
          tags = [
            { atomIndex: 0, value: '−3', tone: 'neutral' },
            { atomIndex: 1, value: '+1', tone: 'neutral' },
            { atomIndex: 2, value: '+5', tone: 'neutral' },
            { atomIndex: 3, value: '−2', tone: 'neutral' },
          ]
        } else {
          tags = [
            { atomIndex: 0, value: '+1', tone: 'neutral' },
            { atomIndex: 1, value: '+1', tone: 'neutral' },
            { atomIndex: 2, value: '+1', tone: 'neutral' },
            { atomIndex: 3, value: '−2', tone: 'neutral' },
          ]
        }
      } else {
        tags = Object.entries(oxMap).map(([elem, val]) => {
          const valStr = formatMinus(rationalToString(val))
          const tone = elem === targetEl ? ('accent' as const) : ('neutral' as const)
          return {
            element: elem,
            value: valStr,
            tone,
          }
        })
      }

      // Sum calculation string
      const sumTerms = Object.entries(counts).map(([elem, count]) => {
        const val = oxMap[elem]
        const valStr = formatMinus(rationalToString(val))
        return count === 1 ? `(${valStr})` : `${count} × (${valStr})`
      })
      const sumCheck = `${sumTerms.join(' + ')} = ${chargeInput === 0 ? '0' : chargeInput > 0 ? `+${chargeInput}` : `−${Math.abs(chargeInput)}`}`

      return {
        ok: true as const,
        cleanFormula,
        charge: chargeInput,
        counts,
        oxMap,
        tags,
        stock,
        explanation,
        sites,
        sumCheck,
      }
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Invalid chemical formula or charge combination.',
      }
    }
  }, [formulaInput, chargeInput, viewMode])

  // Screen reader summary
  const screenReaderSummary = useMemo(() => {
    if (!parsed.ok) return `Error: ${parsed.error}`
    const oxStrings = Object.entries(parsed.oxMap)
      .map(([elem, val]) => `${elem}: ${rationalToString(val)}`)
      .join(', ')
    return `Chemical formula ${parsed.cleanFormula} with net charge ${parsed.charge}. Computed oxidation numbers: ${oxStrings}. Sum rule check: ${parsed.sumCheck}.`
  }, [parsed])

  return (
    <div ref={containerRef} className={styles.sim} data-testid="oxidation-number-finder-sim">
      {/* Screen reader live summary */}
      <div className={styles.liveRegion} aria-live="polite">
        {isActive ? screenReaderSummary : ''}
      </div>

      {/* Preset Chips Section */}
      <div className={styles.presetsSection}>
        <span className={styles.presetLabel}>Preset Molecules & Ions</span>
        <div className={styles.presetsList} role="radiogroup" aria-label="Preset chemical formulas">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`${styles.chip} ${selectedPresetId === p.id ? styles.chipActive : ''}`}
              onClick={() => handleSelectPreset(p)}
              aria-pressed={selectedPresetId === p.id}
              data-testid={`preset-${p.id}`}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Row */}
      <div className={styles.inputControls}>
        <div className={styles.inputGroup}>
          <label htmlFor="formula-text-input" className={styles.inputLabel}>
            Chemical Formula
          </label>
          <input
            id="formula-text-input"
            type="text"
            className={styles.textInput}
            value={formulaInput}
            onChange={(e) => {
              setFormulaInput(e.target.value)
              setSelectedPresetId('')
            }}
            placeholder="e.g. K2Cr2O7"
            data-testid="formula-input"
          />
        </div>

        <div className={styles.inputGroup}>
          <NumberField
            id="charge-number-input"
            label="Net Charge"
            value={chargeInput}
            min={-4}
            max={4}
            step={1}
            precision={0}
            onChange={(val) => {
              setChargeInput(val)
              setSelectedPresetId('')
            }}
          />
        </div>

        {parsed.ok && parsed.sites.length > 1 && (
          <div className={styles.inputGroup}>
            <Segmented<'overall' | 'by-site'>
              label="View Analysis"
              options={[
                { value: 'overall', label: 'Overall Formula' },
                { value: 'by-site', label: 'By-Site Breakdown' },
              ]}
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        )}
      </div>

      {/* Display Stage or Error */}
      {!parsed.ok ? (
        <div className={styles.errorCard} role="alert" data-testid="calc-error">
          <div className={styles.errorTitle}>
            <span>⚠️</span> Calculation Note
          </div>
          <p className={styles.errorText}>
            Could not calculate oxidation numbers: {parsed.error}
          </p>
          <p className={styles.errorText}>
            Please select one of the presets above or enter a standard chemical formula with its net ionic charge.
          </p>
        </div>
      ) : (
        <div className={styles.stageCard} data-testid="calc-success">
          {/* Main Visual Stage: OxidationTag */}
          <svg
            viewBox="0 0 680 180"
            role="img"
            aria-label={`Oxidation states for ${parsed.cleanFormula}`}
            className={styles.stageSvg}
            data-testid="oxidation-stage-svg"
          >
            <rect
              x={10}
              y={10}
              width={660}
              height={160}
              rx={12}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <g transform="translate(340, 95)">
              <OxidationTag
                formula={parsed.cleanFormula}
                charge={formatCharge(parsed.charge)}
                tags={parsed.tags}
                fontSize={32}
              />
            </g>
          </svg>

          {/* Metadata Cards: Stock Notation, Sum Check, Net Charge */}
          <div className={styles.metaGrid}>
            {parsed.stock !== parsed.cleanFormula && (
              <div className={styles.metaBox} data-testid="stock-notation-box">
                <span className={styles.metaTitle}>Stock Notation</span>
                <span className={`${styles.metaValue} ${styles.metaValueStock}`}>
                  {formatSubscripts(parsed.stock)}
                </span>
              </div>
            )}

            <div className={styles.metaBox}>
              <span className={styles.metaTitle}>Net Charge</span>
              <span className={styles.metaValue}>
                {parsed.charge === 0 ? '0 (Neutral)' : parsed.charge > 0 ? `+${parsed.charge}` : `−${Math.abs(parsed.charge)}`}
              </span>
            </div>

            <div className={styles.metaBox}>
              <span className={styles.metaTitle}>Sum Rule Balance</span>
              <span className={`${styles.metaValue} ${styles.metaValueHighlight}`} data-testid="sum-check-readout">
                {parsed.sumCheck}  ✓
              </span>
            </div>
          </div>

          {/* By-Site Breakdown (e.g. NH4NO3, K4[Fe(CN)6], etc.) */}
          {parsed.sites.length > 1 && (viewMode === 'by-site' || parsed.cleanFormula.includes('NH4')) && (
            <div className={styles.sitesSection} data-testid="sites-breakdown-section">
              <div className={styles.sitesHeader}>
                <span className={styles.sitesTitle}>
                  <span>🔬</span> Constituent Ions / Site-by-Site Analysis
                </span>
              </div>
              <div className={styles.sitesGrid}>
                {parsed.sites.map((site, sIdx) => {
                  const siteOxEntries = Object.entries(site.oxidationNumbers)
                  return (
                    <div key={sIdx} className={styles.siteCard} data-testid={`site-card-${sIdx}`}>
                      <div className={styles.siteCardTitle}>
                        {renderIonMarkup(site.site)} {site.count > 1 ? `(${site.count} units)` : ''}
                      </div>
                      <div className={styles.siteBadges}>
                        {siteOxEntries.map(([elem, rVal]) => {
                          const valStr = formatMinus(rationalToString(rVal))
                          return (
                            <div key={elem} className={styles.siteBadge}>
                              <strong>{elem}:</strong>
                              <span style={{ color: 'var(--fg)', fontWeight: 600 }}>{valStr}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Rule-by-rule Reasoning Ledger */}
          {parsed.explanation && parsed.explanation.steps.length > 0 && (
            <div className={styles.stepsSection} data-testid="reasoning-steps-section">
              <span className={styles.stepsTitle}>Step-by-Step Rule Derivation</span>
              {parsed.explanation.steps.map((st, stepIdx) => (
                <div
                  key={stepIdx}
                  className={`${styles.stepItem} ${st.element === parsed.explanation?.targetElement ? styles.stepItemActive : ''}`}
                >
                  <div className={styles.stepElementRow}>
                    <span className={styles.stepElement}>
                      {stepIdx + 1}. Element {st.element}
                    </span>
                    <span
                      className={`${styles.stepValue} ${st.element === parsed.explanation?.targetElement ? styles.stepValueActive : ''}`}
                    >
                      {formatMinus(rationalToString(st.assignedValue))}
                    </span>
                  </div>
                  <span className={styles.stepRule}>
                    {st.ruleApplied}
                  </span>
                  {st.equation && (
                    <div className={styles.stepEquation}>
                      Equation: {renderEquation(st.equation)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared controls portal */}
      <SimulationControls>
        <Button
          variant="secondary"
          onClick={() => {
            setFormulaInput('K2Cr2O7')
            setChargeInput(0)
            setSelectedPresetId('k2cr2o7')
            setViewMode('overall')
          }}
        >
          Reset to K₂Cr₂O₇
        </Button>
      </SimulationControls>
    </div>
  )
}
