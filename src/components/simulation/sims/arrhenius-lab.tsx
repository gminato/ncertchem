'use client'

import { useRef, useState } from 'react'
import { Button, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  EnergyProfile,
  PlotCurve,
  PlotFrame,
  PlotLine,
  PlotPoint,
  PlotShade,
  fractionAbove,
  maxwellBoltzmann,
} from '@/components/vocab'
import {
  ARRHENIUS_DEFAULT_EA_KJ,
  ARRHENIUS_DEFAULT_T_K,
  ARRHENIUS_DH_KJ,
  ARRHENIUS_EA_MAX_KJ,
  ARRHENIUS_EA_MIN_KJ,
  ARRHENIUS_TEMP_MAX_K,
  ARRHENIUS_TEMP_MIN_K,
  deriveArrhenius,
  drawnTailArea,
  lnKExtent,
} from '@/lib/chem/arrhenius-lab'
import { formatSci, formatSig } from '@/lib/chem/kinetics'
import styles from './arrhenius-lab.module.css'

/** Schematic Maxwell–Boltzmann axes: E in arbitrary units, θ = 2 at 298 K. */
const MB_X_MAX = 6
/** Tall enough for the enlarged tail at the slider extremes (about 0.43 at Eₐ 100 kJ mol⁻¹, 350 K). */
const MB_Y_MAX = 0.45
const MB_THETA_REF = 2
/** Schematic position of the Eₐ marker at 50 kJ mol⁻¹. */
const MB_EA_AT_DEFAULT = 2.2

/** The ln k plot: x = 1/T (10⁻³ K⁻¹ scale), y = ln(k / s⁻¹). Y-range comes from the slider box. */
const LNK_X = { min: 2.9e-3, max: 3.6e-3 }
const LNK_Y = lnKExtent()
const LNK_TICKS = Array.from({ length: LNK_Y.max - LNK_Y.min + 1 }, (_, i) => LNK_Y.min + i)

/** Shared frame geometry for the two plots (viewBox units). */
const FRAME = { x: 72, y: 18, width: 388, height: 220 }
/** Narrow viewBox so that a half-width panel renders the 14-unit tick labels at 14 px or more. */
const PANEL = { w: 480, h: 300 }

/** Energy profile: heights are proportional to energy, 0.01 units per kJ mol⁻¹. */
const ENERGY_UNITS_PER_KJ = 0.01
/** Plot box of the energy profile inside its SVG (viewBox units). */
const EP = { x: 72, y: 16, w: PANEL.w - 96, h: PANEL.h - 72 }
/** Fraction of the x-range where the single activated complex sits (EnergyProfile's middle station). */
const EP_PEAK_FRACTION = 0.45

/**
 * Maps an energy level to a y position in the energy profile. It mirrors EnergyProfile's
 * vertical fit (levels span the box, with a margin above the highest), so the Eₐ arrow
 * and its label line up with the drawn curve.
 */
function energyY(e: number, lo: number, hi: number): number {
  const bottom = EP.y + EP.h - 28
  const top = EP.y + 8
  const eMax = hi + 0.16 * (hi - lo || 1)
  return bottom + ((e - lo) * (top - bottom)) / (eMax - lo)
}

function thetaAt(tempK: number): number {
  return (MB_THETA_REF * tempK) / ARRHENIUS_DEFAULT_T_K
}

function mbX(E: number): number {
  return FRAME.x + (E / MB_X_MAX) * FRAME.width
}

/** Drawn tail for one curve: the shape of the schematic MB curve, scaled to the drawn tail area. */
function tailFn(theta: number, eaSchematic: number, area: number) {
  const scale = area / fractionAbove(eaSchematic, theta)
  return (E: number) => scale * maxwellBoltzmann(E, theta)
}

export function ArrheniusLab(_: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)

  const [tempK, setTempK] = useState<number>(ARRHENIUS_DEFAULT_T_K)
  const [eaKj, setEaKj] = useState<number>(ARRHENIUS_DEFAULT_EA_KJ)

  const s = deriveArrhenius(tempK, eaKj)
  const eaSchematic = (MB_EA_AT_DEFAULT * eaKj) / ARRHENIUS_DEFAULT_EA_KJ
  const areaNow = drawnTailArea(tempK, eaKj)
  const areaNext = drawnTailArea(tempK + 10, eaKj)
  const thetaNow = thetaAt(tempK)
  const thetaNext = thetaAt(tempK + 10)
  const eaLabel = `Eₐ = ${eaKj.toFixed(1)} kJ mol⁻¹`

  // Energy profile: the barrier and the ΔrH drop are both proportional to energy, so the
  // products sit slightly below the reactants (ΔrH ≈ −9.4 kJ mol⁻¹), much less than Eₐ.
  const peakUnits = eaKj * ENERGY_UNITS_PER_KJ
  const productUnits = ARRHENIUS_DH_KJ * ENERGY_UNITS_PER_KJ
  const profileLo = Math.min(0, productUnits)
  const yRef = energyY(0, profileLo, peakUnits)
  const yPeak = energyY(peakUnits, profileLo, peakUnits)
  const arrowX = EP.x + EP_PEAK_FRACTION * EP.w

  const raise = () => setTempK((t) => Math.min(ARRHENIUS_TEMP_MAX_K, t + 10))

  const summary =
    `At ${tempK} K with Eₐ ${eaKj.toFixed(1)} kJ mol⁻¹, k = ${formatSci(s.k, 3)} s⁻¹; ` +
    `raising T by 10 K multiplies it by ${formatSig(s.ratio, 3)}.`

  return (
    <div className={styles.sim} ref={rootRef} data-active={active ? 'true' : 'false'}>
      <div className={styles.controls}>
        <div className={styles.sliderGrid}>
          <Slider
            label="Temperature T"
            value={tempK}
            min={ARRHENIUS_TEMP_MIN_K}
            max={ARRHENIUS_TEMP_MAX_K}
            step={1}
            unit="K"
            format={(v) => v.toFixed(0)}
            onChange={setTempK}
          />
          <Slider
            label="Activation energy Eₐ"
            value={eaKj}
            min={ARRHENIUS_EA_MIN_KJ}
            max={ARRHENIUS_EA_MAX_KJ}
            step={0.5}
            unit="kJ mol⁻¹"
            format={(v) => v.toFixed(1)}
            onChange={setEaKj}
          />
        </div>
        <div className={styles.ratioRow}>
          <Button variant="secondary" onClick={raise} disabled={tempK >= ARRHENIUS_TEMP_MAX_K}>
            +10 K
          </Button>
          <span className={styles.ratioText}>
            k(T + 10 K) / k(T) = <strong>{formatSig(s.ratio, 3)}</strong>
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        <figure className={styles.panel}>
          <svg className={styles.svg} viewBox={`0 0 ${PANEL.w} ${PANEL.h}`} role="img" aria-label={`Energy profile with the activation energy ${eaKj.toFixed(1)} kJ mol⁻¹`}>
            <EnergyProfile
              x={EP.x}
              y={EP.y}
              width={EP.w}
              height={EP.h}
              reactant={0}
              product={productUnits}
              peak={peakUnits}
              reactantsLabel="reactants"
              productsLabel="products"
              xTitle="Reaction coordinate"
              yTitle="Potential energy"
            />
            {/* Eₐ arrow from the reactant level to the peak. The two labels sit above the peak, where no curve can reach. */}
            <g stroke="var(--fg)" fill="var(--fg)" strokeWidth={2}>
              <line x1={arrowX} x2={arrowX} y1={yRef} y2={yPeak} strokeLinecap="round" />
              <path d={`M${arrowX - 4.2} ${yPeak + 6} L${arrowX} ${yPeak} L${arrowX + 4.2} ${yPeak + 6} Z`} stroke="none" />
              <path d={`M${arrowX - 4.2} ${yRef - 6} L${arrowX} ${yRef} L${arrowX + 4.2} ${yRef - 6} Z`} stroke="none" />
            </g>
            <text x={arrowX} y={yPeak - 30} textAnchor="middle" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
              activated complex
            </text>
            <text x={arrowX + 9} y={yPeak - 6} textAnchor="start" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
              {eaLabel}
            </text>
          </svg>
          <figcaption className={styles.caption}>Energy barrier: the peak sits Eₐ above the reactants, and the products lie a little lower.</figcaption>
        </figure>

        <figure className={styles.panel}>
          <svg className={styles.svg} viewBox={`0 0 ${PANEL.w} ${PANEL.h}`} role="img" aria-label={`Maxwell–Boltzmann curves at ${tempK} K and ${tempK + 10} K with the tails beyond Eₐ shaded`}>
            <PlotFrame
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.width}
              height={FRAME.height}
              domain={{ xMin: 0, xMax: MB_X_MAX, yMin: 0, yMax: MB_Y_MAX }}
              xTicks={[0, 2, 4, 6]}
              yTicks={[0, 0.1, 0.2, 0.3, 0.4]}
              yTickFormat={(v) => v.toFixed(1)}
              xTitle="Kinetic energy, E (schematic)"
              yTitle="Fraction f(E)"
            >
              <PlotShade fn={tailFn(thetaNext, eaSchematic, areaNext)} from={eaSchematic} to={MB_X_MAX} tone="product" opacity={0.32} />
              <PlotShade fn={tailFn(thetaNow, eaSchematic, areaNow)} from={eaSchematic} to={MB_X_MAX} tone="reactant" opacity={0.32} />
              <PlotLine from={{ x: eaSchematic, y: 0 }} to={{ x: eaSchematic, y: MB_Y_MAX }} tone="accent" dashed width={2} />
              <PlotCurve fn={(E) => maxwellBoltzmann(E, thetaNow)} from={0} to={MB_X_MAX} samples={240} tone="reactant" width={3} />
              <PlotCurve fn={(E) => maxwellBoltzmann(E, thetaNext)} from={0} to={MB_X_MAX} samples={240} tone="product" width={3} />
            </PlotFrame>
            <text x={mbX(eaSchematic) + 6} y={FRAME.y + 18} fontSize={16} className={styles.label}>
              Eₐ
            </text>
            <text x={FRAME.x + FRAME.width - 10} y={FRAME.y + 22} textAnchor="end" fontSize={16} className={styles.toneReactant}>
              T = {tempK} K
            </text>
            <text x={FRAME.x + FRAME.width - 10} y={FRAME.y + 44} textAnchor="end" fontSize={16} className={styles.toneProduct}>
              T + 10 K = {tempK + 10} K
            </text>
          </svg>
          <figcaption className={styles.caption}>
            Tails enlarged, not to scale. The true share beyond Eₐ is {formatSci(s.fraction, 3)} at {tempK} K.
          </figcaption>
        </figure>

        <figure className={styles.panel}>
          <svg className={styles.svg} viewBox={`0 0 ${PANEL.w} ${PANEL.h}`} role="img" aria-label="Straight-line plot of ln k against 1/T with the current point">
            <PlotFrame
              x={FRAME.x}
              y={FRAME.y}
              width={FRAME.width}
              height={FRAME.height}
              domain={{ xMin: LNK_X.min, xMax: LNK_X.max, yMin: LNK_Y.min, yMax: LNK_Y.max }}
              xTicks={[3.0e-3, 3.2e-3, 3.4e-3, 3.6e-3]}
              yTicks={LNK_TICKS}
              xTickFormat={(v) => (v * 1000).toFixed(1)}
              yTickFormat={(v) => v.toFixed(0)}
              xTitle="1/T, in 10⁻³ K⁻¹"
              yTitle="ln k (k in s⁻¹)"
            >
              <PlotLine through={{ x: s.invT, y: s.lnK }} slope={s.line.slope} tone="accent" width={2.5} />
              <PlotPoint at={{ x: s.invT, y: s.lnK }} tone="product" label={`${tempK} K`} side="ne" />
            </PlotFrame>
            <text x={FRAME.x + FRAME.width - 10} y={FRAME.y + 22} textAnchor="end" fontSize={16} className={styles.label}>
              slope = −Eₐ/R = {formatSci(s.line.slope, 3)} K
            </text>
          </svg>
          <figcaption className={styles.caption}>
            The line is straight; its steepness is Eₐ/R, and the intercept at 1/T = 0 is ln A.
          </figcaption>
        </figure>

        <div className={styles.readout}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <span className={styles.sym}>k</span> at {tempK} K
            </span>
            <span className={styles.statValue}>{formatSci(s.k, 3)} s⁻¹</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              Pre-exponential factor <span className={styles.sym}>A</span>
            </span>
            <span className={styles.statValue}>{formatSci(s.A, 3)} s⁻¹</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <span className={styles.sym}>e</span>
              <span className={styles.exp}>−Eₐ/RT</span> (fraction with energy ≥ Eₐ)
            </span>
            <span className={styles.statValue}>{formatSci(s.fraction, 3)}</span>
          </div>
          <p className={styles.note}>
            The shaded tails are enlarged and not to scale: they show the direction of change, not the size. The true fraction with energy at or above Eₐ is the number above.
          </p>
          <p className={styles.srOnly} aria-live="polite">
            {summary}
          </p>
        </div>
      </div>
    </div>
  )
}
