'use client'

import { useState, type CSSProperties } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { lambda0OfIon } from '@/lib/chem/conductance'
import { NCERT_LIMITING_ION_CONDUCTIVITY } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  ACETIC_LAMBDA0,
  ACETIC_STEPS,
  ANION_CHOICES,
  CATION_CHOICES,
  KCL_POINTS,
  aceticAcidFromKa,
  aceticAcidDecomposition,
  buildSalt,
  fitKClPoints,
  formatSci,
  readoutFromLambda,
  type IonId,
} from '@/lib/chem/kohlrausch-lab-model'
import styles from './kohlrausch-lab.module.css'

// Plot geometry (SVG user units). The text is 14 units, so it stays 14 px at the design width.
const VB_W = 560
const VB_H = 380
const X0 = 70
const X1 = 530
const Y_TOP = 24
const Y_BOT = 318
const S_MAX = 0.035
const LAMBDA_MAX = 400
const TEXT: CSSProperties = { fontSize: 14, fontFamily: 'var(--font-sans)' }

const sx = (s: number) => X0 + (s / S_MAX) * (X1 - X0)
const sy = (lambda: number) => Y_BOT - (lambda / LAMBDA_MAX) * (Y_BOT - Y_TOP)

const X_TICKS = [0, 0.01, 0.02, 0.03] as const
const Y_TICKS = [0, 100, 200, 300, 400] as const

/** Concentrations on the weak-acid curve, log-spaced from 1 × 10⁻⁷ to 1.2 × 10⁻³ mol L⁻¹. */
const CURVE_C = Array.from({ length: 91 }, (_, i) => 10 ** (-7 + (i * (Math.log10(1.2e-3) + 7)) / 90))

const IONS = NCERT_LIMITING_ION_CONDUCTIVITY

function ionLabel(id: IonId): string {
  return IONS.find((r) => r.id === id)?.formula ?? id
}

export function KohlrauschLab(_props: SimulationProps) {
  const [kclCount, setKclCount] = useState(2)
  const [aceticCount, setAceticCount] = useState(0)
  const [cationId, setCationId] = useState<IonId>('Na+')
  const [anionId, setAnionId] = useState<IonId>('Cl-')
  const [logC, setLogC] = useState(-4)

  const cation = CATION_CHOICES.find((c) => c.id === cationId) ?? CATION_CHOICES[0]
  const anion = ANION_CHOICES.find((a) => a.id === anionId) ?? ANION_CHOICES[0]
  const salt = buildSalt(cation, anion)

  const fit = fitKClPoints(kclCount)
  const decomposition = aceticAcidDecomposition()
  const c = 10 ** logC
  const acetic = aceticAcidFromKa(c)
  const readout = readoutFromLambda(c, acetic.lambdaScm2)

  const fitY0 = sy(fit.lambda0Scm2)
  const fitY1 = sy(fit.lambda0Scm2 - fit.A * S_MAX)

  const curvePath = CURVE_C.map((conc, i) => {
    const lambda = aceticAcidFromKa(conc).lambdaScm2
    return `${i === 0 ? 'M' : 'L'}${sx(Math.sqrt(conc)).toFixed(1)} ${sy(lambda).toFixed(1)}`
  }).join(' ')

  const sumText = `Λ°m(${salt.formula}) = ${salt.lambda0Scm2.toFixed(1)} S cm² mol⁻¹`
  const totalForBar = salt.lambda0Scm2 || 1

  return (
    <div className={styles.root} data-testid="kohlrausch-lab">
      <section className={styles.panel} aria-labelledby="kohl-plot-title">
        <h3 id="kohl-plot-title" className={styles.panelTitle}>
          A. Λm against √c
        </h3>
        <div className={styles.controlRow}>
          <Button variant="secondary" onClick={() => setKclCount((n) => Math.min(KCL_POINTS.length, n + 1))} disabled={kclCount >= KCL_POINTS.length}>
            Add next KCl point
          </Button>
          <Button variant="secondary" onClick={() => setAceticCount((n) => Math.min(ACETIC_STEPS.length, n + 1))} disabled={aceticCount >= ACETIC_STEPS.length}>
            Add next acetic acid point
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setKclCount(2)
              setAceticCount(0)
            }}
          >
            Reset plot
          </Button>
        </div>

        <svg className={styles.plot} viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={`Λm against root c. Least-squares line for KCl gives Λ°m ${fit.lambda0Scm2.toFixed(1)} and A ${fit.A.toFixed(1)}.`}>
          <rect x={X0} y={Y_TOP} width={X1 - X0} height={Y_BOT - Y_TOP} className={styles.frame} />
          {Y_TICKS.map((v) => (
            <g key={`y${v}`}>
              <line x1={X0 - 5} x2={X1} y1={sy(v)} y2={sy(v)} className={styles.grid} />
              <text x={X0 - 10} y={sy(v) + 5} textAnchor="end" className={styles.tick} style={TEXT}>
                {v}
              </text>
            </g>
          ))}
          {X_TICKS.map((v) => (
            <g key={`x${v}`}>
              <line x1={sx(v)} x2={sx(v)} y1={Y_TOP} y2={Y_BOT + 5} className={styles.grid} />
              <text x={sx(v)} y={Y_BOT + 22} textAnchor="middle" className={styles.tick} style={TEXT}>
                {v === 0 ? '0' : v.toFixed(2)}
              </text>
            </g>
          ))}
          <text x={(X0 + X1) / 2} y={VB_H - 6} textAnchor="middle" className={styles.axisTitle} style={TEXT}>
            √c / (mol L⁻¹)^½
          </text>
          <text x={18} y={(Y_TOP + Y_BOT) / 2} textAnchor="middle" transform={`rotate(-90 18 ${(Y_TOP + Y_BOT) / 2})`} className={styles.axisTitle} style={TEXT}>
            Λm / S cm² mol⁻¹
          </text>

          <path d={curvePath} className={styles.weakCurve} />
          {ACETIC_STEPS.slice(0, aceticCount).map((conc) => (
            <circle key={`a${conc}`} cx={sx(Math.sqrt(conc))} cy={sy(aceticAcidFromKa(conc).lambdaScm2)} r={5} className={styles.weakPoint} />
          ))}

          <line x1={X0} x2={sx(S_MAX)} y1={fitY0} y2={fitY1} className={styles.fitLine} />
          {KCL_POINTS.slice(0, kclCount).map((p) => (
            <circle key={`k${p.c}`} cx={sx(Math.sqrt(p.c))} cy={sy(p.lambdaScm2)} r={6} className={styles.strongPoint} />
          ))}
          <circle cx={X0} cy={fitY0} r={5} className={styles.intercept} />
          <text x={X0 + 12} y={fitY0 + 22} className={styles.label} style={TEXT}>
            Λ°m = {fit.lambda0Scm2.toFixed(1)}
          </text>

          <g>
            <circle cx={318} cy={36} r={6} className={styles.strongPoint} />
            <text x={330} y={41} className={styles.label} style={TEXT}>
              KCl (measured, Ex. 2.6)
            </text>
            <circle cx={318} cy={62} r={5} className={styles.weakPoint} />
            <text x={330} y={67} className={styles.label} style={TEXT}>
              CH₃COOH (from Ka)
            </text>
          </g>
        </svg>

        <p className={styles.readout} aria-live="polite">
          KCl: {kclCount} of {KCL_POINTS.length} points. Least-squares line gives <span className="sym">Λ°m</span> = {fit.lambda0Scm2.toFixed(1)} S cm² mol⁻¹ and <span className="sym">A</span> = {fit.A.toFixed(1)} S cm² mol⁻¹ (mol L⁻¹)^−½.
          {aceticCount > 0
            ? ` Acetic acid (${aceticCount} points) is computed from Ka = 1.78 × 10⁻⁵, not measured: its curve has no straight-line intercept.`
            : ' Add acetic acid points to compare the steep weak-electrolyte curve.'}
        </p>
      </section>

      <section className={styles.panel} aria-labelledby="kohl-ions-title">
        <h3 id="kohl-ions-title" className={styles.panelTitle}>
          B. Ions add up to Λ°m
        </h3>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Cation</span>
          <Segmented
            label="Cation"
            value={cationId}
            onChange={setCationId}
            options={CATION_CHOICES.map((c) => ({ value: c.id, label: ionLabel(c.id) }))}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Anion</span>
          <Segmented
            label="Anion"
            value={anionId}
            onChange={setAnionId}
            options={ANION_CHOICES.map((a) => ({ value: a.id, label: ionLabel(a.id) }))}
          />
        </div>

        <div className={styles.result} aria-live="polite">
          {salt.valid ? (
            <>
              <p className={styles.formula}>
                {salt.formula} <span className={styles.muted}>ν₊ = {salt.nuCation}, ν₋ = {salt.nuAnion}</span>
              </p>
              <div className={styles.stack} role="img" aria-label={`${sumText}, made of cation ${salt.cationContribution.toFixed(1)} and anion ${salt.anionContribution.toFixed(1)}`}>
                <span className={styles.segCation} style={{ flexBasis: `${(salt.cationContribution / totalForBar) * 100}%` }} />
                <span className={styles.segAnion} style={{ flexBasis: `${(salt.anionContribution / totalForBar) * 100}%` }} />
              </div>
              <p className={styles.sum}>
                Λ°m({salt.formula}) = {salt.nuCation} × {lambda0OfIon(cation.id).toFixed(1)} + {salt.nuAnion} × {lambda0OfIon(anion.id).toFixed(1)} = <strong>{salt.lambda0Scm2.toFixed(1)}</strong> S cm² mol⁻¹
              </p>
            </>
          ) : (
            <p className={styles.caution}>{salt.reason}</p>
          )}
        </div>

        <h4 className={styles.subTitle}>Acetic acid from three strong electrolytes</h4>
        <ul className={styles.sumList}>
          <li>
            HCl: {lambda0OfIon('H+').toFixed(1)} + {lambda0OfIon('Cl-').toFixed(1)} = {decomposition.hcl.toFixed(1)}
          </li>
          <li>
            NaCH₃COO: {lambda0OfIon('Na+').toFixed(1)} + {lambda0OfIon('CH3COO-').toFixed(1)} = {decomposition.naAc.toFixed(1)}
          </li>
          <li>
            NaCl: {lambda0OfIon('Na+').toFixed(1)} + {lambda0OfIon('Cl-').toFixed(1)} = {decomposition.naCl.toFixed(1)}
          </li>
          <li>
            Λ°m(CH₃COOH) = {decomposition.hcl.toFixed(1)} + {decomposition.naAc.toFixed(1)} − {decomposition.naCl.toFixed(1)} = <strong>{ACETIC_LAMBDA0.toFixed(1)}</strong> S cm² mol⁻¹
          </li>
        </ul>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>
            Concentration <span className="sym">c</span>
          </span>
          <Slider
            label="Concentration of acetic acid"
            value={logC}
            min={-5}
            max={-3}
            step={0.05}
            onChange={setLogC}
            format={(v) => `${formatSci(10 ** v)} mol L⁻¹`}
          />
        </div>
        <div className={styles.result} aria-live="polite">
          <p className={styles.sum}>
            At <span className="sym">c</span> = {formatSci(c)} mol L⁻¹
          </p>
          <p className={styles.sum}>
            <span className="sym">Λm</span> = {acetic.lambdaScm2.toFixed(1)} S cm² mol⁻¹ (computed from Ka, not measured)
          </p>
          <p className={styles.sum}>
            <span className="sym">α</span> = <span className="sym">Λm</span>/<span className="sym">Λ°m</span> = {readout.alpha.toFixed(4)}
          </p>
          <p className={styles.sum}>
            <span className="sym">Ka</span> = <span className="sym">cα</span>²/(1 − <span className="sym">α</span>) = {formatSci(readout.Ka, 3)}
          </p>
        </div>
      </section>
    </div>
  )
}
