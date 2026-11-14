'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Button, Toggle } from '@/components/controls'
import {
  Electron,
  EnergyLevel,
  Label,
  Nucleus,
  Photon,
  VocabDefs,
  joulesToEv,
  ladderLabels,
  ladderY,
} from '@/components/vocab'
import { SimulationControls } from '@/components/simulation/Simulation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import { energyLevel } from '@/lib/chem/bohr'
import {
  SIM_LEVEL_MAX,
  pickLevel,
  randomLevelPair,
  transitionReadout,
  type TransitionReadout,
} from '@/lib/chem/hydrogen-spectrum'
import { trueMinus } from '@/components/animations/unit2/bohr/notation'
import { HydrogenStrip, type StripLine } from './hydrogen-spectrum-strip'
import {
  JUMP_MS,
  jumpFrame,
  orbitRadiusFor,
  restLevelAfter,
  seriesBrackets,
  stripX,
  type TransitionMode,
} from './hydrogen-spectrum-model'
import styles from './hydrogen-spectrum.module.css'

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 840 × 496)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 840
const VIEW_HEIGHT = 496
const ATOM = { cx: 150, cy: 150, rMax: 125 }
const LADDER = { rungLeft: 480, rungRight: 580, top: 64, bottom: 262, labelX: 596, minGap: 20 }
const STRIP = { x: 40, y: 444, width: 760, height: 16 }
/** Packet length of the photon while it travels, in SVG units. */
const PACKET_LENGTH = 90
/** Angular speed of the electron on orbit n is OMEGA / n, in radians per second. */
const OMEGA = 1.6

const LEVELS = Array.from({ length: SIM_LEVEL_MAX }, (_, i) => i + 1)
const LEVEL_EV = (n: number) => joulesToEv(energyLevel(n))
const EV_MIN = LEVEL_EV(1)
const EV_MAX = LEVEL_EV(SIM_LEVEL_MAX)
/** Energy of a continuous level: E_n = E_1 / n², so it works between the whole-number rungs too. */
const levelEvContinuous = (level: number) => EV_MIN / (level * level)
const yForEv = (ev: number) => ladderY(ev, { top: LADDER.top, bottom: LADDER.bottom, eMin: EV_MIN, eMax: EV_MAX })
const rungY = (n: number) => yForEv(LEVEL_EV(n))
const RUNG_LABELS = ladderLabels(
  LEVELS.map((n) => ({ y: rungY(n) })),
  LADDER.minGap
)

const DEFAULT_PAIR = { upper: 3, lower: 2 }

/** A transition that is in flight, from the moment it starts. */
interface Jump {
  upper: number
  lower: number
  mode: TransitionMode
  startLevel: number
  angle: number
}

interface Frame {
  level: number
  photon: number
  lineLit: number
}

const keyOf = (upper: number, lower: number) => `${upper}-${lower}`

const sci = (value: number, digits: number) => {
  const exp = Math.floor(Math.log10(Math.abs(value)))
  return { mantissa: (value / 10 ** exp).toFixed(digits), exp }
}

function ScientificNumber({ value, digits, unit }: { value: number; digits: number; unit: string }) {
  const { mantissa, exp } = sci(value, digits)
  return (
    <>
      {mantissa} × 10
      <sup>{trueMinus(String(exp))}</sup> {unit}
    </>
  )
}

/**
 * HydrogenSpectrum: a Bohr atom, an energy ladder and a spectrum strip. The
 * Learner picks an upper and a lower level; the electron jumps, a photon of the
 * right wavelength leaves (or arrives, in absorption mode), and its line lights
 * up on the strip. Lines accumulate, so the series builds up.
 */
export function HydrogenSpectrum({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)

  const [pair, setPair] = useState(DEFAULT_PAIR)
  const [mode, setMode] = useState<TransitionMode>('emission')
  const [showSeries, setShowSeries] = useState(false)
  const [emitted, setEmitted] = useState<string[]>([])
  const [absorbed, setAbsorbed] = useState<string[]>([])
  const [rest, setRest] = useState(1)
  const [jump, setJump] = useState<Jump | null>(null)
  const [frame, setFrame] = useState<Frame>({ level: 1, photon: -1, lineLit: 0 })
  const [angle, setAngle] = useState(0)
  const [announce, setAnnounce] = useState('')
  const [focusedLevel, setFocusedLevel] = useState<number | null>(null)

  // Mutable mirrors for the animation loop, so it never reads a stale closure.
  const jumpRef = useRef<Jump | null>(null)
  const elapsedRef = useRef(0)
  const restRef = useRef(1)
  const levelRef = useRef(1)
  const angleRef = useRef(0)
  const rungRefs = useRef<(SVGGElement | null)[]>([])

  const finish = (j: Jump) => {
    const key = keyOf(j.upper, j.lower)
    if (j.mode === 'emission') setEmitted((list) => (list.includes(key) ? list : [...list, key]))
    else setAbsorbed((list) => (list.includes(key) ? list : [...list, key]))
    const r = transitionReadout(j.upper, j.lower)
    const verb = j.mode === 'emission' ? 'Emitted' : 'Absorbed'
    setAnnounce(
      `${verb}: n = ${r.upper} and n = ${r.lower}. Wavelength ${r.wavelengthNm.toFixed(1)} nanometres, ${r.series} series, ${r.region}.`
    )
    restRef.current = restLevelAfter(j.mode, j.upper, j.lower)
    levelRef.current = restRef.current
    setRest(restRef.current)
    jumpRef.current = null
    setJump(null)
    setFrame({ level: restRef.current, photon: -1, lineLit: 0 })
  }

  const startJump = (next: { upper: number; lower: number }, m: TransitionMode) => {
    if (jumpRef.current) finish(jumpRef.current)
    const j: Jump = {
      upper: next.upper,
      lower: next.lower,
      mode: m,
      startLevel: restRef.current,
      angle: angleRef.current,
    }
    if (reducedMotion) {
      finish(j)
      return
    }
    jumpRef.current = j
    elapsedRef.current = 0
    setJump(j)
  }

  // The animation loop: ambient orbiting while idle, and the jump while it runs.
  // It only runs while the Simulation is on screen and the tab is visible.
  useEffect(() => {
    if (!active || reducedMotion) return
    let raf = 0
    let last: number | null = null
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(0.1, (now - last) / 1000)
      last = now
      const current = jumpRef.current
      if (current) {
        elapsedRef.current += dt * 1000
        const p = elapsedRef.current / JUMP_MS
        if (p >= 1) {
          finish(current)
        } else {
          const f = jumpFrame(p, current.mode, current.startLevel, current.upper, current.lower)
          levelRef.current = f.level
          angleRef.current += (dt * OMEGA) / levelRef.current
          setFrame({ level: f.level, photon: f.photon, lineLit: f.lineLit })
          setAngle(angleRef.current)
        }
      } else {
        angleRef.current += (dt * OMEGA) / levelRef.current
        setAngle(angleRef.current)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // finish and the state setters are stable for the component lifetime.
  }, [active, reducedMotion])

  const choose = (next: { upper: number; lower: number }) => {
    if (next.upper === pair.upper && next.lower === pair.lower) return
    setPair(next)
    startJump(next, mode)
  }

  const selectLevel = (n: number) => choose(pickLevel(pair, n))

  const randomTransition = () => {
    const [upper, lower] = randomLevelPair()
    choose({ upper, lower })
  }

  const clearSpectrum = () => {
    setEmitted([])
    setAbsorbed([])
    setAnnounce('Spectrum cleared.')
  }

  const onRungKey = (event: KeyboardEvent<SVGGElement>, n: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectLevel(n)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const target = event.key === 'ArrowUp' ? Math.min(SIM_LEVEL_MAX, n + 1) : Math.max(1, n - 1)
      rungRefs.current[target - 1]?.focus()
    }
  }

  // --- what is drawn ------------------------------------------------------

  const readout: TransitionReadout = transitionReadout(pair.upper, pair.lower)
  const inFlight = jump !== null
  const electronLevel = inFlight ? frame.level : rest
  const electronR = orbitRadiusFor(electronLevel, ATOM.rMax)
  const electronX = ATOM.cx + electronR * Math.cos(angle)
  const electronY = ATOM.cy + electronR * Math.sin(angle)

  const dotX = (LADDER.rungLeft + LADDER.rungRight) / 2
  const dotY = yForEv(levelEvContinuous(electronLevel))

  // Photon geometry. The source is the atom on the lower orbit, at the angle the jump began.
  const flyingJump = inFlight ? jump : null
  const flyingReadout = flyingJump ? transitionReadout(flyingJump.upper, flyingJump.lower) : null
  let photonGeom: { x1: number; y1: number; x2: number; y2: number; nm: number } | null = null
  if (flyingJump && flyingReadout && frame.photon >= 0) {
    const a0 = flyingJump.angle
    const r0 = orbitRadiusFor(flyingJump.lower, ATOM.rMax)
    const S = { x: ATOM.cx + r0 * Math.cos(a0), y: ATOM.cy + r0 * Math.sin(a0) }
    const T = { x: STRIP.x + stripX(flyingReadout.wavelengthNm, STRIP.width), y: STRIP.y }
    const dist = Math.hypot(T.x - S.x, T.y - S.y)
    const ux = (T.x - S.x) / dist
    const uy = (T.y - S.y) / dist
    const param = frame.photon
    const len = Math.min(PACKET_LENGTH, param * dist)
    const head =
      flyingJump.mode === 'emission'
        ? { x: S.x + param * (T.x - S.x), y: S.y + param * (T.y - S.y) }
        : { x: T.x + param * (S.x - T.x), y: T.y + param * (S.y - T.y) }
    const sign = flyingJump.mode === 'emission' ? -1 : 1
    photonGeom = {
      x1: head.x + sign * len * ux,
      y1: head.y + sign * len * uy,
      x2: head.x,
      y2: head.y,
      nm: flyingReadout.wavelengthNm,
    }
  }

  const modeLines = mode === 'emission' ? emitted : absorbed
  const lines: StripLine[] = modeLines.map((key) => {
    const [u, l] = key.split('-').map(Number)
    const r = transitionReadout(u, l)
    return { key, nm: r.wavelengthNm, onAxis: r.onAxis, series: r.series, lit: 1 }
  })
  if (flyingJump && flyingJump.mode === mode && frame.lineLit > 0) {
    const key = keyOf(flyingJump.upper, flyingJump.lower)
    if (!modeLines.includes(key)) {
      lines.push({
        key: `flight-${key}`,
        nm: flyingReadout!.wavelengthNm,
        onAxis: flyingReadout!.onAxis,
        series: flyingReadout!.series,
        lit: frame.lineLit,
      })
    }
  }
  const brackets = seriesBrackets(lines)

  const upperLabel = `n = ${readout.upper}`
  const lowerLabel = `n = ${readout.lower}`
  const transitionText =
    mode === 'emission' ? `${upperLabel} → ${lowerLabel}` : `${lowerLabel} → ${upperLabel}`
  const summary = `Selected transition: ${transitionText}. Wavelength ${readout.wavelengthNm.toFixed(1)} nanometres, ${readout.series} series, ${readout.region}. Energy change ${readout.deltaEnergyEv.toFixed(2)} electronvolts.`

  return (
    <div ref={rootRef} className={styles.sim} data-testid="hydrogen-spectrum" data-mode={mode}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="group"
        aria-label="Bohr atom with energy levels n = 1 to 6, and a spectrum strip from 90 to 2000 nanometres. Select levels on the ladder to make transitions."
      >
        <VocabDefs idPrefix="hs" />

        {LEVELS.map((n) => {
          const r = orbitRadiusFor(n, ATOM.rMax)
          const isSel = n === pair.upper || n === pair.lower
          const showLabel = n >= 3
          return (
            <g key={`orbit-${n}`}>
              <EnergyLevel variant="orbit" r={r} x={ATOM.cx} y={ATOM.cy} active={isSel} />
              {showLabel && (
                <Label
                  x={ATOM.cx}
                  y={ATOM.cy - r - 10}
                  fontSize={14}
                  halo
                  fill={isSel ? 'var(--orbit-active)' : 'var(--fg-muted)'}
                >
                  <tspan fontStyle="italic">n</tspan> = {n}
                </Label>
              )}
            </g>
          )
        })}

        <Nucleus protons={1} neutrons={0} x={ATOM.cx} y={ATOM.cy} nucleonRadius={3.5} defsPrefix="hs" />
        <Electron x={electronX} y={electronY} size={9} defsPrefix="hs" />

        {photonGeom && (
          <Photon
            wavelengthNm={photonGeom.nm}
            x1={photonGeom.x1}
            y1={photonGeom.y1}
            x2={photonGeom.x2}
            y2={photonGeom.y2}
            amplitude={8}
          />
        )}

        {/* Energy ladder: one rung per level, each one a button */}
        {LEVELS.map((n, i) => {
          const isUpper = n === pair.upper
          const isLower = n === pair.lower
          const isSel = isUpper || isLower
          const place = RUNG_LABELS[i]
          const roleText = isUpper ? ', upper level' : isLower ? ', lower level' : ''
          const ev = LEVEL_EV(n).toFixed(2)
          return (
            <g
              key={`rung-${n}`}
              ref={(el) => {
                rungRefs.current[i] = el
              }}
              role="button"
              tabIndex={n === pair.upper ? 0 : n === pair.lower ? 0 : -1}
              aria-label={`Level n = ${n}, ${ev} electronvolts${roleText}`}
              aria-pressed={isSel}
              data-testid={`rung-${n}`}
              className={styles.rung}
              onClick={() => selectLevel(n)}
              onKeyDown={(event) => onRungKey(event, n)}
              onFocus={() => setFocusedLevel(n)}
              onBlur={() => setFocusedLevel(null)}
            >
              <rect
                x={LADDER.rungLeft - 12}
                y={rungY(n) - 3}
                width={LADDER.rungRight - LADDER.rungLeft + 24}
                height={6}
                className={styles.hitArea}
              />
              <EnergyLevel
                variant="ladder"
                width={LADDER.rungRight - LADDER.rungLeft}
                x={(LADDER.rungLeft + LADDER.rungRight) / 2}
                y={rungY(n)}
                active={isSel}
              />
              {place.nudged && (
                <line
                  x1={LADDER.rungRight}
                  y1={rungY(n)}
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
                fontSize={14}
                halo
                fill={isSel ? 'var(--orbit-active)' : 'var(--fg-muted)'}
              >
                <tspan fontStyle="italic">n</tspan> = {n} ({trueMinus(ev)} eV)
                {isUpper ? ' upper' : isLower ? ' lower' : ''}
              </Label>
              {/* The label is the main target: labels are spaced apart, so their boxes never overlap. */}
              <rect
                data-testid={`hit-${n}`}
                x={LADDER.labelX - 6}
                y={place.labelY - 9.5}
                width={172}
                height={19}
                rx={4}
                className={focusedLevel === n ? styles.focusRing : styles.hitArea}
              />
            </g>
          )
        })}

        <Electron x={dotX} y={dotY} size={10} defsPrefix="hs" />

        {/* ΔE arrow between the selected rungs: down for emission, up for absorption */}
        <g opacity={0.95}>
          <line
            x1={LADDER.rungLeft - 24}
            x2={LADDER.rungLeft - 24}
            y1={rungY(mode === 'emission' ? pair.upper : pair.lower)}
            y2={rungY(mode === 'emission' ? pair.lower : pair.upper)}
            strokeWidth={2}
            style={{ stroke: 'var(--orbit-active)' }}
          />
          <Label x={LADDER.rungLeft - 36} y={(rungY(pair.upper) + rungY(pair.lower)) / 2} textAnchor="end" fontSize={14} fill="var(--orbit-active)">
            {`ΔE = ${readout.deltaEnergyEv.toFixed(2)} eV`}
          </Label>
        </g>

        <HydrogenStrip
          x={STRIP.x}
          y={STRIP.y}
          width={STRIP.width}
          height={STRIP.height}
          mode={mode}
          lines={lines}
          brackets={brackets}
          showSeries={showSeries}
          idPrefix="hs"
          reducedMotion={reducedMotion}
        />
      </svg>

      <dl className={styles.readout} aria-label="Readout of the selected transition">
        <div className={styles.item}>
          <dt>Transition</dt>
          <dd>
            {transitionText}
            <span className={styles.sub}> ({mode === 'emission' ? 'emission' : 'absorption'})</span>
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Wavelength λ</dt>
          <dd>{readout.wavelengthNm.toFixed(1)} nm</dd>
        </div>
        <div className={styles.item}>
          <dt>Frequency ν</dt>
          <dd>
            <ScientificNumber value={readout.frequencyHz} digits={2} unit="Hz" />
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Energy change ΔE</dt>
          <dd>
            {readout.deltaEnergyEv.toFixed(2)} eV
            <span className={styles.sub}>
              {' '}
              = <ScientificNumber value={readout.deltaEnergyJ} digits={2} unit="J" />
            </span>
          </dd>
        </div>
        <div className={styles.item}>
          <dt>Series</dt>
          <dd>
            {readout.series} · {readout.region}
            {!readout.onAxis && <span className={styles.sub}> (beyond 2000 nm, off scale)</span>}
          </dd>
        </div>
      </dl>

      <p className={styles.srOnly} aria-live="polite">
        {announce || summary}
      </p>
      <p className={styles.srOnly}>{summary}</p>

      <SimulationControls>
        <Toggle label="Show series" checked={showSeries} onChange={setShowSeries} />
        <Toggle
          label="Absorption mode"
          checked={mode === 'absorption'}
          onChange={(on) => setMode(on ? 'absorption' : 'emission')}
        />
        <Button variant="primary" onClick={randomTransition}>
          Random transition
        </Button>
        <Button variant="secondary" onClick={clearSpectrum}>
          Clear spectrum
        </Button>
        <span className={styles.hint}>
          Click a level, or Tab to it and press Enter. A level above the lower end becomes the upper level; a level below the upper end becomes the lower one.
        </span>
      </SimulationControls>
    </div>
  )
}
