'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { Stage3DLazy } from '@/components/stage3d'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import {
  allChoices,
  clampChoice,
  describeChoice,
  getOrbitalGeometry,
  isGeometryCached,
  lChoices,
  mChoices,
  N_CHOICES,
  orbitalButtonLabel,
  orbitalFullName,
  orbitalNodes,
  shellLetter,
  type OrbitalChoice,
  type OrbitalGeometry,
} from './orbital-explorer-model'
import { OrbitalScene, type OrbitalView } from './orbital-explorer-scene'
import styles from './orbital-explorer.module.css'

const SUBSHELL_LETTERS = ['s', 'p', 'd', 'f'] as const

/** An integer with a true minus sign (U+2212), as in m_ℓ = −2. */
const signed = (value: number) => (value < 0 ? `−${-value}` : String(value))

/** A symbol set in the global italic maths style (.sym), as in the rest of the site. */
const Sym = ({ children }: { children: ReactNode }) => <span className="sym">{children}</span>

/** What each subshell looks like, in one line for the readout. */
const SHAPE_NOTE = [
  'One orbital with no angular nodes: a sphere, the same in every direction.',
  'Three orbitals, each with one angular node: a plane through the nucleus separates two lobes.',
  'Five orbitals, each with two angular nodes. Four have four lobes; dz² has two lobes along z and a ring.',
  'Seven orbitals, each with three angular nodes.',
] as const

/** The cache key used by the model for a choice (n-ℓ-m), so a shown geometry can be matched to it. */
const geometryKey = (choice: OrbitalChoice) => {
  const c = clampChoice(choice)
  return `${c.n}-${c.l}-${c.m}`
}

/** Runs `fn` when the browser is idle, or after a short delay where idle callbacks are missing. */
function whenIdle(fn: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: 400 })
    return () => window.cancelIdleCallback(id)
  }
  const id = window.setTimeout(fn, 60)
  return () => window.clearTimeout(id)
}

/**
 * Orders the prefetch: the current subshell's siblings (same n and ℓ) first, then the other
 * orbitals of the same shell, then the rest. Built orbitals are dropped.
 */
function prefetchOrder(current: OrbitalChoice): OrbitalChoice[] {
  const rank = (c: OrbitalChoice) => (c.n === current.n && c.l === current.l ? 0 : c.n === current.n ? 1 : 2)
  return allChoices()
    .filter((c) => !isGeometryCached(c))
    .sort((a, b) => rank(a) - rank(b))
}

/** A row of toggle buttons. Options can be unavailable, and an unavailable option cannot be chosen. */
function ChoiceRow<T extends string | number>({
  label,
  labelNode,
  options,
  value,
  onChange,
}: {
  /** Plain-text name for assistive technology. */
  label: string
  /** The visible name, which may use the symbol style. Defaults to `label`. */
  labelNode?: ReactNode
  options: { value: T; text: string; disabled?: boolean }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span className={styles.fieldLabel}>{labelNode ?? label}</span>
      <div className={styles.choices}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={styles.choice}
            aria-pressed={option.value === value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {option.text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Shows the Stage's 2D fallback when WebGL is unavailable: two cross-sections through the nucleus. */
function OrbitalFallback({ geometry, name }: { geometry: OrbitalGeometry; name: string }) {
  const { size, xy, xz } = geometry.slices
  const cell = 160 / size
  const panel = (plane: typeof xy, offsetX: number, title: string) => (
    <g transform={`translate(${offsetX}, 20)`}>
      <rect x={0} y={0} width={160} height={160} rx={6} style={{ fill: 'var(--surface-raised)' }} />
      {Array.from(plane.density, (density, index) => {
        if (density < 0.02) return null
        // The first plane coordinate runs left to right, the second bottom to top.
        const i = Math.floor(index / size)
        const j = index % size
        const sign = plane.signs[index]
        return (
          <rect
            key={index}
            x={i * cell}
            y={(size - 1 - j) * cell}
            width={cell + 0.4}
            height={cell + 0.4}
            style={{
              fill: sign > 0 ? 'var(--orbital-pos)' : 'var(--orbital-neg)',
              opacity: Math.min(1, density * 0.85),
            }}
          />
        )
      })}
      <text x={80} y={178} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
        {title}
      </text>
    </g>
  )
  // The panels occupy y = 20 to 180. The captions sit below them, in local units.
  return (
    <svg viewBox="0 0 360 270" role="img" aria-label={`Cross-sections of the ${name} orbital`} className={styles.fallbackSvg}>
      {panel(xy, 20, 'xy-plane (z = 0)')}
      {panel(xz, 180, 'xz-plane (y = 0)')}
      <text x={180} y={224} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg-subtle)', fontFamily: 'var(--font-sans)' }}>
        Coral = <tspan className="sym">ψ</tspan> &gt; 0, teal = <tspan className="sym">ψ</tspan> &lt; 0.
      </text>
      <text x={180} y={242} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg-subtle)', fontFamily: 'var(--font-sans)' }}>
        Darker: inside the 90% boundary.
      </text>
      <text x={180} y={260} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg-subtle)', fontFamily: 'var(--font-sans)' }}>
        Blank panel: <tspan className="sym">ψ</tspan> = 0 on that plane.
      </text>
    </svg>
  )
}

/**
 * The orbital explorer: choose n, ℓ and m_ℓ for a real hydrogen-like orbital, then see its
 * boundary surface (the region holding 90% of the probability) or a probability cloud. Its
 * nodes can be shown, and the readout gives the node counts from the quantum-number rules.
 *
 * Switching to an orbital that is not yet built keeps the previous picture on screen, marked
 * "building…", until the new geometry is ready.
 */
export function OrbitalExplorer(_props: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const [choice, setChoice] = useState<OrbitalChoice>({ n: 3, l: 2, m: 0 })
  const [view, setView] = useState<OrbitalView>('surface')
  const [showNodes, setShowNodes] = useState(false)
  // The last geometry that was built and shown. It stays on screen while a new one builds.
  const [shown, setShown] = useState<OrbitalGeometry>(() => getOrbitalGeometry(choice))

  const cachedNow = isGeometryCached(choice) ? getOrbitalGeometry(choice) : null
  const geometry = cachedNow ?? shown
  const building = geometry.key !== geometryKey(choice)
  const nodes = orbitalNodes(choice)
  const subshellNote = SHAPE_NOTE[choice.l]
  const name = orbitalFullName(choice)

  // Build an uncached orbital after the building state has painted. Only the newest request
  // completes: a cleanup cancels the timer when the choice changes again.
  useEffect(() => {
    if (isGeometryCached(choice)) return
    let live = true
    const timer = window.setTimeout(() => {
      if (live) setShown(getOrbitalGeometry(choice))
    }, 0)
    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [choice])

  // Prefetch the other orbitals in idle time once the explorer is on screen, siblings first, so
  // that switching orbitals is a cache hit. Restarts when the subshell changes.
  useEffect(() => {
    if (!active) return
    let cancelled = false
    const pending = prefetchOrder(choice)
    let next = 0
    let cancelIdle: () => void = () => {}
    const run = () => {
      if (cancelled || next >= pending.length) return
      getOrbitalGeometry(pending[next++])
      cancelIdle = whenIdle(run)
    }
    cancelIdle = whenIdle(run)
    return () => {
      cancelled = true
      cancelIdle()
    }
    // Only the subshell matters for the order, so the effect restarts when n or ℓ changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, choice.n, choice.l])

  const pick = (next: OrbitalChoice) => setChoice(clampChoice(next))

  return (
    <div ref={rootRef} className={styles.root} data-testid="orbital-explorer">
      <div className={styles.layout}>
        <div className={styles.stage}>
          <Stage3DLazy
            label={`${name} orbital, ${view === 'surface' ? 'boundary surface' : 'probability cloud'}, with the x, y and z axes, z up. Drag to rotate.`}
            fallback={<OrbitalFallback geometry={geometry} name={name} />}
          >
            <OrbitalScene geometry={geometry} view={view} showNodes={showNodes} />
          </Stage3DLazy>
          {building && (
            <p className={styles.building} aria-hidden="true">
              building…
            </p>
          )}
        </div>

        <aside className={styles.readout} aria-labelledby="orbital-readout-title">
          <p className={styles.eyebrowRow} id="orbital-readout-title">
            Orbital
          </p>
          <p className={styles.name}>
            <span className={styles.nameMain}>{name}</span>
          </p>
          <p className={styles.address}>
            Shell {shellLetter(choice.n)} (<Sym>n</Sym> = {choice.n}), subshell {choice.n}
            {SUBSHELL_LETTERS[choice.l]}, orbital {orbitalButtonLabel(choice)} (<Sym>m</Sym>
            <sub className="sym">ℓ</sub> = {signed(choice.m)})
          </p>

          <dl className={styles.nodeList}>
            <div>
              <dt>Radial nodes</dt>
              <dd>
                {nodes.radial}
                <span className={styles.formula}>
                  <Sym>n</Sym> − <Sym>ℓ</Sym> − 1
                </span>
              </dd>
            </div>
            <div>
              <dt>Angular nodes</dt>
              <dd>
                {nodes.angular}
                <span className={styles.formula}>
                  <Sym>ℓ</Sym>
                </span>
              </dd>
            </div>
            <div>
              <dt>Total nodes</dt>
              <dd>
                {nodes.total}
                <span className={styles.formula}>
                  <Sym>n</Sym> − 1
                </span>
              </dd>
            </div>
          </dl>

          <p className={styles.note}>{subshellNote}</p>
          <p className={styles.note}>
            The boundary surface encloses 90% of the probability and reaches about{' '}
            <span className={styles.number}>{building ? '…' : geometry.extentPm} pm</span> from the nucleus. Each picture
            is zoomed to fill the stage, so compare shapes rather than sizes.
          </p>
          <div className={styles.legend} aria-hidden="true">
            <span className={styles.swatchPos} /> <Sym>ψ</Sym> &gt; 0
            <span className={styles.swatchNeg} /> <Sym>ψ</Sym> &lt; 0
          </div>
        </aside>
      </div>

      <p className={styles.sr} aria-live="polite">
        {describeChoice(choice, building ? undefined : geometry)}
      </p>

      <SimulationControls>
        <ChoiceRow
          label="Shell n"
          labelNode={
            <>
              Shell <Sym>n</Sym>
            </>
          }
          options={N_CHOICES.map((n) => ({ value: n, text: String(n) }))}
          value={choice.n}
          onChange={(n) => pick({ n, l: choice.l, m: choice.m })}
        />
        <ChoiceRow
          label="Subshell ℓ"
          labelNode={
            <>
              Subshell <Sym>ℓ</Sym>
            </>
          }
          options={[0, 1, 2, 3].map((l) => ({
            value: l,
            text: SUBSHELL_LETTERS[l],
            disabled: !lChoices(choice.n).includes(l),
          }))}
          value={choice.l}
          onChange={(l) => pick({ n: choice.n, l, m: 0 })}
        />
        <ChoiceRow
          label="Orbital mℓ"
          labelNode={
            <>
              Orbital <Sym>m</Sym>
              <sub className="sym">ℓ</sub>
            </>
          }
          options={mChoices(choice.l).map((m) => ({
            value: m,
            text: orbitalButtonLabel({ n: choice.n, l: choice.l, m }),
          }))}
          value={choice.m}
          onChange={(m) => pick({ n: choice.n, l: choice.l, m })}
        />
        <Segmented<OrbitalView>
          label="Display"
          options={[
            { value: 'surface', label: 'Boundary surface' },
            { value: 'cloud', label: 'Probability cloud' },
          ]}
          value={view}
          onChange={setView}
        />
        <Toggle label="Show nodes" checked={showNodes} onChange={setShowNodes} />
      </SimulationControls>
    </div>
  )
}
