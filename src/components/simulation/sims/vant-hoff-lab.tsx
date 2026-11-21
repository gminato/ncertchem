'use client'

import { useState } from 'react'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { Vessel, VocabDefs } from '@/components/vocab'
import {
  computePresetMetrics,
  getSaltTableEntry,
  getVantHoffPreset,
  type VantHoffPreset,
} from '@/lib/chem/vant-hoff'
import styles from './vant-hoff-lab.module.css'

type LabSoluteId = 'urea' | 'nacl' | 'k2so4' | 'benzoic-acid-benzene'

const SOLUTE_OPTIONS: readonly { value: LabSoluteId; label: string }[] = [
  { value: 'urea', label: 'Urea (non-electrolyte)' },
  { value: 'nacl', label: 'NaCl (1:1 salt)' },
  { value: 'k2so4', label: 'K₂SO₄ (1:2 salt)' },
  { value: 'benzoic-acid-benzene', label: 'Benzoic acid in benzene (dimer)' },
]

// 8 nominal solute slots arranged as 4 columns x 2 rows inside Vessel (x: 30..266, liquid y: 110..298)
const CELL_CENTRES: readonly { x: number; y: number; ph: number }[] = [
  { x: 64, y: 158, ph: 0.4 },
  { x: 120, y: 158, ph: 1.5 },
  { x: 176, y: 158, ph: 2.7 },
  { x: 232, y: 158, ph: 3.9 },
  { x: 64, y: 242, ph: 4.8 },
  { x: 120, y: 242, ph: 0.9 },
  { x: 176, y: 242, ph: 2.1 },
  { x: 232, y: 242, ph: 3.3 },
]

const COLUMN_X = [64, 120, 176, 232] as const

export function VantHoffLab({ reducedMotion }: SimulationProps) {
  const [soluteId, setSoluteId] = useState<LabSoluteId>('nacl')
  const [alpha, setAlpha] = useState<number>(getVantHoffPreset('nacl').defaultAlpha)
  const [molality, setMolality] = useState<number>(1.0)

  const t = useAmbientTime(reducedMotion)

  const preset: VantHoffPreset = getVantHoffPreset(soluteId)
  const metrics = computePresetMetrics(preset, alpha, molality)
  const saltTable = preset.saltTableId ? getSaltTableEntry(preset.saltTableId) : undefined

  const handleSoluteChange = (nextId: LabSoluteId) => {
    setSoluteId(nextId)
    setAlpha(getVantHoffPreset(nextId).defaultAlpha)
  }

  // Exact discrete particle representation out of 8 nominal formula units
  const dissociatedCount =
    preset.behaviour === 'dissociation' ? Math.round(metrics.effectiveAlpha * 8) : 0
  const dimerPairCount =
    preset.behaviour === 'association' ? Math.round((metrics.effectiveAlpha * 8) / 2) : 0

  const visualParticleCount =
    preset.behaviour === 'dissociation'
      ? 8 - dissociatedCount + dissociatedCount * preset.n
      : preset.behaviour === 'association'
        ? 8 - dimerPairCount
        : 8

  // Bar scaling for Normal M vs Observed M (track width 248px)
  const barTrackW = 248
  const maxMass = Math.max(metrics.normalMolarMass, metrics.abnormalMolarMass, 1)
  const normalMassBarW = Math.max(16, (metrics.normalMolarMass / maxMass) * barTrackW)
  const obsMassBarW = Math.max(16, (metrics.abnormalMolarMass / maxMass) * barTrackW)

  // Bar scaling for Ideal vs Observed ΔTf
  const maxTf = Math.max(metrics.idealDeltaTfK, metrics.observedDeltaTfK, 0.1)
  const idealTfBarW = Math.max(16, (metrics.idealDeltaTfK / maxTf) * barTrackW)
  const obsTfBarW = Math.max(16, (metrics.observedDeltaTfK / maxTf) * barTrackW)

  const modeColor =
    preset.behaviour === 'dissociation'
      ? 'var(--ox)'
      : preset.behaviour === 'association'
        ? 'var(--acid)'
        : 'var(--accent)'

  const alphaLabel =
    preset.behaviour === 'association'
      ? 'Degree of association (α)'
      : preset.behaviour === 'dissociation'
        ? 'Degree of dissociation (α)'
        : 'Degree of dissociation / association (α — fixed at 0)'

  const summary = `${preset.name} at ${molality.toFixed(1)} mol kg⁻¹ with alpha ${metrics.effectiveAlpha.toFixed(
    2
  )}: van't Hoff factor i is ${metrics.i.toFixed(2)}, apparent molar mass is ${metrics.abnormalMolarMass.toFixed(
    1
  )} g mol⁻¹ versus normal ${metrics.normalMolarMass.toFixed(
    1
  )} g mol⁻¹, and freezing-point depression is ${metrics.observedDeltaTfK.toFixed(2)} K.`

  const transitionStyle = reducedMotion ? undefined : { transition: 'width 200ms ease-out' }

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Solute system"
          options={SOLUTE_OPTIONS}
          value={soluteId}
          onChange={handleSoluteChange}
        />
        <div className={styles.sliderRow}>
          <Slider
            label={alphaLabel}
            value={metrics.effectiveAlpha}
            min={0}
            max={1}
            step={0.02}
            disabled={preset.behaviour === 'none'}
            format={(v) => `${v.toFixed(2)} (${Math.round(v * 100)}%)`}
            onChange={setAlpha}
          />
          <Slider
            label="Molality (m)"
            value={molality}
            min={0.1}
            max={2.0}
            step={0.1}
            unit="mol kg⁻¹"
            format={(v) => v.toFixed(1)}
            onChange={setMolality}
          />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 360"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={summary}
        >
          <VocabDefs idPrefix="vhlab" />

          {/* Left column header above Vessel */}
          <text
            x="148"
            y="24"
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize="14.5"
            fontWeight="700"
          >
            {soluteId === 'k2so4' ? (
              <>
                K<Sub>2</Sub>SO<Sub>4</Sub> → 2 K<Sup>+</Sup> + SO<Sub>4</Sub><Sup>2−</Sup>
              </>
            ) : soluteId === 'nacl' ? (
              <>
                NaCl → Na<Sup>+</Sup> + Cl<Sup>−</Sup>
              </>
            ) : soluteId === 'benzoic-acid-benzene' ? (
              <>
                2 C<Sub>6</Sub>H<Sub>5</Sub>COOH ⇌ (C<Sub>6</Sub>H<Sub>5</Sub>COOH)<Sub>2</Sub>
              </>
            ) : (
              <>Urea(aq): intact neutral molecules</>
            )}
          </text>
          <text
            x="148"
            y="46"
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize="14"
          >
            {preset.solventName} (K<Sub>f</Sub> = {metrics.solvent.kf.toFixed(2)})
          </text>

          {/* Real Class-11 Vessel beaker */}
          <Vessel
            variant="beaker"
            width={236}
            height={228}
            x={148}
            y={182}
            level={0.83}
            liquid
            graduated
          />

          {/* Living 3D-shaded particles inside the Vessel (8 nominal formula units) */}
          {preset.behaviour === 'association' ? (
            <g>
              {COLUMN_X.map((cx, colIdx) => {
                const isPaired = colIdx < dimerPairCount
                const dx = reducedMotion ? 0 : Math.sin(t * 1.2 + colIdx * 1.4) * 3.2
                const dy = reducedMotion ? 0 : Math.cos(t * 1.0 + colIdx * 1.7) * 3.0
                if (isPaired) {
                  const px = cx + dx
                  const pyTop = 178 + dy
                  const pyBot = 222 + dy
                  return (
                    <g key={`col-${colIdx}`}>
                      <rect
                        x={px - 20}
                        y={pyTop - 20}
                        width="40"
                        height="84"
                        rx="20"
                        fill="var(--accent-soft)"
                        fillOpacity="0.4"
                        stroke="var(--acid)"
                        strokeWidth="1.2"
                        strokeDasharray="4 3"
                      />
                      <line
                        x1={px - 5}
                        y1={pyTop + 10}
                        x2={px - 5}
                        y2={pyBot - 10}
                        stroke="var(--acid)"
                        strokeWidth="1.8"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={px + 5}
                        y1={pyTop + 10}
                        x2={px + 5}
                        y2={pyBot - 10}
                        stroke="var(--acid)"
                        strokeWidth="1.8"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={px}
                        cy={pyTop}
                        r="11"
                        fill="var(--acid)"
                        stroke="var(--atom-rim)"
                        strokeWidth="1.2"
                      />
                      <circle cx={px} cy={pyTop} r="11" fill="url(#vhlab-sphere-shading)" />
                      <circle
                        cx={px}
                        cy={pyBot}
                        r="11"
                        fill="var(--acid)"
                        stroke="var(--atom-rim)"
                        strokeWidth="1.2"
                      />
                      <circle cx={px} cy={pyBot} r="11" fill="url(#vhlab-sphere-shading)" />
                      <text
                        x={px}
                        y={pyTop + 5}
                        textAnchor="middle"
                        fill="var(--accent-fg)"
                        fontFamily="var(--font-mono)"
                        fontSize="14"
                        fontWeight="700"
                      >
                        B
                      </text>
                      <text
                        x={px}
                        y={pyBot + 5}
                        textAnchor="middle"
                        fill="var(--accent-fg)"
                        fontFamily="var(--font-mono)"
                        fontSize="14"
                        fontWeight="700"
                      >
                        B
                      </text>
                    </g>
                  )
                }

                // Unpaired monomers gently drifting independently
                const dx2 = reducedMotion ? 0 : Math.cos(t * 1.3 + colIdx * 2.1) * 3.5
                const dy2 = reducedMotion ? 0 : Math.sin(t * 1.1 + colIdx * 1.3) * 3.0
                return (
                  <g key={`col-${colIdx}`}>
                    <circle
                      cx={cx + dx}
                      cy={156 + dy}
                      r="11"
                      fill="var(--spot-3)"
                      stroke="var(--atom-rim)"
                      strokeWidth="1.2"
                    />
                    <circle cx={cx + dx} cy={156 + dy} r="11" fill="url(#vhlab-sphere-shading)" />
                    <text
                      x={cx + dx}
                      y={161 + dy}
                      textAnchor="middle"
                      fill="var(--accent-fg)"
                      fontFamily="var(--font-mono)"
                      fontSize="14"
                      fontWeight="700"
                    >
                      B
                    </text>
                    <circle
                      cx={cx + dx2}
                      cy={244 + dy2}
                      r="11"
                      fill="var(--spot-3)"
                      stroke="var(--atom-rim)"
                      strokeWidth="1.2"
                    />
                    <circle cx={cx + dx2} cy={244 + dy2} r="11" fill="url(#vhlab-sphere-shading)" />
                    <text
                      x={cx + dx2}
                      y={249 + dy2}
                      textAnchor="middle"
                      fill="var(--accent-fg)"
                      fontFamily="var(--font-mono)"
                      fontSize="14"
                      fontWeight="700"
                    >
                      B
                    </text>
                  </g>
                )
              })}
            </g>
          ) : (
            <g>
              {CELL_CENTRES.map((pt, idx) => {
                const isDissociated = idx < dissociatedCount
                const driftX = reducedMotion ? 0 : Math.sin(t * 1.25 + pt.ph) * 3.2
                const driftY = reducedMotion ? 0 : Math.cos(t * 1.05 + pt.ph * 1.2) * 2.8
                const bx = pt.x + driftX
                const by = pt.y + driftY

                if (preset.behaviour === 'none') {
                  return (
                    <g key={`cell-${idx}`}>
                      <circle
                        cx={bx}
                        cy={by}
                        r="12"
                        fill="var(--spot-1)"
                        stroke="var(--atom-rim)"
                        strokeWidth="1.2"
                      />
                      <circle cx={bx} cy={by} r="12" fill="url(#vhlab-sphere-shading)" />
                      <text
                        x={bx}
                        y={by + 5}
                        textAnchor="middle"
                        fill="var(--accent-fg)"
                        fontFamily="var(--font-mono)"
                        fontSize="14"
                        fontWeight="700"
                      >
                        U
                      </text>
                    </g>
                  )
                }

                if (preset.n === 2) {
                  // NaCl: intact ion-pair vs separated Na+ and Cl-
                  const offset = isDissociated ? 14 : 6.5
                  const dySep = isDissociated ? (idx % 2 === 0 ? -9 : 9) : 0
                  const indDrift =
                    isDissociated && !reducedMotion ? Math.sin(t * 1.9 + pt.ph) * 2.4 : 0
                  const cx1 = bx - offset - indDrift
                  const cy1 = by + dySep
                  const cx2 = bx + offset + indDrift
                  const cy2 = by - dySep
                  return (
                    <g key={`cell-${idx}`}>
                      {!isDissociated && (
                        <rect
                          x={bx - 18}
                          y={by - 13}
                          width="36"
                          height="26"
                          rx="13"
                          fill="var(--surface)"
                          fillOpacity="0.55"
                          stroke="var(--border)"
                          strokeWidth="1"
                        />
                      )}
                      <circle
                        cx={cx1}
                        cy={cy1}
                        r="9.8"
                        fill="var(--ox)"
                        stroke="var(--atom-rim)"
                        strokeWidth="1.1"
                      />
                      <circle cx={cx1} cy={cy1} r="9.8" fill="url(#vhlab-sphere-shading)" />
                      <text
                        x={cx1}
                        y={cy1 + 5}
                        textAnchor="middle"
                        fill="var(--accent-fg)"
                        fontFamily="var(--font-mono)"
                        fontSize="14"
                        fontWeight="700"
                      >
                        +
                      </text>
                      <circle
                        cx={cx2}
                        cy={cy2}
                        r="9.8"
                        fill="var(--el-Cl)"
                        stroke="var(--atom-rim)"
                        strokeWidth="1.1"
                      />
                      <circle cx={cx2} cy={cy2} r="9.8" fill="url(#vhlab-sphere-shading)" />
                      <text
                        x={cx2}
                        y={cy2 + 5}
                        textAnchor="middle"
                        fill="var(--accent-fg)"
                        fontFamily="var(--font-mono)"
                        fontSize="14"
                        fontWeight="700"
                      >
                        −
                      </text>
                    </g>
                  )
                }

                // K2SO4 (n = 3): intact unit vs 2 K+ and 1 SO4^2-
                const spreadX = isDissociated ? 15 : 7
                const spreadY = isDissociated ? 13 : 6
                const indDrift =
                  isDissociated && !reducedMotion ? Math.sin(t * 1.8 + pt.ph) * 2.2 : 0
                return (
                  <g key={`cell-${idx}`}>
                    {!isDissociated && (
                      <circle
                        cx={bx}
                        cy={by}
                        r="18"
                        fill="var(--surface)"
                        fillOpacity="0.55"
                        stroke="var(--border)"
                        strokeWidth="1"
                      />
                    )}
                    {/* Two K+ cations */}
                    <circle
                      cx={bx - spreadX - indDrift}
                      cy={by - spreadY}
                      r="8.5"
                      fill="var(--ox)"
                      stroke="var(--atom-rim)"
                      strokeWidth="1.1"
                    />
                    <circle
                      cx={bx - spreadX - indDrift}
                      cy={by - spreadY}
                      r="8.5"
                      fill="url(#vhlab-sphere-shading)"
                    />
                    <circle
                      cx={bx + spreadX + indDrift}
                      cy={by - spreadY}
                      r="8.5"
                      fill="var(--ox)"
                      stroke="var(--atom-rim)"
                      strokeWidth="1.1"
                    />
                    <circle
                      cx={bx + spreadX + indDrift}
                      cy={by - spreadY}
                      r="8.5"
                      fill="url(#vhlab-sphere-shading)"
                    />
                    {/* One SO4^2- anion */}
                    <circle
                      cx={bx}
                      cy={by + spreadY + indDrift * 0.5}
                      r="10.5"
                      fill="var(--el-S)"
                      stroke="var(--atom-rim)"
                      strokeWidth="1.2"
                    />
                    <circle
                      cx={bx}
                      cy={by + spreadY + indDrift * 0.5}
                      r="10.5"
                      fill="url(#vhlab-sphere-shading)"
                    />
                    <text
                      x={bx}
                      y={by + spreadY + indDrift * 0.5 + 4}
                      textAnchor="middle"
                      fill="var(--fg)"
                      fontFamily="var(--font-mono)"
                      fontSize="12"
                      fontWeight="700"
                    >
                      2−
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* Beaker particle count summary */}
          <text
            x="148"
            y="328"
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize="14"
            fontWeight="600"
          >
            8 nominal → {visualParticleCount} active (i = {metrics.i.toFixed(2)})
          </text>

          {/* Subtle borderless editorial vertical hairline */}
          <line x1="292" y1="18" x2="292" y2="342" stroke="var(--border)" strokeWidth="1" opacity="0.7" />

          {/* Right Top: Borderless Molar Mass Comparison */}
          <text
            x="312"
            y="30"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize="15"
            fontWeight="700"
          >
            Molar Mass Comparison
          </text>
          <text
            x="312"
            y="52"
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
            fontSize="14"
          >
            M<Sub>obs</Sub> = M<Sub>norm</Sub> / i
          </text>

          {/* Normal M bar */}
          <text
            x="312"
            y="84"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize="14"
          >
            Normal M<Sub>norm</Sub>
          </text>
          <text
            x="560"
            y="84"
            textAnchor="end"
            fill="var(--fg)"
            fontFamily="var(--font-mono)"
            fontSize="14"
          >
            {metrics.normalMolarMass.toFixed(1)} g mol<Sup>−1</Sup>
          </text>
          <rect x="312" y="92" width={barTrackW} height="13" rx="6.5" fill="var(--surface)" />
          <rect
            x="312"
            y="92"
            width={normalMassBarW}
            height="13"
            rx="6.5"
            fill="var(--fg-subtle)"
            opacity="0.55"
            style={transitionStyle}
          />

          {/* Observed (Abnormal) M bar */}
          <text
            x="312"
            y="132"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize="14"
            fontWeight="600"
          >
            Observed M<Sub>obs</Sub>
          </text>
          <text
            x="560"
            y="132"
            textAnchor="end"
            fill={modeColor}
            fontFamily="var(--font-mono)"
            fontSize="14"
            fontWeight="700"
          >
            {metrics.abnormalMolarMass.toFixed(1)} g mol<Sup>−1</Sup>
          </text>
          <rect x="312" y="140" width={barTrackW} height="13" rx="6.5" fill="var(--surface)" />
          <rect
            x="312"
            y="140"
            width={obsMassBarW}
            height="13"
            rx="6.5"
            fill={modeColor}
            style={transitionStyle}
          />

          {/* Subtle horizontal hairline separating right-column metrics */}
          <line x1="312" y1="176" x2="560" y2="176" stroke="var(--border)" strokeWidth="1" opacity="0.7" />

          {/* Right Bottom: Borderless Freezing-Point Depression */}
          <text
            x="312"
            y="206"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize="15"
            fontWeight="700"
          >
            Freezing-Point Depression
          </text>
          <text
            x="312"
            y="228"
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
            fontSize="14"
          >
            ΔT<Sub>f</Sub> = i · K<Sub>f</Sub> · m
          </text>

          {/* Ideal ΔTf bar */}
          <text
            x="312"
            y="260"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize="14"
          >
            Ideal (i = 1)
          </text>
          <text
            x="560"
            y="260"
            textAnchor="end"
            fill="var(--fg)"
            fontFamily="var(--font-mono)"
            fontSize="14"
          >
            {metrics.idealDeltaTfK.toFixed(2)} K
          </text>
          <rect x="312" y="268" width={barTrackW} height="13" rx="6.5" fill="var(--surface)" />
          <rect
            x="312"
            y="268"
            width={idealTfBarW}
            height="13"
            rx="6.5"
            fill="var(--fg-subtle)"
            opacity="0.55"
            style={transitionStyle}
          />

          {/* Observed ΔTf bar */}
          <text
            x="312"
            y="308"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize="14"
            fontWeight="600"
          >
            Observed ΔT<Sub>f</Sub>
          </text>
          <text
            x="560"
            y="308"
            textAnchor="end"
            fill={modeColor}
            fontFamily="var(--font-mono)"
            fontSize="14"
            fontWeight="700"
          >
            {metrics.observedDeltaTfK.toFixed(2)} K
          </text>
          <rect x="312" y="316" width={barTrackW} height="13" rx="6.5" fill="var(--surface)" />
          <rect
            x="312"
            y="316"
            width={obsTfBarW}
            height="13"
            rx="6.5"
            fill={modeColor}
            style={transitionStyle}
          />
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.metricsGrid}>
          <div className={styles.metric}>
            <span className={styles.metricLabel}>van’t Hoff factor (i)</span>
            <span className={`${styles.metricValue} ${styles.metricAccent}`}>
              {metrics.i.toFixed(2)}
            </span>
            <span className={styles.metricSub}>
              Particle multiplier: ×{metrics.i.toFixed(2)}
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Observed M<sub>obs</sub>
            </span>
            <span className={styles.metricValue}>
              {metrics.abnormalMolarMass.toFixed(1)} g mol<sup>−1</sup>
            </span>
            <span className={styles.metricSub}>
              Normal M<sub>norm</sub>: {metrics.normalMolarMass.toFixed(1)} g mol<sup>−1</sup>
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Observed ΔT<sub>f</sub>
            </span>
            <span className={styles.metricValue}>
              {metrics.observedDeltaTfK.toFixed(2)} K
            </span>
            <span className={styles.metricSub}>
              Ideal (i = 1): {metrics.idealDeltaTfK.toFixed(2)} K
            </span>
          </div>

          <div className={styles.metric}>
            <span className={styles.metricLabel}>
              Observed ΔT<sub>b</sub>
            </span>
            <span className={styles.metricValue}>
              {metrics.observedDeltaTbK.toFixed(2)} K
            </span>
            <span className={styles.metricSub}>
              Ideal (i = 1): {metrics.idealDeltaTbK.toFixed(2)} K
            </span>
          </div>
        </div>

        <div className={styles.noteBox}>
          {saltTable ? (
            <>
              <span className={styles.noteTitle}>
                NCERT Table 1.4 Dilution Trend ({saltTable.formula}):{' '}
              </span>
              Measured i rises as the solution is diluted — from{' '}
              <strong>{saltTable.iAt01m.toFixed(2)}</strong> at 0.1 m, to{' '}
              <strong>{saltTable.iAt001m.toFixed(2)}</strong> at 0.01 m, to{' '}
              <strong>{saltTable.iAt0001m.toFixed(2)}</strong> at 0.001 m, approaching the
              complete-dissociation limit of <strong>{saltTable.iComplete.toFixed(2)}</strong> as
              interionic attractions weaken.
            </>
          ) : preset.behaviour === 'association' ? (
            <>
              <span className={styles.noteTitle}>Hydrogen-Bonded Dimerisation: </span>
              In low-dielectric solvents such as benzene, carboxylic acid molecules form cyclic
              hydrogen-bonded dimers, lowering the particle count toward half (i → 0.5) and
              making the colligatively measured molar mass appear up to twice as large.
            </>
          ) : (
            <>
              <span className={styles.noteTitle}>Non-Electrolyte Reference: </span>
              Urea neither dissociates into ions nor associates into dimers in water, so i stays
              strictly equal to 1 and the colligative molar mass equals the true formula mass.
            </>
          )}
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
