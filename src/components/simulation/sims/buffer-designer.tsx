'use client'

import { useMemo, useState, type ReactNode } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button, Segmented, Slider } from '@/components/controls'
import { PHScale } from '@/components/equilibrium'
import type { SimulationProps } from '@/components/simulation/registry'
import { BUFFER_PAIRS, SALT_CASES, designBuffer, saltPH, type BufferPair, type SaltCase } from './buffer-designer-model'
import styles from './buffer-designer.module.css'

type Mode = 'buffer' | 'salt'

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
}

/** A constant in the form 1.74 × 10⁻⁵, with superscript exponent. */
function sciText(value: number): string {
  const exponent = Math.floor(Math.log10(value))
  const mantissa = (value / 10 ** exponent).toFixed(2)
  const sup = String(exponent).replace(/[0-9-]/g, (c) => SUPERSCRIPTS[c])
  return `${mantissa} × 10${sup}`
}

/** Signed mmol for the addition slider: + strong acid (HCl), − strong base (NaOH). */
function additionLabel(mmol: number): string {
  if (mmol === 0) return 'none'
  const amount = Math.abs(mmol).toFixed(1)
  return mmol > 0 ? `+${amount} mmol HCl` : `−${amount} mmol NaOH`
}

/** A pH or pKa with two decimal places. */
const phText = (value: number) => value.toFixed(2)

/** A TeX string rendered by KaTeX in display mode. */
function Tex({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: true }), [tex])
  return <div className={styles.tex} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A mhchem equation rendered inline. */
function Equation({ ce }: { ce: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${ce}}`, { throwOnError: false }), [ce])
  return <span className={styles.equation} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A labelled row of the readout. */
function Row({ label, children, testId }: { label: ReactNode; children: ReactNode; testId?: string }) {
  return (
    <div className={styles.row} data-testid={testId}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  )
}

/** A pH scale in a fixed 640 × 214 frame, labelled with the solution it shows. */
function Scale({ title, pH }: { title: string; pH: number }) {
  return (
    <figure className={styles.scale}>
      <figcaption className={styles.scaleTitle}>{title}</figcaption>
      <svg viewBox="0 0 640 214" role="img" aria-label={`${title}: pH ${phText(pH)}`} className={styles.scaleSvg}>
        <PHScale pH={pH} />
      </svg>
    </figure>
  )
}

const SALT_EQUATIONS: Record<SaltCase['id'], string[]> = {
  nacl: [],
  naac: ['\\ce{CH3COO- + H2O <=> CH3COOH + OH-}'],
  nh4cl: ['\\ce{NH4+ + H2O <=> NH3 + H3O+}'],
  nh4hcoo: ['\\ce{HCOO- + H2O <=> HCOOH + OH-}', '\\ce{NH4+ + H2O <=> NH3 + H3O+}'],
}

const SALT_FORMULA_TEX: Record<SaltCase['type'], string> = {
  'strong-strong': '\\mathrm{pH} = 7',
  'weak-acid-strong-base': '\\mathrm{pH} = 7 + \\tfrac{1}{2}\\left(\\mathrm{p}K_a + \\log c\\right)',
  'strong-acid-weak-base': '\\mathrm{pH} = 7 - \\tfrac{1}{2}\\left(\\mathrm{p}K_b + \\log c\\right)',
  'weak-weak': '\\mathrm{pH} = 7 + \\tfrac{1}{2}\\left(\\mathrm{p}K_a - \\mathrm{p}K_b\\right)',
}

const SALT_NOTE: Record<SaltCase['id'], string> = {
  nacl: 'Neither ion reacts with water, so the solution is neutral at 298 K.',
  naac: 'The acetate ion takes a proton from water. The acid it forms is weak, so OH⁻ is left in excess.',
  nh4cl: 'The ammonium ion gives a proton to water. The base it forms is weak, so H₃O⁺ is left in excess.',
  nh4hcoo: 'Both ions react with water. The pH depends on Ka and Kb together, not on the concentration.',
}

/**
 * Two tabs. The buffer tab designs a buffer from an acid–salt pair, a ratio and a total concentration,
 * reads its pH by Henderson–Hasselbalch, then adds strong acid or base in steps and compares 100 mL of
 * water with the same addition. The salt tab gives the pH of a salt solution by its type.
 */
export function BufferDesigner(_props: SimulationProps) {
  const [mode, setMode] = useState<Mode>('buffer')
  const [pairId, setPairId] = useState<BufferPair['id']>(BUFFER_PAIRS[0].id)
  const [sharePct, setSharePct] = useState(50)
  const [totalConc, setTotalConc] = useState(0.2)
  const [added, setAdded] = useState(0)
  const [saltId, setSaltId] = useState<SaltCase['id']>(SALT_CASES[1].id)
  const [saltConc, setSaltConc] = useState(0.1)

  const pair = BUFFER_PAIRS.find((p) => p.id === pairId) ?? BUFFER_PAIRS[0]
  const design = designBuffer({ pair, baseShare: sharePct / 100, totalConc, addedMmol: added })
  const salt = SALT_CASES.find((s) => s.id === saltId) ?? SALT_CASES[1]
  const saltResult = saltPH(salt, saltConc)

  const acidSymbol = pair.acidName
  const baseSymbol = pair.baseName
  const pairLabel = BUFFER_PAIRS.find((p) => p.id === pairId)?.label ?? pair.label

  const summary =
    mode === 'buffer'
      ? `${pairLabel}, pKa ${phText(pair.pKa)}. Base form ${sharePct} percent of ${totalConc.toFixed(2)} mol per litre. Start pH ${phText(design.pHStart)}. After ${additionLabel(added)} in 100 millilitres: buffer pH ${phText(design.pHBuffer)}, water pH ${phText(design.pHWater)}.${design.exceedsCapacity ? ' The addition is larger than the buffer can absorb, so the excess sets the pH.' : ''}`
      : `${salt.label}, ${salt.parts}. At ${saltConc.toFixed(2)} mol per litre the pH is ${phText(saltResult.pH)}, which is ${saltResult.nature}.`

  return (
    <div className={styles.sim} data-testid="buffer-designer" data-mode={mode}>
      <Segmented<Mode>
        label="Mode"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'buffer', label: 'Buffer' },
          { value: 'salt', label: 'Salt hydrolysis' },
        ]}
      />

      {mode === 'buffer' ? (
        <div className={styles.layout}>
          <div className={styles.inputs}>
            <div className={styles.card}>
              <h4 className={styles.cardTitle}>Acid–salt pair</h4>
              <Segmented<BufferPair['id']>
                label="Acid–salt pair"
                value={pairId}
                onChange={(v) => {
                  setPairId(v)
                  setAdded(0)
                }}
                options={BUFFER_PAIRS.map((p) => ({ value: p.id, label: p.label }))}
              />
              <p className={styles.note}>
                {pair.basic
                  ? `A basic buffer: the weak base ${baseSymbol} and its conjugate acid ${acidSymbol}. pKa is that of ${acidSymbol}.`
                  : `An acidic buffer: the weak acid ${acidSymbol} and its conjugate base ${baseSymbol}.`}{' '}
                Source of pKa: {pair.source}.
              </p>
            </div>

            <div className={styles.card}>
              <h4 className={styles.cardTitle}>Design</h4>
              <Slider
                label={`${baseSymbol} share of the buffer`}
                value={sharePct}
                min={10}
                max={90}
                step={5}
                unit="%"
                format={(v) => `${v.toFixed(0)} %`}
                onChange={(v) => setSharePct(v)}
              />
              <Slider
                label="Total concentration"
                value={totalConc}
                min={0.02}
                max={0.5}
                step={0.01}
                unit="mol L⁻¹"
                format={(v) => `${v.toFixed(2)} mol L⁻¹`}
                onChange={(v) => setTotalConc(v)}
              />
            </div>

            <div className={styles.card}>
              <h4 className={styles.cardTitle}>Add a strong acid or base (100 mL)</h4>
              <Slider
                label="Added"
                value={added}
                min={-10}
                max={10}
                step={0.5}
                format={additionLabel}
                onChange={(v) => setAdded(v)}
              />
              <div className={styles.buttons}>
                <Button variant="secondary" onClick={() => setAdded((a) => Math.min(10, a + 0.5))}>
                  Add 0.5 mmol HCl
                </Button>
                <Button variant="secondary" onClick={() => setAdded((a) => Math.max(-10, a - 0.5))}>
                  Add 0.5 mmol NaOH
                </Button>
                <Button variant="primary" onClick={() => setAdded(0)}>
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.outputs}>
            <div className={styles.readout} aria-live="polite" data-testid="buffer-readout">
              <Tex
                tex={`\\mathrm{pH} = \\mathrm{p}K_a + \\log\\frac{[\\mathrm{${baseSymbol}}]}{[\\mathrm{${acidSymbol}}]} = ${phText(pair.pKa)} + \\log\\frac{${design.baseConc.toFixed(3)}}{${design.acidConc.toFixed(3)}}`}
              />
              <Row label={<span className="sym">pKa</span>} testId="pka">{phText(pair.pKa)}</Row>
              <Row label="Start pH" testId="ph-start">{phText(design.pHStart)}</Row>
              <Row label="Buffer now" testId="ph-buffer">
                {phText(design.pHBuffer)}: {baseSymbol} {design.baseMmol.toFixed(1)} mmol, {acidSymbol}{' '}
                {design.acidMmol.toFixed(1)} mmol
              </Row>
              <Row label="Water now" testId="ph-water">{phText(design.pHWater)}</Row>
              <Row label="Capacity" testId="capacity">
                {design.exceedsCapacity
                  ? 'Exceeded: the excess strong acid or base now sets the pH.'
                  : added === 0
                    ? 'No addition yet.'
                    : 'Within the buffer capacity: Henderson–Hasselbalch still applies.'}
              </Row>
            </div>

            <div className={styles.scales}>
              <Scale title="Buffer" pH={design.pHBuffer} />
              <Scale title="Water, same addition" pH={design.pHWater} />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.inputs}>
            <div className={styles.card}>
              <h4 className={styles.cardTitle}>Salt</h4>
              <Segmented<SaltCase['id']>
                label="Salt"
                value={saltId}
                onChange={setSaltId}
                options={SALT_CASES.map((s) => ({ value: s.id, label: s.label }))}
              />
              <p className={styles.note}>{salt.parts[0].toUpperCase() + salt.parts.slice(1)}.</p>
            </div>

            <div className={styles.card}>
              <Slider
                label="Salt concentration"
                value={saltConc}
                min={0.01}
                max={1}
                step={0.01}
                unit="mol L⁻¹"
                format={(v) => `${v.toFixed(2)} mol L⁻¹`}
                onChange={(v) => setSaltConc(v)}
              />
            </div>
          </div>

          <div className={styles.outputs}>
            <div className={styles.readout} aria-live="polite" data-testid="salt-readout">
              {SALT_EQUATIONS[salt.id].map((eq) => (
                <Tex key={eq} tex={eq} />
              ))}
              <Tex tex={SALT_FORMULA_TEX[salt.type]} />
              <Row label="Type" testId="salt-type">{typeName(salt)}</Row>
              <Row label="pH" testId="salt-ph">{phText(saltResult.pH)}, {saltResult.nature}</Row>
              <Row label="Constants" testId="salt-constants">{constantsText(salt)}</Row>
              <p className={styles.note}>{SALT_NOTE[salt.id]}</p>
            </div>
            <div className={styles.scales}>
              <Scale title={salt.label} pH={saltResult.pH} />
            </div>
          </div>
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

function typeName(salt: SaltCase): string {
  switch (salt.type) {
    case 'strong-strong':
      return 'strong acid, strong base'
    case 'weak-acid-strong-base':
      return 'weak acid, strong base'
    case 'strong-acid-weak-base':
      return 'strong acid, weak base'
    case 'weak-weak':
      return 'weak acid, weak base'
  }
}

function constantsText(salt: SaltCase): string {
  const parts: string[] = []
  if (salt.ka !== undefined) parts.push(`Ka = ${sciText(salt.ka)}`)
  if (salt.kb !== undefined) parts.push(`Kb = ${sciText(salt.kb)}`)
  return parts.length ? parts.join(', ') : 'no weak part'
}
