'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PeriodicTable, cellRect, type CellStyle } from '@/components/periodic'
import { DIVERGING_NEGATIVE, DIVERGING_POSITIVE, DIVERGING_NEUTRAL, contrastText } from '@/components/periodic/colour-scale'
import { PERIODIC_TABLE, elementByZ, tablePosition, type ElementRecord } from '@/lib/chem/periodic-data'
import { oxideNature, type OxideNature } from '@/lib/chem/periodicity'
import { PERIOD_THREE_OXIDES } from '@/lib/chem/oxide-lab'
import { DIAGONAL_PAIRS, EXTREME_GROUPS, chemicalView, clampChemicalStep, type ChemicalView } from './chemical-steps'
import styles from './ChemicalProperties.module.css'

export interface ChemicalPropertiesProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Period 3 oxide strip (Step 0). SVG viewBox 560 × 330.
// ---------------------------------------------------------------------------

const STRIP = { width: 560, height: 330, colWidth: 80, chipY: 44, chipH: 44, cellY: 118, cellH: 70, scaleY: 250 }
const CHIP_W = 72
const CELL_W = 66

/** Unicode subscripts, so the chip text stays in the UI font. */
const OXIDE_LABEL: Record<string, string> = {
  Na2O: 'Na₂O',
  MgO: 'MgO',
  Al2O3: 'Al₂O₃',
  SiO2: 'SiO₂',
  P4O10: 'P₄O₁₀',
  SO3: 'SO₃',
  Cl2O7: 'Cl₂O₇',
}

/** Oxide character colours on a diverging scale: basic (blue), amphoteric (neutral), acidic (red). */
const NATURE_FILL: Record<OxideNature, string> = {
  basic: DIVERGING_NEGATIVE[2],
  amphoteric: DIVERGING_NEUTRAL,
  acidic: DIVERGING_POSITIVE[2],
  neutral: DIVERGING_NEUTRAL,
}

const NATURE_LABEL: Record<OxideNature, string> = {
  basic: 'basic',
  amphoteric: 'amphoteric',
  acidic: 'acidic',
  neutral: 'neutral',
}

function OxideStrip() {
  const colCentre = (i: number) => STRIP.colWidth / 2 + i * STRIP.colWidth
  return (
    <svg
      className={styles.strip}
      viewBox={`0 0 ${STRIP.width} ${STRIP.height}`}
      role="img"
      aria-label="Period 3 oxides from sodium to chlorine: basic on the left, acidic on the right, amphoteric aluminium oxide in between"
    >
      <defs>
        <linearGradient id="oxide-scale" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={NATURE_FILL.basic} />
          <stop offset="0.5" stopColor={NATURE_FILL.amphoteric} />
          <stop offset="1" stopColor={NATURE_FILL.acidic} />
        </linearGradient>
      </defs>

      <text x={STRIP.colWidth / 2} y={22} className={styles.caption}>
        Typical oxide above each element, period 3
      </text>

      {PERIOD_THREE_OXIDES.map((oxide, i) => {
        const cx = colCentre(i)
        const nature = oxideNature(oxide.formula)
        const fill = NATURE_FILL[nature]
        const ink = contrastText(fill)
        const el = elementByZ(oxide.Z)
        return (
          <g key={oxide.formula} data-oxide={oxide.formula} data-nature={nature}>
            <rect x={cx - CHIP_W / 2} y={STRIP.chipY} width={CHIP_W} height={STRIP.chipH} rx={10} fill={fill} />
            <text x={cx} y={STRIP.chipY + 29} textAnchor="middle" className={styles.chipText} fill={ink}>
              {OXIDE_LABEL[oxide.formula]}
            </text>
            <line x1={cx} y1={STRIP.chipY + STRIP.chipH} x2={cx} y2={STRIP.cellY} className={styles.connector} />
            <rect x={cx - CELL_W / 2} y={STRIP.cellY} width={CELL_W} height={STRIP.cellH} rx={8} className={styles.cell} />
            <text x={cx} y={STRIP.cellY + 36} textAnchor="middle" className={styles.symbol}>
              {el.symbol}
            </text>
            <text x={cx} y={STRIP.cellY + 56} textAnchor="middle" className={styles.atomicNumber}>
              {el.Z}
            </text>
            <text x={cx} y={STRIP.cellY + STRIP.cellH + 22} textAnchor="middle" className={styles.natureLabel}>
              {NATURE_LABEL[nature]}
            </text>
          </g>
        )
      })}

      <rect x={40} y={STRIP.scaleY} width={480} height={12} rx={6} fill="url(#oxide-scale)" />
      <text x={40} y={STRIP.scaleY + 42} className={styles.scaleLabel}>
        basic
      </text>
      <text x={280} y={STRIP.scaleY + 42} textAnchor="middle" className={styles.scaleLabel}>
        amphoteric
      </text>
      <text x={520} y={STRIP.scaleY + 42} textAnchor="end" className={styles.scaleLabel}>
        acidic
      </text>
      <text x={280} y={STRIP.scaleY + 72} textAnchor="middle" className={styles.scaleNote}>
        Na₂O is basic, Al₂O₃ is amphoteric and Cl₂O₇ is acidic (NCERT 3.7.3)
      </text>
      <text x={280} y={STRIP.scaleY + 96} textAnchor="middle" className={styles.scaleNote}>
        Oxide character follows the element&apos;s metallic and non-metallic character
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Diagonal excerpt (Step 1): periods 2 and 3, groups 1, 2, 13 and 14 only.
// The d-block is collapsed into a marked gap, so each pair is a short diagonal.
// ---------------------------------------------------------------------------

const EXCERPT = {
  width: 560,
  height: 330,
  /** Column centres: group 1, group 2, then (after the d-block gap) groups 13 and 14. */
  cols: [110, 205, 360, 455],
  colGroups: [1, 2, 13, 14],
  /** Row centres: period 2 and period 3. */
  rows: [130, 240],
  cell: 70,
  /** Half the cell size plus a margin, so arrows start and end just outside the cells. */
  trim: 42,
  gapX: 282,
}

/** One colour per diagonal pair, from the site's accent family. Hex, for text contrast. */
const PAIR_COLOURS = ['#D9A441', '#2F8F9D', '#C8577A'] as const

/** Cells for the excerpt: [symbol, period, group] in short-form columns. */
const EXCERPT_CELLS: readonly { Z: number; col: number; row: number }[] = [3, 4, 5, 6, 11, 12, 13, 14].map((Z) => {
  const el = elementByZ(Z)
  const group = el.group as number
  const col = EXCERPT.colGroups.indexOf(group)
  return { Z, col, row: el.period - 2 }
})

function excerptCentre(Z: number): { x: number; y: number } {
  const cell = EXCERPT_CELLS.find((c) => c.Z === Z)
  if (!cell) throw new RangeError(`Element ${Z} is not in the diagonal excerpt`)
  return { x: EXCERPT.cols[cell.col], y: EXCERPT.rows[cell.row] }
}

/** Pair index for each Z in the excerpt, or -1 if it is not part of a diagonal pair. */
function pairIndexOf(Z: number): number {
  return DIAGONAL_PAIRS.findIndex((pair) => pair.includes(Z))
}

function DiagonalExcerpt() {
  return (
    <svg
      className={styles.excerpt}
      viewBox={`0 0 ${EXCERPT.width} ${EXCERPT.height}`}
      role="img"
      aria-label="Excerpt of periods 2 and 3, groups 1, 2, 13 and 14. Diagonal pairs: lithium with magnesium, beryllium with aluminium, and boron with silicon."
    >
      <defs>
        {PAIR_COLOURS.map((colour, i) => (
          <marker
            key={colour}
            id={`diag-head-${i}`}
            viewBox="0 0 12 12"
            refX="9"
            refY="6"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 12 6 L 0 12 z" fill={colour} />
          </marker>
        ))}
      </defs>

      {/* Column headings, with the d-block marked as a gap. */}
      {EXCERPT.colGroups.map((group, i) => (
        <text key={group} x={EXCERPT.cols[i]} y={46} textAnchor="middle" className={styles.groupLabel}>
          {`Group ${group}`}
        </text>
      ))}
      <line x1={EXCERPT.gapX} y1={62} x2={EXCERPT.gapX} y2={290} className={styles.dBlockGap} />
      <text x={EXCERPT.gapX} y={306} textAnchor="middle" className={styles.dBlockLabel}>
        d-block not shown
      </text>

      <text x={50} y={46} textAnchor="middle" className={styles.groupLabel}>
        Period
      </text>
      {EXCERPT.rows.map((y, i) => (
        <text key={y} x={50} y={y + 5} textAnchor="middle" className={styles.periodLabel}>
          {String(i + 2)}
        </text>
      ))}

      {EXCERPT_CELLS.map((cell) => {
        const el = elementByZ(cell.Z)
        const pair = pairIndexOf(cell.Z)
        const fill = pair >= 0 ? PAIR_COLOURS[pair] : undefined
        const x = EXCERPT.cols[cell.col]
        const y = EXCERPT.rows[cell.row]
        const ink = fill ? contrastText(fill) : undefined
        return (
          <g key={cell.Z} data-excerpt-z={cell.Z}>
            <rect
              x={x - EXCERPT.cell / 2}
              y={y - EXCERPT.cell / 2}
              width={EXCERPT.cell}
              height={EXCERPT.cell}
              rx={9}
              className={fill ? undefined : styles.excerptCell}
              fill={fill}
              stroke={fill ? 'none' : undefined}
            />
            <text x={x} y={y + 4} textAnchor="middle" className={styles.excerptSymbol} style={ink ? { fill: ink } : undefined}>
              {el.symbol}
            </text>
            <text x={x} y={y + 24} textAnchor="middle" className={styles.excerptZ} style={ink ? { fill: ink } : undefined}>
              {String(el.Z)}
            </text>
          </g>
        )
      })}

      {DIAGONAL_PAIRS.map(([aZ, bZ], i) => {
        const a = excerptCentre(aZ)
        const b = excerptCentre(bZ)
        const dx = b.x - a.x
        const dy = b.y - a.y
        const len = Math.hypot(dx, dy)
        const ux = dx / len
        const uy = dy / len
        const x1 = a.x + ux * EXCERPT.trim
        const y1 = a.y + uy * EXCERPT.trim
        const x2 = b.x - ux * EXCERPT.trim
        const y2 = b.y - uy * EXCERPT.trim
        return (
          <path
            key={`${aZ}-${bZ}`}
            data-diag-arrow=""
            d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`}
            pathLength={1}
            className={styles.diagonal}
            stroke={PAIR_COLOURS[i]}
            markerStart={`url(#diag-head-${i})`}
            markerEnd={`url(#diag-head-${i})`}
          />
        )
      })}

      <text x={EXCERPT.gapX} y={EXCERPT.height - 2} textAnchor="middle" className={styles.excerptNote}>
        Li–Mg, Be–Al and B–Si
      </text>
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Full periodic table overlay (Step 2): the alkali metals and halogens glow.
// ---------------------------------------------------------------------------

const BASIC_GLOW = '#E9A56B'
const HALOGEN_GLOW = '#1B5E7A'

const GROUP_FILL: Record<number, string> = {
  1: BASIC_GLOW,
  17: HALOGEN_GLOW,
}

const GLOW_ELEMENTS: readonly ElementRecord[] = PERIODIC_TABLE.filter(
  (e) => e.group !== null && EXTREME_GROUPS.includes(e.group)
)

function tableCell(view: ChemicalView) {
  return (el: ElementRecord): CellStyle => {
    if (view === 'extremes') {
      const fill = el.group !== null ? GROUP_FILL[el.group] : undefined
      return fill ? { fill } : { dim: true }
    }
    return { dim: true }
  }
}

function TableLayer() {
  return (
    <g>
      {GLOW_ELEMENTS.map((el) => {
        const r = cellRect(el.Z, tablePosition)
        if (!r) return null
        return (
          <rect
            key={el.Z}
            data-glow=""
            x={r.x - 4}
            y={r.y - 4}
            width={r.width + 8}
            height={r.height + 8}
            rx={10}
            className={styles.glow}
            fill={el.group !== null ? GROUP_FILL[el.group] : undefined}
          />
        )
      })}
    </g>
  )
}

// ---------------------------------------------------------------------------
// The Scrolly visual
// ---------------------------------------------------------------------------

/**
 * ChemicalProperties: Step 0 shows the period 3 oxides above their elements, on a
 * basic-to-acidic scale. Step 1 is a focused excerpt of periods 2 and 3 where each
 * diagonal pair gets its own arrow and colour. Step 2 glows the alkali metals and the
 * halogens on the full table. Views fade with GSAP; reduced motion cuts straight to
 * the target state.
 */
export function ChemicalProperties({ step, reducedMotion }: ChemicalPropertiesProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const current = clampChemicalStep(step)
  const view = chemicalView(current)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const layers = {
        oxides: root.querySelector<HTMLElement>('[data-view="oxides"]'),
        diagonal: root.querySelector<HTMLElement>('[data-view="diagonal"]'),
        table: root.querySelector<HTMLElement>('[data-view="table"]'),
      }
      const arrows = root.querySelectorAll<SVGPathElement>('[data-diag-arrow]')
      const glows = root.querySelectorAll<SVGRectElement>('[data-glow]')
      const show = {
        oxides: view === 'oxides' ? 1 : 0,
        diagonal: view === 'diagonal' ? 1 : 0,
        table: view === 'extremes' ? 1 : 0,
      }
      const arrowsOn = view === 'diagonal'
      const glowOn = view === 'extremes'

      if (reducedMotion) {
        if (layers.oxides) gsap.set(layers.oxides, { opacity: show.oxides })
        if (layers.diagonal) gsap.set(layers.diagonal, { opacity: show.diagonal })
        if (layers.table) gsap.set(layers.table, { opacity: show.table })
        gsap.set(arrows, { strokeDashoffset: arrowsOn ? 0 : 1, opacity: arrowsOn ? 1 : 0 })
        gsap.set(glows, { opacity: glowOn ? 0.35 : 0 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } })
      if (layers.oxides) tl.to(layers.oxides, { opacity: show.oxides, overwrite: true }, 0)
      if (layers.diagonal) tl.to(layers.diagonal, { opacity: show.diagonal, overwrite: true }, 0)
      if (layers.table) tl.to(layers.table, { opacity: show.table, overwrite: true }, 0)
      tl.to(
        arrows,
        { strokeDashoffset: arrowsOn ? 0 : 1, opacity: arrowsOn ? 1 : 0, stagger: 0.25, duration: 0.7, overwrite: true },
        0.2
      )
      tl.to(glows, { opacity: glowOn ? 0.35 : 0, stagger: { each: 0.04, from: 'start' }, overwrite: true }, 0.1)
    },
    { scope: rootRef, dependencies: [current, reducedMotion] }
  )

  return (
    <div ref={rootRef} className={styles.root} data-view-step={view}>
      <div className={styles.layer} data-view="oxides" aria-hidden={view !== 'oxides'}>
        <OxideStrip />
      </div>
      <div className={styles.layer} data-view="diagonal" aria-hidden={view !== 'diagonal'}>
        <DiagonalExcerpt />
      </div>
      <div className={styles.layer} data-view="table" aria-hidden={view !== 'extremes'}>
        <PeriodicTable
          elements={PERIODIC_TABLE}
          position={tablePosition}
          variant="compact"
          cell={tableCell(view)}
          layer={<TableLayer />}
          title="Periodic table: alkali metals and halogens highlighted"
          className={styles.table}
        />
        <p className={styles.tableCaption}>Alkali metals (group 1) and halogens (group 17)</p>
      </div>
    </div>
  )
}
