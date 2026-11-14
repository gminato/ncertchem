'use client'

import { useMemo, useState } from 'react'
import { Segmented } from '@/components/controls/Segmented'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { PeriodicFrame } from '@/components/animations/unit3/modern/PeriodicFrame'
import { periodLength } from '@/components/animations/unit3/modern/modern-steps'
import { ElementTile } from '@/components/periodic/ElementTile'
import { displayName } from '@/components/periodic/layout'
import { sequentialScale, SEQUENTIAL_VIRIDIS } from '@/components/periodic/colour-scale'
import type { CellStyle } from '@/components/periodic/PeriodicTable'
import { OrbitalBox, orbitalBoxWidth } from '@/components/vocab/OrbitalBox'
import { PERIODIC_TABLE, elementByZ, tablePosition, type ElementRecord } from '@/lib/chem/periodic-data'
import { placementReasoning } from '@/lib/chem/placement-reasoning'
import { orbitalDiagram } from '@/lib/chem/quantum'
import styles from './table-explorer.module.css'

type Mode = 'blocks' | 'categories' | 'periods'

const MODES: { value: Mode; label: string }[] = [
  { value: 'blocks', label: 'Blocks' },
  { value: 'categories', label: 'Metals and non-metals' },
  { value: 'periods', label: 'Period lengths' },
]

const DEFAULT_Z = 26
const periodScale = sequentialScale([2, 32], SEQUENTIAL_VIRIDIS)

const BLOCK_NAME = { s: 's-block', p: 'p-block', d: 'd-block', f: 'f-block' } as const

/**
 * TableExplorer: the full periodic table with three ways to colour it. Selecting an element
 * opens a panel that explains its period, group and block from its configuration (up to Z = 36),
 * and draws its valence orbitals. The table keeps the keyboard model of PeriodicTable: arrow
 * keys move, and Enter or Space selects.
 */
export function TableExplorer(_props: SimulationProps) {
  const [mode, setMode] = useState<Mode>('blocks')
  const [Z, setZ] = useState(DEFAULT_Z)
  const el = elementByZ(Z)
  const reasoning = useMemo(() => placementReasoning(Z), [Z])
  const orbitals = useMemo(() => (Z <= 36 ? orbitalDiagram(Z) : []), [Z])

  const cell = (rec: ElementRecord): CellStyle => {
    if (mode === 'periods') {
      const len = periodLength(rec.period)
      return { fill: periodScale(len) ?? undefined, value: String(len) }
    }
    return {}
  }

  const summary = `${displayName(el)} (${el.symbol}), Z ${el.Z}: period ${el.period}, group ${el.group ?? 'not in the 18 columns'}, ${BLOCK_NAME[el.block]}.`

  return (
    <div className={styles.explorer}>
      <SimulationControls>
        <Segmented<Mode>
          label="Colour the table by"
          options={MODES}
          value={mode}
          onChange={setMode}
        />
      </SimulationControls>

      <div className={styles.layout}>
        <div className={styles.tableCol}>
          <PeriodicFrame
            elements={PERIODIC_TABLE}
            position={tablePosition}
            cell={cell}
            selected={Z}
            onSelect={(rec) => setZ(rec.Z)}
            blockShading={mode === 'blocks'}
            categoryShading={mode === 'categories'}
            title="Periodic table explorer. Arrow keys move, Enter selects."
          >
            <Legend mode={mode} />
          </PeriodicFrame>
          <p className={styles.summary} role="status" aria-live="polite">
            {summary}
          </p>
        </div>

        <aside className={styles.detail} aria-label={`Details of ${displayName(el)}`}>
          <ElementTile element={el} configuration={reasoning.configuration ?? undefined} />
          <dl className={styles.reasons}>
            <dt>Period {el.period}</dt>
            <dd>{reasoning.periodReason}</dd>
            <dt>{el.group === null ? 'No group' : `Group ${el.group}`}</dt>
            <dd>{reasoning.groupReason}</dd>
            <dt>{BLOCK_NAME[el.block]}</dt>
            <dd>{reasoning.blockReason}</dd>
          </dl>
          {Z <= 36 && reasoning.valenceSubshells.length > 0 ? (
            <Orbitals
              labels={reasoning.valenceSubshells}
              boxes={orbitals}
            />
          ) : (
            <p className={styles.note}>
              Past Z = 36 the configuration is not drawn here. The period, group and block come from the
              periodic data.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function Legend({ mode }: { mode: Mode }) {
  if (mode === 'blocks') {
    return (
      <ul className={styles.legend} aria-label="Block colours">
        <li><span className={styles.swatch} style={{ background: 'var(--block-s)' }} />s-block</li>
        <li><span className={styles.swatch} style={{ background: 'var(--block-p)' }} />p-block</li>
        <li><span className={styles.swatch} style={{ background: 'var(--block-d)' }} />d-block</li>
        <li><span className={styles.swatch} style={{ background: 'var(--block-f)' }} />f-block</li>
      </ul>
    )
  }
  if (mode === 'categories') {
    return (
      <ul className={styles.legend} aria-label="Category colours">
        <li><span className={styles.swatch} style={{ background: 'var(--cat-metal)' }} />Metals</li>
        <li><span className={styles.swatch} style={{ background: 'var(--cat-metalloid)' }} />Metalloids</li>
        <li><span className={styles.swatch} style={{ background: 'var(--cat-nonmetal)' }} />Non-metals</li>
      </ul>
    )
  }
  return (
    <p className={styles.legendText}>
      Each cell shows the length of its period: 2, 8, 8, 18, 18, 32 or 32 elements. Lanthanoids and
      actinoids are counted in periods 6 and 7.
    </p>
  )
}

/** The valence subshells of the element, drawn as box-and-arrow rows. */
function Orbitals({
  labels,
  boxes,
}: {
  labels: readonly string[]
  boxes: ReturnType<typeof orbitalDiagram>
}) {
  const rows = labels
    .map((label) => boxes.find((b) => b.label === label))
    .filter((b): b is NonNullable<typeof b> => b !== undefined)
  const size = 30
  const gap = 5
  const width = Math.max(...rows.map((r) => orbitalBoxWidth(r.orbitals.length, { size, gap })), 120)
  const rowHeight = 46
  return (
    <figure className={styles.orbitals} aria-label={`Valence orbitals: ${labels.join(', ')}`}>
      <svg viewBox={`0 0 ${width + 8} ${rows.length * rowHeight + 8}`} role="img">
        {rows.map((r, i) => (
          <OrbitalBox
            key={r.label}
            orbitals={r.orbitals}
            label={<tspan className="sym">{r.label}</tspan>}
            x={4}
            y={4 + i * rowHeight}
            size={size}
            gap={gap}
            fontSize={15}
          />
        ))}
      </svg>
      <figcaption>Valence orbitals, with each electron drawn as an arrow.</figcaption>
    </figure>
  )
}
