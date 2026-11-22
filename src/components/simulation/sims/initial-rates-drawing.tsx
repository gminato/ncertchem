import { Particle, ReactionBox, RateMeter } from '@/components/vocab'
import { formatSig } from '@/lib/chem/kinetics'
import styles from './initial-rates-lab.module.css'

/** One sphere stands for this many mol L⁻¹ of a species: 0.30 mol L⁻¹ is 6 spheres. */
export const SPHERES_PER_MOL = 20
const SPHERE_MOL = 1 / SPHERES_PER_MOL

const BOX = 300
const GRID = 8
const SPHERE_R = 11
const VIEW_W = 600
const VIEW_H = 540
const METER_X = 336
const METER_W = 246
const METER_TOP = 40
const METER_STEP = 62
const PAD = 16

const TONES = ['reactant', 'accent'] as const

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
  /** Shared full scale for every meter, in mol L⁻¹ s⁻¹. */
  readonly scale: number
}

/** The reaction box holds one sphere per 0.05 mol L⁻¹ of each species; a bar per run shares one scale. */
export function InitialRatesDrawing({ species, concs, runs, scale }: InitialRatesDrawingProps) {
  let cursor = 0
  const counts = species.map((s) => {
    const n = Math.round(concs[s.key] * SPHERES_PER_MOL)
    const from = cursor
    cursor += n
    return { ...s, n, from }
  })
  const summary = counts.map((c) => `${c.symbol} ${c.n} spheres`).join(', ')

  return (
    <svg
      className={styles.drawing}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={`Reaction box with ${summary}. Initial-rate bars for ${runs.length} runs on one scale.`}
      data-drawing="initial-rates"
    >
      <ReactionBox x={0} y={0} width={BOX} height={BOX} radius={16}>
        {counts.map((c, i) =>
          SLOTS.slice(c.from, c.from + c.n).map((p, k) => (
            <Particle key={`${c.key}-${k}`} x={p.x} y={p.y} r={SPHERE_R} tone={TONES[i % TONES.length]} />
          ))
        )}
      </ReactionBox>

      {counts.map((c, i) => {
        const y = BOX + 34 + i * 26
        return (
          <g key={c.key}>
            <Particle x={9} y={y - 6} r={8} tone={TONES[i % TONES.length]} />
            <text x={26} y={y} fontSize={15} fill="var(--fg)">
              <tspan className="sym">[{c.symbol}]</tspan>
              {`: ${c.n} spheres`}
            </text>
          </g>
        )
      })}
      <text x={0} y={BOX + 34 + counts.length * 26 + 14} fontSize={15} fill="var(--fg-muted)">
        {`1 sphere = ${formatSig(SPHERE_MOL, 2)} mol L⁻¹`}
      </text>

      <text x={METER_X} y={18} fontSize={15} fill="var(--fg)">
        Initial rate (mol L⁻¹ s⁻¹)
      </text>
      {runs.length === 0 ? (
        <text x={METER_X} y={METER_TOP + 30} fontSize={15} fill="var(--fg-muted)">
          Each Run adds a bar here, on one shared scale.
        </text>
      ) : (
        runs.map((r, i) => (
          <RateMeter
            key={i}
            x={METER_X}
            y={METER_TOP + i * METER_STEP}
            width={METER_W}
            height={18}
            value={r.rate}
            max={scale}
            label={`Run ${i + 1}`}
            valueLabel={formatSig(r.rate, 3)}
            tone="accent"
          />
        ))
      )}
    </svg>
  )
}
