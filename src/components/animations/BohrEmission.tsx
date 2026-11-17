'use client'

import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import {
  Electron,
  EnergyLevel,
  Label,
  Nucleus,
  Photon,
  SpectrumStrip,
  VocabDefs,
  ladderLabels,
  ladderY,
  orbitLabelPosition,
  spectrumX,
} from '@/components/vocab'
import {
  AMBIENT_SPIN_RATE,
  EMISSION_ANGLE,
  LEVEL_MAX,
  LEVEL_MIN,
  clampStep,
  emissionDeltaEvLabel,
  emissionWavelengthNm,
  emissionSeriesName,
  interpolateByLevel,
  orbitEnergyEv,
  orbitRadius,
  snapshotForStep,
  stepDescription,
  type BohrSnapshot,
} from './bohr-steps'
import styles from './BohrEmission.module.css'

export interface BohrEmissionProps {
  step: number
  reducedMotion: boolean
  /**
   * Whether a screen reader is told about each Step change. Defaults to true. Pass false where the
   * Steps advance on their own, so the announcements do not interrupt the reader.
   */
  announce?: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 800 x 600)
// ---------------------------------------------------------------------------

// Viewbox is sized for a ~590px-wide card: every label is set at 16 units,
// which renders at about 14px on a 1280px viewport.
const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540

/** Atom on the left, centred on (ATOM.cx, ATOM.cy); the n = 3 orbit is ~45% of the width. */
const ATOM = { cx: 170, cy: 230, rMax: 130 }
/** Scales physical orbit radii so that the n = 3 orbit has radius ATOM.rMax. */
const ATOM_SCALE = ATOM.rMax / orbitRadius(LEVEL_MAX)
const orbitR = (n: number) => orbitRadius(n) * ATOM_SCALE
/**
 * Orbit labels sit above each orbit, centred, in the gap just outside it. The
 * offset clears the electron's own radius and the label's half-height, so a
 * label never meets the stroke or the moving electron.
 */
const ORBIT_LABEL_ANGLE = -90
const ORBIT_LABEL_OFFSET = 18
const ORBIT_LABEL_FONT = 16

/** Energy ladder on the right, close to the atom and taller than before. */
const LADDER = {
  rungLeft: 350,
  rungRight: 420,
  top: 60,
  bottom: 330,
  labelX: 430,
  arrowX: 332,
  minLabelGap: 22,
}
const LADDER_FONT = 16
const LADDER_EV_MIN = orbitEnergyEv(LEVEL_MIN)
const LADDER_EV_MAX = orbitEnergyEv(LEVEL_MAX)
const ladderBounds = {
  top: LADDER.top,
  bottom: LADDER.bottom,
  eMin: LADDER_EV_MIN,
  eMax: LADDER_EV_MAX,
}
const ladderRungY = (n: number) => ladderY(orbitEnergyEv(n), ladderBounds)
const ladderRungs = [LEVEL_MIN, 2, LEVEL_MAX].map((n) => ({ n, rungY: ladderRungY(n) }))
const ladderRungLabels = ladderLabels(
  ladderRungs.map((rung) => ({ y: rung.rungY })),
  LADDER.minLabelGap
)

/** Visible spectrum strip across the bottom, drawn by the shared SpectrumStrip. */
const STRIP = { left: 40, right: 600, y: 420, height: 14 }
const STRIP_WIDTH = STRIP.right - STRIP.left
const xForNm = (nm: number) => STRIP.left + spectrumX(nm, STRIP_WIDTH)
const TICK_FONT = 16

const LINE_NM = emissionWavelengthNm()
const LINE_X = xForNm(LINE_NM)
const DELTA_E_LABEL = emissionDeltaEvLabel()

/** Photon path: from the emission point on the n = 2 orbit to the strip. */
const EMISSION_ORIGIN = {
  x: ATOM.cx + orbitR(2) * Math.cos(EMISSION_ANGLE),
  y: ATOM.cy + orbitR(2) * Math.sin(EMISSION_ANGLE),
}
const PHOTON_DEST = { x: LINE_X, y: STRIP.y }
const PHOTON_DIST = Math.hypot(PHOTON_DEST.x - EMISSION_ORIGIN.x, PHOTON_DEST.y - EMISSION_ORIGIN.y)
const PHOTON_UNIT = {
  x: (PHOTON_DEST.x - EMISSION_ORIGIN.x) / PHOTON_DIST,
  y: (PHOTON_DEST.y - EMISSION_ORIGIN.y) / PHOTON_DIST,
}
/** Visual length of the wave packet while it travels. */
const PACKET_LENGTH = 110
const MIN_PACKET_LENGTH = 10

// ---------------------------------------------------------------------------
// Motion helpers
// ---------------------------------------------------------------------------

const TWO_PI = Math.PI * 2

/** Signed shortest rotation from `from` to `to`, in (-π, π]. */
function shortestDelta(from: number, to: number): number {
  const d = (((to - from) % TWO_PI) + TWO_PI) % TWO_PI
  return d > Math.PI ? d - TWO_PI : d
}

/** Forward rotation from `from` to `to` of at least one full turn, for the spiral. */
function spiralTarget(from: number, to: number): number {
  const forward = (((to - from) % TWO_PI) + TWO_PI) % TWO_PI
  return from + forward + TWO_PI
}

/**
 * Builds the tween from the live state to the target for `step`. It starts
 * from whatever the state is now, so jumping between Steps always animates
 * from the current picture.
 */
function buildStepTimeline(
  step: number,
  state: BohrSnapshot,
  prevStep: number | null,
  onFrame: () => void
): gsap.core.Timeline {
  const target = snapshotForStep(step)
  const tl = gsap.timeline({ onUpdate: onFrame })

  switch (clampStep(step)) {
    case 0:
      tl.to(state, {
        level: target.level,
        photon: 0,
        photonAlpha: 0,
        line: 0,
        upArrow: 0,
        downArrow: 0,
        pulse: 1,
        duration: 0.7,
        ease: 'power2.inOut',
      })
      break

    case 1:
      tl.set(state, { pulse: 0, photon: 0, photonAlpha: 0, line: 0, downArrow: 0 })
      tl.to(state, { upArrow: 1, duration: 0.5, ease: 'power2.out' }, 0)
      tl.to(
        state,
        {
          level: target.level,
          angle: spiralTarget(state.angle, target.angle),
          duration: 0.9,
          ease: 'power2.out',
        },
        0
      )
      tl.to(state, { pulse: 1, duration: 0.9, ease: 'power1.out' }, 0)
      break

    case 2: {
      tl.to(state, { line: 0, duration: 0.4, ease: 'power1.out' }, 0)
      tl.to(
        state,
        {
          angle: state.angle + shortestDelta(state.angle, target.angle),
          duration: 0.6,
          ease: 'power2.inOut',
        },
        0
      )
      tl.to(state, { level: target.level, duration: 0.6, ease: 'power2.in' }, 0)
      tl.to(state, { upArrow: 0, downArrow: 1, duration: 0.5, ease: 'power2.out' }, 0.55)
      tl.to(state, { photonAlpha: 1, duration: 0.2, ease: 'power1.out' }, 0.6)
      if (prevStep === 3) {
        // Rewinding from the line: the photon is already at the strip.
        tl.set(state, { photon: target.photon }, 0.6)
      } else {
        tl.set(state, { photon: 0 }, 0)
        tl.to(state, { photon: target.photon, duration: 1.2, ease: 'sine.inOut' }, 0.6)
      }
      break
    }

    default: {
      tl.to(state, { angle: state.angle + shortestDelta(state.angle, target.angle), duration: 0.3 }, 0)
      tl.to(state, { level: target.level, duration: 0.3, ease: 'power2.out' }, 0)
      tl.to(state, { downArrow: 1, upArrow: 0, duration: 0.3 }, 0)
      tl.to(state, { photon: 1, duration: 0.35, ease: 'power1.in' }, 0)
      tl.to(state, { photonAlpha: 0, duration: 0.3, ease: 'power1.out' }, 0.3)
      tl.to(state, { line: 1, duration: 0.6, ease: 'power2.out' }, 0.3)
      break
    }
  }

  return tl
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * BohrEmission: a hydrogen atom on the left, an energy ladder on the right,
 * and a visible-spectrum strip along the bottom. The Steps move an electron
 * from n = 1 to n = 3, drop it to n = 2, and show the resulting 656 nm line.
 */
export function BohrEmission({ step, reducedMotion, announce = true }: BohrEmissionProps) {
  const activeStep = clampStep(step)

  // The live state is a mutable object that GSAP tweens; `view` is a React
  // copy of it for rendering.
  const [state] = useState<BohrSnapshot>(() => ({ ...snapshotForStep(activeStep) }))
  const [view, setView] = useState<BohrSnapshot>(() => ({ ...state }))
  const ambient = useRef(false)
  const prevStep = useRef<number | null>(null)

  const render = () => setView({ ...state })

  // Ambient orbiting: on Step 0 only, and never under reduced motion.
  useEffect(() => {
    const tick = (_time: number, deltaMs: number) => {
      if (!ambient.current) return
      state.angle = (state.angle + (deltaMs / 1000) * AMBIENT_SPIN_RATE) % TWO_PI
      render()
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
    }
    // `state` is stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Each Step change kills the previous tween and tweens from the live state to
  // the new target. This is a plain effect (not useGSAP) so that the cleanup
  // really kills the timeline; useGSAP does not use a returned cleanup.
  useEffect(() => {
    ambient.current = activeStep === 0 && !reducedMotion

    if (reducedMotion) {
      // Cut straight to the Step's end state. The redraw is deferred to the
      // next GSAP tick so that no state update happens synchronously here.
      Object.assign(state, snapshotForStep(activeStep))
      prevStep.current = activeStep
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }

    const tl = buildStepTimeline(activeStep, state, prevStep.current, render)
    prevStep.current = activeStep
    return () => {
      tl.kill()
    }
    // `render` and `state` are stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  // Derived geometry from the live state.
  const electronR = interpolateByLevel(view.level, orbitR)
  const electronX = ATOM.cx + electronR * Math.cos(view.angle)
  const electronY = ATOM.cy + electronR * Math.sin(view.angle)

  const dotEv = interpolateByLevel(view.level, orbitEnergyEv)
  const dotY = ladderY(dotEv, ladderBounds)
  const ladderMidX = (LADDER.rungLeft + LADDER.rungRight) / 2

  const photonLength = Math.max(0, view.photon * PHOTON_DIST)
  const packetLength = Math.min(PACKET_LENGTH, photonLength)
  const headX = EMISSION_ORIGIN.x + PHOTON_UNIT.x * photonLength
  const headY = EMISSION_ORIGIN.y + PHOTON_UNIT.y * photonLength
  const tailX = headX - PHOTON_UNIT.x * packetLength
  const tailY = headY - PHOTON_UNIT.y * packetLength
  const showPhoton = view.photonAlpha > 0.001 && packetLength >= MIN_PACKET_LENGTH

  const activeLevel = Math.round(view.level)
  const pulseRadius = view.pulse * (ATOM.rMax + 30)
  const pulseAlpha = Math.sin(Math.PI * Math.min(1, Math.max(0, view.pulse))) * 0.8

  const ladderArrowUp = { y1: LADDER.bottom, y2: LADDER.top }
  const ladderArrowDown = { y1: ladderRungY(3), y2: ladderRungY(2) }

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Hydrogen atom with an electron moving between orbits n = 1, 2 and 3, beside an energy ladder and a visible-spectrum strip"
        data-testid="bohr-emission"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="bohr" />

        {/* Energy pulse: a soft ring expanding from the nucleus */}
        {pulseAlpha > 0.001 && (
          <circle
            cx={ATOM.cx}
            cy={ATOM.cy}
            r={pulseRadius}
            fill="none"
            strokeWidth={2.5}
            style={{ stroke: 'var(--orbit-active)', opacity: pulseAlpha }}
            data-testid="energy-pulse"
          />
        )}

        {/* Orbits and their labels */}
        {[LEVEL_MIN, 2, LEVEL_MAX].map((n) => {
          const pos = orbitLabelPosition(ATOM.cx, ATOM.cy, orbitR(n), ORBIT_LABEL_ANGLE, ORBIT_LABEL_OFFSET)
          const isActive = activeLevel === n
          return (
            <g key={`orbit-${n}`}>
              <EnergyLevel
                variant="orbit"
                r={orbitR(n)}
                x={ATOM.cx}
                y={ATOM.cy}
                active={isActive}
              />
              <Label
                x={pos.x}
                y={pos.y}
                textAnchor={pos.textAnchor}
                fontSize={ORBIT_LABEL_FONT}
                halo
                fill={isActive ? 'var(--orbit-active)' : 'var(--fg-muted)'}
              >
                <tspan fontStyle="italic">n</tspan> = {n}
              </Label>
            </g>
          )
        })}

        <Nucleus
          protons={1}
          neutrons={0}
          x={ATOM.cx}
          y={ATOM.cy}
          nucleonRadius={6}
          defsPrefix="bohr"
        />

        <Electron x={electronX} y={electronY} size={11} defsPrefix="bohr" />

        {/* Emitted photon, travelling from the atom toward the strip */}
        {showPhoton && (
          <g opacity={view.photonAlpha}>
            <Photon
              wavelengthNm={LINE_NM}
              x1={tailX}
              y1={tailY}
              x2={headX}
              y2={headY}
              amplitude={9}
            />
          </g>
        )}

        {/* Energy ladder */}
        {ladderRungs.map((rung, i) => {
          const place = ladderRungLabels[i]
          const isActive = activeLevel === rung.n
          const ev = orbitEnergyEv(rung.n)
          return (
            <g key={`rung-${rung.n}`}>
              <EnergyLevel
                variant="ladder"
                width={LADDER.rungRight - LADDER.rungLeft}
                x={ladderMidX}
                y={rung.rungY}
                active={isActive}
              />
              {place.nudged && (
                <line
                  x1={LADDER.rungRight}
                  y1={rung.rungY}
                  x2={LADDER.labelX - 4}
                  y2={place.labelY}
                  strokeWidth={1}
                  style={{ stroke: 'var(--fg-subtle)' }}
                />
              )}
              <Label
                x={LADDER.labelX}
                y={place.labelY}
                textAnchor="start"
                fontSize={LADDER_FONT}
                halo
                fill={isActive ? 'var(--orbit-active)' : 'var(--fg-muted)'}
              >
                <tspan fontStyle="italic">n</tspan> = {rung.n} ({'−'}
                {Math.abs(ev).toPrecision(3)} eV)
              </Label>
            </g>
          )
        })}

        <Electron x={ladderMidX} y={dotY} size={10} defsPrefix="bohr" />

        {/* Excitation arrow (Step 1) */}
        <g opacity={view.upArrow}>
          <TransitionArrow x={LADDER.arrowX} y1={ladderArrowUp.y1} y2={ladderArrowUp.y2} />
        </g>

        {/* Emission arrow and ΔE (Steps 2 and 3) */}
        <g opacity={view.downArrow}>
          <TransitionArrow x={LADDER.arrowX} y1={ladderArrowDown.y1} y2={ladderArrowDown.y2} />
          <Label
            x={LADDER.arrowX - 10}
            y={(ladderArrowDown.y1 + ladderArrowDown.y2) / 2}
            textAnchor="end"
            fontSize={LADDER_FONT}
          >
            ΔE = {DELTA_E_LABEL} eV
          </Label>
        </g>

        {/* Visible-spectrum strip, 380 to 750 nm. The line fades in during Step 3. */}
        <SpectrumStrip
          x={STRIP.left}
          y={STRIP.y}
          width={STRIP_WIDTH}
          height={STRIP.height}
          mode="emission"
          lines={view.line > 0.001 ? [{ nm: LINE_NM, intensity: view.line }] : []}
          tickFontSize={TICK_FONT}
          idPrefix="bohr"
        />

        {/* The spectral line's label and the series name */}
        {view.line > 0.001 && (
          <g>
            <g opacity={view.line}>
              <Label x={LINE_X} y={STRIP.y - 40} textAnchor="middle" fontSize={18}>
                H<Label.Sub>α</Label.Sub>
                <tspan dy="-0.32em"> {LINE_NM} nm</tspan>
              </Label>
              <Label
                x={(STRIP.left + STRIP.right) / 2}
                y={STRIP.y + STRIP.height + 62}
                textAnchor="middle"
                fontSize={16}
              >
                {emissionSeriesName()} series
              </Label>
            </g>
          </g>
        )}
      </svg>

      <p className={styles.srOnly} aria-live={announce ? 'polite' : 'off'}>
        {stepDescription(activeStep)}
      </p>
    </div>
  )
}

/** Vertical arrow with a filled head. Points up when y2 < y1, down otherwise. */
function TransitionArrow({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  const dir = Math.sign(y2 - y1) || 1
  const headLength = 11
  const headHalfWidth = 5
  const tipY = y2
  const baseY = y2 - dir * headLength
  return (
    <g>
      <line
        x1={x}
        x2={x}
        y1={y1}
        y2={baseY}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: 'var(--orbit-active)' }}
      />
      <path
        d={`M${x},${tipY} L${x - headHalfWidth},${baseY} L${x + headHalfWidth},${baseY} Z`}
        style={{ fill: 'var(--orbit-active)' }}
      />
    </g>
  )
}

