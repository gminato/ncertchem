'use client'

import { useState } from 'react'
import katex from 'katex'
import { Button, Segmented, Slider } from '@/components/controls'
import { PlotCurve, PlotFrame, PlotPoint, PlotShade, VocabDefs } from '@/components/vocab'
import { formatSig, rateConstantUnits, rateFromLaw, type Rational, type UnitPart } from '@/lib/chem/kinetics'
import styles from './order-units-lab.module.css'

/** The rate constant used throughout the Section. Its units change with the order, its value does not. */
const K = 0.2
/** Concentration slider range, mol L⁻¹. Doubling the largest value gives the right edge of the plot. */
const A_MIN = 0.05
const A_MAX = 1
const A_STEP = 0.05
const A_DEFAULT = 0.5
const X_MAX = 2 * A_MAX

/** Plot window and frame, in viewBox units (the viewBox width is about the stage width). */
const VIEW = { w: 560, h: 390 }
const FRAME = { x: 76, y: 22, width: 452, height: 296 }
const X_TICKS = [0, 0.5, 1, 1.5, 2]
/** The y window is the rate of the highest order (n = 3) at the right edge, so every order fits on one scale. */
const Y_MAX = rateFromLaw(K, { A: X_MAX }, { A: 3 })
const Y_TICKS = [0, 0.25, 0.5, 0.75, 1].map((f) => Number((f * Y_MAX).toFixed(4)))

type OrderKey = '0' | '0.5' | '1' | '1.5' | '2' | '3'

interface OrderChoice {
  key: OrderKey
  n: number
  label: string
  /** The exponent n in KaTeX. */
  tex: string
  /** The exponent 1 − n in KaTeX, for the built form of the units. */
  oneMinusTex: string
}

const ORDERS: readonly OrderChoice[] = [
  { key: '0', n: 0, label: '0', tex: '0', oneMinusTex: '1' },
  { key: '0.5', n: 0.5, label: '½', tex: '\\tfrac{1}{2}', oneMinusTex: '\\tfrac{1}{2}' },
  { key: '1', n: 1, label: '1', tex: '1', oneMinusTex: '0' },
  { key: '1.5', n: 1.5, label: '3/2', tex: '\\tfrac{3}{2}', oneMinusTex: '-\\tfrac{1}{2}' },
  { key: '2', n: 2, label: '2', tex: '2', oneMinusTex: '-1' },
  { key: '3', n: 3, label: '3', tex: '3', oneMinusTex: '-2' },
]

const ORDER_OPTIONS = ORDERS.map((o) => ({ value: o.key, label: <span className={styles.optionLabel}>{o.label}</span> }))
const DEFAULT_ORDER = ORDERS[2]

function tex(source: string): string {
  return katex.renderToString(source, { throwOnError: false, displayMode: true })
}

function expTex(r: Rational): string {
  if (r.denominator === 1) return String(r.numerator)
  return `${r.numerator < 0 ? '-' : ''}\\tfrac{${Math.abs(r.numerator)}}{${r.denominator}}`
}

/** Simplified units from the lib's unit parts, e.g. mol^(1/2) L^(−1/2) s⁻¹ as \text{mol}^{\tfrac{1}{2}}\,… */
function simplifiedTex(parts: readonly UnitPart[]): string {
  return parts
    .filter((p) => p.exponent.numerator !== 0)
    .map((p) => {
      const symbol = `\\text{${p.symbol}}`
      const isOne = p.exponent.numerator === p.exponent.denominator
      return isOne ? symbol : `${symbol}^{${expTex(p.exponent)}}`
    })
    .join('\\,')
}

export function OrderUnitsLab() {
  const [orderKey, setOrderKey] = useState<OrderKey>(DEFAULT_ORDER.key)
  const [a, setA] = useState(A_DEFAULT)
  const [doubled, setDoubled] = useState(false)

  const order = ORDERS.find((o) => o.key === orderKey) ?? DEFAULT_ORDER
  const n = order.n

  const rate = rateFromLaw(K, { A: a }, { A: n })
  const rateDoubled = rateFromLaw(K, { A: 2 * a }, { A: n })
  const factor = rateDoubled / rate
  const units = rateConstantUnits(n)

  const rateLawTex = tex(`\\text{Rate} = k[\\mathrm{A}]^{${order.tex}}`)
  // First order has no concentration factor to build, so its built form is the bare s⁻¹ (no zero-power term).
  const builtFactor = order.key === '1' ? '' : `(\\text{mol L}^{-1})^{${order.oneMinusTex}}\\,`
  const builtTex = tex(`k = ${K.toFixed(3)}\\ ${builtFactor}\\text{s}^{-1}`)
  const simplifiedHtml = tex(`k = ${K.toFixed(3)}\\ ${simplifiedTex(units.parts)}`)

  const summary =
    `Order ${order.label}. Rate = k[A]^${order.label} with k = ${K.toFixed(3)} ${units.text}. ` +
    `At [A] = ${a.toFixed(2)} mol L⁻¹ the rate is ${formatSig(rate, 3)} mol L⁻¹ s⁻¹. ` +
    (doubled ? `Doubling [A] multiplies the rate by ${formatSig(factor, 3)}, which is 2 to the power ${order.label}.` : '')

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Order n"
          options={ORDER_OPTIONS}
          value={orderKey}
          onChange={(key) => setOrderKey(key)}
        />
        <div className={styles.controlRow}>
          <div className={styles.sliderWrap}>
            <Slider
              label="Concentration [A]"
              value={a}
              min={A_MIN}
              max={A_MAX}
              step={A_STEP}
              unit="mol L⁻¹"
              format={(v) => v.toFixed(2)}
              onChange={setA}
            />
          </div>
          <Button
            variant={doubled ? 'primary' : 'secondary'}
            aria-pressed={doubled}
            onClick={() => setDoubled((d) => !d)}
          >
            Double [A]
          </Button>
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          role="img"
          aria-label={`Rate against [A] for order ${order.label}, with the live point at [A] = ${a.toFixed(2)} mol L⁻¹`}
        >
          <VocabDefs idPrefix="orderunits" />
          <PlotFrame
            x={FRAME.x}
            y={FRAME.y}
            width={FRAME.width}
            height={FRAME.height}
            domain={{ xMin: 0, xMax: X_MAX, yMin: 0, yMax: Y_MAX }}
            xTicks={X_TICKS}
            yTicks={Y_TICKS}
            grid
            xTitle={
              <>
                <tspan className="sym">[A]</tspan> / mol L⁻¹
              </>
            }
            yTitle="rate / mol L⁻¹ s⁻¹"
          >
            <PlotCurve fn={(x) => rateFromLaw(K, { A: x }, { A: n })} from={0} to={X_MAX} tone="reactant" width={3.5} />
            {doubled && <PlotShade fn={(x) => rateFromLaw(K, { A: x }, { A: n })} from={a} to={2 * a} tone="neutral" opacity={0.14} />}
            <PlotPoint at={{ x: a, y: rate }} tone="accent" />
            {doubled && <PlotPoint at={{ x: 2 * a, y: rateDoubled }} tone="product" label={`×${formatSig(factor, 3)}`} side="nw" />}
          </PlotFrame>
        </svg>
      </div>

      <div className={styles.readouts}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Rate law</p>
          <div className={styles.math} dangerouslySetInnerHTML={{ __html: rateLawTex }} />
          <p className={styles.note}>
            Order <span className="sym">n</span> = {order.label}, the sum of the exponents.
          </p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Units of k, built term by term</p>
          <div className={styles.math} dangerouslySetInnerHTML={{ __html: builtTex }} />
          <p className={styles.cardLabel}>Simplified</p>
          <div className={styles.math} dangerouslySetInnerHTML={{ __html: simplifiedHtml }} />
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>Live rate</p>
          <p className={styles.value}>
            At <span className="sym">[A]</span> = {a.toFixed(2)} mol L⁻¹, the rate is {formatSig(rate, 3)} mol L⁻¹ s⁻¹.
          </p>
          {doubled ? (
            <p className={styles.value}>
              At {(2 * a).toFixed(2)} mol L⁻¹ it is {formatSig(rateDoubled, 3)}: the rate grows by ×{formatSig(factor, 3)}, which is 2<span className={styles.sup}>{order.label}</span>.
            </p>
          ) : (
            <p className={styles.note}>Press Double [A] to see the factor by which the rate changes.</p>
          )}
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
