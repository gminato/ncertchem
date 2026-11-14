'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { Electron, Label, Photon, VocabDefs } from '@/components/vocab'
import { formatScientific } from '@/lib/chem/mole-bridge'
import { wavelengthToCss } from '@/lib/chem/wavelength-color'
import {
  METALS,
  STAGE_GEOMETRY,
  WAVELENGTH_MAX_NM,
  WAVELENGTH_MIN_NM,
  beamReadout,
  createEmitterState,
  keLineEv,
  photonsPerSecond,
  seededRandom,
  stepEmitter,
  staticEmitterState,
  thresholdMessage,
  visualElectronSpeed,
  type BeamReadout,
  type EmitterState,
} from './photoelectric-model'
import styles from './photoelectric.module.css'

const STAGE_W = 640
const STAGE_H = 290
const TUBE = { left: 150, top: 88, width: 410, height: 156 }
const LAMP = { x: 34, y: 124, width: 70, height: 96 }
const BEAM_Y = STAGE_GEOMETRY.beamY
const PHOTON_TAIL = 34

/** KE-versus-ν plot: frequency from 0 to 3 × 10¹⁵ Hz, KE from 0 to 12 eV. */
const PLOT = { w: 360, h: 240, left: 56, right: 340, top: 18, bottom: 190 }
const NU_MAX = 3.0e15
const KE_MAX = 12
const plotX = (nu: number) => PLOT.left + (nu / NU_MAX) * (PLOT.right - PLOT.left)
const plotY = (ke: number) => PLOT.bottom - (ke / KE_MAX) * (PLOT.bottom - PLOT.top)

const DEFAULT_METAL = 'K'
const DEFAULT_NM = 400
const DEFAULT_INTENSITY = 60

const METAL_OPTIONS = METALS.map((m) => ({ value: m, label: m }))

interface Live {
  readout: BeamReadout
  intensity: number
}

/** Plain-language summary for the screen-reader live region. */
function summaryText(r: BeamReadout, intensity: number): string {
  const name = `${r.metal}, W₀ = ${r.workFunctionEv.toFixed(2)} eV`
  if (!r.emitted) {
    return `${name}. At ${r.wavelengthNm} nm the photon energy is ${r.photonEv.toFixed(2)} eV, below W₀. Below threshold: 0 electrons, at any intensity (intensity ${intensity} %).`
  }
  return `${name}. At ${r.wavelengthNm} nm the photon energy is ${r.photonEv.toFixed(2)} eV. Electrons leave with up to ${r.keEv.toFixed(2)} eV, and their number rises with intensity (${intensity} %).`
}

/** The electrons' KE-versus-ν line, the current point and the threshold, for one metal. */
function KePlot({ readout }: { readout: BeamReadout }) {
  const w0 = readout.workFunctionEv
  const nu0 = readout.thresholdHz
  const nu = readout.frequencyHz
  const ke = keLineEv(nu, w0)
  const lineEnd = NU_MAX
  const keEnd = keLineEv(lineEnd, w0)
  const x0 = plotX(nu0)
  const pointX = plotX(nu)
  const pointY = plotY(ke)

  return (
    <svg
      viewBox={`0 0 ${PLOT.w} ${PLOT.h}`}
      className={styles.plot}
      role="img"
      aria-label={`Kinetic energy against frequency for ${readout.metal}: a straight line of slope h starting at ν₀ = ${formatScientific(nu0, 3)} Hz. The current point is at ν = ${formatScientific(nu, 3)} Hz, KE = ${ke.toFixed(2)} eV.`}
      data-testid="photo-plot"
    >
      <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} className={styles.axis} />
      <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} className={styles.axis} />
      {[0, 1, 2, 3].map((k) => (
        <g key={`xt-${k}`}>
          <line x1={plotX(k * 1e15)} x2={plotX(k * 1e15)} y1={PLOT.bottom} y2={PLOT.bottom + 4} className={styles.axis} />
          <Label x={plotX(k * 1e15)} y={PLOT.bottom + 16} fontSize={13} fill="var(--fg-subtle)">
            {k}
          </Label>
        </g>
      ))}
      {[0, 4, 8, 12].map((e) => (
        <g key={`yt-${e}`}>
          <line x1={PLOT.left - 4} x2={PLOT.left} y1={plotY(e)} y2={plotY(e)} className={styles.axis} />
          <Label x={PLOT.left - 8} y={plotY(e)} textAnchor="end" fontSize={13} fill="var(--fg-subtle)">
            {e}
          </Label>
        </g>
      ))}
      <Label x={(PLOT.left + PLOT.right) / 2} y={PLOT.bottom + 36} fontSize={14}>
        <tspan className="sym">ν</tspan> / 10¹⁵ Hz
      </Label>
      <Label
        x={14}
        y={(PLOT.top + PLOT.bottom) / 2}
        fontSize={14}
        transform={`rotate(-90 14 ${(PLOT.top + PLOT.bottom) / 2})`}
      >
        KE / eV
      </Label>

      <line x1={x0} x2={x0} y1={PLOT.top} y2={PLOT.bottom} className={styles.guide} />
      <Label x={x0 + 6} y={PLOT.top + 10} textAnchor="start" fontSize={13} fill="var(--fg-muted)">
        <tspan className="sym">ν</tspan>₀
      </Label>

      <path
        d={`M${x0.toFixed(2)},${plotY(0).toFixed(2)} L${plotX(lineEnd).toFixed(2)},${plotY(keEnd).toFixed(2)}`}
        className={styles.line}
      />
      <circle cx={pointX} cy={pointY} r={6} style={{ fill: 'var(--orbit-active)', stroke: 'var(--surface)' }} strokeWidth={2} />
      <Label
        x={Math.min(pointX, PLOT.right - 70)}
        y={pointY - 14}
        textAnchor="middle"
        fontSize={13}
        fill="var(--fg)"
        halo
      >
        {readout.emitted ? `${ke.toFixed(2)} eV` : 'no emission'}
      </Label>
      <Label x={PLOT.right - 6} y={PLOT.bottom - 22} textAnchor="end" fontSize={13} fill="var(--fg-muted)">
        slope <tspan className="sym">h</tspan>/<tspan className="sym">e</tspan>
      </Label>
    </svg>
  )
}

/**
 * The flagship Photoelectric simulation: a light source, an evacuated tube and a
 * metal plate. Photons (wave packets) travel to the plate. Below the threshold no
 * electron is ejected at any intensity. Above it, electrons leave with KE = hν − W₀
 * (speed ∝ √KE), and their number grows with intensity. The readout and the KE
 * plot are computed from NCERT Table 2.2 in src/lib/chem/photoelectric.ts.
 */
export function Photoelectric({ reducedMotion }: SimulationProps) {
  const [metal, setMetal] = useState(DEFAULT_METAL)
  const [nm, setNm] = useState(DEFAULT_NM)
  const [intensity, setIntensity] = useState(DEFAULT_INTENSITY)

  const readout = useMemo(() => beamReadout(metal, nm), [metal, nm])
  const beamColor = wavelengthToCss(nm)
  const stageRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(stageRef)

  // The emitter is a mutable object (like BohrEmission's state), updated by the loop.
  const [emitter] = useState<EmitterState>(() => createEmitterState())
  const [, setFrame] = useState(0)
  const live = useRef<Live>({ readout, intensity })

  useEffect(() => {
    live.current = { readout, intensity }
  }, [readout, intensity])

  // Animation loop: only while on screen, and never under reduced motion.
  useEffect(() => {
    if (reducedMotion || !active) return
    const random = seededRandom(20260)
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const { readout: r, intensity: i } = live.current
      stepEmitter(
        emitter,
        dt,
        {
          rate: photonsPerSecond(i),
          emitted: r.emitted,
          electronSpeed: visualElectronSpeed(r.keEv),
        },
        random
      )
      if (!r.emitted) emitter.electrons.length = 0
      setFrame((f) => (f + 1) % 1e9)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reducedMotion, emitter])

  const staticState = useMemo(
    () => staticEmitterState(intensity, readout.emitted),
    [intensity, readout.emitted]
  )
  const shown = reducedMotion ? staticState : emitter

  const bannerClass = readout.emitted
    ? `${styles.banner} ${styles.bannerAbove}`
    : `${styles.banner} ${styles.bannerBelow}`

  return (
    <div className={styles.wrap} ref={stageRef}>
      <div className={styles.stage}>
        <svg
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          className={styles.svg}
          role="img"
          aria-label={`Light of ${nm} nm, at ${intensity} % intensity, falls on a ${readout.metal} plate in an evacuated tube. ${readout.emitted ? 'Electrons are ejected.' : 'No electrons are ejected.'}`}
          data-testid="photo-stage"
          data-emitted={readout.emitted ? 'true' : 'false'}
        >
          <VocabDefs idPrefix="pe" />

          <rect x={TUBE.left} y={TUBE.top} width={TUBE.width} height={TUBE.height} rx={22} className={styles.tube} />
          <Label x={TUBE.left + TUBE.width / 2} y={TUBE.top - 16} fontSize={15} fill="var(--fg-muted)">
            Evacuated tube
          </Label>

          <circle cx={LAMP.x + LAMP.width / 2} cy={LAMP.y + LAMP.height / 2} r={44} fill={beamColor} opacity={0.22} />
          <rect x={LAMP.x} y={LAMP.y} width={LAMP.width} height={LAMP.height} rx={10} className={styles.lamp} />
          <Label x={LAMP.x + LAMP.width / 2} y={LAMP.y + LAMP.height + 26} fontSize={15} fill="var(--fg-muted)">
            Light source
          </Label>

          {shown.photons.map((photon, i) => {
            const head = photon.x
            const tail = Math.max(STAGE_GEOMETRY.lampX, head - PHOTON_TAIL)
            if (head - tail < 6) return null
            return (
              <Photon
                key={`ph-${i}`}
                wavelengthNm={nm}
                x1={tail}
                y1={BEAM_Y}
                x2={head}
                y2={BEAM_Y}
                amplitude={9}
              />
            )
          })}

          <rect
            x={STAGE_GEOMETRY.plateX}
            y={STAGE_GEOMETRY.plateTop}
            width={16}
            height={STAGE_GEOMETRY.plateBottom - STAGE_GEOMETRY.plateTop}
            rx={3}
            className={styles.plate}
          />
          <rect
            x={STAGE_GEOMETRY.plateX - 6}
            y={STAGE_GEOMETRY.plateTop}
            width={28}
            height={STAGE_GEOMETRY.plateBottom - STAGE_GEOMETRY.plateTop}
            rx={6}
            className={styles.plateFlash}
            opacity={shown.flash * 0.45}
          />
          <Label x={STAGE_GEOMETRY.plateX + 8} y={STAGE_GEOMETRY.plateTop - 16} fontSize={15} fill="var(--fg)">
            {readout.metal}
          </Label>
          <Label x={STAGE_GEOMETRY.plateX + 8} y={STAGE_GEOMETRY.plateBottom + 26} fontSize={15} fill="var(--fg-muted)">
            Metal plate
          </Label>

          {(readout.emitted ? shown.electrons : []).map((e, i) => (
            <Electron key={`e-${i}`} x={e.x} y={e.y} size={9} defsPrefix="pe" />
          ))}
        </svg>
      </div>

      <p className={bannerClass} data-testid="photo-banner">
        {thresholdMessage(readout)}
      </p>

      <p className={styles.srOnly} aria-live="polite" data-testid="photo-summary">
        {summaryText(readout, intensity)}
      </p>

      <div className={styles.lower}>
        <dl className={styles.readout} data-testid="photo-readout">
          <dt>
            <span className="sym">ν</span> (frequency)
          </dt>
          <dd>{formatScientific(readout.frequencyHz, 3)} Hz</dd>
          <dt>
            photon energy <span className="sym">hν</span>
          </dt>
          <dd>{readout.photonEv.toFixed(2)} eV</dd>
          <dt>
            work function <span className="sym">W</span>₀ ({readout.metal})
          </dt>
          <dd>{readout.workFunctionEv.toFixed(2)} eV</dd>
          <dt>KE of electron (max)</dt>
          <dd>{readout.emitted ? `${readout.keEv.toFixed(2)} eV` : '0 eV (none ejected)'}</dd>
          <dt>
            <span className="sym">v</span>max (speed)
          </dt>
          <dd>{readout.emitted ? `${formatScientific(readout.maxSpeedMs, 2)} m s⁻¹` : '—'}</dd>
          <dt>
            threshold <span className="sym">ν</span>₀
          </dt>
          <dd>
            {formatScientific(readout.thresholdHz, 3)} Hz, {readout.thresholdNm.toFixed(0)} nm
          </dd>
        </dl>

        <div>
          <KePlot readout={readout} />
        </div>
      </div>

      <SimulationControls>
        <Segmented
          label="Metal"
          options={METAL_OPTIONS}
          value={metal}
          onChange={(value) => setMetal(value)}
        />
        <Slider
          label="Wavelength λ"
          value={nm}
          min={WAVELENGTH_MIN_NM}
          max={WAVELENGTH_MAX_NM}
          step={1}
          unit="nm"
          onChange={setNm}
        />
        <Slider
          label="Intensity"
          value={intensity}
          min={0}
          max={100}
          step={1}
          format={(v) => `${v} %`}
          onChange={setIntensity}
        />
      </SimulationControls>
    </div>
  )
}
