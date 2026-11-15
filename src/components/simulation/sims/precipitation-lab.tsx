'use client'

import { useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { QKGauge, QK_GAUGE_SIZE } from '@/components/equilibrium/QKGauge'
import { SolubilityBeaker, type SolubilityBeakerProps } from '@/components/equilibrium/SolubilityBeaker'
import { formatSci, powerOfTen } from '@/components/equilibrium/geometry'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ANION_SOURCES,
  CATION_SOURCES,
  commonIonSalts,
  mixEqualVolumes,
  solubilityPair,
  type AnionId,
  type CationId,
  type MixPrecipitation,
} from '@/lib/chem/precipitation'
import styles from './precipitation-lab.module.css'

/** Stock concentrations the sliders step through, mol L⁻¹. Each mixes in equal volume, so every ion halves. */
const STOCKS = [1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1] as const
/** Added common-ion concentrations, mol L⁻¹. */
const ADDED = [0, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1] as const
/** The log axis of the solubility bars runs from 10⁻¹⁰ to 10⁻² mol L⁻¹. */
const LOG_MIN = -10
const LOG_MAX = -2
const BAR_X0 = 178
const BAR_X1 = 540

/** The solid drawn in the beaker. A picture of the amount, not to scale. */
const SOLID_FOR: Record<MixPrecipitation['verdict'] | 'none', number> = {
  precipitates: 0.7,
  'at saturation': 0.35,
  'no precipitate': 0,
  none: 0,
}

const BEAKER_STATE: Record<MixPrecipitation['verdict'], SolubilityBeakerProps['qVsKsp']> = {
  precipitates: 'above',
  'at saturation': 'equal',
  'no precipitate': 'below',
}

const BADGE: Record<MixPrecipitation['verdict'], string> = {
  precipitates: 'Qsp > Ksp: a precipitate forms',
  'at saturation': 'Qsp = Ksp: saturated, no net precipitate',
  'no precipitate': 'Qsp < Ksp: no precipitate',
}

/** A number in scientific notation with a true minus sign, for the readouts. */
function sci(value: number, digits = 1): string {
  return formatSci(value, digits)
}

/** x-position on the log axis of the solubility bars. */
function barX(conc: number): number {
  const log = Math.log10(conc)
  const clamped = Math.max(LOG_MIN, Math.min(LOG_MAX, log))
  return BAR_X0 + ((clamped - LOG_MIN) / (LOG_MAX - LOG_MIN)) * (BAR_X1 - BAR_X0)
}

const CATION_OPTIONS = CATION_SOURCES.map((c) => ({ value: c.id, label: `${c.ion} (${c.salt})` }))
const ANION_OPTIONS = ANION_SOURCES.map((a) => ({ value: a.id, label: `${a.ion} (${a.salt})` }))
const SALT_LABEL: Record<string, string> = { AgCl: 'AgCl', BaSO4: 'BaSO₄', PbI2: 'PbI₂' }
/** Display form of a neutral formula: digits become subscripts (BaSO4 → BaSO₄). */
const sub = (formula: string) => formula.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])

const SALT_OPTIONS = commonIonSalts().map((s) => ({ value: s.formula, label: SALT_LABEL[s.formula] ?? s.formula }))

/**
 * The Precipitation Lab for Section 6.13. Two stock solutions are mixed in equal volumes; the
 * library gives the ion concentrations, the ionic product Qsp and the verdict against Ksp from
 * Table 6.9. A second control adds a common ion to a sparingly soluble salt, and the molar
 * solubility falls, computed exactly by the library.
 */
export function PrecipitationLab({ reducedMotion }: SimulationProps) {
  const [cationId, setCationId] = useState<CationId>('Ag')
  const [anionId, setAnionId] = useState<AnionId>('Cl')
  const [cationIndex, setCationIndex] = useState(4)
  const [anionIndex, setAnionIndex] = useState(4)
  const [saltFormula, setSaltFormula] = useState<string>('AgCl')
  const [addedIndex, setAddedIndex] = useState(0)

  const cationStock = STOCKS[cationIndex]
  const anionStock = STOCKS[anionIndex]
  const mix = mixEqualVolumes(cationId, anionId, cationStock, anionStock)
  const verdict = mix?.verdict ?? null
  const solidTarget = verdict ? SOLID_FOR[verdict] : 0
  const solid = useTweenedNumber(solidTarget, reducedMotion, 0.9)

  const cationSource = CATION_SOURCES.find((c) => c.id === cationId)!
  const anionSource = ANION_SOURCES.find((a) => a.id === anionId)!
  const salt = commonIonSalts().find((s) => s.formula === saltFormula)!
  const added = ADDED[addedIndex]
  const { pure, withIon } = solubilityPair(salt, added)
  const fold = pure / withIon
  const foldText = added === 0 ? 'the solubility is unchanged' : `about ${fold >= 100 ? Math.round(fold / 10) * 10 : fold.toFixed(1)} times less`

  const mixText = mix
    ? `Qsp = [${cationSource.ion}][${anionSource.ion}] = ${sci(mix.qsp)}; Ksp(${sub(mix.salt.formula)}) = ${sci(mix.salt.ksp)}; Qsp/Ksp = ${mix.ratio < 10 ? mix.ratio.toFixed(2) : Math.round(mix.ratio)}. ${BADGE[mix.verdict]}.`
    : `Table 6.9 lists no salt for ${cationSource.ion} and ${anionSource.ion}, so there is no Ksp to compare Qsp with.`
  const commonText = added === 0
    ? `${sub(salt.formula)} in water: S = ${sci(pure, 2)} mol L⁻¹. No ion is added, so ${foldText}.`
    : `${sub(salt.formula)} in water: S = ${sci(pure, 2)} mol L⁻¹. With ${sci(added, 1)} mol L⁻¹ of ${salt.commonIon} added, S = ${sci(withIon, 2)} mol L⁻¹, ${foldText}.`

  return (
    <div className={styles.sim} data-testid="precipitation-lab">
      <section className={styles.card} aria-labelledby="pl-mix-title">
        <h3 id="pl-mix-title" className={styles.heading}>
          1. Mix two solutions in equal volumes
        </h3>
        <div className={styles.grid}>
          <div className={styles.picture}>
            {mix ? (
              <svg viewBox="0 0 240 262" role="img" aria-label={BADGE[mix.verdict]} className={styles.beaker} data-testid="precipitation-beaker">
                <SolubilityBeaker
                  ionCounts={[
                    { label: cationSource.ion, count: 4 },
                    { label: anionSource.ion, count: 4 },
                  ]}
                  qVsKsp={BEAKER_STATE[mix.verdict]}
                  solidAmount={solid}
                  seed={5}
                />
              </svg>
            ) : (
              <p className={styles.placeholder} data-testid="no-salt-note">
                Table 6.9 lists no salt for {cationSource.ion} and {anionSource.ion}, so the lab has no Ksp and draws no beaker.
              </p>
            )}
          </div>
          <div className={styles.controls}>
            <Segmented<CationId> label="Cation solution" options={CATION_OPTIONS} value={cationId} onChange={setCationId} />
            <Segmented<AnionId> label="Anion solution" options={ANION_OPTIONS} value={anionId} onChange={setAnionId} />
            <Slider
              label="Cation stock"
              value={cationIndex}
              min={0}
              max={STOCKS.length - 1}
              step={1}
              format={(i) => `${sci(STOCKS[i])} mol L⁻¹`}
              onChange={setCationIndex}
            />
            <Slider
              label="Anion stock"
              value={anionIndex}
              min={0}
              max={STOCKS.length - 1}
              step={1}
              format={(i) => `${sci(STOCKS[i])} mol L⁻¹`}
              onChange={setAnionIndex}
            />
            <dl className={styles.readout} aria-live="polite">
              <div className={styles.row}>
                <dt>After mixing</dt>
                <dd>
                  {mix
                    ? `[${cationSource.ion}] = ${sci(mix.cationConc)} M, [${anionSource.ion}] = ${sci(mix.anionConc)} M`
                    : `[${cationSource.ion}] = ${sci(cationStock / 2)} M, [${anionSource.ion}] = ${sci(anionStock / 2)} M`}
                </dd>
              </div>
              <div className={styles.row}>
                <dt>Qsp</dt>
                <dd data-testid="lab-qsp">{mix ? sci(mix.qsp) : '—'}</dd>
              </div>
              <div className={styles.row}>
                <dt>Ksp</dt>
                <dd data-testid="lab-ksp">{mix ? `${sci(mix.salt.ksp)} (${sub(mix.salt.formula)})` : 'not listed in Table 6.9'}</dd>
              </div>
              <div className={styles.row}>
                <dt>Verdict</dt>
                <dd data-testid="lab-verdict">{mix ? BADGE[mix.verdict] : 'no Ksp to compare'}</dd>
              </div>
            </dl>
          </div>
        </div>
        {mix && (
          <svg viewBox={`-40 -6 ${QK_GAUGE_SIZE.width + 80} ${QK_GAUGE_SIZE.height + 12}`} role="img" aria-label={`Qsp ${sci(mix.qsp)} against Ksp ${sci(mix.salt.ksp)} on a log scale`} className={styles.gauge} data-testid="lab-gauge">
            <QKGauge K={mix.salt.ksp} Q={mix.qsp} kLabel={<tspan className="sym">K</tspan>} qLabel={<tspan className="sym">Q</tspan>} />
          </svg>
        )}
        <p className={styles.note}>
          Each stock is a 1:1 soluble salt, so its ion concentration equals the stock concentration. The beaker is a picture: the dots and the solid are not to scale.
        </p>
      </section>

      <section className={styles.card} aria-labelledby="pl-common-title">
        <h3 id="pl-common-title" className={styles.heading}>
          2. Add a common ion to a saturated salt
        </h3>
        <div className={styles.commonControls}>
          <Segmented<string> label="Sparingly soluble salt" options={SALT_OPTIONS} value={saltFormula} onChange={setSaltFormula} />
          <Slider label="Added common ion" value={addedIndex} min={0} max={ADDED.length - 1} step={1} format={(i) => `${ADDED[i] === 0 ? '0' : sci(ADDED[i])} mol L⁻¹ ${salt.commonIon}`} onChange={setAddedIndex} />
        </div>
        <svg viewBox="0 0 560 170" role="img" aria-label={`Molar solubility of ${sub(salt.formula)} in water ${sci(pure, 2)} mol per litre, and ${sci(withIon, 2)} with the added ion`} className={styles.bars} data-testid="common-bars">
          <BarRow y={34} label="Pure water" value={pure} color="var(--fg-subtle)" />
          <BarRow y={108} label={added === 0 ? 'No ion added' : `+ ${salt.commonIon}`} value={withIon} color="var(--fwd)" />
          {[-10, -8, -6, -4, -2].map((e) => (
            <g key={`tick-${e}`}>
              <line x1={barX(10 ** e)} x2={barX(10 ** e)} y1={144} y2={150} stroke="var(--fg-muted)" strokeWidth={1} />
              <text x={barX(10 ** e)} y={164} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                {powerOfTen(e)}
              </text>
            </g>
          ))}
          <line x1={BAR_X0} x2={BAR_X1} y1={144} y2={144} stroke="var(--fg-muted)" strokeWidth={1.2} />
        </svg>
        <dl className={styles.readout} aria-live="polite">
          <div className={styles.row}>
            <dt>Molar solubility</dt>
            <dd data-testid="lab-solubility">{commonText}</dd>
          </div>
        </dl>
      </section>

      <p className={styles.srOnly} aria-live="polite">
        {mixText} {commonText}
      </p>
    </div>
  )
}

/** One bar of the solubility plot, on the log axis, with its value written beside it. */
function BarRow({ y, label, value, color }: { y: number; label: string; value: number; color: string }) {
  const end = barX(value)
  return (
    <g>
      <text x={12} y={y + 12} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)" fontWeight={600}>
        {label}
      </text>
      <rect x={BAR_X0} y={y} width={BAR_X1 - BAR_X0} height={24} rx={6} fill="var(--surface-raised)" />
      <rect x={BAR_X0} y={y} width={Math.max(0, end - BAR_X0)} height={24} rx={6} fill={color} />
      <text x={Math.min(end + 8, BAR_X1 - 4)} y={y + 12} dominantBaseline="central" textAnchor={end + 8 > BAR_X1 - 4 ? 'end' : 'start'} fontSize={15} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        {sci(value, 2)} M
      </text>
    </g>
  )
}
