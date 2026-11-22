import { Particle, ReactionBox } from '@/components/vocab'
import { formatSig } from '@/lib/chem/kinetics'
import styles from './initial-rates-lab.module.css'

/** One sphere stands for this many mol L⁻¹ of a species: 0.30 mol L⁻¹ is 6 spheres. */
export const SPHERES_PER_MOL = 20
const SPHERE_MOL = 1 / SPHERES_PER_MOL

const BOX = 300
const GRID = 8
const SPHERE_R = 11
const PAD = 16
const TICKS = [0, 1 / 2, 1] as const

/**
 * Species tones match the Scrolly ratelaw animation: the first species is blue (reactant, as NO there),
 * the second neutral grey (as O2 there). Bars use the product green, so no bar matches a sphere.
 */
const TONES = ['reactant', 'neutral', 'product', 'catalyst'] as const

interface Slot {
  readonly x: number
  readonly y: number
}

/** Fixed, seeded positions for the spheres, so a sphere keeps its place as the sliders move. */
function slotPositions(): Slot[] {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const order = Array.from({ length: GRID * GRID }, (_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  const cell = (BOX - 2 * PAD) / GRID
  return order.map((k) => {
    const col = k % GRID
    const row = Math.floor(k / GRID)
    return {
      x: PAD + cell * (col + 0.5) + (rand() - 0.5) * 4,
      y: PAD + cell * (row + 0.5) + (rand() - 0.5) * 4,
    }
  })
}

const SLOTS = slotPositions()

export interface DrawnSpecies {
  readonly key: string
  /** Formatted for UI text, e.g. "NO" becomes "NO", "O2" becomes "O₂". */
  readonly symbol: string
}

export interface InitialRatesDrawingProps {
  readonly species: readonly DrawnSpecies[]
  readonly concs: Readonly<Record<string, number>>
  readonly runs: readonly { readonly rate: number }[]
  /** Shared full scale for every bar, in mol L⁻¹ s⁻¹. */
  readonly scale: number
}

/** Tick position as a CSS transform: the first label hangs right of its mark, the last hangs left of it. */
function tickShift(t: number): string {
  if (t === 0) return 'translateX(0)'
  if (t === 1) return 'translateX(-100%)'
  return 'translateX(-50%)'
}

/** The reaction box holds one sphere per 0.05 mol L⁻¹ of each species; the bars share one axis below. */
export function InitialRatesDrawing({ species, concs, runs, scale }: InitialRatesDrawingProps) {
  const sizes = species.map((s) => Math.round(concs[s.key] * SPHERES_PER_MOL))
  const counts = species.map((s, i) => ({
    ...s,
    n: sizes[i],
    from: sizes.slice(0, i).reduce((sum, n) => sum + n, 0),
    tone: TONES[i % TONES.length],
  }))
  const summary = counts.map((c) => `${c.symbol} ${c.n} spheres`).join(', ')

  return (
    <div className={styles.drawing}>
      <div className={styles.boxCol}>
        <svg
          className={styles.box}
          viewBox={`0 0 ${BOX} ${BOX}`}
          role="img"
          aria-label={`Reaction box with ${summary}.`}
          data-drawing="initial-rates"
        >
          <ReactionBox x={0} y={0} width={BOX} height={BOX} radius={16}>
            {counts.map((c) =>
              SLOTS.slice(c.from, c.from + c.n).map((p, k) => (
                <Particle key={`${c.key}-${k}`} x={p.x} y={p.y} r={SPHERE_R} tone={c.tone} />
              ))
            )}
          </ReactionBox>
        </svg>
        <ul className={styles.legend}>
          {counts.map((c) => (
            <li key={c.key} className={styles.legendItem}>
              <svg className={styles.swatch} viewBox="-10 -10 20 20" aria-hidden="true" focusable="false">
                <Particle x={0} y={0} r={8} tone={c.tone} />
              </svg>
              <span>
                <span className="sym">[{c.symbol}]</span>
                {`: ${c.n} spheres`}
              </span>
            </li>
          ))}
          <li className={styles.legendNote}>{`1 sphere = ${formatSig(SPHERE_MOL, 2)} mol L⁻¹`}</li>
        </ul>
      </div>

      <div className={styles.meters}>
        <p className={styles.meterTitle}>Initial rate, one shared scale</p>
        {runs.length === 0 ? (
          <p className={styles.note}>Each Run adds a bar here.</p>
        ) : (
          runs.map((r, i) => (
            <div key={i} className={styles.meterRow}>
              <span className={styles.meterLabel}>{`Run ${i + 1}`}</span>
              <span className={styles.meterTrack}>
                <span className={styles.meterFill} style={{ width: `${Math.min(1, Math.max(0, r.rate / scale)) * 100}%` }} />
              </span>
              <span className={styles.meterValue}>{formatSig(r.rate, 3)}</span>
            </div>
          ))
        )}
        <div className={styles.axis} aria-hidden="true">
          <span />
          <span className={styles.axisTrack}>
            {TICKS.map((t) => (
              <span key={t} className={styles.tick} style={{ left: `${t * 100}%`, transform: tickShift(t) }}>
                {formatSig(scale * t, 3)}
              </span>
            ))}
          </span>
          <span className={styles.axisUnit}>mol L⁻¹ s⁻¹</span>
        </div>
      </div>
    </div>
  )
}
