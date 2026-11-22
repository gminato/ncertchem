'use client'

import { useEffect, useRef, useState } from 'react'
import katex from 'katex'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { CollisionFlash, Particle, PlotCurve, PlotFrame, PlotLine, PlotPoint, PlotShade, ReactionBox } from '@/components/vocab'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  BIN_WIDTH,
  createCollisionBox,
  resetCounters,
  setBoxTemperature,
  stepCollisionBox,
  type CollisionBox,
} from '@/lib/chem/collision-box'
import { GAS_CONSTANT_J, fractionAboveEa, formatSci } from '@/lib/chem/kinetics'
import styles from './collision-lab.module.css'

/** The box and the plot, in their own SVG units. The box fills the stage; labels sit outside it. */
const BOX = { x: 10, y: 10, width: 580, height: 300, radius: 14 }
const PARTICLE_R = 7
const N_EACH = 50
const SEED = 20261122
const SUBSTEP_S = 1 / 240
const ADVANCE_S = 60
const SPEEDS = ['1', '5', '20'] as const
const DEFAULTS = { tempK: 300, eaKJ: 10, P: 0.25 }
const X_MAX = 8
const PLOT = { x: 80, y: 12, width: 500, height: 180 }

const SPEED_OPTIONS = SPEEDS.map((s) => ({ value: s, label: `${s}×` }))

function tex(source: string): string {
  return katex.renderToString(source, { throwOnError: false, displayMode: true })
}

const EQUATIONS = {
  rate: tex('\\text{Rate} = P\\,Z_{\\text{AB}}\\,e^{-E_\\text{a}/RT}'),
  fraction: tex('\\frac{\\text{effective collisions}}{\\text{A–B collisions}} \\approx P\\,e^{-E_\\text{a}/RT}'),
}

/** Two points on the arc of the reactive side, drawn at radius R around the particle. Full circle when P = 1. */
function reactiveArc(cx: number, cy: number, R: number, axis: number, P: number): string {
  const a0 = axis - Math.PI * P
  const a1 = axis + Math.PI * P
  const large = P > 0.5 ? 1 : 0
  const x0 = cx + R * Math.cos(a0)
  const y0 = cy + R * Math.sin(a0)
  const x1 = cx + R * Math.cos(a1)
  const y1 = cy + R * Math.sin(a1)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

/** A number with a thin space before the thousands, as the Section writes counts. */
function count(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

function fractionText(n: number, d: number): string {
  if (d <= 0) return '—'
  return n === 0 ? '0' : formatSci(n / d, 3)
}

export function CollisionLab({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  // The box is mutated in place by the frame loop; it lives in state so the render reads it legally.
  const [box] = useState<CollisionBox>(() =>
    createCollisionBox({
      seed: SEED,
      nA: N_EACH,
      nB: N_EACH,
      width: BOX.width,
      height: BOX.height,
      radius: PARTICLE_R,
      tempK: DEFAULTS.tempK,
    })
  )
  const [tempK, setTempK] = useState<number>(DEFAULTS.tempK)
  const [eaKJ, setEaKJ] = useState<number>(DEFAULTS.eaKJ)
  const [P, setP] = useState<number>(DEFAULTS.P)
  const [speed, setSpeed] = useState<string>('5')
  const [running, setRunning] = useState<boolean>(true)
  const [, setFrame] = useState(0)

  const EaJ = eaKJ * 1000
  const aRT = EaJ / (GAS_CONSTANT_J * tempK)
  const predictedEnergetic = fractionAboveEa(EaJ, tempK)
  const predictedEffective = P * predictedEnergetic

  // The animation reads the latest settings through refs, so the frame loop need not restart on each slider move.
  const paramsRef = useRef({ aRT, P, speed: Number(speed) })
  useEffect(() => {
    paramsRef.current = { aRT, P, speed: Number(speed) }
  }, [aRT, P, speed])

  const moving = running && !reducedMotion && active
  useEffect(() => {
    if (!moving) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { aRT: a, P: p, speed: s } = paramsRef.current
      const steps = Math.round(dt * s / SUBSTEP_S)
      for (let i = 0; i < steps; i++) stepCollisionBox(box, SUBSTEP_S, a, p)
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [moving, box])

  const onTemp = (v: number) => {
    setBoxTemperature(box, v)
    setTempK(v)
  }
  const advance = () => {
    const { aRT: a, P: p } = paramsRef.current
    const steps = Math.round(ADVANCE_S / SUBSTEP_S)
    for (let i = 0; i < steps; i++) stepCollisionBox(box, SUBSTEP_S, a, p)
    setFrame((f) => f + 1)
  }
  const reset = () => {
    resetCounters(box)
    setFrame((f) => f + 1)
  }

  const bins = box.abBins
  const binDensity = (i: number) => (box.ab > 0 ? bins[i] / (box.ab * BIN_WIDTH) : 0)
  const aOnPlot = aRT <= X_MAX
  const expCurve = (x: number) => Math.exp(-x)
  const aText = aRT.toFixed(2)
  const liveAb = box.ab >= 500 ? `more than ${count(Math.floor(box.ab / 500) * 500)}` : count(box.ab)
  const live =
    `At ${tempK} K with Eₐ = ${eaKJ} kJ mol⁻¹ and P = ${P.toFixed(3)}, the predicted effective fraction is ${formatSci(predictedEffective, 3)}. ` +
    `So far, ${liveAb} A–B collisions: ${count(box.energetic)} energetic and ${count(box.effective)} effective.`
  // Screen readers hear the summary only when the box is paused (or moves are off), not on every collision.
  const [announced, setAnnounced] = useState(live)
  if (!moving && announced !== live) setAnnounced(live)

  const scatterPct = box.effective > 0 ? Math.round(100 / Math.sqrt(box.effective)) : null
  const caveat =
    scatterPct === null
      ? `From ${count(box.ab)} A–B collisions. Small counts are noisy, and no effective collision has happened yet.`
      : `From ${count(box.ab)} A–B collisions. Small counts are noisy: the effective count alone is uncertain by about ±${scatterPct} % (one standard deviation).`

  const particles = box.particles
  const flashes = box.flashes.filter((f) => box.time - f.t < 0.3)

  return (
    <div className={styles.sim} ref={rootRef}>
      <div className={styles.controls}>
        <Slider label="Temperature T" value={tempK} min={250} max={400} step={1} unit="K" format={(v) => v.toFixed(0)} onChange={onTemp} />
        <Slider
          label="Activation energy Eₐ"
          value={eaKJ}
          min={0}
          max={60}
          step={1}
          unit="kJ mol⁻¹"
          format={(v) => v.toFixed(0)}
          onChange={setEaKJ}
        />
        <Slider label="Steric factor P" value={P} min={0.001} max={1} step={0.001} format={(v) => v.toFixed(3)} onChange={setP} />
        <div className={styles.row}>
          <Segmented label="Speed" options={SPEED_OPTIONS} value={speed} onChange={setSpeed} />
          <Toggle label="Run the box" checked={running && !reducedMotion} disabled={reducedMotion} onChange={setRunning} />
          <Button variant="secondary" onClick={reset}>
            Reset counts
          </Button>
          <Button onClick={advance}>Advance 60 s</Button>
        </div>
      </div>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox="0 0 600 346" role="img" aria-label="A sealed box of A and B hard spheres. Each A particle has an arc on its reactive side. Flashes mark collisions, amber when effective.">
          <ReactionBox x={BOX.x} y={BOX.y} width={BOX.width} height={BOX.height} radius={BOX.radius}>
            {particles.map((p, i) => (
              <g key={i}>
                {p.species === 'A' && P < 1 && (
                  <path d={reactiveArc(p.x, p.y, PARTICLE_R + 4, p.axis, P)} fill="none" stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
                )}
                {p.species === 'A' && P >= 1 && <circle cx={p.x} cy={p.y} r={PARTICLE_R + 4} fill="none" stroke="var(--fg)" strokeWidth={2.4} />}
                <Particle x={p.x} y={p.y} r={PARTICLE_R} tone={p.species === 'A' ? 'reactant' : 'product'} />
              </g>
            ))}
            {flashes.map((f, i) => (
              <CollisionFlash key={i} x={f.x} y={f.y} size={f.effective ? 16 : 11} effective={f.effective} />
            ))}
          </ReactionBox>
          <Particle x={30} y={331} r={7} tone="reactant" />
          <text x={44} y={337} fontSize={15} fill="var(--fg)">A</text>
          <Particle x={78} y={331} r={7} tone="product" />
          <text x={92} y={337} fontSize={15} fill="var(--fg)">B</text>
          <text x={122} y={337} fontSize={15} fill="var(--fg-muted)">Amber burst: effective collision. Grey: other contact.</text>
        </svg>
      </div>

      <div className={styles.stage}>
        <svg className={styles.plot} viewBox="0 0 600 258" role="img" aria-label={`Collision energy density in units of RT, with the threshold at ${aText} RT`}>
          <PlotFrame
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.width}
            height={PLOT.height}
            domain={{ xMin: 0, xMax: X_MAX, yMin: 0, yMax: 1.05 }}
            xTicks={[0, 1, 2, 3, 4, 5, 6, 7, 8]}
            yTicks={[0, 0.25, 0.5, 0.75, 1]}
            yTickFormat={(v) => v.toFixed(2)}
            xTitle="E / RT, energy along the line of centres"
            yTitle="fraction per unit E/RT"
          >
            <PlotCurve fn={expCurve} from={0} to={X_MAX} tone="neutral" />
            <PlotCurve fn={(x) => P * Math.exp(-x)} from={0} to={X_MAX} tone="catalyst" dashed />
            {aOnPlot && <PlotShade fn={expCurve} from={aRT} to={X_MAX} tone="accent" opacity={0.35} />}
            {aOnPlot && <PlotLine from={{ x: aRT, y: 0 }} to={{ x: aRT, y: 1.05 }} tone="accent" dashed />}
            {bins.map((c, i) =>
              c > 0 ? <PlotPoint key={i} at={{ x: (i + 0.5) * BIN_WIDTH, y: binDensity(i) }} tone="reactant" /> : null
            )}
          </PlotFrame>
        </svg>
      </div>

      <dl className={styles.counts}>
        <div>
          <dt>All collisions</dt>
          <dd>{count(box.total)}</dd>
        </div>
        <div>
          <dt>A–B collisions</dt>
          <dd>{count(box.ab)}</dd>
        </div>
        <div>
          <dt>Energetic (E ≥ Eₐ)</dt>
          <dd>{count(box.energetic)}</dd>
        </div>
        <div>
          <dt>Effective (also oriented)</dt>
          <dd>{count(box.effective)}</dd>
        </div>
      </dl>

      <div className={styles.compare}>
        <p>
          Energetic fraction: measured <strong>{fractionText(box.energetic, box.ab)}</strong>, predicted e<sup>−Eₐ/RT</sup> ={' '}
          <strong>{formatSci(predictedEnergetic, 3)}</strong>.
        </p>
        <p>
          Effective fraction: measured <strong>{fractionText(box.effective, box.ab)}</strong>, predicted P·e<sup>−Eₐ/RT</sup> ={' '}
          <strong>{formatSci(predictedEffective, 3)}</strong>.
        </p>
        <p className={styles.note}>{caveat}</p>
        <p className={styles.note}>
          The toy draws orientation at random with chance P and does not model the molecular shape, so it only approximates the model.
          At 50 kJ mol⁻¹ and 300 K almost no collision is energetic, so the counts stay at zero; that is the point, not a fault.
        </p>
      </div>

      <div className={styles.eqs}>
        <div dangerouslySetInnerHTML={{ __html: EQUATIONS.rate }} />
        <div dangerouslySetInnerHTML={{ __html: EQUATIONS.fraction }} />
      </div>
      <p className={styles.live} aria-live="polite">
        {announced}
      </p>
    </div>
  )
}
