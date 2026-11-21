'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  CATHODE_EQUATION,
  ENVIRONMENTS,
  MAX_WEEKS,
  PROTECTIONS,
  RATE_LABELS,
  RUST_FORMULA,
  anodeE0,
  anodeEquation,
  cathodeE0,
  corrosionState,
  rustFraction,
  type Environment,
  type Metal,
  type Protection,
} from '@/lib/chem/corrosion-lab'
import styles from './corrosion-lab.module.css'

const METAL_NAME: Record<Metal, string> = {
  iron: 'iron',
  zinc: 'zinc',
  tin: 'tin',
  magnesium: 'magnesium',
}

const METAL_SYMBOL: Record<Metal, string> = {
  iron: 'Fe',
  zinc: 'Zn',
  tin: 'Sn',
  magnesium: 'Mg',
}

function signed(value: number): string {
  return `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(2)} V`
}

export function CorrosionLab({ reducedMotion }: SimulationProps) {
  const [env, setEnv] = useState<Environment>('water-air')
  const [protection, setProtection] = useState<Protection>('none')
  const [scratched, setScratched] = useState(false)
  const [weeks, setWeeks] = useState(12)
  const [playing, setPlaying] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const t = useAmbientTime(reducedMotion)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')

  // Play time forward, one week per tick. Pauses when off-screen or when the tab is hidden.
  useEffect(() => {
    if (!playing || !active) return
    const id = window.setInterval(() => {
      setWeeks((w) => {
        if (w >= MAX_WEEKS) {
          window.clearInterval(id)
          setPlaying(false)
          return MAX_WEEKS
        }
        return w + 1
      })
    }, 400)
    return () => window.clearInterval(id)
  }, [playing, active])

  const scratchable = protection === 'zinc' || protection === 'tin'
  const isScratched = scratchable && scratched
  const state = corrosionState({ env, protection, scratched: isScratched })
  const envInfo = ENVIRONMENTS.find((e) => e.id === env)!
  const protectionInfo = PROTECTIONS.find((p) => p.id === protection)!
  const ironFraction = rustFraction(state.ironRate, weeks)

  // Geometry (viewBox 420 x 300). Anode on the left, except magnesium, which sits on the right.
  // The tube fills most of the stage width (x 60 to 380 of 420), so the labels sit inside the glass.
  const TUBE_X = 60
  const TUBE_W = 320
  const NAIL_X = 205
  const NAIL_W = 10
  const anodeY =
    state.anode === 'zinc' ? 186 : state.anode === 'magnesium' ? 232 : state.anode === 'iron' && isScratched ? 170 : 200
  const cathodeY = state.cathode === 'tin' ? 118 : 60
  const anodeOnRight = state.anode === 'magnesium'
  const electronDots = state.anode ? [0, 1, 2].map((i) => ((t * 0.12 + i / 3) % 1)) : []

  const ironRustRegion =
    state.anode === 'iron' && isScratched
      ? { y: 152, h: 36 }
      : { y: 104, h: 146 }

  const rateFor = (e: Environment) => {
    const s = corrosionState({ env: e, protection, scratched: isScratched })
    return s
  }

  const summary = (() => {
    const base = `${envInfo.label}, ${protectionInfo.label.toLowerCase()}${isScratched ? ', scratched through to the iron' : ''}, week ${weeks}.`
    if (!state.anode) return `${base} Nothing corrodes under these conditions.`
    if (state.anode === 'iron') {
      return `${base} Iron is the anode and rusts: ${RATE_LABELS[state.ironRate]} on the illustrative scale, rust ${Math.round(ironFraction * 100)}% of the full drawing.`
    }
    return `${base} ${METAL_NAME[state.anode]} is the anode and corrodes (${RATE_LABELS[state.sacrificialRate]}). Iron is the cathode and is protected.`
  })()

  return (
    <div ref={rootRef} className={styles.lab}>
      <div className={styles.controls}>
        <Segmented
          label="Environment"
          options={ENVIRONMENTS.map((e) => ({ value: e.id, label: e.label }))}
          value={env}
          onChange={setEnv}
        />
        <Segmented
          label="Protection"
          options={PROTECTIONS.map((p) => ({ value: p.id, label: p.label }))}
          value={protection}
          onChange={(p) => {
            setProtection(p)
            if (p !== 'zinc' && p !== 'tin') setScratched(false)
          }}
        />
        <div className={styles.row}>
          <Toggle
            label="Scratch the coating"
            checked={isScratched}
            disabled={!scratchable}
            onChange={setScratched}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!playing && weeks >= MAX_WEEKS) setWeeks(0)
              setPlaying((p) => !p)
            }}
            aria-pressed={playing}
          >
            {playing ? 'Pause' : 'Play time forward'}
          </Button>
        </div>
        <Slider
          label="Time"
          value={weeks}
          min={0}
          max={MAX_WEEKS}
          step={1}
          unit="weeks"
          onChange={(v) => {
            setPlaying(false)
            setWeeks(v)
          }}
        />
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.svg}
          viewBox="0 0 420 300"
          role="img"
          aria-label={summary}
        >
          <defs>
            <clipPath id={`tube-${uid}`}>
              <rect x={TUBE_X} y={24} width={TUBE_W} height={262} rx={14} />
            </clipPath>
          </defs>

          <rect className={styles.glass} x={TUBE_X} y={24} width={TUBE_W} height={262} rx={14} />
          {env !== 'dry-air' && (
            <rect
              className={styles.liquid}
              data-env={env}
              x={TUBE_X}
              y={120}
              width={TUBE_W}
              height={166}
              clipPath={`url(#tube-${uid})`}
            />
          )}
          <rect className={styles.glassEdge} x={TUBE_X} y={24} width={TUBE_W} height={262} rx={14} />

          <text className={styles.caption} x={210} y={14} textAnchor="middle">
            {env === 'dry-air' ? 'no water' : env === 'water-no-air' ? 'water, no O₂' : 'O₂ present'}
          </text>

          {/* Nail */}
          <rect className={styles.iron} x={NAIL_X} y={52} width={NAIL_W} height={200} />
          <rect className={styles.iron} x={NAIL_X - 7} y={44} width={NAIL_W + 14} height={12} rx={3} />

          {/* Coatings */}
          {protection === 'paint' && (
            <rect className={styles.paint} x={NAIL_X - 4} y={100} width={NAIL_W + 8} height={140} rx={3} />
          )}
          {protection === 'zinc' && (
            <rect className={styles.zinc} x={NAIL_X - 3} y={100} width={NAIL_W + 6} height={140} rx={2} />
          )}
          {protection === 'tin' && (
            <rect className={styles.tin} x={NAIL_X - 3} y={100} width={NAIL_W + 6} height={140} rx={2} />
          )}
          {isScratched && (
            <>
              <rect className={styles.exposed} x={NAIL_X} y={156} width={NAIL_W} height={28} />
              <path
                className={styles.scratch}
                d={`M ${NAIL_X - 6} 150 l 6 6 l -4 4 l 8 6 l -4 4 l 8 6`}
              />
            </>
          )}

          {/* Rust, drawn over the anodic region of iron */}
          {state.ironRate > 0 && ironFraction > 0 && (
            <rect
              className={styles.rust}
              x={NAIL_X - 3}
              y={ironRustRegion.y}
              width={NAIL_W + 6}
              height={ironRustRegion.h}
              rx={3}
              opacity={0.25 + 0.75 * ironFraction}
            />
          )}

          {/* Magnesium block bolted to the nail */}
          {protection === 'magnesium' && (
            <>
              <path className={styles.wire} d={`M ${NAIL_X + NAIL_W} 232 H 222`} />
              <rect className={styles.mg} x={222} y={216} width={26} height={34} rx={4} />
            </>
          )}

          {/* Electrons moving through the metal from anode to cathode */}
          {electronDots.map((f, i) => {
            const y = anodeY + (cathodeY - anodeY) * f
            return <circle key={i} className={styles.electron} cx={NAIL_X + NAIL_W / 2} cy={y} r={3.5} />
          })}

          {/* Anode and cathode labels */}
          {state.anode && (
            <g>
              {anodeOnRight ? (
                <>
                  <path className={styles.leader} d={`M 268 ${anodeY} H 250`} />
                  <text className={styles.label} x={272} y={anodeY + 5}>
                    anode: {METAL_SYMBOL[state.anode]}
                  </text>
                </>
              ) : (
                <>
                  <path className={styles.leader} d={`M 154 ${anodeY} H ${NAIL_X - 4}`} />
                  <text className={styles.label} x={150} y={anodeY + 5} textAnchor="end">
                    anode: {METAL_SYMBOL[state.anode]}
                  </text>
                </>
              )}
            </g>
          )}
          {state.cathode && (
            <g>
              <path className={styles.leader} d={`M 268 ${cathodeY} H ${NAIL_X + NAIL_W + 4}`} />
              <text className={styles.label} x={272} y={cathodeY + 5}>
                cathode: {METAL_SYMBOL[state.cathode]}
              </text>
            </g>
          )}
        </svg>

        <p className={styles.note}>
          {state.anode
            ? `${METAL_NAME[state.anode].replace(/^./, (c) => c.toUpperCase())} is oxidised at the anode; oxygen is reduced at the cathode.`
            : 'No cell runs here, so nothing corrodes.'}
        </p>
      </div>

      <dl className={styles.equations}>
        <div>
          <dt>Anode (oxidation)</dt>
          <dd>
            {state.anode ? (
              <>
                <span className={styles.eq}>{anodeEquation(state.anode)}</span>
                <span className={styles.e0}>E° = {signed(anodeE0(state.anode))}</span>
              </>
            ) : (
              'none'
            )}
          </dd>
        </div>
        <div>
          <dt>Cathode (reduction)</dt>
          <dd>
            {state.cathode ? (
              <>
                <span className={styles.eq}>{CATHODE_EQUATION}</span>
                <span className={styles.e0}>E° = {signed(cathodeE0())}</span>
              </>
            ) : (
              'none'
            )}
          </dd>
        </div>
        <div>
          <dt>Rust</dt>
          <dd>{state.ironRate > 0 ? <span className={styles.eq}>{RUST_FORMULA}</span> : 'none on the iron'}</dd>
        </div>
      </dl>

      <div className={styles.compare}>
        <h3 className={styles.compareTitle}>Rust on bare or exposed iron, all five environments</h3>
        <p className={styles.scaleNote}>
          Illustrative relative scale, not measured data. Same protection and time as above.
        </p>
        <ul className={styles.list}>
          {ENVIRONMENTS.map((e) => {
            const s = rateFor(e.id)
            const fraction = rustFraction(s.ironRate, weeks)
            const sacrificial = s.anode && s.anode !== 'iron' && s.sacrificialRate > 0
            return (
              <li key={e.id} className={e.id === env ? styles.current : undefined}>
                <span className={styles.rowName}>{e.label}</span>
                <span className={styles.bar} aria-hidden="true">
                  <span className={styles.barFill} style={{ width: `${Math.round(fraction * 100)}%` }} />
                </span>
                <span className={styles.rowText}>
                  {sacrificial
                    ? `iron protected; ${METAL_NAME[s.anode!]} corrodes`
                    : `rust: ${RATE_LABELS[s.ironRate]}`}
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
