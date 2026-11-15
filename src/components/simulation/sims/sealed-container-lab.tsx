'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { RateBars, SealedVessel, WATER_VAPOUR_SPECIES, type VesselSpecies } from '@/components/equilibrium'
import { formatSci, ratesEqual } from '@/components/equilibrium/geometry'
import { SodaBottle, SODA_BOTTLE_SIZE } from '@/components/animations/unit6/physical/SodaBottle'
import { progressForFraction } from '@/components/animations/unit6/physical/physical-steps'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { dynamicEquilibrium } from '@/lib/chem/physical-equilibrium'
import {
  AIR_CO2_BAR,
  co2HenryConstant,
  dissolvedCO2,
  relaxToEquilibrium,
  sealedApproach,
  vapourPressureMmHg,
  type VapourSubstance,
} from '@/lib/chem/sealed-container'
import styles from './sealed-container-lab.module.css'

/** Condensation constant, per second. Evaporation is kc × p*, so the box settles at p* whatever kc is. */
const KC = 0.5
/** Seconds of run time after which the sealed box has effectively settled (1 − e^(−6) ≈ 0.998). */
const T_MAX_SEALED = 12
/** Time constant of the relaxation after the cap comes off, seconds. An illustrative display value. */
const TAU_SODA = 1.5
const T_MAX_SODA = 14
/** Dial full scales, mmHg. */
const DIAL_MMHG: Record<VapourSubstance, number> = { water: 800, ethanol: 800, iodine: 20 }
const SOLID_COUNT = 10
const GAS_COUNT_MAX = 14
const LIQUID_COUNT = 12
/** Crossings per second for the dots that show particles leaving and returning, at equilibrium. */
const CROSS_RATE = 1.4

const SUBSTANCE_OPTIONS = [
  { value: 'water', label: 'Water' },
  { value: 'ethanol', label: 'Ethanol' },
  { value: 'iodine', label: 'Iodine' },
] as const satisfies readonly { value: VapourSubstance; label: string }[]

const MODE_OPTIONS = [
  { value: 'sealed', label: 'Sealed box' },
  { value: 'soda', label: 'Soda bottle' },
] as const

type Mode = (typeof MODE_OPTIONS)[number]['value']

const SUBSTANCE_NAME: Record<VapourSubstance, string> = { water: 'water', ethanol: 'ethanol', iodine: 'iodine' }

/** Species drawn in the vessel for each substance. */
const SPECIES: Record<VapourSubstance, VesselSpecies[]> = {
  water: WATER_VAPOUR_SPECIES,
  ethanol: [
    { id: 'etoh-g', color: 'var(--liquid-edge)', phase: 'gas', label: 'C₂H₅OH(g)' },
    { id: 'etoh-l', color: 'var(--base)', phase: 'liquid', label: 'C₂H₅OH(l)' },
  ],
  iodine: [
    { id: 'i2-g', color: 'var(--i2)', phase: 'gas', label: 'I₂(g)' },
    { id: 'i2-s', color: 'var(--fg-muted)', phase: 'solid', label: 'I₂(s)' },
  ],
}

/** A signed number, with U+2212 for a negative value. Used for the net rate. */
function signed(value: number, digits: number): string {
  const text = Math.abs(value).toFixed(digits)
  if (Number(text) === 0) return text
  return value < 0 ? `−${text}` : `+${text}`
}

/** Position of a dot along a particle crossing, for the arrows drawn by SealedVessel. */
function crossingPoint(x: number, surface: number, phase: number, rising: boolean) {
  // Matches SealedVessel: the arrows run from surface + 22 to surface − 24 (forward) and back (reverse).
  const from = rising ? surface + 22 : surface - 24
  const to = rising ? surface - 24 : surface + 22
  return { x, y: from + (to - from) * phase }
}

/** Integral of the crossing frequency (CROSS_RATE × p/p*) from 0 to t, so the dot phase is continuous. */
function returnPhase(t: number): number {
  return CROSS_RATE * (t - (1 - Math.exp(-KC * t)) / KC)
}

export function SealedContainerLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<Mode>('sealed')
  const [substance, setSubstance] = useState<VapourSubstance>('water')
  const [tC, setTC] = useState(25)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const [co2Bar, setCo2Bar] = useState(3)
  const [opened, setOpened] = useState(false)
  const active = useIsActive(rootRef)

  const setClock = (value: number) => {
    elapsedRef.current = value
    setElapsed(value)
  }

  // One clock for both modes: seconds since the box was sealed, or since the cap came off.
  useEffect(() => {
    if (!running || !active || reducedMotion) return
    let raf = 0
    // The first frame only starts the clock: rAF timestamps can precede the time this effect ran.
    let last: number | null = null
    const limit = mode === 'sealed' ? T_MAX_SEALED : T_MAX_SODA
    const frame = (now: number) => {
      const dt = last === null ? 0 : Math.min(0.1, Math.max(0, (now - last) / 1000))
      last = now
      const next = Math.min(limit, elapsedRef.current + dt)
      elapsedRef.current = next
      setElapsed(next)
      if (next >= limit) {
        setRunning(false)
        return
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [running, active, reducedMotion, mode])

  /** Changing the substance or the temperature starts a new sealed box. */
  const newBox = () => {
    setRunning(false)
    setClock(0)
  }

  const resetBottle = () => {
    setOpened(false)
    setRunning(false)
    setClock(0)
  }

  const openCap = () => {
    setOpened(true)
    if (reducedMotion) {
      setClock(T_MAX_SODA)
      setRunning(false)
    } else {
      setClock(0)
      setRunning(true)
    }
  }

  const playSealed = () => {
    if (reducedMotion) {
      setClock(T_MAX_SEALED)
      return
    }
    if (elapsedRef.current >= T_MAX_SEALED) setClock(0)
    setRunning((r) => !r)
  }

  // Sealed box: the model values.
  const pStar = vapourPressureMmHg(substance, tC)
  const t = Math.max(0, elapsed)
  const p = sealedApproach(pStar, KC, t)
  const fraction = pStar === 0 ? 0 : p / pStar
  const balance = dynamicEquilibrium({ evaporationRate: KC * pStar, condensationConstant: KC, vapourPressure: p })
  const atEquilibrium = ratesEqual(balance.evaporation, balance.condensation, 0.01)
  const shownP = substance === 'iodine' ? p.toFixed(2) : p.toFixed(1)

  // Soda bottle: Henry's law before and after the cap comes off.
  const kH = co2HenryConstant(tC)
  const c0 = dissolvedCO2(tC, co2Bar)
  const cEq = dissolvedCO2(tC, AIR_CO2_BAR)
  const cNow = opened ? relaxToEquilibrium(c0, cEq, t, TAU_SODA) : c0
  const pHeadspaceNow = opened ? AIR_CO2_BAR + (co2Bar - AIR_CO2_BAR) * Math.exp(-t / TAU_SODA) : co2Bar
  const fizz = (cNow - cEq) / (c0 - cEq)

  // Particles crossing: dots show the forward and reverse crossings, one pair per arrow.
  const sealedSurface = substance === 'iodine' ? 196 : 150
  const fwdPhase = (CROSS_RATE * t) % 1
  const revPhase = returnPhase(t) % 1
  const fwdDot = crossingPoint(104, sealedSurface, fwdPhase, true)
  const revDot = crossingPoint(150, sealedSurface, revPhase, false)
  const showReverseDot = fraction > 0.02
  const gasCount = Math.round(GAS_COUNT_MAX * fraction)

  const summary =
    mode === 'sealed'
      ? `${capitalise(SUBSTANCE_NAME[substance])} at ${tC} °C in a sealed box: after ${t.toFixed(1)} s the vapour pressure is ${shownP} mmHg, and its equilibrium value is ${pStar.toFixed(substance === 'iodine' ? 2 : 1)} mmHg. ${atEquilibrium ? 'The rates are equal.' : 'Evaporation is still faster than condensation.'}`
      : `Soda bottle at ${tC} °C: dissolved CO₂ is ${formatSci(cNow)} mol L⁻¹ now, from ${formatSci(c0)} mol L⁻¹ when sealed at ${co2Bar.toFixed(1)} bar. ${opened ? 'The cap is off.' : 'The cap is on.'}`

  const sealedRunLabel = running ? 'Pause' : t >= T_MAX_SEALED ? 'Replay' : 'Play'

  return (
    <div className={styles.sim} data-testid="sealed-container-lab" ref={rootRef}>
      <div className={styles.controls}>
        <Segmented
          label="Experiment"
          options={MODE_OPTIONS}
          value={mode}
          onChange={(m) => {
            setMode(m)
            setRunning(false)
            setClock(0)
            setOpened(false)
          }}
        />
        {mode === 'sealed' ? (
          <>
            <Segmented
              label="Substance"
              options={SUBSTANCE_OPTIONS}
              value={substance}
              onChange={(s) => {
                setSubstance(s)
                newBox()
              }}
            />
            <Slider
              label="Temperature"
              value={tC}
              min={5}
              max={90}
              step={1}
              unit="°C"
              format={(v) => `${v.toFixed(0)} °C`}
              onChange={(v) => {
                setTC(v)
                newBox()
              }}
            />
            <div className={styles.buttons}>
              <Button onClick={playSealed} aria-pressed={running}>
                {sealedRunLabel}
              </Button>
              <Button variant="secondary" onClick={newBox}>
                Restart
              </Button>
            </div>
          </>
        ) : (
          <>
            <Slider
              label="Temperature"
              value={tC}
              min={5}
              max={40}
              step={1}
              format={(v) => `${v.toFixed(0)} °C`}
              onChange={(v) => {
                setTC(v)
                if (!opened) setClock(0)
              }}
            />
            <Slider
              label="CO₂ pressure when sealed"
              value={co2Bar}
              min={1}
              max={5}
              step={0.1}
              format={(v) => `${v.toFixed(1)} bar`}
              onChange={(v) => {
                setCo2Bar(v)
                if (!opened) setClock(0)
              }}
            />
            <div className={styles.buttons}>
              <Button onClick={openCap} disabled={opened}>
                Open the cap
              </Button>
              <Button variant="secondary" onClick={resetBottle}>
                Reseal the bottle
              </Button>
            </div>
          </>
        )}
      </div>

      <div className={styles.stage}>
        {mode === 'sealed' ? (
          <svg viewBox="0 0 580 580" className={styles.svg} role="img" aria-label={summary} data-testid="sealed-stage">
            <g transform="translate(56, 8) scale(1.3)">
              {substance === 'iodine' ? (
                <SealedVessel
                  species={SPECIES.iodine}
                  counts={[gasCount, SOLID_COUNT]}
                  seed={9}
                  solid
                  exchange="dissolution"
                  gauge={{ fraction: p / DIAL_MMHG[substance], label: `${shownP} mmHg` }}
                  title="Iodine in a sealed box"
                />
              ) : (
                <SealedVessel
                  species={SPECIES[substance]}
                  counts={[gasCount, LIQUID_COUNT]}
                  seed={substance === 'water' ? 12 : 4}
                  liquid
                  exchange="evaporation"
                  gauge={{ fraction: p / DIAL_MMHG[substance], label: `${shownP} mmHg` }}
                  title={`${capitalise(SUBSTANCE_NAME[substance])} in a sealed box`}
                />
              )}
              {(substance !== 'iodine' || t > 0) && (
                <g aria-hidden="true" data-testid="crossers">
                  {reducedMotion ? null : (
                    <>
                      <circle cx={fwdDot.x} cy={fwdDot.y} r={4} fill="var(--fwd)" />
                      {showReverseDot && <circle cx={revDot.x} cy={revDot.y} r={4} fill="var(--rev)" />}
                    </>
                  )}
                </g>
              )}
            </g>
            <g transform="translate(56, 384) scale(1.3)">
              <RateBars
                progress={progressForFraction(fraction)}
                config={{ forwardStart: balance.evaporation, reverseStart: 0, equilibrium: balance.evaporation }}
                forwardLabel={substance === 'iodine' ? 'Sublimation' : 'Evaporation'}
                reverseLabel={substance === 'iodine' ? 'Deposition' : 'Condensation'}
                title="Rates of the two opposing processes"
              />
            </g>
          </svg>
        ) : (
          <svg viewBox="0 0 580 580" className={styles.svg} role="img" aria-label={summary} data-testid="soda-stage">
            <g transform="translate(-87, 8) scale(1.4)">
              <SodaBottle open={opened ? Math.min(1, t / 0.6) : 0} fizz={Math.max(0, fizz)} time={t} reducedMotion={reducedMotion} title="Soda bottle with dissolved CO₂" />
            </g>
            <BarMeter x={330} y={150} label="Dissolved CO₂ when sealed" value={c0} max={c0} unit="mol L⁻¹" />
            <BarMeter x={330} y={290} label="Dissolved CO₂ now" value={cNow} max={c0} unit="mol L⁻¹" accent />
            <BarMeter x={330} y={430} label="Headspace CO₂ pressure now" value={pHeadspaceNow} max={co2Bar} unit="bar" />
          </svg>
        )}
      </div>

      <div className={styles.readout} data-testid="sealed-readout">
        {mode === 'sealed' ? (
          <>
            <Row label={<>Equilibrium <span className="sym">p</span>*</>}>
              <span data-testid="p-star">
                {pStar.toFixed(substance === 'iodine' ? 2 : 1)} mmHg of {SUBSTANCE_NAME[substance]} at {tC} °C
              </span>
            </Row>
            <Row label={<><span className="sym">t</span> and <span className="sym">p</span></>}>
              <span data-testid="p-now">
                {t.toFixed(1)} s, {shownP} mmHg ({(fraction * 100).toFixed(0)}% of <span className="sym">p</span>*)
              </span>
            </Row>
            <Row label="Rates (mmHg s⁻¹)">
              <span data-testid="rates">
                {substance === 'iodine' ? 'Sublimation' : 'Evaporation'} {balance.evaporation.toFixed(2)}, {substance === 'iodine' ? 'deposition' : 'condensation'}{' '}
                {balance.condensation.toFixed(2)}, net {signed(balance.net, 2)}
              </span>
            </Row>
            <Row label="Verdict">
              <span data-testid="verdict">
                {atEquilibrium ? 'Equal rates: equilibrium, and the pressure holds at p*' : 'Not yet: the vapour is still building up'}
              </span>
            </Row>
            <p className={styles.note}>
              Evaporation is <span className="sym">k</span><sub>c</sub> × <span className="sym">p</span>* and condensation is{' '}
              <span className="sym">k</span><sub>c</sub> × <span className="sym">p</span>, with <span className="sym">k</span><sub>c</sub> = {KC} s⁻¹ for every substance. The time scale
              is a display choice; the equilibrium pressure is the Antoine value for each substance.
              {substance === 'iodine' && ' Iodine uses an approximate sublimation line, so its values are rough.'}
            </p>
          </>
        ) : (
          <>
            <Row label={<>Henry’s law constant</>}>
              <span data-testid="k-h">
                <span className="sym">k</span><sub>H</sub> = {kH.toFixed(3)} mol L⁻¹ bar⁻¹ at {tC} °C
              </span>
            </Row>
            <Row label={<>Dissolved CO₂</>}>
              <span data-testid="c-now">
                {formatSci(cNow, 2)} mol L⁻¹ {opened ? `(sealed: ${c0.toFixed(3)}; in air at equilibrium: ${formatSci(cEq, 2)})` : `(= ${kH.toFixed(3)} × ${co2Bar.toFixed(1)} bar)`}
              </span>
            </Row>
            <Row label="Headspace">
              <span data-testid="p-co2">
                {opened ? `${formatSci(pHeadspaceNow, 2)} bar now; air holds ${formatSci(AIR_CO2_BAR, 1)} bar` : `${co2Bar.toFixed(1)} bar of CO₂ above the liquid`}
              </span>
            </Row>
            <p className={styles.note}>
              Henry’s law: <span className="sym">c</span> = <span className="sym">k</span><sub>H</sub> × <span className="sym">p</span>. The sealed bottle is supersaturated for the air, so CO₂ escapes until
              the dissolved amount matches the air pressure. Cold soda holds more gas: <span className="sym">k</span><sub>H</sub> rises as the temperature falls. The time scale ({TAU_SODA} s) is illustrative.
            </p>
          </>
        )}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

/** A bar with a label and value above it, scaled to `max`. The bar is 230 units wide, starting at x. */
function BarMeter({ x, y, label, value, max, unit, accent = false }: { x: number; y: number; label: string; value: number; max: number; unit: string; accent?: boolean }) {
  const width = max > 0 ? Math.max(0, Math.min(1, value / max)) * 230 : 0
  const text = value >= 0.01 ? value.toFixed(3) : formatSci(value, 2)
  return (
    <g>
      <text x={x} y={y} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central">
        {label}
      </text>
      <text x={x} y={y + 30} fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={accent ? 'var(--accent)' : 'var(--fg)'} dominantBaseline="central" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {text} {unit}
      </text>
      <rect x={x} y={y + 50} width={230} height={16} rx={8} fill="var(--surface-raised)" />
      <rect x={x} y={y + 50} width={Math.max(width, 2)} height={16} rx={8} fill={accent ? 'var(--accent)' : 'var(--fg-subtle)'} />
    </g>
  )
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  )
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
