'use client'

import { useId, useState } from 'react'
import { SPECTRAL_KEYS, SPECTRAL_TOKEN, type SpectralKey } from '@/components/vocab/dblock'
import {
  LAB_COMPLEXES,
  findLabComplex,
  formatPhotonEnergy,
  wavelengthFraction,
  type LabComplex,
} from '@/lib/chem/ligand-colour-lab'
import type { SimulationProps } from '../registry'
import styles from './ligand-colour-lab.module.css'

const VIEW_W = 600
const VIEW_H = 380
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'

/** Visible spectrum bands ordered 400 nm (violet, left) to 700 nm (red, right). */
const VISIBLE_BANDS: readonly { key: string; startNm: number; endNm: number; colour: string }[] = [
  { key: 'violet', startNm: 400, endNm: 445, colour: 'var(--spec-violet)' },
  { key: 'blue', startNm: 445, endNm: 485, colour: 'var(--spec-blue)' },
  { key: 'blue-green', startNm: 485, endNm: 515, colour: 'var(--db-ln)' },
  { key: 'green', startNm: 515, endNm: 560, colour: 'var(--spec-green)' },
  { key: 'yellow', startNm: 560, endNm: 590, colour: 'var(--spec-yellow)' },
  { key: 'orange', startNm: 590, endNm: 625, colour: 'var(--spec-orange)' },
  { key: 'red', startNm: 625, endNm: 700, colour: 'var(--spec-red)' },
]

function WheelDiagram({
  cx,
  cy,
  radius,
  absorbed,
  seen,
  markerId,
  disabled,
}: {
  cx: number
  cy: number
  radius: number
  absorbed: SpectralKey | null
  seen: SpectralKey | null
  markerId: string
  disabled: boolean
}) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const sectorAngle = (i: number) => -60 + 60 * i
  const labelR = radius + 19

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {SPECTRAL_KEYS.map((key, i) => {
        const a0 = rad(-90 + 60 * i)
        const a1 = rad(-90 + 60 * (i + 1))
        const x0 = radius * Math.cos(a0)
        const y0 = radius * Math.sin(a0)
        const x1 = radius * Math.cos(a1)
        const y1 = radius * Math.sin(a1)
        const d = `M0 0 L${x0.toFixed(1)} ${y0.toFixed(1)} A${radius} ${radius} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`
        const isAbs = !disabled && absorbed === key
        const isSeen = !disabled && seen === key
        return (
          <path
            key={key}
            d={d}
            fill={SPECTRAL_TOKEN[key]}
            fillOpacity={disabled ? 0.22 : isAbs ? 0.35 : 0.88}
            stroke={isAbs || isSeen ? FG : SURFACE}
            strokeWidth={isAbs || isSeen ? 2.4 : 1.5}
            strokeDasharray={isAbs ? '5 3' : undefined}
          />
        )
      })}
      {SPECTRAL_KEYS.map((key, i) => {
        const ang = sectorAngle(i)
        const c = Math.cos(rad(ang))
        const s = Math.sin(rad(ang))
        const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
        const isMarked = !disabled && (absorbed === key || seen === key)
        return (
          <text
            key={`wl-${key}`}
            x={(labelR * c).toFixed(1)}
            y={(labelR * s + (s > 0.5 ? 14 : s < -0.5 ? -4 : 5)).toFixed(1)}
            textAnchor={anchor}
            fontSize={15}
            fontWeight={isMarked ? 700 : 400}
            fill={isMarked ? FG : MUTED}
          >
            {key}
          </text>
        )
      })}
      {!disabled && absorbed && seen && (
        <line
          x1={(0.58 * radius * Math.cos(rad(sectorAngle(SPECTRAL_KEYS.indexOf(absorbed))))).toFixed(1)}
          y1={(0.58 * radius * Math.sin(rad(sectorAngle(SPECTRAL_KEYS.indexOf(absorbed))))).toFixed(1)}
          x2={(0.58 * radius * Math.cos(rad(sectorAngle(SPECTRAL_KEYS.indexOf(seen))))).toFixed(1)}
          y2={(0.58 * radius * Math.sin(rad(sectorAngle(SPECTRAL_KEYS.indexOf(seen))))).toFixed(1)}
          stroke={FG}
          strokeWidth={2.4}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
        />
      )}
    </g>
  )
}

export function LigandColourLab({ reducedMotion }: SimulationProps) {
  const selectId = useId()
  const uid = useId().replace(/:/g, '')
  const arrowId = `lcl-arr-${uid}`

  const [complexId, setComplexId] = useState<string>('ti-h2o-6')
  const [ligandsPresent, setLigandsPresent] = useState<boolean>(true)
  const [readoutUnit, setReadoutUnit] = useState<'nm' | 'joules'>('nm')

  const complex: LabComplex = findLabComplex(complexId)
  const tr = reducedMotion ? 'none' : 'all 340ms cubic-bezier(0.22, 1, 0.36, 1)'

  // Energy diagram coordinates (left side of SVG)
  const diagX = 36
  const baryY = 128
  const halfGap = ligandsPresent ? Math.round(complex.relativeGap * 64) : 0
  const egY = baryY - halfGap
  const t2gY = baryY + halfGap

  // Spectrum strip coordinates (bottom of SVG)
  const stripX = 112
  const stripY = 278
  const stripW = 456
  const stripH = 34

  // Position of absorbed band on the 400..700 nm strip
  const hasVisibleBand = ligandsPresent && complex.wavelengthNm !== null && !complex.isUv
  const bandX = hasVisibleBand
    ? stripX + Math.min(0.96, Math.max(0.04, wavelengthFraction(complex.wavelengthNm!))) * stripW
    : null

  const seenLabel = ligandsPresent ? complex.observedText : 'Colourless (no ligands)'
  const absorbedLabel = !ligandsPresent
    ? 'None (Δₒ = 0)'
    : complex.isUv
      ? 'Ultraviolet (not visible)'
      : complex.absorbedText

  const primaryReadout = !ligandsPresent
    ? 'Δₒ = 0 (no splitting)'
    : complex.wavelengthNm === null
      ? 'Qualitative series (NCERT)'
      : readoutUnit === 'nm'
        ? `${complex.wavelengthNm} nm`
        : formatPhotonEnergy(complex.wavelengthNm)

  const liveSummary = ligandsPresent
    ? `${complex.displayFormula}: absorbs ${absorbedLabel}${complex.wavelengthNm !== null ? ` at ${complex.wavelengthNm} nm (${formatPhotonEnergy(complex.wavelengthNm)})` : ''}, seen as ${seenLabel}.${complex.waterLeft !== undefined ? ` en to Ni ratio ${complex.enPerNi}:1, ${complex.waterLeft} waters left.` : ''}`
    : `${complex.displayFormula} with ligands removed: crystal field splitting collapses to zero, no visible light is absorbed, and the sample is colourless.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label htmlFor={selectId} className={styles.field}>
          <span className={styles.fieldLabel}>Complex (Table 5.3 and Ni en series)</span>
          <select
            id={selectId}
            className={styles.select}
            value={complex.id}
            onChange={(e) => setComplexId(e.target.value)}
          >
            <optgroup label="Table 5.3 (NCERT p. 133)">
              {LAB_COMPLEXES.filter((c) => c.source === 'table-5-3').map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.displayFormula} (${c.wavelengthNm} nm)`}
                </option>
              ))}
            </optgroup>
            <optgroup label="Ni(II) + en series (NCERT p. 134)">
              {LAB_COMPLEXES.filter((c) => c.source === 'ni-en').map((c) => (
                <option key={c.id} value={c.id}>
                  {`${c.displayFormula} (en : Ni = ${c.enPerNi} : 1)`}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Ligands</span>
          <div className={styles.toggleGroup} role="group" aria-label="Ligands state">
            <button
              type="button"
              className={`${styles.toggleBtn} ${ligandsPresent ? styles.toggleActive : ''}`}
              aria-pressed={ligandsPresent}
              onClick={() => setLigandsPresent(true)}
            >
              Ligands present
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!ligandsPresent ? styles.toggleActive : ''}`}
              aria-pressed={!ligandsPresent}
              onClick={() => setLigandsPresent(false)}
            >
              Ligands removed
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Read-out unit</span>
          <div className={styles.toggleGroup} role="group" aria-label="Read-out unit">
            <button
              type="button"
              className={`${styles.toggleBtn} ${readoutUnit === 'nm' ? styles.toggleActive : ''}`}
              aria-pressed={readoutUnit === 'nm'}
              onClick={() => setReadoutUnit('nm')}
            >
              Wavelength (nm)
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${readoutUnit === 'joules' ? styles.toggleActive : ''}`}
              aria-pressed={readoutUnit === 'joules'}
              onClick={() => setReadoutUnit('joules')}
            >
              Energy (J)
            </button>
          </div>
        </div>
      </div>

      {/* Quick Ni(II) en stepper when any Ni complex is selected */}
      {complex.source === 'ni-en' && (
        <div className={styles.niBar} role="group" aria-label="Step en molecules added to Ni2+">
          <span className={styles.fieldLabel}>Add en to [Ni(H₂O)₆]²⁺:</span>
          <div className={styles.niSteps}>
            {[0, 1, 2, 3].map((n) => {
              const active = complex.enPerNi === n
              return (
                <button
                  key={n}
                  type="button"
                  className={`${styles.toggleBtn} ${active ? styles.toggleActive : ''}`}
                  aria-pressed={active}
                  onClick={() => setComplexId(`ni-en-${n}`)}
                >
                  {n === 0 ? '0 en (6 H₂O)' : `${n} en (${6 - 2 * n} H₂O)`}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          role="img"
          aria-label={liveSummary}
        >
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0 0 L10 5 L0 10 Z" fill={FG} />
            </marker>
          </defs>

          {/* Left: d-orbital splitting diagram */}
          <g>
            <text x={118} y={28} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
              {ligandsPresent ? `d-orbital gap (${complex.metalIon}, d${complex.dCount})` : `${complex.metalIon} (no ligands)`}
            </text>

            {ligandsPresent ? (
              <>
                {/* eg level */}
                <line x1={diagX + 34} y1={egY} x2={diagX + 78} y2={egY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
                <line x1={diagX + 94} y1={egY} x2={diagX + 138} y2={egY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
                <text x={diagX + 150} y={egY + 5} fontSize={16} fontWeight={700} fill={FG}>
                  eg
                </text>

                {/* t2g level */}
                <line x1={diagX + 14} y1={t2gY} x2={diagX + 54} y2={t2gY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
                <line x1={diagX + 66} y1={t2gY} x2={diagX + 106} y2={t2gY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
                <line x1={diagX + 118} y1={t2gY} x2={diagX + 158} y2={t2gY} stroke={FG} strokeWidth={3} strokeLinecap="round" style={{ transition: tr }} />
                <text x={diagX + 168} y={t2gY + 5} fontSize={16} fontWeight={700} fill={FG}>
                  t₂g
                </text>

                {/* Jump arrow */}
                <line
                  x1={diagX + 86}
                  y1={t2gY - 12}
                  x2={diagX + 86}
                  y2={egY + 12}
                  stroke={FG}
                  strokeWidth={2.2}
                  strokeDasharray="5 4"
                  markerEnd={`url(#${arrowId})`}
                  style={{ transition: tr }}
                />

                {/* Electron circle */}
                <circle cx={diagX + 34} cy={t2gY - 12} r={8} fill="var(--electron)" style={{ transition: tr }} />

                {/* Delta_o label */}
                <text x={diagX + 102} y={baryY + 5} fontSize={16} fontWeight={700} fill={FG}>
                  Δₒ
                </text>
              </>
            ) : (
              <>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <line
                    key={idx}
                    x1={diagX + idx * 34}
                    y1={baryY}
                    x2={diagX + 26 + idx * 34}
                    y2={baryY}
                    stroke={FG}
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                ))}
                <text x={118} y={baryY + 34} textAnchor="middle" fontSize={15} fill={MUTED}>
                  5 degenerate d orbitals (Δₒ = 0)
                </text>
              </>
            )}
          </g>

          {/* Middle: Colour wheel */}
          <g>
            <text x={338} y={28} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
              Colour wheel
            </text>
            <WheelDiagram
              cx={338}
              cy={124}
              radius={52}
              absorbed={complex.wheelAbsorbed}
              seen={complex.wheelSeen}
              markerId={arrowId}
              disabled={!ligandsPresent || complex.isUv}
            />
            {(!ligandsPresent || complex.isUv) && (
              <text x={338} y={232} textAnchor="middle" fontSize={15} fill={MUTED}>
                {!ligandsPresent ? 'No visible absorption' : 'UV band (off visible wheel)'}
              </text>
            )}
          </g>

          {/* Right: Swatch of colour seen */}
          <g>
            <text x={516} y={28} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
              Colour seen
            </text>
            <rect
              x={468}
              y={54}
              width={96}
              height={118}
              rx={14}
              fill={ligandsPresent ? complex.swatchFill : 'var(--ion-colourless)'}
              stroke={FG}
              strokeWidth={2}
              style={{ transition: tr }}
            />
            <text x={516} y={196} textAnchor="middle" fontSize={15} fontWeight={700} fill={FG}>
              {ligandsPresent ? complex.observedText : 'Colourless'}
            </text>
            <text x={516} y={218} textAnchor="middle" fontSize={15} fill={MUTED}>
              {complex.source === 'table-5-3' ? 'Table 5.3' : 'Ni + en'}
            </text>
          </g>

          {/* Bottom: UV region + 400 to 700 nm visible spectrum strip */}
          <g>
            <text x={24} y={266} fontSize={15} fontWeight={600} fill={FG}>
              Absorption spectrum (400 nm to 700 nm)
            </text>

            {/* UV box on the left of 400 nm */}
            <rect
              x={24}
              y={stripY}
              width={78}
              height={stripH}
              rx={6}
              fill={ligandsPresent && complex.isUv ? 'var(--accent-soft)' : 'var(--surface-raised)'}
              stroke={ligandsPresent && complex.isUv ? FG : 'var(--border)'}
              strokeWidth={ligandsPresent && complex.isUv ? 2.2 : 1.2}
              strokeDasharray="4 3"
            />
            <text x={63} y={stripY + 22} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
              UV
            </text>

            {/* Visible colour bands */}
            {VISIBLE_BANDS.map((b) => {
              const x0 = stripX + wavelengthFraction(b.startNm) * stripW
              const x1 = stripX + wavelengthFraction(b.endNm) * stripW
              return (
                <rect
                  key={b.key}
                  x={x0}
                  y={stripY}
                  width={x1 - x0 + 0.5}
                  height={stripH}
                  fill={b.colour}
                  fillOpacity={0.9}
                />
              )
            })}

            {/* Dark absorption gap for visible Table 5.3 complexes */}
            {bandX !== null && (
              <g>
                <rect
                  x={bandX - 16}
                  y={stripY}
                  width={32}
                  height={stripH}
                  fill="var(--bg)"
                  fillOpacity={0.92}
                  stroke={FG}
                  strokeWidth={2}
                />
                <text
                  x={bandX}
                  y={stripY + stripH + 40}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={700}
                  fill={FG}
                >
                  {`${complex.wavelengthNm} nm absorbed`}
                </text>
              </g>
            )}

            {/* UV callout for [Co(CN)6]3- */}
            {ligandsPresent && complex.isUv && (
              <text x={24} y={stripY + stripH + 40} fontSize={15} fontWeight={700} fill={FG}>
                310 nm: Ultraviolet (not visible)
              </text>
            )}

            {/* Qualitative note for Ni(II) series */}
            {ligandsPresent && complex.source === 'ni-en' && (
              <text x={stripX + stripW / 2} y={stripY + stripH + 40} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
                {`en : Ni = ${complex.enPerNi} : 1  |  Waters left = ${complex.waterLeft}`}
              </text>
            )}

            {/* Axis tick labels */}
            <text x={stripX} y={stripY + stripH + 20} fontSize={15} fill={MUTED}>
              400 nm
            </text>
            <text x={stripX + stripW / 2} y={stripY + stripH + 20} textAnchor="middle" fontSize={15} fill={MUTED}>
              550 nm
            </text>
            <text x={stripX + stripW} y={stripY + stripH + 20} textAnchor="end" fontSize={15} fill={MUTED}>
              700 nm
            </text>
          </g>
        </svg>
      </div>

      {/* Readout cards */}
      <div className={styles.cards}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>{complex.displayFormula}</h3>
          <dl className={styles.facts}>
            <dt>{readoutUnit === 'nm' ? 'Wavelength absorbed' : 'Photon energy (hc/λ)'}</dt>
            <dd>{primaryReadout}</dd>
            <dt>Colour absorbed</dt>
            <dd>{absorbedLabel}</dd>
            <dt>Colour seen</dt>
            <dd>{seenLabel}</dd>
            {complex.waterLeft !== undefined && (
              <>
                <dt>Waters left (6 - 2n)</dt>
                <dd>{ligandsPresent ? String(complex.waterLeft) : '0 (ligands removed)'}</dd>
              </>
            )}
          </dl>
        </article>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>What is happening</h3>
          <p className={styles.note}>
            {ligandsPresent
              ? complex.note
              : 'Removing the ligands collapses the crystal field splitting Δₒ to zero. With no gap between d levels, no visible photon is absorbed and the substance appears colourless.'}
          </p>
        </article>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
