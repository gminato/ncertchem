'use client'

import { useState } from 'react'
import type { SimulationProps } from '../registry'
import {
  evaluateWernerComplex,
  MAX_AMMONIA,
  MAX_BOUND_CL,
  MIN_AMMONIA,
  MIN_BOUND_CL,
  WERNER_PRESETS,
  type IsomerArrangement,
  type OctahedralSite,
  type WernerPresetId,
} from '@/lib/chem/werner-precipitation'
import styles from './werner-precipitation-lab.module.css'

const W = 600
const H = 356

const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const BORDER = 'var(--border)'
const BOND = 'var(--bond)'
const N_TONE = 'var(--el-N)'
const CL_TONE = 'var(--el-Cl)'
const CO_TONE = 'var(--accent)'
const CAUTION = 'var(--caution)'
const AGCL_BG = 'var(--agcl-white)'

const PRESET_SWATCH: Record<WernerPresetId, string> = {
  yellow: '#D9A006',
  purple: '#9333EA',
  green: '#16A34A',
  violet: '#7C3AED',
}

/** Octahedral 6 positions around (cx, cy): top, TR, BR, bottom, BL, TL. */
const ANGLES_DEG = [-90, -30, 30, 90, 150, -150] as const

function siteCoords(cx: number, cy: number, r: number, index: number) {
  const rad = (ANGLES_DEG[index] * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function SiteNode({ x, y, site }: { x: number; y: number; site: OctahedralSite }) {
  if (site === 'empty') {
    return (
      <g>
        <circle
          cx={x}
          cy={y}
          r={16}
          fill={SURFACE}
          stroke={CAUTION}
          strokeWidth={1.8}
          strokeDasharray="4 3"
        />
        <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={CAUTION}>
          ?
        </text>
      </g>
    )
  }

  const isCl = site === 'Cl'
  const tone = isCl ? CL_TONE : N_TONE
  const pillW = isCl ? 42 : 48
  const pillH = 28

  return (
    <g>
      <rect
        x={x - pillW / 2}
        y={y - pillH / 2}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={SURFACE}
        stroke={tone}
        strokeWidth={2.2}
      />
      <rect
        x={x - pillW / 2}
        y={y - pillH / 2}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={tone}
        fillOpacity={0.18}
        stroke="none"
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
        {isCl ? 'Cl⁻' : 'NH₃'}
      </text>
    </g>
  )
}

export function WernerPrecipitationLab({ reducedMotion }: SimulationProps) {
  const [ammonia, setAmmonia] = useState(6)
  const [boundCl, setBoundCl] = useState(0)
  const [arrangement, setArrangement] = useState<IsomerArrangement>('trans')
  const [agno3Added, setAgno3Added] = useState(false)

  const evalState = evaluateWernerComplex(ammonia, boundCl, arrangement)
  const ringSwatch = evalState.matchedPreset ? PRESET_SWATCH[evalState.matchedPreset] : CO_TONE

  const selectPreset = (presetId: WernerPresetId) => {
    const found = WERNER_PRESETS.find((p) => p.id === presetId)
    if (!found) return
    setAmmonia(found.ammonia)
    setBoundCl(found.boundCl)
    setArrangement(found.arrangement)
    setAgno3Added(false)
  }

  const updateAmmonia = (next: number) => {
    const clamped = Math.max(MIN_AMMONIA, Math.min(MAX_AMMONIA, next))
    setAmmonia(clamped)
    setAgno3Added(false)
  }

  const updateBoundCl = (next: number) => {
    const clamped = Math.max(MIN_BOUND_CL, Math.min(MAX_BOUND_CL, next))
    setBoundCl(clamped)
    setAgno3Added(false)
  }

  const cx = 172
  const cy = 178
  const ligandR = 80
  const pts = evalState.sites.map((_, i) => siteCoords(cx, cy, ligandR, i))
  const eqPts = [pts[1], pts[2], pts[4], pts[5]]
  const eqPath = `M ${eqPts[0].x.toFixed(1)} ${eqPts[0].y.toFixed(1)} L ${eqPts[1].x.toFixed(1)} ${eqPts[1].y.toFixed(1)} L ${eqPts[2].x.toFixed(1)} ${eqPts[2].y.toFixed(1)} L ${eqPts[3].x.toFixed(1)} ${eqPts[3].y.toFixed(1)} Z`

  const counterCount = evalState.counterIons
  const spacing = 62
  const startY = 174 - ((Math.max(1, counterCount) - 1) * spacing) / 2

  const liveSummary =
    `Formula ${evalState.fullFormula}, entity ${evalState.entityFormula}, charge +${evalState.entityCharge}, ` +
    `${evalState.counterIons} counter chloride ion${evalState.counterIons === 1 ? '' : 's'}, ` +
    `electrolyte ${evalState.electrolyte}, ${evalState.verdict}. ` +
    (agno3Added
      ? `Silver nitrate added: ${evalState.agclMoles} mol AgCl precipitated.`
      : 'Silver nitrate not yet added.')

  return (
    <div className={styles.sim}>
      {/* Preset selector + steppers + AgNO3 action */}
      <div className={styles.controls}>
        <div className={styles.presetBlock}>
          <span className={styles.controlLabel}>Table 5.1 presets</span>
          <div className={styles.presetRow} role="group" aria-label="Cobalt compound presets">
            {WERNER_PRESETS.map((preset) => {
              const active = evalState.matchedPreset === preset.id
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  className={`${styles.presetBtn} ${active ? styles.presetBtnActive : ''}`}
                  onClick={() => selectPreset(preset.id)}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: PRESET_SWATCH[preset.id] }}
                    aria-hidden="true"
                  />
                  <span>{preset.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.stepperGrid}>
          <div className={styles.stepperCard}>
            <span className={styles.controlLabel}>NH₃ on cobalt (0 to 6)</span>
            <div className={styles.stepperRow}>
              <button
                type="button"
                className={styles.stepBtn}
                aria-label="Decrease NH3 on cobalt"
                disabled={ammonia <= MIN_AMMONIA}
                onClick={() => updateAmmonia(ammonia - 1)}
              >
                -
              </button>
              <span className={styles.stepValue} data-testid="nh3-count">
                {ammonia}
              </span>
              <button
                type="button"
                className={styles.stepBtn}
                aria-label="Increase NH3 on cobalt"
                disabled={ammonia >= MAX_AMMONIA}
                onClick={() => updateAmmonia(ammonia + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.stepperCard}>
            <span className={styles.controlLabel}>Bound Cl⁻ on cobalt (0 to 3)</span>
            <div className={styles.stepperRow}>
              <button
                type="button"
                className={styles.stepBtn}
                aria-label="Decrease bound Cl on cobalt"
                disabled={boundCl <= MIN_BOUND_CL}
                onClick={() => updateBoundCl(boundCl - 1)}
              >
                -
              </button>
              <span className={styles.stepValue} data-testid="bound-cl-count">
                {boundCl}
              </span>
              <button
                type="button"
                className={styles.stepBtn}
                aria-label="Increase bound Cl on cobalt"
                disabled={boundCl >= MAX_BOUND_CL}
                onClick={() => updateBoundCl(boundCl + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.actionCard}>
            <span className={styles.controlLabel}>Precipitation test</span>
            <button
              type="button"
              className={`${styles.actionBtn} ${agno3Added ? styles.actionBtnDone : ''}`}
              onClick={() => setAgno3Added((v) => !v)}
            >
              {agno3Added ? 'Reset AgNO₃ test' : 'Add AgNO₃ (excess, cold)'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive SVG Stage */}
      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Octahedral cobalt complex ${evalState.entityFormula} with ${evalState.counterIons} outer chloride ions${agno3Added ? `, giving ${evalState.agclMoles} mol AgCl` : ''}`}
        >
          <defs>
            <marker
              id="sim-werner-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={MUTED} />
            </marker>
          </defs>

          {/* Left header */}
          <text x={cx} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
            Coordination entity (6 octahedral sites)
          </text>

          {/* Coordination ring */}
          <circle
            cx={cx}
            cy={cy}
            r={114}
            fill={ringSwatch}
            fillOpacity={0.07}
            stroke={ringSwatch}
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeDasharray="6 5"
          />

          {/* Equatorial plane */}
          <path d={eqPath} fill="none" stroke={BORDER} strokeWidth={1.4} />

          {/* Isomer connector when 4 NH3 + 2 Cl */}
          {evalState.isomerNote && (
            <line
              x1={pts[0].x}
              y1={pts[0].y}
              x2={pts[arrangement === 'trans' ? 3 : 1].x}
              y2={pts[arrangement === 'trans' ? 3 : 1].y}
              stroke={CL_TONE}
              strokeWidth={2.4}
              strokeDasharray="4 3"
              opacity={0.75}
            />
          )}

          {/* Bonds from Co3+ to occupied sites */}
          {pts.map((p, i) => {
            const site = evalState.sites[i]
            return (
              <line
                key={`bond-${i}`}
                x1={cx}
                y1={cy}
                x2={p.x}
                y2={p.y}
                stroke={site === 'empty' ? CAUTION : site === 'Cl' ? CL_TONE : BOND}
                strokeWidth={site === 'Cl' ? 2.6 : site === 'empty' ? 1.5 : 2}
                strokeDasharray={site === 'empty' ? '4 4' : undefined}
              />
            )
          })}

          {/* Central Co3+ ion */}
          <circle cx={cx} cy={cy} r={24} fill={SURFACE} stroke={CO_TONE} strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={24} fill={CO_TONE} fillOpacity={0.18} stroke="none" />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={FG}>
            Co³⁺
          </text>

          {/* Six octahedral sites */}
          {pts.map((p, i) => (
            <SiteNode key={`site-${i}`} x={p.x} y={p.y} site={evalState.sites[i]} />
          ))}

          {/* Overflow indicator when > 6 groups */}
          {evalState.overflowGroups > 0 && (
            <g>
              <rect
                x={30}
                y={308}
                width={284}
                height={32}
                rx={8}
                fill="var(--caution-soft)"
                stroke={CAUTION}
                strokeWidth={1.6}
              />
              <text x={172} y={329} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
                {`+${evalState.overflowGroups} extra group${evalState.overflowGroups === 1 ? '' : 's'}: no octahedral site`}
              </text>
            </g>
          )}

          {/* Bottom left summary when not overflowing */}
          {evalState.overflowGroups === 0 && (
            <text x={cx} y={326} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
              {`${evalState.ammonia} NH₃ + ${evalState.boundCl} bound Cl⁻ = ${evalState.totalAttached} / 6`}
            </text>
          )}

          {/* Right zone: Outer counter ions & AgNO3 precipitation */}
          <text x={464} y={26} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
            {agno3Added ? 'After adding AgNO₃' : 'Free counter ions in solution'}
          </text>

          <rect
            x={344}
            y={44}
            width={240}
            height={254}
            rx={12}
            fill={SURFACE}
            stroke={BORDER}
            strokeWidth={1.4}
          />

          {counterCount === 0 ? (
            <g>
              <text x={464} y={162} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
                0 free Cl⁻ ions
              </text>
              <text x={464} y={190} textAnchor="middle" fontSize={15} fill={MUTED}>
                {agno3Added ? '0 mol AgCl precipitate' : 'All 3 Cl⁻ are bound to cobalt'}
              </text>
            </g>
          ) : (
            <g style={reducedMotion ? undefined : { transition: 'opacity 220ms ease' }}>
              {Array.from({ length: counterCount }, (_, i) => {
                const y = startY + i * spacing
                if (!agno3Added) {
                  return (
                    <g key={`free-${i}`}>
                      <circle
                        cx={418}
                        cy={y}
                        r={20}
                        fill={SURFACE}
                        stroke={CL_TONE}
                        strokeWidth={2}
                        strokeDasharray="4 3"
                      />
                      <circle cx={418} cy={y} r={20} fill={CL_TONE} fillOpacity={0.14} stroke="none" />
                      <text x={418} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
                        Cl⁻
                      </text>
                      <text x={454} y={y + 5} fontSize={15} fill={MUTED}>
                        free in solution
                      </text>
                    </g>
                  )
                }

                return (
                  <g key={`ppt-${i}`}>
                    <circle
                      cx={380}
                      cy={y}
                      r={18}
                      fill={SURFACE}
                      stroke={CL_TONE}
                      strokeWidth={1.8}
                      strokeDasharray="4 3"
                    />
                    <text x={380} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
                      Cl⁻
                    </text>
                    <text x={432} y={y - 8} textAnchor="middle" fontSize={15} fill={MUTED}>
                      Ag⁺
                    </text>
                    <line
                      x1={404}
                      y1={y}
                      x2={458}
                      y2={y}
                      stroke={MUTED}
                      strokeWidth={2}
                      markerEnd="url(#sim-werner-arrow)"
                    />
                    <rect
                      x={468}
                      y={y - 16}
                      width={98}
                      height={32}
                      rx={6}
                      fill={AGCL_BG}
                      stroke={MUTED}
                      strokeWidth={1.6}
                    />
                    <text x={517} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="#1F2023">
                      AgCl(s)
                    </text>
                  </g>
                )
              })}
            </g>
          )}

          {/* Bottom right AgCl counter */}
          <text x={464} y={326} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
            {agno3Added
              ? `Precipitate: ${evalState.agclMoles} mol AgCl`
              : `Free Cl⁻ available: ${evalState.counterIons}`}
          </text>
        </svg>
      </div>

      {/* Readout cards */}
      <div className={styles.readouts}>
        <article className={styles.card}>
          <span className={styles.cardLabel}>Formula in brackets</span>
          <p className={styles.cardValue} data-testid="entity-formula">
            {evalState.entityFormula}
          </p>
          <p className={styles.cardSub}>{`Full: ${evalState.fullFormula} · Charge: +${evalState.entityCharge}`}</p>
        </article>

        <article className={styles.card}>
          <span className={styles.cardLabel}>Counter ions & electrolyte</span>
          <p className={styles.cardValue} data-testid="electrolyte-readout">
            {evalState.electrolyte}
          </p>
          <p className={styles.cardSub}>
            {`${evalState.counterIons} free Cl⁻ · ${agno3Added ? `${evalState.agclMoles} mol AgCl formed` : 'Add AgNO₃ to precipitate'}`}
          </p>
        </article>

        <article
          className={`${styles.card} ${evalState.status === 'satisfied' ? styles.cardValid : styles.cardCaution}`}
        >
          <span className={styles.cardLabel}>Six-group rule verdict</span>
          <p className={styles.cardValue} data-testid="verdict-readout">
            {evalState.verdict}
          </p>
          <p className={styles.cardSub}>
            {evalState.status === 'satisfied'
              ? 'NH₃ + bound Cl⁻ = 6 (cobalt secondary valence)'
              : evalState.status === 'empty'
                ? `${evalState.emptyPositions} octahedral position${evalState.emptyPositions === 1 ? '' : 's'} still open`
                : `${evalState.overflowGroups} more than cobalt's 6 positions`}
          </p>
        </article>
      </div>

      {/* Isomer note banner for Green and Violet */}
      {evalState.isomerNote && (
        <div className={styles.isomerBanner} data-testid="isomer-note">
          <strong>Isomer note:</strong> {evalState.isomerNote}
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
