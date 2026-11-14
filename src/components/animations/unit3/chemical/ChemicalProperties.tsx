'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { PeriodicTable, cellRect, type CellStyle } from '@/components/periodic'
import { DIVERGING_NEGATIVE, DIVERGING_POSITIVE, DIVERGING_NEUTRAL, contrastText } from '@/components/periodic/colour-scale'
import { PERIODIC_TABLE, elementByZ, tablePosition, type ElementRecord } from '@/lib/chem/periodic-data'
import { oxideNature, type OxideNature } from '@/lib/chem/periodicity'
import { PERIOD_THREE_OXIDES } from '@/lib/chem/oxide-lab'
import { DIAGONAL_PAIRS, EXTREME_GROUPS, chemicalView, clampChemicalStep } from './chemical-steps'
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
          <g key={oxide.formula} data-oxide={oxide.formula} data-nature={nature} className={styles.column}>
            <rect
              x={cx - CHIP_W / 2}
              y={STRIP.chipY}
              width={CHIP_W}
              height={STRIP.chipH}
              rx={10}
              fill={fill}
            />
            <text x={cx} y={STRIP.chipY + 29} textAnchor="middle" className={styles.chipText} fill={ink}>
              {OXIDE_LABEL[oxide.formula]}
            </text>
            <line
              x1={cx}
              y1={STRIP.chipY + STRIP.chipH}
              x2={cx}
              y2={STRIP.cellY}
              className={styles.connector}
            />
            <rect
              x={cx - CELL_W / 2}
              y={STRIP.cellY}
              width={CELL_W}
              height={STRIP.cellH}
              rx={8}
              className={styles.cell}
            />
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
// Periodic table overlays (Steps 1 and 2)
// ---------------------------------------------------------------------------

/** Hex, not a CSS variable: PeriodicTable reads fills as #rrggbb to pick the text colour. */
const DIAGONAL_FILL = '#D9A441'
const BASIC_GLOW = '#E9A56B'
const HALOGEN_GLOW = '#1B5E7A'

const GROUP_FILL: Record<number, string> = {
  1: BASIC_GLOW,
  17: HALOGEN_GLOW,
}

const DIAGONAL_Z = new Set(DIAGONAL_PAIRS.flat())

/** Arrow between a diagonal pair, bowed upward so it clears the cells between them. */
function diagonalArc(aZ: number, bZ: number): string | null {
  const a = cellRect(aZ, tablePosition)
  const b = cellRect(bZ, tablePosition)
  if (!a || !b) return null
  const midX = (a.cx + b.cx) / 2
  const midY = (a.cy + b.cy) / 2 - 70
  return `M ${a.cx} ${a.cy - 22} Q ${midX} ${midY} ${b.cx} ${b.cy - 22}`
}

const GLOW_ELEMENTS: readonly ElementRecord[] = PERIODIC_TABLE.filter(
  (e) => e.group !== null && EXTREME_GROUPS.includes(e.group)
)

function tableCell(step: number) {
  const view = chemicalView(step)
  return (el: ElementRecord): CellStyle => {
    if (view === 'diagonal') {
      return DIAGONAL_Z.has(el.Z) ? { fill: DIAGONAL_FILL } : { dim: true }
    }
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
      <defs>
        <marker id="chem-arrow-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--fg)" />
        </marker>
      </defs>
      {DIAGONAL_PAIRS.map(([aZ, bZ]) => {
        const d = diagonalArc(aZ, bZ)
        if (!d) return null
        return (
          <path
            key={`${aZ}-${bZ}`}
            data-diag-arrow=""
            d={d}
            pathLength={1}
            className={styles.diagonal}
            markerStart="url(#chem-arrow-head)"
            markerEnd="url(#chem-arrow-head)"
          />
        )
      })}
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
 * basic-to-acidic scale. Step 1 draws the diagonal pairs on the periodic table. Step 2
 * glows the alkali metals and the halogens, the two extremes of reactivity. Views fade
 * with GSAP; reduced motion cuts straight to the target state.
 */
export function ChemicalProperties({ step, reducedMotion }: ChemicalPropertiesProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const current = clampChemicalStep(step)
  const view = chemicalView(current)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return
      const strip = root.querySelector<HTMLElement>('[data-view="oxides"]')
      const table = root.querySelector<HTMLElement>('[data-view="table"]')
      const arrows = root.querySelectorAll<SVGPathElement>('[data-diag-arrow]')
      const glows = root.querySelectorAll<SVGRectElement>('[data-glow]')
      const showTable = view !== 'oxides'
      const showArrows = view === 'diagonal'
      const showGlow = view === 'extremes'

      if (reducedMotion) {
        if (strip) gsap.set(strip, { opacity: showTable ? 0 : 1 })
        if (table) gsap.set(table, { opacity: showTable ? 1 : 0 })
        gsap.set(arrows, { strokeDashoffset: showArrows ? 0 : 1, opacity: showArrows ? 1 : 0 })
        gsap.set(glows, { opacity: showGlow ? 0.35 : 0 })
        return
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.5 } })
      if (strip) tl.to(strip, { opacity: showTable ? 0 : 1, overwrite: true }, 0)
      if (table) tl.to(table, { opacity: showTable ? 1 : 0, overwrite: true }, 0)
      tl.to(
        arrows,
        { strokeDashoffset: showArrows ? 0 : 1, opacity: showArrows ? 1 : 0, stagger: 0.12, duration: 0.6, overwrite: true },
        0.1
      )
      tl.to(
        glows,
        { opacity: showGlow ? 0.35 : 0, stagger: { each: 0.04, from: 'start' }, overwrite: true },
        0.1
      )
    },
    { scope: rootRef, dependencies: [current, reducedMotion] }
  )

  return (
    <div ref={rootRef} className={styles.root} data-view-step={view}>
      <div className={styles.layer} data-view="oxides" aria-hidden={view !== 'oxides'}>
        <OxideStrip />
      </div>
      <div className={styles.layer} data-view="table" aria-hidden={view === 'oxides'}>
        <PeriodicTable
          elements={PERIODIC_TABLE}
          position={tablePosition}
          variant="compact"
          cell={tableCell(current)}
          layer={<TableLayer />}
          title="Periodic table with the highlighted view for this Step"
          className={styles.table}
        />
        <p className={styles.tableCaption}>
          {view === 'diagonal'
            ? 'Diagonal pairs: Li–Mg, Be–Al, B–Si'
            : 'Alkali metals (group 1) and halogens (group 17)'}
        </p>
      </div>
    </div>
  )
}
