'use client'

import { useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { Tex } from '@/components/animations/unit6/qk/Tex'
import {
  COMPLEX_EFFECTS,
  EXPLORER_USES,
  FIELD_LABELS,
  explorerUseById,
  practiceOptionsFor,
  usesForEffect,
  type ComplexEffect,
  type ExplorerUse,
} from '@/lib/chem/complex-application-explorer'
import type { SimulationProps } from '../registry'
import styles from './complex-application-explorer.module.css'

type Mode = 'explore' | 'quiz'

const METAL_TONE: Record<string, { fill: string; ink: string }> = {
  hardness: { fill: 'var(--ion-cation)', ink: '#FFFFFF' },
  gold: { fill: 'var(--agi-yellow)', ink: '#1F2023' },
  nickel: { fill: 'var(--metal-ni)', ink: '#1F2023' },
  'silver-plating': { fill: 'var(--metal-ag)', ink: '#1F2023' },
  hypo: { fill: 'var(--metal-ag)', ink: '#1F2023' },
  lead: { fill: 'var(--metal-pb)', ink: '#FFFFFF' },
  haemoglobin: { fill: 'var(--blood-red)', ink: '#FFFFFF' },
  chlorophyll: { fill: 'var(--spec-green)', ink: '#FFFFFF' },
  b12: { fill: 'var(--accent)', ink: '#FFFFFF' },
  wilkinson: { fill: 'var(--db-4d)', ink: '#FFFFFF' },
  cisplatin: { fill: 'var(--metal-pt)', ink: '#1F2023' },
}

function EntityDiagram({ use, hidden }: { use: ExplorerUse; hidden: boolean }) {
  const cx = 456
  const cy = 104
  const tone = METAL_TONE[use.id] ?? { fill: 'var(--accent)', ink: '#FFFFFF' }
  const sqDonors: readonly [number, number, string][] =
    use.id === 'wilkinson'
      ? [
          [-34, -28, 'var(--el-P)'],
          [-34, 28, 'var(--el-P)'],
          [34, -28, 'var(--el-P)'],
          [34, 28, 'var(--el-Cl)'],
        ]
      : [
          [-34, -28, 'var(--el-Cl)'],
          [-34, 28, 'var(--el-Cl)'],
          [34, -28, 'var(--el-N)'],
          [34, 28, 'var(--el-N)'],
        ]
  const linearDonor = use.id === 'hypo' ? 'var(--el-S)' : 'var(--el-C)'

  if (hidden) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={34} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="6 4" />
        <text x={cx} y={cy + 8} textAnchor="middle" fontSize={24} fontWeight={700} fill="var(--accent)">
          ?
        </text>
        <text x={cx} y={178} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          Choose below
        </text>
      </g>
    )
  }

  return (
    <g>
      {use.motif === 'linear' && (
        <g>
          <line x1={cx - 44} y1={cy} x2={cx + 44} y2={cy} stroke="var(--fg-muted)" strokeWidth={2.5} />
          <circle cx={cx - 44} cy={cy} r={10} fill={linearDonor} />
          <circle cx={cx + 44} cy={cy} r={10} fill={linearDonor} />
        </g>
      )}
      {use.motif === 'tetrahedral' && (
        <g>
          {[
            [0, -38],
            [-36, 22],
            [36, 22],
            [18, -16],
          ].map(([dx, dy], i) => (
            <g key={i}>
              <line x1={cx} y1={cy} x2={cx + dx} y2={cy + dy} stroke="var(--fg-muted)" strokeWidth={2.2} />
              <circle cx={cx + dx} cy={cy + dy} r={8.5} fill="var(--el-C)" />
            </g>
          ))}
        </g>
      )}
      {use.motif === 'square-planar' && (
        <g>
          {sqDonors.map(([dx, dy, fill], i) => (
            <g key={i}>
              <line x1={cx} y1={cy} x2={cx + dx} y2={cy + dy} stroke="var(--fg-muted)" strokeWidth={2.2} />
              <circle cx={cx + dx} cy={cy + dy} r={8.5} fill={fill} />
            </g>
          ))}
        </g>
      )}
      {use.motif === 'ring' && (
        <g>
          <circle cx={cx} cy={cy} r={34} fill="none" stroke={tone.fill} strokeWidth={3} opacity={0.65} />
          {[0, 90, 180, 270].map((deg) => {
            const rad = (deg * Math.PI) / 180
            const nx = cx + 34 * Math.cos(rad)
            const ny = cy + 34 * Math.sin(rad)
            return (
              <g key={deg}>
                <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="var(--fg-muted)" strokeWidth={1.6} strokeDasharray="3 3" />
                <circle cx={nx} cy={ny} r={6} fill="var(--el-N)" />
              </g>
            )
          })}
        </g>
      )}
      {use.motif === 'chelate' && (
        <g>
          <path
            d={`M${cx - 32} ${cy - 26} C${cx - 48} ${cy - 10} ${cx - 48} ${cy + 10} ${cx - 32} ${cy + 26}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <path
            d={`M${cx + 32} ${cy - 26} C${cx + 48} ${cy - 10} ${cx + 48} ${cy + 10} ${cx + 32} ${cy + 26}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx={cx - 32} cy={cy - 26} r={6} fill="var(--el-O)" />
          <circle cx={cx - 32} cy={cy + 26} r={6} fill="var(--el-N)" />
          <circle cx={cx + 32} cy={cy - 26} r={6} fill="var(--el-O)" />
          <circle cx={cx + 32} cy={cy + 26} r={6} fill="var(--el-N)" />
        </g>
      )}

      {/* Central metal sphere */}
      <circle cx={cx} cy={cy} r={18} fill={tone.fill} stroke="var(--surface)" strokeWidth={2} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={700} fill={tone.ink}>
        {use.app.metal.split(',')[0].trim()}
      </text>

      <text x={cx} y={178} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--fg)">
        {use.svgEntityLabel ?? use.entityDisplay}
      </text>
    </g>
  )
}

function ApplicationStage({ use, hidden }: { use: ExplorerUse; hidden: boolean }) {
  const tone = METAL_TONE[use.id] ?? { fill: 'var(--accent)', ink: '#FFFFFF' }

  return (
    <svg
      className={styles.scene}
      viewBox="0 0 560 216"
      role="img"
      aria-label={`Formation of coordination entity for ${use.shortLabel}: ${use.metalLabel} plus ${use.ligandLabel} forms ${hidden ? 'hidden entity' : use.entityDisplay}`}
    >
      {/* Left card: Metal ion */}
      <rect x={8} y={12} width={148} height={192} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={82} y={38} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg-muted)">
        Metal
      </text>
      <circle cx={82} cy={104} r={26} fill={tone.fill} stroke="var(--fg)" strokeWidth={1.4} />
      <text x={82} y={110} textAnchor="middle" fontSize={16} fontWeight={700} fill={tone.ink}>
        {use.app.metal.split(',')[0].trim()}
      </text>
      <text x={82} y={178} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        {use.metalLabel}
      </text>

      {/* Plus symbol */}
      <text x={170} y={112} textAnchor="middle" fontSize={22} fontWeight={700} fill="var(--fg-muted)">
        +
      </text>

      {/* Middle card: Ligand */}
      <rect x={184} y={12} width={148} height={192} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={258} y={38} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg-muted)">
        Ligand
      </text>
      {/* Donor pair visual */}
      <path d="M236 88 C224 98 224 114 236 124" fill="none" stroke="var(--accent)" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M280 88 C292 98 292 114 280 124" fill="none" stroke="var(--accent)" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={248} cy={106} r={7} fill="var(--lone-pair)" />
      <circle cx={268} cy={106} r={7} fill="var(--lone-pair)" />
      <text x={258} y={178} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        {use.ligandLabel}
      </text>

      {/* Arrow */}
      <line x1={338} y1={104} x2={356} y2={104} stroke="var(--accent)" strokeWidth={2.5} />
      <polygon points="362,104 352,98 352,110" fill="var(--accent)" />

      {/* Right card: Coordination entity */}
      <rect
        x={364}
        y={12}
        width={188}
        height={192}
        rx={12}
        fill="var(--surface)"
        stroke={hidden ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={hidden ? 2 : 1.5}
      />
      <text x={458} y={38} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg-muted)">
        Coordination entity
      </text>
      <EntityDiagram use={use} hidden={hidden} />
    </svg>
  )
}

export function ComplexApplicationExplorer({ reducedMotion: _reducedMotion }: SimulationProps) {
  const [selectedId, setSelectedId] = useState<string>(EXPLORER_USES[0].id)
  const [mode, setMode] = useState<Mode>('explore')
  const [pickedOptionId, setPickedOptionId] = useState<string | null>(null)

  const current = explorerUseById(selectedId)
  const options = practiceOptionsFor(current.id)
  const answered = pickedOptionId !== null
  const picked = options.find((o) => o.id === pickedOptionId) ?? null
  const isCorrect = picked?.correct ?? false
  const hideEntity = mode === 'quiz' && !answered

  const selectUse = (id: string) => {
    setSelectedId(id)
    setPickedOptionId(null)
  }

  const selectEffect = (effect: ComplexEffect) => {
    const matching = usesForEffect(effect)
    if (matching.length === 0) return
    const idx = matching.findIndex((u) => u.id === current.id)
    const next = idx === -1 ? matching[0] : matching[(idx + 1) % matching.length]
    selectUse(next.id)
  }

  const nextUse = () => {
    const idx = EXPLORER_USES.findIndex((u) => u.id === current.id)
    const next = EXPLORER_USES[(idx + 1) % EXPLORER_USES.length]
    selectUse(next.id)
  }

  const activeEffectMeta = COMPLEX_EFFECTS.find((e) => e.id === current.effect) ?? COMPLEX_EFFECTS[0]

  const liveSummary =
    mode === 'quiz' && !answered
      ? `Quiz mode for ${current.shortLabel} (${FIELD_LABELS[current.app.field]}). Metal ${current.metalLabel}, ligand ${current.ligandLabel}. Choose the coordination entity.`
      : `${current.shortLabel}: ${current.entityDisplay} in ${FIELD_LABELS[current.app.field]}. Effect: ${activeEffectMeta.shortLabel}. ${current.whyNeeded}`

  return (
    <div className={styles.sim}>
      <div className={styles.topBar}>
        <p className={styles.groupLabel}>Choose an application</p>
        <Segmented
          label="Explorer mode"
          value={mode}
          onChange={(next) => {
            setMode(next)
            setPickedOptionId(null)
          }}
          options={[
            { value: 'explore', label: 'Explore' },
            { value: 'quiz', label: 'Quiz me' },
          ]}
        />
      </div>

      <div className={styles.useGrid} role="group" aria-label="Coordination compound uses">
        {EXPLORER_USES.map((u) => {
          const on = u.id === current.id
          return (
            <Button
              key={u.id}
              variant={on ? 'primary' : 'secondary'}
              aria-pressed={on}
              className={styles.useBtn}
              onClick={() => selectUse(u.id)}
            >
              {u.shortLabel}
            </Button>
          )
        })}
      </div>

      <div className={styles.stage}>
        <ApplicationStage use={current} hidden={hideEntity} />
      </div>

      <div className={styles.effectSection}>
        <p className={styles.groupLabel}>Effect that makes it work</p>
        <div className={styles.effects} role="group" aria-label="Effect of complex formation">
          {COMPLEX_EFFECTS.map((eff) => {
            const on = eff.id === current.effect
            return (
              <button
                key={eff.id}
                type="button"
                className={on ? styles.effectBtnOn : styles.effectBtn}
                aria-pressed={on}
                onClick={() => selectEffect(eff.id)}
              >
                {eff.shortLabel}
              </button>
            )
          })}
        </div>
      </div>

      {mode === 'explore' ? (
        <div className={styles.readout}>
          <div className={styles.readoutHeader}>
            <div className={styles.formulaWrap}>
              {current.app.entityTex ? (
                <Tex tex={`\\ce{${current.app.entityTex}}`} />
              ) : (
                <span>{current.entityDisplay}</span>
              )}
            </div>
            <div className={styles.badges}>
              <span className={styles.fieldBadge}>{FIELD_LABELS[current.app.field]}</span>
              {current.app.oxidationState !== null && (
                <span className={styles.statBadge}>
                  {`Oxidation state: ${current.app.oxidationState > 0 ? `+${current.app.oxidationState}` : current.app.oxidationState}`}
                </span>
              )}
              {current.app.coordinationNumber !== null && (
                <span className={styles.statBadge}>
                  {`CN: ${current.app.coordinationNumber}`}
                </span>
              )}
            </div>
          </div>
          <p className={styles.whyText}>{current.whyNeeded}</p>
        </div>
      ) : (
        <div className={styles.quizPanel}>
          <p className={styles.quizPrompt}>
            {`Which coordination entity is formed in ${current.shortLabel.toLowerCase()} (${FIELD_LABELS[current.app.field]})?`}
          </p>
          <div className={styles.quizOptions} role="group" aria-label="Entity choices">
            {options.map((opt) => {
              let cls = styles.quizOption
              if (answered && opt.correct) cls = styles.quizOptionRight
              else if (answered && opt.id === pickedOptionId && !opt.correct) cls = styles.quizOptionWrong
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cls}
                  onClick={() => setPickedOptionId(opt.id)}
                >
                  {opt.entityTex ? <Tex tex={`\\ce{${opt.entityTex}}`} /> : opt.label}
                </button>
              )
            })}
          </div>
          {answered && (
            <>
              <p className={isCorrect ? styles.feedbackRight : styles.feedbackWrong}>
                {isCorrect
                  ? `Correct. ${current.whyNeeded}`
                  : `Not quite. The entity for ${current.shortLabel.toLowerCase()} is ${current.entityDisplay}. ${current.whyNeeded}`}
              </p>
              <div className={styles.quizFooter}>
                <Button variant="primary" onClick={nextUse}>
                  Next application
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
